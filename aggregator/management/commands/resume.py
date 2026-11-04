import time

from django.core.management.base import BaseCommand

from aggregator import llm
from aggregator.models import Article


class Command(BaseCommand):
    help = (
        "Génère le résumé (champ `resume`) des articles qui n'en ont pas, avec Gemini.\n"
        "S'arrête proprement quand le quota gratuit est atteint ; relancez plus tard.\n"
        "Pour tester sur UN article : --id <numéro> (ajoutez --dry-run pour ne rien enregistrer)."
    )

    def add_arguments(self, parser):
        parser.add_argument("--max", type=int, default=20,
                            help="Nombre maximum d'articles à traiter (défaut : 20).")
        parser.add_argument("--id", type=int, default=None,
                            help="Ne traite que cet article (même s'il a déjà un résumé : il sera remplacé).")
        parser.add_argument("--dry-run", action="store_true",
                            help="Affiche le résumé sans l'enregistrer en base.")
        parser.add_argument("--pause", type=float, default=None,
                            help="Secondes entre deux appels (défaut : GEMINI_PAUSE ou 6).")
        parser.add_argument("--langue", default=None, help="Langue du résumé (défaut : LANGUE_RESUME ou fr).")

    def selection(self, options):
        if options["id"] is not None:
            return list(Article.objects.filter(pk=options["id"]))
        # On retravaille les resumes encore issus du flux RSS : ce sont eux qui
        # doivent etre reformules par le modele.
        return list(
            Article.objects.visibles()
            .filter(origine_resume="flux")
            .exclude(resume="")
            .order_by("-publie_le")[: options["max"]]
        )

    def handle(self, *args, **options):
        pause = options["pause"] if options["pause"] is not None else llm.pause_conseillee()
        dry_run = options["dry_run"]
        un_seul = options["id"] is not None

        articles = self.selection(options)
        if not articles:
            if un_seul:
                self.stdout.write(self.style.ERROR(f"Aucun article avec l'id {options['id']}."))
            else:
                self.stdout.write("Rien à résumer : tous les articles ont déjà un résumé.")
            return

        self.stdout.write(
            f"{len(articles)} article(s) à résumer avec {llm.modele_gemini()}"
            + (" (essai : rien ne sera enregistré)" if dry_run else "") + "..."
        )
        ok = erreurs = erreurs_de_suite = 0
        for article in articles:
            if un_seul:
                self.stdout.write(f"\nArticle {article.id} : {article.titre}")
                self.stdout.write(f"Texte source : {len(article.resume)} caractères")
                if not article.resume.strip():
                    self.stdout.write(self.style.ERROR("Texte vide : rien à résumer."))
                    return
                if llm.est_court(article.resume):
                    self.stdout.write(self.style.WARNING(
                        f"Contenu court (moins de {llm.SEUIL_COURT} caractères) : il est recopié "
                        "tel quel comme résumé, sans appel à Gemini. Choisissez un article plus long "
                        "pour tester le LLM."
                    ))
            contenu_court = llm.est_court(article.resume)
            try:
                resume = llm.resumer(article.titre, article.resume, options["langue"])
            except (llm.LimiteAtteinte, llm.LLMConfigError) as exc:
                self.stdout.write(self.style.ERROR(f"Arrêt : {exc}"))
                break
            except llm.LLMError as exc:
                erreurs += 1
                erreurs_de_suite += 1
                self.stdout.write(self.style.WARNING(f"  Echec {article.titre[:60]} : {exc}"))
                if erreurs_de_suite >= 3:
                    self.stdout.write(self.style.ERROR("3 erreurs de suite : arrêt."))
                    break
                continue

            erreurs_de_suite = 0
            if un_seul or dry_run:
                self.stdout.write(f"\nRésumé ---\n{resume}\n")
            if resume:
                if not dry_run:
                    article.resume = resume
                    # Un texte deja court est recopie tel quel : il ne vient pas
                    # du modele, on garde donc l'origine "flux".
                    article.origine_resume = "flux" if contenu_court else "agent"
                    article.save(update_fields=["resume", "origine_resume"])
                ok += 1
                if not un_seul:
                    self.stdout.write(f"{article.titre[:70]}")
            if not contenu_court and len(articles) > 1:
                time.sleep(pause)  # respecte les limites par minute du plan gratuit

        fin = "essai terminé, rien enregistré" if dry_run else "terminé"
        self.stdout.write(self.style.SUCCESS(f"{fin.capitalize()} : {ok} résumé(s), {erreurs} erreur(s)."))

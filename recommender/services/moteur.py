"""Moteur de recommandation.

Le principe est le suivant : chaque article candidat recoit une note, on garde
les mieux notes et on explique pourquoi ils sont proposes.

Cinq criteres :
- l'affinite avec les familles suivies
- la proximite semantique avec ces familles, calculee sur le resume
- l'affinite avec les sources suivies
- la recence de l'article
- la qualite de l'article

Le dernier critere sert surtout a departager deux articles proches. La
diversite est traitee a part, dans `_varier`, pour eviter de proposer trois
articles de la meme source d'affilee.
"""

from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from aggregator.models import Article
from recommender.models import (
    EvenementLecture,
    Recommandation,
    SuiviSource,
    SuiviSujet,
    VecteurArticle,
    VecteurSujet,
)
from recommender.services.embeddings import normaliser_similarite, similarite_cosinus

# poids de chaque critere dans le score final
POIDS_SUJET = 0.30
POIDS_SEMANTIQUE = 0.25
POIDS_SOURCE = 0.20
POIDS_RECENCE = 0.15
POIDS_QUALITE = 0.10

NOMBRE_PAR_DEFAUT = 20
SEUIL_AFFICHAGE_SEMANTIQUE = 0.15


class MoteurRecommendation:
    """Calcule et enregistre les recommandations d'un utilisateur."""

    def __init__(self, utilisateur):
        self.utilisateur = utilisateur
        self.sujets = self._sujets_suivis()
        self.sources = self._sources_suivies()
        self.a_lus_recent = self._articles_lus_recents()
        self.vecteurs_sujets = self._vecteurs_sujets()

    def _sujets_suivis(self):
        """Renvoie un dictionnaire sujet -> poids declare par l'utilisateur."""
        return dict(
            SuiviSujet.objects.filter(utilisateur=self.utilisateur).values_list(
                "sujet_id", "poids"
            )
        )

    def _sources_suivies(self):
        """Renvoie un dictionnaire source vers poids declare par l'utilisateur."""
        return dict(
            SuiviSource.objects.filter(utilisateur=self.utilisateur).values_list(
                "source_id", "poids"
            )
        )

    def _articles_lus_recents(self):
        """Set des articles vus dans les sept derniers jours."""
        limite = timezone.now() - timedelta(days=7)
        ids = EvenementLecture.objects.filter(
            utilisateur=self.utilisateur, cree_le__gte=limite
        ).values_list("article_id", flat=True)
        return set(ids)

    def _vecteurs_sujets(self):
        """Vecteurs des familles suivies, avec leur poids."""
        if not self.sujets:
            return {}
        lignes = VecteurSujet.objects.filter(
            sujet_id__in=self.sujets,
            modele=settings.EMBEDDING_MODELE,
            dimension=settings.EMBEDDING_DIMENSION,
        ).select_related("sujet")
        return {
            ligne.sujet_id: {
                "vecteur": ligne.vecteur,
                "nom": ligne.sujet.nom,
                "poids": self.sujets[ligne.sujet_id],
            }
            for ligne in lignes
        }

    def candidats(self, jours=30):
        """Articles visibles et recents sur lesquels on va travailler."""
        limite = timezone.now() - timedelta(days=jours)
        return (
            Article.objects.visibles()
            .filter(publie_le__gte=limite)
            .select_related("source")
            .prefetch_related("sujets")
            .exclude(pk__in=self.a_lus_recent)
        )

    def scorer(self, article, vecteur=None):
        """Calcule le score, les raisons et l'affinite semantique d'un article."""
        score = 0.0
        raisons = []

        # 1. affinite avec les familles suivies
        affinite_sujet = self._affinite_sujet(article)
        score += POIDS_SUJET * affinite_sujet
        nom_sujet = ""
        if affinite_sujet > 0:
            nom_sujet = self._nom_sujet_principal(article)
            raisons.append(
                {
                    "type": "sujet",
                    "texte": f"Parce que vous suivez {nom_sujet}",
                    "valeur": round(affinite_sujet, 2),
                }
            )

        # 2. proximite semantique avec les familles suivies
        if vecteur is None:
            vecteur = (
                VecteurArticle.objects.filter(
                    article=article,
                    modele=settings.EMBEDDING_MODELE,
                    dimension=settings.EMBEDDING_DIMENSION,
                )
                .values_list("vecteur", flat=True)
                .first()
            )
        affinite_semantique, sujet_proche = self._affinite_semantique(vecteur)
        score += POIDS_SEMANTIQUE * affinite_semantique
        if affinite_semantique >= SEUIL_AFFICHAGE_SEMANTIQUE and sujet_proche:
            # Si l'article est deja classe dans la famille, la premiere raison
            # suffit. On n'ajoute pas la meme information deux fois.
            if sujet_proche["nom"] != nom_sujet:
                raisons.append(
                    {
                        "type": "semantique",
                        "texte": f"Proche de votre centre d'interet {sujet_proche['nom']}",
                        "valeur": round(affinite_semantique, 2),
                    }
                )

        # 3. affinite avec les sources suivies
        affinite_source = self.sources.get(article.source_id, 0)
        score += POIDS_SOURCE * affinite_source
        if affinite_source > 0:
            raisons.append(
                {
                    "type": "source",
                    "texte": f"Parce que vous suivez {article.source.nom}",
                    "valeur": round(affinite_source, 2),
                }
            )

        # 4. recence
        recence = self._recence(article)
        score += POIDS_RECENCE * recence
        if recence > 0.7:
            raisons.append(
                {
                    "type": "recence",
                    "texte": "Publie recemment",
                    "valeur": round(recence, 2),
                }
            )

        # 5. qualite de l'article
        qualite = article.note_qualite / 100
        score += POIDS_QUALITE * qualite

        return (
            round(score, 4),
            raisons,
            round(affinite_semantique, 4),
            sujet_proche,
        )

    def _affinite_sujet(self, article):
        """Moyenne des poids des sujets de l'article que l'utilisateur suit."""
        if not self.sujets:
            return 0.0
        ids = article.sujets.values_list("id", flat=True)
        valeurs = [self.sujets[sujet_id] for sujet_id in ids if sujet_id in self.sujets]
        if not valeurs:
            return 0.0
        return min(1.0, sum(valeurs) / len(valeurs))

    def _affinite_semantique(self, vecteur):
        """Meilleure correspondance entre l'article et les familles suivies.

        On garde la famille qui donne le meilleur produit similarite x poids.
        Le resultat est deja ramene entre 0 et 1 par `normaliser_similarite`.
        """
        if not vecteur or not self.vecteurs_sujets:
            return 0.0, None

        meilleur_score = 0.0
        meilleur_sujet = None
        for sujet_id, info in self.vecteurs_sujets.items():
            similarite = similarite_cosinus(vecteur, info["vecteur"])
            valeur = normaliser_similarite(similarite) * info["poids"]
            if valeur > meilleur_score:
                meilleur_score = valeur
                meilleur_sujet = {"id": sujet_id, "nom": info["nom"]}
        return meilleur_score, meilleur_sujet

    def _nom_sujet_principal(self, article):
        """Nom du sujet suivi qui apparait dans l'article."""
        for sujet in article.sujets.all():
            if sujet.id in self.sujets:
                return sujet.nom
        return "vos centres d'interet"

    def _recence(self, article):
        """1 pour un article d'aujourd'hui, 0 pour un article de plus de 7 jours."""
        age_heures = (timezone.now() - article.publie_le).total_seconds() / 3600
        return max(0.0, min(1.0, 1 - age_heures / (24 * 7)))

    def calculer(self, nombre=NOMBRE_PAR_DEFAUT):
        """Renvoie la liste des articles recommandes, tries par score."""
        candidats = list(self.candidats())
        vecteurs = dict(
            VecteurArticle.objects.filter(
                article_id__in=[article.pk for article in candidats],
                modele=settings.EMBEDDING_MODELE,
                dimension=settings.EMBEDDING_DIMENSION,
            ).values_list("article_id", "vecteur")
        )

        resultats = []
        for article in candidats:
            score, raisons, score_semantique, sujet_proche = self.scorer(
                article, vecteurs.get(article.pk)
            )
            if score <= 0.02:
                continue
            resultats.append(
                {
                    "article": article,
                    "score": score,
                    "raisons": raisons,
                    "score_semantique": score_semantique,
                    "sujet_proche": sujet_proche,
                }
            )

        resultats.sort(key=lambda item: item["score"], reverse=True)
        return self._varier(resultats, nombre)

    def _varier(self, resultats, nombre):
        """Evite de proposer trois fois la meme source d'affilee."""
        choisis = []
        compte_par_source = {}
        restants = list(resultats)

        # premier passage : on prend les meilleurs en gardant au plus
        # deux articles par source
        while restants and len(choisis) < nombre:
            for index, item in enumerate(restants):
                source_id = item["article"].source_id
                if compte_par_source.get(source_id, 0) >= 2:
                    continue
                choisis.append(item)
                compte_par_source[source_id] = compte_par_source.get(source_id, 0) + 1
                restants.pop(index)
                break
            else:
                # toutes les sources restantes sont deja representees
                break

        return choisis

    def enregistrer(self, resultats):
        """Enregistre les recommandations en base pour l'historique.

        Deux generations peuvent partir en meme temps, par exemple quand la
        page Pour vous est ouverte dans deux onglets. La contrainte unique
        (utilisateur, article) protege la base, mais `update_or_create` peut
        alors lever une IntegrityError. On reessaie une fois : au second
        passage la ligne existe et la mise a jour aboutit normalement.
        """
        crees = []
        deja_traites = set()
        for item in resultats:
            article = item["article"]
            if article.pk in deja_traites:
                continue
            deja_traites.add(article.pk)

            sujet_proche = item.get("sujet_proche") or {}
            valeurs = {
                "score": item["score"],
                "score_semantique": item.get("score_semantique", 0),
                "sujet_proche_id": sujet_proche.get("id"),
                "raisons": item["raisons"],
            }

            recommandation = self._enregistrer_une(article, valeurs)
            crees.append(recommandation)
        return crees

    def _enregistrer_une(self, article, valeurs):
        """Cree ou met a jour une recommandation en tolerant la concurrence."""
        for tentative in range(2):
            try:
                with transaction.atomic():
                    recommandation, _ = Recommandation.objects.update_or_create(
                        utilisateur=self.utilisateur,
                        article=article,
                        defaults=valeurs,
                    )
                return recommandation
            except IntegrityError:
                if tentative == 1:
                    raise
                # La ligne vient d'etre creee par une autre requete : on la relit.
                continue
        raise IntegrityError("Impossible d'enregistrer la recommandation.")

    def generer(self, nombre=NOMBRE_PAR_DEFAUT, enregistrer=True):
        """Point d'entree utilise par les vues et les commandes."""
        resultats = self.calculer(nombre)
        if enregistrer:
            self.enregistrer(resultats)
        return resultats


def recommander_pour(utilisateur, nombre=NOMBRE_PAR_DEFAUT):
    """Fonction courte utilisee ailleurs dans le projet."""
    return MoteurRecommendation(utilisateur).generer(nombre)

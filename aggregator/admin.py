"""Admin de l'app aggregator.

C'est ici que l'administrateur ajoute les nouvelles sources avec tous les
details du flux, et qu'il surveille les collectes.
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import Article, Auteur, Etiquette, JournalCollecte, Source, Sujet


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ["nom", "site_officiel", "langue", "fiabilite", "est_active", "nombre_articles"]
    list_filter = ["est_active", "est_verifiee", "langue", "pays"]
    search_fields = ["nom", "url_flux", "site_officiel"]
    ordering = ["-fiabilite", "nom"]
    list_editable = ["est_active", "fiabilite"]

    fieldsets = (
        ("Identite", {"fields": ("nom", "identifiant", "description")}),
        ("Flux", {"fields": ("site_officiel", "url_flux", "logo", "favicon")}),
        ("Localisation", {"fields": ("langue", "pays")}),
        ("Reglages", {"fields": ("fiabilite", "est_active", "est_verifiee", "intervalle_collecte_minutes")}),
        ("Suivi", {"fields": ("derniere_collecte", "dernier_succes", "derniere_erreur", "nombre_articles")}),
    )

    actions = ["activer", "desactiver", "lancer_collecte"]

    @admin.action(description="Activer les sources selectionnees")
    def activer(self, request, queryset):
        queryset.update(est_active=True)

    @admin.action(description="Desactiver les sources selectionnees")
    def desactiver(self, request, queryset):
        queryset.update(est_active=False)

    @admin.action(description="Lancer la collecte maintenant")
    def lancer_collecte(self, request, queryset):
        from aggregator.services import fetcher

        for source in queryset:
            fetcher.collecter(source)


@admin.register(Sujet)
class SujetAdmin(admin.ModelAdmin):
    list_display = ["nom", "couleur", "parent", "ordre", "est_actif"]
    list_filter = ["est_actif", "parent"]
    search_fields = ["nom", "mots_cles"]
    prepopulated_fields = {"identifiant": ("nom",)}
    ordering = ["ordre", "nom"]


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = [
        "titre_tronque",
        "source",
        "image",
        "publie_le",
        "note_qualite",
        "est_visible",
        "a_la_une",
    ]
    list_filter = ["source", "sujets", "est_visible", "a_la_une", "langue", "origine_resume"]
    search_fields = ["titre", "resume", "lien"]
    date_hierarchy = "publie_le"
    ordering = ["-publie_le"]
    filter_horizontal = ["sujets", "auteurs", "etiquettes"]
    readonly_fields = ["identifiant", "collecte_le", "modifie_le", "nombre_clics"]
    list_editable = ["est_visible", "a_la_une"]

    @admin.display(description="Titre")
    def titre_tronque(self, obj):
        return obj.titre[:70] + ("..." if len(obj.titre) > 70 else "")

    @admin.display(description="Image")
    def image(self, obj):
        if not obj.image_couverture:
            return "-"
        return format_html('<img src="{}" style="height:40px" />', obj.image_couverture)


@admin.register(Auteur)
class AuteurAdmin(admin.ModelAdmin):
    list_display = ["nom", "source", "page_profil"]
    list_filter = ["source"]
    search_fields = ["nom"]


@admin.register(Etiquette)
class EtiquetteAdmin(admin.ModelAdmin):
    list_display = ["nom"]
    search_fields = ["nom"]


@admin.register(JournalCollecte)
class JournalCollecteAdmin(admin.ModelAdmin):
    list_display = ["source", "etat", "articles_trouves", "articles_crees", "debut_le", "duree_secondes"]
    list_filter = ["etat", "source"]
    readonly_fields = [champ.name for champ in JournalCollecte._meta.fields]
    ordering = ["-debut_le"]

    def has_add_permission(self, request):
        # les journaux sont crees par la collecte, pas a la main
        return False

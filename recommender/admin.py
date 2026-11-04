"""Admin de l'app recommender."""

from django.contrib import admin

from .models import (
    AbonnementCanal,
    EvenementLecture,
    MotCle,
    Recommandation,
    ResumeQuotidien,
    SuiviSource,
    SuiviSujet,
)


@admin.register(SuiviSujet)
class SuiviSujetAdmin(admin.ModelAdmin):
    list_display = ["utilisateur", "sujet", "poids", "cree_le"]
    list_filter = ["sujet"]
    search_fields = ["utilisateur__username"]


@admin.register(SuiviSource)
class SuiviSourceAdmin(admin.ModelAdmin):
    list_display = ["utilisateur", "source", "poids", "cree_le"]
    list_filter = ["source"]
    search_fields = ["utilisateur__username"]


@admin.register(MotCle)
class MotCleAdmin(admin.ModelAdmin):
    list_display = ["utilisateur", "mot", "identifiant"]
    search_fields = ["utilisateur__username", "mot"]


@admin.register(EvenementLecture)
class EvenementLectureAdmin(admin.ModelAdmin):
    list_display = ["utilisateur", "article", "action", "duree_secondes", "cree_le"]
    list_filter = ["action"]
    date_hierarchy = "cree_le"
    search_fields = ["utilisateur__username", "article__titre"]


@admin.register(Recommandation)
class RecommandationAdmin(admin.ModelAdmin):
    list_display = ["utilisateur", "article", "score", "est_cliquee", "cree_le"]
    list_filter = ["est_cliquee"]
    search_fields = ["utilisateur__username", "article__titre"]


@admin.register(AbonnementCanal)
class AbonnementCanalAdmin(admin.ModelAdmin):
    list_display = ["utilisateur", "canal", "destinataire", "est_actif", "dernier_envoi"]
    list_filter = ["canal", "est_actif"]
    search_fields = ["utilisateur__username", "destinataire"]


@admin.register(ResumeQuotidien)
class ResumeQuotidienAdmin(admin.ModelAdmin):
    list_display = ["utilisateur", "jour", "canal", "etat", "nombre_articles", "envoye_le"]
    list_filter = ["etat", "canal"]
    date_hierarchy = "jour"
    readonly_fields = ["nombre_articles"]

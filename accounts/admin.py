"""Admin de l'app accounts."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CompteReseau, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Page d'administration des comptes VEILLIA."""

    list_display = ["username", "email", "nom_affiche", "pays", "is_staff", "cree_le"]
    list_filter = ["is_staff", "is_active", "recevoir_newsletter", "pays"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering = ["-cree_le"]

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Informations VEILLIA",
            {"fields": ("photo_profil", "presentation", "fonction", "entreprise", "pays", "site_web")},
        ),
        ("Preferences", {"fields": ("langue", "recevoir_newsletter")}),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Informations VEILLIA", {"fields": ("email",)}),
    )


@admin.register(CompteReseau)
class CompteReseauAdmin(admin.ModelAdmin):
    list_display = ["utilisateur", "reseau", "pseudo_reseau", "lien_profil", "cree_le"]
    list_filter = ["reseau"]
    search_fields = ["utilisateur__username", "pseudo_reseau"]

"""Filtres de l'app aggregator pour le moteur de recherche de la plateforme."""

from datetime import timedelta

import django_filters
from django.db.models import Q
from django.utils import timezone

from .models import Article


class ArticleFiltre(django_filters.FilterSet):
    """Filtres de la barre de recherche et des pages de sujets."""

    sujet = django_filters.CharFilter(field_name="sujets__identifiant")
    source = django_filters.CharFilter(field_name="source__identifiant")
    auteur = django_filters.CharFilter(field_name="auteurs__nom")
    etiquette = django_filters.CharFilter(field_name="etiquettes__nom")
    mot = django_filters.CharFilter(method="filtrer_mot")
    search = django_filters.CharFilter(method="filtrer_mot")
    # fenetre de temps en heures : /api/articles/?depuis=24
    depuis = django_filters.NumberFilter(method="filtrer_depuis")
    # plage de dates
    date_debut = django_filters.DateFilter(field_name="publie_le", lookup_expr="gte")
    date_fin = django_filters.DateFilter(field_name="publie_le", lookup_expr="lte")

    class Meta:
        model = Article
        fields = ["est_visible", "a_la_une"]

    def filtrer_mot(self, queryset, nom, valeur):
        """Recherche simple sur le titre et le resume."""
        if not valeur:
            return queryset
        return queryset.filter(Q(titre__icontains=valeur) | Q(resume__icontains=valeur))

    def filtrer_depuis(self, queryset, nom, valeur):
        """Ne garde que les articles publies dans les dernieres heures."""
        if not valeur:
            return queryset
        limite = timezone.now() - timedelta(hours=float(valeur))
        return queryset.filter(publie_le__gte=limite)

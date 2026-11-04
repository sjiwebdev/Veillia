"""Pagination utilisee par toute l'api.

Par defaut on renvoie 20 elements par page, mais le front peut demander
une autre taille avec le parametre ?taille=50.
"""

from rest_framework.pagination import PageNumberPagination


class PaginationVeillia(PageNumberPagination):
    page_size = 20
    page_size_query_param = "taille"
    max_page_size = 100

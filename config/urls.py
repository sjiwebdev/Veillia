"""Urls du projet VEILLIA."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from aggregator import views as vues_aggregator

urlpatterns = [
    path("admin/", admin.site.urls),
    # api
    path("api/", include("accounts.urls")),
    path("api/", include("aggregator.urls")),
    path("api/", include("recommender.urls")),
    # documentation de l'api
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    # referencement : ces urls sont a la racine du site, pas sous /api
    path("robots.txt", vues_aggregator.robots_txt, name="robots"),
    path("sitemap.xml", vues_aggregator.sitemap_contenu, name="sitemap"),
    path("sitemap-news.xml", vues_aggregator.sitemap_actualites, name="sitemap-news"),
    path("html-simple", vues_aggregator.page_sans_javascript, name="html-simple"),
    path("flux/", vues_aggregator.flux_atom, name="flux-atom"),
    path("membre/<str:username>/", vues_aggregator.page_profil_public, name="profil-public-html"),
]

# En developpement, Django sert les photos de profil televersees.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

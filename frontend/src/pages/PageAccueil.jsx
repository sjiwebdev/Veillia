import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useRecommandations } from '@/hooks/useRecommandations'
import {
  HelpCircle,
  ArrowRight,
  Clock,
  Sparkles,
  Users,
} from '@/components/ui/Icons'
import { articles, panorama } from '@/services/api'

export default function PageAccueil() {
  const navigate = useNavigate()
  const { utilisateur } = useAuth()
  const [articlesUne, setArticlesUne] = useState([])
  const [articlesDuJour, setArticlesDuJour] = useState([])
  const [stats, setStats] = useState(null)
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState(null)
  const {
    elements: recommandationsListe,
    marquerClic,
  } = useRecommandations({
    nombre: 6,
    autoGenerer: Boolean(utilisateur),
    actif: Boolean(utilisateur),
  })

  const suggestions = recommandationsListe
    .map((element) => element.article)
    .filter(Boolean)
  const afficherRecommandations = Boolean(utilisateur) && suggestions.length > 0
  const elementsParArticle = new Map(
    recommandationsListe
      .filter((element) => element.article)
      .map((element) => [element.article.identifiant, element])
  )
  const listeDroite = afficherRecommandations
    ? suggestions.slice(0, 6)
    : articlesDuJour.slice(0, 6)

  const formaterDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    })
  }

  // Chargement indépendant de chaque donnée : si l'une échoue, les autres s'affichent quand même
  useEffect(() => {
    let monte = true

    const charger = async () => {
      try {
        // Articles a la une
        try {
          const resUne = await articles.une()
          const dataUne = resUne.data || []
          const articlesUne = Array.isArray(dataUne)
            ? dataUne
            : (dataUne.results || [])
          if (monte) setArticlesUne(articlesUne)
        } catch (e) {
          console.warn("Échec chargement 'à la une':", e)
        }

        // Articles du jour (avec fallback backend si vide)
        try {
          const resDuJour = await articles.duJour()
          const dataDuJour = resDuJour.data || []
          // Gere la reponse paginee { results: [...], count: N } ou un tableau simple
          const articlesDuJour = Array.isArray(dataDuJour)
            ? dataDuJour
            : (dataDuJour.results || [])
          if (monte) setArticlesDuJour(articlesDuJour)
        } catch (e) {
          console.warn("Échec chargement 'du jour':", e)
        }

        // Statistiques publiques
        try {
          const resStats = await panorama.stats()
          if (monte) setStats(resStats.data || {})
        } catch (e) {
          console.warn("Échec chargement stats:", e)
        }

        if (monte) setCharge(false)
      } catch (e) {
        if (monte) {
          setErreur(e.message || 'Erreur de chargement')
          setCharge(false)
        }
      }
    }

    charger()
    return () => { monte = false }
  }, [])

  const gererClic = (article) => {
    navigate(`/article/${article.identifiant}`)
  }

  // Etat de chargement initial
  if (charge) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-6">
              <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
            <div className="lg:w-1/3 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Etat d'erreur globale
  if (erreur && articlesUne.length === 0 && articlesDuJour.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <HelpCircle size={6} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Impossible de charger l'accueil
          </h2>
          <p className="text-slate-600 mb-6">{erreur}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Actualiser la page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* En-tête avec stats publiques */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
            <span>{stats?.nombre_articles ?? 0} articles</span>
            <span>{stats?.nombre_sources ?? 0} sources</span>
            <span>{stats?.nombre_sujets ?? 0} familles</span>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">

          {/* Colonne principale : À la une */}
          <div className="min-w-0 space-y-6 lg:flex-1">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">À la une</h2>
              <Link
                to="/articles/du-jour"
                className="inline-flex shrink-0 items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                Voir tout <ArrowRight size={3} />
              </Link>
            </div>

            {/* Grand article en vedette - plein largeur */}
            {articlesUne.length > 0 && (
              <article className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                <div className="relative h-72 md:h-96">
                  {articlesUne[0].image_couverture ? (
                    <img
                      src={articlesUne[0].image_couverture}
                      alt=""
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                      <Users size={24} className="text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <span className="absolute top-3 left-3 badge bg-blue-600 border-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
                    a la une
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      {articlesUne[0].source?.logo ? (
                        <img
                          src={articlesUne[0].source.logo}
                          alt={articlesUne[0].source.nom}
                          className="h-5 w-5 rounded bg-white/90"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-white/90 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                          {(articlesUne[0].source?.nom || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-white/90 backdrop-blur">
                        {articlesUne[0].source?.nom || 'Source'}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3 shadow-black/30 shadow-sm">
                      {articlesUne[0].titre}
                    </h1>
                    <p className="text-lg text-white/90 backdrop-blur line-clamp-2 shadow-black/20 shadow-sm">
                      {articlesUne[0].resume || 'Découvrez cet article à la une.'}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-sm text-white/80">
                      <div className="flex items-center gap-1">
                        <Clock size={3} className="text-white/70" />
                        <span>{formaterDate(articlesUne[0].publie_le)}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-white/20 backdrop-blur">
                        {articlesUne[0].duree_lecture} min
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => gererClic(articlesUne[0])}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Ouvrir l'article"
                  />
                </div>
              </article>
            )}

            {/* Liste des autres articles à la une */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {articlesUne.slice(1, 5).map((article) => (
                <div
                  key={article.identifiant}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:shadow-md"
                  onClick={() => gererClic(article)}
                >
                  <div className="relative h-40 overflow-hidden">
                    {article.image_couverture ? (
                      <img
                        src={article.image_couverture}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                        <Users size={16} className="text-slate-400" />
                      </div>
                    )}
                    {article.a_la_une && (
                      <span className="absolute top-1 left-1 badge bg-blue-600 border-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                        a la une
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {article.source?.logo ? (
                        <img
                          src={article.source.logo}
                          alt={article.source.nom}
                          className="h-4 w-4 rounded bg-white/90"
                        />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[9px] font-bold">
                          {(article.source?.nom || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-600 truncate">
                        {article.source?.nom || 'Source'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.titre}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                      <Clock size={2} className="text-slate-400" />
                      <span>{formaterDate(article.publie_le)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {articlesUne.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-16 text-center">
                <p className="text-sm text-slate-500">
                  Aucun article a la une pour le moment. Revenez bientot.
                </p>
              </div>
            )}
          </div>

          {/* Colonne droite : Recommandations personnalisées */}
          <div className="min-w-0 space-y-6 lg:w-80 lg:shrink-0 xl:w-96">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                {afficherRecommandations ? 'Pour vous' : 'Derniers articles'}
              </h2>
              <Link
                to={afficherRecommandations ? '/pour-vous' : '/articles/du-jour'}
                className="inline-flex shrink-0 items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                Voir tout <ArrowRight size={3} />
              </Link>
            </div>

            {afficherRecommandations && (
              <p className="-mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Sparkles size={13} className="text-violet-500" />
                Sélectionnés selon vos centres d'intérêt.
              </p>
            )}

            {listeDroite.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">
                  {utilisateur
                    ? 'Aucune recommandation pour le moment.'
                    : 'Aucun article pour le moment.'}
                </p>
                {utilisateur && (
                  <Link
                    to="/sujets"
                    className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
                  >
                    Choisir des familles
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {listeDroite.map((article) => (
                  <div
                    key={article.identifiant}
                    className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50 hover:shadow-sm"
                    onClick={() => {
                      const element = elementsParArticle.get(article.identifiant)
                      if (element) marquerClic(element)
                      gererClic(article)
                    }}
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-24">
                      {article.image_couverture ? (
                        <img
                          src={article.image_couverture}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Users size={10} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="mb-1 flex min-w-0 items-center gap-2">
                        {article.source?.logo ? (
                          <img
                            src={article.source.logo}
                            alt={article.source.nom}
                            className="h-3 w-3 rounded bg-white/90"
                          />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[9px] font-bold">
                            {(article.source?.nom || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[10px] font-medium text-slate-500 truncate">
                          {article.source?.nom || 'Source'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.titre}
                      </h3>
                      <div className="mt-1 flex min-w-0 items-center justify-between gap-2 text-[10px] text-slate-400">
                        {article.auteurs?.[0] ? (
                          <span className="min-w-0 truncate text-blue-600">
                            {article.auteurs[0].nom}
                          </span>
                        ) : (
                          <span className="min-w-0 truncate">VEILLIA</span>
                        )}
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formaterDate(article.publie_le)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

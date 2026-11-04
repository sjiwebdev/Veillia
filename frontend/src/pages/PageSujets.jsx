import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ListeRecommandations } from '@/components/ListeRecommandations'
import { useAuth } from '@/context/AuthContext'
import { useRecommandations } from '@/hooks/useRecommandations'
import { sujets, extraireListe } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'
import { AlertCircle, ArrowRight, Search, Sparkles, Target } from '@/components/ui/Icons'

function couleurSujet(sujet) {
  return /^#[0-9a-f]{6}$/i.test(sujet?.couleur || '') ? sujet.couleur : '#2563eb'
}

export default function PageSujets() {
  const { utilisateur } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [recherche, setRecherche] = useState(searchParams.get('search') || '')
  const [listeSujets, setListeSujets] = useState([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const {
    elements: recommandationsListe,
    chargement: chargementSuggestions,
    erreur: erreurRecommandations,
    marquerClic,
  } = useRecommandations({ nombre: 6, autoGenerer: true, actif: Boolean(utilisateur) })

  useEffect(() => {
    let monte = true
    sujets
      .liste()
      .then((res) => {
        if (monte) setListeSujets(extraireListe(res.data))
      })
      .catch((erreurChargement) => {
        if (monte) {
          setErreur(
            extraireMessageErreur(erreurChargement, 'Impossible de charger les familles.')
          )
        }
      })
      .finally(() => {
        if (monte) setCharge(false)
      })
    return () => {
      monte = false
    }
  }, [])

  useEffect(() => {
    const texte = recherche.trim()
    const parametres = new URLSearchParams(searchParams)
    if (texte) parametres.set('search', texte)
    else parametres.delete('search')
    setSearchParams(parametres, { replace: true })
    // On ne veut pas relancer le chargement des familles a chaque frappe :
    // le filtrage se fait en memoire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche])

  const listeFiltree = useMemo(() => {
    const texte = recherche.trim().toLowerCase()
    if (!texte) return listeSujets
    return listeSujets.filter(
      (sujet) =>
        sujet.nom.toLowerCase().includes(texte) ||
        (sujet.description || '').toLowerCase().includes(texte)
    )
  }, [listeSujets, recherche])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Explorer
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Familles de sujets</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Explorez les grandes familles de la data science et de l'intelligence artificielle,
            puis suivez celles qui vous interessent.
          </p>
        </div>

        <div className="mb-6 max-w-xl">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              className="input-field pl-10"
              placeholder="Rechercher une famille de sujets..."
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {listeFiltree.length} famille{listeFiltree.length > 1 ? 's' : ''}
            {recherche.trim() ? ` pour « ${recherche.trim()} »` : ' disponible' + (listeFiltree.length > 1 ? 's' : '')}
          </p>
        </div>

        {erreur && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{erreur}</span>
          </div>
        )}

        {utilisateur && (chargementSuggestions || recommandationsListe.length > 0) && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Sparkles size={17} className="text-violet-500" /> Suggestions pour vous
                </h2>
                <p className="text-xs text-slate-500">
                  Quelques articles choisis selon les familles que vous suivez déjà.
                </p>
              </div>
              <Link
                to="/pour-vous"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
              >
                Tout voir <ArrowRight size={15} />
              </Link>
            </div>
            <ListeRecommandations
              elements={recommandationsListe}
              chargement={chargementSuggestions}
              erreur={erreurRecommandations}
              nombre={4}
              variante="compacte"
              onClic={marquerClic}
              className="sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0"
              masquerVide
            />
          </section>
        )}

        {charge ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cle) => (
              <div key={cle} className="h-32 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : listeFiltree.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Target size={36} className="mx-auto mb-3 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Aucune famille trouvée</h2>
            <p className="mt-1 text-sm text-slate-500">
              Essayez un autre mot cle ou parcourez toutes les familles.
            </p>
            <button type="button" onClick={() => setRecherche('')} className="btn-outline mt-4">
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {listeFiltree.map((sujet) => (
              <Link
                key={sujet.identifiant}
                to={`/sujet/${sujet.identifiant}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm"
              >
                <span
                  className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: couleurSujet(sujet) }}
                >
                  {sujet.nom.charAt(0).toUpperCase()}
                </span>
                <span className="line-clamp-1 text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-600">
                  {sujet.nom}
                </span>
                <span className="text-[10px] text-slate-400">
                  {sujet.nombre_articles ?? 0} article
                  {(sujet.nombre_articles ?? 0) > 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

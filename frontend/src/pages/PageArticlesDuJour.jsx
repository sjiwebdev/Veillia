import { useCallback, useEffect, useRef, useState } from 'react'
import { ArticleCard } from '@/components/ArticleCard'
import { Navbar } from '@/components/Navbar'
import { BasculeAffichage } from '@/components/ui/BasculeAffichage'
import { FiltreAvance } from '@/components/ui/FiltreAvance'
import { AlertCircle, Loader2, Newspaper, RefreshCw } from '@/components/ui/Icons'
import { useAffichage } from '@/hooks/useAffichage'
import { articles, sujets, sources, extraireListe } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'

const TAILLE_PAGE = 20

export default function PageArticlesDuJour() {
  const [liste, setListe] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [charge, setCharge] = useState(true)
  const [chargePlus, setChargePlus] = useState(false)
  const [erreur, setErreur] = useState('')

  const [requete, setRequete] = useState('')
  const [sujetSelectionne, setSujetSelectionne] = useState('')
  const [sourceSelectionnee, setSourceSelectionnee] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [tri, setTri] = useState('recents')
  const [listeSujets, setListeSujets] = useState([])
  const [listeSources, setListeSources] = useState([])
  const [affichage, setAffichage] = useAffichage()

  const sentinelle = useRef(null)
  const numeroRequete = useRef(0)

  useEffect(() => {
    let monte = true
    Promise.allSettled([sujets.liste(), sources.liste()]).then(
      ([resultatSujets, resultatSources]) => {
        if (!monte) return
        if (resultatSujets.status === 'fulfilled') {
          setListeSujets(extraireListe(resultatSujets.value.data))
        }
        if (resultatSources.status === 'fulfilled') {
          setListeSources(extraireListe(resultatSources.value.data))
        }
      }
    )
    return () => {
      monte = false
    }
  }, [])

  const chargerArticles = useCallback(
    async (pageDemandee = 1, ajouter = false) => {
      const identifiantRequete = numeroRequete.current + 1
      numeroRequete.current = identifiantRequete

      if (ajouter) setChargePlus(true)
      else setCharge(true)
      setErreur('')

      const parametres = { page: pageDemandee, taille: TAILLE_PAGE }
      if (requete.trim()) parametres.search = requete.trim()
      if (sujetSelectionne) parametres.sujet = sujetSelectionne
      if (sourceSelectionnee) parametres.source = sourceSelectionnee
      if (dateDebut) parametres.date_debut = dateDebut
      if (dateFin) parametres.date_fin = dateFin
      if (tri) parametres.tri = tri

      try {
        const res = await articles.duJour(parametres)
        if (identifiantRequete !== numeroRequete.current) return

        const nouveaux = extraireListe(res.data)
        setListe((actuel) => (ajouter ? [...actuel, ...nouveaux] : nouveaux))
        setTotal(res.data?.count ?? nouveaux.length)
        setPage(pageDemandee)
      } catch (erreurChargement) {
        if (identifiantRequete !== numeroRequete.current) return
        setErreur(
          extraireMessageErreur(erreurChargement, 'Impossible de charger les articles.')
        )
      } finally {
        if (identifiantRequete === numeroRequete.current) {
          setCharge(false)
          setChargePlus(false)
        }
      }
    },
    [requete, sujetSelectionne, sourceSelectionnee, dateDebut, dateFin, tri]
  )

  // Recherche differee : on laisse la saisie se stabiliser.
  useEffect(() => {
    const minuterie = setTimeout(() => chargerArticles(1, false), 350)
    return () => clearTimeout(minuterie)
  }, [chargerArticles])

  // Chargement infini.
  useEffect(() => {
    if (charge || chargePlus) return
    if (liste.length >= total) return
    const element = sentinelle.current
    if (!element) return

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees[0].isIntersecting) chargerArticles(page + 1, true)
      },
      { rootMargin: '240px' }
    )
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [charge, chargePlus, liste.length, total, page, chargerArticles])

  const reinitialiserFiltres = () => {
    setRequete('')
    setSujetSelectionne('')
    setSourceSelectionnee('')
    setDateDebut('')
    setDateFin('')
    setTri('recents')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Le fil
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Articles du jour</h1>
            <p className="mt-1 text-sm text-slate-500">
              {charge && liste.length === 0
                ? 'Chargement des articles...'
                : `${total} article${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}, du plus récent au plus ancien.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <BasculeAffichage valeur={affichage} onChange={setAffichage} />
            <button
              type="button"
              onClick={() => chargerArticles(1, false)}
              disabled={charge}
              className="btn-outline"
            >
              <RefreshCw size={16} className={`mr-2 ${charge ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        <FiltreAvance
          requete={requete}
          onRequeteChange={setRequete}
          sujetSelectionne={sujetSelectionne}
          onSujetChange={setSujetSelectionne}
          sourceSelectionnee={sourceSelectionnee}
          onSourceChange={setSourceSelectionnee}
          dateDebut={dateDebut}
          onDateDebutChange={setDateDebut}
          dateFin={dateFin}
          onDateFinChange={setDateFin}
          tri={tri}
          onTriChange={setTri}
          onReinitialiser={reinitialiserFiltres}
          listeSujets={listeSujets}
          listeSources={listeSources}
        />

        {erreur && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{erreur}</span>
          </div>
        )}

        {charge && liste.length === 0 ? (
          affichage === 'grille' ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((cle) => (
                <div key={cle} className="h-72 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((cle) => (
                <div key={cle} className="h-28 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          )
        ) : liste.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Newspaper size={36} className="mx-auto mb-3 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Aucun article trouvé</h2>
            <p className="mt-1 text-sm text-slate-500">
              Aucun article ne correspond a vos criteres. Modifiez les filtres ou revenez plus
              tard.
            </p>
            <button type="button" onClick={reinitialiserFiltres} className="btn-primary mt-5">
              Reinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            {affichage === 'grille' ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {liste.map((article) => (
                  <ArticleCard key={article.identifiant} article={article} variante="grande" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {liste.map((article) => (
                  <ArticleCard key={article.identifiant} article={article} variante="ligne" />
                ))}
              </div>
            )}

            <div ref={sentinelle} className="flex justify-center py-8">
              {chargePlus ? (
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                  Chargement d'autres articles...
                </span>
              ) : liste.length < total ? (
                <button
                  type="button"
                  onClick={() => chargerArticles(page + 1, true)}
                  className="btn-outline"
                >
                  Charger plus d'articles ({liste.length}/{total})
                </button>
              ) : (
                <span className="text-xs text-slate-400">
                  Vous avez atteint la fin des articles disponibles.
                </span>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

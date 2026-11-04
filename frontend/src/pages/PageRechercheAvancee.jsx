import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArticleCard } from '@/components/ArticleCard'
import { Navbar } from '@/components/Navbar'
import { BasculeAffichage } from '@/components/ui/BasculeAffichage'
import { FiltreAvance } from '@/components/ui/FiltreAvance'
import { AlertCircle, Loader2, Search } from '@/components/ui/Icons'
import { useAffichage } from '@/hooks/useAffichage'
import { articles, sujets, sources, extraireListe } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'

const TAILLE_PAGE = 24

const ORDRE_TRI = {
  recents: '-publie_le',
  plus_anciens: 'publie_le',
  qualite: '-note_qualite',
  popularite: '-nombre_clics',
}

export default function PageRechercheAvancee() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [requete, setRequete] = useState(searchParams.get('q') || '')
  const [sujetSelectionne, setSujetSelectionne] = useState(searchParams.get('sujet') || '')
  const [sourceSelectionnee, setSourceSelectionnee] = useState(searchParams.get('source') || '')
  const [dateDebut, setDateDebut] = useState(searchParams.get('date_debut') || '')
  const [dateFin, setDateFin] = useState(searchParams.get('date_fin') || '')
  const [tri, setTri] = useState(searchParams.get('tri') || 'recents')

  const [listeArticles, setListeArticles] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [charge, setCharge] = useState(true)
  const [chargePlus, setChargePlus] = useState(false)
  const [erreur, setErreur] = useState('')
  const [affichage, setAffichage] = useAffichage()

  const [listeSujets, setListeSujets] = useState([])
  const [listeSources, setListeSources] = useState([])

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

  const chargerResultats = useCallback(
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
      if (ORDRE_TRI[tri]) parametres.ordering = ORDRE_TRI[tri]

      const parametresUrl = new URLSearchParams()
      if (requete.trim()) parametresUrl.set('q', requete.trim())
      if (sujetSelectionne) parametresUrl.set('sujet', sujetSelectionne)
      if (sourceSelectionnee) parametresUrl.set('source', sourceSelectionnee)
      if (dateDebut) parametresUrl.set('date_debut', dateDebut)
      if (dateFin) parametresUrl.set('date_fin', dateFin)
      if (tri) parametresUrl.set('tri', tri)
      setSearchParams(parametresUrl, { replace: true })

      try {
        const res = await articles.liste(parametres)
        // Une requete plus recente a pris le dessus : on ignore celle-ci.
        if (identifiantRequete !== numeroRequete.current) return

        const resultats = extraireListe(res.data)
        setListeArticles((actuel) => (ajouter ? [...actuel, ...resultats] : resultats))
        setTotal(res.data?.count ?? resultats.length)
        setPage(pageDemandee)
      } catch (erreurChargement) {
        if (identifiantRequete !== numeroRequete.current) return
        setErreur(
          extraireMessageErreur(erreurChargement, 'La recherche a échoué. Réessayez.')
        )
      } finally {
        if (identifiantRequete === numeroRequete.current) {
          setCharge(false)
          setChargePlus(false)
        }
      }
    },
    [
      requete,
      sujetSelectionne,
      sourceSelectionnee,
      dateDebut,
      dateFin,
      tri,
      setSearchParams,
    ]
  )

  // La barre de recherche de la navbar peut changer ?q= sans demonter la page.
  useEffect(() => {
    const requeteUrl = searchParams.get('q') || ''
    setRequete((actuelle) => (actuelle === requeteUrl ? actuelle : requeteUrl))
  }, [searchParams])

  // Recherche differee : on attend que la saisie se stabilise.
  useEffect(() => {
    const minuterie = setTimeout(() => chargerResultats(1, false), 350)
    return () => clearTimeout(minuterie)
  }, [chargerResultats])

  // Chargement infini : on precharge avant d'atteindre le bas de page.
  useEffect(() => {
    if (charge || chargePlus) return
    if (listeArticles.length >= total) return
    const element = sentinelle.current
    if (!element) return

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees[0].isIntersecting) chargerResultats(page + 1, true)
      },
      { rootMargin: '240px' }
    )
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [charge, chargePlus, listeArticles.length, total, page, chargerResultats])

  const reinitialiserFiltres = () => {
    setRequete('')
    setSujetSelectionne('')
    setSourceSelectionnee('')
    setDateDebut('')
    setDateFin('')
    setTri('recents')
  }

  const rechercheActive = Boolean(
    requete.trim() || sujetSelectionne || sourceSelectionnee || dateDebut || dateFin
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Explorer
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Recherche avancée</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Croisez mots cles, familles, sources et plages de dates pour retrouver un article
            precis dans toute la base VEILLIA.
          </p>
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

        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {charge && listeArticles.length === 0
                ? 'Recherche en cours...'
                : `${total} résultat${total > 1 ? 's' : ''}`}
            </p>
            <p className="text-xs text-slate-500">
              {rechercheActive
                ? 'Articles correspondant à vos critères, du plus récent au plus ancien.'
                : 'Tous les articles disponibles dans la base VEILLIA.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">Affichage :</span>
            <BasculeAffichage valeur={affichage} onChange={setAffichage} />
          </div>
        </div>

        {erreur && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{erreur}</span>
          </div>
        )}

        {charge && listeArticles.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              Chargement des articles...
            </div>
          </div>
        ) : listeArticles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Search size={36} className="mx-auto mb-3 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Aucun article trouvé</h2>
            <p className="mt-1 text-sm text-slate-500">
              Essayez de modifier vos mots cles ou vos filtres de recherche.
            </p>
            <button type="button" onClick={reinitialiserFiltres} className="btn-primary mt-5">
              Reinitialiser la recherche
            </button>
          </div>
        ) : (
          <>
            {affichage === 'grille' ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listeArticles.map((article) => (
                  <ArticleCard key={article.identifiant} article={article} variante="grande" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {listeArticles.map((article) => (
                  <ArticleCard key={article.identifiant} article={article} variante="ligne" />
                ))}
              </div>
            )}

            <div ref={sentinelle} className="flex justify-center py-8">
              {chargePlus ? (
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                  Chargement des articles suivants...
                </span>
              ) : listeArticles.length < total ? (
                <button
                  type="button"
                  onClick={() => chargerResultats(page + 1, true)}
                  className="btn-outline"
                >
                  Charger plus d'articles ({listeArticles.length}/{total})
                </button>
              ) : (
                <span className="text-xs text-slate-400">
                  Vous avez atteint la fin des resultats.
                </span>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

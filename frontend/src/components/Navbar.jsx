import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { sujets, extraireListe } from '@/services/api'
import {
  ArrowRight,
  Bell,
  ChevronLeft,
  Grid,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
} from '@/components/ui/Icons'

const LIENS_FIXES = [
  { label: 'Accueil', to: '/' },
  { label: 'Pour vous', to: '/pour-vous' },
  { label: 'Suivis', to: '/suivis' },
  { label: 'Tous les articles', to: '/articles/du-jour' },
]

export function Navbar() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [categories, setCategories] = useState([])
  const [peutDefilerGauche, setPeutDefilerGauche] = useState(false)
  const [peutDefilerDroite, setPeutDefilerDroite] = useState(false)
  const barreCategories = useRef(null)
  const { estConnecte, utilisateur, deconnexion } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let monte = true
    sujets
      .avecArticles()
      .then((res) => {
        if (monte) setCategories(extraireListe(res.data).slice(0, 10))
      })
      .catch(() => {
        if (monte) setCategories([])
      })
    return () => {
      monte = false
    }
  }, [])

  useEffect(() => {
    setMenuOuvert(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const barre = barreCategories.current
    if (!barre) return undefined

    const mettreAJourFleches = () => {
      setPeutDefilerGauche(barre.scrollLeft > 4)
      setPeutDefilerDroite(barre.scrollLeft + barre.clientWidth < barre.scrollWidth - 4)
    }

    mettreAJourFleches()
    barre.addEventListener('scroll', mettreAJourFleches, { passive: true })
    const observateur = new ResizeObserver(mettreAJourFleches)
    observateur.observe(barre)

    return () => {
      barre.removeEventListener('scroll', mettreAJourFleches)
      observateur.disconnect()
    }
  }, [categories])

  const estActif = (to) => {
    const [chemin, requete] = to.split('?')
    if (location.pathname !== chemin) return false
    if (!requete) return true
    return new URLSearchParams(location.search).toString() === new URLSearchParams(requete).toString()
  }

  const gererRecherche = (evenement) => {
    evenement.preventDefault()
    const texte = recherche.trim()
    if (!texte) return
    navigate(`/recherche?q=${encodeURIComponent(texte)}`)
    setMenuOuvert(false)
  }

  const defiler = (direction) => {
    const barre = barreCategories.current
    if (barre) barre.scrollBy({ left: direction * 320, behavior: 'smooth' })
  }

  const liensNavigation = [
    ...LIENS_FIXES,
    ...categories.map((sujet) => ({
      label: sujet.nom,
      to: `/sujet/${sujet.identifiant}`,
    })),
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOuvert(true)}
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>

            <Link to="/" className="flex shrink-0 items-center" aria-label="Accueil VEILLIA">
              <Logo taille="normal" />
            </Link>

            <form onSubmit={gererRecherche} className="mx-auto hidden w-full max-w-2xl lg:block">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={recherche}
                  onChange={(evenement) => setRecherche(evenement.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-12 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Rechercher des sujets, des lieux et des sources"
                  aria-label="Rechercher"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  aria-label="Lancer la recherche"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1.5">
              {estConnecte ? (
                <>
                  <Link
                    to="/tableau-de-bord"
                    className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 xl:inline-flex"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    to="/notifications"
                    className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                  </Link>
                  <Link
                    to="/parametres"
                    className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
                    aria-label="Paramètres"
                  >
                    <Settings size={20} />
                  </Link>
                  <Link
                    to="/tableau-de-bord"
                    className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-1 transition-colors hover:bg-slate-50 sm:pr-3"
                    title={utilisateur?.nom_affiche || utilisateur?.username}
                  >
                    <Avatar utilisateur={utilisateur} taille="sm" />
                    <span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 sm:block">
                      {utilisateur?.nom_affiche || utilisateur?.username}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={deconnexion}
                    className="rounded-full p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Déconnexion"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/connexion"
                    className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:inline-flex"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/inscription"
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="relative border-t border-slate-100">
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/80 to-transparent transition-opacity duration-200 ${
                peutDefilerGauche ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity duration-200 ${
                peutDefilerDroite ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <button
              type="button"
              onClick={() => defiler(-1)}
              className={`absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-1.5 text-slate-500 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white hover:text-slate-900 lg:block ${
                peutDefilerGauche ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-label="Défiler les catégories vers la gauche"
              aria-hidden={!peutDefilerGauche}
              tabIndex={peutDefilerGauche ? 0 : -1}
            >
              <ChevronLeft size={18} />
            </button>

            <nav
              ref={barreCategories}
              id="nav-categories"
              className="scrollbar-hide flex items-center gap-1 overflow-x-auto overscroll-x-contain scroll-smooth py-2"
              aria-label="Categories"
            >
              {liensNavigation.map((lien) => {
                const actif = estActif(lien.to)
                return (
                  <Link
                    key={`${lien.to}-${lien.label}`}
                    to={lien.to}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      actif
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {lien.label}
                  </Link>
                )
              })}
            </nav>

            <button
              type="button"
              onClick={() => defiler(1)}
              className={`absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-1.5 text-slate-500 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white hover:text-slate-900 lg:block ${
                peutDefilerDroite ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-label="Défiler les catégories vers la droite"
              aria-hidden={!peutDefilerDroite}
              tabIndex={peutDefilerDroite ? 0 : -1}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </header>

      {menuOuvert && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMenuOuvert(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <Link to="/" onClick={() => setMenuOuvert(false)}>
                <Logo taille="petit" />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOuvert(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Fermer le menu"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            <div className="border-b border-slate-200 p-4">
              <form onSubmit={gererRecherche} className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={recherche}
                  onChange={(evenement) => setRecherche(evenement.target.value)}
                  className="input-field pl-9"
                  placeholder="Rechercher..."
                  aria-label="Rechercher"
                />
              </form>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Navigation
              </p>
              <div className="space-y-0.5">
                {liensNavigation.map((lien) => (
                  <Link
                    key={`mobile-${lien.to}-${lien.label}`}
                    to={lien.to}
                    onClick={() => setMenuOuvert(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      estActif(lien.to)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Grid size={16} className="text-slate-400" />
                    {lien.label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Mon compte
                </p>
                {estConnecte ? (
                  <div className="space-y-0.5">
                    <Link
                      to="/tableau-de-bord"
                      onClick={() => setMenuOuvert(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <User size={16} className="text-slate-400" /> Tableau de bord
                    </Link>
                    <Link
                      to="/parametres"
                      onClick={() => setMenuOuvert(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Settings size={16} className="text-slate-400" /> Paramètres
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setMenuOuvert(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Bell size={16} className="text-slate-400" /> Notifications
                    </Link>
                    <button
                      type="button"
                      onClick={deconnexion}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} className="text-red-500" /> Déconnexion
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 px-3">
                    <Link
                      to="/connexion"
                      onClick={() => setMenuOuvert(false)}
                      className="btn-outline w-full"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/inscription"
                      onClick={() => setMenuOuvert(false)}
                      className="btn-primary w-full"
                    >
                      Creer un compte
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2 px-3 text-xs text-slate-400">
                <HelpCircle size={14} /> Besoin d'aide ? Consultez la recherche avancée.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function BoutonRetour({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
    >
      <ChevronLeft size={16} /> Retour
    </button>
  )
}

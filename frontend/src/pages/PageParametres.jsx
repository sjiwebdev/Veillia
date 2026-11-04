import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ListeRecommandations } from '@/components/ListeRecommandations'
import { useAuth } from '@/context/AuthContext'
import { useRecommandations } from '@/hooks/useRecommandations'
import { auth, sujets, extraireListe } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'
import { WidgetProfil } from '@/components/ui/WidgetProfil'
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Code,
  Flag,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Trash2,
  User,
  X,
} from '@/components/ui/Icons'

const FORMULAIRE_VIDE = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  presentation: '',
  fonction: '',
  entreprise: '',
  pays: '',
  site_web: '',
  langue: 'fr',
  recevoir_newsletter: false,
}

const ONGLETS = [
  {
    id: 'profil',
    label: 'Profil',
    description: 'Identité et présentation',
    Icone: User,
  },
  {
    id: 'centres-interet',
    label: "Centres d'intérêt",
    description: 'Familles suivies et intensité',
    Icone: Target,
  },
  {
    id: 'securite',
    label: 'Sécurité',
    description: 'Mot de passe et session',
    Icone: Shield,
  },
]

const VUES_INTERETS = [
  { valeur: 'toutes', label: 'Toutes' },
  { valeur: 'suivies', label: 'Suivies' },
  { valeur: 'decouvrir', label: 'À découvrir' },
]

const RESEAUX_SOCIAUX = [
  {
    id: 'github',
    label: 'GitHub',
    icone: Code,
    exemple: 'votre-pseudo-github',
    lien: 'https://github.com/votre-pseudo',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icone: Briefcase,
    exemple: 'prenom-nom',
    lien: 'https://www.linkedin.com/in/votre-pseudo',
  },
]

function depuisProfil(profil) {
  return {
    username: profil?.username || '',
    first_name: profil?.first_name || '',
    last_name: profil?.last_name || '',
    email: profil?.email || '',
    presentation: profil?.presentation || '',
    fonction: profil?.fonction || '',
    entreprise: profil?.entreprise || '',
    pays: profil?.pays || '',
    site_web: profil?.site_web || '',
    langue: profil?.langue || 'fr',
    recevoir_newsletter: Boolean(profil?.recevoir_newsletter),
  }
}

function ongletDepuisHash(hash) {
  const valeur = String(hash || '').replace('#', '')
  return ONGLETS.some((onglet) => onglet.id === valeur) ? valeur : 'profil'
}

function compteReseauVide(reseau) {
  return { id: null, reseau, pseudo_reseau: '', lien_profil: '', photo_profil: '' }
}

function depuisComptesReseaux(liste) {
  const comptes = {
    github: compteReseauVide('github'),
    linkedin: compteReseauVide('linkedin'),
  }
  for (const compte of Array.isArray(liste) ? liste : []) {
    if (comptes[compte.reseau]) {
      comptes[compte.reseau] = { ...comptes[compte.reseau], ...compte }
    }
  }
  return comptes
}

function dateInscription(valeur) {
  if (!valeur) return null
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function Alerte({ message, className = '' }) {
  if (!message) return null
  const succes = message.type === 'succes'
  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
        succes
          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
          : 'border-red-100 bg-red-50 text-red-700'
      } ${className}`}
    >
      {succes ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
      ) : (
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
      )}
      <span>{message.texte}</span>
    </div>
  )
}

function Champ({ label, icone: Icone, children, aide, pour }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={pour} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {Icone && (
          <Icone
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        {children}
      </div>
      {aide && <p className="text-xs text-slate-400">{aide}</p>}
    </div>
  )
}

export default function PageParametres() {
  const { utilisateur, mettreAJourUtilisateur, deconnexion } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [onglet, setOnglet] = useState(() => ongletDepuisHash(location.hash))
  const [profil, setProfil] = useState(null)
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE)
  const [charge, setCharge] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)
  const [messageProfil, setMessageProfil] = useState(null)

  const [reseaux, setReseaux] = useState(() => depuisComptesReseaux([]))
  const [reseauEnCours, setReseauEnCours] = useState('')
  const [messageReseaux, setMessageReseaux] = useState(null)

  const [sujetsDisponibles, setSujetsDisponibles] = useState([])
  const [suivis, setSuivis] = useState([])
  const [chargeInterets, setChargeInterets] = useState(true)
  const [filtreInterets, setFiltreInterets] = useState('')
  const [vueInterets, setVueInterets] = useState('toutes')
  const [actionSujet, setActionSujet] = useState('')
  const [messageInterets, setMessageInterets] = useState(null)
  const minuteriesPoids = useRef(new Map())
  const {
    elements: recommandationsListe,
    chargement: chargementRecommandations,
    generation: generationRecommandations,
    erreur: erreurRecommandations,
    generer: genererRecommandations,
    marquerClic,
  } = useRecommandations({ nombre: 8 })

  const [securite, setSecurite] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmation: '',
  })
  const [sauvegardeMotDePasse, setSauvegardeMotDePasse] = useState(false)
  const [messageSecurite, setMessageSecurite] = useState(null)

  useEffect(() => {
    setOnglet(ongletDepuisHash(location.hash))
  }, [location.hash])

  const appliquerProfil = useCallback(
    (donnees) => {
      setProfil(donnees)
      setFormulaire(depuisProfil(donnees))
      mettreAJourUtilisateur(donnees)
    },
    [mettreAJourUtilisateur]
  )

  const majPhotoProfil = useCallback(
    (donnees) => {
      setProfil((actuel) => ({ ...(actuel || {}), ...donnees }))
      mettreAJourUtilisateur(donnees)
    },
    [mettreAJourUtilisateur]
  )

  useEffect(() => {
    let monte = true
    const charger = async () => {
      try {
        const resProfil = await auth.profil()
        if (!monte) return
        appliquerProfil(resProfil.data)

        const [resSujets, resSuivis, resReseaux] = await Promise.allSettled([
          sujets.liste(),
          sujets.mesSuivis(),
          auth.comptesReseaux(),
        ])
        if (!monte) return

        if (resSujets.status === 'fulfilled') {
          setSujetsDisponibles(extraireListe(resSujets.value.data))
        }
        if (resSuivis.status === 'fulfilled') {
          setSuivis(extraireListe(resSuivis.value.data))
        }
        if (resReseaux.status === 'fulfilled') {
          setReseaux(depuisComptesReseaux(extraireListe(resReseaux.value.data)))
        }
      } catch (erreur) {
        if (monte) {
          setErreurChargement(
            extraireMessageErreur(erreur, 'Impossible de charger votre profil.')
          )
        }
      } finally {
        if (monte) {
          setCharge(false)
          setChargeInterets(false)
        }
      }
    }
    charger()
    return () => {
      monte = false
    }
  }, [appliquerProfil])

  useEffect(() => {
    const minuteries = minuteriesPoids.current
    return () => {
      for (const minuterie of minuteries.values()) {
        window.clearTimeout(minuterie)
      }
      minuteries.clear()
    }
  }, [])

  const profilAffiche = profil || utilisateur || {}
  const inscription = dateInscription(profilAffiche.cree_le)

  const gererChangement = (champ) => (evenement) => {
    const valeur =
      evenement.target.type === 'checkbox'
        ? evenement.target.checked
        : evenement.target.value
    setFormulaire((actuel) => ({ ...actuel, [champ]: valeur }))
    if (messageProfil) setMessageProfil(null)
  }

  const changerOnglet = (id) => {
    setOnglet(id)
    navigate(
      { pathname: location.pathname, search: location.search, hash: `#${id}` },
      { replace: true }
    )
  }

  const enregistrerProfil = async (evenement) => {
    evenement.preventDefault()
    if (sauvegarde) return

    setSauvegarde(true)
    setMessageProfil(null)

    try {
      const res = await auth.mettreAJourProfil({
        username: formulaire.username.trim(),
        first_name: formulaire.first_name.trim(),
        last_name: formulaire.last_name.trim(),
        email: formulaire.email.trim(),
        presentation: formulaire.presentation.trim(),
        fonction: formulaire.fonction.trim(),
        entreprise: formulaire.entreprise.trim(),
        pays: formulaire.pays.trim(),
        site_web: formulaire.site_web.trim(),
        langue: formulaire.langue,
        recevoir_newsletter: formulaire.recevoir_newsletter,
      })
      appliquerProfil(res.data)
      setMessageProfil({
        type: 'succes',
        texte: 'Votre profil a bien été mis à jour.',
      })
    } catch (erreur) {
      setMessageProfil({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'La mise à jour du profil a échoué.'),
      })
    } finally {
      setSauvegarde(false)
    }
  }

  const modifierReseau = (reseau, champ, valeur) => {
    setReseaux((actuel) => ({
      ...actuel,
      [reseau]: {
        ...(actuel[reseau] || compteReseauVide(reseau)),
        [champ]: valeur,
      },
    }))
    if (messageReseaux) setMessageReseaux(null)
  }

  const enregistrerReseau = async (reseau) => {
    if (reseauEnCours) return
    const configuration = RESEAUX_SOCIAUX.find((element) => element.id === reseau)
    const compte = reseaux[reseau] || compteReseauVide(reseau)
    const pseudo = (compte.pseudo_reseau || '').trim()

    if (!pseudo) {
      setMessageReseaux({
        type: 'erreur',
        texte: `Indiquez votre pseudo ${configuration?.label || ''} avant d'enregistrer.`,
      })
      return
    }

    setReseauEnCours(reseau)
    setMessageReseaux(null)
    try {
      const donnees = {
        reseau,
        pseudo_reseau: pseudo,
        lien_profil: (compte.lien_profil || '').trim(),
      }
      const res = compte.id
        ? await auth.modifierCompteReseau(compte.id, donnees)
        : await auth.ajouterCompteReseau(donnees)
      setReseaux((actuel) => ({
        ...actuel,
        [reseau]: { ...compteReseauVide(reseau), ...res.data, reseau },
      }))
      setMessageReseaux({
        type: 'succes',
        texte: `Votre compte ${configuration?.label || reseau} est enregistré.`,
      })
    } catch (erreur) {
      setMessageReseaux({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, "Impossible d'enregistrer ce compte."),
      })
    } finally {
      setReseauEnCours('')
    }
  }

  const supprimerReseau = async (reseau) => {
    if (reseauEnCours) return
    const compte = reseaux[reseau]
    if (!compte?.id) return
    if (!window.confirm('Retirer ce compte de votre profil ?')) return

    setReseauEnCours(reseau)
    setMessageReseaux(null)
    try {
      await auth.supprimerCompteReseau(compte.id)
      setReseaux((actuel) => ({
        ...actuel,
        [reseau]: compteReseauVide(reseau),
      }))
      setMessageReseaux({ type: 'succes', texte: 'Le compte a été retiré.' })
    } catch (erreur) {
      setMessageReseaux({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'Impossible de retirer ce compte.'),
      })
    } finally {
      setReseauEnCours('')
    }
  }

  const suivisParSujet = useMemo(() => {
    const index = new Map()
    for (const suivi of suivis) index.set(suivi.sujet, suivi)
    return index
  }, [suivis])

  const sujetsAffiches = useMemo(() => {
    const texte = filtreInterets.trim().toLowerCase()
    return sujetsDisponibles.filter((sujet) => {
      const estSuivi = suivisParSujet.has(sujet.id)
      if (vueInterets === 'suivies' && !estSuivi) return false
      if (vueInterets === 'decouvrir' && estSuivi) return false
      if (!texte) return true
      return `${sujet.nom} ${sujet.description || ''}`.toLowerCase().includes(texte)
    })
  }, [sujetsDisponibles, suivisParSujet, filtreInterets, vueInterets])

  const suivreSujet = async (sujet) => {
    if (actionSujet) return
    setActionSujet(`suivre-${sujet.id}`)
    setMessageInterets(null)
    try {
      const res = await sujets.suivre({ sujet: sujet.id, poids: 0.7 })
      setSuivis((actuel) => [
        ...actuel.filter((element) => element.sujet !== sujet.id),
        res.data,
      ])
      setMessageInterets({
        type: 'succes',
        texte: `Vous suivez maintenant ${sujet.nom}.`,
      })
      genererRecommandations({ silencieux: true })
    } catch (erreur) {
      setMessageInterets({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'Impossible de suivre cette famille.'),
      })
    } finally {
      setActionSujet('')
    }
  }

  const retirerSujet = async (sujet) => {
    if (actionSujet) return
    const suivi = suivisParSujet.get(sujet.id)
    if (!suivi) return

    const minuterie = minuteriesPoids.current.get(suivi.id)
    if (minuterie) {
      window.clearTimeout(minuterie)
      minuteriesPoids.current.delete(suivi.id)
    }

    setActionSujet(`retirer-${sujet.id}`)
    setMessageInterets(null)
    try {
      await sujets.arreterSuivi(suivi.id)
      setSuivis((actuel) => actuel.filter((element) => element.id !== suivi.id))
      setMessageInterets({
        type: 'succes',
        texte: `Vous ne suivez plus ${sujet.nom}.`,
      })
      genererRecommandations({ silencieux: true })
    } catch (erreur) {
      setMessageInterets({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'Impossible de retirer cette famille.'),
      })
    } finally {
      setActionSujet('')
    }
  }

  const changerPoids = (suivi, valeur) => {
    const poids = Number(valeur)
    setSuivis((actuel) =>
      actuel.map((element) =>
        element.id === suivi.id ? { ...element, poids } : element
      )
    )
    setMessageInterets(null)

    const ancienne = minuteriesPoids.current.get(suivi.id)
    if (ancienne) window.clearTimeout(ancienne)

    const minuterie = window.setTimeout(async () => {
      minuteriesPoids.current.delete(suivi.id)
      try {
        await sujets.modifierSuivi(suivi.id, { poids })
        genererRecommandations({ silencieux: true })
      } catch (erreur) {
        setMessageInterets({
          type: 'erreur',
          texte: extraireMessageErreur(
            erreur,
            "Le niveau d'intérêt n'a pas pu être enregistré."
          ),
        })
      }
    }, 700)
    minuteriesPoids.current.set(suivi.id, minuterie)
  }

  const changerMotDePasse = async (evenement) => {
    evenement.preventDefault()
    if (sauvegardeMotDePasse) return

    setMessageSecurite(null)

    if (securite.nouveau_mot_de_passe.length < 8) {
      setMessageSecurite({
        type: 'erreur',
        texte: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
      })
      return
    }
    if (securite.nouveau_mot_de_passe !== securite.confirmation) {
      setMessageSecurite({
        type: 'erreur',
        texte: 'Les deux nouveaux mots de passe ne sont pas identiques.',
      })
      return
    }

    setSauvegardeMotDePasse(true)
    try {
      await auth.changerMotDePasse({
        ancien_mot_de_passe: securite.ancien_mot_de_passe,
        nouveau_mot_de_passe: securite.nouveau_mot_de_passe,
      })
      setSecurite({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmation: '',
      })
      setMessageSecurite({
        type: 'succes',
        texte: 'Votre mot de passe a été modifié.',
      })
    } catch (erreur) {
      setMessageSecurite({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'Le changement de mot de passe a échoué.'),
      })
    } finally {
      setSauvegardeMotDePasse(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Mon compte
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Paramètres</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Completez votre profil, choisissez vos centres d'intérêt et protegez
              votre compte.
            </p>
          </div>
          <Link
            to={`/profil/${profilAffiche.username || ''}`}
            className="btn-outline shrink-0"
          >
            Voir mon profil public
          </Link>
        </div>

        <Alerte message={erreurChargement && { type: 'erreur', texte: erreurChargement }} className="mb-6" />

        <div className="grid items-start gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
          <div className="space-y-4">
            <WidgetProfil profil={profilAffiche} onMiseAJour={majPhotoProfil} />

            <nav
              className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
              role="tablist"
              aria-label="Sections des paramètres"
            >
              {ONGLETS.map(({ id, label, description, Icone }) => {
                const actif = onglet === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={actif}
                    onClick={() => changerOnglet(id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      actif ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        actif
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icone size={16} className={actif ? 'text-white' : 'text-slate-500'} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-semibold ${
                          actif ? 'text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">
                        {description}
                      </span>
                    </span>
                    {actif && <ChevronRight size={16} className="shrink-0 text-blue-500" />}
                  </button>
                )
              })}
            </nav>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles size={14} className="shrink-0 text-violet-500" />
                <span>Votre profil alimente vos recommandations personnalisées.</span>
              </div>
              <Link
                to="/tableau-de-bord"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ouvrir mon tableau de bord <ChevronRight size={15} />
              </Link>
              {inscription && (
                <p className="mt-2 text-[11px] text-slate-400">Membre depuis {inscription}</p>
              )}
            </div>
          </div>

          <div className="min-w-0">
            {onglet === 'profil' && (
              <div className="space-y-6" role="tabpanel" aria-label="Profil">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Informations personnelles
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Ces informations composent votre profil public.
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      Public
                    </span>
                  </div>

                  <Alerte message={messageProfil} className="mb-5" />

                  {charge ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((cle) => (
                        <div key={cle} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      ))}
                    </div>
                  ) : (
                    <form onSubmit={enregistrerProfil} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Champ
                          label="Pseudo"
                          icone={User}
                          pour="profil-pseudo"
                          aide="Il apparaît dans l'adresse de votre profil public."
                        >
                          <input
                            id="profil-pseudo"
                            type="text"
                            className="input-field pl-10"
                            value={formulaire.username}
                            onChange={gererChangement('username')}
                            placeholder="votre-pseudo"
                            minLength={3}
                            required
                          />
                        </Champ>
                        <Champ label="Email" icone={Mail} pour="profil-email">
                          <input
                            id="profil-email"
                            type="email"
                            className="input-field pl-10"
                            value={formulaire.email}
                            onChange={gererChangement('email')}
                            placeholder="vous@exemple.com"
                            required
                          />
                        </Champ>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Champ label="Prénom" pour="profil-prenom">
                          <input
                            id="profil-prenom"
                            type="text"
                            className="input-field"
                            value={formulaire.first_name}
                            onChange={gererChangement('first_name')}
                            placeholder="Votre prénom"
                          />
                        </Champ>
                        <Champ label="Nom" pour="profil-nom">
                          <input
                            id="profil-nom"
                            type="text"
                            className="input-field"
                            value={formulaire.last_name}
                            onChange={gererChangement('last_name')}
                            placeholder="Votre nom"
                          />
                        </Champ>
                      </div>

                      <Champ
                        label="Présentation"
                        pour="profil-presentation"
                        aide="Quelques lignes pour présenter votre parcours et vos intérêts."
                      >
                        <textarea
                          id="profil-presentation"
                          rows="4"
                          maxLength={500}
                          className="input-field resize-y"
                          value={formulaire.presentation}
                          onChange={gererChangement('presentation')}
                          placeholder="Parlez de votre parcours, de vos centres d'intérêt..."
                        />
                        <p className="mt-1 text-right text-xs text-slate-400">
                          {formulaire.presentation.length}/500
                        </p>
                      </Champ>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Champ label="Fonction" icone={User} pour="profil-fonction">
                          <input
                            id="profil-fonction"
                            type="text"
                            className="input-field pl-10"
                            value={formulaire.fonction}
                            onChange={gererChangement('fonction')}
                            placeholder="Data Scientist"
                          />
                        </Champ>
                        <Champ
                          label="Entreprise"
                          icone={Building2}
                          pour="profil-entreprise"
                        >
                          <input
                            id="profil-entreprise"
                            type="text"
                            className="input-field pl-10"
                            value={formulaire.entreprise}
                            onChange={gererChangement('entreprise')}
                            placeholder="Votre entreprise"
                          />
                        </Champ>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Champ label="Pays" icone={Flag} pour="profil-pays">
                          <input
                            id="profil-pays"
                            type="text"
                            className="input-field pl-10"
                            value={formulaire.pays}
                            onChange={gererChangement('pays')}
                            placeholder="Côte d'Ivoire"
                          />
                        </Champ>
                        <Champ label="Site web" icone={Globe} pour="profil-site">
                          <input
                            id="profil-site"
                            type="url"
                            className="input-field pl-10"
                            value={formulaire.site_web}
                            onChange={gererChangement('site_web')}
                            placeholder="https://mon-site.com"
                          />
                        </Champ>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Champ label="Langue" pour="profil-langue">
                          <select
                            id="profil-langue"
                            className="input-field"
                            value={formulaire.langue}
                            onChange={gererChangement('langue')}
                          >
                            <option value="fr">Français</option>
                            <option value="en">Anglais</option>
                          </select>
                        </Champ>
                        <div className="flex items-end">
                          <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={formulaire.recevoir_newsletter}
                              onChange={gererChangement('recevoir_newsletter')}
                            />
                            Recevoir la newsletter
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col justify-end gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                        <button
                          type="submit"
                          disabled={sauvegarde}
                          className="btn-primary w-full sm:w-auto"
                        >
                          {sauvegarde ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />{' '}
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="mr-2" /> Enregistrer les
                              modifications
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Globe size={18} className="text-violet-600" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Reseaux sociaux
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Reliez vos comptes pour completer votre identite numerique.
                      </p>
                    </div>
                  </div>

                  <Alerte message={messageReseaux} className="mb-4" />

                  <div className="grid gap-4 sm:grid-cols-2">
                    {RESEAUX_SOCIAUX.map(({ id, label, icone: Icone, exemple, lien }) => {
                      const compte = reseaux[id] || compteReseauVide(id)
                      const enCours = reseauEnCours === id
                      return (
                        <div
                          key={id}
                          className={`rounded-xl border p-4 ${
                            compte.id
                              ? 'border-blue-100 bg-blue-50/40'
                              : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                              <Icone size={16} className="text-slate-600" />
                            </span>
                            <p className="flex-1 text-sm font-semibold text-slate-800">
                              {label}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                compte.id
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {compte.id ? 'Relie' : 'Optionnel'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="text"
                              className="input-field bg-white"
                              value={compte.pseudo_reseau}
                              onChange={(evenement) =>
                                modifierReseau(id, 'pseudo_reseau', evenement.target.value)
                              }
                              placeholder={exemple}
                              aria-label={`Pseudo ${label}`}
                            />
                            <input
                              type="url"
                              className="input-field bg-white"
                              value={compte.lien_profil}
                              onChange={(evenement) =>
                                modifierReseau(id, 'lien_profil', evenement.target.value)
                              }
                              placeholder={lien}
                              aria-label={`Lien du profil ${label}`}
                            />
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => enregistrerReseau(id)}
                              disabled={Boolean(reseauEnCours)}
                              className="btn-primary flex-1 px-3 py-1.5 text-xs"
                            >
                              {enCours ? (
                                <>
                                  <Loader2 size={14} className="mr-1.5 animate-spin" />{' '}
                                  Enregistrement...
                                </>
                              ) : (
                                <>
                                  <Save size={14} className="mr-1.5" /> Enregistrer
                                </>
                              )}
                            </button>
                            {compte.id && (
                              <button
                                type="button"
                                onClick={() => supprimerReseau(id)}
                                disabled={Boolean(reseauEnCours)}
                                className="inline-flex items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
                                aria-label={`Retirer ${label}`}
                                title={`Retirer ${label}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>
            )}

            {onglet === 'centres-interet' && (
              <section
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                role="tabpanel"
                aria-label="Centres d'intérêt"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <Target size={19} className="text-blue-600" /> Centres d'intérêt
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Suivez les familles qui vous interessent et ajustez leur intensite
                      pour personnaliser vos recommandations.
                    </p>
                  </div>
                  <span className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {suivis.length} famille{suivis.length > 1 ? 's' : ''} suivie
                    {suivis.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      className="input-field pl-9 pr-9"
                      value={filtreInterets}
                      onChange={(evenement) => setFiltreInterets(evenement.target.value)}
                      placeholder="Rechercher une famille..."
                      aria-label="Rechercher une famille"
                    />
                    {filtreInterets && (
                      <button
                        type="button"
                        onClick={() => setFiltreInterets('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Effacer la recherche"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div
                    className="inline-flex w-full shrink-0 items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-0.5 sm:w-auto"
                    role="group"
                    aria-label="Filtrer les familles"
                  >
                    {VUES_INTERETS.map(({ valeur, label }) => {
                      const actif = vueInterets === valeur
                      return (
                        <button
                          key={valeur}
                          type="button"
                          onClick={() => setVueInterets(valeur)}
                          aria-pressed={actif}
                          className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
                            actif
                              ? 'bg-white text-blue-700 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Alerte message={messageInterets} className="mt-4" />

                {chargeInterets ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((cle) => (
                      <div key={cle} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : sujetsAffiches.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <Search size={28} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Aucune famille ne correspond a votre recherche.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltreInterets('')
                        setVueInterets('toutes')
                      }}
                      className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Reinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {sujetsAffiches.map((sujet) => {
                      const suivi = suivisParSujet.get(sujet.id)
                      const couleur = sujet.couleur || '#2f6fed'
                      const enAction =
                        actionSujet === `suivre-${sujet.id}` ||
                        actionSujet === `retirer-${sujet.id}`
                      const poids = Number(suivi?.poids ?? 0.7)
                      return (
                        <article
                          key={sujet.id}
                          className={`flex flex-col rounded-2xl border p-4 transition-colors ${
                            suivi
                              ? 'border-blue-200 bg-blue-50/30'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                              style={{ backgroundColor: `${couleur}18`, color: couleur }}
                              aria-hidden="true"
                            >
                              {sujet.nom.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="min-w-0 break-words text-sm font-bold text-slate-900">
                                  {sujet.nom}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() =>
                                    suivi ? retirerSujet(sujet) : suivreSujet(sujet)
                                  }
                                  disabled={Boolean(actionSujet)}
                                  aria-pressed={Boolean(suivi)}
                                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                                    suivi
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
                                  }`}
                                >
                                  {enAction ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : suivi ? (
                                    <Check size={12} />
                                  ) : (
                                    <Plus size={12} />
                                  )}
                                  {suivi ? 'Suivi' : 'Suivre'}
                                </button>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {sujet.description || 'Famille de sujets suivie par la rédaction.'}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                <span className="rounded-full bg-white px-2 py-0.5 font-medium text-slate-500 shadow-sm">
                                  {sujet.nombre_articles || 0} article
                                  {(sujet.nombre_articles || 0) > 1 ? 's' : ''}
                                </span>
                                {sujet.identifiant && (
                                  <Link
                                    to={`/sujet/${sujet.identifiant}`}
                                    className="font-medium text-blue-600 hover:underline"
                                  >
                                    Explorer
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>

                          {suivi && (
                            <div className="mt-3 rounded-xl border border-white bg-white p-3 shadow-sm">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-medium text-slate-600">
                                  Intensité de l'intérêt
                                </span>
                                <span className="font-bold" style={{ color: couleur }}>
                                  {Math.round(poids * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={poids}
                                onChange={(evenement) => changerPoids(suivi, evenement.target.value)}
                                className="mt-2 w-full cursor-pointer"
                                style={{ accentColor: couleur }}
                                aria-label={`Intensité pour ${sujet.nom}`}
                              />
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Curieux</span>
                                <span>Passionné</span>
                              </div>
                            </div>
                          )}
                        </article>
                      )
                    })}
                  </div>
                )}

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <Sparkles size={17} className="text-violet-500" /> Suggestions liées à vos centres d'intérêt
                      </h3>
                      <p className="text-xs text-slate-500">
                        Régénérées après chaque ajout, retrait ou changement d'intensité.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => genererRecommandations()}
                        disabled={generationRecommandations}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
                      >
                        {generationRecommandations ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <RefreshCw size={15} />
                        )}
                        Actualiser
                      </button>
                      <Link
                        to="/pour-vous"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                      >
                        Tout voir <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>

                  <ListeRecommandations
                    elements={recommandationsListe}
                    chargement={chargementRecommandations}
                    generation={generationRecommandations}
                    erreur={erreurRecommandations}
                    nombre={8}
                    variante="grille"
                    afficherRaison
                    onClic={marquerClic}
                    videTitre="Aucune suggestion pour le moment"
                    videTexte="Suivez une famille ci-dessus ou lancez une génération pour voir apparaître des articles adaptés."
                    videAction={{
                      label: 'Générer mes suggestions',
                      onClick: () => genererRecommandations(),
                    }}
                  />
                </div>
              </section>
            )}

            {onglet === 'securite' && (
              <div className="space-y-6" role="tabpanel" aria-label="Sécurité">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Lock size={18} className="text-blue-600" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Mot de passe</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Choisissez un mot de passe solide et unique.
                      </p>
                    </div>
                  </div>

                  <Alerte message={messageSecurite} className="mb-5" />

                  <form onSubmit={changerMotDePasse} className="space-y-4">
                    <Champ label="Mot de passe actuel" icone={Lock} pour="securite-ancien">
                      <input
                        id="securite-ancien"
                        type="password"
                        autoComplete="current-password"
                        className="input-field pl-10"
                        value={securite.ancien_mot_de_passe}
                        onChange={(evenement) =>
                          setSecurite((actuel) => ({
                            ...actuel,
                            ancien_mot_de_passe: evenement.target.value,
                          }))
                        }
                        required
                      />
                    </Champ>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Champ
                        label="Nouveau mot de passe"
                        icone={Lock}
                        pour="securite-nouveau"
                        aide="8 caractères minimum."
                      >
                        <input
                          id="securite-nouveau"
                          type="password"
                          autoComplete="new-password"
                          className="input-field pl-10"
                          value={securite.nouveau_mot_de_passe}
                          onChange={(evenement) =>
                            setSecurite((actuel) => ({
                              ...actuel,
                              nouveau_mot_de_passe: evenement.target.value,
                            }))
                          }
                          required
                        />
                      </Champ>
                      <Champ
                        label="Confirmer"
                        icone={Lock}
                        pour="securite-confirmation"
                      >
                        <input
                          id="securite-confirmation"
                          type="password"
                          autoComplete="new-password"
                          className="input-field pl-10"
                          value={securite.confirmation}
                          onChange={(evenement) =>
                            setSecurite((actuel) => ({
                              ...actuel,
                              confirmation: evenement.target.value,
                            }))
                          }
                          required
                        />
                      </Champ>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-4">
                      <button
                        type="submit"
                        disabled={sauvegardeMotDePasse}
                        className="btn-primary w-full sm:w-auto"
                      >
                        {sauvegardeMotDePasse ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />{' '}
                            Modification...
                          </>
                        ) : (
                          <>
                            <Shield size={16} className="mr-2" /> Changer le mot de
                            passe
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Settings2 size={18} className="text-slate-600" />
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Session et appareil
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Vous êtes connecté en tant que{' '}
                          <span className="font-medium text-slate-700">
                            {profilAffiche.email || profilAffiche.username}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={deconnexion}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                    >
                      <LogOut size={16} /> Se deconnecter
                    </button>
                  </div>
                  <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                    Votre session est protegee par un jeton d'authentification. Si vous
                    utilisez un appareil partage, pensez a vous deconnecter en partant.
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

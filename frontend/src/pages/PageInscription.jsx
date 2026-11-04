import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { extraireMessageErreur } from '@/services/erreurs'
import { AuthLayout, ChampAuth } from '@/components/ui/AuthLayout'
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from '@/components/ui/Icons'

const DONNEES_INITIALES = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  mot_de_passe: '',
  confirmer_mot_de_passe: '',
}

function forceDuMotDePasse(motDePasse) {
  if (!motDePasse) return 0
  let score = 0
  if (motDePasse.length >= 8) score += 1
  if (motDePasse.length >= 12) score += 1
  if (/[A-Z]/.test(motDePasse) && /[a-z]/.test(motDePasse)) score += 1
  if (/\d/.test(motDePasse) || /[^A-Za-z0-9]/.test(motDePasse)) score += 1
  return Math.min(score, 4)
}

const LIBELLES_FORCE = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent']
const COULEURS_FORCE = [
  'bg-slate-200',
  'bg-red-400',
  'bg-amber-400',
  'bg-lime-500',
  'bg-emerald-500',
]

export default function PageInscription() {
  const [donnees, setDonnees] = useState(DONNEES_INITIALES)
  const [motDePasseVisible, setMotDePasseVisible] = useState(false)
  const [charge, setCharge] = useState(false)
  const [erreur, setErreur] = useState('')
  const { connexion } = useAuth()
  const navigate = useNavigate()

  const force = useMemo(() => forceDuMotDePasse(donnees.mot_de_passe), [donnees.mot_de_passe])

  const gererChangement = (champ) => (evenement) => {
    setDonnees((actuel) => ({ ...actuel, [champ]: evenement.target.value }))
    if (erreur) setErreur('')
  }

  const validerFormulaire = () => {
    if (donnees.username.trim().length < 3) {
      return 'Le pseudo doit contenir au moins 3 caractères.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donnees.email.trim())) {
      return 'Saisissez une adresse email valide.'
    }
    if (donnees.mot_de_passe.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.'
    }
    if (donnees.mot_de_passe !== donnees.confirmer_mot_de_passe) {
      return 'Les deux mots de passe ne sont pas identiques.'
    }
    return ''
  }

  const gererInscription = async (evenement) => {
    evenement.preventDefault()
    if (charge) return

    const messageValidation = validerFormulaire()
    if (messageValidation) {
      setErreur(messageValidation)
      return
    }

    setCharge(true)
    setErreur('')

    try {
      const res = await auth.inscription({
        first_name: donnees.first_name.trim(),
        last_name: donnees.last_name.trim(),
        username: donnees.username.trim(),
        email: donnees.email.trim().toLowerCase(),
        mot_de_passe: donnees.mot_de_passe,
        confirmer_mot_de_passe: donnees.confirmer_mot_de_passe,
      })

      // L'API renvoie directement les jetons : pas besoin d'un second appel.
      connexion({
        access: res.data.access,
        refresh: res.data.refresh,
        utilisateur: res.data.utilisateur,
      })
      navigate('/tableau-de-bord', { replace: true })
    } catch (erreurInscription) {
      setErreur(
        extraireMessageErreur(erreurInscription, "L'inscription a échoué. Réessayez.")
      )
    } finally {
      setCharge(false)
    }
  }

  return (
    <AuthLayout
      titre="Créer votre compte"
      sousTitre="Quelques secondes suffisent pour construire une veille adaptée à vos intérêts."
      piedDePage={
        <>
          Vous avez deja un compte ?{' '}
          <Link to="/connexion" className="font-semibold text-blue-600 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {erreur && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={gererInscription} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <ChampAuth label="Prénom" pour="inscription-prenom">
            <input
              id="inscription-prenom"
              type="text"
              autoComplete="given-name"
              className="input-field"
              placeholder="Prénom"
              value={donnees.first_name}
              onChange={gererChangement('first_name')}
            />
          </ChampAuth>
          <ChampAuth label="Nom" pour="inscription-nom">
            <input
              id="inscription-nom"
              type="text"
              autoComplete="family-name"
              className="input-field"
              placeholder="Nom"
              value={donnees.last_name}
              onChange={gererChangement('last_name')}
            />
          </ChampAuth>
        </div>

        <ChampAuth
          label="Pseudo"
          icone={UserPlus}
          pour="inscription-username"
          aide="3 caractères minimum, visible sur votre profil public."
        >
          <input
            id="inscription-username"
            type="text"
            autoComplete="username"
            className="input-field pl-10"
            placeholder="Choisissez un pseudo"
            value={donnees.username}
            onChange={gererChangement('username')}
            required
            autoFocus
          />
        </ChampAuth>

        <ChampAuth label="Email" icone={Mail} pour="inscription-email">
          <input
            id="inscription-email"
            type="email"
            autoComplete="email"
            className="input-field pl-10"
            placeholder="vous@exemple.com"
            value={donnees.email}
            onChange={gererChangement('email')}
            required
          />
        </ChampAuth>

        <ChampAuth label="Mot de passe" icone={Lock} pour="inscription-password">
          <input
            id="inscription-password"
            type={motDePasseVisible ? 'text' : 'password'}
            autoComplete="new-password"
            className="input-field pl-10 pr-11"
            placeholder="8 caractères minimum"
            value={donnees.mot_de_passe}
            onChange={gererChangement('mot_de_passe')}
            required
          />
          <button
            type="button"
            onClick={() => setMotDePasseVisible((visible) => !visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {motDePasseVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </ChampAuth>

        {donnees.mot_de_passe && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((niveau) => (
                <span
                  key={niveau}
                  className={`h-1 flex-1 rounded-full ${
                    force >= niveau ? COULEURS_FORCE[force] : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Force du mot de passe :{' '}
              <span className="font-medium text-slate-700">{LIBELLES_FORCE[force]}</span>
            </p>
          </div>
        )}

        <ChampAuth
          label="Confirmer le mot de passe"
          icone={User}
          pour="inscription-confirmation"
        >
          <input
            id="inscription-confirmation"
            type={motDePasseVisible ? 'text' : 'password'}
            autoComplete="new-password"
            className="input-field pl-10"
            placeholder="Retapez votre mot de passe"
            value={donnees.confirmer_mot_de_passe}
            onChange={gererChangement('confirmer_mot_de_passe')}
            required
          />
        </ChampAuth>

        <button type="submit" disabled={charge} className="btn-primary w-full py-2.5">
          {charge ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" /> Creation du compte...
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
        Votre email sert uniquement a securiser le compte et a recevoir la newsletter si vous
        l'activez. Il n'est jamais affiché publiquement.
      </p>
    </AuthLayout>
  )
}

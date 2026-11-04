import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  User,
} from '@/components/ui/Icons'

export default function PageConnexion() {
  const [donnees, setDonnees] = useState({ username: '', mot_de_passe: '' })
  const [motDePasseVisible, setMotDePasseVisible] = useState(false)
  const [charge, setCharge] = useState(false)
  const [erreur, setErreur] = useState('')
  const { connexion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const destination = location.state?.depuis || '/tableau-de-bord'
  const revientDUnePageProtegee = Boolean(location.state?.depuis)

  const gererChangement = (champ) => (evenement) => {
    setDonnees((actuel) => ({ ...actuel, [champ]: evenement.target.value }))
    if (erreur) setErreur('')
  }

  const gererConnexion = async (evenement) => {
    evenement.preventDefault()
    if (charge) return

    setCharge(true)
    setErreur('')

    try {
      const res = await auth.connexion({
        username: donnees.username.trim(),
        mot_de_passe: donnees.mot_de_passe,
      })
      connexion({
        access: res.data.access,
        refresh: res.data.refresh,
        utilisateur: res.data.utilisateur,
      })
      navigate(destination, { replace: true })
    } catch (erreurConnexion) {
      setErreur(
        extraireMessageErreur(erreurConnexion, 'Pseudo ou mot de passe incorrect.')
      )
    } finally {
      setCharge(false)
    }
  }

  return (
    <AuthLayout
      titre="Content de vous revoir"
      sousTitre="Connectez-vous pour retrouver votre veille, vos suivis et vos recommandations."
      piedDePage={
        <>
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-semibold text-blue-600 hover:underline">
            Creer un compte
          </Link>
        </>
      }
    >
      {revientDUnePageProtegee && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
          <Lock size={16} className="mt-0.5 shrink-0 text-blue-500" />
          Connectez-vous pour acceder a cette page.
        </div>
      )}

      {erreur && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={gererConnexion} className="space-y-4" noValidate>
        <ChampAuth label="Pseudo" icone={User} pour="connexion-username">
          <input
            id="connexion-username"
            type="text"
            autoComplete="username"
            className="input-field pl-10"
            placeholder="Votre pseudo"
            value={donnees.username}
            onChange={gererChangement('username')}
            required
            autoFocus
          />
        </ChampAuth>

        <ChampAuth label="Mot de passe" icone={Lock} pour="connexion-password">
          <input
            id="connexion-password"
            type={motDePasseVisible ? 'text' : 'password'}
            autoComplete="current-password"
            className="input-field pl-10 pr-11"
            placeholder="Votre mot de passe"
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

        <button type="submit" disabled={charge} className="btn-primary w-full py-2.5">
          {charge ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" /> Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <span>Vos identifiants restent privés.</span>
        <Link to="/" className="font-medium text-blue-600 hover:underline">
          Continuer sans compte
        </Link>
      </div>
    </AuthLayout>
  )
}

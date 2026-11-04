import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { auth } from '@/services/api'

const ContexteAuth = createContext(null)

const CLE_JETON = 'veillia_token'
const CLE_RAFRAICHISSEMENT = 'veillia_refresh'
const CLE_UTILISATEUR = 'veillia_user'

function lireUtilisateurEnregistre() {
  try {
    return JSON.parse(localStorage.getItem(CLE_UTILISATEUR) || 'null')
  } catch {
    localStorage.removeItem(CLE_UTILISATEUR)
    return null
  }
}

export function FournisseurAuth({ children }) {
  const [utilisateur, setUtilisateur] = useState(lireUtilisateurEnregistre)
  const [charge, setCharge] = useState(true)

  useEffect(() => {
    let monte = true

    const surExpiration = () => {
      if (monte) setUtilisateur(null)
    }
    window.addEventListener('veillia:session-expiree', surExpiration)

    const jeton = localStorage.getItem(CLE_JETON)
    if (!jeton) {
      setCharge(false)
      return () => {
        monte = false
        window.removeEventListener('veillia:session-expiree', surExpiration)
      }
    }

    // On reverifie le profil au demarrage : le jeton peut avoir expire.
    auth
      .profil()
      .then((res) => {
        if (!monte) return
        setUtilisateur(res.data)
        localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(res.data))
      })
      .catch(() => {
        // Le cache local reste utilise si le serveur est momentanement absent.
      })
      .finally(() => {
        if (monte) setCharge(false)
      })

    return () => {
      monte = false
      window.removeEventListener('veillia:session-expiree', surExpiration)
    }
  }, [])

  const connexion = useCallback(({ access, refresh, utilisateur: profil }) => {
    if (access) localStorage.setItem(CLE_JETON, access)
    if (refresh) localStorage.setItem(CLE_RAFRAICHISSEMENT, refresh)
    if (profil) localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(profil))
    setUtilisateur(profil ?? null)
  }, [])

  const mettreAJourUtilisateur = useCallback((donnees) => {
    setUtilisateur((actuel) => {
      if (!actuel) return actuel
      const profil = { ...actuel, ...donnees }
      localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(profil))
      return profil
    })
  }, [])

  const deconnexion = useCallback(() => {
    localStorage.removeItem(CLE_JETON)
    localStorage.removeItem(CLE_RAFRAICHISSEMENT)
    localStorage.removeItem(CLE_UTILISATEUR)
    setUtilisateur(null)
    window.location.assign('/connexion')
  }, [])

  const valeur = useMemo(
    () => ({
      utilisateur,
      charge,
      estConnecte: Boolean(utilisateur),
      connexion,
      deconnexion,
      mettreAJourUtilisateur,
    }),
    [utilisateur, charge, connexion, deconnexion, mettreAJourUtilisateur]
  )

  return <ContexteAuth.Provider value={valeur}>{children}</ContexteAuth.Provider>
}

export function useAuth() {
  const contexte = useContext(ContexteAuth)
  if (!contexte) {
    throw new Error('useAuth doit être utilisé dans un FournisseurAuth')
  }
  return contexte
}

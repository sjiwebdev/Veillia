import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Logo } from '@/components/ui/Logo'

function ChargementSession() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Logo taille="normal" />
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
        </div>
        <p className="text-sm text-slate-500">Vérification de votre session...</p>
      </div>
    </div>
  )
}

/** Une page accessible uniquement aux membres connectes. */
export function RouteProtegee({ children }) {
  const { estConnecte, charge } = useAuth()
  const location = useLocation()

  if (charge) return <ChargementSession />
  if (!estConnecte) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ depuis: `${location.pathname}${location.search}` }}
      />
    )
  }
  return children
}

/** Connexion et inscription : redirige les membres deja connectes. */
export function RouteInvite({ children }) {
  const { estConnecte, charge } = useAuth()
  const location = useLocation()

  if (charge) return <ChargementSession />
  if (estConnecte) {
    return <Navigate to={location.state?.depuis || '/tableau-de-bord'} replace />
  }
  return children
}

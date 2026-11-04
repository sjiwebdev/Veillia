import { Component } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { AlertCircle, ArrowRight, Home } from '@/components/ui/Icons'

/**
 * Vrai error boundary React (composant de classe obligatoire).
 * Il enveloppe le routeur : il ne doit donc jamais utiliser useNavigate.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erreur: null }
  }

  static getDerivedStateFromError(erreur) {
    return { erreur }
  }

  componentDidCatch(erreur, info) {
    console.error('Erreur capturée par ErrorBoundary :', erreur, info.componentStack)
  }

  render() {
    if (this.state.erreur) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <a href="/" className="mb-6 inline-flex items-center gap-2">
              <Logo taille="normal" />
            </a>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4 flex justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertCircle size={24} />
                </span>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900">Une erreur est survenue</h1>
              <p className="mb-6 text-slate-600">
                {this.state.erreur.message || "Une erreur inattendue s'est produite."}
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    window.location.href = '/'
                  }}
                  className="btn-primary justify-center"
                >
                  <Home size={16} className="mr-2" /> Retour à l'accueil
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <ArrowRight size={16} className="mr-2" /> Actualiser
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function PageIntrouvable() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <Logo taille="normal" />
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex justify-center">
            <AlertCircle size={36} className="text-slate-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">404 - Page introuvable</h1>
          <p className="mb-6 text-slate-600">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Link to="/" className="btn-primary inline-flex justify-center">
            <Home size={16} className="mr-2" /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

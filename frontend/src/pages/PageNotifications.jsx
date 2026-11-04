import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { recommandations, sujets, extraireListe } from '@/services/api'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Target,
  Zap,
} from '@/components/ui/Icons'

export default function PageNotifications() {
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const [liste, setListe] = useState([])
  const [nombreSuivis, setNombreSuivis] = useState(0)
  const [charge, setCharge] = useState(true)
  const [generation, setGeneration] = useState(false)
  const [message, setMessage] = useState(null)

  const charger = async () => {
    const [resultatRecommandations, resultatSuivis] = await Promise.allSettled([
      recommandations.liste(),
      sujets.mesSuivis(),
    ])
    if (resultatRecommandations.status === 'fulfilled') {
      setListe(extraireListe(resultatRecommandations.value.data))
    }
    if (resultatSuivis.status === 'fulfilled') {
      setNombreSuivis(extraireListe(resultatSuivis.value.data).length)
    }
  }

  useEffect(() => {
    let monte = true
    charger().finally(() => {
      if (monte) setCharge(false)
    })
    return () => {
      monte = false
    }
  }, [])

  const generer = async () => {
    if (generation) return
    setGeneration(true)
    setMessage(null)
    try {
      const res = await recommandations.generer({ nombre: 20 })
      setListe(extraireListe(res.data))
      setMessage({ type: 'succes', texte: 'Vos notifications ont été actualisées.' })
    } catch {
      setMessage({
        type: 'erreur',
        texte: 'Impossible de générer de nouvelles recommandations pour le moment.',
      })
    } finally {
      setGeneration(false)
    }
  }

  const articles = liste.map((element) => element.article).filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Mon compte
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Bell size={24} className="text-slate-700" /> Notifications
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Vos nouvelles recommandations et les informations de votre compte.
            </p>
          </div>
          <button type="button" onClick={generer} disabled={generation} className="btn-primary">
            {generation ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Actualisation...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" /> Actualiser
              </>
            )}
          </button>
        </div>

        {message && (
          <div
            className={`mb-5 flex items-start gap-2 rounded-xl border p-4 text-sm ${
              message.type === 'succes'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'succes' ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <span>{message.texte}</span>
          </div>
        )}

        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
            <Zap size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Bonjour {utilisateur?.first_name || utilisateur?.nom_affiche || 'membre'}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              Vous suivez {nombreSuivis} famille{nombreSuivis > 1 ? 's' : ''} de sujets.
              {articles.length > 0
                ? ` ${articles.length} recommandation${articles.length > 1 ? 's sont' : ' est'} disponible${articles.length > 1 ? 's' : ''}.`
                : ' Aucune nouvelle recommandation pour le moment.'}
            </p>
          </div>
        </div>

        {charge ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((cle) => (
              <div key={cle} className="h-20 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Target size={36} className="mx-auto mb-3 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Aucune notification</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Suivez de nouvelles familles ou lancez une generation pour recevoir vos premieres
              recommandations.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/sujets" className="btn-primary w-full sm:w-auto">
                Explorer les familles
              </Link>
              <button type="button" onClick={generer} className="btn-outline w-full sm:w-auto">
                Generer maintenant
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.slice(0, 12).map((article) => (
              <button
                key={article.identifiant}
                type="button"
                onClick={() => navigate(`/article/${article.identifiant}`)}
                className="group flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-200 hover:shadow-sm"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Bell size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                    {article.titre}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {article.source?.nom || 'Source'} - une nouvelle recommandation pour vous
                  </span>
                </span>
                <ArrowRight size={16} className="mt-2 shrink-0 text-slate-300 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

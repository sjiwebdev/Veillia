import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ListeRecommandations } from '@/components/ListeRecommandations'
import { BasculeAffichage } from '@/components/ui/BasculeAffichage'
import { useAffichage } from '@/hooks/useAffichage'
import { useRecommandations } from '@/hooks/useRecommandations'
import { useAuth } from '@/context/AuthContext'
import { recommandations } from '@/services/api'
import {
  AlertCircle,
  CheckCircle2,
  Compass,
  Loader2,
  RefreshCw,
  Target,
} from '@/components/ui/Icons'

function pourcentage(valeur) {
  return Math.max(0, Math.min(100, Math.round(Number(valeur || 0) * 100)))
}

function EtatMoteur({ moteur }) {
  if (!moteur) return null

  const couverture = pourcentage(moteur.couverture)
  const actif = moteur.actif

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Compass size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">Affinité sémantique</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {actif
                ? `${moteur.articles_vectorises.toLocaleString('fr-FR')} articles analysés sur ${moteur.articles_total.toLocaleString('fr-FR')} avec ${moteur.modele}.`
                : "Les résumés ne sont pas encore vectorisés. Vos familles et vos sources suivies restent utilisées."}
            </p>
          </div>
        </div>

        {actif && (
          <div className="w-full sm:w-52">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Couverture</span>
              <span>{couverture} %</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${couverture}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PagePourVous() {
  const { utilisateur } = useAuth()
  const [moteur, setMoteur] = useState(null)
  const [affichage, setAffichage] = useAffichage()
  const {
    elements,
    chargement,
    generation,
    erreur,
    message,
    generer,
    marquerClic,
  } = useRecommandations({ nombre: 24, autoGenerer: true })

  useEffect(() => {
    let monte = true
    recommandations
      .moteur()
      .then((res) => {
        if (monte) setMoteur(res.data)
      })
      .catch(() => {
        // L'état du moteur reste un complément : son absence ne bloque pas le fil.
      })
    return () => {
      monte = false
    }
  }, [])

  const enAttente = chargement || (generation && elements.length === 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Mon fil personnalisé
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Pour vous</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Des articles choisis selon les familles que vous suivez, la proximité de leur
              résumé avec vos centres d'intérêt, les sources que vous aimez et votre historique
              de lecture.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BasculeAffichage valeur={affichage} onChange={setAffichage} />
            <button
              type="button"
              onClick={() => generer()}
              disabled={generation}
              className="btn-primary"
            >
              {generation ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Génération...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" /> Régénérer
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
          <Compass size={16} className="shrink-0 text-blue-500" />
          <span>
            Bonjour {utilisateur?.first_name || utilisateur?.nom_affiche || 'membre'} : votre fil
            s'adapte automatiquement à mesure que vous lisez et que vous suivez de nouvelles
            familles.
          </span>
        </div>

        <EtatMoteur moteur={moteur} />

        {erreur && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{erreur}</span>
          </div>
        )}

        {message?.type === 'succes' && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>{message.texte}</span>
          </div>
        )}

        <ListeRecommandations
          elements={elements}
          chargement={enAttente}
          generation={generation}
          erreur={erreur}
          nombre={24}
          variante={affichage === 'grille' ? 'grille' : 'ligne'}
          afficherRaison
          afficherScore
          onClic={marquerClic}
          videAction={{ label: 'Générer maintenant', onClick: () => generer() }}
        />

        {!enAttente && elements.length > 0 && (
          <p className="mt-6 text-center text-xs text-slate-400">
            {elements.length} recommandation{elements.length > 1 ? 's' : ''} calculée
            {elements.length > 1 ? 's' : ''} à partir de vos centres d'intérêt.{' '}
            <Link to="/suivis" className="font-medium text-blue-600 hover:underline">
              Ajuster mes familles
            </Link>
          </p>
        )}

        {!enAttente && elements.length === 0 && (
          <div className="mt-5 flex justify-center">
            <Link to="/sujets" className="btn-outline">
              <Target size={16} className="mr-2" /> Découvrir les familles
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

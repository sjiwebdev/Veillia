import { Link } from 'react-router-dom'
import { ArticleCard } from './ArticleCard'
import {
  AlertCircle,
  Compass,
  Loader2,
  RefreshCw,
  Target,
} from './ui/Icons'

function pourcentage(valeur) {
  return Math.max(0, Math.min(100, Math.round(Number(valeur || 0) * 100)))
}

/**
 * Affichage commun des recommandations : chargement, erreur, liste vide et
 * cartes d'articles. Les pages gardent la main sur leur en-tête et leur mise
 * en page grâce à la classe `className`.
 */
export function ListeRecommandations({
  elements = [],
  chargement = false,
  generation = false,
  erreur = '',
  nombre = 4,
  variante = 'ligne',
  afficherRaison = false,
  afficherScore = false,
  filtrer,
  onClic,
  className = '',
  videTitre = 'Aucune recommandation pour le moment',
  videTexte = "Suivez quelques familles de sujets puis lancez une génération : votre fil s'enrichit à chaque lecture.",
  videAction = null,
  lienSuivis = true,
  masquerVide = false,
}) {
  const visibles = elements
    .filter((element) => element.article)
    .filter((element) => (filtrer ? filtrer(element.article, element) : true))
    .slice(0, nombre)

  if (chargement) {
    if (variante === 'grille') {
      return (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
          {[1, 2, 3].map((cle) => (
            <div key={cle} className="h-64 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )
    }
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((cle) => (
          <div key={cle} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (erreur && visibles.length === 0) {
    return (
      <div
        className={`flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 ${className}`}
      >
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
        <span>{erreur}</span>
      </div>
    )
  }

  if (visibles.length === 0) {
    if (masquerVide) return null
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center ${className}`}
      >
        <Target size={28} className="mb-3 text-slate-400" />
        <p className="text-sm font-semibold text-slate-700">{videTitre}</p>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">{videTexte}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {videAction && (
            <button
              type="button"
              onClick={videAction.onClick}
              disabled={generation || videAction.enCours}
              className="btn-primary px-3 py-2 text-xs"
            >
              {generation || videAction.enCours ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <RefreshCw size={14} className="mr-1.5" />
              )}
              {videAction.label || 'Générer maintenant'}
            </button>
          )}
          {lienSuivis && (
            <Link to="/suivis" className="text-sm font-medium text-blue-600 hover:underline">
              Choisir mes familles
            </Link>
          )}
        </div>
      </div>
    )
  }

  const classeListe =
    variante === 'grille'
      ? `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`
      : `space-y-3 ${className}`

  return (
    <div className={classeListe}>
      {visibles.map((element) => {
        const article = element.article
        const cle = element.id || article.identifiant
        return (
          <div
            key={cle}
            className={variante === 'grille' ? 'flex flex-col' : 'min-w-0'}
            onClickCapture={() => onClic?.(element)}
          >
            <ArticleCard
              article={article}
              variante={variante === 'grille' ? 'grande' : variante === 'compacte' ? 'compacte' : 'ligne'}
            />
            {(afficherRaison || afficherScore) && (
              <div className="mt-2 px-1">
                {afficherRaison && element.raison && (
                  <p className="line-clamp-2 text-xs italic text-slate-500">{element.raison}</p>
                )}
                {afficherScore && Number(element.score_semantique) > 0.15 && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-indigo-600">
                    <Compass size={13} />
                    Affinité sémantique {pourcentage(element.score_semantique)} %
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { Grid, List } from './Icons'

const OPTIONS = [
  { valeur: 'grille', label: 'Grille', Icone: Grid },
  { valeur: 'liste', label: 'Liste', Icone: List },
]

/**
 * Sélecteur de mode d'affichage commun aux catalogues d'articles.
 * Toujours visible, avec libellés et état actif explicite.
 */
export function BasculeAffichage({ valeur = 'grille', onChange, className = '' }) {
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border border-slate-200 bg-white p-0.5 shadow-sm ${className}`}
      role="group"
      aria-label="Mode d affichage des articles"
    >
      {OPTIONS.map(({ valeur: option, label, Icone }) => {
        const actif = valeur === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange?.(option)}
            aria-pressed={actif}
            aria-label={`Afficher en ${label.toLowerCase()}`}
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              actif
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icone size={14} className={actif ? 'text-white' : 'text-slate-500'} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

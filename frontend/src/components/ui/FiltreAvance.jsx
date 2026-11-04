import { useState } from 'react'
import { Search, Filter, X, ChevronDown } from './Icons'

/**
 * Widget de filtre avance reutilisable pour toutes les pages de listes.
 */
export function FiltreAvance({
  requete = '',
  onRequeteChange,
  sujetSelectionne = '',
  onSujetChange,
  sourceSelectionnee = '',
  onSourceChange,
  dateDebut = '',
  onDateDebutChange,
  dateFin = '',
  onDateFinChange,
  tri = 'recents',
  onTriChange,
  onRéinitialiser,
  listeSujets = [],
  listeSources = [],
}) {
  const [filtresOuverts, setFiltresOuverts] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
      {/* Barre de recherche principale */}
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input-field rounded-full pl-10 pr-10"
            placeholder="Rechercher des articles, des sujets, des sources..."
            value={requete}
            onChange={(e) => onRequeteChange?.(e.target.value)}
          />
          {requete && (
            <button
              type="button"
              onClick={() => onRequeteChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Effacer la recherche"
            >
              <X size={4} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltresOuverts(!filtresOuverts)}
            aria-expanded={filtresOuverts}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:px-4"
          >
            <Filter size={4} />
            <span>Filtres</span>
            <ChevronDown
              size={3}
              className={`transition-transform ${filtresOuverts ? 'rotate-180' : ''}`}
            />
          </button>
          <select
            value={tri}
            onChange={(e) => onTriChange?.(e.target.value)}
            aria-label="Trier les articles"
            className="min-w-0 flex-1 cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:flex-none"
          >
            <option value="recents">Plus récents</option>
            <option value="plus_anciens">Plus anciens</option>
            <option value="qualite">Qualité</option>
            <option value="popularite">Popularité</option>
          </select>
          <button
            type="button"
            onClick={onRéinitialiser}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:px-4"
          >
            <X size={4} />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Filtres avances (depliables) */}
      {filtresOuverts && (
        <div className="grid grid-cols-1 gap-4 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Famille de sujets</label>
            <select
              value={sujetSelectionne}
              onChange={(e) => onSujetChange?.(e.target.value)}
              className="input-field text-sm rounded-lg"
            >
              <option value="">Tous les sujets</option>
              {listeSujets.map((s) => (
                <option key={s.identifiant} value={s.identifiant}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Source</label>
            <select
              value={sourceSelectionnee}
              onChange={(e) => onSourceChange?.(e.target.value)}
              className="input-field text-sm rounded-lg"
            >
              <option value="">Toutes les sources</option>
              {listeSources.map((s) => (
                <option key={s.identifiant} value={s.identifiant}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => onDateDebutChange?.(e.target.value)}
              className="input-field text-sm rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => onDateFinChange?.(e.target.value)}
              className="input-field text-sm rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

const PALETTE = [
  'text-blue-600',
  'text-red-500',
  'text-amber-500',
  'text-emerald-500',
  'text-blue-600',
  'text-red-500',
  'text-amber-500',
]

const PALETTE_CLAIR = [
  'text-blue-400',
  'text-red-400',
  'text-amber-300',
  'text-emerald-400',
  'text-blue-400',
  'text-red-400',
  'text-amber-300',
]

/**
 * Logo VEILLIA : lettres multicolores facon Google News, sans fond.
 * La variante "clair" sert sur les panneaux sombres (connexion, inscription).
 */
export function Logo({ className = '', taille = 'normal', variante = 'defaut' }) {
  const classesTaille =
    taille === 'grand'
      ? 'text-4xl font-black tracking-tighter'
      : taille === 'petit'
        ? 'text-xl font-bold tracking-tight'
        : 'text-2xl font-bold tracking-tighter'

  const palette = variante === 'clair' ? PALETTE_CLAIR : PALETTE

  return (
    <span className={`inline-flex items-center ${classesTaille} ${className}`}>
      <span className="flex items-center" aria-label="VEILLIA">
        {'VEILLIA'.split('').map((lettre, index) => (
          <span
            key={`${lettre}-${index}`}
            className={`${palette[index]} drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]`}
          >
            {lettre}
          </span>
        ))}
      </span>
    </span>
  )
}

import { useState } from 'react'

const TAILLES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
  '2xl': 'h-28 w-28 text-3xl',
}

export function initialesDe(profil) {
  if (!profil) return '?'
  if (profil.initiales) return profil.initiales
  const nom = profil.nom_affiche || profil.username || ''
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  if (mots.length >= 2) return `${mots[0][0]}${mots[1][0]}`.toUpperCase()
  return nom.slice(0, 2).toUpperCase() || '?'
}

/**
 * Avatar commun à toute l'application : photo téléversée, sinon initiales.
 * L'image en erreur repasse automatiquement aux initiales sans casser la mise
 * en page. Une nouvelle URL réessaie de charger la nouvelle photo.
 */
export function Avatar({
  utilisateur,
  taille = 'md',
  forme = 'cercle',
  className = '',
  alt,
}) {
  const photo = utilisateur?.photo_profil
  const [photoEnErreur, setPhotoEnErreur] = useState(null)
  const afficherPhoto = Boolean(photo) && photoEnErreur !== photo
  const arrondi = forme === 'carre' ? 'rounded-2xl' : 'rounded-full'
  const classes = `${TAILLES[taille] || TAILLES.md} ${arrondi} shrink-0 object-cover ${className}`

  if (afficherPhoto) {
    return (
      <img
        key={photo}
        src={photo}
        alt={alt || utilisateur?.nom_affiche || utilisateur?.username || 'Photo de profil'}
        className={classes}
        loading="lazy"
        onError={() => setPhotoEnErreur(photo)}
      />
    )
  }

  return (
    <span
      className={`${classes} flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-500 font-bold text-white`}
      aria-label={alt || `Initiales de ${utilisateur?.nom_affiche || 'membre'}`}
    >
      {initialesDe(utilisateur)}
    </span>
  )
}

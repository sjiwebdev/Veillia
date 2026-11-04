import { useCallback, useEffect, useState } from 'react'

export const CLE_AFFICHAGE = 'veillia_affichage'

function lireAffichage() {
  if (typeof window === 'undefined') return 'grille'
  try {
    return window.localStorage.getItem(CLE_AFFICHAGE) === 'liste' ? 'liste' : 'grille'
  } catch {
    return 'grille'
  }
}

/**
 * Mode d'affichage des catalogues (liste ou grille), partagé entre les pages
 * et conservé dans le navigateur pour retrouver ses préférences.
 */
export function useAffichage() {
  const [affichage, setAffichage] = useState(lireAffichage)

  useEffect(() => {
    const synchroniser = (evenement) => {
      if (evenement.key !== CLE_AFFICHAGE) return
      setAffichage(evenement.newValue === 'liste' ? 'liste' : 'grille')
    }
    window.addEventListener('storage', synchroniser)
    return () => window.removeEventListener('storage', synchroniser)
  }, [])

  const changerAffichage = useCallback((valeur) => {
    if (valeur !== 'liste' && valeur !== 'grille') return
    setAffichage(valeur)
    try {
      window.localStorage.setItem(CLE_AFFICHAGE, valeur)
    } catch {
      // Le stockage peut etre indisponible (navigation privee stricte).
    }
  }, [])

  return [affichage, changerAffichage]
}

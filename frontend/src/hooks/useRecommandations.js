import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recommandations, extraireListe } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'

/**
 * Charge et régénère les recommandations de l'utilisateur connecté.
 *
 * Le verrou `generationEnCours` évite deux appels simultanés quand React
 * exécute les effets deux fois en mode développement, ou quand deux boutons
 * sont cliqués coup sur coup.
 */
export function useRecommandations({ nombre = 20, autoGenerer = false, actif = true } = {}) {
  const [elements, setElements] = useState([])
  const [chargement, setChargement] = useState(actif)
  const [generation, setGeneration] = useState(false)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState(null)

  const monte = useRef(true)
  const chargementEnCours = useRef(false)
  const generationEnCours = useRef(false)
  const generationAutoFaite = useRef(false)

  useEffect(() => {
    monte.current = true
    return () => {
      monte.current = false
    }
  }, [])

  const charger = useCallback(async () => {
    if (!actif) return []
    if (chargementEnCours.current) return []
    chargementEnCours.current = true
    setChargement(true)
    try {
      const res = await recommandations.liste()
      if (!monte.current) return []
      const liste = extraireListe(res.data)
      setElements(liste)
      setErreur('')
      return liste
    } catch (erreurChargement) {
      if (monte.current) {
        setErreur(
          extraireMessageErreur(
            erreurChargement,
            'Impossible de charger vos recommandations.'
          )
        )
      }
      return []
    } finally {
      chargementEnCours.current = false
      if (monte.current) setChargement(false)
    }
  }, [actif])

  const generer = useCallback(
    async ({ silencieux = false } = {}) => {
      if (!actif) return []
      if (generationEnCours.current) return []
      generationEnCours.current = true
      setGeneration(true)
      if (!silencieux) {
        setErreur('')
        setMessage(null)
      }

      try {
        const res = await recommandations.generer({ nombre })
        if (!monte.current) return []
        const liste = extraireListe(res.data)
        setElements(liste)
        setErreur('')
        if (!silencieux) {
          setMessage({
            type: 'succes',
            texte:
              liste.length > 0
                ? `${liste.length} recommandation${liste.length > 1 ? 's' : ''} disponible${liste.length > 1 ? 's' : ''}.`
                : 'Aucun article ne correspond à vos critères pour le moment.',
          })
        }
        return liste
      } catch (erreurGeneration) {
        if (monte.current) {
          setErreur(
            extraireMessageErreur(
              erreurGeneration,
              'Impossible de générer vos recommandations.'
            )
          )
        }
        return []
      } finally {
        generationEnCours.current = false
        if (monte.current) setGeneration(false)
      }
    },
    [actif, nombre]
  )

  useEffect(() => {
    let actif = true
    charger().then((liste) => {
      if (!actif || !autoGenerer || generationAutoFaite.current) return
      if (liste.length === 0) {
        generationAutoFaite.current = true
        generer({ silencieux: true })
      }
    })
    return () => {
      actif = false
    }
  }, [autoGenerer, charger, generer])

  const marquerClic = useCallback((element) => {
    if (!element?.id) return
    recommandations.clic(element.id).catch(() => {})
    setElements((actuel) =>
      actuel.map((item) =>
        item.id === element.id ? { ...item, est_cliquee: true } : item
      )
    )
  }, [])

  const articles = useMemo(
    () => elements.map((element) => element.article).filter(Boolean),
    [elements]
  )

  return {
    elements,
    articles,
    chargement,
    generation,
    erreur,
    message,
    charger,
    generer,
    marquerClic,
    setMessage,
  }
}

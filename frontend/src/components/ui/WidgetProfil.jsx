import { useEffect, useRef, useState } from 'react'
import { auth } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'
import { Avatar } from './Avatar'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  CloudUpload,
  Loader2,
  Trash2,
} from './Icons'

const TAILLE_MAX = 4 * 1024 * 1024
const FORMATS_ACCEPTES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const CHAMPS_COMPLETION = [
  ['username', 'Pseudo'],
  ['first_name', 'Prénom'],
  ['last_name', 'Nom'],
  ['email', 'Email'],
  ['photo_profil', 'Photo'],
  ['presentation', 'Présentation'],
  ['fonction', 'Fonction'],
  ['entreprise', 'Entreprise'],
  ['pays', 'Pays'],
  ['site_web', 'Site web'],
]

function moisAnnee(valeur) {
  if (!valeur) return null
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function completionProfil(profil, apercuPhoto = '') {
  if (!profil) return 0
  const remplis = CHAMPS_COMPLETION.filter(([champ]) => {
    if (champ === 'photo_profil') {
      return Boolean(apercuPhoto || profil.photo_profil)
    }
    return String(profil[champ] ?? '').trim().length > 0
  }).length
  return Math.round((remplis / CHAMPS_COMPLETION.length) * 100)
}

/**
 * Carte de profil avec téléversement de photo par glisser-déposer.
 * L'aperçu est instantané (URL locale), puis remplacé par l'URL renvoyée par
 * le serveur. Le parent est notifié pour mettre à jour l'avatar de la navbar.
 */
export function WidgetProfil({ profil, onMiseAJour, className = '' }) {
  const [survol, setSurvol] = useState(false)
  const [apercu, setApercu] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [suppression, setSuppression] = useState(false)
  const [message, setMessage] = useState(null)
  const champFichier = useRef(null)

  const profilActuel = profil || {}
  const nomAffiche = profilActuel.nom_affiche || profilActuel.username || 'Membre'
  const photoAffichee = apercu || profilActuel.photo_profil
  const membreDepuis = moisAnnee(profilActuel.cree_le)
  const completion = completionProfil(profilActuel, apercu)
  const champsManquants = CHAMPS_COMPLETION.filter(([champ]) => {
    if (champ === 'photo_profil') return !photoAffichee
    return String(profilActuel[champ] ?? '').trim().length === 0
  }).map(([, label]) => label)

  // L'URL locale doit être libérée dès qu'elle n'est plus affichée.
  useEffect(() => {
    if (!apercu) return undefined
    return () => URL.revokeObjectURL(apercu)
  }, [apercu])

  useEffect(() => {
    if (!message) return undefined
    const minuterie = window.setTimeout(() => setMessage(null), 5000)
    return () => window.clearTimeout(minuterie)
  }, [message])

  const verifierFichier = (fichier) => {
    if (!fichier) return 'Aucune image sélectionnée.'
    if (fichier.size > TAILLE_MAX) {
      return "L'image ne doit pas dépasser 4 Mo."
    }
    const type = (fichier.type || '').toLowerCase()
    if (type && !FORMATS_ACCEPTES.includes(type)) {
      return 'Format non pris en charge. Utilisez JPG, PNG, GIF ou WebP.'
    }
    return ''
  }

  const televerser = async (fichier) => {
    if (envoi || suppression) return
    const erreurValidation = verifierFichier(fichier)
    if (erreurValidation) {
      setMessage({ type: 'erreur', texte: erreurValidation })
      return
    }

    setMessage(null)
    setApercu(URL.createObjectURL(fichier))
    setEnvoi(true)

    try {
      const res = await auth.televerserPhoto(fichier)
      onMiseAJour?.(res.data)
      setApercu('')
      setMessage({ type: 'succes', texte: 'Votre photo de profil est à jour.' })
    } catch (erreur) {
      setApercu('')
      setMessage({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'Le téléversement de la photo a échoué.'),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const choisirFichier = (evenement) => {
    const fichier = evenement.target.files?.[0]
    evenement.target.value = ''
    if (fichier) televerser(fichier)
  }

  const deposer = (evenement) => {
    evenement.preventDefault()
    setSurvol(false)
    const fichier = evenement.dataTransfer.files?.[0]
    if (fichier) televerser(fichier)
  }

  const supprimerPhoto = async () => {
    if (!profilActuel.photo_profil || envoi || suppression) return
    if (!window.confirm('Supprimer votre photo de profil ?')) return

    setMessage(null)
    setSuppression(true)
    try {
      const res = await auth.supprimerPhoto()
      onMiseAJour?.(res.data)
      setApercu('')
      setMessage({ type: 'succes', texte: 'Votre photo a été supprimée.' })
    } catch (erreur) {
      setMessage({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'Impossible de supprimer la photo.'),
      })
    } finally {
      setSuppression(false)
    }
  }

  const occupe = envoi || suppression

  return (
    <aside
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
      aria-label="Aperçu de votre profil"
    >
      <div
        className="relative h-24"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
        }}
      >
        <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          Profil public
        </span>
      </div>

      <div className="px-5 pb-5">
        <div className="relative -mt-11 mb-3 flex items-end justify-between gap-3">
          <div className="relative">
            {photoAffichee ? (
              <img
                src={photoAffichee}
                alt={nomAffiche}
                className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-lg"
              />
            ) : (
              <Avatar
                utilisateur={profilActuel}
                taille="xl"
                forme="carre"
                className="border-4 border-white shadow-lg"
              />
            )}

            <button
              type="button"
              onClick={() => champFichier.current?.click()}
              disabled={occupe}
              className="absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              aria-label="Changer la photo de profil"
              title="Changer la photo"
            >
              {envoi ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <Camera size={16} className="text-white" />
              )}
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
            <p className="text-lg font-bold leading-none text-blue-600">{completion}%</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Complete
            </p>
          </div>
        </div>

        <h2 className="truncate text-lg font-bold text-slate-900">{nomAffiche}</h2>
        <p className="truncate text-sm text-slate-500">@{profilActuel.username || 'membre'}</p>
        {profilActuel.email && (
          <p className="mt-1 truncate text-xs text-slate-400">{profilActuel.email}</p>
        )}
        {membreDepuis && (
          <p className="mt-2 text-xs text-slate-400">Membre depuis {membreDepuis}</p>
        )}

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {champsManquants.length === 0
            ? 'Votre profil est complet, bravo !'
            : `Encore ${champsManquants.length} information${champsManquants.length > 1 ? 's' : ''} à compléter : ${champsManquants.slice(0, 3).join(', ')}${champsManquants.length > 3 ? '...' : ''}.`}
        </p>

        <div
          onDragOver={(evenement) => {
            evenement.preventDefault()
            if (!occupe) setSurvol(true)
          }}
          onDragLeave={(evenement) => {
            if (!evenement.currentTarget.contains(evenement.relatedTarget)) {
              setSurvol(false)
            }
          }}
          onDrop={deposer}
          className={`mt-4 rounded-xl border-2 border-dashed p-3 text-center transition-colors ${
            survol
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
          }`}
        >
          <CloudUpload
            size={22}
            className={`mx-auto ${survol ? 'text-blue-500' : 'text-slate-400'}`}
          />
          <p className="mt-1.5 text-xs font-medium text-slate-700">
            {survol ? 'Déposez votre photo ici' : 'Glissez une photo ici'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">JPG, PNG, GIF ou WebP, 4 Mo maximum</p>
          <button
            type="button"
            onClick={() => champFichier.current?.click()}
            disabled={occupe}
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {envoi ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Televersement...
              </>
            ) : (
              <>
                <Camera size={14} /> Choisir une image
              </>
            )}
          </button>
        </div>

        {profilActuel.photo_profil && (
          <button
            type="button"
            onClick={supprimerPhoto}
            disabled={occupe}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {suppression ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Suppression...
              </>
            ) : (
              <>
                <Trash2 size={14} /> Supprimer la photo
              </>
            )}
          </button>
        )}

        <input
          ref={champFichier}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={choisirFichier}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        {message && (
          <div
            role="status"
            className={`mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
              message.type === 'succes'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'succes' ? (
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <span>{message.texte}</span>
          </div>
        )}
      </div>
    </aside>
  )
}

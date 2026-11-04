const LIBELLES_CHAMPS = {
  username: 'Pseudo',
  email: 'Email',
  mot_de_passe: 'Mot de passe',
  confirmer_mot_de_passe: 'Confirmation du mot de passe',
  ancien_mot_de_passe: 'Ancien mot de passe',
  nouveau_mot_de_passe: 'Nouveau mot de passe',
  first_name: 'Prénom',
  last_name: 'Nom',
  presentation: 'Présentation',
  fonction: 'Fonction',
  entreprise: 'Entreprise',
  pays: 'Pays',
  site_web: 'Site web',
  photo_profil: 'Photo de profil',
}

function texteDeValeur(valeur) {
  if (typeof valeur === 'string') return valeur
  if (Array.isArray(valeur)) return valeur.filter((item) => typeof item === 'string').join(' ')
  return ''
}

/**
 * Transforme une erreur axios en message lisible pour l'utilisateur.
 * Gere les erreurs DRF : { detail }, { champ: [messages] } et non_field_errors.
 */
export function extraireMessageErreur(erreur, repli = 'Une erreur est survenue.') {
  if (!erreur) return repli
  if (!erreur.response) return erreur.message || repli

  const donnees = erreur.response.data
  if (!donnees) return repli
  if (typeof donnees === 'string') return donnees

  if (Array.isArray(donnees)) {
    const messages = donnees.map(texteDeValeur).filter(Boolean)
    return messages.length ? messages.join(' ') : repli
  }

  if (typeof donnees === 'object') {
    const messages = []
    for (const [champ, valeur] of Object.entries(donnees)) {
      const texte = texteDeValeur(valeur)
      if (!texte) continue
      const libelle = LIBELLES_CHAMPS[champ]
      messages.push(libelle ? `${libelle} : ${texte}` : texte)
    }
    if (messages.length) return messages.join(' ')
  }

  return repli
}

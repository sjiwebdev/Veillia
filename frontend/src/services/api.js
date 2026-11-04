import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

const CLE_JETON = 'veillia_token'
const CLE_RAFRAICHISSEMENT = 'veillia_refresh'
const CLE_UTILISATEUR = 'veillia_user'

function viderSession() {
  localStorage.removeItem(CLE_JETON)
  localStorage.removeItem(CLE_RAFRAICHISSEMENT)
  localStorage.removeItem(CLE_UTILISATEUR)
  window.dispatchEvent(new Event('veillia:session-expiree'))
}

let rafraichissementEnCours = null

async function rafraichirJeton() {
  const refresh = localStorage.getItem(CLE_RAFRAICHISSEMENT)
  if (!refresh) throw new Error('Session expirée')

  const { data } = await axios.post('/api/jeton/rafraichir/', { refresh })
  localStorage.setItem(CLE_JETON, data.access)
  if (data.refresh) localStorage.setItem(CLE_RAFRAICHISSEMENT, data.refresh)
  return data.access
}

// Ajoute le JWT a chaque requete.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLE_JETON)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// En cas de 401, tente un rafraichissement une seule fois puis rejoue la requete.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requete = error.config
    const statut = error.response?.status
    const url = requete?.url || ''
    const routeAuthentification =
      url.includes('/connexion/') ||
      url.includes('/inscription/') ||
      url.includes('/jeton/rafraichir/')

    if (statut !== 401 || !requete || requete._dejaReessaye || routeAuthentification) {
      return Promise.reject(error)
    }

    requete._dejaReessaye = true

    try {
      rafraichissementEnCours = rafraichissementEnCours || rafraichirJeton()
      const access = await rafraichissementEnCours
      rafraichissementEnCours = null
      requete.headers = {
        ...requete.headers,
        Authorization: `Bearer ${access}`,
      }
      return api(requete)
    } catch (erreurRafraichissement) {
      rafraichissementEnCours = null
      viderSession()
      return Promise.reject(erreurRafraichissement)
    }
  }
)

export const auth = {
  inscription: (donnees) => api.post('/inscription/', donnees),
  connexion: (donnees) => api.post('/connexion/', donnees),
  rafraichir: (refresh) => api.post('/jeton/rafraichir/', { refresh }),
  profil: () => api.get('/profil/'),
  mettreAJourProfil: (donnees) => api.patch('/profil/', donnees),
  televerserPhoto: (fichier) => {
    const donnees = new FormData()
    donnees.append('photo', fichier)
    return api.post('/profil/photo/', donnees)
  },
  supprimerPhoto: () => api.delete('/profil/photo/'),
  changerMotDePasse: (donnees) => api.post('/profil/mot-de-passe/', donnees),
  profilPublic: (pseudo) => api.get(`/profil/${pseudo}/`),
  comptesReseaux: () => api.get('/comptes-reseaux/'),
  ajouterCompteReseau: (donnees) => api.post('/comptes-reseaux/', donnees),
  modifierCompteReseau: (id, donnees) => api.patch(`/comptes-reseaux/${id}/`, donnees),
  supprimerCompteReseau: (id) => api.delete(`/comptes-reseaux/${id}/`),
}

export const articles = {
  liste: (params = {}) => api.get('/articles/', { params }),
  une: () => api.get('/articles/une/'),
  duJour: (params = {}) => api.get('/articles/du_jour/', { params }),
  detail: (identifiant) => api.get(`/articles/${identifiant}/`),
  similaires: (identifiant) => api.get(`/articles/${identifiant}/similaires/`),
  clic: (identifiant, donnees = {}) => api.post(`/articles/${identifiant}/clic/`, donnees),
}

export const sources = {
  liste: (params = {}) => api.get('/sources/', { params }),
}

export const sujets = {
  liste: () => api.get('/sujets/'),
  avecArticles: () => api.get('/sujets/avec_articles/'),
  suivre: (donnees) => api.post('/suivis-sujets/', donnees),
  mesSuivis: () => api.get('/suivis-sujets/'),
  modifierSuivi: (id, donnees) => api.patch(`/suivis-sujets/${id}/`, donnees),
  arreterSuivi: (id) => api.delete(`/suivis-sujets/${id}/`),
}

export const auteurs = {
  liste: (params = {}) => api.get('/auteurs/', { params }),
}

export const etiquettes = {
  liste: () => api.get('/etiquettes/'),
}

export const recommandations = {
  liste: () => api.get('/recommandations/'),
  generer: (params = {}) => api.post('/recommandations/generer/', params),
  moteur: () => api.get('/recommandations/moteur/'),
  instantanees: (destinataire, params = {}) =>
    api.get('/recommandations/instantanees/', { params: { destinataire, ...params } }),
  clic: (id) => api.post(`/recommandations/${id}/clic/`),
}

export const historiques = {
  liste: (params = {}) => api.get('/historique/', { params }),
  ajouter: (donnees) => api.post('/historique/', donnees),
}

export const tableauxDeBord = {
  stats: () => api.get('/tableau-de-bord/'),
}

export const panorama = {
  stats: () => api.get('/panorama/'),
}

export const canaux = {
  liste: () => api.get('/canaux/'),
  ajouter: (donnees) => api.post('/canaux/', donnees),
}

export const resumes = {
  liste: () => api.get('/resumes/'),
}

/** Accepte les listes simples et les reponses paginees de DRF. */
export function extraireListe(donnees) {
  if (Array.isArray(donnees)) return donnees
  return donnees?.results ?? []
}

export default api

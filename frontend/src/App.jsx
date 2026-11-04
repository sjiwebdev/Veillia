import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { FournisseurAuth } from '@/context/AuthContext'
import { RouteProtegee, RouteInvite } from '@/components/RouteProtegee'
import PageAccueil from '@/pages/PageAccueil'
import PagePourVous from '@/pages/PagePourVous'
import PageSuivis from '@/pages/PageSuivis'
import PageSujetDetail from '@/pages/PageSujetDetail'
import PageArticleDetail from '@/pages/PageArticleDetail'
import PageConnexion from '@/pages/PageConnexion'
import PageInscription from '@/pages/PageInscription'
import PageParametres from '@/pages/PageParametres'
import PageProfil from '@/pages/PageProfil'
import PageTableauDeBord from '@/pages/PageTableauDeBord'
import PageNotifications from '@/pages/PageNotifications'
import PageSujets from '@/pages/PageSujets'
import PageRechercheAvancee from '@/pages/PageRechercheAvancee'
import PageArticlesDuJour from '@/pages/PageArticlesDuJour'
import { ErrorBoundary, PageIntrouvable } from '@/components/ErrorBoundary'

const router = createBrowserRouter([
  { path: '/', element: <PageAccueil /> },
  { path: '/login', element: <Navigate to="/connexion" replace /> },
  { path: '/recherche', element: <PageRechercheAvancee /> },
  { path: '/articles/du-jour', element: <PageArticlesDuJour /> },
  {
    path: '/pour-vous',
    element: (
      <RouteProtegee>
        <PagePourVous />
      </RouteProtegee>
    ),
  },
  {
    path: '/suivis',
    element: (
      <RouteProtegee>
        <PageSuivis />
      </RouteProtegee>
    ),
  },
  { path: '/sujets', element: <PageSujets /> },
  { path: '/sujet/:identifiant', element: <PageSujetDetail /> },
  { path: '/article/:identifiant', element: <PageArticleDetail /> },
  {
    path: '/connexion',
    element: (
      <RouteInvite>
        <PageConnexion />
      </RouteInvite>
    ),
  },
  {
    path: '/inscription',
    element: (
      <RouteInvite>
        <PageInscription />
      </RouteInvite>
    ),
  },
  {
    path: '/parametres',
    element: (
      <RouteProtegee>
        <PageParametres />
      </RouteProtegee>
    ),
  },
  { path: '/profil/:pseudo', element: <PageProfil /> },
  {
    path: '/tableau-de-bord',
    element: (
      <RouteProtegee>
        <PageTableauDeBord />
      </RouteProtegee>
    ),
  },
  {
    path: '/notifications',
    element: (
      <RouteProtegee>
        <PageNotifications />
      </RouteProtegee>
    ),
  },
  { path: '*', element: <PageIntrouvable /> },
])

export default function App() {
  return (
    <FournisseurAuth>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </FournisseurAuth>
  )
}

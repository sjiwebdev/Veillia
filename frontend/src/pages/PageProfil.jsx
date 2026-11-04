import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ListeRecommandations } from '@/components/ListeRecommandations'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { useRecommandations } from '@/hooks/useRecommandations'
import { auth } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'
import {
  ArrowRight,
  Building2,
  Calendar,
  Edit,
  Flag,
  Globe,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  User,
} from '@/components/ui/Icons'

function dateLongue(valeur) {
  if (!valeur) return null
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function PageProfil() {
  const { pseudo } = useParams()
  const { utilisateur: membreConnecte } = useAuth()
  const [profil, setProfil] = useState(null)
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const estMonProfil = membreConnecte?.username === pseudo
  const {
    elements: recommandationsListe,
    chargement: chargementRecommandations,
    generation: generationRecommandations,
    erreur: erreurRecommandations,
    generer: genererRecommandations,
    marquerClic,
  } = useRecommandations({
    nombre: 6,
    autoGenerer: estMonProfil,
    actif: estMonProfil,
  })

  useEffect(() => {
    let monte = true
    setCharge(true)
    setErreur('')

    auth
      .profilPublic(pseudo)
      .then((res) => {
        if (monte) setProfil(res.data)
      })
      .catch((erreurChargement) => {
        if (monte) {
          setErreur(
            extraireMessageErreur(erreurChargement, 'Ce membre est introuvable.')
          )
        }
      })
      .finally(() => {
        if (monte) setCharge(false)
      })

    return () => {
      monte = false
    }
  }, [pseudo])

  if (charge) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="mt-6 h-48 rounded-2xl bg-slate-200" />
        </div>
      </div>
    )
  }

  if (erreur || !profil) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="mb-4 flex justify-center">
              <User size={40} className="text-slate-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Membre introuvable</h1>
            <p className="mt-2 text-sm text-slate-500">
              {erreur || "Ce profil n'existe pas ou a été supprimé."}
            </p>
            <Link to="/" className="btn-primary mt-6">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const nom = profil.nom_affiche || profil.username
  const inscription = dateLongue(profil.inscrit_le)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-32"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)',
            }}
          />
          <div className="px-5 pb-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="-mt-12 flex min-w-0 items-end gap-4">
                <Avatar
                  utilisateur={profil}
                  taille="xl"
                  forme="carre"
                  className="border-4 border-white bg-white shadow-lg"
                />
                <div className="min-w-0 pb-1">
                  <h1 className="break-words text-2xl font-bold text-slate-900">{nom}</h1>
                  <p className="truncate text-sm text-slate-500">@{profil.username}</p>
                </div>
              </div>

              {estMonProfil && (
                <Link to="/parametres" className="btn-outline shrink-0">
                  <Edit size={16} className="mr-2" /> Modifier mon profil
                </Link>
              )}
            </div>

            {(profil.fonction || profil.entreprise) && (
              <p className="mt-4 flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
                {profil.fonction && <span className="font-medium">{profil.fonction}</span>}
                {profil.fonction && profil.entreprise && (
                  <span className="text-slate-400">chez</span>
                )}
                {profil.entreprise && <span>{profil.entreprise}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">À propos</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {profil.presentation ||
                "Ce membre n'a pas encore écrit de présentation. Revenez plus tard pour en savoir plus."}
            </p>
          </section>

          <aside className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Informations
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Flag size={16} className="shrink-0 text-slate-400" />
                  <span>{profil.pays || 'Pays non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 size={16} className="shrink-0 text-slate-400" />
                  <span>{profil.entreprise || 'Entreprise non renseignée'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={16} className="shrink-0 text-slate-400" />
                  <span>{inscription ? `Membre depuis ${inscription}` : 'Membre de VEILLIA'}</span>
                </div>
                {profil.site_web && (
                  <a
                    href={profil.site_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 break-all text-blue-600 hover:underline"
                  >
                    <Globe size={16} className="shrink-0" />
                    <span className="truncate">{profil.site_web}</span>
                  </a>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-5">
              <h2 className="text-sm font-bold text-slate-900">Envie de suivre ce membre ?</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Explorez les familles de sujets et créez votre propre veille personnalisée.
              </p>
              <Link to="/sujets" className="btn-primary mt-4 w-full">
                Explorer les sujets <ArrowRight size={16} className="ml-2" />
              </Link>
            </section>
          </aside>
        </div>

        {estMonProfil && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Sparkles size={18} className="text-violet-500" /> Vos recommandations
                </h2>
                <p className="text-sm text-slate-500">
                  Des articles choisis à partir de vos familles suivies et de vos lectures.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => genererRecommandations()}
                  disabled={generationRecommandations}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
                >
                  {generationRecommandations ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                  Actualiser
                </button>
                <Link
                  to="/pour-vous"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                >
                  Tout voir <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <ListeRecommandations
              elements={recommandationsListe}
              chargement={chargementRecommandations}
              generation={generationRecommandations}
              erreur={erreurRecommandations}
              nombre={4}
              variante="grille"
              afficherRaison
              onClic={marquerClic}
              videTitre="Votre fil est encore vide"
              videTexte="Suivez quelques familles puis générez vos recommandations pour retrouver ici des articles adaptés."
              videAction={{
                label: 'Générer mes recommandations',
                onClick: () => genererRecommandations(),
              }}
            />
          </section>
        )}

        {estMonProfil && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={16} className="text-slate-400" />
              Votre email est privé et n'apparaît jamais sur votre profil public.
            </div>
            <Link to="/parametres#securite" className="text-sm font-medium text-blue-600 hover:underline">
              Gerer ma securite
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

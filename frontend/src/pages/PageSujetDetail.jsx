import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArticleCard } from '@/components/ArticleCard'
import { ListeRecommandations } from '@/components/ListeRecommandations'
import { Navbar, BoutonRetour } from '@/components/Navbar'
import { BasculeAffichage } from '@/components/ui/BasculeAffichage'
import { useAuth } from '@/context/AuthContext'
import { useRecommandations } from '@/hooks/useRecommandations'
import { sujets, articles, extraireListe } from '@/services/api'
import { useAffichage } from '@/hooks/useAffichage'
import { ArrowRight, Newspaper, Sparkles, Target } from '@/components/ui/Icons'

function couleurSujet(sujet) {
  return /^#[0-9a-f]{6}$/i.test(sujet?.couleur || '') ? sujet.couleur : '#2563eb'
}

export default function PageSujetDetail() {
  const { identifiant } = useParams()
  const { utilisateur } = useAuth()
  const [sujet, setSujet] = useState(null)
  const [listeArticles, setListeArticles] = useState([])
  const [autresSujets, setAutresSujets] = useState([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [affichage, setAffichage] = useAffichage()
  const {
    elements: recommandationsListe,
    marquerClic,
  } = useRecommandations({ nombre: 24, actif: Boolean(utilisateur) })

  const dejaAffiches = new Set(
    listeArticles.map((article) => article.identifiant).filter(Boolean)
  )
  const suggestionsFamille = recommandationsListe.filter((element) => {
    const article = element.article
    if (!article || dejaAffiches.has(article.identifiant)) return false
    return (article.sujets || []).some(
      (sujetArticle) =>
        sujetArticle.identifiant === identifiant || sujetArticle.nom === sujet?.nom
    )
  })

  useEffect(() => {
    let monte = true
    setCharge(true)
    setErreur('')

    Promise.allSettled([sujets.liste(), articles.liste({ sujet: identifiant })]).then(
      ([resultatSujets, resultatArticles]) => {
        if (!monte) return

        if (resultatSujets.status === 'fulfilled') {
          const tous = extraireListe(resultatSujets.value.data)
          const trouve = tous.find((element) => element.identifiant === identifiant)
          setSujet(trouve || null)
          setAutresSujets(tous.filter((element) => element.identifiant !== identifiant).slice(0, 6))
        } else {
          setErreur('Impossible de charger cette famille de sujets.')
        }

        if (resultatArticles.status === 'fulfilled') {
          setListeArticles(extraireListe(resultatArticles.value.data))
        }

        setCharge(false)
      }
    )

    return () => {
      monte = false
    }
  }, [identifiant])

  if (charge) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-24 rounded-2xl bg-slate-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((cle) => (
              <div key={cle} className="h-40 rounded-xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!sujet) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <Target size={40} className="mx-auto mb-3 text-slate-400" />
            <h1 className="text-xl font-bold text-slate-900">Famille introuvable</h1>
            <p className="mt-2 text-sm text-slate-500">
              {erreur || "Cette famille de sujets n'existe pas ou a été désactivée."}
            </p>
            <Link to="/sujets" className="btn-primary mt-6">
              Voir toutes les familles
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BoutonRetour onClick={() => window.history.back()} />

        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
                style={{ backgroundColor: couleurSujet(sujet) }}
              >
                {sujet.nom.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Famille de sujets
                </p>
                <h1 className="break-words text-2xl font-bold text-slate-900">{sujet.nom}</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  {sujet.description || 'Articles de cette famille de sujets.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                {listeArticles.length} article{listeArticles.length > 1 ? 's' : ''}
              </span>
              {listeArticles.length > 0 && (
                <BasculeAffichage valeur={affichage} onChange={setAffichage} />
              )}
              <Link to="/suivis" className="btn-outline">
                Gerer mes suivis <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0">
            {listeArticles.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Newspaper size={36} className="mx-auto mb-3 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-900">Aucun article pour le moment</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cette famille n'a pas encore d'article publié. Revenez plus tard.
                </p>
              </div>
            ) : affichage === 'grille' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {listeArticles.map((article) => (
                  <ArticleCard key={article.identifiant} article={article} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {listeArticles.map((article) => (
                  <ArticleCard
                    key={article.identifiant}
                    article={article}
                    variante="ligne"
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            {autresSujets.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Voir aussi
                </h2>
                <ul className="mt-3 space-y-1">
                  {autresSujets.map((autre) => (
                    <li key={autre.identifiant}>
                      <Link
                        to={`/sujet/${autre.identifiant}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: couleurSujet(autre) }}
                        />
                        <span className="truncate">{autre.nom}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-5">
              <h2 className="text-sm font-bold text-slate-900">Personnalisez votre veille</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Suivez vos familles préférées pour recevoir des recommandations adaptées.
              </p>
              <Link to="/suivis" className="btn-primary mt-4 w-full">
                Choisir mes familles
              </Link>
            </section>
          </aside>
        </div>

        {suggestionsFamille.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Sparkles size={18} className="text-violet-500" /> Ailleurs dans {sujet.nom}
                </h2>
                <p className="text-sm text-slate-500">
                  D'autres articles de cette famille retenus pour vous.
                </p>
              </div>
              <Link
                to="/pour-vous"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
              >
                Tout voir <ArrowRight size={15} />
              </Link>
            </div>
            <ListeRecommandations
              elements={suggestionsFamille}
              nombre={4}
              variante="grille"
              afficherRaison
              onClic={marquerClic}
              masquerVide
            />
          </section>
        )}
      </main>
    </div>
  )
}

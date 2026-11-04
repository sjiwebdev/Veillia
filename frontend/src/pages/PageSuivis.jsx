import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ListeRecommandations } from '@/components/ListeRecommandations'
import { useRecommandations } from '@/hooks/useRecommandations'
import { sujets, extraireListe } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
} from '@/components/ui/Icons'

function couleurSujet(sujet) {
  return /^#[0-9a-f]{6}$/i.test(sujet?.couleur || '') ? sujet.couleur : '#2563eb'
}

export default function PageSuivis() {
  const [suivis, setSuivis] = useState([])
  const [tousLesSujets, setTousLesSujets] = useState([])
  const [charge, setCharge] = useState(true)
  const [actionEnCours, setActionEnCours] = useState(null)
  const [message, setMessage] = useState(null)
  const {
    elements: recommandationsListe,
    chargement: chargementRecommandations,
    generation: generationRecommandations,
    erreur: erreurRecommandations,
    generer: genererRecommandations,
    marquerClic,
  } = useRecommandations({ nombre: 6 })

  useEffect(() => {
    let monte = true
    Promise.allSettled([sujets.mesSuivis(), sujets.liste()]).then(
      ([resultatSuivis, resultatSujets]) => {
        if (!monte) return
        if (resultatSuivis.status === 'fulfilled') {
          setSuivis(extraireListe(resultatSuivis.value.data))
        }
        if (resultatSujets.status === 'fulfilled') {
          setTousLesSujets(extraireListe(resultatSujets.value.data))
        }
        setCharge(false)
      }
    )
    return () => {
      monte = false
    }
  }, [])

  const suivisParSujet = useMemo(() => {
    const index = new Map()
    for (const suivi of suivis) index.set(suivi.sujet, suivi)
    return index
  }, [suivis])

  const sujetsSuivis = useMemo(
    () =>
      suivis
        .map((suivi) => {
          const sujet = tousLesSujets.find((element) => element.id === suivi.sujet)
          return {
            ...suivi,
            sujetDetail: sujet,
            nom: suivi.nom_sujet || sujet?.nom || 'Famille',
            identifiant: suivi.identifiant_sujet || sujet?.identifiant,
            couleur: suivi.couleur_sujet || sujet?.couleur,
            description: suivi.description_sujet || sujet?.description,
            nombre_articles: sujet?.nombre_articles ?? 0,
          }
        })
        .filter((suivi) => suivi.identifiant),
    [suivis, tousLesSujets]
  )

  const sujetsADecouvrir = useMemo(
    () => tousLesSujets.filter((sujet) => !suivisParSujet.has(sujet.id)),
    [tousLesSujets, suivisParSujet]
  )

  const suivre = async (sujet) => {
    if (actionEnCours) return
    setActionEnCours(`suivre-${sujet.id}`)
    setMessage(null)
    try {
      const res = await sujets.suivre({ sujet: sujet.id })
      setSuivis((actuel) => [...actuel, res.data])
      setMessage({
        type: 'succes',
        texte: `Vous suivez maintenant ${sujet.nom}.`,
      })
      genererRecommandations({ silencieux: true })
    } catch (erreur) {
      setMessage({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'Impossible de suivre cette famille.'),
      })
    } finally {
      setActionEnCours(null)
    }
  }

  const arreter = async (suivi) => {
    if (!suivi || actionEnCours) return
    setActionEnCours(`arreter-${suivi.id}`)
    setMessage(null)
    try {
      await sujets.arreterSuivi(suivi.id)
      setSuivis((actuel) => actuel.filter((element) => element.id !== suivi.id))
      setMessage({ type: 'succes', texte: `Vous ne suivez plus ${suivi.nom}.` })
      genererRecommandations({ silencieux: true })
    } catch (erreur) {
      setMessage({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, 'Impossible de retirer ce suivi.'),
      })
    } finally {
      setActionEnCours(null)
    }
  }

  const majPoidsLocal = (suiviId, poids) => {
    setSuivis((actuel) =>
      actuel.map((element) => (element.id === suiviId ? { ...element, poids } : element))
    )
  }

  const enregistrerPoids = async (suiviId) => {
    const suivi = suivis.find((element) => element.id === suiviId)
    if (!suivi) return
    try {
      await sujets.modifierSuivi(suiviId, { poids: Number(suivi.poids) })
      genererRecommandations({ silencieux: true })
    } catch (erreur) {
      setMessage({
        type: 'erreur',
        texte: extraireMessageErreur(erreur, "Le niveau d'intérêt n'a pas pu être enregistré."),
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Ma veille
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Mes suivis</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Choisissez les familles qui vous interessent et ajustez leur importance pour
              personnaliser vos recommandations.
            </p>
          </div>
          <Link to="/sujets" className="btn-outline shrink-0">
            Parcourir toutes les familles <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>

        {message && (
          <div
            className={`mb-5 flex items-start gap-2 rounded-xl border p-4 text-sm ${
              message.type === 'succes'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'succes' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <span>{message.texte}</span>
          </div>
        )}

        {charge ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((cle) => (
              <div key={cle} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Familles suivies
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {sujetsSuivis.length}
                  </span>
                </h2>
              </div>

              {sujetsSuivis.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <Target size={36} className="mx-auto mb-3 text-slate-400" />
                  <h3 className="text-base font-bold text-slate-900">
                    Vous ne suivez encore aucune famille
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                    Choisissez vos premieres familles ci-dessous pour construire votre fil
                    personnalise.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sujetsSuivis.map((suivi) => (
                    <article
                      key={suivi.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/sujet/${suivi.identifiant}`}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                            style={{ backgroundColor: couleurSujet(suivi) }}
                          >
                            {suivi.nom.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-900 hover:text-blue-600">
                              {suivi.nom}
                            </span>
                            <span className="block text-xs text-slate-400">
                              {suivi.nombre_articles} article
                              {suivi.nombre_articles > 1 ? 's' : ''}
                            </span>
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => arreter(suivi)}
                          disabled={Boolean(actionEnCours)}
                          title={`Ne plus suivre ${suivi.nom}`}
                          aria-label={`Ne plus suivre ${suivi.nom}`}
                          className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                        >
                          {actionEnCours === `arreter-${suivi.id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            'Suivi'
                          )}
                        </button>
                      </div>

                      {suivi.description && (
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {suivi.description}
                        </p>
                      )}

                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Niveau d'intérêt</span>
                          <span className="font-semibold text-blue-600">
                            {Math.round((suivi.poids ?? 0) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={suivi.poids ?? 0.6}
                          onChange={(evenement) =>
                            majPoidsLocal(suivi.id, Number(evenement.target.value))
                          }
                          onMouseUp={() => enregistrerPoids(suivi.id)}
                          onTouchEnd={() => enregistrerPoids(suivi.id)}
                          onKeyUp={() => enregistrerPoids(suivi.id)}
                          className="w-full accent-blue-600"
                          aria-label={`Niveau d'intérêt pour ${suivi.nom}`}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Sparkles size={18} className="text-violet-500" /> Suggestions pour vous
                  </h2>
                  <p className="text-sm text-slate-500">
                    Ces articles évoluent avec les familles que vous suivez et leur intensité.
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
                nombre={6}
                variante="grille"
                afficherRaison
                onClic={marquerClic}
                videTitre="Aucune suggestion pour le moment"
                videTexte="Suivez une famille ci-dessous ou lancez une génération pour découvrir des articles adaptés."
                videAction={{
                  label: 'Générer mes suggestions',
                  onClick: () => genererRecommandations(),
                }}
              />
            </section>

            {sujetsADecouvrir.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-slate-900">Découvrir d'autres familles</h2>
                  <p className="text-sm text-slate-500">
                    Ajoutez un sujet en un clic, vous pourrez ajuster son poids ensuite.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sujetsADecouvrir.map((sujet) => {
                    const enCours = actionEnCours === `suivre-${sujet.id}`
                    return (
                      <article
                        key={sujet.id}
                        className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                            style={{ backgroundColor: couleurSujet(sujet) }}
                          >
                            {sujet.nom.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={`/sujet/${sujet.identifiant}`}
                              className="block truncate font-semibold text-slate-900 hover:text-blue-600"
                            >
                              {sujet.nom}
                            </Link>
                            <p className="text-xs text-slate-400">
                              {sujet.nombre_articles ?? 0} article
                              {(sujet.nombre_articles ?? 0) > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
                          {sujet.description || 'Suivez cette famille pour enrichir votre veille.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => suivre(sujet)}
                          disabled={Boolean(actionEnCours)}
                          className="mt-4 inline-flex items-center justify-center rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
                        >
                          {enCours ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                          ) : (
                            <Plus size={16} className="mr-2" />
                          )}
                          Suivre
                        </button>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            {sujetsADecouvrir.length === 0 && sujetsSuivis.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                <Check size={16} className="text-emerald-500" />
                Vous suivez toutes les familles disponibles. Pensez a ajuster leurs niveaux
                d'intérêt pour affiner vos recommandations.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

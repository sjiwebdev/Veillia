import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Navbar } from '@/components/Navbar'
import { ListeRecommandations } from '@/components/ListeRecommandations'
import { useAuth } from '@/context/AuthContext'
import { useRecommandations } from '@/hooks/useRecommandations'
import { tableauxDeBord } from '@/services/api'
import { extraireMessageErreur } from '@/services/erreurs'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Newspaper,
  RefreshCw,
  Target,
  TrendingUp,
} from '@/components/ui/Icons'

const COULEURS = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#f59e0b', '#0891b2']

function couleurValide(couleur) {
  return /^#[0-9a-f]{6}$/i.test(couleur || '') ? couleur : null
}

function dureeLisible(minutes) {
  const valeur = Number(minutes) || 0
  if (valeur < 60) return `${valeur} min`
  const heures = Math.floor(valeur / 60)
  const reste = valeur % 60
  return reste ? `${heures} h ${reste}` : `${heures} h`
}

function dateRelative(valeur) {
  if (!valeur) return ''
  try {
    return formatDistanceToNowStrict(parseISO(valeur), { addSuffix: true, locale: fr })
  } catch {
    return ''
  }
}

export default function PageTableauDeBord() {
  const { utilisateur } = useAuth()
  const [stats, setStats] = useState(null)
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const {
    elements: listeRecommandations,
    chargement: chargementRecommandations,
    generation: regeneration,
    erreur: erreurRecommandations,
    message: messageRecommandations,
    generer: genererRecommandations,
    marquerClic,
  } = useRecommandations({ nombre: 20 })

  const chargerDonnees = useCallback(async () => {
    try {
      const resultatStats = await tableauxDeBord.stats()
      setStats(resultatStats.data)
    } catch (erreurStats) {
      setErreur(
        extraireMessageErreur(erreurStats, 'Impossible de charger vos statistiques.')
      )
    }
  }, [])

  useEffect(() => {
    let monte = true
    chargerDonnees().finally(() => {
      if (monte) setCharge(false)
    })
    return () => {
      monte = false
    }
  }, [chargerDonnees])

  const regenerer = async () => {
    if (regeneration) return
    const nouvelles = await genererRecommandations()
    if (nouvelles.length >= 0) {
      try {
        const resStats = await tableauxDeBord.stats()
        setStats(resStats.data)
      } catch {
        // Les statistiques seront rechargées au prochain affichage.
      }
    }
  }

  const activiteSujets = stats?.activite_sujets ?? []
  const lecturesParJour = stats?.lectures_par_jour ?? []
  const totalLecturesSemaine = lecturesParJour.reduce(
    (total, jour) => total + (jour.lectures || 0),
    0
  )
  const profilIncomplet =
    !utilisateur?.presentation && !utilisateur?.fonction && !utilisateur?.photo_profil
  const prenom = utilisateur?.first_name || utilisateur?.nom_affiche || 'vous'

  if (charge) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((cle) => (
              <div key={cle} className="h-28 rounded-xl bg-slate-200" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="h-80 rounded-2xl bg-slate-200" />
            <div className="h-80 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm sm:p-8"
          style={{
            backgroundImage:
              'linear-gradient(120deg, #1e3a8a 0%, #4f46e5 50%, #7e22ce 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.35), transparent 35%)',
            }}
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Bonjour {prenom},</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Votre tableau de bord</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
                {stats?.articles_lus
                  ? `Vous avez lu ${stats.articles_lus} article${stats.articles_lus > 1 ? 's' : ''}. Continuez votre veille là où vous l'avez laissée.`
                  : 'Suivez vos premières familles de sujets pour construire une veille vraiment personnalisée.'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={regenerer}
                disabled={regeneration}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {regeneration ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Generation...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" /> Regenerer mes recommandations
                  </>
                )}
              </button>
              <Link
                to="/pour-vous"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/20"
              >
                Voir mes recommandations <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {erreur && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{erreur}</span>
          </div>
        )}

        {erreurRecommandations && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <span>{erreurRecommandations}</span>
          </div>
        )}

        {messageRecommandations && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl border p-4 text-sm ${
              messageRecommandations.type === 'succes'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}
          >
            {messageRecommandations.type === 'succes' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <span>{messageRecommandations.texte}</span>
          </div>
        )}
        {profilIncomplet && (
          <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center">
            <span>
              Completez votre profil pour ameliorer la pertinence de vos recommandations.
            </span>
            <Link to="/parametres" className="shrink-0 font-semibold underline">
              Completer mon profil
            </Link>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CarteStat
            titre="Articles lus"
            valeur={stats?.articles_lus ?? 0}
            sousTitre={`${stats?.articles_lu_cette_semaine ?? 0} cette semaine`}
            icone={BookOpen}
            classeIcone="bg-blue-50 text-blue-600"
          />
          <CarteStat
            titre="Familles suivies"
            valeur={stats?.sujets_suivis ?? 0}
            sousTitre={`${stats?.sources_suivies ?? 0} source${(stats?.sources_suivies ?? 0) > 1 ? 's' : ''} suivie${(stats?.sources_suivies ?? 0) > 1 ? 's' : ''}`}
            icone={Target}
            classeIcone="bg-violet-50 text-violet-600"
          />
          <CarteStat
            titre="Temps de lecture"
            valeur={dureeLisible(stats?.temps_lecture_minutes)}
            sousTitre={`${dureeLisible(stats?.temps_lecture_semaine_minutes)} cette semaine`}
            icone={Clock}
            classeIcone="bg-emerald-50 text-emerald-600"
          />
          <CarteStat
            titre="Score d'intérêt"
            valeur={`${stats?.score_interet ?? 0}/100`}
            sousTitre={`${stats?.recommandations_du_jour ?? 0} recommandation${(stats?.recommandations_du_jour ?? 0) > 1 ? 's' : ''} aujourd'hui`}
            icone={TrendingUp}
            classeIcone="bg-amber-50 text-amber-600"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Activité par famille</h2>
                <p className="text-xs text-slate-500">Les sujets que vous lisez le plus</p>
              </div>
              <Activity size={18} className="text-slate-400" />
            </div>
            {activiteSujets.length === 0 ? (
              <EtatVide
                icone={Target}
                titre="Pas encore d'activité"
                texte="Suivez des familles et lisez quelques articles pour voir votre repartition ici."
                lien={{ to: '/sujets', label: 'Découvrir les familles' }}
              />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activiteSujets}
                      dataKey="valeur"
                      nameKey="nom"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {activiteSujets.map((entree, index) => (
                        <Cell
                          key={`${entree.nom}-${index}`}
                          fill={
                            couleurValide(entree.couleur) ||
                            COULEURS[index % COULEURS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Lectures des 7 derniers jours</h2>
                <p className="text-xs text-slate-500">{totalLecturesSemaine} lecture(s) cette semaine</p>
              </div>
              <Clock size={18} className="text-slate-400" />
            </div>
            {totalLecturesSemaine === 0 ? (
              <EtatVide
                icone={Newspaper}
                titre="Aucune lecture récente"
                texte="Ouvrez un article depuis votre fil pour commencer à suivre votre activité."
                lien={{ to: '/articles/du-jour', label: 'Lire les articles du jour' }}
              />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lecturesParJour}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="jour"
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={28}
                    />
                    <Tooltip />
                    <Bar dataKey="lectures" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Vos recommandations</h2>
                <p className="text-xs text-slate-500">
                  Selectionnees a partir de vos interets et de votre historique.
                </p>
              </div>
              <Link
                to="/pour-vous"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Tout voir
              </Link>
            </div>

            <ListeRecommandations
              elements={listeRecommandations}
              chargement={chargementRecommandations}
              generation={regeneration}
              erreur=""
              nombre={4}
              variante="ligne"
              afficherRaison
              onClic={marquerClic}
              videTitre="Aucune recommandation pour le moment"
              videTexte="Lancez une génération ou suivez de nouvelles familles pour alimenter votre fil."
              videAction={{ label: 'Générer maintenant', onClick: regenerer }}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Activité récente</h2>
              <p className="text-xs text-slate-500">Vos dernières lectures</p>
            </div>

            {(stats?.dernieres_lectures ?? []).length === 0 ? (
              <EtatVide
                icone={Clock}
                titre="Rien pour le moment"
                texte="Votre historique apparaîtra ici dès votre première lecture."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {(stats?.dernieres_lectures ?? []).slice(0, 6).map((lecture, index) => (
                  <li key={`${lecture.identifiant || 'lecture'}-${index}`}>
                    <Link
                      to={`/article/${lecture.identifiant}`}
                      className="group flex items-start gap-2 py-3"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-blue-600">
                          {lecture.titre || 'Article'}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {lecture.source || 'VEILLIA'}
                          {lecture.quand ? ` - ${dateRelative(lecture.quand)}` : ''}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function CarteStat({ titre, valeur, sousTitre, icone: Icone, classeIcone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{titre}</p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-900">{valeur}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{sousTitre}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classeIcone}`}>
          <Icone size={20} />
        </span>
      </div>
    </div>
  )
}

function EtatVide({ icone: Icone, titre, texte, lien, action }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center">
      <Icone size={28} className="mb-2 text-slate-400" />
      <p className="text-sm font-semibold text-slate-700">{titre}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">{texte}</p>
      {lien && (
        <Link to={lien.to} className="mt-3 text-sm font-medium text-blue-600 hover:underline">
          {lien.label}
        </Link>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-3 text-sm font-medium text-blue-600 hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Navbar, BoutonRetour } from '@/components/Navbar'
import { ArticleCard } from '@/components/ArticleCard'
import { articles, extraireListe } from '@/services/api'
import {
  AlertCircle,
  Check,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Newspaper,
  Share2,
  Sparkles,
} from '@/components/ui/Icons'

function dateRelative(valeur) {
  if (!valeur) return ''
  try {
    return formatDistanceToNowStrict(parseISO(valeur), { addSuffix: true, locale: fr })
  } catch {
    return ''
  }
}

function initialeSource(source) {
  return (source?.nom || '?').charAt(0).toUpperCase()
}

export default function PageArticleDetail() {
  const { identifiant } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [similaires, setSimilaires] = useState([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [lienCopie, setLienCopie] = useState(false)

  useEffect(() => {
    let monte = true
    setCharge(true)
    setErreur('')

    Promise.allSettled([articles.detail(identifiant), articles.similaires(identifiant)]).then(
      ([resultatDetail, resultatSimilaires]) => {
        if (!monte) return

        if (resultatDetail.status === 'fulfilled') {
          setArticle(resultatDetail.value.data)
        } else {
          setErreur('Cet article est introuvable ou a été retiré.')
        }

        if (resultatSimilaires.status === 'fulfilled') {
          setSimilaires(
            extraireListe(resultatSimilaires.value.data).filter(
              (element) => element.identifiant !== identifiant
            )
          )
        }

        setCharge(false)
      }
    )

    return () => {
      monte = false
    }
  }, [identifiant])

  const enregistrerClicSource = () => {
    if (!article) return
    // Le backend compte la sortie ; on n'ouvre surtout pas un second onglet.
    articles.clic(article.identifiant, { duree_secondes: 0 }).catch(() => {})
  }

  const partager = async () => {
    if (!article) return
    const url = `${window.location.origin}/article/${article.identifiant}`
    try {
      if (navigator.share) {
        await navigator.share({ title: article.titre, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setLienCopie(true)
      setTimeout(() => setLienCopie(false), 2500)
    } catch {
      // L'utilisateur a annule le partage : aucune erreur a afficher.
    }
  }

  if (charge) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-80 rounded-2xl bg-slate-200" />
          <div className="mt-6 h-8 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/3 rounded bg-slate-200" />
          <div className="mt-8 space-y-3">
            {[1, 2, 3, 4].map((cle) => (
              <div key={cle} className="h-4 rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <Newspaper size={40} className="mx-auto mb-3 text-slate-400" />
            <h1 className="text-xl font-bold text-slate-900">Article introuvable</h1>
            <p className="mt-2 text-sm text-slate-500">
              {erreur || "Cet article n'existe pas ou a été supprimé."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/" className="btn-primary">
                Retour à l'accueil
              </Link>
              <button type="button" onClick={() => navigate(-1)} className="btn-outline">
                Page precedente
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const source = article.source || {}
  const dateAffiche = dateRelative(article.publie_le)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <BoutonRetour onClick={() => navigate(-1)} />

        <div className="flex flex-col gap-8 xl:flex-row">
          <article className="min-w-0 xl:flex-1">
            <div className="relative h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-96">
              {article.image_couverture ? (
                <img
                  src={article.image_couverture}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon size={48} className="text-slate-400" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  {source.logo ? (
                    <img
                      src={source.logo}
                      alt={source.nom || 'Source'}
                      className="h-5 w-5 rounded bg-white/90 object-contain"
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold text-blue-600">
                      {initialeSource(source)}
                    </span>
                  )}
                  <span className="text-sm font-medium text-white">{source.nom || 'Source'}</span>
                  {article.a_la_une && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      a la une
                    </span>
                  )}
                </div>
              </div>
            </div>

            <header className="mt-6">
              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {article.titre}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Clock size={16} className="text-slate-400" />
                  {dateAffiche || 'Date inconnue'}
                </span>
                {article.duree_lecture ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {article.duree_lecture} min de lecture
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={partager}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:ml-auto sm:w-auto"
                >
                  {lienCopie ? (
                    <>
                      <Check size={14} className="text-emerald-500" /> Lien copie
                    </>
                  ) : (
                    <>
                      <Share2 size={14} /> Partager
                    </>
                  )}
                </button>
              </div>
            </header>

            {article.resume && (
              <p
                className={`mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  article.origine_resume === 'agent'
                    ? 'bg-violet-50 text-violet-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {article.origine_resume === 'agent' ? (
                  <Sparkles size={14} />
                ) : (
                  <Newspaper size={14} />
                )}
                {article.origine_resume === 'agent'
                  ? "Résumé généré par l'agent VEILLIA"
                  : 'Résumé issu de la source'}
              </p>
            )}

            <div className="prose prose-slate mt-3 max-w-none text-slate-600">
              {article.resume ? (
                article.resume.split('\n').map((paragraphe, index) => (
                  <p key={index} className="mb-5 text-base leading-relaxed">
                    {paragraphe}
                  </p>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Aucun résumé n'est disponible pour cet article. Consultez la source pour lire
                  l'article complet.
                </p>
              )}
            </div>

            {(article.sujets || []).length > 0 || (article.etiquettes || []).length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {(article.sujets || []).map((sujet) => (
                  <Link
                    key={sujet.identifiant}
                    to={`/sujet/${sujet.identifiant}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {sujet.nom}
                  </Link>
                ))}
                {(article.etiquettes || []).map((etiquette) => (
                  <span
                    key={etiquette.nom}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500"
                  >
                    #{etiquette.nom}
                  </span>
                ))}
              </div>
            ) : null}

            {(article.auteurs || []).length > 0 ? (
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Auteurs
                </span>
                {(article.auteurs || []).map((auteur) => (
                  <span
                    key={auteur.identifiant || auteur.nom}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    {auteur.photo ? (
                      <img
                        src={auteur.photo}
                        alt={auteur.nom}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                        {(auteur.nom || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                    {auteur.nom}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <ExternalLink size={16} className="text-blue-600" />
                <span className="font-medium">Lire l'article complet sur {source.nom || 'la source'}</span>
              </div>
              <a
                href={article.lien}
                target="_blank"
                rel="noopener noreferrer"
                onClick={enregistrerClicSource}
                className="btn-primary shrink-0"
              >
                Ouvrir la source <ExternalLink size={16} className="ml-2" />
              </a>
            </div>

            {article.lien ? (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                VEILLIA affiche un résumé. Le contenu complet reste hébergé par la source
                d'origine.
              </p>
            ) : null}
          </article>

          <aside className="min-w-0 xl:w-80 xl:shrink-0">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">Vous aimerez aussi</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {similaires.length}
                </span>
              </div>
              {similaires.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Aucun article similaire pour le moment.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {similaires.slice(0, 6).map((similaire) => (
                    <ArticleCard
                      key={similaire.identifiant}
                      article={similaire}
                      variante="compacte"
                    />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

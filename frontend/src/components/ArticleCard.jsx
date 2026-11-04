import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, Clock as ClockIcon } from '@/components/ui/Icons'
import { articles } from '@/services/api'

function dateLisible(date) {
  if (!date) return ''
  try {
    return formatDistanceToNowStrict(parseISO(date), {
      addSuffix: true,
      locale: fr,
    })
  } catch {
    return ''
  }
}

function initialeSource(source) {
  return (source?.nom || '?').charAt(0).toUpperCase()
}

function IconeSource({ source, compacte = false }) {
  const taille = compacte ? 'h-3.5 w-3.5' : 'h-4 w-4'
  if (source?.logo) {
    return (
      <img
        src={source.logo}
        alt={source.nom || 'Source'}
        className={`${taille} shrink-0 rounded bg-white object-contain ring-1 ring-slate-100`}
        loading="lazy"
      />
    )
  }
  return (
    <span
      className={`${taille} flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 ${
        compacte ? 'text-[8px]' : 'text-[9px]'
      }`}
    >
      {initialeSource(source)}
    </span>
  )
}

export function ArticleCard({ article, variante = 'petite', onClic }) {
  const navigate = useNavigate()

  const gererClic = () => {
    // Enregistrement du clic en arriere-plan : la navigation ne doit pas attendre.
    articles.clic(article.identifiant, { duree_secondes: 0 }).catch(() => {})
    if (onClic) {
      onClic(article)
      return
    }
    navigate(`/article/${article.identifiant}`)
  }

  const gererTouche = (evenement) => {
    if (evenement.key === 'Enter' || evenement.key === ' ') {
      evenement.preventDefault()
      gererClic()
    }
  }

  const accessibilite = {
    role: 'link',
    tabIndex: 0,
    onKeyDown: gererTouche,
  }

  const dateAffiche = dateLisible(article.publie_le)
  const source = article.source || {}
  const auteurs = (article.auteurs || [])
    .slice(0, 2)
    .map((auteur) => auteur.nom)
    .join(', ')

  if (variante === 'grande') {
    return (
      <article
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
        onClick={gererClic}
        {...accessibilite}
      >
        <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100 sm:h-52">
          {article.image_couverture ? (
            <img
              src={article.image_couverture}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <ImageIcon size={48} />
            </div>
          )}
          {article.a_la_une && (
            <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              a la une
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="mb-2 flex min-w-0 items-center gap-2">
            <IconeSource source={source} />
            <span className="truncate text-xs font-medium text-slate-500">
              {source.nom || 'Source'}
            </span>
          </div>
          <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
            {article.titre}
          </h3>
          {article.resume ? (
            <p className="mb-3 line-clamp-2 flex-1 text-sm text-slate-600">{article.resume}</p>
          ) : (
            <span className="flex-1" />
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="flex shrink-0 items-center gap-1">
              <ClockIcon size={12} />
              <span>{dateAffiche}</span>
            </span>
            {auteurs && (
              <span className="min-w-0 max-w-full truncate text-blue-600">Par {auteurs}</span>
            )}
          </div>
        </div>
      </article>
    )
  }

  if (variante === 'ligne') {
    return (
      <article
        className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-slate-300 hover:shadow-sm sm:gap-4 sm:p-4"
        onClick={gererClic}
        {...accessibilite}
      >
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-40">
          {article.image_couverture ? (
            <img
              src={article.image_couverture}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon size={28} />
            </div>
          )}
          {article.a_la_une && (
            <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              a la une
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-1 flex min-w-0 items-center gap-2">
            <IconeSource source={source} />
            <span className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {source.nom || 'Source'}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 sm:text-base">
            {article.titre}
          </h3>
          {article.resume ? (
            <p className="mt-1 hidden line-clamp-2 text-sm text-slate-600 sm:block">
              {article.resume}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 sm:mt-2">
            <span className="flex shrink-0 items-center gap-1">
              <ClockIcon size={12} />
              <span>{dateAffiche}</span>
            </span>
            {auteurs && (
              <span className="min-w-0 truncate text-blue-600">Par {auteurs}</span>
            )}
          </div>
        </div>
      </article>
    )
  }

  if (variante === 'compacte') {
    return (
      <article
        className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-blue-200 hover:bg-blue-50/30"
        onClick={gererClic}
        {...accessibilite}
      >
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {article.image_couverture ? (
            <img
              src={article.image_couverture}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon size={22} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-1 flex min-w-0 items-center gap-1.5">
            <IconeSource source={source} compacte />
            <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              {source.nom || 'Source'}
            </span>
          </div>
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
            {article.titre}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
            <ClockIcon size={11} className="shrink-0" />
            <span className="truncate">{dateAffiche}</span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-slate-300 hover:shadow-sm"
      onClick={gererClic}
      {...accessibilite}
    >
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {article.image_couverture ? (
          <img
            src={article.image_couverture}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={24} />
          </div>
        )}
        {article.a_la_une && (
          <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            a la une
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <IconeSource source={source} />
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {source.nom || 'Source'}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
          {article.titre}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
          <span className="flex shrink-0 items-center gap-1">
            <ClockIcon size={12} />
            <span>{dateAffiche}</span>
          </span>
          {auteurs && <span className="min-w-0 truncate text-blue-600">{auteurs}</span>}
        </div>
      </div>
    </article>
  )
}

export function CarrouselArticles({
  titre,
  articles: listeArticles,
  variant = 'petite',
  onVoirTout,
}) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{titre}</h2>
        {onVoirTout && (
          <button
            type="button"
            onClick={onVoirTout}
            className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
          >
            Voir tout
          </button>
        )}
      </div>
      <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
        {listeArticles.map((article) => (
          <div key={article.identifiant} className="w-[85vw] max-w-72 shrink-0 sm:w-72">
            <ArticleCard article={article} variante={variant} />
          </div>
        ))}
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { Shield, Target, Zap } from './Icons'

const AVANTAGES = [
  {
    icone: Target,
    titre: 'Une veille qui vous ressemble',
    texte: 'Suivez les familles, les sources et les auteurs qui comptent pour vous.',
  },
  {
    icone: Zap,
    titre: 'Des recommandations utiles',
    texte: 'Notre moteur classe les articles selon vos intérêts et votre historique.',
  },
  {
    icone: Shield,
    titre: 'Des sources fiables',
    texte: "Des flux vérifiés, sans bruit, pour garder l'essentiel de l'actualité.",
  },
]

/**
 * Mise en page commune aux écrans de connexion et d'inscription.
 * Le panneau de gauche presente la marque, le panneau de droite porte le formulaire.
 */
export function AuthLayout({ titre, sousTitre, children, piedDePage }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 15%, rgba(59,130,246,0.45), transparent 42%), radial-gradient(circle at 85% 20%, rgba(168,85,247,0.35), transparent 40%), radial-gradient(circle at 55% 95%, rgba(16,185,129,0.28), transparent 45%)',
          }}
        />
        <div className="relative">
          <Link to="/" className="inline-flex items-center">
            <Logo taille="grand" variante="clair" />
          </Link>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-300">
            L actualite data science et intelligence artificielle, agregee depuis des sources
            fiables et classee pour vous.
          </p>
        </div>

        <div className="relative space-y-6">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            Votre veille technologique, enfin personnalisée.
          </h2>
          <ul className="space-y-5">
            {AVANTAGES.map(({ icone: Icone, titre: titreAvantage, texte }) => (
              <li key={titreAvantage} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-300 ring-1 ring-white/15">
                  <Icone size={18} className="text-blue-300" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{titreAvantage}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{texte}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          VEILLIA - Agrégateur d'actualité data science et IA
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/" className="inline-flex items-center">
              <Logo taille="normal" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titre}</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{sousTitre}</p>
            <div className="mt-6">{children}</div>
          </div>

          {piedDePage && <div className="mt-6 text-center text-sm text-slate-600">{piedDePage}</div>}
          <p className="mt-8 text-center text-xs text-slate-400">
            En continuant, vous acceptez les conditions d'utilisation de VEILLIA.
          </p>
        </div>
      </main>
    </div>
  )
}

/** Champ de formulaire avec icone optionnelle et message d'erreur. */
export function ChampAuth({
  label,
  icone: Icone,
  erreur,
  aide,
  children,
  pour,
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={pour} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {Icone && (
          <Icone
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        {children}
      </div>
      {erreur ? (
        <p className="text-xs font-medium text-red-600">{erreur}</p>
      ) : aide ? (
        <p className="text-xs text-slate-400">{aide}</p>
      ) : null}
    </div>
  )
}

import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

type SignInProps = {
  isConfigured: boolean
  isSigningIn: boolean
  onSignIn: () => void
}

export function SignIn({ isConfigured, isSigningIn, onSignIn }: SignInProps) {
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#03080c] text-[var(--dd-text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_10%,rgba(250,204,21,0.12),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(59,130,246,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_48%)]" />
      <div className="relative mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_420px] items-center gap-[var(--dd-space-9)] px-[var(--dd-space-8)] py-[var(--dd-space-8)] max-[900px]:grid-cols-1 max-[900px]:px-[var(--dd-space-5)]">
        <section className="max-w-[620px]">
          <div className="flex items-center gap-[var(--dd-space-3)]">
            <img alt="" className="h-12 w-auto" src="/logo.png" />
            <strong className="text-[1.45rem] font-extrabold leading-none">DawnDesk</strong>
          </div>
          <p className="m-0 mt-[var(--dd-space-8)] text-[0.95rem] font-bold text-[var(--dd-accent)]">
            Your plugin-first AI workspace
          </p>
          <h1 className="m-0 mt-[var(--dd-space-3)] text-[clamp(2.8rem,6vw,5.4rem)] font-extrabold leading-[0.95] tracking-normal">
            Sign in to start your desk.
          </h1>
          <p className="m-0 mt-[var(--dd-space-5)] max-w-[520px] text-[1.05rem] leading-8 text-[var(--dd-text-secondary)]">
            Access your tools, chats, plugins, and workspace context from one calm desktop shell.
          </p>
          <div className="mt-[var(--dd-space-8)] grid gap-[var(--dd-space-3)] text-[0.95rem] text-[var(--dd-text-secondary)]">
            {['Plugin marketplace ready', 'AI chat workspace', 'Local-first desktop shell'].map((item) => (
              <span className="inline-flex items-center gap-[var(--dd-space-3)]" key={item}>
                <CheckCircle2 className="text-[var(--dd-accent)]" size={18} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--dd-radius-xl)] border border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(8,14,20,0.88)] p-[var(--dd-space-6)] shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="grid size-14 place-items-center rounded-[var(--dd-radius-lg)] bg-[rgba(250,204,21,0.12)] text-[var(--dd-accent)] shadow-[inset_0_0_0_1px_rgba(250,204,21,0.2)]">
            <ShieldCheck size={26} aria-hidden="true" />
          </div>
          <h2 className="m-0 mt-[var(--dd-space-5)] text-[1.65rem] font-extrabold">
            Welcome back
          </h2>
          <p className="m-0 mt-[var(--dd-space-2)] text-[0.95rem] leading-7 text-[var(--dd-text-secondary)]">
            Continue with Google to open DawnDesk. Your workspace data stays local and is scoped to your account.
          </p>

          <button
            className="mt-[var(--dd-space-6)] grid min-h-12 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.18)] bg-[var(--dd-text-primary)] px-[var(--dd-space-4)] text-left font-extrabold text-[var(--dd-accent-contrast)] shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition-[transform,background] hover:-translate-y-px hover:bg-white"
            disabled={!isConfigured || isSigningIn}
            type="button"
            onClick={onSignIn}
          >
            <GoogleMark />
            <span className="truncate text-center">
              {isSigningIn ? 'Opening Google...' : 'Continue with Google'}
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>

          <div className="mt-[var(--dd-space-6)] rounded-[var(--dd-radius-md)] border border-[rgba(250,204,21,0.16)] bg-[rgba(250,204,21,0.055)] p-[var(--dd-space-4)]">
            <span className="inline-flex items-center gap-[var(--dd-space-2)] text-[0.88rem] font-bold text-[var(--dd-accent)]">
              <Sparkles size={16} aria-hidden="true" />
              Local account workspace
            </span>
            <p className="m-0 mt-[var(--dd-space-2)] text-[0.86rem] leading-6 text-[var(--dd-text-secondary)]">
              Plugin installs, plugin data, the host database, and saved chats are separated by your Supabase user id.
            </p>
            {!isConfigured ? (
              <p className="m-0 mt-[var(--dd-space-2)] text-[0.82rem] leading-6 text-[var(--dd-warning)]">
                Supabase environment variables are missing.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function GoogleMark() {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-white" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-5">
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.97-.9 6.62-2.45l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.6A10 10 0 0 0 12 22Z"
        />
        <path
          fill="#FBBC05"
          d="M6.41 13.88A6.01 6.01 0 0 1 6.1 12c0-.65.11-1.28.31-1.88v-2.6H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.48l3.35-2.6Z"
        />
        <path
          fill="#EA4335"
          d="M12 6c1.47 0 2.8.51 3.84 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.52l3.35 2.6C7.2 7.76 9.4 6 12 6Z"
        />
      </svg>
    </span>
  )
}

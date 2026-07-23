/**
 * Placeholder landing page, part of the skeleton.
 *
 * It exists so that `pnpm dev` shows something meaningful on day one and so
 * everyone can confirm their setup works before touching their own issue.
 * Replace it once the real voter journey exists.
 */
export default function HomePage() {
  const routes = [
    { href: '/elections', label: '/elections', owner: 'VT-105, Niharika', built: false },
    { href: '/design', label: '/design', owner: 'VT-106, Sakshi', built: false },
    { href: '/admin', label: '/admin', owner: 'VT-107, Dimple', built: false },
    { href: '/audit', label: '/audit', owner: 'VT-108, Varshitha', built: false },
    { href: '/api/v1/health', label: '/api/v1/health', owner: 'VT-110, Anusha', built: false },
  ]

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">VeraTalley</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Verifiable voting on Polygon Amoy. Anyone can confirm a ballot was cast. Nobody can see
          how anyone voted.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Setup is working
        </h2>
        <p className="text-sm">
          If you can read this, your Node version, your install and the dev server are all fine.
          Open your issue on GitHub and start there.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Routes and who builds them
        </h2>
        <ul className="flex flex-col gap-2">
          {routes.map((route) => (
            <li
              key={route.href}
              className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-3 text-sm"
            >
              <code className="font-mono">{route.label}</code>
              <span className="text-[var(--color-muted-foreground)]">{route.owner}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

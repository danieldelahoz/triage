import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/30 flex flex-col shrink-0">
        <div className="p-4 border-b">
          <Link href="/app" className="font-semibold">Triage</Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/app"
            className="block px-3 py-2 rounded text-sm hover:bg-muted transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/app/new"
            className="block px-3 py-2 rounded text-sm hover:bg-muted transition-colors"
          >
            New ticket
          </Link>
          <Link
            href="/app/archive"
            className="block px-3 py-2 rounded text-sm hover:bg-muted transition-colors"
          >
            Archive
          </Link>
          <Link
            href="/app/settings"
            className="block px-3 py-2 rounded text-sm hover:bg-muted transition-colors"
          >
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Back to landing
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  )
}
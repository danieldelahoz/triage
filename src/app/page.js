import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-semibold">Triage</span>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 bg-foreground text-background rounded font-medium hover:opacity-90 transition-opacity"
            >
              Open workspace
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex-1 flex items-center">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
            AI-assisted ticket triage for support engineers.
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Paste a complex support ticket. Triage analyzes it: categorizes the issue,
            suggests likely root causes, and finds similar tickets you've solved before.
            You investigate. Triage drafts the response. You ship.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/app"
              className="px-6 py-3 bg-foreground text-background rounded font-medium hover:opacity-90 transition-opacity"
            >
              Try it
            </Link>
            <Link
              href="https://github.com/danieldelahoz/triage"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border rounded font-medium hover:bg-muted transition-colors"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Structured analysis</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Claude returns category, severity, ranked root causes with confidence scores,
              and gaps in the information you have.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Similarity matching</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Past tickets you've resolved feed into future analysis. New tickets are
              grounded in your accumulated experience.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Human in the loop</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Triage suggests, you decide. Re-analyze with your investigation notes.
              Edit drafts before sending. The AI doesn't autopilot.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>Triage</span>
          <span>
            Created by{' '}
            
<a href="https://danield.dev" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">danield.dev</a>
          </span>
        </div>
      </footer>
    </main>
  )
}
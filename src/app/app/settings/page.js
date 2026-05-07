import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import Link from 'next/link'
import { MODELS } from '@/lib/anthropic'

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Project info and configuration
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About Triage</CardTitle>
            <CardDescription>
              AI-assisted ticket triage for support engineers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Version" value="0.1.0" />
            <Row label="Built by" value="Daniel Delahoz" />
            <Row label="Source" value={
              <Link
                href="https://github.com/danieldelahoz/triage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline hover:opacity-70 transition-opacity"
              >
                github.com/danieldelahoz/triage
              </Link>
            } />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI configuration</CardTitle>
            <CardDescription>
              Models used for analysis and drafting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Analysis model" value={MODELS.analysis} />
            <Row label="Drafting model" value={MODELS.drafting} />
            <Row label="Similarity model" value={MODELS.similarity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stack</CardTitle>
            <CardDescription>What's running under the hood</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Framework" value="Next.js 16 (App Router)" />
            <Row label="Database" value="Postgres on Railway" />
            <Row label="ORM" value="Drizzle" />
            <Row label="UI" value="Tailwind v4 + shadcn/ui (Vega)" />
            <Row label="Auth" value="Cloudflare Access (GitHub OAuth)" />
            <Row label="Hosting" value="Railway" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-right">{value}</span>
    </div>
  )
}
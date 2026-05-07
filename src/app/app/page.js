import Link from 'next/link'
import { db } from '@/db'
import { tickets } from '@/db/schema'
import { count, eq } from 'drizzle-orm'

export default async function DashboardPage() {
  const totalCountResult = await db.select({ count: count() }).from(tickets)
  const activeCountResult = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.status, 'investigating'))
  const resolvedCountResult = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.status, 'resolved'))

  const totalCount = totalCountResult[0]?.count || 0
  const activeCount = activeCountResult[0]?.count || 0
  const resolvedCount = resolvedCountResult[0]?.count || 0

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Triage assists you in analyzing support tickets. Paste in a new one to get started.
        </p>
      </header>

      <section className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Total tickets" value={totalCount} />
        <Stat label="In progress" value={activeCount} />
        <Stat label="Resolved" value={resolvedCount} />
      </section>

      <section>
        <Link
          href="/app/new"
          className="inline-flex items-center px-6 py-3 bg-foreground text-background rounded font-medium hover:opacity-90 transition-opacity"
        >
          + New ticket
        </Link>
      </section>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="border rounded-lg p-5">
      <div className="text-3xl font-semibold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
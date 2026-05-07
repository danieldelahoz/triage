import Link from 'next/link'
import { db } from '@/db'
import { tickets } from '@/db/schema'
import { desc, ilike, eq, or, and } from 'drizzle-orm'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default async function ArchivePage({ searchParams }) {
  const params = await searchParams
  const search = params.q || ''
  const statusFilter = params.status || 'all'

  const conditions = []
  if (search) {
    conditions.push(
      or(
        ilike(tickets.title, `%${search}%`),
        ilike(tickets.description, `%${search}%`),
        ilike(tickets.customerName, `%${search}%`)
      )
    )
  }
  if (statusFilter !== 'all') {
    conditions.push(eq(tickets.status, statusFilter))
  }

  const allTickets = await db
    .select()
    .from(tickets)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tickets.createdAt))

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Archive</h1>
        <p className="text-sm text-muted-foreground">
          All tickets you've created. Search by title, description, or customer.
        </p>
      </header>

      <form className="flex gap-3 mb-6">
        <Input
          name="q"
          placeholder="Search tickets…"
          defaultValue={search}
          className="flex-1"
        />
        <Select name="status" defaultValue={statusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="submit"
          className="px-4 py-2 bg-foreground text-background rounded font-medium hover:opacity-90 transition-opacity text-sm"
        >
          Search
        </button>
      </form>

      <div className="text-xs text-muted-foreground mb-3">
        {allTickets.length} {allTickets.length === 1 ? 'ticket' : 'tickets'}
        {(search || statusFilter !== 'all') && ' matching filters'}
      </div>

      {allTickets.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {search || statusFilter !== 'all'
              ? 'No tickets match your filters.'
              : 'No tickets yet.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link
              href="/app/new"
              className="text-sm text-foreground underline hover:opacity-70 transition-opacity"
            >
              Create your first ticket
            </Link>
          )}
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {allTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/app/tickets/${ticket.id}`}
              className="block p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate mb-1">{ticket.title}</p>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted">{ticket.status}</span>
                    {ticket.category && (
                      <span className="px-2 py-0.5 rounded bg-muted">{ticket.category}</span>
                    )}
                    {ticket.severity && (
                      <span className="px-2 py-0.5 rounded bg-muted">
                        severity: {ticket.severity}
                      </span>
                    )}
                    {ticket.priority && (
                      <span className="px-2 py-0.5 rounded bg-muted">
                        priority: {ticket.priority}
                      </span>
                    )}
                    {ticket.customerName && (
                      <span className="px-2 py-0.5 rounded bg-muted">
                        {ticket.customerName}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(date) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
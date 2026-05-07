import { db } from '@/db'
import { tickets, rootCauses, infoGaps } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { analyzeTicket } from './actions'
import { SubmitButton } from '@/components/ui/submit-button'

export default async function TicketPage({ params }) {
  const { id } = await params

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1)

  if (!ticket) {
    notFound()
  }

  const ticketRootCauses = await db
    .select()
    .from(rootCauses)
    .where(eq(rootCauses.ticketId, id))

  const ticketInfoGaps = await db
    .select()
    .from(infoGaps)
    .where(eq(infoGaps.ticketId, id))

  const isAnalyzed = ticketRootCauses.length > 0
  const isAnalyzing = ticket.status === 'analyzing'

  const analyze = analyzeTicket.bind(null, id)

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <Link href="/app" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span>Ticket</span>
          </div>
          <h1 className="text-2xl font-semibold mb-1">{ticket.title}</h1>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <StatusBadge status={ticket.status} />
            {ticket.category && <Badge>{ticket.category}</Badge>}
            {ticket.severity && <SeverityBadge severity={ticket.severity} />}
            {ticket.priority && <Badge>{`priority: ${ticket.priority}`}</Badge>}
            {ticket.customerName && <Badge>{ticket.customerName}</Badge>}
            {ticket.productArea && <Badge>{ticket.productArea}</Badge>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {!isAnalyzed && (
<form action={analyze}>
  <SubmitButton pendingText="Analyzing…">Analyze</SubmitButton>
</form>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Original ticket</CardTitle>
              <CardDescription>
                Pasted on {formatDate(ticket.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap break-words font-mono bg-muted/30 rounded p-4 max-h-96 overflow-auto">
                {ticket.description}
              </pre>
            </CardContent>
          </Card>

          {!isAnalyzed && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  This ticket hasn't been analyzed yet. Click Analyze to send it to Claude
                  for categorization, root cause hypotheses, and similarity matching.
                </p>
<form action={analyze}>
  <SubmitButton pendingText="Analyzing…">Analyze ticket</SubmitButton>
</form>
              </CardContent>
            </Card>
          )}

          {isAnalyzed && (
            <Card>
              <CardHeader>
                <CardTitle>Likely root causes</CardTitle>
                <CardDescription>
                  Top hypotheses from Claude, ranked by confidence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticketRootCauses
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((rc) => (
                    <div key={rc.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-medium text-sm">{rc.description}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {rc.confidence}%
                        </span>
                      </div>
                      {rc.reasoning && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {rc.reasoning}
                        </p>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {isAnalyzed && ticketInfoGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Information gaps</CardTitle>
                <CardDescription>
                  Things you'd need to know to confidently resolve this
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticketInfoGaps.map((gap) => (
                  <div key={gap.id} className="border-l-2 border-muted pl-3">
                    <p className="text-sm font-medium mb-1">{gap.question}</p>
                    {gap.reasoning && (
                      <p className="text-xs text-muted-foreground">{gap.reasoning}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Investigation notes</CardTitle>
              <CardDescription>
                Your working notes on this ticket
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ticket.notes ? (
                <pre className="text-sm whitespace-pre-wrap break-words bg-muted/30 rounded p-4">
                  {ticket.notes}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No notes yet. After analyzing the ticket you'll be able to add your
                  investigation notes here.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response draft</CardTitle>
              <CardDescription>
                AI-generated response, edited by you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ticket.finalResponse ? (
                <pre className="text-sm whitespace-pre-wrap break-words bg-muted/30 rounded p-4">
                  {ticket.finalResponse}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No draft yet. Once you've picked a root cause, you'll be able to
                  generate a response draft.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-muted text-muted-foreground',
    analyzing: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    investigating: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    blocked: 'bg-red-500/10 text-red-700 dark:text-red-400',
    ready: 'bg-green-500/10 text-green-700 dark:text-green-400',
    resolved: 'bg-green-500/10 text-green-700 dark:text-green-400',
  }
  const className = styles[status] || styles.pending
  return (
    <span className={`px-2 py-0.5 rounded font-medium ${className}`}>
      {status}
    </span>
  )
}

function SeverityBadge({ severity }) {
  const styles = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }
  const className = styles[severity] || styles.low
  return (
    <span className={`px-2 py-0.5 rounded font-medium ${className}`}>
      severity: {severity}
    </span>
  )
}

function Badge({ children }) {
  return (
    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
      {children}
    </span>
  )
}

function formatDate(date) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
'use server'

import { db } from '@/db'
import { tickets, rootCauses, infoGaps } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { anthropic, MODELS, TOKEN_LIMITS } from '@/lib/anthropic'
import { buildAnalysisPrompt, buildResponsePrompt } from '@/lib/prompts'
import { analysisSchema } from '@/lib/schemas'

export async function analyzeTicket(ticketId) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1)

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  await db
    .update(tickets)
    .set({ status: 'analyzing', updatedAt: new Date() })
    .where(eq(tickets.id, ticketId))

  const { systemPrompt, userPrompt } = buildAnalysisPrompt(ticket)

  let analysis
  try {
    const response = await anthropic.messages.create({
      model: MODELS.analysis,
      max_tokens: TOKEN_LIMITS.analysisOutput,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()

    const cleanedJson = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(cleanedJson)
    analysis = analysisSchema.parse(parsed)
  } catch (err) {
    await db
      .update(tickets)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(eq(tickets.id, ticketId))

    throw new Error(`Analysis failed: ${err.message}`)
  }

  await db.transaction(async (tx) => {
    await tx
      .update(tickets)
      .set({
        category: analysis.category,
        severity: analysis.severity,
        severityReasoning: analysis.severityReasoning,
        status: 'investigating',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))

    if (analysis.rootCauses.length > 0) {
      await tx.insert(rootCauses).values(
        analysis.rootCauses.map((rc) => ({
          ticketId,
          description: rc.description,
          confidence: rc.confidence,
          reasoning: rc.reasoning,
          generationPass: 1,
        }))
      )
    }

    if (analysis.infoGaps.length > 0) {
      await tx.insert(infoGaps).values(
        analysis.infoGaps.map((gap) => ({
          ticketId,
          question: gap.question,
          reasoning: gap.reasoning,
        }))
      )
    }
  })

  revalidatePath('/app')
  redirect(`/app/tickets/${ticketId}`)
}

export async function saveNotes(ticketId, formData) {
  const notes = formData.get('notes')?.toString() || ''

  if (notes.length > 50000) {
    throw new Error('Notes are too long (max 50,000 characters)')
  }

  await db
    .update(tickets)
    .set({ notes, updatedAt: new Date() })
    .where(eq(tickets.id, ticketId))

  revalidatePath(`/app/tickets/${ticketId}`)
}

export async function selectRootCause(ticketId, rootCauseId) {
  await db
    .update(tickets)
    .set({
      selectedRootCauseId: rootCauseId,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))

  revalidatePath(`/app/tickets/${ticketId}`)
}

export async function generateResponse(ticketId) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1)

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  if (!ticket.selectedRootCauseId) {
    throw new Error('Select a root cause before generating a response')
  }

  const [selectedRC] = await db
    .select()
    .from(rootCauses)
    .where(eq(rootCauses.id, ticket.selectedRootCauseId))
    .limit(1)

  if (!selectedRC) {
    throw new Error('Selected root cause not found')
  }

  const { systemPrompt, userPrompt } = buildResponsePrompt(
    ticket,
    ticket.notes,
    selectedRC
  )

  let draft
  try {
    const response = await anthropic.messages.create({
      model: MODELS.drafting,
      max_tokens: TOKEN_LIMITS.draftOutput,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    draft = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()

    if (!draft) {
      throw new Error('Empty response from Claude')
    }
  } catch (err) {
    throw new Error(`Response generation failed: ${err.message}`)
  }

  await db
    .update(tickets)
    .set({
      finalResponse: draft,
      status: 'ready',
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))

  revalidatePath(`/app/tickets/${ticketId}`)
  return draft
}

export async function saveResponse(ticketId, formData) {
  const response = formData.get('response')?.toString() || ''

  if (response.length > 50000) {
    throw new Error('Response is too long (max 50,000 characters)')
  }

  await db
    .update(tickets)
    .set({ finalResponse: response, updatedAt: new Date() })
    .where(eq(tickets.id, ticketId))

  revalidatePath(`/app/tickets/${ticketId}`)
}
'use server'

import { db } from '@/db'
import { tickets, rootCauses, infoGaps } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { anthropic, MODELS, TOKEN_LIMITS } from '@/lib/anthropic'
import { buildAnalysisPrompt } from '@/lib/prompts'
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
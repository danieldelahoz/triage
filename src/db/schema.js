import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  customerName: text('customer_name'),
  productArea: text('product_area'),
  priority: text('priority'),
  status: text('status').notNull().default('pending'),
  category: text('category'),
  severity: text('severity'),
  severityReasoning: text('severity_reasoning'),
  selectedRootCauseId: uuid('selected_root_cause_id'),
  notes: text('notes'),
  finalResponse: text('final_response'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
})

export const rootCauses = pgTable('root_causes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  confidence: integer('confidence').notNull(),
  reasoning: text('reasoning'),
  citedTicketIds: jsonb('cited_ticket_ids'),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  generationPass: integer('generation_pass').notNull().default(1),
})

export const infoGaps = pgTable('info_gaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  reasoning: text('reasoning'),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
})

export const similarityLinks = pgTable('similarity_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  similarTicketId: uuid('similar_ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  similarityScore: integer('similarity_score').notNull(),
  reasoning: text('reasoning'),
  computedAt: timestamp('computed_at').notNull().defaultNow(),
})
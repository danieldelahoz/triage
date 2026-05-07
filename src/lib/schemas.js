import { z } from 'zod'

export const analysisSchema = z.object({
  category: z.enum([
    'auth',
    'integration',
    'data',
    'performance',
    'ui',
    'config',
    'unknown',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  severityReasoning: z.string().min(1).max(500),
  rootCauses: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        confidence: z.number().int().min(0).max(100),
        reasoning: z.string().min(1).max(1000),
      })
    )
    .min(1)
    .max(3),
  infoGaps: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        reasoning: z.string().min(1).max(500),
      })
    )
    .min(0)
    .max(3),
})
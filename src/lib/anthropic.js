import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY is not set')
}

export const anthropic = new Anthropic({ apiKey })

export const MODELS = {
  analysis: 'claude-sonnet-4-6',
  similarity: 'claude-haiku-4-5-20251001',
  drafting: 'claude-sonnet-4-6',
}

export const TOKEN_LIMITS = {
  analysisOutput: 1500,
  similarityOutput: 500,
  draftOutput: 1500,
}
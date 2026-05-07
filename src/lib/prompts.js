export function buildAnalysisPrompt(ticket) {
  const customerContext = ticket.customerName
    ? `\nCustomer: ${ticket.customerName}`
    : ''
  const productContext = ticket.productArea
    ? `\nProduct area: ${ticket.productArea}`
    : ''
  const priorityContext = ticket.priority
    ? `\nPriority: ${ticket.priority}`
    : ''

  const userPrompt = `Analyze this support ticket and return your analysis as valid JSON.

# Ticket
Title: ${ticket.title}${customerContext}${productContext}${priorityContext}

Description:
${ticket.description}

# Output format
Return ONLY a valid JSON object matching this exact shape (no markdown, no commentary, just JSON):

{
  "category": "auth" | "integration" | "data" | "performance" | "ui" | "config" | "unknown",
  "severity": "low" | "medium" | "high" | "critical",
  "severityReasoning": "1-2 sentences on why this severity",
  "rootCauses": [
    {
      "description": "1-2 sentence hypothesis of what's likely causing this",
      "confidence": 0-100,
      "reasoning": "2-4 sentences on why this is likely, what evidence in the ticket supports it"
    }
  ],
  "infoGaps": [
    {
      "question": "What information would you need to confirm or rule out the root causes?",
      "reasoning": "Why this information matters for the diagnosis"
    }
  ]
}

# Rules
- Provide between 1 and 3 root causes, ranked by confidence (highest first)
- Provide between 0 and 3 info gaps (skip if the ticket has everything you need)
- Confidence is your honest assessment, not artificially boosted
- If the ticket is too vague to analyze, return one root cause saying so with low confidence
- Return ONLY the JSON object, nothing before or after`

  const systemPrompt = `You are a senior Technical Support Engineer with deep expertise in enterprise IAM, REST APIs, integrations, and production systems. Analyze support tickets methodically.

Your output is consumed programmatically. Always return valid JSON matching the requested shape exactly. No markdown formatting, no commentary, no explanations outside the JSON itself.`

  return { systemPrompt, userPrompt }
}
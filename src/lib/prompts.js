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

export function buildResponsePrompt(ticket, notes, selectedRootCause) {
  const customerContext = ticket.customerName
    ? `\nCustomer: ${ticket.customerName}`
    : ''
  const productContext = ticket.productArea
    ? `\nProduct area: ${ticket.productArea}`
    : ''
  const notesSection = notes
    ? `\n\n# Investigation notes\n${notes}`
    : '\n\n# Investigation notes\n(no notes provided)'

  const userPrompt = `Draft a customer-facing response to this support ticket.

# Ticket
Title: ${ticket.title}${customerContext}${productContext}

Original ticket:
${ticket.description}${notesSection}

# Confirmed root cause
${selectedRootCause.description}

Reasoning: ${selectedRootCause.reasoning}

# Output format
Return ONLY the response text. No preamble, no commentary, no JSON, no markdown headers.

The response should:
- Address the customer directly
- Acknowledge the issue and confirm the root cause
- Explain what happened in plain language (no internal jargon)
- State next steps clearly
- Be concise — under 250 words unless the situation genuinely requires more
- Match a professional, warm, confident tone

The human will edit this draft before sending. Don't be overly cautious or hedge unnecessarily. Be specific and helpful.`

  const systemPrompt = `You are a senior Technical Support Engineer drafting customer-facing responses. Your drafts are reviewed and edited by another engineer before being sent.

Write in clear, direct prose. Match the customer's level of technical sophistication based on the ticket. Avoid corporate fluff ("we understand your frustration", "thank you for reaching out"). Get to the point.

Return only the response text — no JSON, no markdown structure, no quotation marks around the response.`

  return { systemPrompt, userPrompt }
}
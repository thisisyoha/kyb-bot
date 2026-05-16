interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface LogPayload {
  messages: Message[]
  page: string
  session: string
}

export async function POST(req: Request) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return new Response('OK', { status: 200 })

  let payload: LogPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const { messages, page, session } = payload
  if (!Array.isArray(messages) || messages.length <= 1) {
    return new Response('OK', { status: 200 })
  }

  const userMessages = messages.filter(m => m.role === 'user')
  const sessionShort = String(session).slice(-6)

  // Format conversation
  const lines: string[] = []
  for (const m of messages) {
    if (m.role === 'assistant' && m.content === messages[0].content) continue // skip welcome
    const label = m.role === 'user' ? '*Customer:*' : '*M.ai:*'
    lines.push(`${label} ${m.content.trim()}`)
  }

  const text = lines.join('\n\n').slice(0, 3000)

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '💬 M.ai Conversation Ended' },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Page:* ${page}  ·  *Messages:* ${userMessages.length}  ·  *Session:* ${sessionShort}  ·  ${new Date().toUTCString()}`,
            },
          ],
        },
        { type: 'divider' },
        {
          type: 'section',
          text: { type: 'mrkdwn', text },
        },
      ],
    }),
  })

  return new Response('OK', { status: 200 })
}

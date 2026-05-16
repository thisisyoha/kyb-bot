'use client'

import { useState, useRef, useEffect } from 'react'
import React from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: Message = {
  role: 'assistant',
  content:
    "Hi! I'm M.ai, your Mesh verification assistant. I can help you with any questions about uploading documents for your KYC verification — IDs, passports, org charts, and more.\n\nFeel free to ask in English or Hebrew — I'm here to make this process as smooth as possible.",
}

function hasHebrew(text: string): boolean {
  return /[֐-׿יִ-ﭏ]/.test(text)
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={j}>{part.slice(1, -1)}</em>
      }
      return <React.Fragment key={j}>{part}</React.Fragment>
    })
    return (
      <React.Fragment key={i}>
        {rendered}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    )
  })
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesRef = useRef<Message[]>([WELCOME])

  // Read context from URL params (set by widget.js)
  const pageContext = useRef<string>('unknown')
  const sessionId = useRef<string>('unknown')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    pageContext.current = params.get('page') || 'unknown'
    sessionId.current = params.get('session') || 'unknown'
  }, [])

  // Keep messagesRef in sync so the close handler always has latest messages
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Listen for close signal from widget.js → log full conversation to Slack
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'mai-widget-closed') return
      const conversation = messagesRef.current
      if (conversation.length <= 1) return // no user messages, nothing to log
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation,
          page: pageContext.current,
          session: sessionId.current,
        }),
      }).catch(() => {})
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { role: 'user', content: text }
    const apiMessages = [...messages.slice(1), userMsg]

    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content }
          return copy
        })
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          role: 'assistant',
          content: "I'm sorry, something went wrong. Please try again.",
        }
        return copy
      })
    } finally {
      setStreaming(false)
      textareaRef.current?.focus()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.avatar}>M</div>
        <div style={{ flex: 1 }}>
          <div style={s.botName}>M.ai</div>
          <div style={s.botSub}>Mesh Verification Assistant</div>
        </div>
        <div style={s.onlinePill}>
          <div style={s.onlineDot} />
          Online
        </div>
      </div>

      {/* Messages */}
      <div style={s.messages}>
        {messages.map((msg, i) => {
          const hebrew = hasHebrew(msg.content)
          const isUser = msg.role === 'user'
          const isLastStreaming = streaming && i === messages.length - 1

          return (
            <div
              key={i}
              className="message-appear"
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {!isUser && <div style={s.avatarSm}>M</div>}
              <div
                style={{
                  ...s.bubble,
                  ...(isUser ? s.userBubble : s.botBubble),
                  direction: hebrew ? 'rtl' : 'ltr',
                  textAlign: hebrew ? 'right' : 'left',
                }}
              >
                {renderMarkdown(msg.content)}
                {isLastStreaming && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 14,
                      backgroundColor: '#3B82F6',
                      marginLeft: 2,
                      borderRadius: 1,
                      verticalAlign: 'text-bottom',
                      animation: 'blink 0.8s step-end infinite',
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={s.inputArea}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question... / שאל שאלה..."
          style={s.textarea}
          rows={1}
          disabled={streaming}
          dir="auto"
        />
        <button
          onClick={send}
          disabled={!input.trim() || streaming}
          style={{
            ...s.sendBtn,
            opacity: !input.trim() || streaming ? 0.35 : 1,
            cursor: !input.trim() || streaming ? 'default' : 'pointer',
          }}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div style={s.footer}>Powered by Mesh Payments · Data is encrypted and secure</div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#F1F5F9',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    fontSize: 14,
    color: '#1E293B',
  },
  header: {
    backgroundColor: '#0F1B35',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: '0 0 0 2px rgba(59,130,246,0.4)',
  },
  botName: {
    color: 'white',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '-0.01em',
  },
  botSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  onlinePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.15)',
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 8px',
    borderRadius: 20,
    flexShrink: 0,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#22C55E',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 16px 8px',
    display: 'flex',
    flexDirection: 'column',
  },
  avatarSm: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    padding: '10px 14px',
    borderRadius: 16,
    lineHeight: 1.55,
    wordBreak: 'break-word',
  },
  userBubble: {
    backgroundColor: '#0F1B35',
    color: 'white',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    color: '#1E293B',
    border: '1px solid #E2E8F0',
    borderBottomLeftRadius: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  inputArea: {
    backgroundColor: 'white',
    borderTop: '1px solid #E2E8F0',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    padding: '9px 13px',
    fontSize: 14,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    backgroundColor: '#F8FAFC',
    overflowY: 'auto',
    color: '#1E293B',
    transition: 'border-color 0.15s',
    minHeight: 44,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.15s',
    boxShadow: '0 2px 6px rgba(59,130,246,0.4)',
  },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94A3B8',
    padding: '6px 0 8px',
    backgroundColor: 'white',
    borderTop: '1px solid #F1F5F9',
    flexShrink: 0,
  },
}

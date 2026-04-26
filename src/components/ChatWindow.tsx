'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface Message {
  id: string
  rol: 'user' | 'assistant'
  contenido: string
  created_at: string
}

interface PendingMessage {
  message: Message
  timestamp: number
}

const EXAMPLE_QUESTIONS = [
  { text: 'La Ricoh MP 2014 marca error SC542' },
  { text: '¿Cómo cambiar fusor en Canon IR 2204?' },
  { text: 'Error E000 en Kyocera Taskalfa' },
  { text: 'Atasco de papel en bandeja 2' },
]

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('databot_device_id')
  if (!id) {
    id = 'device_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('databot_device_id', id)
  }
  return id
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([])
  const [showExamples, setShowExamples] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => { setIsOnline(true); flushPendingMessages() }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    loadPendingFromStorage()
    setSessionId(getOrCreateDeviceId())
    loadCachedMessages()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  function loadPendingFromStorage() {
    try {
      const raw = localStorage.getItem('databot_pending')
      if (raw) setPendingMessages(JSON.parse(raw))
    } catch {}
  }

  function savePending(msgs: PendingMessage[]) {
    localStorage.setItem('databot_pending', JSON.stringify(msgs))
  }

  async function flushPendingMessages() {
    try {
      const raw = localStorage.getItem('databot_pending')
      if (!raw) return
      const msgs: PendingMessage[] = JSON.parse(raw)
      for (const msg of msgs) { try { await sendToServer(msg.message.contenido) } catch {} }
      localStorage.removeItem('databot_pending')
      setPendingMessages([])
    } catch {}
  }

  function loadCachedMessages() {
    try {
      const cached = localStorage.getItem('databot_messages')
      if (cached) {
        const parsed: Message[] = JSON.parse(cached)
        if (parsed.length > 0) { setMessages(parsed); setShowExamples(false) }
      }
    } catch {}
  }

  function cacheMessages(msgs: Message[]) {
    localStorage.setItem('databot_messages', JSON.stringify(msgs.slice(-50)))
  }

  async function handleSubmit(e: React.FormEvent | string) {
    if (typeof e !== 'string') e.preventDefault()
    const text = typeof e === 'string' ? e : input.trim()
    if (!text || loading) return

    setShowExamples(false)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      rol: 'user',
      contenido: text,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => { const u = [...prev, userMessage]; cacheMessages(u); return u })
    setInput('')
    setLoading(true)

    try {
      if (isOnline) {
        await sendToServer(userMessage.contenido)
      } else {
        const offlineMsg: Message = {
          id: crypto.randomUUID(),
          rol: 'assistant',
          contenido: 'Sin conexión. Tu mensaje se enviará cuando recuperes internet.',
          created_at: new Date().toISOString(),
        }
        setMessages(prev => { const u = [...prev, offlineMsg]; cacheMessages(u); return u })
        const newPending = [...pendingMessages, { message: userMessage, timestamp: Date.now() }]
        setPendingMessages(newPending)
        savePending(newPending)
      }
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        rol: 'assistant',
        contenido: 'Error al procesar tu mensaje. Intenta de nuevo.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => { const u = [...prev, errMsg]; cacheMessages(u); return u })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function sendToServer(question: string) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, session_id: sessionId, user_id: userId }),
    })
    if (!res.ok) throw new Error('Server error')
    const data = await res.json()
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      rol: 'assistant',
      contenido: data.answer,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => { const u = [...prev, assistantMsg]; cacheMessages(u); return u })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* ===== HEADER — Editorial masthead ===== */}
      <div style={{ borderBottom: '1px solid var(--hairline)', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}>
              DataBot
            </span>
            <span className="kicker" style={{ fontSize: '0.625rem' }}>
              {isOnline ? 'En línea' : 'Sin conexión'}
            </span>
          </div>
          {pendingMessages.length > 0 && (
            <span className="kicker" style={{ color: 'var(--caption)' }}>
              {pendingMessages.length} pendiente{pendingMessages.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ===== CHAT AREA ===== */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
      }}>
        {/* Welcome Screen */}
        {messages.length === 0 && showExamples && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 280px)',
            textAlign: 'center',
          }}>
            <h1 style={{ marginBottom: 8, fontSize: '2.5rem' }}>
              Asistente Técnico
            </h1>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              color: 'var(--caption)',
              maxWidth: 400,
              margin: '0 auto 32px',
              lineHeight: 1.7,
            }}>
              Consulta manuales técnicos de fotocopiadoras, impresoras y equipos de oficina con inteligencia artificial.
            </p>

            <hr style={{ width: '100%', marginBottom: 24 }} />

            <span className="kicker" style={{ marginBottom: 12 }}>Consultas frecuentes</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480 }}>
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(q.text)}
                  className="animate-type-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8125rem',
                    color: 'var(--body)',
                    background: 'var(--paper)',
                    border: '1px solid var(--hairline)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 150ms, color 150ms',
                    animationDelay: `${i * 80}ms`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hairline)'; e.currentTarget.style.color = 'var(--body)' }}
                >
                  <span>{q.text}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--caption)" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={msg.id} className="animate-type-in" style={{ animationDelay: '50ms', marginBottom: 16 }}>
            <MessageBubble message={msg} isLatest={i === messages.length - 1} />
          </div>
        ))}

        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ===== INPUT BAR — editorial quote style ===== */}
      <div style={{
        borderTop: '1px solid var(--hairline)',
        padding: '16px 24px',
        background: 'var(--paper)',
      }}>
        <form onSubmit={handleSubmit as any}>
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}>
            <div style={{
              flex: 1,
              border: '1px solid var(--hairline)',
              padding: '10px 14px',
              transition: 'border-color 150ms',
            }}
            onFocusCapture={e => setShowExamples(false)}
            >
              <textarea
                ref={inputRef as any}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  const el = e.target
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta..."
                rows={1}
                disabled={loading}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: 'var(--body)',
                  background: 'transparent',
                  maxHeight: 120,
                  lineHeight: 1.5,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn"
              style={{ padding: '10px 16px', flexShrink: 0, fontSize: '0.6875rem' }}
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="kicker" style={{ fontSize: '0.625rem' }}>
              {isOnline ? 'Asistente técnico IA' : 'Modo offline'}
            </span>
            <span className="kicker" style={{ fontSize: '0.625rem' }}>
              ⏎ Enviar · ⇧⏎ Salto
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

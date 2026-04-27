'use client'

import { useState, useEffect, useRef } from 'react'
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
  { text: 'Error SC899 en Ricoh IM C4500' },
  { text: 'Ajustar registro de color Ricoh Pro C5200' },
  { text: 'Cómo entrar a service mode Ricoh MP 2555' },
]

function deviceId(): string {
  let id = localStorage.getItem('databot_device_id')
  if (!id) { id = 'device_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('databot_device_id', id) }
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
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => { setIsOnline(true); flushPending() }
    const off = () => setIsOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    loadPending(); setSessionId(deviceId()); loadCache()
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function loadPending() {
    try { const r = localStorage.getItem('databot_pending'); if (r) setPendingMessages(JSON.parse(r)) } catch {}
  }
  function savePending(p: PendingMessage[]) { localStorage.setItem('databot_pending', JSON.stringify(p)) }

  async function flushPending() {
    try {
      const r = localStorage.getItem('databot_pending')
      if (!r) return
      for (const m of JSON.parse(r) as PendingMessage[]) { try { await sendToServer(m.message.contenido) } catch {} }
      localStorage.removeItem('databot_pending'); setPendingMessages([])
    } catch {}
  }

  function loadCache() {
    try {
      const r = localStorage.getItem('databot_messages')
      if (r) { const p: Message[] = JSON.parse(r); if (p.length) { setMessages(p); setShowExamples(false) } }
    } catch {}
  }
  function cacheMessages(m: Message[]) { localStorage.setItem('databot_messages', JSON.stringify(m.slice(-50))) }

  async function handleSubmit(e: React.FormEvent | string) {
    if (typeof e !== 'string') e.preventDefault()
    const text = typeof e === 'string' ? e : input.trim()
    if (!text || loading) return

    setShowExamples(false)
    const userMsg: Message = { id: crypto.randomUUID(), rol: 'user', contenido: text, created_at: new Date().toISOString() }
    setMessages(prev => { const u = [...prev, userMsg]; cacheMessages(u); return u })
    setInput(''); setLoading(true)

    try {
      if (isOnline) await sendToServer(text)
      else {
        const offMsg: Message = { id: crypto.randomUUID(), rol: 'assistant', contenido: 'Sin conexión. Tu mensaje se enviará cuando recuperes internet.', created_at: new Date().toISOString() }
        setMessages(prev => { const u = [...prev, offMsg]; cacheMessages(u); return u })
        const np = [...pendingMessages, { message: userMsg, timestamp: Date.now() }]
        setPendingMessages(np); savePending(np)
      }
    } catch {
      const eMsg: Message = { id: crypto.randomUUID(), rol: 'assistant', contenido: 'Error al procesar tu mensaje. Intenta de nuevo.', created_at: new Date().toISOString() }
      setMessages(prev => { const u = [...prev, eMsg]; cacheMessages(u); return u })
    } finally { setLoading(false); inputRef.current?.focus() }
  }

  async function sendToServer(question: string) {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, session_id: sessionId, user_id: userId }),
    })
    if (!res.ok) throw new Error('Server error')
    const data = await res.json()
    const aMsg: Message = { id: crypto.randomUUID(), rol: 'assistant', contenido: data.answer, created_at: new Date().toISOString() }
    setMessages(prev => { const u = [...prev, aMsg]; cacheMessages(u); return u })
  }

  function resetChat() {
  localStorage.removeItem('databot_messages')
  localStorage.removeItem('databot_pending')
  setMessages([])
  setShowExamples(true)
  setPendingMessages([])
  setSessionId('device_' + Math.random().toString(36).substr(2, 9))
  setInput('')
}

function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* ===== UTILITY BAR — Black strip ===== */}
      <div style={{
        background: 'var(--wired-black)',
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="ribbon-label" style={{ fontSize: '0.6875rem', letterSpacing: '1px' }}>Teknocopy</span>
          {messages.length > 0 && (
            <span
              onClick={resetChat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: '#0000fa',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              + Nueva
            </span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            color: 'var(--caption-gray)',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}>
            {isOnline ? 'En línea' : 'Sin conexión'}
          </span>
        </div>
        {pendingMessages.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            color: '#999',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}>
            {pendingMessages.length} pendiente{pendingMessages.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ===== CHAT AREA ===== */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>

        {/* ===== WELCOME — editorial hero ===== */}
        {messages.length === 0 && showExamples && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 280px)',
            textAlign: 'center',
          }}>
            <span className="kicker" style={{ marginBottom: 12, color: 'var(--caption-gray)' }}>
              Herramienta interna · Teknocopy
            </span>

            <h1 className="display-hero" style={{ marginBottom: 16 }}>
              Teknocopy
            </h1>

            <p className="article-deck" style={{ color: 'var(--caption-gray)', maxWidth: 420, marginBottom: 40 }}>
              Asistente técnico interno. Consulta manuales Ricoh, Samsung y Brother al instante.
            </p>

            <div style={{ width: '100%', maxWidth: 480 }}>
              <hr className="hairline-black" style={{ marginBottom: 24 }} />

              <span className="kicker" style={{ marginBottom: 12, display: 'block', color: 'var(--caption-gray)' }}>
                Consultas frecuentes
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EXAMPLE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(q.text)}
                    className="animate-in"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: 'var(--paper-white)',
                      border: '1px solid var(--hairline-tint)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.8125rem',
                      color: 'var(--page-ink)',
                      transition: 'border-color 150ms, color 150ms',
                      animationDelay: `${i * 80}ms`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--wired-black)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hairline-tint)'; }}
                  >
                    <span>{q.text}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--caption-gray)" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== MESSAGE LIST ===== */}
        {messages.map((msg, i) => (
          <div key={msg.id} className="animate-in" style={{ animationDelay: '50ms', marginBottom: 20 }}>
            <MessageBubble message={msg} />
          </div>
        ))}

        {loading && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* ===== INPUT — 2px black border, square, Apercu ===== */}
      <div style={{
        borderTop: '1px solid var(--hairline-tint)',
        padding: '16px 24px',
        background: 'var(--paper-white)',
      }}>
        <form onSubmit={handleSubmit as any}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, border: '2px solid var(--wired-black)', padding: '10px 14px' }}>
              <textarea
                ref={inputRef as any}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  const el = e.target
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
                onKeyDown={onKeyDown}
                placeholder="Escribe tu consulta..."
                rows={1}
                disabled={loading}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '1rem',
                  fontWeight: 400,
                  color: 'var(--page-ink)',
                  background: 'transparent',
                  maxHeight: 120,
                  lineHeight: 1.5,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary"
              style={{ padding: '12px 20px', fontSize: '0.875rem', flexShrink: 0 }}
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, minHeight: 18 }}>
            <span className="timestamp" style={{ fontSize: '0.625rem', letterSpacing: '0.8px' }}>
              Teknocopy · Herramienta interna
            </span>
            <span className="timestamp" style={{ fontSize: '0.625rem', letterSpacing: '0.8px' }}>
              ⏎ Enviar · ⇧⏎ Salto
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

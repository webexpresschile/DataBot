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
  { icon: '🔧', text: 'La Ricoh MP 2014 marca error SC542' },
  { icon: '📄', text: '¿Cómo cambiar fusor en Canon IR 2204?' },
  { icon: '⚡', text: 'Error E000 en Kyocera Taskalfa' },
  { icon: '🔍', text: 'Atasco de papel en bandeja 2' },
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

    const handleOnline = () => {
      setIsOnline(true)
      flushPendingMessages()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    loadPendingFromStorage()
    const deviceId = getOrCreateDeviceId()
    setSessionId(deviceId)
    loadCachedMessages()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      for (const msg of msgs) {
        try { await sendToServer(msg.message.contenido) } catch {}
      }
      localStorage.removeItem('databot_pending')
      setPendingMessages([])
    } catch {}
  }

  function loadCachedMessages() {
    try {
      const cached = localStorage.getItem('databot_messages')
      if (cached) {
        const parsed: Message[] = JSON.parse(cached)
        if (parsed.length > 0) {
          setMessages(parsed)
          setShowExamples(false)
        }
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

    setMessages(prev => {
      const updated = [...prev, userMessage]
      cacheMessages(updated)
      return updated
    })
    setInput('')
    setLoading(true)

    try {
      if (isOnline) {
        await sendToServer(userMessage.contenido)
      } else {
        const offlineMsg: Message = {
          id: crypto.randomUUID(),
          rol: 'assistant',
          contenido: '📡 **Sin conexión.** Tu mensaje se enviará automáticamente cuando recuperes internet.',
          created_at: new Date().toISOString(),
        }
        setMessages(prev => {
          const updated = [...prev, offlineMsg]
          cacheMessages(updated)
          return updated
        })
        const newPending = [...pendingMessages, { message: userMessage, timestamp: Date.now() }]
        setPendingMessages(newPending)
        savePending(newPending)
      }
    } catch (error) {
      console.error('Send error:', error)
      const errMsg: Message = {
        id: crypto.randomUUID(),
        rol: 'assistant',
        contenido: '❌ **Error al procesar tu mensaje.** Por favor intenta de nuevo.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => {
        const updated = [...prev, errMsg]
        cacheMessages(updated)
        return updated
      })
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
    setMessages(prev => {
      const updated = [...prev, assistantMsg]
      cacheMessages(updated)
      return updated
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  function handleExampleClick(text: string) {
    handleSubmit(text)
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex flex-col h-screen" style={{ maxWidth: 'var(--max-chat-width)', margin: '0 auto' }}>
      
      {/* ===== HEADER ===== */}
      <header className="flex items-center justify-between px-5 py-3 border-b shrink-0" 
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          height: 'var(--header-height)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>DataBot</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ 
                  background: isOnline ? 'var(--success)' : 'var(--warning)',
                  boxShadow: isOnline ? '0 0 6px rgba(16,185,129,0.5)' : 'none',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {isOnline ? 'En línea' : 'Sin conexión'}
              </span>
              {pendingMessages.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: 'var(--warning)',
                  color: 'white',
                  fontWeight: 500,
                }}>
                  {pendingMessages.length} pendiente{pendingMessages.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-input)')}
          title="Información"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </button>
      </header>

      {/* ===== CHAT AREA ===== */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{
          background: 'var(--bg)',
          scrollBehavior: 'smooth',
        }}
      >
        {/* Welcome Screen */}
        {messages.length === 0 && showExamples && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 animate-fade-in">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
                boxShadow: '0 8px 32px rgba(79,70,229,0.25)',
              }}
            >
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              ¿En qué puedo ayudarte?
            </h2>
            <p className="text-sm text-center mb-8" style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>
              Consulta manuales técnicos de fotocopiadoras, multifuncionales y equipos de oficina con IA.
            </p>

            {/* Example questions */}
            <div className="w-full max-w-md space-y-2">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(q.text)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all duration-200 animate-slide-in-up"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    animationDelay: `${i * 80}ms`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span className="text-lg">{q.icon}</span>
                  <span className="flex-1">{q.text}</span>
                  <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((message, index) => (
          <div key={message.id} className="animate-slide-in-up" style={{ animationDuration: '200ms' }}>
            <MessageBubble message={message} isLatest={index === messages.length - 1} />
          </div>
        ))}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* ===== INPUT BAR ===== */}
      <div className="shrink-0 px-4 pb-4 pt-2" style={{ background: 'var(--bg-card)' }}>
        <form onSubmit={handleSubmit as any}>
          <div className="flex items-end gap-2 p-2 rounded-2xl transition-all duration-200"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
            }}
            onFocusCapture={() => setShowExamples(false)}
          >
            <textarea
              ref={inputRef as any}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe tu problema técnico..."
              rows={1}
              className="flex-1 px-3 py-2 bg-transparent resize-none text-sm outline-none"
              style={{
                color: 'var(--text-primary)',
                maxHeight: '120px',
                lineHeight: 1.5,
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: input.trim() ? 'var(--primary)' : 'var(--border)',
                color: 'white',
              }}
              onMouseEnter={e => {
                if (input.trim()) e.currentTarget.style.background = 'var(--primary-dark)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = input.trim() ? 'var(--primary)' : 'var(--border)'
              }}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {isOnline ? 'AI asistente técnico' : '📡 Modo offline'}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Enter para enviar · Shift+Enter para salto de línea
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

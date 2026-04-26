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

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    checkOnlineStatus()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    loadPendingMessages()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    flushPendingMessages()
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
  }, [])

  function checkOnlineStatus() {
    setIsOnline(navigator.onLine)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function loadPendingMessages() {
    const pending = localStorage.getItem('databot_pending')
    if (pending) {
      try {
        setPendingMessages(JSON.parse(pending))
      } catch (e) {
        console.error('Error loading pending messages', e)
      }
    }
  }

  function savePendingMessages(msgs: PendingMessage[]) {
    localStorage.setItem('databot_pending', JSON.stringify(msgs))
  }

  async function flushPendingMessages() {
    const pending = localStorage.getItem('databot_pending')
    if (pending) {
      try {
        const messages: PendingMessage[] = JSON.parse(pending)
        for (const msg of messages) {
          try {
            await sendToServer(msg.message.contenido)
          } catch (e) {
            console.error('Failed to send pending message', e)
          }
        }
        localStorage.removeItem('databot_pending')
        setPendingMessages([])
      } catch (e) {
        console.error('Error flushing pending messages', e)
      }
    }
  }

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadOrCreateSession(user.id)
    } else {
      signInAnonymously()
    }
  }

  async function signInAnonymously() {
    const deviceId = getDeviceId()
    setSessionId(deviceId)
    loadCachedMessages()
  }

  function getDeviceId(): string {
    let id = localStorage.getItem('databot_device_id')
    if (!id) {
      id = 'device_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('databot_device_id', id)
    }
    return id
  }

  async function loadOrCreateSession(uid: string) {
    const { data } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data?.id) {
      setSessionId(data.id)
      loadMessages(data.id)
    } else {
      const { data: newSession } = await supabase
        .from('conversaciones')
        .insert({ user_id: uid, titulo: 'Nueva consulta' })
        .select()
        .single()
      if (newSession?.id) {
        setSessionId(newSession.id)
      }
    }
  }

  async function loadMessages(sid: string) {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .eq('conversacion_id', sid)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      setMessages(data)
    }
  }

  function loadCachedMessages() {
    const cached = localStorage.getItem('databot_messages')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setMessages(parsed)
      } catch (e) {
        console.error('Error parsing cached messages', e)
      }
    }
  }

  function cacheMessages(msgs: Message[]) {
    const toCache = msgs.slice(-50)
    localStorage.setItem('databot_messages', JSON.stringify(toCache))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      rol: 'user',
      contenido: input.trim(),
      created_at: new Date().toISOString()
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
        const offlineResponse: Message = {
          id: crypto.randomUUID(),
          rol: 'assistant',
          contenido: 'Estás sin conexión. Tu mensaje se enviará cuando tengas internet.',
          created_at: new Date().toISOString()
        }
        setMessages(prev => {
          const updated = [...prev, offlineResponse]
          cacheMessages(updated)
          return updated
        })
        const pending: PendingMessage = {
          message: userMessage,
          timestamp: Date.now()
        }
        const newPending = [...pendingMessages, pending]
        setPendingMessages(newPending)
        savePendingMessages(newPending)
      }
    } catch (error) {
      console.error('Error sending message', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        rol: 'assistant',
        contenido: 'Hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        created_at: new Date().toISOString()
      }
      setMessages(prev => {
        const updated = [...prev, errorMessage]
        cacheMessages(updated)
        return updated
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function sendToServer(question: string) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        session_id: sessionId,
        user_id: userId
      })
    })

    if (!response.ok) {
      throw new Error('Server error')
    }

    const data = await response.json()

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      rol: 'assistant',
      contenido: data.answer,
      created_at: new Date().toISOString()
    }

    setMessages(prev => {
      const updated = [...prev, assistantMessage]
      cacheMessages(updated)
      return updated
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">DataBot</h1>
            <p className="text-xs opacity-90 flex items-center gap-1">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  En línea
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  Sin conexión
                </>
              )}
            </p>
          </div>
        </div>
        {pendingMessages.length > 0 && (
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs">
            {pendingMessages.length} pendiente{pendingMessages.length > 1 ? 's' : ''}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12 px-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">¡Hola!</p>
            <p className="text-sm leading-relaxed">
              Soy tu asistente técnico. Escribe tu consulta sobre un equipo de oficina.<br />
              <span className="text-blue-600 font-medium">Ej: &quot;La Ricoh MP 2014 marca error SC542&quot;</span>
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} isLatest={index === messages.length - 1} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef as any}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta..."
              rows={1}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
              disabled={loading}
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
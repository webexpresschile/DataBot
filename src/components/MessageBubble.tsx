'use client'

interface MessageBubbleProps {
  message: {
    rol: 'user' | 'assistant'
    contenido: string
    created_at: string
  }
  isLatest?: boolean
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function detectLinks(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">$1</a>'
  )
}

export default function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.rol === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} items-end`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser ? 'animate-scale-in' : ''
        }`}
        style={{
          background: isUser
            ? 'linear-gradient(135deg, var(--primary), #7C3AED)'
            : 'linear-gradient(135deg, #374151, #1F2937)',
          boxShadow: isUser ? '0 2px 8px rgba(79,70,229,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {isUser ? (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div className="group max-w-[80%]" style={{ minWidth: 0 }}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'rounded-2xl rounded-br-md'
              : 'rounded-2xl rounded-bl-md'
          }`}
          style={{
            background: isUser
              ? 'linear-gradient(135deg, var(--primary), #6366F1)'
              : 'var(--bg-card)',
            color: isUser ? 'white' : 'var(--text-primary)',
            border: isUser ? 'none' : '1px solid var(--border)',
            boxShadow: isUser
              ? '0 2px 8px rgba(79,70,229,0.25)'
              : 'var(--shadow-sm)',
          }}
          dangerouslySetInnerHTML={{
            __html: isUser
              ? message.contenido
              : detectLinks(message.contenido),
          }}
        />

        {/* Timestamp + actions */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {formatTime(message.created_at)}
          </span>
          {!isUser && (
            <button
              onClick={() => navigator.clipboard.writeText(message.contenido)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] flex items-center gap-1"
              style={{ color: 'var(--text-tertiary)' }}
              title="Copiar respuesta"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copiar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

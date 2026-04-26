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
    return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export default function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.rol === 'user'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      
      {/* Kicker label */}
      <span className="kicker" style={{ fontSize: '0.625rem', marginBottom: 4 }}>
        {isUser ? 'Tú' : 'DataBot'}
      </span>

      {/* Body — editorial block */}
      <div style={{
        maxWidth: '75%',
        padding: '10px 16px',
        background: isUser ? 'var(--ink)' : 'var(--paper)',
        color: isUser ? 'var(--paper)' : 'var(--body)',
        border: isUser ? 'none' : '1px solid var(--hairline)',
        fontFamily: isUser ? 'var(--font-sans)' : 'var(--font-serif)',
        fontSize: isUser ? '0.875rem' : '0.9375rem',
        lineHeight: 1.65,
        fontStyle: !isUser ? 'italic' : 'normal',
      }}>
        <p style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: 'inherit',
          font: 'inherit',
          fontStyle: 'inherit',
          lineHeight: 'inherit',
        }}>
          {message.contenido}
        </p>
      </div>

      {/* Timestamp — mono kicker */}
      <span className="kicker" style={{
        fontSize: '0.625rem',
        marginTop: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {formatTime(message.created_at)}
        {!isUser && (
          <span
            onClick={() => navigator.clipboard.writeText(message.contenido)}
            style={{ cursor: 'pointer', borderBottom: '1px solid transparent' }}
            onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'var(--caption)'}
            onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
          >
            Copiar
          </span>
        )}
      </span>
    </div>
  )
}

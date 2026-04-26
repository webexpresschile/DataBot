'use client'

interface Props {
  message: {
    rol: 'user' | 'assistant'
    contenido: string
    created_at: string
  }
}

function fmt(iso: string): string {
  try { return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.rol === 'user'

  return (
    <div>
      {/* Kicker */}
      <span className="kicker" style={{ fontSize: '0.6875rem', letterSpacing: '0.8px', marginBottom: 6, display: 'block', color: 'var(--caption-gray)' }}>
        {isUser ? 'Técnico' : 'Teknocopy'}
      </span>

      {/* Body block */}
      <div style={{
        maxWidth: '78%',
        marginLeft: isUser ? 'auto' : 0,
      }}>
        <p style={{
          margin: 0,
          fontFamily: isUser ? 'var(--font-ui)' : 'var(--font-body)',
          fontSize: isUser ? '0.9375rem' : '1rem',
          lineHeight: isUser ? 1.6 : 1.65,
          color: 'var(--page-ink)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.contenido}
        </p>
      </div>

      {/* Timestamp + actions — mono lowercase is forbidden, use uppercase */}
      <span className="timestamp" style={{
        fontSize: '0.625rem',
        letterSpacing: '0.8px',
        marginTop: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}>
        {fmt(message.created_at)}
        {!isUser && (
          <span
            onClick={() => navigator.clipboard.writeText(message.contenido)}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              color: 'var(--page-ink)',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--link-blue)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--page-ink)'}
          >
            COPIAR
          </span>
        )}
      </span>

      {/* Hairline between messages */}
      <hr style={{ marginTop: 16 }} />
    </div>
  )
}

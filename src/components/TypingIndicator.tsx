export default function TypingIndicator() {
  return (
    <div style={{ marginBottom: 16 }}>
      <span className="kicker" style={{ fontSize: '0.625rem', marginBottom: 4, display: 'block' }}>
        DataBot
      </span>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '10px 16px',
        border: '1px solid var(--hairline)',
        background: 'var(--paper)',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6,
            height: 6,
            background: 'var(--caption)',
            display: 'inline-block',
            animation: 'dotPulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 200}ms`,
          }} />
        ))}
      </div>
    </div>
  )
}

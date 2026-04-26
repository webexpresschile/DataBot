export default function TypingIndicator() {
  return (
    <div style={{ marginBottom: 20 }}>
      <span className="kicker" style={{ fontSize: '0.6875rem', letterSpacing: '0.8px', marginBottom: 6, display: 'block', color: 'var(--caption-gray)' }}>
        DataBot
      </span>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6,
            height: 6,
            background: 'var(--wired-black)',
            display: 'inline-block',
            animation: 'dotPulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 200}ms`,
            borderRadius: 0, /* square dots */
          }} />
        ))}
      </div>
      <hr style={{ marginTop: 16 }} />
    </div>
  )
}

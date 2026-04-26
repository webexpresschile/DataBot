export default function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end animate-slide-in-up">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'linear-gradient(135deg, #374151, #1F2937)',
        }}
      >
        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>

      {/* Bouncing dots */}
      <div className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <span className="w-2 h-2 rounded-full"
          style={{
            background: 'var(--text-tertiary)',
            animation: 'bounceDots 1.4s ease-in-out infinite',
            animationDelay: '0ms',
          }}
        />
        <span className="w-2 h-2 rounded-full"
          style={{
            background: 'var(--text-tertiary)',
            animation: 'bounceDots 1.4s ease-in-out infinite',
            animationDelay: '200ms',
          }}
        />
        <span className="w-2 h-2 rounded-full"
          style={{
            background: 'var(--text-tertiary)',
            animation: 'bounceDots 1.4s ease-in-out infinite',
            animationDelay: '400ms',
          }}
        />
      </div>
    </div>
  )
}

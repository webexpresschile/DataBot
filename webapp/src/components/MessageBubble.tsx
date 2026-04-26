interface MessageBubbleProps {
  message: {
    rol: 'user' | 'assistant'
    contenido: string
    created_at: string
  }
  isLatest?: boolean
}

export default function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.rol === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLatest ? 'animate-slideIn' : ''}`}>
      <div className="flex gap-2 max-w-[85%]">
        {!isUser && (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.contenido}</p>
          <p className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
            {new Date(message.created_at).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        {isUser && (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
import ChatWindow from '@/components/ChatWindow'
import { useServiceWorker } from '@/hooks/useServiceWorker'

export default function Home() {
  useServiceWorker()

  return (
    <main className="min-h-screen bg-gray-100">
      <ChatWindow />
    </main>
  )
}
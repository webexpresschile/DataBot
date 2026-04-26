import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DataBot - Asistente Técnico con IA',
  description: 'Consulta manuales técnicos de fotocopiadoras, impresoras y equipos de oficina. Asistente inteligente con IA, disponible 24/7.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DataBot',
  },
  openGraph: {
    title: 'DataBot - Asistente Técnico con IA',
    description: 'Consulta manuales técnicos de equipos de oficina con inteligencia artificial.',
    type: 'website',
    siteName: 'DataBot',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4F46E5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}

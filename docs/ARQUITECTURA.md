# DataBot - Sistema de Consulta de Manuales Técnicos

## Arquitectura General

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DEL SISTEMA                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐      ┌──────────────┐      ┌───────────────┐   │
│  │   Google    │      │     N8N       │      │   Supabase    │   │
│  │   Drive     │─────▶│  (Railway)    │─────▶│  (PostgreSQL  │   │
│  │  (PDFs)     │      │  Self-hosted  │      │  + vectors)   │   │
│  └─────────────┘      └──────────────┘      └───────────────┘   │
│                             │                      ▲            │
│                             ▼                      │            │
│                      ┌──────────────┐             │            │
│                      │  MiniMax API  │──────────────┘            │
│                      │   ( M2.5 )  │                            │
│                      └──────────────┘                            │
│                             │                                    │
│         ┌──────────────────┴──────────────────┐                │
│         ▼                                    ▼                │
│  ┌─────────────┐      ┌──────────────┐                          │
│  │   Ollama   │      │    Vercel    │                          │
│  │ (Embeddin)│      │   (Web App)  │                          │
│  └─────────────┘      └──────────────┘                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Ingesta de Manuales (PDF → Vectores)
1. Técnico sube PDF a Google Drive (carpeta `manuales/`)
2. N8N detecta nuevo archivo via-webhook de Google Drive
3. N8N descarga PDF y extrae texto
4. Texto se fragmenta en chunks (∼500 caracteres)
5. Cada chunk se convierte a embedding vía OpenAI embeddings API
6. Embeddings se almacenan en Supabase con referencia al documento

### 2. Consulta de Técnico
1. Técnico abre web app y escribe consulta en español
2. Web app convierte consulta a embedding
3. Supabase busca chunks similares (similarity search)
4. N8N envía contexto + pregunta a Claude API
5. Claude responde en español con información del manual
6. Respuesta se guarda en historial de Supabase

## Stack Técnico

### Opción Gratuita (~$0/mes)

| Componente | Servicio | Costo |
|------------|----------|-------|
| Almacenamiento PDFs | Google Drive | $0 |
| Automatización | N8N (Railway) | $0 |
| Base de datos | Supabase | $0 |
| Embeddings | Ollama local (nomic-embed-text) | $0 |
| LLM | MiniMax API (créditos gratuitos) | $0 |
| Hosting web | Vercel | $0 |
| **Total** | | **$0** |

### Opción Mínima (~$2/mes)

| Componente | Servicio | Costo |
|------------|----------|-------|
| Embeddings | OpenAI API (25K chunks) | ~$2 |
| LLM | MiniMax API | $0 |
| **Total** | | **~$2/mes** |

## Estructura de Archivos

```
/DataBot
├── docs/
│   └── ARQUITECTURA.md          # Este documento
├── n8n/
│   ├── workflows/
│   │   ├── ingest-pdf.json      # Workflow para vectorizar PDFs
│   │   └── chat-query.json    # Workflow para consultas
│   └── instructions.md         # Instrucciones de setup N8N
├── supabase/
│   ├── schema.sql              # Esquema de base de datos
│   └── seed.sql                # Datos de ejemplo
├── webapp/
│   ├── package.json
│   ├── next.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── api/
│   │   │       └── chat/
│   │   │           └── route.ts
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── TypingIndicator.tsx
│   │   └── lib/
│   │       ├── supabase.ts
│   │       └── claude.ts
│   └── public/
│       └── favicon.ico
├── .env.example
├── README.md
└── SETUP.md
```

## Requisitos Funcionales

- [ ] Usuario puede registrase/login (auth Supabase)
- [ ] UI optimizada para móvil (pwa-ready)
- [ ] Chat con historial por usuario
- [ ] Búsqueda vectorial en manuales
- [ ] Respuestas en español desde manuales en otro idioma
- [ ] Cacheo básico para conectividad intermitente
- [ ] Agregar manual = subir PDF a Drive + esperar proceso

## Alternativas Consideradas

| Decisión | Alternativa | Razón de elección |
|----------|-------------|-------------------|
| Embeddings Ollama | OpenTextEmbeddings API | Ollama es 100% gratuito |
| MiniMax LLM | Claude API | MiniMax tiene créditos gratuitos |
| Supabase | Pinecone | Supabase ya tiene PostgreSQL para historial |
| Vercel | Railway web | Menos optimizado para Next.js |

## Próximos Pasos

1. Configurar Supabase (crear tablas y habilitar vector search)
2. Desplegar N8N en Railway
3. Crear workflow de ingestión de PDFs
4. Crear workflow de chat
5. Desarrollar web app en Next.js
6. Testing con 2-3 manuales
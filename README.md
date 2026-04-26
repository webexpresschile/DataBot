# DataBot - Sistema de Consulta de Manuales Técnicos

## Resumen

Sistema RAG (Retrieval-Augmented Generation) para consultar manuales técnicos de fotocopiadoras via chatbot. Optimizado para técnicos de terreno con conectividad intermitente.

## Tech Stack (Gratuito)

| Componente | Servicio | Costo |
|------------|----------|-------|
| PDFs | Google Drive | $0 |
| Automatización | N8N (Railway) | $0 |
| Base de datos | Supabase | $0 |
| Embeddings | Ollama local | $0 |
| LLM | MiniMax API | $0 |
| Web App | Vercel | $0 |
| **Total** | | **$0** |

## Estructura

```
/
├── docs/ARQUITECTURA.md      # Arquitectura detallada
├── supabase/
│   ├── schema.sql          # Schema de base de datos
│   └── SETUP.md           # Instrucciones Supabase
├── n8n/
│   ├── SETUP.md           # Instrucciones N8N
│   └── workflows/
│       ├── ingest-pdf.json     # Workflow ingestion PDFs
│       └── chat-query.json    # Workflow chat
└── webapp/                # Next.js web app
    ├── src/
    │   ├── app/api/chat/   # API route
    │   └── components/   # UI components
    └── SETUP.md          # Instrucciones Vercel
```

## Guía de Setup Paso a Paso

### Paso 1: Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a SQL Editor
3. Ejecutar `supabase/schema.sql`
4. Copiar credenciales (URL + anon key)

### Paso 2: N8N (Railway)

1. Desplegar desde [railway.new/n8n](https://railway.new/n8n)
2. Configurar credenciales:
   - Google Drive OAuth2
   - Supabase HTTP Header Auth
   - Ollama o OpenAI API (embeddings)
   - MiniMax API Key
3. Importar workflows de `n8n/workflows/`

### Paso 3: Web App (Vercel)

1. Conectar repo a Vercel
2. Configurar variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `MINIMAX_API_KEY`
   - `OPENAI_API_KEY` (o blank para Ollama)
   - `EMBEDDING_BASE_URL` (http://localhost:11434/v1 para Ollama)
   - `EMBEDDING_MODEL` (nomic-embed-text)
3. Desplegar

### Paso 4: Ollama (Embeddings locales)

```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelo de embeddings
ollama pull nomic-embed-text
```

### Paso 5: Agregar Manuales

1. Subir PDF a carpeta Google Drive "manuales"
2. N8N detecta automáticamente
3. Workflow extrae texto y genera embeddings
4. Listo para consultar

## Uso

1. Abre web app en el celular
2. Escribe tu consulta en español
3. Ejemplo: "La Ricoh MP 2014 marca error SC542, ¿qué significa?"
4. MiniMax responde en español con info del manual
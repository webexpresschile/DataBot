# Setup de Web App en Vercel

## Requisitos Previos

- Cuenta en [Vercel.com](https://vercel.com)
- Repo con el código en GitHub

## Paso 1: Preparar Código

1. En el repositorio local:
```bash
cd webapp
npm install
```

2. Verificar que compila:
```bash
npm run build
```

3. Hacer commit y push a GitHub

## Paso 2: Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **Add New...** → **Project**
3. Importa el repositorio `webapp`
4. Configura:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click en **Deploy**

## Paso 3: Configurar Variables de Entorno

En Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
MINIMAX_API_KEY=tu-minimax-key
OPENAI_API_KEY=sk-<deja-blanco-si-usas-ollama>
EMBEDDING_BASE_URL=http://localhost:11434/v1
EMBEDDING_MODEL=nomic-embed-text
```

## Optimizaciones para Móvil

### PWA - Manifesto

Crear `public/manifest.json`:

```json
{
  "name": "DataBot",
  "short_name": "DataBot",
  "description": "Consulta manuales técnicos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

Actualizar `layout.tsx` para incluir manifest.

### Cacheo para Offline

El código ya incluye:
- LocalStorage para mensajes cacheados
- Detección de conectividad (navigator.onLine)
- Cola de mensajes para enviar cuando haya conexión

## Costos

- Vercel Hobby: $0/mes
- Incluye 100GB bandwidth

## Verificar Funcionamiento

1. Abre la URL de Vercel en tu celular
2. Envía una pregunta
3. Verifica que responde con información de los manuales
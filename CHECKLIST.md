# DataBot - Checklist de Despliegue

## 1. Supabase (Base de Datos)

- [ ] Crear proyecto en [supabase.com](https://supabase.com)
- [ ] Ir a SQL Editor y ejecutar `supabase/schema.sql`
- [ ] Copiar credenciales:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Ollama (Embeddings Locales - Opcional)

```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelo de embeddings
ollama pull nomic-embed-text

# Verificar que funciona
curl http://localhost:11434/api/generate -d '{"model":"nomic-embed-text","prompt":"test"}'
```

## 3. N8N (Railway) - Opcional para Ingestión

- [ ] Desplegar desde [railway.new/n8n](https://railway.new/n8n)
- [ ] Configurar credenciales:
  - Google Drive OAuth2
  - Supabase HTTP Header Auth
- [ ] Importar workflows de `n8n/workflows/`

## 4. Web App (Vercel)

- [ ] Conectar repo a Vercel
- [ ] Configurar variables de entorno en Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
MINIMAX_API_KEY=tu-minimax-key
EMBEDDING_BASE_URL=http://localhost:11434/v1
EMBEDDING_MODEL=nomic-embed-text
```

- [ ] Desplegar: `npm run build` y `vercel deploy`

## 5. Probar la App

1. Abre la URL de Vercel en el celular
2. Instala como PWA (menú del navegador → "Agregar a pantalla de inicio")
3. Prueba sin conexión (modo avión)
4. Envía una consulta

## 6. Agregar Manuales

1. Sube PDF a Google Drive (carpeta `manuales/`)
2. N8N detecta automáticamente y procesa
3. O inserta manualmente en Supabase

## Verificación Rápida

```bash
# Verificar que compila
cd webapp && npm run build

# Verificar estructura
ls -la public/
ls -la public/icons/
```

## Troubleshooting

### Error 500 en API
- Verificar variables de entorno en Vercel
- Verificar que MINIMAX_API_KEY es válida

### No encuentra manuales
- Verificar que existe la función `buscar_en_vectores` en Supabase
- Verificar que hay datos en la tabla `vectores`

### PWA no se instala
- Verificar manifest.json accesible en `/manifest.json`
- Verificar service worker registrado en DevTools → Application

## Notas Importantes

- **Costo total**: $0/mes usando todas las opciones gratuitas
- **Autenticación**: La app usa sign-in anónimo de Supabase por defecto
- **Offline**: Los mensajes se guardan en localStorage y se envían cuando hay conexión
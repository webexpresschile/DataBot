# Setup de Supabase

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Click en "New Project"
3. Configura:
   - **Name**: `databot`
   - **Database Password**: Guarda esta contraseña (la necesitarás)
   - **Region**:选择 la más cercana a tus usuarios (ej: us-east-1)
4. Espera ∼1 minuto mientras se aprovisiona

## Paso 2: Configurar Base de Datos

1. En el dashboard, click en **SQL Editor** (sidebar izquierdo)
2. Copia todo el contenido de `supabase/schema.sql`
3. Pega en el editor y click **Run**
4. Verifica que no hay errores (la salida debe decir "Success")

## Paso 3: Obtener Credenciales

1. Ve a **Project Settings** (ícono de engranaje, abajo a la izq)
2. Click en **API**
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Paso 4: Habilitar Auth (Google OAuth)

1. En sidebar, ve a **Authentication** → **Providers**
2. Click en **Google** y habilita:
   - **Enable Google Auth**: ON
   - Ingresa tu client ID y secret de Google Cloud Console
3. Guardar cambios

## Alternativa: Email/Magic Link

Si no tienes OAuth configurado:
1. En **Authentication** → **Providers** → **Email**
2. Habilita **Enable Email Signups**
3. Los usuarios reciben magic link para iniciar sesión

## Verificar Setup

En SQL Editor ejecuta:
```sql
SELECT count(*) FROM manuales;
SELECT count(*) FROM vectores;
SELECT count(*) FROM conversaciones;
```

Debe retornar `0` en todas (tablas vacías).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

export async function POST(request: NextRequest) {
  try {
    const { question, session_id, user_id } = await request.json()

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 })
    }

    const embedding = await generateEmbedding(question)

    const { data: searchResults, error: searchError } = await supabase.rpc(
      'buscar_en_vectores',
      {
        query_text: question,
        match_count: 5
      }
    )

    if (searchError) {
      console.error('Search error:', searchError)
    }

    const context = searchResults
      ?.map((r: any) => r.chunk_text)
      .join('\n\n---\n\n') || ''

    const systemPrompt = `Eres un asistente técnico especializado en fotocopiadoras y máquinas de oficina. 

Respondes SIEMPRE en español, de manera clara y concisa.

Instrucciones:
1. Usa la información del contexto del manual cuando esté disponible
2. Si no hay información clara en el contexto, indica que no tienes esa información específica
3. Incluye el número de página o sección cuando sea relevante
4. Da pasos claros para resolver el problema si es una falla
5. Si el manual está en otro idioma, traduce y resume la información relevante al español

Contexto del manual:
${context || 'No hay manuales cargados aún.'}`

    // Usar DeepSeek en vez de MiniMax
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 1024
      })
    })

    const deepseekData = await deepseekResponse.json()
    const answer = deepseekData.choices?.[0]?.message?.content || 'No se pudo generar respuesta'

    if (session_id) {
      await supabase.from('mensajes').insert({
        conversacion_id: session_id,
        rol: 'user',
        contenido: question
      })

      await supabase.from('mensajes').insert({
        conversacion_id: session_id,
        rol: 'assistant',
        contenido: answer
      })
    }

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    )
  }
}

async function generateEmbedding(text: string) {
  // Usar OpenRouter para embeddings (gratis con crédito inicial)
  const apiKey = process.env.OPENROUTER_API_KEY || ''
  const baseUrl = process.env.EMBEDDING_BASE_URL || 'https://openrouter.ai/api/v1'
  
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'DataBot'
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
      input: text
    })
  })

  const data = await response.json()
  return data.data?.[0]?.embedding
}

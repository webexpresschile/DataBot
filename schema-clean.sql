CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS manuales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100) NOT NULL,
    drive_file_id VARCHAR(255) UNIQUE,
    drive_link VARCHAR(500),
    total_chunks INTEGER DEFAULT 0,
    Procesado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vectores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manual_id UUID REFERENCES manuales(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(1536),
    page_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('user', 'assistant')),
    contenido TEXT NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vectores_embedding 
ON vectores USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_vectores_manual_id ON vectores(manual_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_user ON conversaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id);

CREATE OR REPLACE FUNCTION buscar_en_vectores(
    query_text TEXT,
    match_count INTEGER DEFAULT 5,
    filter_manual_id UUID DEFAULT NULL
)
RETURNS TABLE (
    chunk_text TEXT,
    similarity FLOAT,
    manual_id UUID,
    page_number INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.chunk_text,
        1 - (v.embedding <=> openai_embeddings_create($1)::vector) AS similarity,
        v.manual_id,
        v.page_number
    FROM vectores v
    WHERE filter_manual_id IS NULL OR v.manual_id = filter_manual_id
    ORDER BY v.embedding <=> openai_embeddings_create($1)::vector
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION openai_embeddings_create(text_input TEXT)
RETURNS vector(1536) AS $$
DECLARE
    result vector(1536);
    api_response JSON;
BEGIN
    result := '[]'::vector;
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at_conversaciones
BEFORE UPDATE ON conversaciones
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_updated_at_manuales
BEFORE UPDATE ON manuales
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE manuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE vectores ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manuales públicos" ON manuales
FOR SELECT USING (TRUE);

CREATE POLICY "Conversaciones propias" ON conversaciones
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Mensajes de mis conversaciones" ON mensajes
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM conversaciones c 
        WHERE c.id = mensajes.conversacion_id 
        AND c.user_id = auth.uid()
    )
);

CREATE OR REPLACE VIEW vista_manuales AS
SELECT 
    id,
    nombre,
    marca,
    modelo,
    drive_file_id,
    drive_link,
    total_chunks,
    Procesado,
    created_at,
    updated_at
FROM manuales
ORDER BY created_at DESC;

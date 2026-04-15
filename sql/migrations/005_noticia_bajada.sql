-- Migración 005: agrega columna bajada (texto de la noticia) a la tabla noticia
ALTER TABLE noticia ADD COLUMN IF NOT EXISTS bajada TEXT;

-- Migración 004: hashtags por caso
-- Ejecutar con: psql -U rafaelramos -d ecoh_dev -f sql/migrations/004_hashtags.sql

CREATE TABLE IF NOT EXISTS hashtag (
  id    SERIAL PRIMARY KEY,
  texto VARCHAR(60) NOT NULL UNIQUE  -- sin '#', ej: "reincidente", "banda_organizada"
);

CREATE TABLE IF NOT EXISTS caso_hashtag (
  id_caso    INTEGER NOT NULL REFERENCES caso(id) ON DELETE CASCADE,
  id_hashtag INTEGER NOT NULL REFERENCES hashtag(id) ON DELETE CASCADE,
  PRIMARY KEY (id_caso, id_hashtag)
);

CREATE INDEX IF NOT EXISTS idx_caso_hashtag_caso    ON caso_hashtag(id_caso);
CREATE INDEX IF NOT EXISTS idx_caso_hashtag_hashtag ON caso_hashtag(id_hashtag);
CREATE INDEX IF NOT EXISTS idx_hashtag_texto        ON hashtag(texto);

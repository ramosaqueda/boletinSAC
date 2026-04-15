-- Migración 002: agregar usuario rramos y setear password
-- Ejecutar con: psql -U rafaelramos -d ecoh_dev -f sql/migrations/002_usuario_rramos.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Asegurar columna password_hash (si no se ejecutó migración 001)
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Insertar usuario o actualizar si ya existe
INSERT INTO usuario (nombre, email, password_hash, id_rol)
VALUES (
  'Rafael Ramos',
  'rramos@minpublico.cl',
  crypt('ecoh1234', gen_salt('bf', 12)),
  (SELECT id FROM p_rol_usuario WHERE codigo = 'analista')
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = crypt('ecoh1234', gen_salt('bf', 12));

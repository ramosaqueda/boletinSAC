-- =============================================================================
-- Migración 001: agregar columna password_hash a usuario
-- Ejecutar UNA VEZ sobre la base ya creada con bd.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE usuario
  ADD COLUMN password_hash VARCHAR(255);

-- Contraseña inicial para el usuario demo: ecoh1234
-- (bcrypt generado con pgcrypto, compatible con bcryptjs en Node)
UPDATE usuario
SET password_hash = crypt('ecoh1234', gen_salt('bf', 12))
WHERE email = 'rramos@minpublico.cl';

-- IMPORTANTE: cambiar esta contraseña en producción

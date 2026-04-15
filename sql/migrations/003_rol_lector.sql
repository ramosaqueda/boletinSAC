-- Migración 003: agregar rol 'lector' para acceso público interno
-- Ejecutar con: psql -U rafaelramos -d ecoh_dev -f sql/migrations/003_rol_lector.sql

INSERT INTO p_rol_usuario (codigo, nombre, orden)
VALUES ('lector', 'Lector', 2)
ON CONFLICT (codigo) DO NOTHING;

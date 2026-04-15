-- Migración 006: agrega tipo de foto "prensa" para imágenes bajadas desde noticias
INSERT INTO p_tipo_foto (codigo, nombre, orden)
VALUES ('prensa', 'Imagen de prensa', 3)
ON CONFLICT (codigo) DO NOTHING;

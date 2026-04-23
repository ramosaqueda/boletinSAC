-- Migration 007: tabla boletin_conclusion
-- Permite al analista agregar conclusiones, tendencias, recomendaciones y alertas al boletín

CREATE TABLE boletin_conclusion (
  id         SERIAL PRIMARY KEY,
  id_boletin INTEGER      NOT NULL REFERENCES boletin(id) ON DELETE CASCADE,
  orden      SMALLINT     NOT NULL DEFAULT 0,
  tipo       VARCHAR(20)  NOT NULL DEFAULT 'info'
             CONSTRAINT ck_conclusion_tipo CHECK (tipo IN ('info','advertencia','tendencia','recomendacion','alerta')),
  texto      TEXT         NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boletin_conclusion_boletin ON boletin_conclusion(id_boletin, orden);

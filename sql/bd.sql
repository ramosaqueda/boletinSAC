-- =============================================================================
-- PORTAL SACFI-ECOH — Fiscalía Región de Coquimbo
-- Modelo de datos PostgreSQL v2.0
-- Estrategia: tablas paramétricas en lugar de ENUMs
--             → valores editables sin DDL, compatibles con CRUD de administración
-- =============================================================================

-- =============================================================================
-- TABLAS PARAMÉTRICAS (p_*)
-- Estructura uniforme: id, codigo (slug único), nombre (etiqueta UI),
--                      orden (posición en listas), activo (soft-delete)
-- =============================================================================

CREATE TABLE p_rol_usuario (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_rol_usuario (codigo, nombre, orden) VALUES
  ('analista',      'Analista',      1),
  ('fiscal',        'Fiscal',        2),
  ('supervisor',    'Supervisor',    3),
  ('administrador', 'Administrador', 4);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_estado_boletin (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_estado_boletin (codigo, nombre, orden) VALUES
  ('borrador',    'Borrador',     1),
  ('en_revision', 'En revisión',  2),
  ('publicado',   'Publicado',    3);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_tipo_delito (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_tipo_delito (codigo, nombre, orden) VALUES
  ('trafico_drogas',         'Tráfico de drogas',              1),
  ('microtrafico',           'Microtráfico',                   2),
  ('porte_armas',            'Porte de armas',                 3),
  ('robo_violencia',         'Robo con violencia',             4),
  ('robo_intimidacion',      'Robo con intimidación',          5),
  ('robo_lugar_habitado',    'Robo en lugar habitado',         6),
  ('robo_lugar_no_habitado', 'Robo en lugar no habitado',      7),
  ('violacion_morada',       'Violación de morada',            8),
  ('hurto_simple',           'Hurto simple',                   9),
  ('lesiones',               'Lesiones',                      10),
  ('vif',                    'Violencia intrafamiliar',        11),
  ('homicidio',              'Homicidio',                     12),
  ('otro',                   'Otro',                          99);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_estado_causa (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_estado_causa (codigo, nombre, orden) VALUES
  ('en_libertad',              'En libertad',                      1),
  ('prision_preventiva',       'Prisión preventiva',               2),
  ('arraigo_nacional',         'Arraigo nacional',                 3),
  ('arraigo_firma_mensual',    'Arraigo + firma mensual',          4),
  ('sin_info_fcd',             'Sin información en FCD',           5),
  ('imputado_no_identificado', 'Imputado no identificado',         6);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_tipo_lugar (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_tipo_lugar (codigo, nombre, orden) VALUES
  ('via_publica',                  'Vía pública',                   1),
  ('inmueble_residencial',         'Inmueble residencial',          2),
  ('local_comercial',              'Local comercial',               3),
  ('vehiculo',                     'Vehículo',                      4),
  ('establecimiento_educacional',  'Establecimiento educacional',   5),
  ('otro',                         'Otro',                         99);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_comuna (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_comuna (codigo, nombre, orden) VALUES
  ('la_serena',  'La Serena',  1),
  ('coquimbo',   'Coquimbo',   2),
  ('andacollo',  'Andacollo',  3),
  ('la_higuera', 'La Higuera', 4),
  ('paiguano',   'Paiguano',   5),
  ('vicuna',     'Vicuña',     6);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_tipo_documento (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_tipo_documento (codigo, nombre, orden) VALUES
  ('rut',           'RUT',          1),
  ('dni',           'DNI',          2),
  ('pasaporte',     'Pasaporte',    3),
  ('sin_documento', 'Sin documento',4);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_sexo (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_sexo (codigo, nombre, orden) VALUES
  ('masculino',      'Masculino',       1),
  ('femenino',       'Femenino',        2),
  ('no_especificado','No especificado', 3);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_sit_migratoria (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_sit_migratoria (codigo, nombre, orden) VALUES
  ('sin_movimientos',       'Sin movimientos registrados', 1),
  ('movimientos_registrados','Con movimientos registrados', 2),
  ('consultar_srce',        'Consultar SRCE',              3),
  ('no_aplica',             'No aplica',                   4);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_calidad_victima (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_calidad_victima (codigo, nombre, orden) VALUES
  ('persona_natural',   'Persona natural',    1),
  ('empresa',           'Empresa',            2),
  ('institucion_publica','Institución pública',3),
  ('funcionario',       'Funcionario',        4),
  ('anonima',           'Anónima',            5);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_tipo_lesiones (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_tipo_lesiones (codigo, nombre, orden) VALUES
  ('sin_lesiones', 'Sin lesiones',  1),
  ('leves',        'Leves',         2),
  ('menos_graves', 'Menos graves',  3),
  ('graves',       'Graves',        4),
  ('gravisimas',   'Gravísimas',    5),
  ('fallecido',    'Fallecido',     6);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_tipo_especie (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_tipo_especie (codigo, nombre, orden) VALUES
  ('droga',        'Droga',           1),
  ('arma_fuego',   'Arma de fuego',   2),
  ('arma_blanca',  'Arma blanca',     3),
  ('vehiculo',     'Vehículo',        4),
  ('dinero',       'Dinero',          5),
  ('herramientas', 'Herramientas',    6),
  ('electronicos', 'Electrónicos',    7),
  ('otro',         'Otro',           99);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_subtipo_droga (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_subtipo_droga (codigo, nombre, orden) VALUES
  ('pasta_base',          'Pasta base de cocaína',  1),
  ('clorhidrato_cocaina', 'Clorhidrato de cocaína', 2),
  ('marihuana',           'Marihuana',              3),
  ('extasis_mdma',        'Éxtasis / MDMA',         4),
  ('heroina',             'Heroína',                5),
  ('metanfetamina',       'Metanfetamina',          6),
  ('multiple',            'Múltiple tipo',          7),
  ('otro',                'Otro',                  99);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_subtipo_arma (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_subtipo_arma (codigo, nombre, orden) VALUES
  ('fuego_real',     'Fuego real',        1),
  ('fogueo',         'Fogueo',            2),
  ('aire_comprimido','Aire comprimido',   3),
  ('blanca',         'Arma blanca',       4),
  ('replica',        'Réplica',           5),
  ('otro',           'Otro',             99);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_estado_especie (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_estado_especie (codigo, nombre, orden) VALUES
  ('incautado',   'Incautado',   1),
  ('recuperado',  'Recuperado',  2),
  ('en_busqueda', 'En búsqueda', 3),
  ('destruido',   'Destruido',   4);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_rol_vehiculo (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_rol_vehiculo (codigo, nombre, orden) VALUES
  ('usado_en_huida', 'Usado en huida', 1),
  ('incautado',      'Incautado',      2),
  ('robado',         'Robado',         3),
  ('recuperado',     'Recuperado',     4);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_tipo_foto (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_tipo_foto (codigo, nombre, orden) VALUES
  ('fotografia_ss', 'Fotografía SS',  1),
  ('incautacion',   'Incautación',    2),
  ('lugar',         'Lugar del hecho',3),
  ('imputado',      'Imputado',       4),
  ('vehiculo',      'Vehículo',       5),
  ('otro',          'Otro',          99);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_tipo_match (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_tipo_match (codigo, nombre, orden) VALUES
  ('manual',         'Manual',          1),
  ('ruc',            'Por RUC',         2),
  ('geolocalizacion','Geolocalización', 3),
  ('keyword',        'Por palabra clave',4);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE p_estado_noticia (
  id     SMALLSERIAL  PRIMARY KEY,
  codigo VARCHAR(60)  NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  orden  SMALLINT     NOT NULL DEFAULT 0,
  activo BOOLEAN      NOT NULL DEFAULT TRUE
);
INSERT INTO p_estado_noticia (codigo, nombre, orden) VALUES
  ('pendiente',  'Pendiente',  1),
  ('aceptada',   'Aceptada',   2),
  ('descartada', 'Descartada', 3);

-- =============================================================================
-- TABLA: usuario
-- =============================================================================
CREATE TABLE usuario (
  id          SERIAL      PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  id_rol      SMALLINT    NOT NULL REFERENCES p_rol_usuario(id),
  activo      BOOLEAN     NOT NULL DEFAULT TRUE,
  fecha_alta  DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE usuario IS 'Analistas y usuarios del sistema con control de acceso.';

-- =============================================================================
-- TABLA: fiscal
-- =============================================================================
CREATE TABLE fiscal (
  id         SERIAL       PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  unidad     VARCHAR(100),
  activo     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE fiscal IS 'Catálogo de fiscales a cargo de las causas.';

INSERT INTO fiscal (nombre, unidad) VALUES
  ('Andrés Gálvez',  'ECOH Elqui'),
  ('Claudio Sobarzo','ECOH Elqui'),
  ('Claudio Correa', 'ECOH Elqui'),
  ('Mauricio Cartes','ECOH Elqui');

-- =============================================================================
-- TABLA: boletin
-- =============================================================================
CREATE TABLE boletin (
  id          SERIAL      PRIMARY KEY,
  numero      INTEGER     NOT NULL,
  fecha_desde DATE        NOT NULL,
  fecha_hasta DATE        NOT NULL,
  provincia   VARCHAR(80) NOT NULL DEFAULT 'Provincia del Elqui',
  region      VARCHAR(80) NOT NULL DEFAULT 'Región de Coquimbo',
  id_analista INTEGER     REFERENCES usuario(id),
  id_estado   SMALLINT    NOT NULL REFERENCES p_estado_boletin(id),
  resumen     TEXT,
  fecha_pub   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT boletin_fechas_ok CHECK (fecha_hasta >= fecha_desde)
);
COMMENT ON TABLE boletin IS 'Encabezado del reporte semanal. Agrupa todos los casos de una semana.';
CREATE INDEX idx_boletin_numero ON boletin(numero);
CREATE INDEX idx_boletin_estado ON boletin(id_estado);

-- =============================================================================
-- TABLA: caso
-- =============================================================================
CREATE TABLE caso (
  id                  SERIAL      PRIMARY KEY,
  id_boletin          INTEGER     NOT NULL REFERENCES boletin(id) ON DELETE RESTRICT,
  numero_caso         INTEGER     NOT NULL,
  fecha_hecho         DATE        NOT NULL,
  hora_hecho          TIME,
  ruc                 VARCHAR(15) NOT NULL,
  folio_bitacora      VARCHAR(30),
  id_tipo_delito_ppal SMALLINT    NOT NULL REFERENCES p_tipo_delito(id),
  tipo_delito_sec     VARCHAR(100),
  relato_breve        TEXT        NOT NULL,
  id_estado_causa     SMALLINT    NOT NULL REFERENCES p_estado_causa(id),
  plazo_invest_dias   INTEGER     CHECK (plazo_invest_dias IN (30, 60, 90, 120, 180)),
  id_fiscal           INTEGER     REFERENCES fiscal(id),
  unidad_policial     VARCHAR(100),
  unidad_invest       VARCHAR(50),
  diligencias         TEXT,
  observaciones       TEXT,
  url_noticia_1       VARCHAR(500),
  url_noticia_2       VARCHAR(500),
  usuario_ingreso     INTEGER     REFERENCES usuario(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT caso_ruc_formato CHECK (ruc ~ '^\d{7,10}-[\dKk]$'),
  UNIQUE (id_boletin, numero_caso)
);
COMMENT ON TABLE caso IS 'Entidad principal. Registra cada hecho delictual del boletín semanal.';
CREATE INDEX idx_caso_boletin ON caso(id_boletin);
CREATE INDEX idx_caso_fecha   ON caso(fecha_hecho);
CREATE INDEX idx_caso_ruc     ON caso(ruc);
CREATE INDEX idx_caso_delito  ON caso(id_tipo_delito_ppal);
CREATE INDEX idx_caso_estado  ON caso(id_estado_causa);
CREATE INDEX idx_caso_fiscal  ON caso(id_fiscal);

-- =============================================================================
-- TABLA: lugar
-- =============================================================================
CREATE TABLE lugar (
  id             SERIAL       PRIMARY KEY,
  id_caso        INTEGER      NOT NULL REFERENCES caso(id) ON DELETE CASCADE,
  direccion      VARCHAR(200) NOT NULL,
  sector         VARCHAR(100),
  id_comuna      SMALLINT     NOT NULL REFERENCES p_comuna(id),
  provincia      VARCHAR(50)  NOT NULL DEFAULT 'Provincia del Elqui',
  id_tipo_lugar  SMALLINT     REFERENCES p_tipo_lugar(id),
  coordenada_lat DECIMAL(10,7),
  coordenada_lon DECIMAL(10,7),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE lugar IS 'Datos geográficos del hecho. Separado para análisis territorial.';
CREATE INDEX idx_lugar_caso   ON lugar(id_caso);
CREATE INDEX idx_lugar_comuna ON lugar(id_comuna);

-- =============================================================================
-- TABLA: imputado
-- =============================================================================
CREATE TABLE imputado (
  id                  SERIAL      PRIMARY KEY,
  id_caso             INTEGER     NOT NULL REFERENCES caso(id) ON DELETE CASCADE,
  apellido_paterno    VARCHAR(80) NOT NULL,
  apellido_materno    VARCHAR(80),
  nombres             VARCHAR(100)NOT NULL,
  id_tipo_documento   SMALLINT    NOT NULL REFERENCES p_tipo_documento(id),
  numero_documento    VARCHAR(20) NOT NULL,
  fecha_nacimiento    DATE,
  id_sexo             SMALLINT    REFERENCES p_sexo(id),
  nacionalidad        CHAR(3),                              -- ISO 3166-1 alpha-3
  num_causas_previas  INTEGER     NOT NULL DEFAULT 0 CHECK (num_causas_previas >= 0),
  tipos_causas_prev   TEXT,
  num_complices       INTEGER     NOT NULL DEFAULT 0 CHECK (num_complices >= 0),
  identidades_mult    VARCHAR(200),
  id_sit_migratoria   SMALLINT    REFERENCES p_sit_migratoria(id),
  foto_url            VARCHAR(500),
  alerta_reincidencia BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE imputado IS 'Persona detenida/formalizada en el caso. Un caso puede tener múltiples imputados.';
CREATE INDEX idx_imputado_caso   ON imputado(id_caso);
CREATE INDEX idx_imputado_doc    ON imputado(numero_documento);
CREATE INDEX idx_imputado_alerta ON imputado(alerta_reincidencia);
CREATE INDEX idx_imputado_nac    ON imputado(nacionalidad);

-- Trigger: marcar alerta_reincidencia automáticamente si causas >= 10
CREATE OR REPLACE FUNCTION fn_imputado_alerta()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.alerta_reincidencia := (NEW.num_causas_previas >= 10);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_imputado_alerta
BEFORE INSERT OR UPDATE ON imputado
FOR EACH ROW EXECUTE FUNCTION fn_imputado_alerta();

-- Vista con nombre completo calculado
CREATE OR REPLACE VIEW v_imputado_completo AS
SELECT
  i.*,
  TRIM(i.apellido_paterno || ' ' || COALESCE(i.apellido_materno,'') || ', ' || i.nombres) AS nombre_completo,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.fecha_nacimiento))::INTEGER AS edad,
  td.codigo  AS tipo_documento_codigo,
  s.codigo   AS sexo_codigo,
  sm.codigo  AS sit_migratoria_codigo,
  c.ruc,
  td2.codigo AS tipo_delito_ppal,
  c.fecha_hecho,
  b.numero   AS numero_boletin
FROM imputado i
JOIN caso          c   ON c.id  = i.id_caso
JOIN boletin       b   ON b.id  = c.id_boletin
JOIN p_tipo_documento td  ON td.id = i.id_tipo_documento
LEFT JOIN p_sexo       s  ON s.id  = i.id_sexo
LEFT JOIN p_sit_migratoria sm ON sm.id = i.id_sit_migratoria
JOIN p_tipo_delito   td2 ON td2.id = c.id_tipo_delito_ppal;

-- =============================================================================
-- TABLA: victima
-- =============================================================================
CREATE TABLE victima (
  id               SERIAL      PRIMARY KEY,
  id_caso          INTEGER     NOT NULL REFERENCES caso(id) ON DELETE CASCADE,
  nombre           VARCHAR(200),
  rut              VARCHAR(15),
  id_calidad       SMALLINT    REFERENCES p_calidad_victima(id),
  id_tipo_lesiones SMALLINT    REFERENCES p_tipo_lesiones(id),
  observaciones    VARCHAR(300),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE victima IS 'Persona o entidad afectada por el delito.';
CREATE INDEX idx_victima_caso ON victima(id_caso);

-- =============================================================================
-- TABLA: incautacion
-- =============================================================================
CREATE TABLE incautacion (
  id               SERIAL      PRIMARY KEY,
  id_caso          INTEGER     NOT NULL REFERENCES caso(id) ON DELETE CASCADE,
  id_tipo_especie  SMALLINT    NOT NULL REFERENCES p_tipo_especie(id),
  descripcion      VARCHAR(300)NOT NULL,
  id_subtipo_droga SMALLINT    REFERENCES p_subtipo_droga(id),
  cantidad         DECIMAL(12,3),
  unidad_medida    VARCHAR(20),
  nue              VARCHAR(20),
  id_subtipo_arma  SMALLINT    REFERENCES p_subtipo_arma(id),
  calibre          VARCHAR(30),
  marca_arma       VARCHAR(50),
  num_serie_arma   VARCHAR(30),
  id_estado_especie SMALLINT   REFERENCES p_estado_especie(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE incautacion IS 'Especies, drogas, armas u objetos decomisados. N por caso.';
CREATE INDEX idx_incautacion_caso  ON incautacion(id_caso);
CREATE INDEX idx_incautacion_tipo  ON incautacion(id_tipo_especie);
CREATE INDEX idx_incautacion_droga ON incautacion(id_subtipo_droga);

-- =============================================================================
-- TABLA: vehiculo
-- =============================================================================
CREATE TABLE vehiculo (
  id              SERIAL      PRIMARY KEY,
  id_caso         INTEGER     NOT NULL REFERENCES caso(id) ON DELETE CASCADE,
  patente         VARCHAR(10),
  marca           VARCHAR(50),
  modelo          VARCHAR(50),
  color           VARCHAR(30),
  tipo            VARCHAR(30),
  id_rol_vehiculo SMALLINT    REFERENCES p_rol_vehiculo(id),
  tiene_gps       BOOLEAN     NOT NULL DEFAULT FALSE,
  observaciones   VARCHAR(200),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE vehiculo IS 'Vehículos involucrados en el hecho (huida, robo, incautación).';
CREATE INDEX idx_vehiculo_caso    ON vehiculo(id_caso);
CREATE INDEX idx_vehiculo_patente ON vehiculo(patente);

-- =============================================================================
-- TABLA: fotografia
-- =============================================================================
CREATE TABLE fotografia (
  id            SERIAL      PRIMARY KEY,
  id_caso       INTEGER     NOT NULL REFERENCES caso(id) ON DELETE CASCADE,
  id_tipo_foto  SMALLINT    NOT NULL REFERENCES p_tipo_foto(id),
  descripcion   VARCHAR(150),
  archivo_url   VARCHAR(500)NOT NULL,
  fecha_captura TIMESTAMPTZ,
  orden         INTEGER     NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE fotografia IS 'Archivos de imagen vinculados al caso (SS, evidencia, lugar, imputado).';
CREATE INDEX idx_foto_caso ON fotografia(id_caso);

-- =============================================================================
-- TABLA: noticia
-- =============================================================================
CREATE TABLE noticia (
  id               SERIAL      PRIMARY KEY,
  id_caso          INTEGER     NOT NULL REFERENCES caso(id) ON DELETE CASCADE,
  url              VARCHAR(500)NOT NULL,
  medio            VARCHAR(100),
  titular          VARCHAR(300),
  fecha_pub        DATE,
  id_tipo_match    SMALLINT    REFERENCES p_tipo_match(id),
  id_estado_noticia SMALLINT   REFERENCES p_estado_noticia(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE noticia IS 'Artículos de prensa vinculados al caso. Manual en Fase 1, automático en Fase 2.';
CREATE INDEX idx_noticia_caso ON noticia(id_caso);

-- =============================================================================
-- TRIGGERS: updated_at automático
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_boletin_updated BEFORE UPDATE ON boletin  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_caso_updated    BEFORE UPDATE ON caso     FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_usuario_updated BEFORE UPDATE ON usuario  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- VISTAS ÚTILES
-- =============================================================================

CREATE OR REPLACE VIEW v_resumen_boletin AS
SELECT
  b.id,
  b.numero,
  b.fecha_desde,
  b.fecha_hasta,
  eb.codigo                                                                      AS estado,
  COUNT(DISTINCT c.id)                                                           AS total_casos,
  COUNT(DISTINCT i.id)                                                           AS total_imputados,
  COUNT(DISTINCT CASE WHEN ec.codigo = 'prision_preventiva' THEN c.id END)      AS casos_prision,
  COUNT(DISTINCT CASE WHEN i.alerta_reincidencia THEN i.id END)                 AS imputados_alerta,
  COUNT(DISTINCT n.id)                                                           AS noticias_vinculadas,
  SUM(inc.cantidad) FILTER (WHERE te.codigo = 'droga')                          AS gramos_droga_total
FROM boletin b
JOIN p_estado_boletin eb ON eb.id = b.id_estado
LEFT JOIN caso        c   ON c.id_boletin   = b.id
LEFT JOIN p_estado_causa ec ON ec.id = c.id_estado_causa
LEFT JOIN imputado    i   ON i.id_caso      = c.id
LEFT JOIN noticia     n   ON n.id_caso      = c.id
LEFT JOIN incautacion inc ON inc.id_caso    = c.id
LEFT JOIN p_tipo_especie te ON te.id = inc.id_tipo_especie
GROUP BY b.id, b.numero, b.fecha_desde, b.fecha_hasta, eb.codigo;

CREATE OR REPLACE VIEW v_caso_detalle AS
SELECT
  c.id,
  c.id_boletin,
  b.numero                                    AS numero_boletin,
  c.numero_caso,
  c.fecha_hecho,
  c.ruc,
  td.codigo                                   AS tipo_delito_ppal,
  td.nombre                                   AS tipo_delito_ppal_nombre,
  c.tipo_delito_sec,
  ec.codigo                                   AS estado_causa,
  c.plazo_invest_dias,
  f.nombre                                    AS fiscal,
  l.direccion,
  l.sector,
  com.nombre                                  AS comuna,
  tl.codigo                                   AS tipo_lugar,
  COUNT(DISTINCT i.id)                        AS num_imputados,
  MAX(i.num_causas_previas)                   AS max_causas_imputado,
  BOOL_OR(i.alerta_reincidencia)              AS tiene_alerta,
  COUNT(DISTINCT inc.id)                      AS num_incautaciones,
  SUM(inc.cantidad) FILTER (
    WHERE te.codigo = 'droga'
  )                                           AS gramos_droga,
  COUNT(DISTINCT n.id)                        AS num_noticias,
  COUNT(DISTINCT foto.id)                     AS num_fotos
FROM caso             c
JOIN boletin          b    ON b.id    = c.id_boletin
JOIN p_tipo_delito    td   ON td.id   = c.id_tipo_delito_ppal
JOIN p_estado_causa   ec   ON ec.id   = c.id_estado_causa
LEFT JOIN fiscal      f    ON f.id    = c.id_fiscal
LEFT JOIN lugar       l    ON l.id_caso = c.id
LEFT JOIN p_comuna    com  ON com.id  = l.id_comuna
LEFT JOIN p_tipo_lugar tl  ON tl.id  = l.id_tipo_lugar
LEFT JOIN imputado    i    ON i.id_caso = c.id
LEFT JOIN incautacion inc  ON inc.id_caso = c.id
LEFT JOIN p_tipo_especie te ON te.id = inc.id_tipo_especie
LEFT JOIN noticia     n    ON n.id_caso = c.id
LEFT JOIN fotografia  foto ON foto.id_caso = c.id
GROUP BY c.id, b.numero, td.codigo, td.nombre, ec.codigo, f.nombre,
         l.direccion, l.sector, com.nombre, tl.codigo;

CREATE OR REPLACE VIEW v_alertas_reincidencia AS
SELECT
  i.id,
  TRIM(i.apellido_paterno || ' ' || COALESCE(i.apellido_materno,'') || ', ' || i.nombres) AS nombre_completo,
  i.numero_documento,
  td_doc.codigo AS tipo_documento,
  i.nacionalidad,
  i.num_causas_previas,
  i.num_complices,
  c.ruc,
  td.codigo  AS tipo_delito_ppal,
  c.fecha_hecho,
  b.numero   AS numero_boletin
FROM imputado       i
JOIN caso           c    ON c.id   = i.id_caso
JOIN boletin        b    ON b.id   = c.id_boletin
JOIN p_tipo_documento td_doc ON td_doc.id = i.id_tipo_documento
JOIN p_tipo_delito  td   ON td.id  = c.id_tipo_delito_ppal
WHERE i.alerta_reincidencia = TRUE
ORDER BY i.num_causas_previas DESC;

-- =============================================================================
-- DATOS DE EJEMPLO — Boletín N°9 (semana 23-29 mayo 2025)
-- =============================================================================

INSERT INTO usuario (nombre, email, id_rol)
VALUES ('Lissette Mujica Inaiman', 'lmujica@fiscaliadechile.cl',
        (SELECT id FROM p_rol_usuario WHERE codigo = 'analista'));

INSERT INTO boletin (numero, fecha_desde, fecha_hasta, id_analista, id_estado, resumen)
VALUES (
  9, '2025-05-23', '2025-05-29', 1,
  (SELECT id FROM p_estado_boletin WHERE codigo = 'publicado'),
  'El reporte sistematiza 9 delitos de interés SACFI-ECOH concentrados en la conurbación La Serena–Coquimbo, con predominio de tráfico ilícito de drogas, porte de armas, robo con violencia y violación de morada.'
);

INSERT INTO caso (id_boletin, numero_caso, fecha_hecho, ruc, id_tipo_delito_ppal, relato_breve, id_estado_causa, plazo_invest_dias, id_fiscal, unidad_policial, diligencias)
VALUES
  (1, 1, '2025-05-23', '2500712796-3',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'microtrafico'),
   'Personal de carabineros 3ra Comisaría realiza patrullaje preventivo en La Recova. Al acercarse a tres individuos uno huye, siendo detenido y encontrándosele 121 envoltorios de pasta base.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'en_libertad'),
   90, 1, '3ra Comisaría La Serena', 'Orden de investigar 90 días en libertad'),

  (1, 2, '2025-05-23', '2500706323-K',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'porte_armas'),
   'Control de identidad preventivo. Sujeto huye y es detenido. Se le incauta revólver Smith & Wesson calibre .38 corto sin número de serie.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'en_libertad'),
   NULL, 4, 'Patrulla Coquimbo', 'Imputado queda en libertad'),

  (1, 3, '2025-05-24', '2500713686-5',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'trafico_drogas'),
   'Control vehicular detecta olor a marihuana. Se incautan 3 bolsas con 935 g de marihuana a granel, balanza y celulares.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'prision_preventiva'),
   60, 1, 'Control carretero LS', 'Prisión preventiva 60 días de investigación'),

  (1, 4, '2025-05-25', '2500715436-7',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'porte_armas'),
   'Conductor huye de fiscalización, vuelca causando daños. Se incautan pistola lanza balines, cuchilla y 25 envoltorios pasta base.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'arraigo_firma_mensual'),
   90, 1, 'Patrulla LS', 'Arraigo nacional, firma mensual, suspensión licencia, 90 días invest.'),

  (1, 5, '2025-05-27', '2500730672-8',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'trafico_drogas'),
   'Control preventivo sector La Recova. Mujer con 72 envoltorios pasta base (23 g). Alta reincidencia interregional.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'arraigo_firma_mensual'),
   90, 1, 'Patrulla LS', 'Firma mensual, arraigo nacional, 90 días de investigación'),

  (1, 6, '2025-05-27', '2500723075-6',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'violacion_morada'),
   'Sujeto forzando reja de carnicería La Veguita. Se le incauta pistola de fogueo en banano.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'en_libertad'),
   60, 2, '2da Comisaría Coquimbo', 'En libertad 60 días de investigación'),

  (1, 7, '2025-05-28', '2500170574-4',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'trafico_drogas'),
   'Denuncia anónima vía Denuncia Seguro. Registro de inmueble revela cultivo indoor y ~4.871 g marihuana a granel.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'prision_preventiva'),
   30, 1, 'BIRO LS', 'Prisión preventiva 30 días de investigación'),

  (1, 8, '2025-05-28', '2500765029-1',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'microtrafico'),
   'Orden de investigar. Registro de inmueble en La Higuera: 201,1 g marihuana a granel en dos muestras.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'sin_info_fcd'),
   NULL, 1, 'Sub-comisaría La Higuera', 'Sin información en FCD y RIT'),

  (1, 9, '2025-05-29', '2500750564-K',
   (SELECT id FROM p_tipo_delito   WHERE codigo = 'robo_violencia'),
   '4 sujetos de negro ingresan a constructora. Guardia golpeado y amarrado. Roban camioneta y herramientas. Camioneta recuperada en San Juan por GPS.',
   (SELECT id FROM p_estado_causa  WHERE codigo = 'imputado_no_identificado'),
   NULL, 3, 'SIP Coquimbo', 'Fiscal instruye a SIP investigar en 30 días');

INSERT INTO lugar (id_caso, direccion, sector, id_comuna, id_tipo_lugar) VALUES
  (1, 'Brasil 715',                                    'La Recova',      (SELECT id FROM p_comuna WHERE codigo='la_serena'),  (SELECT id FROM p_tipo_lugar WHERE codigo='via_publica')),
  (2, 'Adelaida Cathalifaud de Meléndez, Reg. Arica',  NULL,             (SELECT id FROM p_comuna WHERE codigo='coquimbo'),   (SELECT id FROM p_tipo_lugar WHERE codigo='via_publica')),
  (3, 'El Brillador',                                  'Las Compañías',  (SELECT id FROM p_comuna WHERE codigo='la_serena'),  (SELECT id FROM p_tipo_lugar WHERE codigo='via_publica')),
  (4, 'Los Olivos esq. Lingue, Villa La Florida',      NULL,             (SELECT id FROM p_comuna WHERE codigo='la_serena'),  (SELECT id FROM p_tipo_lugar WHERE codigo='via_publica')),
  (5, 'Brasil 715, costado Unimarc',                   'La Recova',      (SELECT id FROM p_comuna WHERE codigo='la_serena'),  (SELECT id FROM p_tipo_lugar WHERE codigo='via_publica')),
  (6, 'San Blas-Canillejas Calle Seis',                NULL,             (SELECT id FROM p_comuna WHERE codigo='coquimbo'),   (SELECT id FROM p_tipo_lugar WHERE codigo='local_comercial')),
  (7, 'Aurora 3074',                                   'Las Compañías',  (SELECT id FROM p_comuna WHERE codigo='la_serena'),  (SELECT id FROM p_tipo_lugar WHERE codigo='inmueble_residencial')),
  (8, 'Ruta D-110 Trapiche',                           NULL,             (SELECT id FROM p_comuna WHERE codigo='la_higuera'), (SELECT id FROM p_tipo_lugar WHERE codigo='inmueble_residencial')),
  (9, 'Av. Salvador Allende intersección Calle Talca', NULL,             (SELECT id FROM p_comuna WHERE codigo='coquimbo'),   (SELECT id FROM p_tipo_lugar WHERE codigo='local_comercial'));

INSERT INTO imputado (id_caso, apellido_paterno, apellido_materno, nombres, id_tipo_documento, numero_documento, fecha_nacimiento, id_sexo, nacionalidad, num_causas_previas, num_complices) VALUES
  (1, 'Valero',    'Tello',    'Matías Ignacio',   (SELECT id FROM p_tipo_documento WHERE codigo='rut'), '19348260-0', '1996-05-23', (SELECT id FROM p_sexo WHERE codigo='masculino'), 'CHL',  6,  1),
  (2, 'Zapata',    'Cardona',  'Wilson Andrés',    (SELECT id FROM p_tipo_documento WHERE codigo='dni'), '1007054493', '2004-02-14', (SELECT id FROM p_sexo WHERE codigo='masculino'), 'COL',  0,  0),
  (3, 'González',  'González', 'Carlo Francisco',  (SELECT id FROM p_tipo_documento WHERE codigo='rut'), '19177125-7', '1995-06-10', (SELECT id FROM p_sexo WHERE codigo='masculino'), 'CHL', 27, 23),
  (5, 'Arancibia', 'Díaz',     'Juana Luisa',      (SELECT id FROM p_tipo_documento WHERE codigo='rut'), '16307184-3', '1986-02-25', (SELECT id FROM p_sexo WHERE codigo='femenino'),  'CHL', 35, 12),
  (6, 'Trujillo',  'Rivera',   'Cristian Alberto', (SELECT id FROM p_tipo_documento WHERE codigo='rut'), '12576554-8', '1974-04-06', (SELECT id FROM p_sexo WHERE codigo='masculino'), 'CHL', 14,  5),
  (7, 'Zambrano',  'Zambrano', 'Hernán Alejandro', (SELECT id FROM p_tipo_documento WHERE codigo='rut'), '16527308-7', '1987-06-28', (SELECT id FROM p_sexo WHERE codigo='masculino'), 'CHL',  5,  0),
  (8, 'Pérez',     'Díaz',     'Francisco Javier', (SELECT id FROM p_tipo_documento WHERE codigo='rut'), '13483119-7', '1978-07-17', (SELECT id FROM p_sexo WHERE codigo='masculino'), 'CHL', 30,  3);

INSERT INTO victima (id_caso, nombre, rut, id_calidad, id_tipo_lesiones)
VALUES (9, 'Matías Nicolás Cisternas Salazar', '18011242-1',
        (SELECT id FROM p_calidad_victima WHERE codigo = 'persona_natural'),
        (SELECT id FROM p_tipo_lesiones   WHERE codigo = 'leves'));

INSERT INTO incautacion (id_caso, id_tipo_especie, descripcion, id_subtipo_droga, cantidad, unidad_medida, nue, id_subtipo_arma) VALUES
  (1, (SELECT id FROM p_tipo_especie WHERE codigo='droga'),      '121 envoltorios pasta base de cocaína',     (SELECT id FROM p_subtipo_droga WHERE codigo='pasta_base'), 37.39,   'gramos',   NULL, NULL),
  (2, (SELECT id FROM p_tipo_especie WHERE codigo='arma_fuego'), 'Revólver Smith & Wesson calibre .38 corto', NULL, NULL, 'unidades', '7974085',                          (SELECT id FROM p_subtipo_arma  WHERE codigo='fuego_real')),
  (3, (SELECT id FROM p_tipo_especie WHERE codigo='droga'),      'Marihuana a granel en 3 bolsas de nylon',   (SELECT id FROM p_subtipo_droga WHERE codigo='marihuana'),  935.00, 'gramos',   NULL, NULL),
  (4, (SELECT id FROM p_tipo_especie WHERE codigo='droga'),      '25 envoltorios pasta base',                 (SELECT id FROM p_subtipo_droga WHERE codigo='pasta_base'),   5.60,  'gramos',   NULL, NULL),
  (5, (SELECT id FROM p_tipo_especie WHERE codigo='droga'),      '72 envoltorios pasta base',                 (SELECT id FROM p_subtipo_droga WHERE codigo='pasta_base'),  23.00,  'gramos',   NULL, NULL),
  (7, (SELECT id FROM p_tipo_especie WHERE codigo='droga'),      'Marihuana a granel en bolsas y cajas',      (SELECT id FROM p_subtipo_droga WHERE codigo='marihuana'), 4870.08, 'gramos',   NULL, NULL),
  (8, (SELECT id FROM p_tipo_especie WHERE codigo='droga'),      'Marihuana a granel en dos muestras',        (SELECT id FROM p_subtipo_droga WHERE codigo='marihuana'),  201.10,  'gramos',   NULL, NULL);

INSERT INTO noticia (id_caso, url, medio, titular, fecha_pub, id_tipo_match, id_estado_noticia) VALUES
  (1, 'https://eldia.cl/nota-caso1',           'El Día',         'Carabineros detiene sujeto con más de cien envoltorios de pasta base en La Recova',      '2025-05-23', (SELECT id FROM p_tipo_match WHERE codigo='manual'), (SELECT id FROM p_estado_noticia WHERE codigo='aceptada')),
  (3, 'https://eldia.cl/nota-caso3',           'El Día',         'Decomisan casi un kilo de marihuana a sujeto con 27 causas penales en Las Compañías',    '2025-05-24', (SELECT id FROM p_tipo_match WHERE codigo='manual'), (SELECT id FROM p_estado_noticia WHERE codigo='aceptada')),
  (6, 'https://coquimboenred.cl/nota-caso6',   'Coquimbo en Red','Sorprenden a sujeto forzando carnicería en San Blas portando arma de fogueo',            '2025-05-27', (SELECT id FROM p_tipo_match WHERE codigo='manual'), (SELECT id FROM p_estado_noticia WHERE codigo='aceptada'));

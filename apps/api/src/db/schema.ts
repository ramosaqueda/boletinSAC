import {
  pgTable,
  serial,
  smallserial,
  smallint,
  integer,
  varchar,
  text,
  boolean,
  date,
  time,
  timestamp,
  decimal,
  char,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// =============================================================================
// TABLAS PARAMÉTRICAS (p_*)
// Estructura uniforme: id, codigo, nombre, orden, activo
// =============================================================================

const parametrica = (nombre: string) =>
  pgTable(nombre, {
    id:     smallserial('id').primaryKey(),
    codigo: varchar('codigo', { length: 60 }).notNull().unique(),
    nombre: varchar('nombre', { length: 120 }).notNull(),
    orden:  smallint('orden').notNull().default(0),
    activo: boolean('activo').notNull().default(true),
  })

export const pRolUsuario     = parametrica('p_rol_usuario')
export const pEstadoBoletin  = parametrica('p_estado_boletin')
export const pTipoDelito     = parametrica('p_tipo_delito')
export const pEstadoCausa    = parametrica('p_estado_causa')
export const pTipoLugar      = parametrica('p_tipo_lugar')
export const pComuna         = parametrica('p_comuna')
export const pTipoDocumento  = parametrica('p_tipo_documento')
export const pSexo           = parametrica('p_sexo')
export const pSitMigratoria  = parametrica('p_sit_migratoria')
export const pCalidadVictima = parametrica('p_calidad_victima')
export const pTipoLesiones   = parametrica('p_tipo_lesiones')
export const pTipoEspecie    = parametrica('p_tipo_especie')
export const pSubtipoDroga   = parametrica('p_subtipo_droga')
export const pSubtipoArma    = parametrica('p_subtipo_arma')
export const pEstadoEspecie  = parametrica('p_estado_especie')
export const pRolVehiculo    = parametrica('p_rol_vehiculo')
export const pTipoFoto       = parametrica('p_tipo_foto')
export const pTipoMatch      = parametrica('p_tipo_match')
export const pEstadoNoticia  = parametrica('p_estado_noticia')

export type Parametrica = typeof pRolUsuario.$inferSelect

// =============================================================================
// TABLA: usuario
// =============================================================================

export const usuario = pgTable('usuario', {
  id:           serial('id').primaryKey(),
  nombre:       varchar('nombre', { length: 100 }).notNull(),
  email:        varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  idRol:        smallint('id_rol').notNull().references(() => pRolUsuario.id),
  activo:       boolean('activo').notNull().default(true),
  fechaAlta:    date('fecha_alta').notNull().default(sql`CURRENT_DATE`),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: fiscal
// =============================================================================

export const fiscal = pgTable('fiscal', {
  id:        serial('id').primaryKey(),
  nombre:    varchar('nombre', { length: 100 }).notNull(),
  unidad:    varchar('unidad', { length: 100 }),
  activo:    boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: boletin
// =============================================================================

export const boletin = pgTable('boletin', {
  id:         serial('id').primaryKey(),
  numero:     integer('numero').notNull(),
  fechaDesde: date('fecha_desde').notNull(),
  fechaHasta: date('fecha_hasta').notNull(),
  provincia:  varchar('provincia', { length: 80 }).notNull().default('Provincia del Elqui'),
  region:     varchar('region', { length: 80 }).notNull().default('Región de Coquimbo'),
  idAnalista: integer('id_analista').references(() => usuario.id),
  idEstado:   smallint('id_estado').notNull().references(() => pEstadoBoletin.id),
  resumen:    text('resumen'),
  fechaPub:   timestamp('fecha_pub', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: caso
// =============================================================================

export const caso = pgTable('caso', {
  id:                serial('id').primaryKey(),
  idBoletin:         integer('id_boletin').notNull().references(() => boletin.id),
  numeroCaso:        integer('numero_caso').notNull(),
  fechaHecho:        date('fecha_hecho').notNull(),
  horaHecho:         time('hora_hecho'),
  ruc:               varchar('ruc', { length: 15 }).notNull(),
  folioBitacora:     varchar('folio_bitacora', { length: 30 }),
  idTipoDelitoPpal:  smallint('id_tipo_delito_ppal').notNull().references(() => pTipoDelito.id),
  tipoDelitoSec:     varchar('tipo_delito_sec', { length: 100 }),
  relatoBreve:       text('relato_breve').notNull(),
  idEstadoCausa:     smallint('id_estado_causa').notNull().references(() => pEstadoCausa.id),
  plazoInvestDias:   integer('plazo_invest_dias'),
  idFiscal:          integer('id_fiscal').references(() => fiscal.id),
  unidadPolicial:    varchar('unidad_policial', { length: 100 }),
  unidadInvest:      varchar('unidad_invest', { length: 50 }),
  diligencias:       text('diligencias'),
  observaciones:     text('observaciones'),
  urlNoticia1:       varchar('url_noticia_1', { length: 500 }),
  urlNoticia2:       varchar('url_noticia_2', { length: 500 }),
  usuarioIngreso:    integer('usuario_ingreso').references(() => usuario.id),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  boletinCasoUniq: unique().on(t.idBoletin, t.numeroCaso),
}))

// =============================================================================
// TABLA: lugar
// =============================================================================

export const lugar = pgTable('lugar', {
  id:            serial('id').primaryKey(),
  idCaso:        integer('id_caso').notNull().references(() => caso.id, { onDelete: 'cascade' }),
  direccion:     varchar('direccion', { length: 200 }).notNull(),
  sector:        varchar('sector', { length: 100 }),
  idComuna:      smallint('id_comuna').notNull().references(() => pComuna.id),
  provincia:     varchar('provincia', { length: 50 }).notNull().default('Provincia del Elqui'),
  idTipoLugar:   smallint('id_tipo_lugar').references(() => pTipoLugar.id),
  coordenadaLat: decimal('coordenada_lat', { precision: 10, scale: 7 }),
  coordenadaLon: decimal('coordenada_lon', { precision: 10, scale: 7 }),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: imputado
// =============================================================================

export const imputado = pgTable('imputado', {
  id:                 serial('id').primaryKey(),
  idCaso:             integer('id_caso').notNull().references(() => caso.id, { onDelete: 'cascade' }),
  apellidoPaterno:    varchar('apellido_paterno', { length: 80 }).notNull(),
  apellidoMaterno:    varchar('apellido_materno', { length: 80 }),
  nombres:            varchar('nombres', { length: 100 }).notNull(),
  idTipoDocumento:    smallint('id_tipo_documento').notNull().references(() => pTipoDocumento.id),
  numeroDocumento:    varchar('numero_documento', { length: 20 }).notNull(),
  fechaNacimiento:    date('fecha_nacimiento'),
  idSexo:             smallint('id_sexo').references(() => pSexo.id),
  nacionalidad:       char('nacionalidad', { length: 3 }),
  numCausasPrevias:   integer('num_causas_previas').notNull().default(0),
  tiposCausasPrev:    text('tipos_causas_prev'),
  numComplices:       integer('num_complices').notNull().default(0),
  identidadesMult:    varchar('identidades_mult', { length: 200 }),
  idSitMigratoria:    smallint('id_sit_migratoria').references(() => pSitMigratoria.id),
  fotoUrl:            varchar('foto_url', { length: 500 }),
  alertaReincidencia: boolean('alerta_reincidencia').notNull().default(false),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: victima
// =============================================================================

export const victima = pgTable('victima', {
  id:              serial('id').primaryKey(),
  idCaso:          integer('id_caso').notNull().references(() => caso.id, { onDelete: 'cascade' }),
  nombre:          varchar('nombre', { length: 200 }),
  rut:             varchar('rut', { length: 15 }),
  idCalidad:       smallint('id_calidad').references(() => pCalidadVictima.id),
  idTipoLesiones:  smallint('id_tipo_lesiones').references(() => pTipoLesiones.id),
  observaciones:   varchar('observaciones', { length: 300 }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: incautacion
// =============================================================================

export const incautacion = pgTable('incautacion', {
  id:              serial('id').primaryKey(),
  idCaso:          integer('id_caso').notNull().references(() => caso.id, { onDelete: 'cascade' }),
  idTipoEspecie:   smallint('id_tipo_especie').notNull().references(() => pTipoEspecie.id),
  descripcion:     varchar('descripcion', { length: 300 }).notNull(),
  idSubtipoDroga:  smallint('id_subtipo_droga').references(() => pSubtipoDroga.id),
  cantidad:        decimal('cantidad', { precision: 12, scale: 3 }),
  unidadMedida:    varchar('unidad_medida', { length: 20 }),
  nue:             varchar('nue', { length: 20 }),
  idSubtipoArma:   smallint('id_subtipo_arma').references(() => pSubtipoArma.id),
  calibre:         varchar('calibre', { length: 30 }),
  marcaArma:       varchar('marca_arma', { length: 50 }),
  numSerieArma:    varchar('num_serie_arma', { length: 30 }),
  idEstadoEspecie: smallint('id_estado_especie').references(() => pEstadoEspecie.id),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: vehiculo
// =============================================================================

export const vehiculo = pgTable('vehiculo', {
  id:             serial('id').primaryKey(),
  idCaso:         integer('id_caso').notNull().references(() => caso.id, { onDelete: 'cascade' }),
  patente:        varchar('patente', { length: 10 }),
  marca:          varchar('marca', { length: 50 }),
  modelo:         varchar('modelo', { length: 50 }),
  color:          varchar('color', { length: 30 }),
  tipo:           varchar('tipo', { length: 30 }),
  idRolVehiculo:  smallint('id_rol_vehiculo').references(() => pRolVehiculo.id),
  tieneGps:       boolean('tiene_gps').notNull().default(false),
  observaciones:  varchar('observaciones', { length: 200 }),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: fotografia
// =============================================================================

export const fotografia = pgTable('fotografia', {
  id:           serial('id').primaryKey(),
  idCaso:       integer('id_caso').notNull().references(() => caso.id, { onDelete: 'cascade' }),
  idTipoFoto:   smallint('id_tipo_foto').notNull().references(() => pTipoFoto.id),
  descripcion:  varchar('descripcion', { length: 150 }),
  archivoUrl:   varchar('archivo_url', { length: 500 }).notNull(),
  fechaCaptura: timestamp('fecha_captura', { withTimezone: true }),
  orden:        integer('orden').notNull().default(1),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLA: noticia
// =============================================================================

export const noticia = pgTable('noticia', {
  id:               serial('id').primaryKey(),
  idCaso:           integer('id_caso').notNull().references(() => caso.id, { onDelete: 'cascade' }),
  url:              varchar('url', { length: 500 }).notNull(),
  medio:            varchar('medio', { length: 100 }),
  titular:          varchar('titular', { length: 300 }),
  bajada:           text('bajada'),
  fechaPub:         date('fecha_pub'),
  idTipoMatch:      smallint('id_tipo_match').references(() => pTipoMatch.id),
  idEstadoNoticia:  smallint('id_estado_noticia').references(() => pEstadoNoticia.id),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// TABLAS: hashtag + caso_hashtag
// =============================================================================

export const hashtag = pgTable('hashtag', {
  id:    serial('id').primaryKey(),
  texto: varchar('texto', { length: 60 }).notNull().unique(),
})

export const casoHashtag = pgTable('caso_hashtag', {
  idCaso:    integer('id_caso').notNull().references(() => caso.id, { onDelete: 'cascade' }),
  idHashtag: integer('id_hashtag').notNull().references(() => hashtag.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: unique().on(t.idCaso, t.idHashtag) }))

// =============================================================================
// RELATIONS — para Drizzle relational queries (db.query.*)
// =============================================================================

export const usuarioRelations = relations(usuario, ({ one, many }) => ({
  rol:             one(pRolUsuario,   { fields: [usuario.idRol],      references: [pRolUsuario.id] }),
  boletines:       many(boletin),
  casosIngresados: many(caso),
}))

export const boletinRelations = relations(boletin, ({ one, many }) => ({
  analista: one(usuario,        { fields: [boletin.idAnalista], references: [usuario.id] }),
  estado:   one(pEstadoBoletin, { fields: [boletin.idEstado],   references: [pEstadoBoletin.id] }),
  casos:    many(caso),
}))

export const fiscalRelations = relations(fiscal, ({ many }) => ({
  casos: many(caso),
}))

export const casoRelations = relations(caso, ({ one, many }) => ({
  boletin:       one(boletin,      { fields: [caso.idBoletin],        references: [boletin.id] }),
  tipoDelito:    one(pTipoDelito,  { fields: [caso.idTipoDelitoPpal], references: [pTipoDelito.id] }),
  estadoCausa:   one(pEstadoCausa, { fields: [caso.idEstadoCausa],    references: [pEstadoCausa.id] }),
  fiscal:        one(fiscal,       { fields: [caso.idFiscal],         references: [fiscal.id] }),
  ingresadoPor:  one(usuario,      { fields: [caso.usuarioIngreso],   references: [usuario.id] }),
  lugares:       many(lugar),
  imputados:     many(imputado),
  victimas:      many(victima),
  incautaciones: many(incautacion),
  vehiculos:     many(vehiculo),
  fotografias:   many(fotografia),
  noticias:      many(noticia),
}))

export const lugarRelations = relations(lugar, ({ one }) => ({
  caso:      one(caso,       { fields: [lugar.idCaso],      references: [caso.id] }),
  comuna:    one(pComuna,    { fields: [lugar.idComuna],    references: [pComuna.id] }),
  tipoLugar: one(pTipoLugar, { fields: [lugar.idTipoLugar], references: [pTipoLugar.id] }),
}))

export const imputadoRelations = relations(imputado, ({ one }) => ({
  caso:          one(caso,             { fields: [imputado.idCaso],           references: [caso.id] }),
  tipoDocumento: one(pTipoDocumento,   { fields: [imputado.idTipoDocumento],  references: [pTipoDocumento.id] }),
  sexo:          one(pSexo,            { fields: [imputado.idSexo],           references: [pSexo.id] }),
  sitMigratoria: one(pSitMigratoria,   { fields: [imputado.idSitMigratoria],  references: [pSitMigratoria.id] }),
}))

export const victimaRelations = relations(victima, ({ one }) => ({
  caso:          one(caso,             { fields: [victima.idCaso],          references: [caso.id] }),
  calidad:       one(pCalidadVictima,  { fields: [victima.idCalidad],       references: [pCalidadVictima.id] }),
  tipoLesiones:  one(pTipoLesiones,    { fields: [victima.idTipoLesiones],  references: [pTipoLesiones.id] }),
}))

export const incautacionRelations = relations(incautacion, ({ one }) => ({
  caso:          one(caso,            { fields: [incautacion.idCaso],          references: [caso.id] }),
  tipoEspecie:   one(pTipoEspecie,    { fields: [incautacion.idTipoEspecie],   references: [pTipoEspecie.id] }),
  subtipoDroga:  one(pSubtipoDroga,   { fields: [incautacion.idSubtipoDroga],  references: [pSubtipoDroga.id] }),
  subtipoArma:   one(pSubtipoArma,    { fields: [incautacion.idSubtipoArma],   references: [pSubtipoArma.id] }),
  estadoEspecie: one(pEstadoEspecie,  { fields: [incautacion.idEstadoEspecie], references: [pEstadoEspecie.id] }),
}))

export const vehiculoRelations = relations(vehiculo, ({ one }) => ({
  caso:        one(caso,          { fields: [vehiculo.idCaso],        references: [caso.id] }),
  rolVehiculo: one(pRolVehiculo,  { fields: [vehiculo.idRolVehiculo], references: [pRolVehiculo.id] }),
}))

export const fotografiaRelations = relations(fotografia, ({ one }) => ({
  caso:      one(caso,      { fields: [fotografia.idCaso],      references: [caso.id] }),
  tipoFoto:  one(pTipoFoto, { fields: [fotografia.idTipoFoto],  references: [pTipoFoto.id] }),
}))

export const noticiaRelations = relations(noticia, ({ one }) => ({
  caso:          one(caso,             { fields: [noticia.idCaso],          references: [caso.id] }),
  tipoMatch:     one(pTipoMatch,       { fields: [noticia.idTipoMatch],     references: [pTipoMatch.id] }),
  estadoNoticia: one(pEstadoNoticia,   { fields: [noticia.idEstadoNoticia], references: [pEstadoNoticia.id] }),
}))

// =============================================================================
// TIPOS INFERIDOS — para usar en servicios y rutas
// =============================================================================

export type Usuario       = typeof usuario.$inferSelect
export type NuevoUsuario  = typeof usuario.$inferInsert
export type Fiscal        = typeof fiscal.$inferSelect
export type Boletin       = typeof boletin.$inferSelect
export type NuevoBoletin  = typeof boletin.$inferInsert
export type Caso          = typeof caso.$inferSelect
export type NuevoCaso     = typeof caso.$inferInsert
export type Lugar         = typeof lugar.$inferSelect
export type NuevoLugar    = typeof lugar.$inferInsert
export type Imputado      = typeof imputado.$inferSelect
export type NuevoImputado = typeof imputado.$inferInsert
export type Victima       = typeof victima.$inferSelect
export type Incautacion   = typeof incautacion.$inferSelect
export type Vehiculo      = typeof vehiculo.$inferSelect
export type Fotografia    = typeof fotografia.$inferSelect
export type Noticia       = typeof noticia.$inferSelect

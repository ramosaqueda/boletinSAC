import type { FastifyInstance } from 'fastify'
import { eq, and, inArray, notInArray, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import {
  caso, lugar, imputado, victima, incautacion, vehiculo, fotografia, noticia,
  hashtag, casoHashtag,
  pTipoDelito, pEstadoCausa, pComuna, pTipoLugar, pTipoDocumento, pSexo,
  pSitMigratoria, pCalidadVictima, pTipoLesiones, pTipoEspecie, pSubtipoDroga,
  pSubtipoArma, pEstadoEspecie, pRolVehiculo, pTipoFoto, pTipoMatch, pEstadoNoticia,
  fiscal,
} from '../db/schema.js'
import { uploadFile, deleteFile } from '../lib/storage.js'

// ── Schemas de validación ─────────────────────────────────────────────────────

const RucRegex = /^\d{7,10}-[\dKk]$/

const LugarSchema = z.object({
  direccion:     z.string().min(1),
  sector:        z.string().optional(),
  idComuna:      z.number().int().positive(),
  idTipoLugar:   z.number().int().positive().optional(),
  coordenadaLat: z.number().optional(),
  coordenadaLon: z.number().optional(),
})

const CrearCasoSchema = z.object({
  idBoletin:        z.number().int().positive(),
  numeroCaso:       z.number().int().positive(),
  fechaHecho:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaHecho:        z.string().regex(/^\d{2}:\d{2}$/).optional(),
  ruc:              z.string().regex(RucRegex, 'RUC inválido'),
  folioBitacora:    z.string().optional(),
  idTipoDelitoPpal: z.number().int().positive(),
  tipoDelitoSec:    z.string().optional(),
  relatoBreve:      z.string().min(10),
  idEstadoCausa:    z.number().int().positive(),
  plazoInvestDias:  z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120), z.literal(180)]).optional(),
  idFiscal:         z.number().int().positive().optional(),
  unidadPolicial:   z.string().optional(),
  unidadInvest:     z.string().optional(),
  diligencias:      z.string().optional(),
  observaciones:    z.string().optional(),
  urlNoticia1:      z.string().url().optional(),
  urlNoticia2:      z.string().url().optional(),
  lugar:            LugarSchema,
})

const ActualizarCasoSchema = z.object({
  fechaHecho:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horaHecho:        z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(), // acepta HH:MM o HH:MM:SS
  ruc:              z.string().optional(),
  folioBitacora:    z.string().optional(),
  idTipoDelitoPpal: z.number().int().positive().optional(),
  tipoDelitoSec:    z.string().optional(),
  relatoBreve:      z.string().min(1).optional(),
  idEstadoCausa:    z.number().int().positive().optional(),
  plazoInvestDias:  z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120), z.literal(180)]).optional(),
  unidadPolicial:   z.string().optional(),
  unidadInvest:     z.string().optional(),
  diligencias:      z.string().optional(),
  observaciones:    z.string().optional(),
  urlNoticia1:      z.string().url().optional(),
  urlNoticia2:      z.string().url().optional(),
})

const ImputadoSchema = z.object({
  apellidoPaterno:  z.string().min(1),
  apellidoMaterno:  z.string().optional(),
  nombres:          z.string().min(1),
  idTipoDocumento:  z.number().int().positive(),
  numeroDocumento:  z.string().min(1),
  fechaNacimiento:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  idSexo:           z.number().int().positive().optional(),
  nacionalidad:     z.string().length(3).optional(),
  numCausasPrevias: z.number().int().min(0).default(0),
  tiposCausasPrev:  z.string().optional(),
  numComplices:     z.number().int().min(0).default(0),
  identidadesMult:  z.string().optional(),
  idSitMigratoria:  z.number().int().positive().optional(),
})

const VictimaSchema = z.object({
  nombre:          z.string().optional(),
  rut:             z.string().optional(),
  idCalidad:       z.number().int().positive().optional(),
  idTipoLesiones:  z.number().int().positive().optional(),
  observaciones:   z.string().optional(),
})

const IncautacionSchema = z.object({
  idTipoEspecie:   z.number().int().positive(),
  descripcion:     z.string().min(1),
  idSubtipoDroga:  z.number().int().positive().optional(),
  cantidad:        z.number().positive().optional(),
  unidadMedida:    z.string().optional(),
  nue:             z.string().optional(),
  idSubtipoArma:   z.number().int().positive().optional(),
  calibre:         z.string().optional(),
  marcaArma:       z.string().optional(),
  numSerieArma:    z.string().optional(),
  idEstadoEspecie: z.number().int().positive().optional(),
})

const VehiculoSchema = z.object({
  patente:        z.string().optional(),
  marca:          z.string().optional(),
  modelo:         z.string().optional(),
  color:          z.string().optional(),
  tipo:           z.string().optional(),
  idRolVehiculo:  z.number().int().positive().optional(),
  tieneGps:       z.boolean().default(false),
  observaciones:  z.string().optional(),
})

const NoticiaSchema = z.object({
  url:              z.string().url(),
  medio:            z.string().optional(),
  titular:          z.string().optional(),
  bajada:           z.string().optional(),
  fechaPub:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  idTipoMatch:      z.number().int().positive().optional(),
  idEstadoNoticia:  z.number().int().positive().optional(),
})

// ── Helper: caso completo ─────────────────────────────────────────────────────

async function getCasoCompleto(idCaso: number) {
  const [cab] = await db
    .select({
      id:               caso.id,
      idBoletin:        caso.idBoletin,
      numeroCaso:       caso.numeroCaso,
      fechaHecho:       caso.fechaHecho,
      horaHecho:        caso.horaHecho,
      ruc:              caso.ruc,
      folioBitacora:    caso.folioBitacora,
      tipoDelito:       pTipoDelito.codigo,
      tipoDelitoNombre: pTipoDelito.nombre,
      tipoDelitoSec:    caso.tipoDelitoSec,
      relatoBreve:      caso.relatoBreve,
      estadoCausa:      pEstadoCausa.codigo,
      estadoCausaNombre:pEstadoCausa.nombre,
      plazoInvestDias:  caso.plazoInvestDias,
      fiscal:           fiscal.nombre,
      unidadPolicial:   caso.unidadPolicial,
      unidadInvest:     caso.unidadInvest,
      diligencias:      caso.diligencias,
      observaciones:    caso.observaciones,
      urlNoticia1:      caso.urlNoticia1,
      urlNoticia2:      caso.urlNoticia2,
      createdAt:        caso.createdAt,
      updatedAt:        caso.updatedAt,
    })
    .from(caso)
    .innerJoin(pTipoDelito,  eq(caso.idTipoDelitoPpal, pTipoDelito.id))
    .innerJoin(pEstadoCausa, eq(caso.idEstadoCausa,    pEstadoCausa.id))
    .leftJoin(fiscal,        eq(caso.idFiscal,         fiscal.id))
    .where(eq(caso.id, idCaso))
    .limit(1)

  if (!cab) return null

  const [lugares, imputados, victimas, incautaciones, vehiculos, fotografias, noticias] =
    await Promise.all([
      db.select({
        id: lugar.id, direccion: lugar.direccion, sector: lugar.sector,
        comuna: pComuna.nombre, comunaCodigo: pComuna.codigo,
        tipoLugar: pTipoLugar.codigo, tipoLugarNombre: pTipoLugar.nombre,
        coordenadaLat: lugar.coordenadaLat, coordenadaLon: lugar.coordenadaLon,
      })
      .from(lugar)
      .leftJoin(pComuna,    eq(lugar.idComuna,    pComuna.id))
      .leftJoin(pTipoLugar, eq(lugar.idTipoLugar, pTipoLugar.id))
      .where(eq(lugar.idCaso, idCaso)),

      db.select({
        id: imputado.id,
        apellidoPaterno: imputado.apellidoPaterno,
        apellidoMaterno: imputado.apellidoMaterno,
        nombres: imputado.nombres,
        tipoDocumento: pTipoDocumento.codigo,
        numeroDocumento: imputado.numeroDocumento,
        fechaNacimiento: imputado.fechaNacimiento,
        sexo: pSexo.codigo,
        nacionalidad: imputado.nacionalidad,
        numCausasPrevias: imputado.numCausasPrevias,
        tiposCausasPrev: imputado.tiposCausasPrev,
        numComplices: imputado.numComplices,
        identidadesMult: imputado.identidadesMult,
        sitMigratoria: pSitMigratoria.codigo,
        fotoUrl: imputado.fotoUrl,
        alertaReincidencia: imputado.alertaReincidencia,
      })
      .from(imputado)
      .innerJoin(pTipoDocumento, eq(imputado.idTipoDocumento, pTipoDocumento.id))
      .leftJoin(pSexo,           eq(imputado.idSexo,          pSexo.id))
      .leftJoin(pSitMigratoria,  eq(imputado.idSitMigratoria, pSitMigratoria.id))
      .where(eq(imputado.idCaso, idCaso)),

      db.select({
        id: victima.id, nombre: victima.nombre, rut: victima.rut,
        calidad: pCalidadVictima.codigo, calidades: pCalidadVictima.nombre,
        tipoLesiones: pTipoLesiones.codigo, tipoLesionesNombre: pTipoLesiones.nombre,
        observaciones: victima.observaciones,
      })
      .from(victima)
      .leftJoin(pCalidadVictima, eq(victima.idCalidad,      pCalidadVictima.id))
      .leftJoin(pTipoLesiones,   eq(victima.idTipoLesiones, pTipoLesiones.id))
      .where(eq(victima.idCaso, idCaso)),

      db.select({
        id: incautacion.id,
        tipoEspecie: pTipoEspecie.codigo, tipoEspecieNombre: pTipoEspecie.nombre,
        descripcion: incautacion.descripcion,
        subtipoDroga: pSubtipoDroga.codigo,
        cantidad: incautacion.cantidad, unidadMedida: incautacion.unidadMedida,
        nue: incautacion.nue,
        subtipoArma: pSubtipoArma.codigo,
        calibre: incautacion.calibre, marcaArma: incautacion.marcaArma,
        numSerieArma: incautacion.numSerieArma,
        estadoEspecie: pEstadoEspecie.codigo,
      })
      .from(incautacion)
      .innerJoin(pTipoEspecie,  eq(incautacion.idTipoEspecie,  pTipoEspecie.id))
      .leftJoin(pSubtipoDroga,  eq(incautacion.idSubtipoDroga, pSubtipoDroga.id))
      .leftJoin(pSubtipoArma,   eq(incautacion.idSubtipoArma,  pSubtipoArma.id))
      .leftJoin(pEstadoEspecie, eq(incautacion.idEstadoEspecie,pEstadoEspecie.id))
      .where(eq(incautacion.idCaso, idCaso)),

      db.select({
        id: vehiculo.id,
        patente: vehiculo.patente, marca: vehiculo.marca,
        modelo: vehiculo.modelo, color: vehiculo.color, tipo: vehiculo.tipo,
        rol: pRolVehiculo.codigo, rolNombre: pRolVehiculo.nombre,
        tieneGps: vehiculo.tieneGps, observaciones: vehiculo.observaciones,
      })
      .from(vehiculo)
      .leftJoin(pRolVehiculo, eq(vehiculo.idRolVehiculo, pRolVehiculo.id))
      .where(eq(vehiculo.idCaso, idCaso)),

      db.select({
        id: fotografia.id,
        tipoFoto: pTipoFoto.codigo, tipoFotoNombre: pTipoFoto.nombre,
        descripcion: fotografia.descripcion, archivoUrl: fotografia.archivoUrl,
        fechaCaptura: fotografia.fechaCaptura, orden: fotografia.orden,
      })
      .from(fotografia)
      .innerJoin(pTipoFoto, eq(fotografia.idTipoFoto, pTipoFoto.id))
      .where(eq(fotografia.idCaso, idCaso))
      .orderBy(fotografia.orden),

      db.select({
        id: noticia.id, url: noticia.url, medio: noticia.medio,
        titular: noticia.titular, bajada: noticia.bajada, fechaPub: noticia.fechaPub,
        tipoMatch: pTipoMatch.codigo,
        estadoRevision: pEstadoNoticia.codigo, estadoRevisionNombre: pEstadoNoticia.nombre,
      })
      .from(noticia)
      .leftJoin(pTipoMatch,     eq(noticia.idTipoMatch,     pTipoMatch.id))
      .leftJoin(pEstadoNoticia, eq(noticia.idEstadoNoticia, pEstadoNoticia.id))
      .where(eq(noticia.idCaso, idCaso)),

    ])

  // Query de hashtags separado — tolerante a que la migración no se haya ejecutado aún
  let hashtags: { id: number; texto: string }[] = []
  try {
    hashtags = await db
      .select({ id: hashtag.id, texto: hashtag.texto })
      .from(casoHashtag)
      .innerJoin(hashtag, eq(casoHashtag.idHashtag, hashtag.id))
      .where(eq(casoHashtag.idCaso, idCaso))
      .orderBy(hashtag.texto)
  } catch {
    // tabla no existe todavía — devolver array vacío sin romper el endpoint
  }

  return { ...cab, lugares, imputados, victimas, incautaciones, vehiculos, fotografias, noticias, hashtags }
}

// ── Rutas ─────────────────────────────────────────────────────────────────────

export async function casosRoutes(app: FastifyInstance) {

  // GET /casos?boletinId=X — lista casos de un boletín
  app.get('/', {}, async (request, reply) => {
    const { boletinId } = request.query as { boletinId?: string }

    const filas = await db
      .select({
        id:               caso.id,
        idBoletin:        caso.idBoletin,
        numeroCaso:       caso.numeroCaso,
        fechaHecho:       caso.fechaHecho,
        ruc:              caso.ruc,
        tipoDelito:       pTipoDelito.codigo,
        tipoDelitoNombre: pTipoDelito.nombre,
        estadoCausa:      pEstadoCausa.codigo,
        estadoCausaNombre:pEstadoCausa.nombre,
        unidadPolicial:   caso.unidadPolicial,
      })
      .from(caso)
      .innerJoin(pTipoDelito,  eq(caso.idTipoDelitoPpal, pTipoDelito.id))
      .innerJoin(pEstadoCausa, eq(caso.idEstadoCausa,    pEstadoCausa.id))
      .where(boletinId ? eq(caso.idBoletin, parseInt(boletinId)) : undefined)
      .orderBy(caso.idBoletin, caso.numeroCaso)

    return reply.send(filas)
  })

  // POST /casos — crear caso + lugar en una transacción
  app.post('/', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const body = CrearCasoSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const { lugar: lugarData, ...casoData } = body.data
    const { sub: usuarioIngreso } = request.user

    const resultado = await db.transaction(async (tx) => {
      const [nuevoCaso] = await tx
        .insert(caso)
        .values({ ...casoData, usuarioIngreso })
        .returning()

      const [nuevoLugar] = await tx
        .insert(lugar)
        .values({ idCaso: nuevoCaso.id, ...lugarData })
        .returning()

      return { ...nuevoCaso, lugar: nuevoLugar }
    })

    return reply.status(201).send(resultado)
  })

  // GET /casos/:id — caso completo con todas sus entidades
  app.get('/:id', {}, async (request, reply) => {
    const { id } = request.params as { id: string }
    const resultado = await getCasoCompleto(parseInt(id))
    if (!resultado) return reply.status(404).send({ error: 'Caso no encontrado' })
    return reply.send(resultado)
  })

  // PATCH /casos/:id — actualizar campos del caso
  app.patch('/:id', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = ActualizarCasoSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const [existente] = await db
      .select({ id: caso.id })
      .from(caso)
      .where(eq(caso.id, parseInt(id)))
      .limit(1)

    if (!existente) return reply.status(404).send({ error: 'Caso no encontrado' })

    const [actualizado] = await db
      .update(caso)
      .set(body.data)
      .where(eq(caso.id, parseInt(id)))
      .returning()

    return reply.send(actualizado)
  })

  // ── Sub-recursos del caso ───────────────────────────────────────────────────

  // POST /casos/:id/imputados
  app.post('/:id/imputados', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = ImputadoSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const [nuevo] = await db
      .insert(imputado)
      .values({ idCaso: parseInt(id), ...body.data })
      .returning()

    return reply.status(201).send(nuevo)
  })

  // DELETE /casos/:id/imputados/:imputadoId
  app.delete('/:id/imputados/:imputadoId', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id, imputadoId } = request.params as { id: string; imputadoId: string }

    await db
      .delete(imputado)
      .where(and(eq(imputado.id, parseInt(imputadoId)), eq(imputado.idCaso, parseInt(id))))

    return reply.status(204).send()
  })

  // POST /casos/:id/victimas
  app.post('/:id/victimas', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = VictimaSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const [nuevo] = await db
      .insert(victima)
      .values({ idCaso: parseInt(id), ...body.data })
      .returning()

    return reply.status(201).send(nuevo)
  })

  // DELETE /casos/:id/victimas/:victimaId
  app.delete('/:id/victimas/:victimaId', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id, victimaId } = request.params as { id: string; victimaId: string }

    await db
      .delete(victima)
      .where(and(eq(victima.id, parseInt(victimaId)), eq(victima.idCaso, parseInt(id))))

    return reply.status(204).send()
  })

  // POST /casos/:id/incautaciones
  app.post('/:id/incautaciones', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = IncautacionSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const [nuevo] = await db
      .insert(incautacion)
      .values({ idCaso: parseInt(id), ...body.data })
      .returning()

    return reply.status(201).send(nuevo)
  })

  // DELETE /casos/:id/incautaciones/:incautacionId
  app.delete('/:id/incautaciones/:incautacionId', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id, incautacionId } = request.params as { id: string; incautacionId: string }

    await db
      .delete(incautacion)
      .where(and(eq(incautacion.id, parseInt(incautacionId)), eq(incautacion.idCaso, parseInt(id))))

    return reply.status(204).send()
  })

  // POST /casos/:id/vehiculos
  app.post('/:id/vehiculos', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = VehiculoSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const [nuevo] = await db
      .insert(vehiculo)
      .values({ idCaso: parseInt(id), ...body.data })
      .returning()

    return reply.status(201).send(nuevo)
  })

  // POST /casos/:id/noticias
  app.post('/:id/noticias', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = NoticiaSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const [nuevo] = await db
      .insert(noticia)
      .values({ idCaso: parseInt(id), ...body.data })
      .returning()

    return reply.status(201).send(nuevo)
  })

  // DELETE /casos/:id/noticias/:noticiaId
  app.delete('/:id/noticias/:noticiaId', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id, noticiaId } = request.params as { id: string; noticiaId: string }

    await db
      .delete(noticia)
      .where(and(eq(noticia.id, parseInt(noticiaId)), eq(noticia.idCaso, parseInt(id))))

    return reply.status(204).send()
  })

  // ── Fotografías ────────────────────────────────────────────────────────────

  // POST /casos/:id/fotografias — sube imagen a MinIO y registra en DB
  app.post('/:id/fotografias', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const casoId = parseInt(id)

    const [existente] = await db
      .select({ id: caso.id })
      .from(caso)
      .where(eq(caso.id, casoId))
      .limit(1)
    if (!existente) return reply.status(404).send({ error: 'Caso no encontrado' })

    // Leer partes del multipart
    let fileBuffer: Buffer | null = null
    let fileMimetype = 'image/jpeg'
    let fileExt     = 'jpg'
    let idTipoFoto  = 0
    let descripcion = ''
    let orden       = 1

    const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp']

    try {
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          if (!TIPOS_VALIDOS.includes(part.mimetype)) {
            return reply.status(400).send({ error: 'Solo se permiten imágenes JPG, PNG o WebP' })
          }
          const chunks: Buffer[] = []
          for await (const chunk of part.file) chunks.push(chunk)
          fileBuffer   = Buffer.concat(chunks)
          fileMimetype = part.mimetype
          fileExt      = part.filename.split('.').pop()?.toLowerCase() ?? 'jpg'
        } else {
          const val = (part as { value: string }).value
          if (part.fieldname === 'idTipoFoto')  idTipoFoto  = parseInt(val)
          if (part.fieldname === 'descripcion') descripcion = val
          if (part.fieldname === 'orden')       orden       = parseInt(val)
        }
      }
    } catch (err) {
      return reply.status(400).send({ error: 'Error al procesar el archivo' })
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return reply.status(400).send({ error: 'No se recibió ningún archivo' })
    }

    // Obtener idTipoFoto válido (fallback al primero si no se envió)
    if (!idTipoFoto) {
      const [primero] = await db.select({ id: pTipoFoto.id }).from(pTipoFoto).limit(1)
      idTipoFoto = primero?.id ?? 1
    }

    // Subir a MinIO
    const key = `casos/${casoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    let archivoUrl: string
    try {
      archivoUrl = await uploadFile(key, fileBuffer)
    } catch (err) {
      request.log.error({ err }, 'Error al subir a MinIO')
      return reply.status(503).send({ error: 'Almacenamiento no disponible' })
    }

    // Registrar en BD
    const [nueva] = await db
      .insert(fotografia)
      .values({ idCaso: casoId, idTipoFoto, descripcion: descripcion || null, archivoUrl, orden })
      .returning()

    return reply.status(201).send(nueva)
  })

  // POST /casos/:id/fotografias/from-url — descarga imagen remota y la registra como foto
  app.post('/:id/fotografias/from-url', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const casoId = parseInt(id)

    const body = z.object({
      imageUrl:    z.string().url(),
      idTipoFoto:  z.number().int().positive().optional(),
      descripcion: z.string().optional(),
      orden:       z.number().int().min(1).optional(),
    }).safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Datos inválidos' })

    const [existente] = await db.select({ id: caso.id }).from(caso).where(eq(caso.id, casoId)).limit(1)
    if (!existente) return reply.status(404).send({ error: 'Caso no encontrado' })

    // Descargar imagen remota
    let buffer: Buffer
    let ext = 'jpg'
    try {
      const res = await fetch(body.data.imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ECOHBot/1.0)' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) return reply.status(502).send({ error: 'No se pudo descargar la imagen' })

      const ct = res.headers.get('content-type') ?? ''
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowed.some(t => ct.includes(t))) {
        return reply.status(400).send({ error: 'La URL no apunta a una imagen válida' })
      }
      ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg'
      buffer = Buffer.from(await res.arrayBuffer())
    } catch {
      return reply.status(502).send({ error: 'Error al descargar la imagen' })
    }

    // Obtener idTipoFoto: si no se envió, usar el tipo 'prensa'; si no existe, el primero
    let idTipoFoto = body.data.idTipoFoto
    if (!idTipoFoto) {
      const [tipoPrensaRow] = await db.select({ id: pTipoFoto.id }).from(pTipoFoto).where(eq(pTipoFoto.codigo, 'prensa')).limit(1)
      if (tipoPrensaRow) {
        idTipoFoto = tipoPrensaRow.id
      } else {
        const [primero] = await db.select({ id: pTipoFoto.id }).from(pTipoFoto).limit(1)
        idTipoFoto = primero?.id ?? 1
      }
    }

    const key = `casos/${casoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    let archivoUrl: string
    try {
      archivoUrl = await uploadFile(key, buffer)
    } catch {
      return reply.status(503).send({ error: 'Almacenamiento no disponible' })
    }

    const [nueva] = await db
      .insert(fotografia)
      .values({
        idCaso: casoId,
        idTipoFoto,
        descripcion: body.data.descripcion ?? null,
        archivoUrl,
        orden: body.data.orden ?? 99,
      })
      .returning()

    return reply.status(201).send(nueva)
  })

  // DELETE /casos/:id/fotografias/:fotoId
  app.delete('/:id/fotografias/:fotoId', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id, fotoId } = request.params as { id: string; fotoId: string }

    const [foto] = await db
      .select({ id: fotografia.id, archivoUrl: fotografia.archivoUrl })
      .from(fotografia)
      .where(and(eq(fotografia.id, parseInt(fotoId)), eq(fotografia.idCaso, parseInt(id))))
      .limit(1)

    if (!foto) return reply.status(404).send({ error: 'Fotografía no encontrada' })

    // Eliminar de MinIO (falla silenciosa — la BD se limpia igual)
    deleteFile(foto.archivoUrl).catch(() => {})

    await db.delete(fotografia).where(eq(fotografia.id, foto.id))

    return reply.status(204).send()
  })

  // ── Hashtags ────────────────────────────────────────────────────────────────

  // POST /casos/:id/hashtags — agrega hashtag al caso (crea el tag si no existe)
  app.post('/:id/hashtags', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const casoId = parseInt((request.params as { id: string }).id)
    const { texto } = request.body as { texto?: string }

    if (!texto?.trim()) return reply.status(400).send({ error: 'El texto del hashtag es obligatorio' })

    const slug = texto.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_áéíóúñ]/g, '')
    if (!slug) return reply.status(400).send({ error: 'Hashtag inválido' })

    // Upsert del hashtag
    const [tag] = await db
      .insert(hashtag)
      .values({ texto: slug })
      .onConflictDoUpdate({ target: hashtag.texto, set: { texto: slug } })
      .returning()

    // Vincular al caso (ignorar si ya existe)
    await db
      .insert(casoHashtag)
      .values({ idCaso: casoId, idHashtag: tag.id })
      .onConflictDoNothing()

    return reply.status(201).send(tag)
  })

  // DELETE /casos/:id/hashtags/:hashtagId — desvincula hashtag del caso
  app.delete('/:id/hashtags/:hashtagId', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id, hashtagId } = request.params as { id: string; hashtagId: string }

    await db
      .delete(casoHashtag)
      .where(and(eq(casoHashtag.idCaso, parseInt(id)), eq(casoHashtag.idHashtag, parseInt(hashtagId))))

    return reply.status(204).send()
  })

  // ── Red asociativa ──────────────────────────────────────────────────────────

  // GET /casos/:id/red — nodos y conexiones entre imputados cruzados por N° documento
  app.get('/:id/red', {}, async (request, reply) => {
    const casoId = parseInt((request.params as { id: string }).id)

    // 1. Imputados del caso actual
    const imputadosCaso = await db
      .select({
        id:                 imputado.id,
        apellidoPaterno:    imputado.apellidoPaterno,
        apellidoMaterno:    imputado.apellidoMaterno,
        nombres:            imputado.nombres,
        numDoc:             imputado.numeroDocumento,
        numCausasPrevias:   imputado.numCausasPrevias,
        alertaReincidencia: imputado.alertaReincidencia,
        fotoUrl:            imputado.fotoUrl,
      })
      .from(imputado)
      .where(eq(imputado.idCaso, casoId))

    if (imputadosCaso.length === 0) return reply.send({ imputados: [] })

    // 2. Mismo individuo en otros casos (cruce por número de documento)
    const numDocs = imputadosCaso.map(i => i.numDoc)

    const matches = await db
      .select({ numDoc: imputado.numeroDocumento, idCaso: imputado.idCaso })
      .from(imputado)
      .where(and(inArray(imputado.numeroDocumento, numDocs), ne(imputado.idCaso, casoId)))

    const otrosCasoIds = [...new Set(matches.map(m => m.idCaso))]

    let casosMeta: { id: number; ruc: string; numeroCaso: number; tipoDelito: string; tipoDelitoNombre: string }[] = []
    let coImputadosRows: { id: number; idCaso: number; numDoc: string; apellidoPaterno: string; nombres: string }[] = []

    if (otrosCasoIds.length > 0) {
      ;[casosMeta, coImputadosRows] = await Promise.all([
        db.select({
          id:              caso.id,
          ruc:             caso.ruc,
          numeroCaso:      caso.numeroCaso,
          tipoDelito:      pTipoDelito.codigo,
          tipoDelitoNombre:pTipoDelito.nombre,
        })
        .from(caso)
        .innerJoin(pTipoDelito, eq(caso.idTipoDelitoPpal, pTipoDelito.id))
        .where(inArray(caso.id, otrosCasoIds)),

        // Co-imputados: personas que NO son las ya conocidas, pero comparten esos otros casos
        db.select({
          id:              imputado.id,
          idCaso:          imputado.idCaso,
          numDoc:          imputado.numeroDocumento,
          apellidoPaterno: imputado.apellidoPaterno,
          nombres:         imputado.nombres,
        })
        .from(imputado)
        .where(and(
          inArray(imputado.idCaso, otrosCasoIds),
          notInArray(imputado.numeroDocumento, numDocs),
        )),
      ])
    }

    // 3. Armar respuesta
    const result = imputadosCaso.map(imp => {
      const susOtrosCasos = matches
        .filter(m => m.numDoc === imp.numDoc)
        .map(m => {
          const c = casosMeta.find(c => c.id === m.idCaso)
          if (!c) return null
          const coImps = coImputadosRows
            .filter(ci => ci.idCaso === c.id)
            .map(ci => ({ id: ci.id, nombre: `${ci.apellidoPaterno} ${ci.nombres}`, numDoc: ci.numDoc }))
          return { ...c, coImputados: coImps }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      return {
        id:                 imp.id,
        nombre:             [imp.apellidoPaterno, imp.apellidoMaterno, imp.nombres].filter(Boolean).join(' '),
        numDoc:             imp.numDoc,
        numCausasPrevias:   imp.numCausasPrevias,
        alertaReincidencia: imp.alertaReincidencia,
        fotoUrl:            imp.fotoUrl,
        otrosCasos:         susOtrosCasos,
      }
    })

    return reply.send({ imputados: result })
  })
}

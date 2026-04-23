import type { FastifyInstance } from 'fastify'
import { eq, desc, inArray, asc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import {
  boletin, caso, imputado, victima, incautacion, lugar, noticia, fotografia, fiscal,
  pEstadoBoletin, pTipoDelito, pEstadoCausa, pComuna, pTipoEspecie,
  pCalidadVictima, pTipoLesiones, pTipoFoto, usuario, boletinConclusion,
} from '../db/schema.js'

const TIPOS_CONCLUSION = ['info', 'advertencia', 'tendencia', 'recomendacion', 'alerta'] as const

const ConclusionSchema = z.object({
  tipo:  z.enum(TIPOS_CONCLUSION).default('info'),
  texto: z.string().min(1).max(2000),
  orden: z.number().int().min(0).optional(),
})

// ── Schemas de validación ─────────────────────────────────────────────────────

const CrearBoletinSchema = z.object({
  numero:     z.number().int().positive(),
  fechaDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  fechaHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  provincia:  z.string().optional(),
  idEstado:   z.number().int().positive().optional(),
  resumen:    z.string().optional(),
})

const ActualizarBoletinSchema = z.object({
  numero:     z.number().int().positive().optional(),
  fechaDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fechaHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  provincia:  z.string().min(1).optional(),
  region:     z.string().min(1).optional(),
  resumen:    z.string().optional(),
  idEstado:   z.number().int().positive().optional(),
  fechaPub:   z.string().datetime().optional(),
})

// ── Rutas ─────────────────────────────────────────────────────────────────────

export async function boletinesRoutes(app: FastifyInstance) {

  // GET /boletines — lista paginada con resumen de casos
  app.get('/', {}, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const filas = await db
      .select({
        id:         boletin.id,
        numero:     boletin.numero,
        fechaDesde: boletin.fechaDesde,
        fechaHasta: boletin.fechaHasta,
        estado:     pEstadoBoletin.codigo,
        estadoNombre: pEstadoBoletin.nombre,
        analista:   usuario.nombre,
        resumen:    boletin.resumen,
        createdAt:  boletin.createdAt,
      })
      .from(boletin)
      .innerJoin(pEstadoBoletin, eq(boletin.idEstado, pEstadoBoletin.id))
      .leftJoin(usuario, eq(boletin.idAnalista, usuario.id))
      .orderBy(desc(boletin.numero))
      .limit(parseInt(limit))
      .offset(offset)

    return reply.send(filas)
  })

  // POST /boletines — crear nuevo boletín (sólo analistas)
  app.post('/', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const body = CrearBoletinSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const { sub: idAnalista } = request.user

    // Estado por defecto: borrador
    let idEstado = body.data.idEstado
    if (!idEstado) {
      const [borrador] = await db
        .select({ id: pEstadoBoletin.id })
        .from(pEstadoBoletin)
        .where(eq(pEstadoBoletin.codigo, 'borrador'))
        .limit(1)
      idEstado = borrador!.id
    }

    const [nuevo] = await db
      .insert(boletin)
      .values({
        numero:     body.data.numero,
        fechaDesde: body.data.fechaDesde,
        fechaHasta: body.data.fechaHasta,
        provincia:  body.data.provincia?.trim() || 'Fiscalía Regional de Coquimbo',
        idAnalista,
        idEstado,
        resumen:    body.data.resumen,
      })
      .returning()

    return reply.status(201).send(nuevo)
  })

  // GET /boletines/:id — boletín con todos sus casos
  app.get('/:id', {}, async (request, reply) => {
    const { id } = request.params as { id: string }
    const boletinId = parseInt(id)

    const [cab] = await db
      .select({
        id:           boletin.id,
        numero:       boletin.numero,
        fechaDesde:   boletin.fechaDesde,
        fechaHasta:   boletin.fechaHasta,
        provincia:    boletin.provincia,
        region:       boletin.region,
        estado:       pEstadoBoletin.codigo,
        estadoNombre: pEstadoBoletin.nombre,
        analista:     usuario.nombre,
        resumen:      boletin.resumen,
        fechaPub:     boletin.fechaPub,
        createdAt:    boletin.createdAt,
        updatedAt:    boletin.updatedAt,
      })
      .from(boletin)
      .innerJoin(pEstadoBoletin, eq(boletin.idEstado, pEstadoBoletin.id))
      .leftJoin(usuario, eq(boletin.idAnalista, usuario.id))
      .where(eq(boletin.id, boletinId))
      .limit(1)

    if (!cab) return reply.status(404).send({ error: 'Boletín no encontrado' })

    const casos = await db
      .select({
        id:              caso.id,
        numeroCaso:      caso.numeroCaso,
        fechaHecho:      caso.fechaHecho,
        ruc:             caso.ruc,
        tipoDelito:      pTipoDelito.codigo,
        tipoDelitoNombre: pTipoDelito.nombre,
        estadoCausa:     pEstadoCausa.codigo,
        estadoCausaNombre: pEstadoCausa.nombre,
        relatoBreve:     caso.relatoBreve,
        unidadPolicial:  caso.unidadPolicial,
      })
      .from(caso)
      .innerJoin(pTipoDelito,  eq(caso.idTipoDelitoPpal, pTipoDelito.id))
      .innerJoin(pEstadoCausa, eq(caso.idEstadoCausa,    pEstadoCausa.id))
      .where(eq(caso.idBoletin, boletinId))
      .orderBy(caso.numeroCaso)

    return reply.send({ ...cab, casos })
  })

  // GET /boletines/:id/export — datos completos para generación de PDF
  app.get('/:id/export', {}, async (request, reply) => {
    const boletinId = parseInt((request.params as { id: string }).id)

    const [cab] = await db
      .select({
        id:           boletin.id,
        numero:       boletin.numero,
        fechaDesde:   boletin.fechaDesde,
        fechaHasta:   boletin.fechaHasta,
        provincia:    boletin.provincia,
        region:       boletin.region,
        estado:       pEstadoBoletin.codigo,
        estadoNombre: pEstadoBoletin.nombre,
        analista:     usuario.nombre,
        resumen:      boletin.resumen,
        fechaPub:     boletin.fechaPub,
      })
      .from(boletin)
      .innerJoin(pEstadoBoletin, eq(boletin.idEstado, pEstadoBoletin.id))
      .leftJoin(usuario, eq(boletin.idAnalista, usuario.id))
      .where(eq(boletin.id, boletinId))
      .limit(1)

    if (!cab) return reply.status(404).send({ error: 'Boletín no encontrado' })

    const casos = await db
      .select({
        id:                caso.id,
        numeroCaso:        caso.numeroCaso,
        fechaHecho:        caso.fechaHecho,
        horaHecho:         caso.horaHecho,
        ruc:               caso.ruc,
        folioBitacora:     caso.folioBitacora,
        tipoDelitoNombre:  pTipoDelito.nombre,
        estadoCausaNombre: pEstadoCausa.nombre,
        relatoBreve:       caso.relatoBreve,
        diligencias:       caso.diligencias,
        observaciones:     caso.observaciones,
        unidadPolicial:    caso.unidadPolicial,
        plazoInvestDias:   caso.plazoInvestDias,
        fiscal:            fiscal.nombre,
      })
      .from(caso)
      .innerJoin(pTipoDelito,  eq(caso.idTipoDelitoPpal, pTipoDelito.id))
      .innerJoin(pEstadoCausa, eq(caso.idEstadoCausa,    pEstadoCausa.id))
      .leftJoin(fiscal,        eq(caso.idFiscal,         fiscal.id))
      .where(eq(caso.idBoletin, boletinId))
      .orderBy(caso.numeroCaso)

    // Para cada caso, traer entidades relacionadas en paralelo
    const casosConDetalle = await Promise.all(casos.map(async (c) => {
      const [lugaresCaso, imputadosCaso, victimasCaso, incautacionesCaso, noticiasCaso, fotografiasCaso] =
        await Promise.all([
          db.select({
            direccion:     lugar.direccion,
            sector:        lugar.sector,
            comuna:        pComuna.nombre,
            coordenadaLat: lugar.coordenadaLat,
            coordenadaLon: lugar.coordenadaLon,
          })
          .from(lugar)
          .leftJoin(pComuna, eq(lugar.idComuna, pComuna.id))
          .where(eq(lugar.idCaso, c.id)),

          db.select({
            apellidoPaterno:    imputado.apellidoPaterno,
            apellidoMaterno:    imputado.apellidoMaterno,
            nombres:            imputado.nombres,
            numCausasPrevias:   imputado.numCausasPrevias,
            alertaReincidencia: imputado.alertaReincidencia,
            fotoUrl:            imputado.fotoUrl,
          })
          .from(imputado)
          .where(eq(imputado.idCaso, c.id)),

          db.select({
            nombre:       victima.nombre,
            calidad:      pCalidadVictima.nombre,
            tipoLesiones: pTipoLesiones.nombre,
          })
          .from(victima)
          .leftJoin(pCalidadVictima, eq(victima.idCalidad,      pCalidadVictima.id))
          .leftJoin(pTipoLesiones,   eq(victima.idTipoLesiones, pTipoLesiones.id))
          .where(eq(victima.idCaso, c.id)),

          db.select({
            descripcion:      incautacion.descripcion,
            tipoEspecie:      pTipoEspecie.nombre,
            cantidad:         incautacion.cantidad,
            unidadMedida:     incautacion.unidadMedida,
          })
          .from(incautacion)
          .leftJoin(pTipoEspecie, eq(incautacion.idTipoEspecie, pTipoEspecie.id))
          .where(eq(incautacion.idCaso, c.id)),

          db.select({ url: noticia.url, medio: noticia.medio, titular: noticia.titular, bajada: noticia.bajada })
          .from(noticia)
          .where(eq(noticia.idCaso, c.id)),

          db.select({
            archivoUrl:  fotografia.archivoUrl,
            descripcion: fotografia.descripcion,
            tipoFoto:    pTipoFoto.nombre,
            orden:       fotografia.orden,
          })
          .from(fotografia)
          .leftJoin(pTipoFoto, eq(fotografia.idTipoFoto, pTipoFoto.id))
          .where(eq(fotografia.idCaso, c.id))
          .orderBy(fotografia.orden),
        ])

      return {
        ...c,
        lugar:         lugaresCaso[0] ?? null,
        imputados:     imputadosCaso,
        victimas:      victimasCaso,
        incautaciones: incautacionesCaso,
        noticias:      noticiasCaso,
        fotografias:   fotografiasCaso,
      }
    }))

    // Conclusiones del boletín
    const conclusionesBoletin = await db
      .select({
        id:    boletinConclusion.id,
        orden: boletinConclusion.orden,
        tipo:  boletinConclusion.tipo,
        texto: boletinConclusion.texto,
      })
      .from(boletinConclusion)
      .where(eq(boletinConclusion.idBoletin, boletinId))
      .orderBy(asc(boletinConclusion.orden), asc(boletinConclusion.id))

    return reply.send({ ...cab, casos: casosConDetalle, conclusiones: conclusionesBoletin })
  })

  // PATCH /boletines/:id/publicar — marcar como publicado (sólo analistas)
  app.patch('/:id/publicar', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const boletinId = parseInt((request.params as { id: string }).id)

    const [existente] = await db
      .select({ id: boletin.id })
      .from(boletin)
      .where(eq(boletin.id, boletinId))
      .limit(1)

    if (!existente) return reply.status(404).send({ error: 'Boletín no encontrado' })

    const [estadoPublicado] = await db
      .select({ id: pEstadoBoletin.id })
      .from(pEstadoBoletin)
      .where(eq(pEstadoBoletin.codigo, 'publicado'))
      .limit(1)

    const [actualizado] = await db
      .update(boletin)
      .set({ idEstado: estadoPublicado!.id, fechaPub: new Date() })
      .where(eq(boletin.id, boletinId))
      .returning()

    return reply.send(actualizado)
  })

  // PATCH /boletines/:id/despublicar — volver a borrador (sólo analistas)
  app.patch('/:id/despublicar', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const boletinId = parseInt((request.params as { id: string }).id)

    const [existente] = await db
      .select({ id: boletin.id })
      .from(boletin)
      .where(eq(boletin.id, boletinId))
      .limit(1)

    if (!existente) return reply.status(404).send({ error: 'Boletín no encontrado' })

    const [estadoBorrador] = await db
      .select({ id: pEstadoBoletin.id })
      .from(pEstadoBoletin)
      .where(eq(pEstadoBoletin.codigo, 'borrador'))
      .limit(1)

    const [actualizado] = await db
      .update(boletin)
      .set({ idEstado: estadoBorrador!.id, fechaPub: null })
      .where(eq(boletin.id, boletinId))
      .returning()

    return reply.send(actualizado)
  })

  // DELETE /boletines/:id — eliminar boletín y todos sus casos (sólo analistas)
  app.delete('/:id', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const boletinId = parseInt((request.params as { id: string }).id)

    const [existente] = await db
      .select({ id: boletin.id })
      .from(boletin)
      .where(eq(boletin.id, boletinId))
      .limit(1)

    if (!existente) return reply.status(404).send({ error: 'Boletín no encontrado' })

    // Eliminar en transacción: primero los casos (sus sub-registros cascadean por FK),
    // luego el boletín
    await db.transaction(async (tx) => {
      const casosIds = await tx
        .select({ id: caso.id })
        .from(caso)
        .where(eq(caso.idBoletin, boletinId))

      if (casosIds.length > 0) {
        await tx.delete(caso).where(inArray(caso.id, casosIds.map(c => c.id)))
      }

      await tx.delete(boletin).where(eq(boletin.id, boletinId))
    })

    return reply.status(204).send()
  })

  // ── Conclusiones ─────────────────────────────────────────────────────────────

  // GET /boletines/:id/conclusiones
  app.get('/:id/conclusiones', {}, async (request, reply) => {
    const boletinId = parseInt((request.params as { id: string }).id)
    const rows = await db
      .select()
      .from(boletinConclusion)
      .where(eq(boletinConclusion.idBoletin, boletinId))
      .orderBy(asc(boletinConclusion.orden), asc(boletinConclusion.id))
    return reply.send(rows)
  })

  // POST /boletines/:id/conclusiones
  app.post('/:id/conclusiones', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const boletinId = parseInt((request.params as { id: string }).id)
    const body = ConclusionSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })

    const [existente] = await db.select({ id: boletin.id }).from(boletin).where(eq(boletin.id, boletinId)).limit(1)
    if (!existente) return reply.status(404).send({ error: 'Boletín no encontrado' })

    const [nueva] = await db
      .insert(boletinConclusion)
      .values({ idBoletin: boletinId, tipo: body.data.tipo, texto: body.data.texto, orden: body.data.orden ?? 0 })
      .returning()
    return reply.status(201).send(nueva)
  })

  // PATCH /boletines/:id/conclusiones/:cid
  app.patch('/:id/conclusiones/:cid', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const boletinId = parseInt((request.params as { id: string; cid: string }).id)
    const cid       = parseInt((request.params as { id: string; cid: string }).cid)
    const body = ConclusionSchema.partial().safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })

    const [existente] = await db.select({ id: boletinConclusion.id }).from(boletinConclusion)
      .where(eq(boletinConclusion.id, cid)).limit(1)
    if (!existente) return reply.status(404).send({ error: 'Conclusión no encontrada' })

    const vals: Partial<typeof boletinConclusion.$inferInsert> = {}
    if (body.data.tipo  !== undefined) vals.tipo  = body.data.tipo
    if (body.data.texto !== undefined) vals.texto = body.data.texto
    if (body.data.orden !== undefined) vals.orden = body.data.orden

    const [actualizada] = await db
      .update(boletinConclusion).set(vals)
      .where(eq(boletinConclusion.id, cid))
      .returning()
    return reply.send(actualizada)
  })

  // DELETE /boletines/:id/conclusiones/:cid
  app.delete('/:id/conclusiones/:cid', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const cid = parseInt((request.params as { id: string; cid: string }).cid)
    await db.delete(boletinConclusion).where(eq(boletinConclusion.id, cid))
    return reply.status(204).send()
  })

  // PATCH /boletines/:id — actualizar estado o resumen (sólo analistas)
  app.patch('/:id', { preHandler: [app.authenticate, app.authorizeAnalista] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = ActualizarBoletinSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const [existente] = await db
      .select({ id: boletin.id })
      .from(boletin)
      .where(eq(boletin.id, parseInt(id)))
      .limit(1)

    if (!existente) return reply.status(404).send({ error: 'Boletín no encontrado' })

    const valores: Partial<typeof boletin.$inferInsert> = {}
    if (body.data.numero     !== undefined) valores.numero     = body.data.numero
    if (body.data.fechaDesde !== undefined) valores.fechaDesde = body.data.fechaDesde
    if (body.data.fechaHasta !== undefined) valores.fechaHasta = body.data.fechaHasta
    if (body.data.provincia  !== undefined) valores.provincia  = body.data.provincia
    if (body.data.region     !== undefined) valores.region     = body.data.region
    if (body.data.resumen    !== undefined) valores.resumen    = body.data.resumen
    if (body.data.idEstado   !== undefined) valores.idEstado   = body.data.idEstado
    if (body.data.fechaPub   !== undefined) valores.fechaPub   = new Date(body.data.fechaPub)

    const [actualizado] = await db
      .update(boletin)
      .set(valores)
      .where(eq(boletin.id, parseInt(id)))
      .returning()

    return reply.send(actualizado)
  })
}

import type { FastifyInstance } from 'fastify'
import { eq, count, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  boletin, caso, imputado,
  pEstadoBoletin, pEstadoCausa, pTipoDelito,
} from '../db/schema.js'

export async function dashboardRoutes(app: FastifyInstance) {

  // GET /dashboard — KPIs agregados del portal
  app.get('/', {}, async (_request, reply) => {

    const [
      totalBoletines,
      totalCasos,
      casosPorEstado,
      casosPorDelito,
      casosConImputado,
      ultimosBoletines,
    ] = await Promise.all([

      // Total de boletines
      db.select({ n: count() }).from(boletin).then(r => r[0]?.n ?? 0),

      // Total de casos
      db.select({ n: count() }).from(caso).then(r => r[0]?.n ?? 0),

      // Casos agrupados por estado de causa
      db
        .select({ codigo: pEstadoCausa.codigo, nombre: pEstadoCausa.nombre, total: count() })
        .from(caso)
        .innerJoin(pEstadoCausa, eq(caso.idEstadoCausa, pEstadoCausa.id))
        .groupBy(pEstadoCausa.id, pEstadoCausa.codigo, pEstadoCausa.nombre),

      // Casos agrupados por tipo de delito
      db
        .select({ codigo: pTipoDelito.codigo, nombre: pTipoDelito.nombre, total: count() })
        .from(caso)
        .innerJoin(pTipoDelito, eq(caso.idTipoDelitoPpal, pTipoDelito.id))
        .groupBy(pTipoDelito.id, pTipoDelito.codigo, pTipoDelito.nombre)
        .orderBy(sql`count(*) desc`)
        .limit(6),

      // Casos con al menos un imputado identificado
      db
        .selectDistinct({ idCaso: imputado.idCaso })
        .from(imputado)
        .then(r => r.length),

      // Últimos 5 boletines con conteo de casos
      db
        .select({
          id:           boletin.id,
          numero:       boletin.numero,
          fechaDesde:   boletin.fechaDesde,
          fechaHasta:   boletin.fechaHasta,
          estado:       pEstadoBoletin.codigo,
          estadoNombre: pEstadoBoletin.nombre,
          totalCasos:   count(caso.id),
        })
        .from(boletin)
        .innerJoin(pEstadoBoletin, eq(boletin.idEstado, pEstadoBoletin.id))
        .leftJoin(caso, eq(caso.idBoletin, boletin.id))
        .groupBy(boletin.id, pEstadoBoletin.id, pEstadoBoletin.codigo, pEstadoBoletin.nombre)
        .orderBy(sql`${boletin.id} desc`)
        .limit(5),
    ])

    const casosPrisionPreventiva =
      casosPorEstado.find(e => e.codigo === 'prision_preventiva')?.total ?? 0

    return reply.send({
      totalBoletines,
      totalCasos:             Number(totalCasos),
      casosConImputado:       Number(casosConImputado),
      casosPrisionPreventiva: Number(casosPrisionPreventiva),
      casosPorEstado,
      casosPorDelito,
      ultimosBoletines,
    })
  })
}

import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import {
  pRolUsuario, pEstadoBoletin, pTipoDelito, pEstadoCausa,
  pTipoLugar, pComuna, pTipoDocumento, pSexo, pSitMigratoria,
  pCalidadVictima, pTipoLesiones, pTipoEspecie, pSubtipoDroga,
  pSubtipoArma, pEstadoEspecie, pRolVehiculo, pTipoFoto,
  pTipoMatch, pEstadoNoticia,
} from '../db/schema.js'

// Devuelve todas las tablas paramétricas activas en una sola llamada.
// El frontend las carga al iniciar y las usa para poblar selects/dropdowns.
export async function parametricasRoutes(app: FastifyInstance) {
  app.get('/', {}, async (_request, reply) => {
    const [
      rolesUsuario, estadosBoletin, tiposDelito, estadosCausa,
      tiposLugar, comunas, tiposDocumento, sexos, situacionesMigratorias,
      calidadesVictima, tiposLesiones, tiposEspecie, subtiposDroga,
      subtiposArma, estadosEspecie, rolesVehiculo, tiposFoto,
      tiposMatch, estadosNoticia,
    ] = await Promise.all([
      db.select().from(pRolUsuario).orderBy(pRolUsuario.orden),
      db.select().from(pEstadoBoletin).orderBy(pEstadoBoletin.orden),
      db.select().from(pTipoDelito).orderBy(pTipoDelito.orden),
      db.select().from(pEstadoCausa).orderBy(pEstadoCausa.orden),
      db.select().from(pTipoLugar).orderBy(pTipoLugar.orden),
      db.select().from(pComuna).orderBy(pComuna.orden),
      db.select().from(pTipoDocumento).orderBy(pTipoDocumento.orden),
      db.select().from(pSexo).orderBy(pSexo.orden),
      db.select().from(pSitMigratoria).orderBy(pSitMigratoria.orden),
      db.select().from(pCalidadVictima).orderBy(pCalidadVictima.orden),
      db.select().from(pTipoLesiones).orderBy(pTipoLesiones.orden),
      db.select().from(pTipoEspecie).orderBy(pTipoEspecie.orden),
      db.select().from(pSubtipoDroga).orderBy(pSubtipoDroga.orden),
      db.select().from(pSubtipoArma).orderBy(pSubtipoArma.orden),
      db.select().from(pEstadoEspecie).orderBy(pEstadoEspecie.orden),
      db.select().from(pRolVehiculo).orderBy(pRolVehiculo.orden),
      db.select().from(pTipoFoto).orderBy(pTipoFoto.orden),
      db.select().from(pTipoMatch).orderBy(pTipoMatch.orden),
      db.select().from(pEstadoNoticia).orderBy(pEstadoNoticia.orden),
    ])

    return reply.send({
      rolesUsuario,
      estadosBoletin,
      tiposDelito,
      estadosCausa,
      tiposLugar,
      comunas,
      tiposDocumento,
      sexos,
      situacionesMigratorias,
      calidadesVictima,
      tiposLesiones,
      tiposEspecie,
      subtiposDroga,
      subtiposArma,
      estadosEspecie,
      rolesVehiculo,
      tiposFoto,
      tiposMatch,
      estadosNoticia,
    })
  })
}

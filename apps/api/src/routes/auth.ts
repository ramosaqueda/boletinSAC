import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { usuario, pRolUsuario } from '../db/schema.js'
import { verifyPassword } from '../lib/password.js'

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post('/login', async (request, reply) => {
    const body = LoginSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: body.error.flatten() })
    }

    const { email, password } = body.data

    const rows = await db
      .select({
        id:           usuario.id,
        nombre:       usuario.nombre,
        email:        usuario.email,
        passwordHash: usuario.passwordHash,
        activo:       usuario.activo,
        rolCodigo:    pRolUsuario.codigo,
        rolNombre:    pRolUsuario.nombre,
      })
      .from(usuario)
      .innerJoin(pRolUsuario, eq(usuario.idRol, pRolUsuario.id))
      .where(eq(usuario.email, email))
      .limit(1)

    const user = rows[0]

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Credenciales inválidas' })
    }

    if (!user.activo) {
      return reply.status(403).send({ error: 'Usuario inactivo' })
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return reply.status(401).send({ error: 'Credenciales inválidas' })
    }

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, rol: user.rolCodigo },
      { expiresIn: '8h' },
    )

    return reply.send({
      token,
      usuario: {
        id:     user.id,
        nombre: user.nombre,
        email:  user.email,
        rol:    { codigo: user.rolCodigo, nombre: user.rolNombre },
      },
    })
  })

  // GET /auth/me  — requiere token válido
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { sub } = request.user

    const rows = await db
      .select({
        id:        usuario.id,
        nombre:    usuario.nombre,
        email:     usuario.email,
        activo:    usuario.activo,
        rolCodigo: pRolUsuario.codigo,
        rolNombre: pRolUsuario.nombre,
      })
      .from(usuario)
      .innerJoin(pRolUsuario, eq(usuario.idRol, pRolUsuario.id))
      .where(eq(usuario.id, sub))
      .limit(1)

    const user = rows[0]
    if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' })

    return reply.send({
      id:     user.id,
      nombre: user.nombre,
      email:  user.email,
      activo: user.activo,
      rol:    { codigo: user.rolCodigo, nombre: user.rolNombre },
    })
  })
}

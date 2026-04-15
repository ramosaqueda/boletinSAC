import type { FastifyRequest, FastifyReply } from 'fastify'

// Payload almacenado en el JWT
export interface JwtPayload {
  sub:   number   // usuario.id
  email: string
  rol:   string   // p_rol_usuario.codigo  (ej: 'analista', 'supervisor')
}

// Augmentaciones de tipos para Fastify
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user:    JwtPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate:       (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorizeAnalista:  (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

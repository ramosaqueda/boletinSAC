import 'dotenv/config'
import './types.js'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { authRoutes }        from './routes/auth.js'
import { boletinesRoutes }   from './routes/boletines.js'
import { casosRoutes }       from './routes/casos.js'
import { parametricasRoutes } from './routes/parametricas.js'
import { dashboardRoutes }   from './routes/dashboard.js'
import { noticiasRoutes }    from './routes/noticias.js'
import { hashtagsRoutes }    from './routes/hashtags.js'
import { registerUploadsRoute } from './lib/storage.js'

const app = Fastify({ logger: true })

// ── Plugins ──────────────────────────────────────────────────────────────────

await app.register(cors, {
  origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  credentials: true,
})

await app.register(jwt, {
  secret: process.env['JWT_SECRET'] ?? 'dev_secret_change_me_in_production',
})

await app.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB por foto
})

// Ruta estática para fotos subidas
registerUploadsRoute(app)

// Decorador authenticate — verifica JWT
app.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

// Decorador authorizeAnalista — permite roles con acceso de escritura
const ROLES_ESCRITURA = ['analista', 'supervisor']
app.decorate('authorizeAnalista', async function (request, reply) {
  if (!ROLES_ESCRITURA.includes(request.user?.rol)) {
    reply.status(403).send({ error: 'Acceso restringido a analistas' })
  }
})

// ── Rutas ─────────────────────────────────────────────────────────────────────

app.get('/health', async () => ({ status: 'ok' }))

await app.register(authRoutes,        { prefix: '/auth' })
await app.register(boletinesRoutes,   { prefix: '/boletines' })
await app.register(casosRoutes,       { prefix: '/casos' })
await app.register(parametricasRoutes,{ prefix: '/parametricas' })
await app.register(dashboardRoutes,   { prefix: '/dashboard' })
await app.register(noticiasRoutes,    { prefix: '/noticias' })
await app.register(hashtagsRoutes,    { prefix: '/hashtags' })

// ── Arranque ──────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: parseInt(process.env['PORT'] ?? '3001'), host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

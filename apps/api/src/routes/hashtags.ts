import type { FastifyInstance } from 'fastify'
import { ilike } from 'drizzle-orm'
import { db } from '../db/index.js'
import { hashtag } from '../db/schema.js'

// GET /hashtags?q=texto  — autocompletado (público)
export async function hashtagsRoutes(app: FastifyInstance) {
  app.get('/', {}, async (request, reply) => {
    const { q = '' } = request.query as { q?: string }

    const rows = await db
      .select({ id: hashtag.id, texto: hashtag.texto })
      .from(hashtag)
      .where(q.trim() ? ilike(hashtag.texto, `%${q.trim()}%`) : undefined)
      .orderBy(hashtag.texto)
      .limit(20)

    return reply.send(rows)
  })
}

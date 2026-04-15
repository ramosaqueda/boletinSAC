import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FastifyInstance } from 'fastify'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const UPLOADS_DIR = join(__dirname, '../../../uploads')

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp',
}

/** Guarda buffer en disco y devuelve la URL pública */
export async function uploadFile(key: string, buffer: Buffer): Promise<string> {
  const filePath = join(UPLOADS_DIR, key)
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, buffer)
  const base = process.env['API_BASE_URL'] ?? 'http://localhost:3001'
  return `${base}/uploads/${key}`
}

/** Elimina archivo del disco dado su URL */
export async function deleteFile(url: string): Promise<void> {
  const key = url.split('/uploads/')[1]
  if (!key) return
  await unlink(join(UPLOADS_DIR, key)).catch(() => {})
}

/** Registra la ruta GET /uploads/* en Fastify */
export function registerUploadsRoute(app: FastifyInstance) {
  app.get('/uploads/*', async (request, reply) => {
    const key = (request.params as { '*': string })['*']
    const filePath = join(UPLOADS_DIR, key)

    // Protección básica contra path traversal
    if (!filePath.startsWith(UPLOADS_DIR) || !existsSync(filePath)) {
      return reply.status(404).send()
    }

    const ext = key.split('.').pop()?.toLowerCase() ?? ''
    reply.header('Content-Type', MIME[ext] ?? 'application/octet-stream')
    reply.header('Cache-Control', 'public, max-age=31536000, immutable')
    return reply.send(createReadStream(filePath))
  })
}

/** No-op — compatibilidad con código que llamaba ensureBucket */
export async function ensureBucket(): Promise<void> {}

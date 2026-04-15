import type { FastifyInstance } from 'fastify'

function getMeta(html: string, ...props: string[]): string | null {
  for (const prop of props) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']{1,400})["']`, 'i')
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']{1,400})["'][^>]+(?:property|name)=["']${prop}["']`, 'i')
    const m = html.match(re1) ?? html.match(re2)
    if (m?.[1]?.trim()) return m[1].trim()
  }
  return null
}

export async function noticiasRoutes(app: FastifyInstance) {

  // GET /noticias/scrape?url=... — extrae metadatos Open Graph de una URL
  app.get('/scrape', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { url } = request.query as { url?: string }
    if (!url) return reply.status(400).send({ error: 'Falta parámetro url' })

    let parsed: URL
    try { parsed = new URL(url) } catch {
      return reply.status(400).send({ error: 'URL inválida' })
    }

    let html: string
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ECOHBot/1.0; +https://fiscalia.cl)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-CL,es;q=0.9',
        },
        signal: AbortSignal.timeout(8_000),
        redirect: 'follow',
      })
      if (!res.ok) return reply.status(502).send({ error: `El sitio respondió ${res.status}` })
      html = await res.text()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Timeout o sitio no disponible'
      return reply.status(502).send({ error: msg })
    }

    const titulo      = getMeta(html, 'og:title', 'twitter:title')
                     ?? html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim()
                     ?? null
    const descripcion = getMeta(html, 'og:description', 'twitter:description', 'description')
    const imagen      = getMeta(html, 'og:image', 'twitter:image:src', 'twitter:image')
    const siteName    = getMeta(html, 'og:site_name')
    const medio       = siteName ?? parsed.hostname.replace(/^www\./, '')
    const fechaPub    = getMeta(html, 'article:published_time', 'datePublished')
                        ?.slice(0, 10) ?? null   // solo YYYY-MM-DD

    return reply.send({ titulo, descripcion, imagen, medio, fechaPub })
  })
}

'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Imputado {
  apellidoPaterno: string
  apellidoMaterno: string | null
  nombres: string
  numCausasPrevias: number
  alertaReincidencia: boolean
  fotoUrl: string | null
}

interface Incautacion {
  descripcion: string
  tipoEspecie: string | null
  cantidad: string | null
  unidadMedida: string | null
}

interface Victima {
  nombre: string | null
  calidad: string | null
  tipoLesiones: string | null
}

interface Fotografia {
  archivoUrl: string
  descripcion: string | null
  tipoFoto: string | null
}

interface Noticia {
  url: string
  medio: string | null
  titular: string | null
  bajada: string | null
}

interface Caso {
  id: number
  numeroCaso: number
  fechaHecho: string
  horaHecho: string | null
  tipoDelitoNombre: string
  estadoCausaNombre: string
  relatoBreve: string | null
  diligencias: string | null
  observaciones: string | null
  unidadPolicial: string | null
  lugar: { direccion: string; sector: string | null; comuna: string | null; coordenadaLat: string | null; coordenadaLon: string | null } | null
  imputados: Imputado[]
  victimas: Victima[]
  incautaciones: Incautacion[]
  fotografias: Fotografia[]
  noticias: Noticia[]
}

interface ExportData {
  numero: number
  fechaDesde: string
  fechaHasta: string
  provincia: string | null
  region: string | null
  analista: string | null
  resumen: string | null
  casos: Caso[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtCorto(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}
function nombreImp(imp: Imputado) {
  return `${imp.apellidoPaterno}${imp.apellidoMaterno ? ' ' + imp.apellidoMaterno : ''}, ${imp.nombres}`
}

// ── Slide: Portada ─────────────────────────────────────────────────────────────

function SlidePortada({ data }: { data: ExportData }) {
  const totalImp   = data.casos.filter(c => c.imputados.length > 0).length
  const totalInc   = data.casos.filter(c => c.incautaciones.length > 0).length
  const totalPrev  = data.casos.filter(c => c.estadoCausaNombre.toLowerCase().includes('preventiva')).length

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1C3F81' }}>
      {/* Banda superior */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Ministerio Público · Fiscalía de Chile · {data.region ?? 'Región de Coquimbo'}
        </div>
        <div style={{ fontSize: '13px', color: '#f08080', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Reporte de Criminalidad N° {data.numero} · Delitos de interés SAC
        </div>
        <div style={{ fontSize: '52px', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '12px' }}>
          {data.provincia ?? 'Fiscalía Regional de Coquimbo'}
        </div>
        <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.75)', fontWeight: 300 }}>
          Semana del {fmtCorto(data.fechaDesde)} al {fmtCorto(data.fechaHasta)} de {new Date(data.fechaDesde + 'T12:00:00').getFullYear()}
        </div>
        {data.resumen && (
          <div style={{
            marginTop: '28px',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.08)',
            borderLeft: '3px solid rgba(255,255,255,0.35)',
            borderRadius: '4px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
              Resumen ejecutivo
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
              {data.resumen}
            </p>
          </div>
        )}
        {data.analista && (
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            Analista: {data.analista}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: '1px solid rgba(255,255,255,0.15)',
      }}>
        {[
          { n: data.casos.length, label: 'Casos semana' },
          { n: totalImp,          label: 'Con imputado' },
          { n: totalPrev,         label: 'Prisión preventiva', rojo: true },
          { n: totalInc,          label: 'Con incautaciones' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '28px 0', textAlign: 'center',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : undefined,
            background: s.rojo ? 'rgba(176,0,0,0.25)' : undefined,
          }}>
            <div style={{ fontSize: '44px', fontWeight: 800, color: s.rojo ? '#ff8080' : 'white', lineHeight: 1 }}>
              {s.n}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Lightbox ───────────────────────────────────────────────────────────────────

function Lightbox({
  fotos, index, onClose, onPrev, onNext,
}: {
  fotos: Fotografia[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const foto = fotos[index]!

  // Cerrar con Escape, navegar con flechas (sin propagar al slide)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape')                          onClose()
      if (e.key === 'ArrowRight' || e.key === ' ')     onNext()
      if (e.key === 'ArrowLeft')                       onPrev()
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose, onNext, onPrev])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'lb-in 0.18s ease',
      }}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '24px',
          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
          borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >×</button>

      {/* Flecha izq */}
      {fotos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          style={{
            position: 'absolute', left: '20px',
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
            borderRadius: '50%', width: '44px', height: '44px', fontSize: '22px',
            cursor: index === 0 ? 'default' : 'pointer',
            opacity: index === 0 ? 0.2 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >‹</button>
      )}

      {/* Imagen */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '85vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.archivoUrl}
          alt={foto.descripcion ?? ''}
          style={{
            maxWidth: '100%', maxHeight: '75vh',
            objectFit: 'contain', borderRadius: '6px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        />
        {(foto.tipoFoto || foto.descripcion) && (
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', textAlign: 'center' }}>
            {foto.tipoFoto && <strong style={{ color: 'white' }}>{foto.tipoFoto}</strong>}
            {foto.tipoFoto && foto.descripcion && ' · '}
            {foto.descripcion}
          </div>
        )}
        {fotos.length > 1 && (
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
            {index + 1} / {fotos.length}
          </div>
        )}
      </div>

      {/* Flecha der */}
      {fotos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          style={{
            position: 'absolute', right: '20px',
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
            borderRadius: '50%', width: '44px', height: '44px', fontSize: '22px',
            cursor: index === fotos.length - 1 ? 'default' : 'pointer',
            opacity: index === fotos.length - 1 ? 0.2 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >›</button>
      )}
    </div>
  )
}

// ── Thumbnail con hover React ─────────────────────────────────────────────────

function FotoThumb({ foto, onClick }: { foto: Fotografia; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', border: 'none', padding: 0, cursor: 'pointer',
        borderRadius: '6px', overflow: 'hidden',
        aspectRatio: '4/3', flexShrink: 0,
        outline: 'none',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.archivoUrl}
        alt={foto.descripcion ?? ''}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Overlay hover */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(28,63,129,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}>
        <span style={{ color: 'white', fontSize: '26px', lineHeight: 1 }}>⤢</span>
      </div>
      {/* Leyenda inferior */}
      {(foto.tipoFoto || foto.descripcion) && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.82))',
          color: 'white', fontSize: '9px', padding: '14px 6px 5px',
          lineHeight: 1.3,
        }}>
          {foto.tipoFoto && <strong>{foto.tipoFoto}</strong>}
          {foto.tipoFoto && foto.descripcion && ' · '}
          {foto.descripcion}
        </div>
      )}
    </button>
  )
}

// ── Minimap thumbnail ─────────────────────────────────────────────────────────

function MapaThumb({ lat, lon, onClick }: { lat: number; lon: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.004},${lat - 0.003},${lon + 0.004},${lat + 0.003}&layer=mapnik&marker=${lat},${lon}`

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', border: 'none', padding: 0, cursor: 'pointer',
        borderRadius: '6px', overflow: 'hidden',
        width: '100%', aspectRatio: '4/3', flexShrink: 0,
        outline: 'none',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <iframe
        src={embedUrl}
        style={{ width: '100%', height: '100%', border: 0, display: 'block', pointerEvents: 'none' }}
        loading="lazy"
        title="Mapa ubicación"
        sandbox="allow-scripts allow-same-origin"
      />
      {/* Overlay hover */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(28,63,129,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}>
        <span style={{ color: 'white', fontSize: '26px', lineHeight: 1 }}>⤢</span>
      </div>
      {/* Etiqueta */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.82))',
        color: 'white', fontSize: '9px', padding: '14px 6px 5px',
        lineHeight: 1.3, textAlign: 'center',
      }}>
        <strong>Ubicación del hecho</strong>
      </div>
    </button>
  )
}

// ── Lightbox de mapa ──────────────────────────────────────────────────────────

function MapaLightbox({ lat, lon, onClose }: { lat: number; lon: number; onClose: () => void }) {
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.012},${lat - 0.008},${lon + 0.012},${lat + 0.008}&layer=mapnik&marker=${lat},${lon}`
  const osmUrl   = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'lb-in 0.18s ease',
      }}
    >
      {/* Botón cerrar */}
      <button onClick={onClose} style={{
        position: 'absolute', top: '20px', right: '24px',
        background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
        borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>×</button>

      {/* Mapa */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '80vw', height: '76vh', display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <div style={{ flex: 1, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
          <iframe
            src={embedUrl}
            width="100%" height="100%"
            style={{ border: 0, display: 'block' }}
            title="Mapa ampliado"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '12px',
              textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)',
              paddingBottom: '1px',
            }}
          >
            Abrir en OpenStreetMap ↗
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Slide: Caso ────────────────────────────────────────────────────────────────

function SlideCaso({ caso }: { caso: Caso }) {
  const [lbIndex,  setLbIndex]  = useState<number | null>(null)
  const [mapaOpen, setMapaOpen] = useState(false)
  const fotos    = caso.fotografias
  const hasImp   = caso.imputados.length > 0
  const hasInc   = caso.incautaciones.length > 0
  const hasVict  = caso.victimas.length > 0
  const hasFoto  = fotos.length > 0
  const hasNot   = caso.noticias.length > 0

  const latNum  = parseFloat(caso.lugar?.coordenadaLat ?? '')
  const lonNum  = parseFloat(caso.lugar?.coordenadaLon ?? '')
  const hasMapa = !isNaN(latNum) && !isNaN(lonNum)

  const lbClose = useCallback(() => setLbIndex(null), [])
  const lbPrev  = useCallback(() => setLbIndex(i => (i !== null && i > 0 ? i - 1 : i)), [])
  const lbNext  = useCallback(() => setLbIndex(i => (i !== null && i < fotos.length - 1 ? i + 1 : i)), [fotos.length])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#f8faff' }}>

      {/* ── Encabezado ── */}
      <div style={{
        background: '#1C3F81', color: 'white',
        padding: '20px 48px',
        display: 'flex', alignItems: 'center', gap: '32px', flexShrink: 0,
      }}>
        <div style={{ textAlign: 'center', minWidth: '72px' }}>
          <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Caso</div>
          <div style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>{caso.numeroCaso}</div>
        </div>
        <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{caso.tipoDelitoNombre}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '3px' }}>
            {fmt(caso.fechaHecho)}{caso.horaHecho ? ` · ${caso.horaHecho.slice(0, 5)} hrs` : ''}
            {caso.unidadPolicial ? ` · ${caso.unidadPolicial}` : ''}
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: '6px',
          padding: '8px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center',
        }}>
          {caso.estadoCausaNombre}
        </div>
      </div>

      {/* ── Cuerpo: 3 columnas ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Columna izquierda: relato + incautaciones + víctimas */}
        <div style={{ flex: 1, padding: '20px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid #e5eaf2' }}>

          {/* Lugar */}
          {caso.lugar && (
            <div style={{ fontSize: '12px', color: '#555', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <span style={{ color: '#1C3F81', fontWeight: 700, flexShrink: 0 }}>Lugar:</span>
              <span>
                {caso.lugar.direccion}
                {caso.lugar.sector ? `, sector ${caso.lugar.sector}` : ''}
                {caso.lugar.comuna ? `, ${caso.lugar.comuna}` : ''}
              </span>
            </div>
          )}

          {/* Relato */}
          {caso.relatoBreve && (
            <div>
              <SectionLabel>Relato del hecho</SectionLabel>
              <p style={{ fontSize: '13px', lineHeight: 1.65, color: '#222', margin: 0 }}>
                {caso.relatoBreve}
              </p>
            </div>
          )}

          {/* Notas del analista */}
          {caso.observaciones && (
            <div style={{
              background: '#fffbea',
              border: '1px solid #f0d060',
              borderLeft: '4px solid #d4a800',
              borderRadius: '6px',
              padding: '10px 14px',
            }}>
              <div style={{
                fontSize: '9px', fontWeight: 700, color: '#a07800',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px',
              }}>
                Notas del analista
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#3a2e00', margin: 0 }}>
                {caso.observaciones}
              </p>
            </div>
          )}

          {/* Víctimas */}
          {hasVict && (
            <div>
              <SectionLabel>Víctimas ({caso.victimas.length})</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {caso.victimas.map((v, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#444' }}>
                    {v.nombre ?? 'Anónima'}{v.calidad ? ` · ${v.calidad}` : ''}{v.tipoLesiones ? ` · ${v.tipoLesiones}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incautaciones */}
          {hasInc && (
            <div>
              <SectionLabel>Especies incautadas</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {caso.incautaciones.map((inc, i) => (
                  <div key={i} style={{
                    background: '#1C3F81', color: 'white',
                    borderRadius: '6px', padding: '5px 12px', fontSize: '11px',
                  }}>
                    <span style={{ fontWeight: 600 }}>{inc.tipoEspecie ?? 'Especie'}</span>
                    {' · '}{inc.descripcion}
                    {inc.cantidad ? ` · ${inc.cantidad} ${inc.unidadMedida ?? ''}`.trim() : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas de prensa */}
          {hasNot && (
            <div>
              <SectionLabel>Notas de prensa</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {caso.noticias.map((n, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #1C3F81', paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {n.medio && (
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#1C3F81', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{n.medio}</div>
                    )}
                    {n.titular && (
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#111', lineHeight: 1.35 }}>{n.titular}</div>
                    )}
                    {n.bajada && (
                      <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.4 }}>{n.bajada}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna central: imputados con foto */}
        {hasImp && (
          <div style={{ width: '200px', flexShrink: 0, padding: '20px 16px', overflowY: 'auto', background: '#f4f7fc', borderRight: '1px solid #e5eaf2' }}>
            <SectionLabel>{caso.imputados.length === 1 ? 'Imputado' : `Imputados (${caso.imputados.length})`}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {caso.imputados.map((imp, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  {/* Foto o iniciales */}
                  {imp.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imp.fotoUrl}
                      alt={nombreImp(imp)}
                      style={{
                        width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover',
                        border: imp.alertaReincidencia ? '3px solid #b91c1c' : '3px solid #1C3F81',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: imp.alertaReincidencia ? '#b91c1c' : '#1C3F81',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', fontWeight: 700, color: 'white',
                    }}>
                      {((imp.apellidoPaterno[0] ?? '') + (imp.nombres[0] ?? '')).toUpperCase()}
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#1C3F81', lineHeight: 1.3 }}>
                      {imp.apellidoPaterno}{imp.apellidoMaterno ? ' ' + imp.apellidoMaterno : ''}<br />{imp.nombres}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                      {imp.numCausasPrevias} causa{imp.numCausasPrevias !== 1 ? 's previas' : ' previa'}
                    </div>
                    {imp.alertaReincidencia && (
                      <div style={{ marginTop: '4px', background: '#b91c1c', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', display: 'inline-block' }}>
                        ⚠ REINCIDENTE
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Columna derecha: mapa + fotografías */}
        {(hasFoto || hasMapa) && (
          <div style={{
            width: '180px', flexShrink: 0,
            background: '#0d1a33',
            display: 'flex', flexDirection: 'column',
            padding: '16px 10px', gap: '8px',
            overflowY: 'auto',
          }}>
            {/* Minimap */}
            {hasMapa && (
              <>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '2px' }}>
                  Ubicación
                </div>
                <MapaThumb lat={latNum} lon={lonNum} onClick={() => setMapaOpen(true)} />
              </>
            )}

            {/* Fotos */}
            {hasFoto && (
              <>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '2px', marginTop: hasMapa ? '4px' : 0 }}>
                  Fotos · {fotos.length}
                </div>
                {fotos.map((f, i) => (
                  <FotoThumb key={i} foto={f} onClick={() => setLbIndex(i)} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox fotos */}
      {lbIndex !== null && (
        <Lightbox fotos={fotos} index={lbIndex} onClose={lbClose} onPrev={lbPrev} onNext={lbNext} />
      )}

      {/* Lightbox mapa */}
      {mapaOpen && hasMapa && (
        <MapaLightbox lat={latNum} lon={lonNum} onClose={() => setMapaOpen(false)} />
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 700, color: '#1C3F81',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      borderBottom: '2px solid #1C3F81', paddingBottom: '4px', marginBottom: '8px',
    }}>
      {children}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function SlidesPage() {
  const params = useParams<{ id: string }>()
  const [data,    setData]    = useState<ExportData | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    fetch(`${API}/boletines/${params.id}/export`)
      .then(r => r.ok ? r.json() : r.json().then((j: { error: string; message?: string }) => Promise.reject(j.message ?? j.error)))
      .then(setData)
      .catch((e: unknown) => setError(typeof e === 'string' ? e : 'Error al cargar datos'))
  }, [params.id])

  const total = data ? data.casos.length + 1 : 0 // +1 portada

  const goTo = useCallback((idx: number) => {
    if (!data || transitioning) return
    const clamped = Math.max(0, Math.min(idx, total - 1))
    if (clamped === current) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(clamped)
      setTransitioning(false)
    }, 180)
  }, [data, transitioning, total, current])

  const prev = useCallback(() => goTo(current - 1), [goTo, current])
  const next = useCallback(() => goTo(current + 1), [goTo, current])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ')  { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')                     { e.preventDefault(); prev() }
      if (e.key === 'Escape')                                                 window.close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#b91c1c' }}>
        Error: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#666', fontSize: '15px' }}>
        Cargando presentación…
      </div>
    )
  }

  const isFirst = current === 0
  const isLast  = current === total - 1
  const caso    = !isFirst ? data.casos[current - 1] : null

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      fontFamily: 'Arial, Helvetica, sans-serif',
      background: '#0d1a33',
      display: 'flex', flexDirection: 'column',
      userSelect: 'none',
    }}>

      {/* ── Slide area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}>
          {isFirst
            ? <SlidePortada data={data} />
            : caso && <SlideCaso caso={caso} />
          }
        </div>

      </div>

      {/* ── Barra inferior ── */}
      <div style={{
        background: '#0d1a33', padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0,
      }}>

        {/* Botón prev */}
        <button
          onClick={prev}
          disabled={isFirst}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : 'white',
            borderRadius: '4px', padding: '5px 14px', cursor: isFirst ? 'default' : 'pointer',
            fontSize: '13px', transition: 'all 0.15s',
          }}
        >
          ← Anterior
        </button>

        {/* Dots */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? '20px' : '7px',
                height: '7px',
                borderRadius: '4px',
                background: i === current ? '#c0392b' : 'rgba(255,255,255,0.25)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Contador y botón next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
            {current + 1} / {total}
          </span>
          <button
            onClick={next}
            disabled={isLast}
            style={{
              background: isLast ? 'transparent' : '#c0392b',
              border: isLast ? '1px solid rgba(255,255,255,0.2)' : 'none',
              color: isLast ? 'rgba(255,255,255,0.2)' : 'white',
              borderRadius: '4px', padding: '5px 14px', cursor: isLast ? 'default' : 'pointer',
              fontSize: '13px', fontWeight: isLast ? 400 : 600, transition: 'all 0.15s',
            }}
          >
            Siguiente →
          </button>
        </div>
      </div>

      <style>{`
        body { margin: 0; overflow: hidden; background: #0d1a33; }
        @keyframes lb-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

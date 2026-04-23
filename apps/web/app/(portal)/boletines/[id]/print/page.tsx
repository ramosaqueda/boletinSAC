'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ExportImputado {
  apellidoPaterno: string
  apellidoMaterno: string | null
  nombres: string
  numCausasPrevias: number
  alertaReincidencia: boolean
}

interface ExportIncautacion {
  descripcion: string
  tipoEspecie: string | null
  cantidad: string | null
  unidadMedida: string | null
}

interface ExportVictima {
  nombre: string | null
  calidad: string | null
  tipoLesiones: string | null
}

interface ExportNoticia {
  url: string
  medio: string | null
  titular: string | null
  bajada: string | null
}

interface ExportFotografia {
  archivoUrl:  string
  descripcion: string | null
  tipoFoto:    string | null
  orden:       number
}

interface ExportCaso {
  id: number
  numeroCaso: number
  fechaHecho: string
  horaHecho: string | null
  ruc: string
  folioBitacora: string | null
  tipoDelitoNombre: string
  estadoCausaNombre: string
  relatoBreve: string | null
  diligencias: string | null
  observaciones: string | null
  unidadPolicial: string | null
  plazoInvestDias: number | null
  fiscal: string | null
  lugar: { direccion: string; sector: string | null; comuna: string | null } | null
  imputados: ExportImputado[]
  victimas: ExportVictima[]
  incautaciones: ExportIncautacion[]
  noticias: ExportNoticia[]
  fotografias: ExportFotografia[]
}

interface ExportConclusion {
  id:    number
  orden: number
  tipo:  'info' | 'advertencia' | 'tendencia' | 'recomendacion' | 'alerta'
  texto: string
}

interface ExportData {
  id: number
  numero: number
  fechaDesde: string
  fechaHasta: string
  provincia: string | null
  region: string | null
  analista: string | null
  resumen: string | null
  estadoNombre: string
  casos: ExportCaso[]
  conclusiones: ExportConclusion[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(s: string) {
  const d = new Date(s + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtCorto(s: string) {
  const d = new Date(s + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

function fmtHoy() {
  return new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function nombreImputado(imp: ExportImputado) {
  return `${imp.apellidoPaterno}${imp.apellidoMaterno ? ' ' + imp.apellidoMaterno : ''}, ${imp.nombres}`
}

// ── Componentes de impresión ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '7pt', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: '#1C3F81', borderBottom: '1.5px solid #1C3F81', paddingBottom: '2pt',
      marginTop: '10pt', marginBottom: '5pt',
    }}>
      {children}
    </div>
  )
}

function CasoSection({ caso, index }: { caso: ExportCaso; index: number }) {
  const hasImputados     = caso.imputados.length > 0
  const hasIncautaciones = caso.incautaciones.length > 0
  const hasVictimas      = caso.victimas.length > 0
  const hasNoticias      = caso.noticias.length > 0
  const hasFotos         = (caso.fotografias ?? []).length > 0

  return (
    <div style={{
      marginBottom: '18pt',
      pageBreakInside: 'avoid',
      border: '0.5pt solid #ccd6e8',
      borderRadius: '4pt',
      overflow: 'hidden',
    }}>
      {/* Encabezado del caso */}
      <div style={{
        background: '#1C3F81', color: 'white',
        padding: '5pt 8pt', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <span style={{ fontSize: '7pt', opacity: 0.7, display: 'block', marginBottom: '1pt' }}>
            CASO N°
          </span>
          <span style={{ fontSize: '13pt', fontWeight: 700, lineHeight: 1 }}>
            {caso.numeroCaso}
          </span>
        </div>
        <div style={{ flex: 1, padding: '0 12pt' }}>
          <div style={{ fontSize: '9pt', fontWeight: 600 }}>{caso.tipoDelitoNombre}</div>
          <div style={{ fontSize: '7.5pt', opacity: 0.8, marginTop: '2pt' }}>
            {fmt(caso.fechaHecho)}{caso.horaHecho ? ` · ${caso.horaHecho.slice(0, 5)} hrs` : ''}
            {caso.unidadPolicial ? ` · ${caso.unidadPolicial}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '7pt', background: 'rgba(255,255,255,0.15)', padding: '2pt 6pt',
            borderRadius: '3pt', marginBottom: '3pt',
          }}>
            {caso.estadoCausaNombre}
          </div>
          <div style={{ fontSize: '7pt', opacity: 0.7, fontFamily: 'monospace' }}>RUC {caso.ruc}</div>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '7pt 8pt' }}>

        {/* Lugar */}
        {caso.lugar && (
          <div style={{ fontSize: '7.5pt', color: '#555', marginBottom: '6pt' }}>
            <strong style={{ color: '#1C3F81' }}>Lugar:</strong>{' '}
            {caso.lugar.direccion}
            {caso.lugar.sector ? `, sector ${caso.lugar.sector}` : ''}
            {caso.lugar.comuna ? `, ${caso.lugar.comuna}` : ''}
          </div>
        )}

        {/* Relato */}
        {caso.relatoBreve && (
          <>
            <SectionTitle>Relato del hecho</SectionTitle>
            <p style={{ fontSize: '8pt', lineHeight: 1.55, color: '#222', margin: 0, textAlign: 'justify' }}>
              {caso.relatoBreve}
            </p>
          </>
        )}

        {/* Imputados */}
        {hasImputados && (
          <>
            <SectionTitle>
              {caso.imputados.length === 1 ? 'Imputado' : `Imputados (${caso.imputados.length})`}
            </SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
              <thead>
                <tr style={{ background: '#eef2f9' }}>
                  <th style={{ textAlign: 'left', padding: '2pt 4pt', fontWeight: 600 }}>Nombre</th>
                  <th style={{ textAlign: 'center', padding: '2pt 4pt', fontWeight: 600, width: '70pt' }}>Causas previas</th>
                  <th style={{ textAlign: 'center', padding: '2pt 4pt', fontWeight: 600, width: '50pt' }}>Alerta</th>
                </tr>
              </thead>
              <tbody>
                {caso.imputados.map((imp, i) => (
                  <tr key={i} style={{ borderTop: '0.5pt solid #dde4ef' }}>
                    <td style={{ padding: '2pt 4pt' }}>{nombreImputado(imp)}</td>
                    <td style={{ textAlign: 'center', padding: '2pt 4pt' }}>{imp.numCausasPrevias}</td>
                    <td style={{ textAlign: 'center', padding: '2pt 4pt', color: imp.alertaReincidencia ? '#b91c1c' : '#888' }}>
                      {imp.alertaReincidencia ? '⚠ Reincidencia' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Víctimas */}
        {hasVictimas && (
          <>
            <SectionTitle>Víctimas</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
              <thead>
                <tr style={{ background: '#eef2f9' }}>
                  <th style={{ textAlign: 'left', padding: '2pt 4pt', fontWeight: 600 }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: '2pt 4pt', fontWeight: 600 }}>Calidad</th>
                  <th style={{ textAlign: 'left', padding: '2pt 4pt', fontWeight: 600 }}>Lesiones</th>
                </tr>
              </thead>
              <tbody>
                {caso.victimas.map((v, i) => (
                  <tr key={i} style={{ borderTop: '0.5pt solid #dde4ef' }}>
                    <td style={{ padding: '2pt 4pt' }}>{v.nombre ?? 'Anónima'}</td>
                    <td style={{ padding: '2pt 4pt' }}>{v.calidad ?? '—'}</td>
                    <td style={{ padding: '2pt 4pt' }}>{v.tipoLesiones ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Incautaciones */}
        {hasIncautaciones && (
          <>
            <SectionTitle>Especies incautadas</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
              <thead>
                <tr style={{ background: '#eef2f9' }}>
                  <th style={{ textAlign: 'left', padding: '2pt 4pt', fontWeight: 600 }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '2pt 4pt', fontWeight: 600 }}>Descripción</th>
                  <th style={{ textAlign: 'right', padding: '2pt 4pt', fontWeight: 600, width: '60pt' }}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {caso.incautaciones.map((inc, i) => (
                  <tr key={i} style={{ borderTop: '0.5pt solid #dde4ef' }}>
                    <td style={{ padding: '2pt 4pt' }}>{inc.tipoEspecie ?? '—'}</td>
                    <td style={{ padding: '2pt 4pt' }}>{inc.descripcion}</td>
                    <td style={{ textAlign: 'right', padding: '2pt 4pt' }}>
                      {inc.cantidad ? `${inc.cantidad} ${inc.unidadMedida ?? ''}`.trim() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Fotografías */}
        {hasFotos && (
          <>
            <SectionTitle>Fotografías del caso</SectionTitle>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '5pt',
              marginBottom: '4pt',
            }}>
              {(caso.fotografias ?? []).map((f, i) => (
                <div key={i} style={{ pageBreakInside: 'avoid' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.archivoUrl}
                    alt={f.descripcion ?? `Fotografía ${i + 1}`}
                    style={{
                      width: '100%',
                      height: '90pt',
                      objectFit: 'cover',
                      borderRadius: '2pt',
                      border: '0.5pt solid #ccd6e8',
                      display: 'block',
                    }}
                  />
                  {(f.tipoFoto || f.descripcion) && (
                    <div style={{ fontSize: '6.5pt', color: '#666', marginTop: '2pt', textAlign: 'center' }}>
                      {f.tipoFoto && <strong>{f.tipoFoto}</strong>}
                      {f.tipoFoto && f.descripcion && ' · '}
                      {f.descripcion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Diligencias */}
        {caso.diligencias && (
          <>
            <SectionTitle>Diligencias realizadas</SectionTitle>
            <p style={{ fontSize: '7.5pt', lineHeight: 1.5, color: '#333', margin: 0 }}>
              {caso.diligencias}
            </p>
          </>
        )}

        {/* Notas del analista */}
        {caso.observaciones && (
          <>
            <SectionTitle>Notas del analista</SectionTitle>
            <div style={{
              background: '#fffbea',
              border: '1px solid #e8cc60',
              borderLeft: '3pt solid #d4a800',
              borderRadius: '3pt',
              padding: '5pt 8pt',
            }}>
              <p style={{ fontSize: '7.5pt', lineHeight: 1.55, color: '#3a2e00', margin: 0 }}>
                {caso.observaciones}
              </p>
            </div>
          </>
        )}

        {/* Notas de prensa */}
        {hasNoticias && (
          <>
            <SectionTitle>Prensa vinculada</SectionTitle>
            {caso.noticias.map((n, i) => (
              <div key={i} style={{ fontSize: '7pt', color: '#555', marginBottom: '4pt' }}>
                <div>
                  <span style={{ color: '#1C3F81', fontWeight: 600 }}>{n.medio ?? 'Enlace'}: </span>
                  {n.titular ?? n.url}
                </div>
                {n.bajada && (
                  <div style={{ fontSize: '6.5pt', color: '#777', marginTop: '1pt', fontStyle: 'italic' }}>
                    {n.bajada}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PrintPage() {
  const params    = useParams<{ id: string }>()
  const [data, setData]   = useState<ExportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    fetch(`${API}/boletines/${params.id}/export`)
      .then(r => r.ok ? r.json() : r.json().then((j: { error: string }) => Promise.reject(j.error)))
      .then(setData)
      .catch((e: unknown) => setError(typeof e === 'string' ? e : 'Error al cargar datos'))
  }, [params.id])

  if (error) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#b91c1c' }}>
        Error: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#666' }}>
        Preparando documento…
      </div>
    )
  }

  const totalConImputado = data.casos.filter(c => c.imputados.length > 0).length
  const totalPrision     = data.casos.filter(c => c.estadoCausaNombre.toLowerCase().includes('preventiva')).length

  return (
    <>
      {/* ── Barra de acciones (no se imprime) ─────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#1C3F81', padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }} className="no-print">
        <span style={{ color: 'white', fontSize: '13px', flex: 1 }}>
          Boletín N° {data.numero} · {data.casos.length} casos — listo para imprimir
        </span>
        <button
          onClick={() => window.print()}
          style={{
            background: '#c0392b', color: 'white', border: 'none',
            padding: '8px 20px', borderRadius: '5px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          Imprimir / Guardar PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.3)',
            padding: '8px 14px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px',
          }}
        >
          Cerrar
        </button>
      </div>

      {/* ── Documento ─────────────────────────────────────────────── */}
      <div className="print-content" style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        maxWidth: '720px',
        margin: '0 auto',
        paddingBottom: '30pt',
        color: '#111',
      }}>

        {/* ── Portada / encabezado ── */}
        <div style={{
          borderBottom: '3pt solid #c0392b',
          paddingBottom: '14pt',
          marginBottom: '14pt',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '7pt', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4pt' }}>
                Ministerio Público · Fiscalía de Chile · {data.region ?? 'Región de Coquimbo'}
              </div>
              <div style={{ fontSize: '7pt', color: '#c0392b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6pt' }}>
                Reporte de Criminalidad N° {data.numero} · Delitos de interés SAC
              </div>
              <div style={{ fontSize: '18pt', fontWeight: 700, color: '#1C3F81', lineHeight: 1.15 }}>
                {data.provincia ?? 'Fiscalía Regional de Coquimbo'}
              </div>
              <div style={{ fontSize: '11pt', color: '#333', marginTop: '3pt' }}>
                Semana del {fmtCorto(data.fechaDesde)} al {fmtCorto(data.fechaHasta)} de {new Date(data.fechaDesde + 'T12:00:00').getFullYear()}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '7.5pt', color: '#666' }}>
              {data.analista && <div><strong>Analista:</strong> {data.analista}</div>}
              <div><strong>Elaborado:</strong> {fmtHoy()}</div>
              <div style={{ marginTop: '4pt', fontSize: '7pt', color: '#999' }}>CONFIDENCIAL — USO INTERNO</div>
            </div>
          </div>

          {/* Resumen ejecutivo */}
          {data.resumen && (
            <div style={{
              marginTop: '10pt', padding: '7pt 10pt',
              background: '#f0f4fb', borderLeft: '3pt solid #1C3F81',
              fontSize: '8pt', lineHeight: 1.55, color: '#333',
            }}>
              {data.resumen}
            </div>
          )}
        </div>

        {/* ── Estadísticas ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8pt',
          marginBottom: '18pt',
        }}>
          {[
            { num: data.casos.length,   lbl: 'Casos semana' },
            { num: totalConImputado,    lbl: 'Con imputado' },
            { num: totalPrision,        lbl: 'Prisión preventiva', rojo: true },
            { num: data.casos.filter(c => c.incautaciones.length > 0).length, lbl: 'Con incautaciones' },
          ].map((s, i) => (
            <div key={i} style={{
              border: '0.5pt solid #ccd6e8', borderRadius: '4pt', padding: '7pt',
              textAlign: 'center', background: s.rojo ? '#fff5f5' : '#f8faff',
            }}>
              <div style={{ fontSize: '20pt', fontWeight: 700, color: s.rojo ? '#b91c1c' : '#1C3F81', lineHeight: 1 }}>
                {s.num}
              </div>
              <div style={{ fontSize: '7pt', color: '#666', marginTop: '3pt' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Índice de casos ── */}
        <div style={{ marginBottom: '18pt', pageBreakInside: 'avoid' }}>
          <SectionTitle>Índice de casos</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
            <thead>
              <tr style={{ background: '#1C3F81', color: 'white' }}>
                <th style={{ padding: '3pt 5pt', textAlign: 'center', width: '25pt' }}>N°</th>
                <th style={{ padding: '3pt 5pt', textAlign: 'left' }}>Tipo de delito</th>
                <th style={{ padding: '3pt 5pt', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '3pt 5pt', textAlign: 'left' }}>Estado de causa</th>
                <th style={{ padding: '3pt 5pt', textAlign: 'left' }}>RUC</th>
                <th style={{ padding: '3pt 5pt', textAlign: 'center', width: '20pt' }}>Imp.</th>
              </tr>
            </thead>
            <tbody>
              {data.casos.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '0.5pt solid #dde4ef', background: i % 2 === 0 ? 'white' : '#f8faff' }}>
                  <td style={{ padding: '2.5pt 5pt', textAlign: 'center', fontWeight: 600, color: '#1C3F81' }}>{c.numeroCaso}</td>
                  <td style={{ padding: '2.5pt 5pt' }}>{c.tipoDelitoNombre}</td>
                  <td style={{ padding: '2.5pt 5pt' }}>{fmtCorto(c.fechaHecho)}</td>
                  <td style={{ padding: '2.5pt 5pt' }}>{c.estadoCausaNombre}</td>
                  <td style={{ padding: '2.5pt 5pt', fontFamily: 'monospace', fontSize: '7pt' }}>{c.ruc}</td>
                  <td style={{ padding: '2.5pt 5pt', textAlign: 'center' }}>{c.imputados.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Fichas de casos ── */}
        <SectionTitle>Detalle de casos</SectionTitle>
        {data.casos.map((c, i) => (
          <CasoSection key={c.id} caso={c} index={i} />
        ))}

        {/* ── Conclusiones del analista ── */}
        {(data.conclusiones ?? []).length > 0 && (() => {
          const PRINT_ESTILOS: Record<string, { color: string; bg: string; border: string; label: string }> = {
            info:          { color: '#1C3F81', bg: '#f0f4fb', border: '#1C3F81', label: 'Información' },
            tendencia:     { color: '#0369a1', bg: '#f0f9ff', border: '#0ea5e9', label: 'Tendencia' },
            recomendacion: { color: '#166534', bg: '#f0fdf4', border: '#22c55e', label: 'Recomendación' },
            advertencia:   { color: '#92400e', bg: '#fffbeb', border: '#f59e0b', label: 'Advertencia' },
            alerta:        { color: '#991b1b', bg: '#fff1f2', border: '#ef4444', label: 'Alerta' },
          }
          return (
            <div style={{ marginTop: '20pt', pageBreakBefore: 'auto' }}>
              <SectionTitle>Conclusiones del analista</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
                {(data.conclusiones ?? []).map((c) => {
                  const est = PRINT_ESTILOS[c.tipo] ?? PRINT_ESTILOS.info!
                  return (
                    <div key={c.id} style={{
                      background: est.bg,
                      borderLeft: `3pt solid ${est.border}`,
                      borderRadius: '3pt',
                      padding: '6pt 10pt',
                      pageBreakInside: 'avoid',
                    }}>
                      <div style={{ fontSize: '6.5pt', fontWeight: 700, color: est.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3pt' }}>
                        {est.label}
                      </div>
                      <p style={{ fontSize: '8pt', lineHeight: 1.55, color: '#222', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {c.texto}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── Pie de página ── */}
        <div style={{
          marginTop: '20pt', paddingTop: '8pt', borderTop: '0.5pt solid #ccd6e8',
          fontSize: '7pt', color: '#999', textAlign: 'center',
        }}>
          Fiscalía de Chile · {data.region ?? 'Región de Coquimbo'} · Sistema SAC ·
          Documento generado el {fmtHoy()} · CONFIDENCIAL — USO INTERNO
        </div>
      </div>

    </>
  )
}

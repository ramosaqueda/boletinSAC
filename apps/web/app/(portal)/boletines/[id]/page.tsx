'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBoletin, usePublicarBoletin, useDespublicarBoletin, useEliminarBoletin, useActualizarBoletin } from '@/lib/hooks'
import type { BoletinDetalle } from '@/lib/hooks'
import { useIsAnalista } from '@/lib/store'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { CasoCard } from '@/components/boletin/CasoCard'

const ESTADO_BADGE: Record<string, string> = {
  borrador:    'bg-azul-claro text-azul border border-azul-medio',
  en_revision: 'bg-naranja-bg text-naranja border border-naranja-borde',
  publicado:   'bg-verde-bg text-verde border border-verde-borde',
}

function formatRango(desde: string, hasta: string) {
  const d1 = new Date(desde + 'T12:00:00')
  const d2 = new Date(hasta  + 'T12:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
  return `${fmt(d1)} al ${fmt(d2)} de ${d1.getFullYear()}`
}

// ── Modal editar boletín ──────────────────────────────────────────────────────

function EditarBoletinModal({
  data, isPending, onClose, onSave,
}: {
  data: BoletinDetalle
  isPending: boolean
  onClose: () => void
  onSave: (valores: {
    numero?: number; fechaDesde?: string; fechaHasta?: string
    provincia?: string; region?: string; resumen?: string
  }) => void
}) {
  const [form, setForm] = useState({
    numero:     String(data.numero),
    fechaDesde: data.fechaDesde,
    fechaHasta: data.fechaHasta,
    provincia:  data.provincia,
    region:     data.region,
    resumen:    data.resumen ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const num = parseInt(form.numero)
    if (!form.numero || isNaN(num) || num <= 0) { setError('N° de boletín inválido'); return }
    if (!form.fechaDesde) { setError('La fecha desde es obligatoria'); return }
    if (!form.fechaHasta) { setError('La fecha hasta es obligatoria'); return }

    onSave({
      numero:     num,
      fechaDesde: form.fechaDesde,
      fechaHasta: form.fechaHasta,
      provincia:  form.provincia.trim() || 'Fiscalía Regional de Coquimbo',
      region:     form.region.trim()    || 'Región de Coquimbo',
      resumen:    form.resumen.trim()   || undefined,
    })
  }

  const inp = 'w-full border border-gris-borde rounded px-3 py-1.5 text-sm text-azul focus:outline-none focus:border-azul-medio transition-colors bg-white'
  const lbl = 'block text-[11px] font-semibold text-texto-suave uppercase tracking-wide mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        <div className="px-6 py-5 border-b border-gris-borde flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-serif text-base font-semibold text-azul">Editar boletín</h2>
            <p className="text-xs text-texto-tenue mt-0.5">Los cambios se reflejarán en slides y PDF</p>
          </div>
          <button onClick={onClose} className="text-texto-tenue hover:text-azul text-xl leading-none px-1">×</button>
        </div>

        <form id="editar-boletin-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>N° boletín *</label>
              <input type="number" min={1} className={inp} value={form.numero} onChange={set('numero')} />
            </div>
            <div>
              <label className={lbl}>Fecha desde *</label>
              <input type="date" className={inp} value={form.fechaDesde} onChange={set('fechaDesde')} />
            </div>
            <div>
              <label className={lbl}>Fecha hasta *</label>
              <input type="date" className={inp} value={form.fechaHasta} onChange={set('fechaHasta')} />
            </div>
          </div>

          <div>
            <label className={lbl}>Provincia / Fiscalía</label>
            <input type="text" className={inp} value={form.provincia} onChange={set('provincia')}
              placeholder="Fiscalía Regional de Coquimbo" />
            <p className="text-[10px] text-texto-tenue mt-0.5">Si se deja vacío: "Fiscalía Regional de Coquimbo"</p>
          </div>

          <div>
            <label className={lbl}>Región</label>
            <input type="text" className={inp} value={form.region} onChange={set('region')}
              placeholder="Región de Coquimbo" />
            <p className="text-[10px] text-texto-tenue mt-0.5">Si se deja vacío: "Región de Coquimbo"</p>
          </div>

          <div>
            <label className={lbl}>Resumen ejecutivo</label>
            <textarea rows={4} className={`${inp} resize-none`} value={form.resumen} onChange={set('resumen')}
              placeholder="Síntesis del período, tendencias destacadas…" />
          </div>

          {error && <p className="text-sm text-rojo bg-[#fff0f0] border border-rojo-borde rounded px-3 py-2">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t border-gris-borde flex justify-end gap-2 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-1.5 text-sm border border-gris-borde text-texto-suave rounded hover:border-azul-medio transition-colors">
            Cancelar
          </button>
          <button type="submit" form="editar-boletin-form" disabled={isPending}
            className="px-5 py-1.5 text-sm bg-azul hover:bg-azul-hover text-white rounded transition-colors disabled:opacity-60">
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default function BoletinPage({ params }: { params: { id: string } }) {
  const boletinId = parseInt(params.id)
  const router = useRouter()
  const { data, isLoading, error } = useBoletin(boletinId)
  const [filtro, setFiltro] = useState('todos')
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [editando, setEditando] = useState(false)
  const esAnalista = useIsAnalista()
  const { mutate: publicar, isPending: publicando } = usePublicarBoletin(boletinId)
  const { mutate: despublicar, isPending: despublicando } = useDespublicarBoletin(boletinId)
  const { mutate: eliminar, isPending: eliminando } = useEliminarBoletin()
  const { mutate: actualizar, isPending: actualizando } = useActualizarBoletin(boletinId)

  const casos = data?.casos ?? []
  const casosFiltrados = filtro === 'todos'
    ? casos
    : casos.filter((c) => c.tipoDelito === filtro)

  // Alertas de reincidencia (se extraen de los casos visibles — en producción vendría de la API)
  const tieneAlertas = false // placeholder hasta integrar v_alertas_reincidencia

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gris-bg">
        <Topbar/>
        <div className="flex-1 flex items-center justify-center text-texto-tenue text-sm animate-pulse">
          Cargando boletín…
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-gris-bg">
        <Topbar/>
        <div className="p-8 text-rojo text-sm">
          {error?.message ?? 'Boletín no encontrado'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gris-bg">
      <Topbar/>

      {/* Modal editar boletín */}
      {editando && (
        <EditarBoletinModal
          data={data}
          isPending={actualizando}
          onClose={() => setEditando(false)}
          onSave={(valores) => actualizar(valores, { onSuccess: () => setEditando(false) })}
        />
      )}

      {/* Modal confirmar eliminación */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-5 border-b border-gris-borde">
              <h2 className="font-serif text-base font-semibold text-rojo">Eliminar boletín N° {data.numero}</h2>
              <p className="text-xs text-texto-tenue mt-1">Esta acción no se puede deshacer</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-texto-suave">
                Se eliminarán permanentemente el boletín y <strong>todos sus casos</strong>, incluyendo imputados, víctimas, incautaciones y fotografías.
              </p>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmarEliminar(false)}
                disabled={eliminando}
                className="px-4 py-1.5 text-sm text-texto-suave border border-gris-borde rounded hover:border-azul-medio transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminar(boletinId, { onSuccess: () => router.push('/boletines') })}
                disabled={eliminando}
                className="px-5 py-1.5 text-sm bg-rojo hover:bg-rojo-hover text-white rounded transition-colors disabled:opacity-60"
              >
                {eliminando ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>

        {/* Sidebar */}
        <Sidebar
          boletinNumero={data.numero}
          boletinFechaDesde={data.fechaDesde}
          casos={casos}
          filtroActivo={filtro}
          onFiltro={setFiltro}
          boletinId={boletinId}
          estado={data.estado}
          onPublicar={() => publicar()}
          onDespublicar={() => despublicar()}
          publicando={publicando}
          despublicando={despublicando}
        />

        {/* Contenido principal */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Cabecera del boletín */}
          <div className="bg-white border-b border-gris-borde px-7 pt-5 pb-4 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] text-rojo font-semibold uppercase tracking-wider mb-1">
                  Reporte de Criminalidad N° {data.numero} · Delitos de interés SAC
                </div>
                <h1 className="font-serif text-xl font-semibold text-azul leading-tight">
                  {data.provincia} — Semana del {formatRango(data.fechaDesde, data.fechaHasta)}
                </h1>
                <p className="text-xs text-texto-suave mt-0.5">
                  Fiscalía {data.region} · SAC
                  {data.fechaPub && (
                    <span className="ml-2 text-verde">
                      · Publicado el {new Date(data.fechaPub).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Badge de estado */}
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[data.estado] ?? ESTADO_BADGE.borrador}`}>
                  {data.estadoNombre}
                </span>

                <button
                  onClick={() => window.open(`/boletines/${boletinId}/slides`, '_blank')}
                  className="px-3.5 py-1.5 border border-azul-medio rounded text-xs text-azul bg-white hover:bg-azul-suave transition-colors"
                >
                  Ver slides
                </button>
                <button
                  onClick={() => window.open(`/boletines/${boletinId}/print`, '_blank')}
                  className="px-3.5 py-1.5 border border-rojo rounded text-xs text-rojo bg-white hover:bg-rojo hover:text-white transition-colors"
                >
                  Exportar .pdf
                </button>
                {esAnalista && (
                  <>
                    <button
                      onClick={() => setEditando(true)}
                      className="px-3.5 py-1.5 border border-gris-borde rounded text-xs text-texto-suave bg-white hover:border-azul-medio hover:text-azul transition-colors"
                    >
                      Editar
                    </button>
                    <Link
                      href={`/boletines/${boletinId}/ingreso`}
                      className="px-3.5 py-1.5 bg-azul hover:bg-azul-hover text-white text-xs rounded transition-colors"
                    >
                      + Ingresar caso
                    </Link>
                    <button
                      onClick={() => setConfirmarEliminar(true)}
                      className="p-1.5 border border-gris-borde rounded text-texto-tenue hover:border-rojo hover:text-rojo transition-colors"
                      title="Eliminar boletín"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 5h14M8 5V3h4v2M6 5l1 12h6l1-12"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex bg-azul border-b border-gris-borde flex-shrink-0">
            {[
              { num: casos.length,                                                    lbl: 'Casos\nsemana' },
              { num: casos.filter(c => ['trafico_drogas','microtrafico'].includes(c.tipoDelito)).length, lbl: 'Tráfico /\nmicrotráfico' },
              { num: casos.filter(c => c.estadoCausa === 'prision_preventiva').length, lbl: 'Prisión\npreventiva',  rojo: true },
              { num: casos.filter(c => c.estadoCausa !== 'imputado_no_identificado').length, lbl: 'Con\nimputado' },
            ].map((s, i) => (
              <div key={i} className="flex-1 py-3 px-4 text-center border-r border-white/10 last:border-r-0">
                <div className={`text-xl font-semibold leading-none mb-1 ${s.rojo ? 'text-[#ff8080]' : 'text-white'}`}>
                  {s.num}
                </div>
                <div className="text-[10px] text-white/55 whitespace-pre-line leading-tight">{s.lbl}</div>
              </div>
            ))}
            {data.resumen && (
              <div className="flex-[2.5] px-5 py-3 flex items-center text-xs text-white/75 leading-relaxed border-l border-white/10">
                {data.resumen}
              </div>
            )}
          </div>

          {/* Alerta reincidencia */}
          {tieneAlertas && (
            <div className="bg-[#fff8e6] border-b border-naranja-borde px-7 py-2.5 text-xs text-naranja flex items-center gap-2.5 flex-shrink-0">
              <div className="w-4.5 h-4.5 rounded-full bg-rojo text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">!</div>
              <div><strong>Alerta reincidencia:</strong> Hay imputados con alta reincidencia en este boletín. Revisar vinculación con SAC activos.</div>
            </div>
          )}

          {/* Filtros */}
          <div className="px-7 py-2.5 bg-white border-b border-gris-borde flex gap-1.5 flex-wrap items-center flex-shrink-0">
            <span className="text-[11px] text-texto-tenue mr-1">Filtrar:</span>
            {[
              { key: 'todos', label: `Todos (${casos.length})` },
              ...([...new Set(casos.map(c => c.tipoDelito))].map(t => ({
                key: t,
                label: `${casos.find(c => c.tipoDelito === t)!.tipoDelitoNombre} (${casos.filter(c => c.tipoDelito === t).length})`,
              }))),
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`text-[11px] px-3 py-1 rounded-full border transition-all
                  ${filtro === f.key
                    ? 'bg-azul border-azul text-white'
                    : 'bg-white border-gris-borde text-texto-suave hover:border-azul-medio hover:text-azul'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de casos */}
          <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-2.5">
            {casosFiltrados.map((caso) => (
              <CasoCard key={caso.id} caso={caso}/>
            ))}
            {casosFiltrados.length === 0 && (
              <div className="text-center py-12 text-texto-tenue text-sm">
                No hay casos para el filtro seleccionado.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

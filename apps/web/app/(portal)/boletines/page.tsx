'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBoletines, useCrearBoletin, useActualizarEstadoBoletin } from '@/lib/hooks'
import { Topbar } from '@/components/layout/Topbar'

const ESTADO_BADGE: Record<string, string> = {
  borrador:    'bg-azul-claro text-azul border border-azul-medio',
  en_revision: 'bg-naranja-bg text-naranja border border-naranja-borde',
  publicado:   'bg-verde-bg text-verde border border-verde-borde',
}

function formatRango(desde: string, hasta: string) {
  const d1 = new Date(desde + 'T12:00:00')
  const d2 = new Date(hasta  + 'T12:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  return `${fmt(d1)} — ${fmt(d2)} de ${d1.getFullYear()}`
}

// ── Modal nuevo boletín ───────────────────────────────────────────────────────

function NuevoBoletinModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { mutate, isPending, error } = useCrearBoletin()
  const [form, setForm] = useState({ numero: '', fechaDesde: '', fechaHasta: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(
      { numero: parseInt(form.numero), fechaDesde: form.fechaDesde, fechaHasta: form.fechaHasta },
      { onSuccess: (nuevo) => { onClose(); router.push(`/boletines/${nuevo.id}`) } },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-5 border-b border-gris-borde">
          <h2 className="font-serif text-base font-semibold text-azul">Nuevo boletín</h2>
          <p className="text-xs text-texto-tenue mt-0.5">Se creará en estado Borrador</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-texto-suave uppercase tracking-wide mb-1">N° de boletín *</label>
            <input
              type="number" min={1} required value={form.numero}
              onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
              placeholder="Ej: 10"
              className="w-full border border-gris-borde rounded px-3 py-1.5 text-sm text-azul focus:outline-none focus:border-azul-medio"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-texto-suave uppercase tracking-wide mb-1">Fecha desde *</label>
              <input
                type="date" required value={form.fechaDesde}
                onChange={e => setForm(f => ({ ...f, fechaDesde: e.target.value }))}
                className="w-full border border-gris-borde rounded px-3 py-1.5 text-sm text-azul focus:outline-none focus:border-azul-medio"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-texto-suave uppercase tracking-wide mb-1">Fecha hasta *</label>
              <input
                type="date" required value={form.fechaHasta}
                onChange={e => setForm(f => ({ ...f, fechaHasta: e.target.value }))}
                className="w-full border border-gris-borde rounded px-3 py-1.5 text-sm text-azul focus:outline-none focus:border-azul-medio"
              />
            </div>
          </div>
          {error && <p className="text-xs text-rojo">{error.message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm text-texto-suave border border-gris-borde rounded hover:border-azul-medio transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="px-5 py-1.5 text-sm bg-rojo hover:bg-rojo-hover text-white rounded transition-colors disabled:opacity-60">
              {isPending ? 'Creando…' : 'Crear boletín'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BoletinesPage() {
  const { data: boletines, isLoading, error } = useBoletines()
  const [modalAbierto, setModalAbierto] = useState(false)
  const { mutate: cambiarEstado, isPending: cambiando } = useActualizarEstadoBoletin()

  return (
    <div className="min-h-screen flex flex-col bg-gris-bg">
      <Topbar/>

      {modalAbierto && <NuevoBoletinModal onClose={() => setModalAbierto(false)} />}

      <main className="flex-1 p-7 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-xl font-semibold text-azul">Boletines de criminalidad</h1>
            <p className="text-xs text-texto-tenue mt-1">Provincia del Elqui · Región de Coquimbo</p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2 bg-rojo hover:bg-rojo-hover text-white text-xs font-medium rounded transition-colors"
          >
            + Nuevo boletín
          </button>
        </div>

        {isLoading && (
          <div className="text-sm text-texto-tenue text-center py-12">Cargando boletines…</div>
        )}

        {error && (
          <div className="text-sm text-rojo bg-[#fff0f0] border border-rojo-borde rounded px-4 py-3">
            Error al cargar: {error.message}
          </div>
        )}

        {boletines && (
          <div className="flex flex-col gap-3">
            {boletines.map((b) => (
              <div key={b.id} className="bg-white border border-gris-borde rounded-lg hover:border-azul-medio hover:shadow-sm transition-all">
                <Link href={`/boletines/${b.id}`}>
                  <div className="px-5 py-4 cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] text-rojo font-semibold uppercase tracking-wider mb-1">
                          Reporte N° {b.numero}
                        </div>
                        <div className="font-serif text-base font-semibold text-azul">
                          {formatRango(b.fechaDesde, b.fechaHasta)}
                        </div>
                        {b.resumen && (
                          <p className="text-xs text-texto-suave mt-1.5 leading-relaxed line-clamp-2">
                            {b.resumen}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[b.estado] ?? ESTADO_BADGE.borrador}`}>
                          {b.estadoNombre}
                        </span>
                        {b.analista && (
                          <span className="text-[10px] text-texto-tenue">{b.analista}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Barra de acciones */}
                <div className="border-t border-gris-borde px-5 py-2 flex items-center gap-2">
                  {b.estado !== 'publicado' ? (
                    <button
                      onClick={() => cambiarEstado({ id: b.id, accion: 'publicar' })}
                      disabled={cambiando}
                      className="flex items-center gap-1.5 px-3 py-1 bg-verde hover:opacity-90 text-white text-[11px] font-semibold rounded transition-opacity disabled:opacity-50"
                    >
                      <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10 14V3M5 8l5-5 5 5"/><path d="M3 17h14"/></svg>
                      Publicar
                    </button>
                  ) : (
                    <button
                      onClick={() => cambiarEstado({ id: b.id, accion: 'despublicar' })}
                      disabled={cambiando}
                      className="flex items-center gap-1.5 px-3 py-1 border border-naranja-borde bg-naranja-bg text-naranja text-[11px] font-semibold rounded hover:bg-naranja hover:text-white transition-colors disabled:opacity-50"
                    >
                      <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10 6v11M5 12l5 5 5-5"/><path d="M3 3h14"/></svg>
                      Despublicar
                    </button>
                  )}
                  <Link
                    href={`/boletines/${b.id}`}
                    className="ml-auto text-[11px] text-texto-tenue hover:text-azul transition-colors"
                  >
                    Abrir →
                  </Link>
                </div>
              </div>
            ))}
            {boletines.length === 0 && (
              <div className="text-center py-16 text-texto-tenue text-sm">
                No hay boletines registrados aún.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

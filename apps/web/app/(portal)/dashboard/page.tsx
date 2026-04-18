'use client'
import Link from 'next/link'
import { useDashboard } from '@/lib/hooks'
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
  return `${fmt(d1)} — ${fmt(d2)}`
}

function KpiCard({ value, label, sub, rojo }: { value: number | string; label: string; sub?: string; rojo?: boolean }) {
  return (
    <div className="bg-white border border-gris-borde rounded-lg px-5 py-4">
      <div className={`text-3xl font-semibold leading-none mb-1 ${rojo ? 'text-rojo' : 'text-azul'}`}>
        {value}
      </div>
      <div className="text-xs font-semibold text-texto-suave">{label}</div>
      {sub && <div className="text-[11px] text-texto-tenue mt-0.5">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

  return (
    <div className="min-h-screen flex flex-col bg-gris-bg">
      <Topbar />

      <main className="flex-1 p-7 max-w-5xl mx-auto w-full">

        {/* Cabecera */}
        <div className="mb-6">
          <h1 className="font-serif text-xl font-semibold text-azul">Dashboard SAC</h1>
          <p className="text-xs text-texto-tenue mt-1">Fiscalía Regional de Coquimbo</p>
        </div>

        {isLoading && (
          <div className="text-sm text-texto-tenue text-center py-12 animate-pulse">Cargando estadísticas…</div>
        )}

        {error && (
          <div className="text-sm text-rojo bg-[#fff0f0] border border-rojo-borde rounded px-4 py-3">
            Error: {error.message}
          </div>
        )}

        {data && (<>

          {/* KPIs principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard value={data.totalBoletines}         label="Boletines totales"        sub="desde el inicio" />
            <KpiCard value={data.totalCasos}             label="Casos registrados"         sub="en todos los boletines" />
            <KpiCard value={data.casosConImputado}       label="Con imputado"              sub="identificados" />
            <KpiCard value={data.casosPrisionPreventiva} label="Prisión preventiva"        rojo />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Casos por tipo de delito */}
            <div className="bg-white border border-gris-borde rounded-lg px-5 py-4">
              <h2 className="text-[11px] font-bold text-azul uppercase tracking-wider mb-4">Casos por tipo de delito</h2>
              {data.casosPorDelito.length === 0 && (
                <p className="text-xs text-texto-tenue py-4 text-center">Sin datos</p>
              )}
              <div className="flex flex-col gap-2">
                {data.casosPorDelito.map((d) => {
                  const max = data.casosPorDelito[0]?.total ?? 1
                  const pct = Math.round((d.total / max) * 100)
                  return (
                    <div key={d.codigo}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-texto-suave truncate pr-2">{d.nombre}</span>
                        <span className="text-xs font-semibold text-azul flex-shrink-0">{d.total}</span>
                      </div>
                      <div className="h-1.5 bg-gris-borde rounded-full overflow-hidden">
                        <div className="h-full bg-azul rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Casos por estado de causa */}
            <div className="bg-white border border-gris-borde rounded-lg px-5 py-4">
              <h2 className="text-[11px] font-bold text-azul uppercase tracking-wider mb-4">Casos por estado de causa</h2>
              {data.casosPorEstado.length === 0 && (
                <p className="text-xs text-texto-tenue py-4 text-center">Sin datos</p>
              )}
              <div className="flex flex-col gap-2">
                {data.casosPorEstado.map((e) => {
                  const total = data.casosPorEstado.reduce((s, x) => s + x.total, 0) || 1
                  const pct = Math.round((e.total / total) * 100)
                  const isRojo = e.codigo === 'prision_preventiva'
                  return (
                    <div key={e.codigo}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-texto-suave truncate pr-2">{e.nombre}</span>
                        <span className={`text-xs font-semibold ${isRojo ? 'text-rojo' : 'text-azul'}`}>{e.total}</span>
                      </div>
                      <div className="h-1.5 bg-gris-borde rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isRojo ? 'bg-rojo' : 'bg-azul-medio'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Últimos boletines */}
            <div className="bg-white border border-gris-borde rounded-lg px-5 py-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-bold text-azul uppercase tracking-wider">Últimos boletines</h2>
                <Link href="/boletines" className="text-[11px] text-azul hover:underline">Ver todos →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {data.ultimosBoletines.map((b) => (
                  <Link key={b.id} href={`/boletines/${b.id}`}>
                    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-gris-borde hover:border-azul-medio hover:bg-azul-suave transition-all">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-bold text-rojo uppercase tracking-wider w-12 flex-shrink-0">
                          N° {b.numero}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-azul">{formatRango(b.fechaDesde, b.fechaHasta)}</div>
                          <div className="text-[11px] text-texto-tenue">{b.totalCasos} caso{b.totalCasos !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[b.estado] ?? ESTADO_BADGE.borrador}`}>
                        {b.estadoNombre}
                      </span>
                    </div>
                  </Link>
                ))}
                {data.ultimosBoletines.length === 0 && (
                  <p className="text-xs text-texto-tenue text-center py-6">No hay boletines aún.</p>
                )}
              </div>
            </div>

          </div>
        </>)}
      </main>
    </div>
  )
}

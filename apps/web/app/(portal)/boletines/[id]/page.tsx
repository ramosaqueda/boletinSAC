'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useBoletin, usePublicarBoletin, useDespublicarBoletin } from '@/lib/hooks'
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

export default function BoletinPage({ params }: { params: { id: string } }) {
  const boletinId = parseInt(params.id)
  const { data, isLoading, error } = useBoletin(boletinId)
  const [filtro, setFiltro] = useState('todos')
  const esAnalista = useIsAnalista()
  const { mutate: publicar, isPending: publicando } = usePublicarBoletin(boletinId)
  const { mutate: despublicar, isPending: despublicando } = useDespublicarBoletin(boletinId)

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
                  <Link
                    href={`/boletines/${boletinId}/ingreso`}
                    className="px-3.5 py-1.5 bg-azul hover:bg-azul-hover text-white text-xs rounded transition-colors"
                  >
                    + Ingresar caso
                  </Link>
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

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import type { CasoResumen } from '@/lib/hooks'

const DELITO_COLORS: Record<string, string> = {
  trafico_drogas:         '#1C3F81',
  microtrafico:           '#1a6640',
  porte_armas:            '#7a3010',
  robo_violencia:         '#B80D0E',
  robo_intimidacion:      '#B80D0E',
  robo_lugar_habitado:    '#9a0b0c',
  robo_lugar_no_habitado: '#9a0b0c',
  violacion_morada:       '#7a4a00',
  hurto_simple:           '#4a5a78',
  lesiones:               '#7a3010',
  vif:                    '#7a3010',
  homicidio:              '#B80D0E',
  otro:                   '#8a9ab8',
}

interface SidebarProps {
  boletinNumero?: number
  boletinFechaDesde?: string
  boletinFechaHasta?: string
  casos?: CasoResumen[]
  filtroActivo?: string
  onFiltro?: (f: string) => void
  boletinId?: number
  estado?: string
  onPublicar?: (() => void) | undefined
  onDespublicar?: (() => void) | undefined
  publicando?: boolean
  despublicando?: boolean
}

function formatMes(fecha: string) {
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
}

export function Sidebar({
  boletinNumero,
  boletinFechaDesde,
  casos = [],
  filtroActivo = 'todos',
  onFiltro,
  boletinId,
  estado,
  onPublicar,
  onDespublicar,
  publicando = false,
  despublicando = false,
}: SidebarProps) {
  const { usuario } = useAuthStore()
  const [confirmaDespublicar, setConfirmaDespublicar] = useState(false)

  // Conteo por tipo de delito
  const conteos: Record<string, number> = { todos: casos.length }
  for (const c of casos) {
    conteos[c.tipoDelito] = (conteos[c.tipoDelito] ?? 0) + 1
  }

  // Tipos únicos presentes
  const tiposPresentes = [...new Set(casos.map((c) => c.tipoDelito))]

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col bg-white border-r border-gris-borde">

      {boletinNumero && boletinFechaDesde && (
        <>
          <div className="px-4 pt-5 pb-2 text-[9px] font-semibold uppercase tracking-widest text-texto-tenue border-b border-gris-borde">
            Boletín N° {boletinNumero} — {formatMes(boletinFechaDesde)}
          </div>

          {/* Filtros por delito */}
          <div
            onClick={() => onFiltro?.('todos')}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] cursor-pointer border-l-[3px] transition-all
              ${filtroActivo === 'todos'
                ? 'border-azul bg-azul-suave text-azul font-medium'
                : 'border-transparent text-texto-suave hover:bg-azul-suave hover:text-azul hover:border-azul-medio'}`}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#1C3F81' }}/>
            Todos los casos
            <span className="ml-auto text-[10px] bg-azul-claro text-azul px-1.5 py-0.5 rounded-full font-medium">
              {conteos.todos}
            </span>
          </div>

          {tiposPresentes.map((tipo) => {
            const c = casos.find((x) => x.tipoDelito === tipo)!
            return (
              <div
                key={tipo}
                onClick={() => onFiltro?.(tipo)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] cursor-pointer border-l-[3px] transition-all
                  ${filtroActivo === tipo
                    ? 'border-azul bg-azul-suave text-azul font-medium'
                    : 'border-transparent text-texto-suave hover:bg-azul-suave hover:text-azul hover:border-azul-medio'}`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: DELITO_COLORS[tipo] ?? '#8a9ab8' }}
                />
                <span className="truncate">{c.tipoDelitoNombre}</span>
                <span className="ml-auto text-[10px] bg-azul-claro text-azul px-1.5 py-0.5 rounded-full font-medium">
                  {conteos[tipo]}
                </span>
              </div>
            )
          })}
        </>
      )}

      {/* Acciones */}
      <div className="px-4 pt-4 pb-2 text-[9px] font-semibold uppercase tracking-widest text-texto-tenue border-b border-gris-borde mt-2">
        Acciones
      </div>
      {boletinId && (
        <Link
          href={`/boletines/${boletinId}/ingreso`}
          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-texto-suave cursor-pointer border-l-[3px] border-transparent hover:bg-azul-suave hover:text-azul hover:border-azul-medio transition-all"
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gris-borde"/>
          Ingresar caso
        </Link>
      )}
      <div className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-texto-suave cursor-pointer border-l-[3px] border-transparent hover:bg-azul-suave hover:text-azul hover:border-azul-medio transition-all">
        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gris-borde"/>
        Exportar .pptx
      </div>
      <div className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-texto-suave cursor-pointer border-l-[3px] border-transparent hover:bg-azul-suave hover:text-azul hover:border-azul-medio transition-all">
        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gris-borde"/>
        Exportar .pdf
      </div>

      {/* Publicar / Despublicar */}
      {(onPublicar || onDespublicar) && estado && (
        <div className="px-3 py-3 border-t border-gris-borde mt-1">
          {estado !== 'publicado' ? (
            <button
              onClick={onPublicar}
              disabled={publicando}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-verde hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 2v12M5 9l5-7 5 7"/>
                <path d="M3 17h14"/>
              </svg>
              {publicando ? 'Publicando…' : 'Publicar boletín'}
            </button>
          ) : confirmaDespublicar ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] text-naranja text-center font-medium">¿Despublicar?</p>
              <button
                onClick={() => { onDespublicar?.(); setConfirmaDespublicar(false) }}
                disabled={despublicando}
                className="w-full py-1.5 bg-naranja hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity disabled:opacity-50"
              >
                {despublicando ? 'Despublicando…' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirmaDespublicar(false)}
                className="w-full py-1.5 border border-gris-borde text-xs text-texto-suave rounded-lg hover:border-azul-medio transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmaDespublicar(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-naranja-borde bg-naranja-bg text-naranja text-xs font-semibold rounded-lg hover:bg-naranja hover:text-white transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 18V6M5 11l5 7 5-7"/>
                <path d="M3 3h14"/>
              </svg>
              Despublicar
            </button>
          )}
        </div>
      )}

      {/* Usuario */}
      <div className="mt-auto p-4 border-t border-gris-borde text-[11px] text-texto-tenue leading-relaxed">
        <strong className="text-azul">{usuario?.rol?.nombre}</strong><br/>
        {usuario?.nombre}<br/>
        ECOH Elqui
      </div>
    </aside>
  )
}

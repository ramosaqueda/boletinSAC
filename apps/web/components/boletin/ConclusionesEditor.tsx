'use client'
import { useState } from 'react'
import {
  useConclusiones, useCrearConclusion, useActualizarConclusion, useEliminarConclusion,
  type TipoConclusion, type Conclusion,
} from '@/lib/hooks'

// ── Config de tipos ───────────────────────────────────────────────────────────

const TIPOS: { id: TipoConclusion; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  {
    id: 'info', label: 'Información', color: '#1C3F81', bg: '#eef2fb',
    icon: (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 7h.01"/>
      </svg>
    ),
  },
  {
    id: 'tendencia', label: 'Tendencia', color: '#0e7490', bg: '#ecfeff',
    icon: (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="2,14 7,8 12,11 18,4"/><polyline points="14,4 18,4 18,8"/>
      </svg>
    ),
  },
  {
    id: 'recomendacion', label: 'Recomendación', color: '#166534', bg: '#f0fdf4',
    icon: (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M4 10l5 5 7-8"/>
      </svg>
    ),
  },
  {
    id: 'advertencia', label: 'Advertencia', color: '#92400e', bg: '#fffbeb',
    icon: (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 2L2 17h16L10 2z"/><path d="M10 9v4M10 15h.01"/>
      </svg>
    ),
  },
  {
    id: 'alerta', label: 'Alerta', color: '#991b1b', bg: '#fff1f2',
    icon: (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="8"/><path d="M10 6v5M10 14h.01"/>
      </svg>
    ),
  },
]

function tipoConfig(tipo: TipoConclusion) {
  return TIPOS.find(t => t.id === tipo) ?? TIPOS[0]!
}

// ── Fila individual ───────────────────────────────────────────────────────────

function FilaConclusion({
  c, boletinId, index, total,
  onMoveUp, onMoveDown,
}: {
  c: Conclusion
  boletinId: number
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [editing, setEditing]   = useState(false)
  const [texto, setTexto]       = useState(c.texto)
  const [tipo, setTipo]         = useState<TipoConclusion>(c.tipo)
  const { mutate: actualizar, isPending: guardando } = useActualizarConclusion(boletinId)
  const { mutate: eliminar,   isPending: borrando  } = useEliminarConclusion(boletinId)
  const cfg = tipoConfig(c.tipo)

  function guardar() {
    if (!texto.trim()) return
    actualizar({ id: c.id, tipo, texto: texto.trim() }, { onSuccess: () => setEditing(false) })
  }

  if (editing) {
    const editCfg = tipoConfig(tipo)
    return (
      <div className="border border-gris-borde rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Selector de tipo */}
        <div className="flex gap-1 p-3 pb-0 flex-wrap">
          {TIPOS.map(t => (
            <button type="button"
              key={t.id}
              onClick={() => setTipo(t.id)}
              style={{
                color: tipo === t.id ? t.color : undefined,
                background: tipo === t.id ? t.bg : undefined,
                borderColor: tipo === t.id ? t.color : undefined,
              }}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-gris-borde
                         text-texto-suave transition-all font-medium"
            >
              <span style={{ color: tipo === t.id ? t.color : '#999' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="p-3 pt-2">
          <textarea
            autoFocus
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={3}
            className="w-full border border-gris-borde rounded px-3 py-2 text-sm text-texto resize-none
                       focus:outline-none focus:border-azul-medio transition-colors"
            placeholder="Escribe la conclusión, tendencia o recomendación…"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button"
              onClick={() => { setEditing(false); setTexto(c.texto); setTipo(c.tipo) }}
              className="text-xs px-3 py-1.5 border border-gris-borde text-texto-suave rounded hover:border-azul-medio transition-colors"
            >
              Cancelar
            </button>
            <button type="button"
              onClick={guardar}
              disabled={guardando || !texto.trim()}
              style={{ background: editCfg.color }}
              className="text-xs px-4 py-1.5 text-white rounded transition-opacity disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ borderLeftColor: cfg.color, borderLeftWidth: '3px', background: cfg.bg }}
      className="flex items-start gap-3 px-4 py-3 rounded-lg border border-gris-borde group"
    >
      {/* Icono */}
      <div style={{ color: cfg.color }} className="mt-0.5 flex-shrink-0">{cfg.icon}</div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div style={{ color: cfg.color }} className="text-[10px] font-semibold uppercase tracking-wider mb-1">
          {cfg.label}
        </div>
        <p className="text-sm text-texto leading-relaxed whitespace-pre-wrap">{c.texto}</p>
      </div>

      {/* Acciones (visibles en hover) */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button type="button"
          onClick={onMoveUp} disabled={index === 0}
          title="Subir"
          className="p-1 text-texto-tenue hover:text-azul transition-colors disabled:opacity-20"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M10 15V5M5 10l5-5 5 5"/>
          </svg>
        </button>
        <button type="button"
          onClick={onMoveDown} disabled={index === total - 1}
          title="Bajar"
          className="p-1 text-texto-tenue hover:text-azul transition-colors disabled:opacity-20"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M10 5v10M5 10l5 5 5-5"/>
          </svg>
        </button>
        <button type="button"
          onClick={() => setEditing(true)}
          title="Editar"
          className="p-1 text-texto-tenue hover:text-azul transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M13.5 3.5a2.12 2.12 0 0 1 3 3L7 16H4v-3L13.5 3.5z"/>
          </svg>
        </button>
        <button type="button"
          onClick={() => eliminar(c.id)}
          disabled={borrando}
          title="Eliminar"
          className="p-1 text-texto-tenue hover:text-rojo transition-colors disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 5h14M8 5V3h4v2M6 5l1 11h6l1-11"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Formulario nueva conclusión ───────────────────────────────────────────────

function NuevaConclusion({ boletinId, orden }: { boletinId: number; orden: number }) {
  const [open, setOpen]   = useState(false)
  const [tipo, setTipo]   = useState<TipoConclusion>('info')
  const [texto, setTexto] = useState('')
  const { mutate: crear, isPending } = useCrearConclusion(boletinId)

  function submit() {
    if (!texto.trim()) return
    crear({ tipo, texto: texto.trim(), orden }, {
      onSuccess: () => { setTexto(''); setTipo('info'); setOpen(false) },
    })
  }

  if (!open) {
    return (
      <button type="button"
        onClick={() => setOpen(true)}
        className="w-full py-2 border border-dashed border-gris-borde rounded-lg text-xs text-texto-tenue
                   hover:border-azul-medio hover:text-azul transition-colors flex items-center justify-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M10 4v12M4 10h12"/>
        </svg>
        Agregar entrada
      </button>
    )
  }

  const editCfg = tipoConfig(tipo)
  return (
    <div className="border border-azul-medio rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Selector de tipo */}
      <div className="flex gap-1 p-3 pb-0 flex-wrap">
        {TIPOS.map(t => (
          <button type="button"
            key={t.id}
            onClick={() => setTipo(t.id)}
            style={{
              color: tipo === t.id ? t.color : undefined,
              background: tipo === t.id ? t.bg : undefined,
              borderColor: tipo === t.id ? t.color : undefined,
            }}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-gris-borde
                       text-texto-suave transition-all font-medium"
          >
            <span style={{ color: tipo === t.id ? t.color : '#999' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3 pt-2">
        <textarea
          autoFocus
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={3}
          className="w-full border border-gris-borde rounded px-3 py-2 text-sm text-texto resize-none
                     focus:outline-none focus:border-azul-medio transition-colors"
          placeholder="Escribe la conclusión, tendencia o recomendación…"
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit() }}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-texto-tenue">Ctrl+Enter para guardar</span>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => { setOpen(false); setTexto(''); setTipo('info') }}
              className="text-xs px-3 py-1.5 border border-gris-borde text-texto-suave rounded hover:border-azul-medio transition-colors"
            >
              Cancelar
            </button>
            <button type="button"
              onClick={submit}
              disabled={isPending || !texto.trim()}
              style={{ background: editCfg.color }}
              className="text-xs px-4 py-1.5 text-white rounded transition-opacity disabled:opacity-50"
            >
              {isPending ? 'Agregando…' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ConclusionesEditor({ boletinId, readonly }: { boletinId: number; readonly?: boolean }) {
  const { data: conclusiones = [], isLoading } = useConclusiones(boletinId)
  const { mutate: actualizar } = useActualizarConclusion(boletinId)

  function moveItem(index: number, direction: 'up' | 'down') {
    const target = conclusiones[index]
    const swap   = conclusiones[direction === 'up' ? index - 1 : index + 1]
    if (!target || !swap) return
    actualizar({ id: target.id, orden: swap.orden })
    actualizar({ id: swap.id,   orden: target.orden })
  }

  if (isLoading) return <div className="text-xs text-texto-tenue py-4 text-center animate-pulse">Cargando conclusiones…</div>

  return (
    <div className="flex flex-col gap-2">
      {conclusiones.length === 0 && readonly && (
        <div className="text-xs text-texto-tenue py-3 text-center">Sin conclusiones registradas.</div>
      )}

      {conclusiones.map((c, i) => (
        <FilaConclusion
          key={c.id}
          c={c}
          boletinId={boletinId}
          index={i}
          total={conclusiones.length}
          onMoveUp={()   => moveItem(i, 'up')}
          onMoveDown={() => moveItem(i, 'down')}
        />
      ))}

      {!readonly && (
        <NuevaConclusion boletinId={boletinId} orden={conclusiones.length} />
      )}
    </div>
  )
}

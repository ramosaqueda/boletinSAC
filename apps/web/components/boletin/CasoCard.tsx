'use client'
import { useState, useEffect, useRef } from 'react'
import {
  useCaso, useSubirFotografia, useEliminarFotografia,
  useCrearNoticia, useEliminarNoticia,
  useCrearImputado, useEliminarImputado,
  useCrearVictima, useEliminarVictima,
  useCrearIncautacion, useEliminarIncautacion,
  useAgregarHashtag, useEliminarHashtag, useHashtagSugerencias,
  useActualizarCaso, useScrapeUrl, useFotoDesdeUrl,
  useParametricas, useRedAsociativa,
} from '@/lib/hooks'
import type { CasoResumen, CasoCompleto, Noticia, Imputado, Incautacion, ImputadoConexion } from '@/lib/hooks'
import { useIsAnalista } from '@/lib/store'

// ── Helpers ───────────────────────────────────────────────────────────────────

const BADGE: Record<string, { label: string; cls: string }> = {
  trafico_drogas:         { label: 'Tráfico',           cls: 'bg-azul-claro text-azul border border-azul-medio' },
  microtrafico:           { label: 'Microtráfico',       cls: 'bg-verde-bg text-verde border border-verde-borde' },
  porte_armas:            { label: 'Porte de armas',     cls: 'bg-[#fff3eb] text-[#7a3010] border border-[#f0c8a8]' },
  robo_violencia:         { label: 'Robo c/ violencia',  cls: 'bg-rojo-claro text-[#7a0a0a] border border-rojo-borde' },
  robo_intimidacion:      { label: 'Robo c/ intim.',     cls: 'bg-rojo-claro text-[#7a0a0a] border border-rojo-borde' },
  robo_lugar_habitado:    { label: 'Robo l. habitado',   cls: 'bg-rojo-claro text-[#7a0a0a] border border-rojo-borde' },
  robo_lugar_no_habitado: { label: 'Robo l. no hab.',    cls: 'bg-rojo-claro text-[#7a0a0a] border border-rojo-borde' },
  violacion_morada:       { label: 'Viol. morada',       cls: 'bg-naranja-bg text-naranja border border-naranja-borde' },
  hurto_simple:           { label: 'Hurto simple',       cls: 'bg-azul-claro text-texto-suave border border-gris-borde' },
  lesiones:               { label: 'Lesiones',           cls: 'bg-[#fff3eb] text-[#7a3010] border border-[#f0c8a8]' },
  vif:                    { label: 'VIF',                cls: 'bg-[#fff3eb] text-[#7a3010] border border-[#f0c8a8]' },
  homicidio:              { label: 'Homicidio',          cls: 'bg-rojo-claro text-rojo border border-rojo-borde' },
  otro:                   { label: 'Otro',               cls: 'bg-azul-claro text-texto-suave border border-gris-borde' },
}

const ESTADO: Record<string, { label: string; cls: string }> = {
  en_libertad:              { label: 'En libertad',         cls: 'bg-verde-bg text-verde border border-verde-borde' },
  prision_preventiva:       { label: 'Prisión preventiva',  cls: 'bg-rojo-claro text-rojo border border-rojo-borde' },
  arraigo_nacional:         { label: 'Arraigo nacional',    cls: 'bg-naranja-bg text-naranja border border-naranja-borde' },
  arraigo_firma_mensual:    { label: 'Arraigo + firma',     cls: 'bg-naranja-bg text-naranja border border-naranja-borde' },
  sin_info_fcd:             { label: 'Sin info FCD',        cls: 'bg-azul-claro text-azul border border-azul-medio' },
  imputado_no_identificado: { label: 'No identificado',     cls: 'bg-azul-claro text-texto-suave border border-gris-borde' },
}

function formatFecha(s: string) {
  const d = new Date(s + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function iniciales(apellido: string, nombres: string) {
  return (apellido[0] + nombres[0]).toUpperCase()
}

// ── Modal de edición de caso ──────────────────────────────────────────────────

type P = { id: number; codigo: string; nombre: string }

const inpCls = 'w-full border border-gris-borde rounded px-2.5 py-1.5 text-sm text-azul focus:outline-none focus:border-azul-medio bg-white'

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-texto-suave uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

function EditarCasoModal({ data, onClose }: { data: CasoCompleto; onClose: () => void }) {
  const { data: param } = useParametricas()
  const actualizar = useActualizarCaso(data.id)

  const par = param as {
    tiposDelito?: P[]; estadosCausa?: P[]
    tiposLugar?: P[]; comunas?: P[]
  } | undefined

  const [form, setForm] = useState({
    fechaHecho:       data.fechaHecho               ?? '',
    horaHecho:        data.horaHecho?.slice(0, 5)   ?? '',  // DB devuelve HH:MM:SS → recortamos
    ruc:              data.ruc                       ?? '',
    folioBitacora:    data.folioBitacora             ?? '',
    idTipoDelitoPpal: '',
    idEstadoCausa:    '',
    unidadPolicial:   data.unidadPolicial            ?? '',
    plazoInvestDias:  data.plazoInvestDias ? String(data.plazoInvestDias) : '',
    relatoBreve:      data.relatoBreve               ?? '',
    diligencias:      data.diligencias               ?? '',
    observaciones:    data.observaciones             ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  // Inicializar selects cuando las paramétricas estén disponibles
  useEffect(() => {
    if (!par) return
    const td = par.tiposDelito?.find(t => t.codigo === data.tipoDelito)
    const ec = par.estadosCausa?.find(e => e.codigo === data.estadoCausa)
    setForm(f => ({
      ...f,
      idTipoDelitoPpal: td ? String(td.id) : f.idTipoDelitoPpal,
      idEstadoCausa:    ec ? String(ec.id) : f.idEstadoCausa,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.ruc.trim())         { setError('El RUC es obligatorio'); return }
    if (!form.fechaHecho)         { setError('La fecha del hecho es obligatoria'); return }
    if (!form.relatoBreve.trim()) { setError('El relato es obligatorio'); return }

    const payload: Record<string, unknown> = {
      fechaHecho:     form.fechaHecho,
      ruc:            form.ruc.trim(),
      relatoBreve:    form.relatoBreve.trim(),
      horaHecho:      form.horaHecho      || undefined,
      folioBitacora:  form.folioBitacora  || undefined,
      unidadPolicial: form.unidadPolicial || undefined,
      diligencias:    form.diligencias    || undefined,
      observaciones:  form.observaciones  || undefined,
    }
    if (form.idTipoDelitoPpal) payload.idTipoDelitoPpal = parseInt(form.idTipoDelitoPpal)
    if (form.idEstadoCausa)    payload.idEstadoCausa    = parseInt(form.idEstadoCausa)
    if (form.plazoInvestDias)  payload.plazoInvestDias  = parseInt(form.plazoInvestDias)

    actualizar.mutate(payload, {
      onSuccess: onClose,
      onError:   (err) => setError(err.message),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="px-6 py-4 border-b border-gris-borde flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-serif text-base font-semibold text-azul">Editar caso #{data.numeroCaso}</h2>
            <p className="text-[11px] text-texto-tenue mt-0.5">RUC {data.ruc}</p>
          </div>
          <button onClick={onClose} className="text-texto-tenue hover:text-azul text-xl leading-none px-1">×</button>
        </div>

        <form id="edit-caso-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <EditField label="Fecha del hecho *">
              <input type="date" className={inpCls} value={form.fechaHecho} onChange={set('fechaHecho')} />
            </EditField>
            <EditField label="Hora aproximada">
              <input type="time" className={inpCls} value={form.horaHecho} onChange={set('horaHecho')} />
            </EditField>
            <EditField label="RUC *">
              <input className={inpCls} value={form.ruc} onChange={set('ruc')} placeholder="1234567-8" />
            </EditField>
            <EditField label="Folio bitácora">
              <input className={inpCls} value={form.folioBitacora} onChange={set('folioBitacora')} placeholder="opcional" />
            </EditField>
            <EditField label="Tipo de delito">
              <select className={inpCls} value={form.idTipoDelitoPpal} onChange={set('idTipoDelitoPpal')}>
                <option value="">— Sin cambio —</option>
                {par?.tiposDelito?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </EditField>
            <EditField label="Estado de la causa">
              <select className={inpCls} value={form.idEstadoCausa} onChange={set('idEstadoCausa')}>
                <option value="">— Sin cambio —</option>
                {par?.estadosCausa?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </EditField>
            <EditField label="Unidad policial">
              <input className={inpCls} value={form.unidadPolicial} onChange={set('unidadPolicial')} placeholder="OS-7, PDI, BRIPOL…" />
            </EditField>
            <EditField label="Plazo investigación">
              <select className={inpCls} value={form.plazoInvestDias} onChange={set('plazoInvestDias')}>
                <option value="">Sin plazo</option>
                {[30, 60, 90, 120, 180].map(p => <option key={p} value={p}>{p} días</option>)}
              </select>
            </EditField>
          </div>

          <EditField label="Relato breve *">
            <textarea rows={5} className={inpCls + ' resize-none'} value={form.relatoBreve} onChange={set('relatoBreve')} />
          </EditField>
          <EditField label="Diligencias realizadas">
            <textarea rows={3} className={inpCls + ' resize-none'} value={form.diligencias} onChange={set('diligencias')} />
          </EditField>
          <EditField label="Observaciones del analista">
            <textarea rows={2} className={inpCls + ' resize-none'} value={form.observaciones} onChange={set('observaciones')} />
          </EditField>

          {error && <p className="text-sm text-rojo bg-[#fff0f0] border border-rojo-borde rounded px-3 py-2">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t border-gris-borde flex justify-end gap-2 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm border border-gris-borde text-texto-suave rounded hover:border-azul-medio transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-caso-form"
            disabled={actualizar.isPending}
            className="px-5 py-1.5 text-sm bg-azul hover:bg-azul-hover text-white rounded transition-colors disabled:opacity-60"
          >
            {actualizar.isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── CasoDetalle (carga lazy al abrir) ────────────────────────────────────────

function CasoDetalle({ id }: { id: number }) {
  const { data, isLoading, error } = useCaso(id)
  const [editando, setEditando] = useState(false)
  const [redOpen,  setRedOpen]  = useState(false)
  const esAnalista = useIsAnalista()

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-texto-tenue animate-pulse">Cargando detalles…</div>
    )
  }
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-rojo bg-[#fff0f0] border-t border-rojo-borde">
        {(error as Error)?.message ?? 'No se pudo cargar el caso.'}
      </div>
    )
  }

  const lugar = data.lugares[0]

  return (<>
    {editando && <EditarCasoModal data={data} onClose={() => setEditando(false)} />}
    {redOpen  && <RedAsociativaModal casoId={data.id} numeroCaso={data.numeroCaso} onClose={() => setRedOpen(false)} />}

    <div className="grid border-t border-azul-claro" style={{ gridTemplateColumns: '1fr 280px' }}>
      {/* Columna principal */}
      <div className="p-5">
        <SecLabel>Relato del hecho</SecLabel>
        <p className="font-serif text-sm leading-7 text-texto mb-4">{data.relatoBreve}</p>

        <IncautacionesPanel casoId={data.id} incautaciones={data.incautaciones} />

        <NoticiasPanel casoId={data.id} noticias={data.noticias} />

        {data.vehiculos.length > 0 && (
          <>
            <SecLabel>Vehículos involucrados</SecLabel>
            {data.vehiculos.map((v) => (
              <div key={v.id} className="text-xs text-texto-suave py-1">
                {[v.marca, v.modelo, v.color, v.patente].filter(Boolean).join(' · ')}
                {v.rol && <span className="ml-2 text-azul">({v.rol})</span>}
              </div>
            ))}
          </>
        )}

        <FotografiasPanel casoId={data.id} fotos={data.fotografias} />
      </div>

      {/* Aside */}
      <div className="p-4 bg-azul-suave border-l border-azul-claro overflow-y-auto">
        <HashtagsPanel casoId={data.id} hashtags={data.hashtags ?? []} />

        <ImputadosPanel casoId={data.id} imputados={data.imputados} />

        <VictimasPanel casoId={data.id} victimas={data.victimas} />

        {data.diligencias && (
          <>
            <SecLabel className="mt-3">Diligencias</SecLabel>
            <div className="bg-white border-l-2 border-rojo rounded-r px-3 py-2 text-xs text-texto-suave leading-relaxed mb-2">
              {data.diligencias}
            </div>
          </>
        )}

        {data.fiscal && (
          <p className="text-[11px] text-texto-tenue mb-3">
            Fiscal a cargo: <strong className="text-azul">{data.fiscal}</strong>
          </p>
        )}

        <SecLabel>Notas del analista</SecLabel>
        <textarea
          defaultValue={data.observaciones ?? ''}
          placeholder="Observaciones, alertas, contexto relevante…"
          className="w-full min-h-[64px] px-2.5 py-2 border border-azul-medio rounded text-xs text-texto
                     bg-white resize-y focus:outline-none focus:border-azul leading-relaxed"
        />
      </div>

      {/* Footer */}
      <div className="col-span-2 flex items-center gap-2 px-5 py-2.5 border-t border-azul-claro bg-azul-suave">
        {esAnalista && (
          <button
            onClick={() => setEditando(true)}
            className="px-3 py-1.5 border border-azul-medio rounded bg-white text-azul text-[11px] hover:bg-azul hover:text-white transition-colors shrink-0"
          >
            Editar caso
          </button>
        )}
        {data.imputados.length > 0 && (
          <button
            onClick={() => setRedOpen(true)}
            className="px-3 py-1.5 border border-azul-medio rounded bg-white text-azul text-[11px] hover:bg-azul hover:text-white transition-colors shrink-0"
          >
            Red asociativa
          </button>
        )}
        {/* Chips de hashtags en el footer */}
        {(data.hashtags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 ml-2">
            {(data.hashtags ?? []).map(h => (
              <span key={h.id}
                className="text-[10px] bg-azul text-white px-1.5 py-0.5 rounded-full leading-tight">
                #{h.texto}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </>)
}

function SecLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[9px] font-semibold text-azul uppercase tracking-wider mb-2 flex items-center gap-1.5 ${className}`}>
      {children}
      <span className="flex-1 h-px bg-azul-medio"/>
    </div>
  )
}

// ── Panel de notas de prensa ──────────────────────────────────────────────────

function NoticiasPanel({ casoId, noticias }: { casoId: number; noticias: Noticia[] }) {
  const crear        = useCrearNoticia(casoId)
  const eliminar     = useEliminarNoticia(casoId)
  const scrape       = useScrapeUrl()
  const fotoDesdeUrl = useFotoDesdeUrl(casoId)
  const esAnalista   = useIsAnalista()
  const [form, setForm] = useState({ url: '', medio: '', titular: '', bajada: '', fechaPub: '' })
  const [preview, setPreview] = useState<{ imagen: string | null; descripcion: string | null } | null>(null)
  const [guardarFoto, setGuardarFoto] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const handleUrlBlur = () => {
    if (!form.url) return
    try { new URL(form.url) } catch { return }

    scrape.mutate(form.url, {
      onSuccess: (d) => {
        setForm(f => ({
          ...f,
          medio:    f.medio    || d.medio        || '',
          titular:  f.titular  || d.titulo       || '',
          bajada:   f.bajada   || d.descripcion  || '',
          fechaPub: f.fechaPub || d.fechaPub     || '',
        }))
        setPreview({ imagen: d.imagen, descripcion: d.descripcion })
        setGuardarFoto(!!d.imagen) // pre-marcar si hay imagen
      },
    })
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try { new URL(form.url) } catch { setError('URL inválida'); return }

    crear.mutate(
      {
        url:      form.url,
        medio:    form.medio    || undefined,
        titular:  form.titular  || undefined,
        bajada:   form.bajada   || undefined,
        fechaPub: form.fechaPub || undefined,
      },
      {
        onSuccess: () => {
          // Si hay imagen scrapeada y el analista eligió guardarla
          if (guardarFoto && preview?.imagen) {
            fotoDesdeUrl.mutate({
              imageUrl:    preview.imagen,
              descripcion: form.medio || form.url,
            })
          }
          setForm({ url: '', medio: '', titular: '', bajada: '', fechaPub: '' })
          setPreview(null)
          setAdding(false)
        },
        onError: (err) => setError(err.message),
      },
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <SecLabel>Prensa vinculada</SecLabel>
        {esAnalista && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[10px] text-azul border border-azul-medio rounded px-2 py-0.5 hover:bg-azul-suave transition-colors"
          >
            + Agregar
          </button>
        )}
      </div>

      {/* Lista */}
      {noticias.length === 0 && !adding && (
        <p className="text-[11px] text-texto-tenue mb-2">No hay notas de prensa vinculadas.</p>
      )}
      {noticias.map((n) => (
        <div key={n.id} className="flex gap-2 items-start py-1.5 border-b border-gris-borde last:border-0 group">
          <span className="w-1.5 h-1.5 rounded-full bg-rojo flex-shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <a
              href={n.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-azul underline break-all"
              onClick={e => e.stopPropagation()}
            >
              {n.medio ?? n.url}{n.fechaPub ? ` · ${formatFecha(n.fechaPub)}` : ''}
            </a>
            {n.titular && <p className="text-[11px] text-texto-suave leading-snug">{n.titular}</p>}
            {n.bajada && <p className="text-[10px] text-texto-tenue leading-snug mt-0.5">{n.bajada}</p>}
          </div>
          {esAnalista && (
            <button
              onClick={() => eliminar.mutate(n.id)}
              disabled={eliminar.isPending}
              className="text-[10px] text-rojo opacity-0 group-hover:opacity-100 hover:underline transition-opacity flex-shrink-0"
            >
              Eliminar
            </button>
          )}
        </div>
      ))}

      {/* Formulario agregar */}
      {adding && (
        <form
          onSubmit={handleAdd}
          onClick={e => e.stopPropagation()}
          className="mt-2 border border-azul-medio rounded-lg p-3 bg-azul-suave flex flex-col gap-2"
        >
          {/* URL + trigger scraping al salir del campo */}
          <div className="relative">
            <input
              type="url"
              placeholder="URL de la noticia *"
              value={form.url}
              onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setPreview(null) }}
              onBlur={handleUrlBlur}
              className="w-full border border-gris-borde rounded px-2 py-1.5 text-xs text-azul bg-white focus:outline-none focus:border-azul-medio pr-16"
              required
            />
            {scrape.isPending && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-texto-tenue animate-pulse">
                Obteniendo…
              </span>
            )}
          </div>

          {/* Preview scraped */}
          {preview && (
            <div className="flex gap-2 bg-white border border-gris-borde rounded p-2">
              {preview.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.imagen} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {preview.descripcion && (
                  <p className="text-[10px] text-texto-suave leading-snug line-clamp-2 mb-1.5">{preview.descripcion}</p>
                )}
                {preview.imagen && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={guardarFoto}
                      onChange={e => setGuardarFoto(e.target.checked)}
                      className="accent-azul"
                    />
                    <span className="text-[10px] text-texto-suave">Guardar imagen como foto del caso</span>
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Medio (El Día, Biobío…)"
              value={form.medio}
              onChange={e => setForm(f => ({ ...f, medio: e.target.value }))}
              className="border border-gris-borde rounded px-2 py-1.5 text-xs text-azul bg-white focus:outline-none focus:border-azul-medio"
            />
            <input
              type="date"
              value={form.fechaPub}
              onChange={e => setForm(f => ({ ...f, fechaPub: e.target.value }))}
              className="border border-gris-borde rounded px-2 py-1.5 text-xs text-azul bg-white focus:outline-none focus:border-azul-medio"
            />
          </div>
          <input
            type="text"
            placeholder="Titular"
            value={form.titular}
            onChange={e => setForm(f => ({ ...f, titular: e.target.value }))}
            className="border border-gris-borde rounded px-2 py-1.5 text-xs text-azul bg-white focus:outline-none focus:border-azul-medio"
          />
          <textarea
            placeholder="Bajada (resumen o descripción de la noticia)"
            value={form.bajada}
            onChange={e => setForm(f => ({ ...f, bajada: e.target.value }))}
            rows={2}
            className="border border-gris-borde rounded px-2 py-1.5 text-xs text-azul bg-white focus:outline-none focus:border-azul-medio resize-none"
          />
          {error && <p className="text-[11px] text-rojo">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setAdding(false); setPreview(null); setError(null); setGuardarFoto(true); setForm({ url: '', medio: '', titular: '', bajada: '', fechaPub: '' }) }}
              className="text-xs text-texto-suave px-3 py-1 border border-gris-borde rounded hover:border-azul-medio transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={crear.isPending}
              className="text-xs text-white bg-azul hover:bg-azul-hover px-3 py-1 rounded transition-colors disabled:opacity-60"
            >
              {crear.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Panel de fotografías ──────────────────────────────────────────────────────

interface Foto {
  id: number
  tipoFoto: string
  tipoFotoNombre?: string
  descripcion: string | null
  archivoUrl: string
  orden: number
}

function FotografiasPanel({ casoId, fotos }: { casoId: number; fotos: Foto[] }) {
  const fileRef    = useRef<HTMLInputElement>(null)
  const { data: param } = useParametricas()
  const subir      = useSubirFotografia(casoId)
  const eliminar   = useEliminarFotografia(casoId)
  const esAnalista = useIsAnalista()
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [selectedTipo, setSelectedTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const P = param as { tiposFoto?: { id: number; codigo: string; nombre: string }[] } | undefined
  const tiposFoto = P?.tiposFoto ?? []

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    const fd = new FormData()
    fd.append('foto', file)
    if (selectedTipo) fd.append('idTipoFoto', selectedTipo)
    if (descripcion)  fd.append('descripcion', descripcion)
    fd.append('orden', String(fotos.length + 1))

    subir.mutate(fd, {
      onSuccess: () => {
        setDescripcion('')
        if (fileRef.current) fileRef.current.value = ''
      },
      onError: (err) => setUploadError(err.message),
    })
  }

  return (
    <div className="mt-4">
      <SecLabel>Fotografías del caso</SecLabel>

      {/* Galería */}
      {fotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="relative group rounded overflow-hidden border border-gris-borde aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.archivoUrl}
                alt={foto.descripcion ?? foto.tipoFoto}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox(foto.archivoUrl)}
              />
              <div className="absolute inset-0 bg-azul/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button
                  onClick={() => setLightbox(foto.archivoUrl)}
                  className="text-[10px] text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                >
                  Ver
                </button>
                {esAnalista && (
                  <button
                    onClick={() => eliminar.mutate(foto.id)}
                    className="text-[10px] text-white bg-rojo/70 hover:bg-rojo px-2 py-1 rounded transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              {(foto.tipoFotoNombre || foto.descripcion) && (
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white px-1.5 py-1 truncate">
                  {foto.tipoFotoNombre && <span className="font-semibold">{foto.tipoFotoNombre}</span>}
                  {foto.tipoFotoNombre && foto.descripcion && ' · '}
                  {foto.descripcion}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-texto-tenue mb-3">No hay fotografías registradas.</p>
      )}

      {/* Upload — sólo analistas */}
      {esAnalista && <div className="border border-dashed border-azul-medio rounded-lg p-3 bg-azul-suave">
        <div className="flex gap-2 mb-2">
          <select
            value={selectedTipo}
            onChange={e => setSelectedTipo(e.target.value)}
            className="flex-1 border border-gris-borde rounded px-2 py-1 text-[11px] text-azul bg-white focus:outline-none"
          >
            <option value="">Tipo de foto…</option>
            {tiposFoto.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="flex-[2] border border-gris-borde rounded px-2 py-1 text-[11px] text-azul bg-white focus:outline-none"
          />
        </div>
        <label className={`flex items-center justify-center gap-2 text-[11px] font-medium cursor-pointer rounded py-2 transition-colors
          ${subir.isPending ? 'bg-gris-borde text-texto-tenue' : 'bg-azul hover:bg-azul-hover text-white'}`}>
          {subir.isPending ? 'Subiendo…' : '+ Seleccionar imagen'}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={subir.isPending}
            onChange={handleFileChange}
          />
        </label>
        {uploadError && <p className="text-[10px] text-rojo mt-1">{uploadError}</p>}
      </div>}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Fotografía caso"
            className="max-w-full max-h-full rounded shadow-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl leading-none hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

// ── Panel de imputados ────────────────────────────────────────────────────────

function ImputadosPanel({ casoId, imputados }: { casoId: number; imputados: Imputado[] }) {
  const crear      = useCrearImputado(casoId)
  const eliminar   = useEliminarImputado(casoId)
  const esAnalista = useIsAnalista()
  const { data: param } = useParametricas()
  const par = param as { tiposDocumento?: P[] } | undefined

  const empty = { apellidoPaterno: '', apellidoMaterno: '', nombres: '', idTipoDocumento: '', numeroDocumento: '', numCausasPrevias: '0', alertaReincidencia: false }
  const [form, setForm] = useState(empty)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.apellidoPaterno.trim()) { setError('El apellido paterno es obligatorio'); return }
    if (!form.nombres.trim())         { setError('El nombre es obligatorio'); return }
    if (!form.idTipoDocumento)        { setError('Seleccione tipo de documento'); return }
    if (!form.numeroDocumento.trim()) { setError('El número de documento es obligatorio'); return }

    crear.mutate({
      apellidoPaterno:  form.apellidoPaterno.trim(),
      apellidoMaterno:  form.apellidoMaterno.trim() || undefined,
      nombres:          form.nombres.trim(),
      idTipoDocumento:  parseInt(form.idTipoDocumento),
      numeroDocumento:  form.numeroDocumento.trim(),
      numCausasPrevias: parseInt(form.numCausasPrevias) || 0,
      alertaReincidencia: form.alertaReincidencia,
    }, {
      onSuccess: () => { setForm(empty); setAdding(false) },
      onError:   (err) => setError(err.message),
    })
  }

  const inp = 'w-full border border-gris-borde rounded px-2 py-1.5 text-xs text-azul bg-white focus:outline-none focus:border-azul-medio'

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <SecLabel>{imputados.length > 1 ? 'Imputados' : 'Imputado'}</SecLabel>
        {esAnalista && !adding && (
          <button onClick={() => setAdding(true)}
            className="text-[10px] text-azul border border-azul-medio rounded px-2 py-0.5 hover:bg-azul-suave transition-colors">
            + Agregar
          </button>
        )}
      </div>

      {imputados.map((imp) => (
        <div key={imp.id} className="bg-white border border-azul-medio rounded-lg p-3 mb-2 group relative">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0
                            ${imp.alertaReincidencia ? 'bg-rojo' : 'bg-azul'}`}>
              {iniciales(imp.apellidoPaterno, imp.nombres)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-azul leading-tight truncate">
                {imp.apellidoPaterno} {imp.apellidoMaterno ?? ''}, {imp.nombres}
                {imp.alertaReincidencia && (
                  <span className="ml-1.5 text-[9px] bg-rojo text-white px-1 py-0.5 rounded font-bold">ALERTA</span>
                )}
              </div>
              <div className="text-[10px] text-texto-tenue font-mono">{imp.tipoDocumento?.toUpperCase()} {imp.numeroDocumento}</div>
            </div>
            {esAnalista && (
              <button onClick={() => eliminar.mutate(imp.id)} disabled={eliminar.isPending}
                className="text-[10px] text-rojo opacity-0 group-hover:opacity-100 transition-opacity hover:underline flex-shrink-0">
                Eliminar
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2.5">
            <div className={`rounded p-1.5 text-center ${imp.numCausasPrevias >= 10 ? 'bg-rojo-claro' : 'bg-azul-suave'}`}>
              <div className={`text-sm font-semibold leading-none ${imp.numCausasPrevias >= 10 ? 'text-rojo' : 'text-azul'}`}>
                {imp.numCausasPrevias}
              </div>
              <div className="text-[9px] text-texto-tenue mt-0.5">Causas previas</div>
            </div>
            <div className="bg-azul-suave rounded p-1.5 text-center">
              <div className="text-sm font-semibold text-azul leading-none">{imp.numComplices}</div>
              <div className="text-[9px] text-texto-tenue mt-0.5">Cómplices</div>
            </div>
          </div>
        </div>
      ))}

      {imputados.length === 0 && !adding && (
        <p className="text-[11px] text-texto-tenue mb-2">Sin imputados registrados.</p>
      )}

      {adding && (
        <form onSubmit={handleAdd} onClick={e => e.stopPropagation()}
          className="border border-azul-medio rounded-lg p-3 bg-white flex flex-col gap-2 mb-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Apellido paterno *</label>
              <input className={inp} value={form.apellidoPaterno} onChange={set('apellidoPaterno')} placeholder="González" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Apellido materno</label>
              <input className={inp} value={form.apellidoMaterno} onChange={set('apellidoMaterno')} placeholder="opcional" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Nombres *</label>
              <input className={inp} value={form.nombres} onChange={set('nombres')} placeholder="Juan Carlos" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Tipo doc. *</label>
              <select className={inp} value={form.idTipoDocumento} onChange={set('idTipoDocumento')}>
                <option value="">— Tipo —</option>
                {par?.tiposDocumento?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">N° documento *</label>
              <input className={inp} value={form.numeroDocumento} onChange={set('numeroDocumento')} placeholder="12.345.678-9" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Causas previas</label>
              <input type="number" min="0" className={inp} value={form.numCausasPrevias} onChange={set('numCausasPrevias')} />
            </div>
            <div className="flex items-center gap-2 pt-3">
              <input type="checkbox" id={`alerta-${casoId}`} checked={form.alertaReincidencia}
                onChange={e => setForm(f => ({ ...f, alertaReincidencia: e.target.checked }))}
                className="accent-rojo" />
              <label htmlFor={`alerta-${casoId}`} className="text-[10px] text-texto-suave cursor-pointer">
                Alerta reincidencia
              </label>
            </div>
          </div>
          {error && <p className="text-[10px] text-rojo">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setAdding(false); setError(null); setForm(empty) }}
              className="text-xs text-texto-suave px-3 py-1 border border-gris-borde rounded hover:border-azul-medio transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={crear.isPending}
              className="text-xs text-white bg-azul hover:bg-azul-hover px-3 py-1 rounded transition-colors disabled:opacity-60">
              {crear.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Panel de víctimas ─────────────────────────────────────────────────────────

function VictimasPanel({ casoId, victimas }: { casoId: number; victimas: CasoCompleto['victimas'] }) {
  const crear      = useCrearVictima(casoId)
  const eliminar   = useEliminarVictima(casoId)
  const esAnalista = useIsAnalista()
  const { data: param } = useParametricas()
  const par = param as { calidadesVictima?: P[]; tiposLesiones?: P[] } | undefined

  const empty = { nombre: '', idCalidad: '', idTipoLesiones: '' }
  const [form, setForm] = useState(empty)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const inp = 'w-full border border-gris-borde rounded px-2 py-1.5 text-xs text-azul bg-white focus:outline-none focus:border-azul-medio'

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    crear.mutate({
      nombre:          form.nombre.trim() || undefined,
      idCalidad:       form.idCalidad     ? parseInt(form.idCalidad)     : undefined,
      idTipoLesiones:  form.idTipoLesiones ? parseInt(form.idTipoLesiones) : undefined,
    }, {
      onSuccess: () => { setForm(empty); setAdding(false) },
      onError:   (err) => setError(err.message),
    })
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <SecLabel>Víctimas</SecLabel>
        {esAnalista && !adding && (
          <button onClick={() => setAdding(true)}
            className="text-[10px] text-azul border border-azul-medio rounded px-2 py-0.5 hover:bg-azul-suave transition-colors">
            + Agregar
          </button>
        )}
      </div>

      {victimas.length === 0 && !adding && (
        <p className="text-[11px] text-texto-tenue mb-2">Sin víctimas registradas.</p>
      )}
      {victimas.map((v) => (
        <div key={v.id} className="flex items-center gap-2 py-1 border-b border-gris-borde last:border-0 group">
          <span className="w-1.5 h-1.5 rounded-full bg-azul-medio flex-shrink-0" />
          <div className="flex-1 text-xs text-texto-suave">
            {v.nombre ?? 'Anónima'}
            {v.calidad && <span className="ml-1 text-texto-tenue">· {v.calidad}</span>}
            {v.tipoLesiones && <span className="ml-1 text-rojo">· {v.tipoLesiones}</span>}
          </div>
          {esAnalista && (
            <button onClick={() => eliminar.mutate(v.id)} disabled={eliminar.isPending}
              className="text-[10px] text-rojo opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
              Eliminar
            </button>
          )}
        </div>
      ))}

      {adding && (
        <form onSubmit={handleAdd} onClick={e => e.stopPropagation()}
          className="border border-azul-medio rounded-lg p-3 bg-white flex flex-col gap-2 mt-2">
          <div>
            <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Nombre</label>
            <input className={inp} value={form.nombre} onChange={set('nombre')} placeholder="Nombre completo (opcional)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Calidad</label>
              <select className={inp} value={form.idCalidad} onChange={set('idCalidad')}>
                <option value="">— Calidad —</option>
                {par?.calidadesVictima?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Tipo lesiones</label>
              <select className={inp} value={form.idTipoLesiones} onChange={set('idTipoLesiones')}>
                <option value="">— Lesiones —</option>
                {par?.tiposLesiones?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-[10px] text-rojo">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setAdding(false); setError(null); setForm(empty) }}
              className="text-xs text-texto-suave px-3 py-1 border border-gris-borde rounded hover:border-azul-medio transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={crear.isPending}
              className="text-xs text-white bg-azul hover:bg-azul-hover px-3 py-1 rounded transition-colors disabled:opacity-60">
              {crear.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Panel de incautaciones ────────────────────────────────────────────────────

function IncautacionesPanel({ casoId, incautaciones }: { casoId: number; incautaciones: Incautacion[] }) {
  const crear      = useCrearIncautacion(casoId)
  const eliminar   = useEliminarIncautacion(casoId)
  const esAnalista = useIsAnalista()
  const { data: param } = useParametricas()
  const par = param as { tiposEspecie?: P[]; subtiposDroga?: P[]; subtiposArma?: P[] } | undefined

  const empty = { idTipoEspecie: '', descripcion: '', cantidad: '', unidadMedida: '', nue: '', idSubtipoDroga: '', idSubtipoArma: '', calibre: '' }
  const [form, setForm] = useState(empty)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const tipoSeleccionado = par?.tiposEspecie?.find(t => String(t.id) === form.idTipoEspecie)?.codigo ?? ''
  const esDroga = tipoSeleccionado.includes('droga') || tipoSeleccionado.includes('estupef')
  const esArma  = tipoSeleccionado.includes('arma')

  const inp = 'w-full border border-gris-borde rounded px-2 py-1.5 text-xs text-azul bg-white focus:outline-none focus:border-azul-medio'

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.idTipoEspecie) { setError('Seleccione el tipo de especie'); return }
    if (!form.descripcion.trim()) { setError('La descripción es obligatoria'); return }

    crear.mutate({
      idTipoEspecie:  parseInt(form.idTipoEspecie),
      descripcion:    form.descripcion.trim(),
      cantidad:       form.cantidad     ? parseFloat(form.cantidad)         : undefined,
      unidadMedida:   form.unidadMedida.trim() || undefined,
      nue:            form.nue.trim()          || undefined,
      idSubtipoDroga: form.idSubtipoDroga ? parseInt(form.idSubtipoDroga)  : undefined,
      idSubtipoArma:  form.idSubtipoArma  ? parseInt(form.idSubtipoArma)   : undefined,
      calibre:        form.calibre.trim()      || undefined,
    }, {
      onSuccess: () => { setForm(empty); setAdding(false) },
      onError:   (err) => setError(err.message),
    })
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <SecLabel>Especies incautadas</SecLabel>
        {esAnalista && !adding && (
          <button onClick={() => setAdding(true)}
            className="text-[10px] text-azul border border-azul-medio rounded px-2 py-0.5 hover:bg-azul-suave transition-colors">
            + Agregar
          </button>
        )}
      </div>

      {incautaciones.length === 0 && !adding && (
        <p className="text-[11px] text-texto-tenue mb-2">Sin especies incautadas.</p>
      )}
      {incautaciones.map((inc) => (
        <div key={inc.id} className="bg-azul-suave border-l-[3px] border-azul rounded-r-md px-3.5 py-2 mb-2 group flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <strong className="block text-[12px] font-semibold text-azul mb-0.5">{inc.descripcion}</strong>
            <span className="text-[11px] text-texto-suave">
              {inc.tipoEspecieNombre}
              {inc.cantidad && ` · ${inc.cantidad} ${inc.unidadMedida ?? ''}`}
              {inc.nue && ` · N.U.E. ${inc.nue}`}
              {inc.calibre && ` · ${inc.calibre}`}
            </span>
          </div>
          {esAnalista && (
            <button onClick={() => eliminar.mutate(inc.id)} disabled={eliminar.isPending}
              className="text-[10px] text-rojo opacity-0 group-hover:opacity-100 transition-opacity hover:underline flex-shrink-0 mt-0.5">
              Eliminar
            </button>
          )}
        </div>
      ))}

      {adding && (
        <form onSubmit={handleAdd} onClick={e => e.stopPropagation()}
          className="border border-azul-medio rounded-lg p-3 bg-azul-suave flex flex-col gap-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Tipo de especie *</label>
              <select className={inp} value={form.idTipoEspecie} onChange={set('idTipoEspecie')}>
                <option value="">— Seleccionar —</option>
                {par?.tiposEspecie?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Descripción *</label>
              <input className={inp} value={form.descripcion} onChange={set('descripcion')} placeholder="Ej: Cocaína base en bolsas" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Cantidad</label>
              <input type="number" step="any" min="0" className={inp} value={form.cantidad} onChange={set('cantidad')} placeholder="0" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Unidad</label>
              <input className={inp} value={form.unidadMedida} onChange={set('unidadMedida')} placeholder="gramos, unidades…" />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">N.U.E.</label>
              <input className={inp} value={form.nue} onChange={set('nue')} placeholder="Número único especie" />
            </div>
            {esDroga && (
              <div>
                <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Subtipo droga</label>
                <select className={inp} value={form.idSubtipoDroga} onChange={set('idSubtipoDroga')}>
                  <option value="">— Subtipo —</option>
                  {par?.subtiposDroga?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            )}
            {esArma && (
              <>
                <div>
                  <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Subtipo arma</label>
                  <select className={inp} value={form.idSubtipoArma} onChange={set('idSubtipoArma')}>
                    <option value="">— Subtipo —</option>
                    {par?.subtiposArma?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-texto-suave uppercase tracking-wide mb-0.5">Calibre</label>
                  <input className={inp} value={form.calibre} onChange={set('calibre')} placeholder="9mm, .38…" />
                </div>
              </>
            )}
          </div>
          {error && <p className="text-[10px] text-rojo">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setAdding(false); setError(null); setForm(empty) }}
              className="text-xs text-texto-suave px-3 py-1 border border-gris-borde rounded hover:border-azul-medio transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={crear.isPending}
              className="text-xs text-white bg-azul hover:bg-azul-hover px-3 py-1 rounded transition-colors disabled:opacity-60">
              {crear.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Panel de hashtags ─────────────────────────────────────────────────────────

function HashtagsPanel({ casoId, hashtags }: { casoId: number; hashtags: { id: number; texto: string }[] }) {
  const agregar    = useAgregarHashtag(casoId)
  const eliminar   = useEliminarHashtag(casoId)
  const esAnalista = useIsAnalista()
  const [input, setInput]       = useState('')
  const [showSug, setShowSug]   = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: sugerencias = [] } = useHashtagSugerencias(input)

  const existingIds = new Set(hashtags.map(h => h.id))
  const opciones = sugerencias.filter(s => !existingIds.has(s.id))

  const add = (texto: string) => {
    const limpio = texto.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '_')
    if (!limpio) return
    setErrorMsg(null)
    agregar.mutate(limpio, {
      onSuccess: () => { setInput(''); setShowSug(false) },
      onError: (err) => setErrorMsg((err as Error).message ?? 'Error al agregar etiqueta'),
    })
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add(input) }
    if (e.key === 'Escape') { setShowSug(false) }
  }

  return (
    <div className="mb-4">
      <SecLabel>Hashtags</SecLabel>

      {/* Chips existentes */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {hashtags.length === 0 && (
          <span className="text-[11px] text-texto-tenue">Sin etiquetas.</span>
        )}
        {hashtags.map(h => (
          <span key={h.id}
            className="inline-flex items-center gap-1 text-[11px] bg-azul text-white px-2 py-0.5 rounded-full">
            #{h.texto}
            {esAnalista && (
              <button
                onClick={() => eliminar.mutate(h.id)}
                disabled={eliminar.isPending}
                className="leading-none hover:text-rojo-claro transition-colors ml-0.5"
                aria-label="Eliminar"
              >×</button>
            )}
          </span>
        ))}
      </div>

      {/* Input para analistas */}
      {esAnalista && (
        <div className="relative">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setShowSug(true); setErrorMsg(null) }}
            onFocus={() => setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
            onKeyDown={handleKey}
            disabled={agregar.isPending}
            placeholder="#nuevo_tag — presiona Enter para agregar"
            className="w-full border border-gris-borde rounded px-2.5 py-1.5 text-xs text-azul bg-white
                       focus:outline-none focus:border-azul-medio placeholder:text-texto-tenue disabled:opacity-60"
          />
          {errorMsg && (
            <p className="text-[10px] text-rojo mt-1">{errorMsg}</p>
          )}
          {showSug && opciones.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-gris-borde rounded shadow-md z-20 max-h-32 overflow-y-auto">
              {opciones.map(s => (
                <button key={s.id} onMouseDown={() => add(s.texto)}
                  className="w-full text-left px-3 py-1.5 text-xs text-azul hover:bg-azul-suave transition-colors">
                  #{s.texto}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Red asociativa ────────────────────────────────────────────────────────────

type NodeTipo = 'caso_central' | 'imputado' | 'otro_caso' | 'co_imputado'
type EdgeTipo  = 'participa'   | 'aparece_en' | 'co_imputado'
interface GNode { id: string; x: number; y: number; tipo: NodeTipo; label: string; sub?: string; alerta?: boolean; initials: string }
interface GEdge { from: string; to: string; tipo: EdgeTipo }

function buildGrafo(data: { imputados: ImputadoConexion[] }, numeroCaso: number) {
  const W = 720, H = 460, cx = W / 2, cy = H / 2
  const nodes: GNode[] = []; const edges: GEdge[] = []
  const seen = new Set<string>(); const seenE = new Set<string>()

  const addN = (n: GNode) => { if (!seen.has(n.id)) { nodes.push(n); seen.add(n.id) } }
  const addE = (e: GEdge) => { const k = `${e.from}→${e.to}`; if (!seenE.has(k)) { edges.push(e); seenE.add(k) } }

  addN({ id: 'cc', x: cx, y: cy, tipo: 'caso_central', label: `Caso ${numeroCaso}`, initials: `${numeroCaso}` })

  const N = data.imputados.length
  const R1 = 140, R2 = 235, R3 = 315

  data.imputados.forEach((imp, i) => {
    const angle = (2 * Math.PI * i / N) - Math.PI / 2
    const ix = cx + R1 * Math.cos(angle)
    const iy = cy + R1 * Math.sin(angle)
    const parts = imp.nombre.split(' ')
    const inits = ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
    const nid = `i${imp.id}`

    addN({ id: nid, x: ix, y: iy, tipo: 'imputado', label: parts[0] ?? imp.nombre,
           sub: imp.numCausasPrevias > 0 ? `${imp.numCausasPrevias} ant.` : undefined,
           alerta: imp.alertaReincidencia, initials: inits })
    addE({ from: 'cc', to: nid, tipo: 'participa' })

    const slicedOC = imp.otrosCasos.slice(0, 4)
    const M = slicedOC.length
    slicedOC.forEach((oc, j) => {
      const spread = M > 1 ? (j - (M - 1) / 2) * 0.38 : 0
      const ocAngle = angle + spread
      const ocId = `oc${oc.id}`
      addN({ id: ocId, x: cx + R2 * Math.cos(ocAngle), y: cy + R2 * Math.sin(ocAngle),
             tipo: 'otro_caso', label: `Caso ${oc.numeroCaso}`, sub: oc.tipoDelitoNombre, initials: `${oc.numeroCaso}` })
      addE({ from: nid, to: ocId, tipo: 'aparece_en' })

      const slicedCI = oc.coImputados.slice(0, 2)
      const P = slicedCI.length
      slicedCI.forEach((ci, k) => {
        const ciSpread = P > 1 ? (k - 0.5) * 0.28 : 0
        const ciAngle = ocAngle + ciSpread
        const ciId = `ci${ci.id}`
        addN({ id: ciId, x: cx + R3 * Math.cos(ciAngle), y: cy + R3 * Math.sin(ciAngle),
               tipo: 'co_imputado', label: ci.nombre.split(' ')[0] ?? ci.nombre,
               initials: ci.nombre[0]?.toUpperCase() ?? '?' })
        addE({ from: ocId, to: ciId, tipo: 'co_imputado' })
      })
    })
  })

  return { nodes, edges, W, H }
}

function RedAsociativaModal({ casoId, numeroCaso, onClose }: {
  casoId: number; numeroCaso: number; onClose: () => void
}) {
  const { data, isLoading } = useRedAsociativa(casoId)
  const hasConnections = data?.imputados.some(i => i.otrosCasos.length > 0) ?? false

  const nrFill = (n: GNode) =>
    n.tipo === 'caso_central' ? '#1e3a5f'
    : n.tipo === 'imputado' ? (n.alerta ? '#b91c1c' : '#2563eb')
    : n.tipo === 'otro_caso' ? '#6b7280' : '#9ca3af'
  const nrRadius = (tipo: NodeTipo) =>
    tipo === 'caso_central' ? 28 : tipo === 'imputado' ? 21 : tipo === 'otro_caso' ? 16 : 11
  const edgeStroke = (t: EdgeTipo) => t === 'participa' ? '#1e3a5f' : t === 'aparece_en' ? '#6b7280' : '#d1d5db'
  const edgeDash   = (t: EdgeTipo) => t === 'aparece_en' ? '6 3' : t === 'co_imputado' ? '3 3' : undefined

  const { nodes = [], edges = [], W = 720, H = 460 } = data ? buildGrafo(data, numeroCaso) : {}

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gris-borde shrink-0">
          <div>
            <h2 className="text-base font-bold text-azul">Red Asociativa</h2>
            <p className="text-xs text-texto-suave">Caso {numeroCaso} · Conexiones por número de documento</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-texto-tenue hover:text-azul">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-sm text-texto-tenue animate-pulse">
              Construyendo red…
            </div>
          ) : !data || data.imputados.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-texto-suave">
              Este caso no tiene imputados registrados.
            </div>
          ) : (
            <>
              {!hasConnections && (
                <p className="text-center text-xs text-texto-tenue py-2">
                  No se encontraron conexiones con otros casos en el sistema.
                </p>
              )}
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 440 }}>
                {/* Edges */}
                {edges.map((e, i) => {
                  const f = nodes.find(n => n.id === e.from)
                  const t = nodes.find(n => n.id === e.to)
                  if (!f || !t) return null
                  return (
                    <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                      stroke={edgeStroke(e.tipo)}
                      strokeWidth={e.tipo === 'participa' ? 2 : 1.5}
                      strokeDasharray={edgeDash(e.tipo)}
                      opacity={e.tipo === 'co_imputado' ? 0.35 : 0.65}
                    />
                  )
                })}
                {/* Nodes */}
                {nodes.map(node => {
                  const r = nrRadius(node.tipo)
                  const fill = nrFill(node)
                  const labelY = node.y + r + 13
                  const fontSize = node.tipo === 'caso_central' ? 13 : node.tipo === 'imputado' ? 10 : 8
                  return (
                    <g key={node.id}>
                      <circle cx={node.x} cy={node.y} r={r} fill={fill} stroke="white" strokeWidth={2} />
                      <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                        fontSize={fontSize} fill="white" fontWeight="700">
                        {node.initials.slice(0, 2)}
                      </text>
                      <text x={node.x} y={labelY} textAnchor="middle"
                        fontSize={node.tipo === 'co_imputado' ? 9 : 10}
                        fill="#374151" fontWeight={node.tipo === 'imputado' ? '600' : '400'}>
                        {node.label.length > 13 ? node.label.slice(0, 12) + '…' : node.label}
                      </text>
                      {node.sub && (
                        <text x={node.x} y={labelY + 11} textAnchor="middle" fontSize={8} fill="#9ca3af">
                          {node.sub.length > 15 ? node.sub.slice(0, 14) + '…' : node.sub}
                        </text>
                      )}
                      {node.alerta && (
                        <circle cx={node.x + r - 3} cy={node.y - r + 3} r={5} fill="#f59e0b" stroke="white" strokeWidth={1} />
                      )}
                    </g>
                  )
                })}
              </svg>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="shrink-0 flex flex-wrap gap-4 px-6 py-3 border-t border-gris-borde bg-azul-suave text-[11px] text-texto-suave">
          {([
            ['#1e3a5f', 'Caso central'],
            ['#2563eb', 'Imputado'],
            ['#b91c1c', 'Alerta reincidencia'],
            ['#6b7280', 'Caso vinculado'],
            ['#9ca3af', 'Co-imputado'],
          ] as [string, string][]).map(([color, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── CasoCard (componente exportado) ──────────────────────────────────────────

export function CasoCard({ caso }: { caso: CasoResumen }) {
  const [open, setOpen] = useState(false)

  const badge  = BADGE[caso.tipoDelito]  ?? { label: caso.tipoDelitoNombre, cls: 'bg-azul-claro text-azul border border-azul-medio' }
  const estado = ESTADO[caso.estadoCausa] ?? { label: caso.estadoCausaNombre, cls: 'bg-azul-claro text-azul border border-azul-medio' }

  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden transition-all cursor-pointer
                  ${open ? 'border-azul shadow-md' : 'border-gris-borde hover:border-azul-medio hover:shadow-sm'}`}
      onClick={() => setOpen(!open)}
    >
      {/* Cabecera */}
      <div className="grid gap-3 p-3.5 pr-4" style={{ gridTemplateColumns: '36px 1fr auto' }}>
        <div className="w-8 h-8 rounded-full bg-azul text-white flex items-center justify-center text-xs font-semibold mt-0.5 flex-shrink-0">
          {caso.numeroCaso}
        </div>

        <div>
          <div className="text-sm font-semibold text-azul leading-tight mb-0.5">
            {caso.tipoDelitoNombre}
          </div>
          <div className="text-xs text-texto-suave mb-0.5">
            {formatFecha(caso.fechaHecho)}
            {caso.unidadPolicial && ` · ${caso.unidadPolicial}`}
          </div>
          <div className="text-[11px] text-texto-tenue font-mono">RUC {caso.ruc}</div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${estado.cls}`}>
            {estado.label}
          </span>
          {!open && (
            <span className="text-[10px] text-texto-tenue mt-1">↓ expandir</span>
          )}
        </div>
      </div>

      {/* Detalle (lazy) */}
      {open && (
        <div onClick={(e) => e.stopPropagation()}>
          <CasoDetalle id={caso.id}/>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, forwardRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useParametricas } from '@/lib/hooks'
import { api } from '@/lib/api'
import { useIsAnalista } from '@/lib/store'
import { Topbar } from '@/components/layout/Topbar'

// ── Tipos del formulario ───────────────────────────────────────────────────────

type ImputadoForm = {
  apellidoPaterno: string
  apellidoMaterno: string
  nombres: string
  idTipoDocumento: string
  numeroDocumento: string
  fechaNacimiento: string
  idSexo: string
  numCausasPrevias: string
  numComplices: string
  alertaReincidencia: boolean
}

type VictimaForm = {
  nombre: string
  rut: string
  idCalidad: string
  idTipoLesiones: string
  observaciones: string
}

type IncautacionForm = {
  idTipoEspecie: string
  descripcion: string
  idSubtipoDroga: string
  cantidad: string
  unidadMedida: string
  nue: string
  idSubtipoArma: string
  calibre: string
  marcaArma: string
}

type VehiculoForm = {
  patente: string
  marca: string
  modelo: string
  color: string
  tipo: string
  idRolVehiculo: string
}

type FormValues = {
  numeroCaso: string
  fechaHecho: string
  horaHecho: string
  ruc: string
  folioBitacora: string
  idTipoDelitoPpal: string
  idEstadoCausa: string
  unidadPolicial: string
  plazoInvestDias: string
  relatoBreve: string
  diligencias: string
  observaciones: string
  lugar: { direccion: string; sector: string; idComuna: string; idTipoLugar: string }
  imputados: ImputadoForm[]
  victimas: VictimaForm[]
  incautaciones: IncautacionForm[]
  vehiculos: VehiculoForm[]
}

// ── Helpers UI ────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold text-texto-suave uppercase tracking-wide mb-1">{children}</label>
}

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full border border-gris-borde rounded px-3 py-1.5 text-sm text-azul placeholder-texto-tenue focus:outline-none focus:border-azul-medio transition-colors ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'

const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full border border-gris-borde rounded px-3 py-1.5 text-sm text-azul placeholder-texto-tenue focus:outline-none focus:border-azul-medio transition-colors resize-none ${className}`}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

const Sel = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full border border-gris-borde rounded px-3 py-1.5 text-sm text-azul focus:outline-none focus:border-azul-medio transition-colors bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  )
)
Sel.displayName = 'Sel'

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[11px] text-rojo mt-0.5">{msg}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-xs font-bold text-azul uppercase tracking-wider">{children}</h2>
      <div className="flex-1 h-px bg-gris-borde" />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function NuevoCasoPage({ params }: { params: { id: string } }) {
  const boletinId  = parseInt(params.id)
  const router     = useRouter()
  const esAnalista = useIsAnalista()
  const { data: param } = useParametricas()
  const [saving, setSaving] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  const { register, control, watch, setError, clearErrors, handleSubmit, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        numeroCaso: '', fechaHecho: '', horaHecho: '', ruc: '', folioBitacora: '',
        idTipoDelitoPpal: '', idEstadoCausa: '', unidadPolicial: '', plazoInvestDias: '',
        relatoBreve: '', diligencias: '', observaciones: '',
        lugar: { direccion: '', sector: '', idComuna: '', idTipoLugar: '' },
        imputados: [], victimas: [], incautaciones: [], vehiculos: [],
      },
    })

  const imputadosField     = useFieldArray({ control, name: 'imputados' })
  const victimasField      = useFieldArray({ control, name: 'victimas' })
  const incautacionesField = useFieldArray({ control, name: 'incautaciones' })
  const vehiculosField     = useFieldArray({ control, name: 'vehiculos' })

  const incWatch = watch('incautaciones')

  // Convierte string vacío / "0" a undefined; o al número
  const toId  = (s: string) => { const n = parseInt(s); return (!n || n <= 0) ? undefined : n }
  const toNum = (s: string) => { const n = parseFloat(s); return isNaN(n) ? undefined : n }

  const onSubmit = async (data: FormValues) => {
    clearErrors()
    let ok = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fail = (f: string, m: string) => { setError(f as any, { message: m }); ok = false }

    const numCaso = parseInt(data.numeroCaso ?? '')
    if (!data.numeroCaso?.trim() || isNaN(numCaso) || numCaso <= 0) fail('numeroCaso', 'Ingrese un número válido')
    if (!data.ruc?.trim())                                         fail('ruc', 'Requerido')
    if (!data.fechaHecho)                                          fail('fechaHecho', 'Requerido')
    if (!data.idTipoDelitoPpal || data.idTipoDelitoPpal === '0')   fail('idTipoDelitoPpal', 'Seleccione tipo de delito')
    if (!data.idEstadoCausa    || data.idEstadoCausa === '0')      fail('idEstadoCausa', 'Seleccione estado')
    if ((data.relatoBreve?.trim().length ?? 0) < 10)               fail('relatoBreve', 'Mínimo 10 caracteres')
    if (!data.lugar?.direccion?.trim())                          fail('lugar.direccion', 'Requerido')
    if (!data.lugar?.idComuna || data.lugar.idComuna === '0')    fail('lugar.idComuna', 'Seleccione comuna')

    if (!ok) return

    setSaving(true)
    setErrorGlobal(null)
    try {
      const resp = await api.post<{ id: number }>('/casos', {
        idBoletin:        boletinId,
        numeroCaso:       parseInt(data.numeroCaso),
        ruc:              data.ruc,
        fechaHecho:       data.fechaHecho,
        horaHecho:        data.horaHecho || undefined,
        folioBitacora:    data.folioBitacora || undefined,
        idTipoDelitoPpal: parseInt(data.idTipoDelitoPpal),
        idEstadoCausa:    parseInt(data.idEstadoCausa),
        unidadPolicial:   data.unidadPolicial || undefined,
        plazoInvestDias:  toId(data.plazoInvestDias),
        relatoBreve:      data.relatoBreve,
        diligencias:      data.diligencias || undefined,
        observaciones:    data.observaciones || undefined,
        lugar: {
          direccion:   data.lugar.direccion,
          sector:      data.lugar.sector || undefined,
          idComuna:    parseInt(data.lugar.idComuna),
          idTipoLugar: toId(data.lugar.idTipoLugar),
        },
      })

      const casoId = resp.id

      await Promise.all([
        ...data.imputados.map(imp => api.post(`/casos/${casoId}/imputados`, {
          apellidoPaterno:    imp.apellidoPaterno,
          apellidoMaterno:    imp.apellidoMaterno || undefined,
          nombres:            imp.nombres,
          idTipoDocumento:    parseInt(imp.idTipoDocumento),
          numeroDocumento:    imp.numeroDocumento,
          fechaNacimiento:    imp.fechaNacimiento || undefined,
          idSexo:             toId(imp.idSexo),
          numCausasPrevias:   parseInt(imp.numCausasPrevias) || 0,
          numComplices:       parseInt(imp.numComplices) || 0,
          alertaReincidencia: imp.alertaReincidencia,
        })),
        ...data.victimas.map(v => api.post(`/casos/${casoId}/victimas`, {
          nombre:         v.nombre || undefined,
          rut:            v.rut || undefined,
          idCalidad:      toId(v.idCalidad),
          idTipoLesiones: toId(v.idTipoLesiones),
          observaciones:  v.observaciones || undefined,
        })),
        ...data.incautaciones.map(inc => api.post(`/casos/${casoId}/incautaciones`, {
          idTipoEspecie:  parseInt(inc.idTipoEspecie),
          descripcion:    inc.descripcion,
          idSubtipoDroga: toId(inc.idSubtipoDroga),
          cantidad:       toNum(inc.cantidad),
          unidadMedida:   inc.unidadMedida || undefined,
          nue:            inc.nue || undefined,
          idSubtipoArma:  toId(inc.idSubtipoArma),
          calibre:        inc.calibre || undefined,
          marcaArma:      inc.marcaArma || undefined,
        })),
        ...data.vehiculos.map(veh => api.post(`/casos/${casoId}/vehiculos`, {
          patente:       veh.patente || undefined,
          marca:         veh.marca || undefined,
          modelo:        veh.modelo || undefined,
          color:         veh.color || undefined,
          tipo:          veh.tipo || undefined,
          idRolVehiculo: toId(veh.idRolVehiculo),
        })),
      ])

      router.push(`/boletines/${boletinId}`)
    } catch (e) {
      setErrorGlobal(e instanceof Error ? e.message : 'Error al guardar')
      setSaving(false)
    }
  }

  type P = { id: number; codigo: string; nombre: string }
  const par = param as {
    tiposDelito?: P[]; estadosCausa?: P[]; comunas?: P[]; tiposLugar?: P[]
    tiposDocumento?: P[]; sexos?: P[]; calidadesVictima?: P[]; tiposLesiones?: P[]
    tiposEspecie?: P[]; subtiposDroga?: P[]; subtiposArma?: P[]; rolesVehiculo?: P[]
  } | undefined

  if (!esAnalista) {
    return (
      <div className="min-h-screen flex flex-col bg-gris-bg">
        <Topbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-sm text-texto-suave">No tiene permisos para ingresar casos.</p>
          <Link href={`/boletines/${boletinId}`} className="text-xs text-azul underline">
            ← Volver al boletín
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gris-bg">
      <Topbar />

      <div className="bg-white border-b border-gris-borde px-7 py-4 flex items-center gap-4 flex-shrink-0">
        <Link href={`/boletines/${boletinId}`} className="text-texto-tenue hover:text-azul transition-colors text-sm">
          ← Volver al boletín
        </Link>
        <div className="w-px h-5 bg-gris-borde" />
        <div>
          <div className="text-[10px] text-rojo font-semibold uppercase tracking-wider">Boletín #{boletinId}</div>
          <h1 className="font-serif text-lg font-semibold text-azul">Ingresar nuevo caso</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-7 py-6 flex flex-col gap-6">

          {errorGlobal && (
            <div className="bg-[#fff0f0] border border-rojo-borde text-rojo text-sm px-4 py-3 rounded">
              {errorGlobal}
            </div>
          )}

          {/* ── 1. Identificación ─────────────────────────────────────────── */}
          <div className="bg-white border border-gris-borde rounded-lg px-6 py-5">
            <SectionTitle>Identificación del caso</SectionTitle>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label>N° Caso *</Label>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="1" {...register('numeroCaso')} />
                <ErrorMsg msg={errors.numeroCaso?.message} />
              </div>
              <div className="col-span-2">
                <Label>RUC *</Label>
                <Input placeholder="1234567-8" {...register('ruc')} />
                <ErrorMsg msg={errors.ruc?.message} />
              </div>
              <div>
                <Label>Folio bitácora</Label>
                <Input placeholder="opcional" {...register('folioBitacora')} />
              </div>
              <div>
                <Label>Fecha del hecho *</Label>
                <Input type="date" {...register('fechaHecho')} />
                <ErrorMsg msg={errors.fechaHecho?.message} />
              </div>
              <div>
                <Label>Hora aproximada</Label>
                <Input type="time" {...register('horaHecho')} />
              </div>
            </div>
          </div>

          {/* ── 2. Tipo de hecho ──────────────────────────────────────────── */}
          <div className="bg-white border border-gris-borde rounded-lg px-6 py-5">
            <SectionTitle>Tipo de hecho y estado</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de delito principal *</Label>
                <Sel {...register('idTipoDelitoPpal')}>
                  <option value="">Seleccionar…</option>
                  {par?.tiposDelito?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </Sel>
                <ErrorMsg msg={errors.idTipoDelitoPpal?.message} />
              </div>
              <div>
                <Label>Estado de la causa *</Label>
                <Sel {...register('idEstadoCausa')}>
                  <option value="">Seleccionar…</option>
                  {par?.estadosCausa?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </Sel>
                <ErrorMsg msg={errors.idEstadoCausa?.message} />
              </div>
              <div>
                <Label>Unidad policial</Label>
                <Input placeholder="Ej: OS-7, PDI, BRIPOL" {...register('unidadPolicial')} />
              </div>
              <div>
                <Label>Plazo investigación (días)</Label>
                <Sel {...register('plazoInvestDias')}>
                  <option value="">Sin plazo</option>
                  {[30, 60, 90, 120, 180].map(p => <option key={p} value={p}>{p} días</option>)}
                </Sel>
              </div>
            </div>
          </div>

          {/* ── 3. Lugar ──────────────────────────────────────────────────── */}
          <div className="bg-white border border-gris-borde rounded-lg px-6 py-5">
            <SectionTitle>Lugar del hecho</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Dirección *</Label>
                <Input placeholder="Av. El Santo 1234" {...register('lugar.direccion')} />
                <ErrorMsg msg={errors.lugar?.direccion?.message} />
              </div>
              <div>
                <Label>Sector / barrio</Label>
                <Input placeholder="Ej: Las Compañías" {...register('lugar.sector')} />
              </div>
              <div>
                <Label>Comuna *</Label>
                <Sel {...register('lugar.idComuna')}>
                  <option value="">Seleccionar…</option>
                  {par?.comunas?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Sel>
                <ErrorMsg msg={errors.lugar?.idComuna?.message} />
              </div>
              <div>
                <Label>Tipo de lugar</Label>
                <Sel {...register('lugar.idTipoLugar')}>
                  <option value="">Sin especificar</option>
                  {par?.tiposLugar?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </Sel>
              </div>
            </div>
          </div>

          {/* ── 4. Relato ─────────────────────────────────────────────────── */}
          <div className="bg-white border border-gris-borde rounded-lg px-6 py-5">
            <SectionTitle>Relato y diligencias</SectionTitle>
            <div className="flex flex-col gap-4">
              <div>
                <Label>Relato breve *</Label>
                <Textarea rows={4} placeholder="Describe brevemente los hechos…" {...register('relatoBreve')} />
                <ErrorMsg msg={errors.relatoBreve?.message} />
              </div>
              <div>
                <Label>Diligencias realizadas</Label>
                <Textarea rows={3} placeholder="Allanamientos, detenciones, pericias…" {...register('diligencias')} />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea rows={2} placeholder="Información adicional relevante…" {...register('observaciones')} />
              </div>
            </div>
          </div>

          {/* ── 5. Imputados ──────────────────────────────────────────────── */}
          <div className="bg-white border border-gris-borde rounded-lg px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Imputados</SectionTitle>
              <button type="button" onClick={() => imputadosField.append({
                apellidoPaterno: '', apellidoMaterno: '', nombres: '',
                idTipoDocumento: '', numeroDocumento: '', fechaNacimiento: '',
                idSexo: '', numCausasPrevias: '0', numComplices: '0', alertaReincidencia: false,
              })} className="text-xs text-azul border border-azul-medio rounded px-3 py-1 hover:bg-azul-suave transition-colors">
                + Agregar imputado
              </button>
            </div>
            {imputadosField.fields.length === 0 && (
              <p className="text-xs text-texto-tenue text-center py-4">No se han agregado imputados.</p>
            )}
            {imputadosField.fields.map((field, i) => (
              <div key={field.id} className="border border-gris-borde rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-azul">Imputado {i + 1}</span>
                  <button type="button" onClick={() => imputadosField.remove(i)} className="text-[11px] text-rojo hover:underline">Eliminar</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Apellido paterno *</Label>
                    <Input {...register(`imputados.${i}.apellidoPaterno`)} />
                  </div>
                  <div>
                    <Label>Apellido materno</Label>
                    <Input {...register(`imputados.${i}.apellidoMaterno`)} />
                  </div>
                  <div>
                    <Label>Nombres *</Label>
                    <Input {...register(`imputados.${i}.nombres`)} />
                  </div>
                  <div>
                    <Label>Tipo documento *</Label>
                    <Sel {...register(`imputados.${i}.idTipoDocumento`)}>
                      <option value="">Seleccionar…</option>
                      {par?.tiposDocumento?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </Sel>
                  </div>
                  <div>
                    <Label>N° documento *</Label>
                    <Input placeholder="12345678-9" {...register(`imputados.${i}.numeroDocumento`)} />
                  </div>
                  <div>
                    <Label>Fecha nacimiento</Label>
                    <Input type="date" {...register(`imputados.${i}.fechaNacimiento`)} />
                  </div>
                  <div>
                    <Label>Sexo</Label>
                    <Sel {...register(`imputados.${i}.idSexo`)}>
                      <option value="">No especifica</option>
                      {par?.sexos?.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </Sel>
                  </div>
                  <div>
                    <Label>Causas previas</Label>
                    <Input type="number" min={0} {...register(`imputados.${i}.numCausasPrevias`)} />
                  </div>
                  <div>
                    <Label>N° cómplices</Label>
                    <Input type="number" min={0} {...register(`imputados.${i}.numComplices`)} />
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <input type="checkbox" id={`alerta-${i}`} {...register(`imputados.${i}.alertaReincidencia`)} className="accent-rojo" />
                    <label htmlFor={`alerta-${i}`} className="text-xs text-texto-suave">Alerta de reincidencia</label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── 6. Víctimas ───────────────────────────────────────────────── */}
          <div className="bg-white border border-gris-borde rounded-lg px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Víctimas</SectionTitle>
              <button type="button" onClick={() => victimasField.append({ nombre: '', rut: '', idCalidad: '', idTipoLesiones: '', observaciones: '' })}
                className="text-xs text-azul border border-azul-medio rounded px-3 py-1 hover:bg-azul-suave transition-colors">
                + Agregar víctima
              </button>
            </div>
            {victimasField.fields.length === 0 && <p className="text-xs text-texto-tenue text-center py-4">No se han agregado víctimas.</p>}
            {victimasField.fields.map((field, i) => (
              <div key={field.id} className="border border-gris-borde rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-azul">Víctima {i + 1}</span>
                  <button type="button" onClick={() => victimasField.remove(i)} className="text-[11px] text-rojo hover:underline">Eliminar</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nombre</Label><Input placeholder="Nombre y apellidos" {...register(`victimas.${i}.nombre`)} /></div>
                  <div><Label>RUT</Label><Input placeholder="12345678-9" {...register(`victimas.${i}.rut`)} /></div>
                  <div>
                    <Label>Calidad de víctima</Label>
                    <Sel {...register(`victimas.${i}.idCalidad`)}>
                      <option value="">No especifica</option>
                      {par?.calidadesVictima?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </Sel>
                  </div>
                  <div>
                    <Label>Tipo de lesiones</Label>
                    <Sel {...register(`victimas.${i}.idTipoLesiones`)}>
                      <option value="">Sin lesiones / No especifica</option>
                      {par?.tiposLesiones?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </Sel>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── 7. Incautaciones ──────────────────────────────────────────── */}
          <div className="bg-white border border-gris-borde rounded-lg px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Incautaciones / especies</SectionTitle>
              <button type="button" onClick={() => incautacionesField.append({ idTipoEspecie: '', descripcion: '', idSubtipoDroga: '', cantidad: '', unidadMedida: '', nue: '', idSubtipoArma: '', calibre: '', marcaArma: '' })}
                className="text-xs text-azul border border-azul-medio rounded px-3 py-1 hover:bg-azul-suave transition-colors">
                + Agregar especie
              </button>
            </div>
            {incautacionesField.fields.length === 0 && <p className="text-xs text-texto-tenue text-center py-4">No se han registrado incautaciones.</p>}
            {incautacionesField.fields.map((field, i) => {
              const tipoId = parseInt(incWatch?.[i]?.idTipoEspecie ?? '')
              const esDroga = par?.tiposEspecie?.find(t => t.id === tipoId)?.codigo === 'droga'
              const esArma  = par?.tiposEspecie?.find(t => t.id === tipoId)?.codigo === 'arma'
              return (
                <div key={field.id} className="border border-gris-borde rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-azul">Especie {i + 1}</span>
                    <button type="button" onClick={() => incautacionesField.remove(i)} className="text-[11px] text-rojo hover:underline">Eliminar</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo de especie *</Label>
                      <Sel {...register(`incautaciones.${i}.idTipoEspecie`)}>
                        <option value="">Seleccionar…</option>
                        {par?.tiposEspecie?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </Sel>
                    </div>
                    <div><Label>Descripción *</Label><Input placeholder="Descripción de la especie" {...register(`incautaciones.${i}.descripcion`)} /></div>
                    <div><Label>Cantidad</Label><Input type="number" step="0.001" min={0} {...register(`incautaciones.${i}.cantidad`)} /></div>
                    <div><Label>Unidad de medida</Label><Input placeholder="kg, gr, unidades…" {...register(`incautaciones.${i}.unidadMedida`)} /></div>
                    <div><Label>NUE</Label><Input placeholder="Número único de evidencia" {...register(`incautaciones.${i}.nue`)} /></div>
                    {esDroga && (
                      <div>
                        <Label>Subtipo de droga</Label>
                        <Sel {...register(`incautaciones.${i}.idSubtipoDroga`)}>
                          <option value="">Seleccionar…</option>
                          {par?.subtiposDroga?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </Sel>
                      </div>
                    )}
                    {esArma && <>
                      <div>
                        <Label>Subtipo de arma</Label>
                        <Sel {...register(`incautaciones.${i}.idSubtipoArma`)}>
                          <option value="">Seleccionar…</option>
                          {par?.subtiposArma?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </Sel>
                      </div>
                      <div><Label>Calibre</Label><Input placeholder=".38, 9mm…" {...register(`incautaciones.${i}.calibre`)} /></div>
                      <div><Label>Marca del arma</Label><Input {...register(`incautaciones.${i}.marcaArma`)} /></div>
                    </>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── 8. Vehículos ──────────────────────────────────────────────── */}
          <div className="bg-white border border-gris-borde rounded-lg px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Vehículos involucrados</SectionTitle>
              <button type="button" onClick={() => vehiculosField.append({ patente: '', marca: '', modelo: '', color: '', tipo: '', idRolVehiculo: '' })}
                className="text-xs text-azul border border-azul-medio rounded px-3 py-1 hover:bg-azul-suave transition-colors">
                + Agregar vehículo
              </button>
            </div>
            {vehiculosField.fields.length === 0 && <p className="text-xs text-texto-tenue text-center py-4">No se han registrado vehículos.</p>}
            {vehiculosField.fields.map((field, i) => (
              <div key={field.id} className="border border-gris-borde rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-azul">Vehículo {i + 1}</span>
                  <button type="button" onClick={() => vehiculosField.remove(i)} className="text-[11px] text-rojo hover:underline">Eliminar</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Patente</Label><Input placeholder="AB-1234" {...register(`vehiculos.${i}.patente`)} /></div>
                  <div><Label>Marca</Label><Input placeholder="Toyota, Chevrolet…" {...register(`vehiculos.${i}.marca`)} /></div>
                  <div><Label>Modelo</Label><Input placeholder="Hilux, D-Max…" {...register(`vehiculos.${i}.modelo`)} /></div>
                  <div><Label>Color</Label><Input placeholder="Blanco, Negro…" {...register(`vehiculos.${i}.color`)} /></div>
                  <div><Label>Tipo de vehículo</Label><Input placeholder="Camioneta, Sedan…" {...register(`vehiculos.${i}.tipo`)} /></div>
                  <div>
                    <Label>Rol</Label>
                    <Sel {...register(`vehiculos.${i}.idRolVehiculo`)}>
                      <option value="">Sin especificar</option>
                      {par?.rolesVehiculo?.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </Sel>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Botones ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Link href={`/boletines/${boletinId}`} className="px-5 py-2 border border-gris-borde text-texto-suave text-sm rounded hover:border-azul-medio transition-colors">
              Cancelar
            </Link>
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-azul hover:bg-azul-hover text-white text-sm font-medium rounded transition-colors disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar caso'}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}

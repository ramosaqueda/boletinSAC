import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

// ── Paraméricas ──────────────────────────────────────────────────────────────

export function useParametricas() {
  return useQuery({
    queryKey: ['parametricas'],
    queryFn:  () => api.get<Record<string, { id: number; codigo: string; nombre: string }[]>>('/parametricas'),
    staleTime: Infinity, // No cambian frecuentemente
  })
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalBoletines:         number
  totalCasos:             number
  casosConImputado:       number
  casosPrisionPreventiva: number
  casosPorEstado:         { codigo: string; nombre: string; total: number }[]
  casosPorDelito:         { codigo: string; nombre: string; total: number }[]
  ultimosBoletines: {
    id: number; numero: number; fechaDesde: string; fechaHasta: string
    estado: string; estadoNombre: string; totalCasos: number
  }[]
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => api.get<DashboardStats>('/dashboard'),
    refetchInterval: 60_000,
  })
}

// ── Boletines ─────────────────────────────────────────────────────────────────

export interface ResumenBoletin {
  id:           number
  numero:       number
  fechaDesde:   string
  fechaHasta:   string
  estado:       string
  estadoNombre: string
  analista:     string | null
  resumen:      string | null
}

export function useBoletines() {
  return useQuery({
    queryKey: ['boletines'],
    queryFn:  () => api.get<ResumenBoletin[]>('/boletines'),
  })
}

export interface CasoResumen {
  id:               number
  idBoletin:        number
  numeroCaso:       number
  fechaHecho:       string
  ruc:              string
  tipoDelito:       string
  tipoDelitoNombre: string
  estadoCausa:      string
  estadoCausaNombre:string
  unidadPolicial:   string | null
}

export interface BoletinDetalle extends ResumenBoletin {
  provincia:  string
  region:     string
  fechaPub:   string | null
  casos:      CasoResumen[]
}

export function useBoletin(id: number) {
  return useQuery({
    queryKey: ['boletines', id],
    queryFn:  () => api.get<BoletinDetalle>(`/boletines/${id}`),
    enabled:  !!id,
  })
}

// ── Casos ─────────────────────────────────────────────────────────────────────

export interface Imputado {
  id:                 number
  apellidoPaterno:    string
  apellidoMaterno:    string | null
  nombres:            string
  tipoDocumento:      string
  numeroDocumento:    string
  fechaNacimiento:    string | null
  sexo:               string | null
  nacionalidad:       string | null
  numCausasPrevias:   number
  numComplices:       number
  alertaReincidencia: boolean
  fotoUrl:            string | null
}

export interface Incautacion {
  id:               number
  tipoEspecie:      string
  tipoEspecieNombre:string
  descripcion:      string
  subtipoDroga:     string | null
  cantidad:         string | null
  unidadMedida:     string | null
  nue:              string | null
  subtipoArma:      string | null
  calibre:          string | null
  marcaArma:        string | null
}

export interface Noticia {
  id:             number
  url:            string
  medio:          string | null
  titular:        string | null
  bajada:         string | null
  fechaPub:       string | null
  estadoRevision: string | null
}

export interface CasoCompleto {
  id:               number
  idBoletin:        number
  numeroCaso:       number
  fechaHecho:       string
  horaHecho:        string | null
  ruc:              string
  folioBitacora:    string | null
  tipoDelito:       string
  tipoDelitoNombre: string
  tipoDelitoSec:    string | null
  relatoBreve:      string | null
  estadoCausa:      string
  estadoCausaNombre:string
  plazoInvestDias:  number | null
  fiscal:           string | null
  unidadPolicial:   string | null
  diligencias:      string | null
  observaciones:    string | null
  urlNoticia1:      string | null
  urlNoticia2:      string | null
  lugares:          { id: number; direccion: string; sector: string | null; comuna: string; tipoLugar: string | null; coordenadaLat: string | null; coordenadaLon: string | null }[]
  imputados:        Imputado[]
  victimas:         { id: number; nombre: string | null; rut: string | null; calidad: string | null; tipoLesiones: string | null }[]
  incautaciones:    Incautacion[]
  vehiculos:        { id: number; patente: string | null; marca: string | null; modelo: string | null; color: string | null; rol: string | null }[]
  fotografias:      { id: number; tipoFoto: string; descripcion: string | null; archivoUrl: string; orden: number }[]
  noticias:         Noticia[]
  hashtags:         { id: number; texto: string }[]
}

export function useCaso(id: number) {
  return useQuery({
    queryKey: ['casos', id],
    queryFn:  () => api.get<CasoCompleto>(`/casos/${id}`),
    enabled:  !!id,
  })
}

export function useCrearCaso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post('/casos', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boletines'] }),
  })
}

export function useCrearBoletin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post<ResumenBoletin>('/boletines', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boletines'] }),
  })
}

export function useActualizarBoletin(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      numero?: number
      fechaDesde?: string
      fechaHasta?: string
      provincia?: string
      region?: string
      resumen?: string
    }) => api.patch(`/boletines/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boletines', id] })
      qc.invalidateQueries({ queryKey: ['boletines'] })
    },
  })
}

export function useEliminarBoletin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/boletines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boletines'] }),
  })
}

export function useActualizarEstadoBoletin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, accion }: { id: number; accion: 'publicar' | 'despublicar' }) =>
      api.patch(`/boletines/${id}/${accion}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boletines'] }),
  })
}

export function usePublicarBoletin(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch(`/boletines/${id}/publicar`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boletines', id] })
      qc.invalidateQueries({ queryKey: ['boletines'] })
    },
  })
}

export function useDespublicarBoletin(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch(`/boletines/${id}/despublicar`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boletines', id] })
      qc.invalidateQueries({ queryKey: ['boletines'] })
    },
  })
}

// ── Actualizar caso ───────────────────────────────────────────────────────────

export function useEliminarCaso(boletinId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (casoId: number) => api.delete(`/casos/${casoId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boletines', boletinId] })
      qc.invalidateQueries({ queryKey: ['boletines'] })
    },
  })
}

export function useActualizarCaso(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.patch(`/casos/${casoId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['casos', casoId] })
      qc.invalidateQueries({ queryKey: ['boletines'] })
    },
  })
}

// ── Imputados ─────────────────────────────────────────────────────────────────

export function useCrearImputado(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post(`/casos/${casoId}/imputados`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useEliminarImputado(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imputadoId: number) => api.delete(`/casos/${casoId}/imputados/${imputadoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useActualizarLugar(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      direccion?:     string
      sector?:        string | null
      idComuna?:      number
      idTipoLugar?:   number | null
      coordenadaLat?: number | null
      coordenadaLon?: number | null
    }) => api.patch(`/casos/${casoId}/lugar`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useActualizarFotoImputado(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ imputadoId, fotoUrl }: { imputadoId: number; fotoUrl: string | null }) =>
      api.patch(`/casos/${casoId}/imputados/${imputadoId}/foto`, { fotoUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

// ── Víctimas ──────────────────────────────────────────────────────────────────

export function useCrearVictima(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post(`/casos/${casoId}/victimas`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useEliminarVictima(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (victimaId: number) => api.delete(`/casos/${casoId}/victimas/${victimaId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

// ── Incautaciones ─────────────────────────────────────────────────────────────

export function useCrearIncautacion(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post(`/casos/${casoId}/incautaciones`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useEliminarIncautacion(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (incautacionId: number) => api.delete(`/casos/${casoId}/incautaciones/${incautacionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

// ── Scraping noticias ─────────────────────────────────────────────────────────

export interface ScrapedPreview {
  titulo:      string | null
  descripcion: string | null
  imagen:      string | null
  medio:       string | null
  fechaPub:    string | null
}

export function useScrapeUrl() {
  return useMutation({
    mutationFn: (url: string) =>
      api.get<ScrapedPreview>(`/noticias/scrape?url=${encodeURIComponent(url)}`),
  })
}

// ── Noticias ──────────────────────────────────────────────────────────────────

export function useCrearNoticia(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post(`/casos/${casoId}/noticias`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useEliminarNoticia(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noticiaId: number) => api.delete(`/casos/${casoId}/noticias/${noticiaId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

// ── Fotografías ───────────────────────────────────────────────────────────────

export function useSubirFotografia(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => api.upload<{ id: number; archivoUrl: string }>(`/casos/${casoId}/fotografias`, formData),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useFotoDesdeUrl(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { imageUrl: string; descripcion?: string }) =>
      api.post(`/casos/${casoId}/fotografias/from-url`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

// ── Hashtags ──────────────────────────────────────────────────────────────────

export function useHashtagSugerencias(q: string) {
  return useQuery({
    queryKey: ['hashtags', q],
    queryFn:  () => api.get<{ id: number; texto: string }[]>(`/hashtags?q=${encodeURIComponent(q)}`),
    staleTime: 30_000,
  })
}

export function useAgregarHashtag(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (texto: string) => api.post(`/casos/${casoId}/hashtags`, { texto }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useEliminarHashtag(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (hashtagId: number) => api.delete(`/casos/${casoId}/hashtags/${hashtagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

export function useEliminarFotografia(casoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fotoId: number) => api.delete(`/casos/${casoId}/fotografias/${fotoId}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['casos', casoId] }),
  })
}

// ── Red asociativa ─────────────────────────────────────────────────────────────

export interface ImputadoConexion {
  id:                 number
  nombre:             string
  numDoc:             string
  numCausasPrevias:   number
  alertaReincidencia: boolean
  fotoUrl:            string | null
  otrosCasos: {
    id:               number
    ruc:              string
    numeroCaso:       number
    tipoDelito:       string
    tipoDelitoNombre: string
    coImputados:      { id: number; nombre: string; numDoc: string }[]
  }[]
}

export interface RedAsociativa {
  imputados: ImputadoConexion[]
}

export function useRedAsociativa(casoId: number) {
  return useQuery({
    queryKey: ['red', casoId],
    queryFn:  () => api.get<RedAsociativa>(`/casos/${casoId}/red`),
    enabled:  !!casoId,
  })
}

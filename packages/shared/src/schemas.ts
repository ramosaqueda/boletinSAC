import { z } from 'zod'

export const RucSchema = z
  .string()
  .regex(/^\d{7,10}-[\dKk]$/, 'RUC inválido — formato esperado: 1234567-K')

export const BoletinInsertSchema = z.object({
  titulo: z.string().min(1).max(200),
  semana_inicio: z.string().date(),
  semana_fin: z.string().date(),
})

export const CasoInsertSchema = z.object({
  id_boletin: z.number().int().positive(),
  ruc: RucSchema,
  id_tipo_delito: z.number().int().positive(),
  id_estado_causa: z.number().int().positive(),
  id_fiscal: z.number().int().positive().optional(),
  id_lugar: z.number().int().positive().optional(),
  relato: z.string().optional(),
  fecha_hecho: z.string().datetime().optional(),
})

export type BoletinInsert = z.infer<typeof BoletinInsertSchema>
export type CasoInsert = z.infer<typeof CasoInsertSchema>

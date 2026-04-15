export interface ApiResponse<T> {
  data: T
  meta?: { total?: number; page?: number }
}

export interface ApiError {
  error: { code: string; message: string }
}

export type RolUsuario = 'analista' | 'fiscal' | 'supervisor' | 'administrador'
export type EstadoBoletin = 'borrador' | 'en_revision' | 'publicado'

'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UsuarioAuth {
  id:     number
  nombre: string
  email:  string
  rol:    { codigo: string; nombre: string }
}

interface AuthState {
  token:   string | null
  usuario: UsuarioAuth | null
  setAuth: (token: string, usuario: UsuarioAuth) => void
  logout:  () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:   null,
      usuario: null,
      setAuth: (token, usuario) => set({ token, usuario }),
      logout:  () => set({ token: null, usuario: null }),
    }),
    { name: 'ecoh-auth' },
  ),
)

const ROLES_ESCRITURA = ['analista', 'supervisor']

export function useIsAnalista() {
  return useAuthStore((s) => ROLES_ESCRITURA.includes(s.usuario?.rol.codigo ?? ''))
}

// ── Preferencias de apariencia ────────────────────────────────────────────────

export type Tema = 'claro' | 'oscuro' | 'elegante'

interface PrefsState {
  tema:        Tema
  fontSize:    number          // px, base 16
  setTema:     (t: Tema) => void
  setFontSize: (n: number) => void
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      tema:        'claro',
      fontSize:    16,
      setTema:     (tema)     => set({ tema }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    { name: 'ecoh-prefs' },
  ),
)

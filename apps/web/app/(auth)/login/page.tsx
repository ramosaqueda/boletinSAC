'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { LogoFiscalia } from '@/components/LogoFiscalia'

export default function LoginPage() {
  const router   = useRouter()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Error al iniciar sesión')
      setAuth(json.token, json.usuario)
      router.replace('/boletines')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-azul flex flex-col items-center justify-center p-6"
         style={{ background: 'linear-gradient(160deg, #1C3F81 0%, #122a58 100%)' }}>

      {/* Logo / cabecera institucional */}
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        <LogoFiscalia className="h-10 brightness-0 invert" />
        <div className="text-xs font-semibold tracking-widest text-white/50 uppercase">
          Ministerio Público · Región de Coquimbo
        </div>
        <div className="text-white text-2xl font-serif font-semibold leading-tight">
          Portal SAC
        </div>
        <div className="h-0.5 w-16 bg-rojo rounded"/>
        <div className="text-white/60 text-xs">
          Sistema de Gestión de Boletines de Criminalidad
        </div>
      </div>

      {/* Tarjeta de login */}
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border-t-4 border-rojo overflow-hidden">
        <div className="px-8 py-7">
          <h1 className="text-azul font-semibold text-base mb-6">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-texto-tenue">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="usuario@fiscaliadechile.cl"
                className="px-3 py-2.5 rounded-md border border-gris-borde text-sm text-texto
                           focus:outline-none focus:border-azul transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-texto-tenue">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="px-3 py-2.5 rounded-md border border-gris-borde text-sm text-texto
                           focus:outline-none focus:border-azul transition-colors"
              />
            </div>

            {error && (
              <div className="text-xs text-rojo bg-rojo-claro border border-rojo-borde rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 py-2.5 bg-rojo hover:bg-rojo-hover text-white font-semibold text-sm
                         rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando…' : 'Ingresar al sistema'}
            </button>
          </form>
        </div>

        <div className="px-8 py-3 bg-gris-bg border-t border-gris-borde text-[10px] text-texto-tenue text-center">
          Ingreso de analistas y supervisores · <a href="/boletines" className="underline hover:text-azul">Ver portal sin sesión</a>
        </div>
      </div>
    </div>
  )
}

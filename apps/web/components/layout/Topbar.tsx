'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore, usePrefsStore, type Tema } from '@/lib/store'
import { LogoFiscalia } from '@/components/LogoFiscalia'

interface TopbarProps {
  onNuevoCaso?: () => void
}

const TEMAS: { id: Tema; label: string; color: string; ring: string }[] = [
  { id: 'claro',    label: 'Claro',    color: '#f4f6f9', ring: '#1C3F81' },
  { id: 'oscuro',   label: 'Oscuro',   color: '#0a0e18', ring: '#4a7fd4' },
  { id: 'elegante', label: 'Índigo',   color: '#f8f7ff', ring: '#4f46e5' },
  { id: 'cyber',    label: 'Cyber',    color: '#02060e', ring: '#00b4ff' },
]

const FONT_SIZES = [13, 14, 15, 16, 17, 18, 20]

function AparienciaPanel({ onClose }: { onClose: () => void }) {
  const { tema, fontSize, setTema, setFontSize } = usePrefsStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-[200] w-56 rounded-lg shadow-xl border border-gris-borde bg-white py-3 px-3"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
    >
      {/* Tema */}
      <p className="text-[10px] font-bold text-texto-tenue uppercase tracking-wider mb-2 px-1">Tema</p>
      <div className="flex gap-2 mb-4">
        {TEMAS.map(t => (
          <button
            key={t.id}
            onClick={() => setTema(t.id)}
            title={t.label}
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: t.color,
              border: tema === t.id ? `2.5px solid ${t.ring}` : '2px solid #dde3ed',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.12s',
              transform: tema === t.id ? 'scale(1.1)' : 'scale(1)',
              boxShadow: tema === t.id ? `0 0 0 2px ${t.ring}40` : 'none',
            }}
          >
            {/* mini preview strip */}
            <span style={{
              position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
              display: 'block', width: 16, height: 3, borderRadius: 2,
              background: t.ring,
            }} />
          </button>
        ))}
      </div>
      <div className="flex justify-between mb-4 px-1">
        {TEMAS.map(t => (
          <span key={t.id} className="text-[9px] text-texto-tenue w-9 text-center">{t.label}</span>
        ))}
      </div>

      {/* Tamaño de fuente */}
      <p className="text-[10px] font-bold text-texto-tenue uppercase tracking-wider mb-2 px-1">Tamaño texto</p>
      <div className="flex items-center gap-2 px-1">
        <button
          onClick={() => { const i = FONT_SIZES.indexOf(fontSize); if (i > 0) setFontSize(FONT_SIZES[i - 1]!) }}
          disabled={fontSize <= FONT_SIZES[0]!}
          className="w-7 h-7 rounded border border-gris-borde text-texto-suave text-sm font-bold
                     hover:border-azul hover:text-azul transition-colors disabled:opacity-30 disabled:cursor-default"
        >−</button>

        <div className="flex-1 flex justify-center gap-1">
          {FONT_SIZES.map(s => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              style={{ fontSize: 9 + FONT_SIZES.indexOf(s), lineHeight: 1 }}
              className={`w-6 h-6 rounded transition-colors font-bold
                ${fontSize === s
                  ? 'bg-azul text-white'
                  : 'text-texto-tenue hover:text-azul'}`}
            >A</button>
          ))}
        </div>

        <button
          onClick={() => { const i = FONT_SIZES.indexOf(fontSize); if (i < FONT_SIZES.length - 1) setFontSize(FONT_SIZES[i + 1]!) }}
          disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]!}
          className="w-7 h-7 rounded border border-gris-borde text-texto-suave text-sm font-bold
                     hover:border-azul hover:text-azul transition-colors disabled:opacity-30 disabled:cursor-default"
        >+</button>
      </div>
    </div>
  )
}

export function Topbar({ onNuevoCaso }: TopbarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { usuario, logout } = useAuthStore()
  const [showPrefs, setShowPrefs] = useState(false)

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  const navItems = [
    { label: 'Inicio',          href: '/dashboard' },
    { label: 'Boletines',       href: '/boletines' },
    { label: 'Historial',       href: '/historial' },
    { label: 'Configuración',   href: '/configuracion' },
  ]

  return (
    <header className="flex items-stretch border-b-[3px] border-rojo sticky top-0 z-50 pt-2"
            style={{ background: 'rgb(var(--topbar-bg))', transition: 'background 0.25s ease' }}>

      {/* Logo */}
      <div className="flex items-center px-5 border-r border-white/15">
        <LogoFiscalia className="h-7 brightness-0 invert" />
      </div>

      {/* Título */}
      <div className="flex flex-col justify-center px-5 flex-1">
        <div className="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">
          Ministerio Público · Región de Coquimbo
        </div>
        <div className="text-sm font-medium text-white">
          Sistema de Gestión de Boletines SAC
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex items-stretch">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-5 text-xs border-l border-white/10 transition-all
                ${active
                  ? 'bg-white/10 text-white border-b-[3px] border-b-rojo -mb-[3px]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Acciones */}
      {onNuevoCaso && (
        <button
          onClick={onNuevoCaso}
          className="flex items-center gap-1.5 my-2.5 mx-3 px-4 py-1.5 bg-rojo hover:bg-rojo-hover
                     text-white text-xs font-medium rounded transition-colors whitespace-nowrap"
        >
          + Nuevo caso
        </button>
      )}

      {/* Apariencia */}
      <div className="relative flex items-center px-3 border-l border-white/10">
        <button
          onClick={() => setShowPrefs(v => !v)}
          title="Apariencia"
          className="w-7 h-7 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="10" cy="10" r="3"/>
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/>
          </svg>
        </button>
        {showPrefs && <AparienciaPanel onClose={() => setShowPrefs(false)} />}
      </div>

      {/* Usuario / sesión */}
      <div className="flex items-center gap-3 px-4 border-l border-white/10">
        {usuario ? (
          <>
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-medium text-white leading-tight">{usuario.nombre}</div>
              <div className="text-[10px] text-white/50">{usuario.rol?.nombre}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] text-white/50 hover:text-white transition-colors"
            >
              Salir
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-[11px] text-white/70 hover:text-white border border-white/20 hover:border-white/50 rounded px-3 py-1.5 transition-all"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  )
}

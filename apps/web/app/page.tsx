'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { useBoletines, type ResumenBoletin } from '@/lib/hooks'
import { useAuthStore, useIsAnalista } from '@/lib/store'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRango(desde: string, hasta: string) {
  const d1 = new Date(desde + 'T12:00:00')
  const d2 = new Date(hasta  + 'T12:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
  return `${fmt(d1)} al ${fmt(d2)} de ${d1.getFullYear()}`
}

function fmtCorto(desde: string, hasta: string) {
  const d1 = new Date(desde + 'T12:00:00')
  const d2 = new Date(hasta  + 'T12:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  return `${fmt(d1)} — ${fmt(d2)}`
}

// ── Botones de acción ─────────────────────────────────────────────────────────

function AccionBtn({
  href, icon, label, description, primary,
}: {
  href: string; icon: React.ReactNode; label: string; description: string; primary?: boolean
}) {
  return (
    <Link
      href={href}
      target="_blank"
      className={`flex flex-col items-center gap-2 px-5 py-4 rounded-xl border transition-all group
        ${primary
          ? 'bg-white text-azul border-white/40 hover:bg-white/90 shadow-lg'
          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
        }`}
    >
      <span className={`w-10 h-10 flex items-center justify-center rounded-lg
        ${primary ? 'bg-azul/10 text-azul group-hover:bg-azul group-hover:text-white' : 'bg-white/10 text-white'}
        transition-colors`}
      >
        {icon}
      </span>
      <span className={`text-xs font-bold uppercase tracking-wide ${primary ? 'text-azul' : 'text-white'}`}>
        {label}
      </span>
      <span className={`text-[10px] text-center leading-snug ${primary ? 'text-texto-tenue' : 'text-white/60'}`}>
        {description}
      </span>
    </Link>
  )
}

// ── Tarjeta del último boletín (hero) ─────────────────────────────────────────

function HeroCard({ b }: { b: ResumenBoletin }) {
  return (
    <div
      className="rounded-2xl overflow-hidden mb-8 shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #0f2659 0%, #1C3F81 55%, #2a5cbb 100%)',
      }}
    >
      {/* Encabezado */}
      <div className="px-8 pt-7 pb-5 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-white/10 px-2.5 py-1 rounded-full border border-rojo/30">
                Último boletín publicado
              </span>
              <span className="text-[10px] text-white/40 font-medium">
                N° {b.numero}
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-white leading-tight mb-1">
              Reporte de Criminalidad
            </h2>
            <p className="text-sm text-white/70 font-medium">
              {fmtRango(b.fechaDesde, b.fechaHasta)}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-5xl font-black text-white/10 leading-none select-none">{b.numero}</span>
          </div>
        </div>

        {b.resumen && (
          <div className="mt-4 p-4 rounded-xl bg-white/8 border border-white/15">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              Resumen ejecutivo
            </p>
            <p className="text-sm text-white/85 leading-relaxed line-clamp-3">{b.resumen}</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-8 py-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-4 text-center">
          Disponible en
        </p>
        <div className="grid grid-cols-3 gap-3">
          <AccionBtn
            href={`/boletines/${b.id}/slides`}
            primary
            label="Presentación"
            description="Vista interactiva slide a slide"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
                <path d="M9 10l3-3 3 3"/>
              </svg>
            }
          />
          <AccionBtn
            href={`/boletines/${b.id}/print`}
            label="PDF"
            description="Informe completo imprimible"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            }
          />
          <AccionBtn
            href={`/boletines/${b.id}`}
            label="Ver boletín"
            description="Navegación detallada por casos"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            }
          />
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta de boletín anterior ───────────────────────────────────────────────

function TarjetaBoletin({ b, esUltimo }: { b: ResumenBoletin; esUltimo?: boolean }) {
  return (
    <div className={`bg-white rounded-xl overflow-hidden hover:shadow-md transition-all group border ${esUltimo ? 'border-azul-medio' : 'border-gris-borde hover:border-azul-medio'}`}>
      {/* Franja lateral de color */}
      <div className="flex">
        <div className={`w-1 flex-shrink-0 transition-colors ${esUltimo ? 'bg-azul' : 'bg-azul-medio group-hover:bg-azul'}`} />

        <div className="flex-1 px-5 py-4">
          {/* Cabecera */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${esUltimo ? 'bg-azul' : 'bg-azul-claro'}`}>
                <span className={`text-sm font-black leading-none ${esUltimo ? 'text-white' : 'text-azul'}`}>{b.numero}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-texto-tenue">
                    Reporte N° {b.numero}
                  </div>
                  {esUltimo && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-azul text-white px-1.5 py-0.5 rounded-full">
                      Más reciente
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-azul">
                  {fmtCorto(b.fechaDesde, b.fechaHasta)}
                </div>
              </div>
            </div>
            {b.analista && (
              <span className="hidden sm:block text-[10px] text-texto-tenue flex-shrink-0 mt-1">{b.analista}</span>
            )}
          </div>

          {/* Resumen */}
          {b.resumen && (
            <p className="text-[11px] text-texto-suave leading-relaxed line-clamp-2 mb-3">
              {b.resumen}
            </p>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-2 pt-2 border-t border-gris-borde">
            <Link
              href={`/boletines/${b.id}/slides`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-azul bg-azul-claro hover:bg-azul hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
              Presentación
            </Link>
            <Link
              href={`/boletines/${b.id}/print`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-texto-suave border border-gris-borde hover:border-rojo hover:text-rojo transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              PDF
            </Link>
            <Link
              href={`/boletines/${b.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-texto-suave border border-gris-borde hover:border-azul-medio hover:text-azul transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Ver boletín
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: boletines, isLoading, error } = useBoletines()
  const { usuario, logout } = useAuthStore()
  const esAnalista = useIsAnalista()

  // Solo boletines publicados, ordenados desc por número
  const publicados = useMemo(() => {
    if (!boletines) return []
    return [...boletines]
      .filter(b => b.estado === 'publicado')
      .sort((a, b) => b.numero - a.numero)
  }, [boletines])

  const ultimo = publicados[0] ?? null

  return (
    <div className="min-h-screen flex flex-col bg-gris-bg">

      {/* ── Header ── */}
      <header
        className="flex items-center border-b-[3px] border-rojo sticky top-0 z-50 px-5 py-2 gap-4"
        style={{ background: 'rgb(var(--topbar-bg))' }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.fiscaliadechile.cl/themes/fiscalia_theme/logo_fiscalia.svg"
          alt="Fiscalía de Chile"
          className="h-7 brightness-0 invert"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="text-[11px] font-semibold text-white tracking-wider uppercase leading-tight border-l border-white/20 pl-4">
          Fiscalía<br/>de Chile
        </div>
        <div className="flex-1 pl-2 hidden sm:block">
          <div className="text-[9px] text-white/40 uppercase tracking-wider">Ministerio Público · Región de Coquimbo</div>
          <div className="text-xs font-medium text-white">Boletines de Criminalidad SAC</div>
        </div>

        {/* Panel analista */}
        {esAnalista && (
          <Link
            href="/boletines"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] rounded border border-white/20 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="7" height="7" rx="1"/>
              <rect x="11" y="3" width="7" height="7" rx="1"/>
              <rect x="2" y="11" width="7" height="7" rx="1"/>
              <rect x="11" y="11" width="7" height="7" rx="1"/>
            </svg>
            Panel analista
          </Link>
        )}

        {/* Usuario */}
        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          {usuario ? (
            <>
              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-medium text-white leading-tight">{usuario.nombre}</div>
                <div className="text-[10px] text-white/50">{usuario.rol?.nombre}</div>
              </div>
              <button
                onClick={() => { logout(); window.location.href = '/login' }}
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

      {/* ── Contenido ── */}
      <main className="flex-1 py-8 px-5 max-w-5xl mx-auto w-full">

        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-sm text-texto-tenue">Cargando boletines…</div>
          </div>
        )}

        {error && (
          <div className="text-sm text-rojo bg-[#fff0f0] border border-rojo-borde rounded px-4 py-3 mb-6">
            Error al cargar: {error.message}
          </div>
        )}

        {!isLoading && !error && publicados.length === 0 && (
          <div className="text-center py-20 text-texto-tenue text-sm">
            No hay boletines publicados aún.
          </div>
        )}

        {ultimo && (
          <>
            <HeroCard b={ultimo} />

            <div>
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="h-px flex-1 bg-gris-borde" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-texto-tenue">
                  Todos los boletines publicados
                </span>
                <div className="h-px flex-1 bg-gris-borde" />
              </div>
              <div className="flex flex-col gap-3">
                {publicados.map((b, i) => (
                  <TarjetaBoletin key={b.id} b={b} esUltimo={i === 0} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Pie de página ── */}
      <footer className="border-t border-gris-borde px-5 py-4 text-center">
        <p className="text-[10px] text-texto-tenue">
          Fiscalía de Chile · Ministerio Público · Región de Coquimbo · Sistema SAC
        </p>
      </footer>
    </div>
  )
}

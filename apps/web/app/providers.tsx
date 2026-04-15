'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { usePrefsStore } from '@/lib/store'

function ThemeApplier() {
  const { tema, fontSize } = usePrefsStore()

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', tema === 'claro' ? '' : tema)
    html.style.fontSize = `${fontSize}px`
  }, [tema, fontSize])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  }))
  return (
    <QueryClientProvider client={qc}>
      <ThemeApplier />
      {children}
    </QueryClientProvider>
  )
}

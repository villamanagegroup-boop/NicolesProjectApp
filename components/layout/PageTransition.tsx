'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Start from invisible
    el.style.transition = 'none'
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px)'
    // On next frame, animate in
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.24s ease, transform 0.24s ease'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return (
    <div ref={ref} style={{ opacity: 1, willChange: 'opacity, transform' }}>
      {children}
    </div>
  )
}

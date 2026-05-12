'use client'

// components/ui/FileDropZone.tsx
// Wraps any element to make it a drag-and-drop target. Visual feedback is
// a gold dashed outline + faint tint while a file is being dragged over.
//
// Counter-based enter/leave tracking is intentional — naive dragLeave fires
// for every child element exited and would flicker the highlight. The
// counter only resets to 0 when the cursor truly leaves the wrapper.

import { useCallback, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react'

interface Props {
  /** Called with the dropped files. Single-file callers can grab files[0]. */
  onFiles: (files: File[]) => void
  /** When false (default), only the first dropped file is forwarded. */
  multiple?: boolean
  /** Optional MIME-prefix filter (e.g. ['image/']). Files that don't match
   *  are dropped silently. Pass undefined to accept anything. */
  acceptPrefixes?: string[]
  /** Disable handling (e.g. during an in-flight upload). */
  disabled?: boolean
  style?: CSSProperties
  className?: string
  children: ReactNode
}

export default function FileDropZone({
  onFiles, multiple = false, acceptPrefixes, disabled, style, className, children,
}: Props) {
  const counterRef = useRef(0)
  const [dragOver, setDragOver] = useState(false)

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (disabled) return
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    e.stopPropagation()
    counterRef.current += 1
    if (counterRef.current === 1) setDragOver(true)
  }, [disabled])

  const handleDragOver = useCallback((e: DragEvent) => {
    if (disabled) return
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [disabled])

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    counterRef.current = Math.max(0, counterRef.current - 1)
    if (counterRef.current === 0) setDragOver(false)
  }, [disabled])

  const handleDrop = useCallback((e: DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    counterRef.current = 0
    setDragOver(false)
    let files = Array.from(e.dataTransfer.files)
    if (acceptPrefixes && acceptPrefixes.length) {
      files = files.filter(f => acceptPrefixes.some(p => f.type.startsWith(p)))
    }
    if (files.length === 0) return
    onFiles(multiple ? files : files.slice(0, 1))
  }, [disabled, multiple, acceptPrefixes, onFiles])

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={className}
      style={{
        position: 'relative',
        outline: dragOver ? '2px dashed var(--gold)' : '2px dashed transparent',
        outlineOffset: 2,
        background: dragOver ? 'rgba(184, 146, 42, 0.06)' : undefined,
        borderRadius: dragOver ? 10 : undefined,
        transition: 'outline-color 80ms ease, background 80ms ease',
        ...style,
      }}
    >
      {children}
      {dragOver && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.55)',
          color: 'var(--gold)', fontWeight: 700, fontSize: 13,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          pointerEvents: 'none', borderRadius: 10,
        }}>
          Drop to upload
        </div>
      )}
    </div>
  )
}

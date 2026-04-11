'use client'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'

export default function NewJournalEntryPage() {
  const router = useRouter()
  const { user, dayNumber, addJournalEntry } = useApp()
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingSeconds(0)
      intervalRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
    } catch {
      alert('Microphone access required for voice notes.')
    }
  }

  function stopRecording() {
    mediaRecorder?.stop()
    setIsRecording(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const canSave = topic.trim().length > 0 && content.trim().length > 0

  function handleSave() {
    if (!canSave) return
    addJournalEntry({
      userId: user.id,
      cardId: '',
      dayNumber,
      content: `${topic.trim()}\n\n${content.trim()}`,
    })
    setSaved(true)
    setTimeout(() => router.push('/journal'), 800)
  }

  function handleDownload() {
    const text = `${topic}\n\n${content}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clarity-journal-day-${dayNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Back navigation */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          href="/journal"
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Back to Reflection
        </Link>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Day {dayNumber}
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <EyebrowLabel color="gold">Free Write</EyebrowLabel>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 38,
          fontWeight: 300,
          color: 'var(--ink)',
          margin: '8px 0 8px',
          lineHeight: 1.15,
        }}>
          What&apos;s on your mind?
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', fontFamily: 'var(--font-body)', margin: 0 }}>
          This entry is yours — no prompts, no structure. Just truth.
        </p>
      </div>

      {/* Topic / title input */}
      <div style={{ marginBottom: 28 }}>
        <label style={{
          display: 'block',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-soft)',
          fontFamily: 'var(--font-body)',
          marginBottom: 10,
        }}>
          Give this entry a name
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Name this entry..."
          autoFocus
          style={{
            width: '100%',
            border: 'none',
            borderBottom: '1px solid var(--line-md)',
            background: 'none',
            padding: '0 0 10px',
            fontSize: 22,
            fontFamily: 'var(--font-display)',
            color: 'var(--ink)',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--green)' }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--line-md)' }}
        />
      </div>

      {/* Main writing area */}
      <div style={{ marginBottom: 32 }}>
        <label style={{
          display: 'block',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-soft)',
          fontFamily: 'var(--font-body)',
          marginBottom: 10,
        }}>
          Your reflection
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Begin writing here..."
          style={{
            width: '100%',
            minHeight: 320,
            border: 'none',
            borderBottom: '1px solid var(--line-md)',
            background: 'transparent',
            padding: '0 0 12px',
            fontSize: 15,
            fontFamily: 'var(--font-body)',
            color: 'var(--ink)',
            fontWeight: 300,
            lineHeight: 1.85,
            resize: 'none',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--green)' }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--line-md)' }}
        />
      </div>

      {/* Voice Note */}
      <div style={{
        marginTop: '16px',
        marginBottom: '24px',
        padding: '16px',
        border: '1px solid rgba(31, 92, 58, 0.15)',
        borderRadius: '10px',
        background: 'rgba(31, 92, 58, 0.06)',
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: audioURL ? '12px' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mic icon SVG */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="5" y="1" width="6" height="8" rx="3" fill="var(--text-soft)" />
              <path
                d="M2 7.5C2 10.538 4.686 13 8 13s6-2.462 6-5.5"
                stroke="var(--text-soft)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="8"
                y1="13"
                x2="8"
                y2="15.5"
                stroke="var(--text-soft)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="5.5"
                y1="15.5"
                x2="10.5"
                y2="15.5"
                stroke="var(--text-soft)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-soft)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Voice Note
            </span>
            {isRecording && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--red)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                }}
              >
                ● REC {formatTime(recordingSeconds)}
              </span>
            )}
          </div>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              border: isRecording ? '1px solid var(--red)' : '1px solid var(--line-md)',
              background: isRecording ? 'var(--red-pale)' : 'white',
              color: isRecording ? 'var(--red)' : 'var(--text-soft)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            {isRecording ? 'Stop Recording' : '🎙 Record'}
          </button>
        </div>

        {audioURL && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <audio controls src={audioURL} style={{ flex: 1, height: '36px' }} />
            <button
              onClick={() => {
                URL.revokeObjectURL(audioURL)
                setAudioURL(null)
              }}
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          ✏️ {saved ? 'Saved!' : 'Draft'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleDownload}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--line-md)',
              borderRadius: 8,
              background: 'white',
              color: 'var(--text-soft)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            Download
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: 8,
              background: saved ? '#581c87' : '#6b21a8',
              color: 'white',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              cursor: canSave ? 'pointer' : 'not-allowed',
              opacity: !canSave ? 0.5 : 1,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => { if (canSave && !saved) e.currentTarget.style.background = '#581c87' }}
            onMouseOut={(e) => { if (!saved) e.currentTarget.style.background = '#6b21a8' }}
          >
            {saved ? 'Saved ✓' : 'Save Entry →'}
          </button>
        </div>
      </div>
    </div>
  )
}

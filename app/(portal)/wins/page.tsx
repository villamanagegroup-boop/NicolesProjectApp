'use client'
import React, { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Pill from '@/components/ui/Pill'

type Category = 'boundary' | 'choice' | 'moment' | 'growth'

const categoryConfig: Record<Category, { label: string; selectedStyle: React.CSSProperties }> = {
  boundary: {
    label: '🛡 Boundary',
    selectedStyle: {
      backgroundColor: 'var(--red-pale)',
      borderColor: 'var(--red)',
      color: 'var(--red)',
    },
  },
  choice: {
    label: '✦ Chose Myself',
    selectedStyle: {
      backgroundColor: 'var(--gold-pale)',
      borderColor: 'var(--gold)',
      color: 'var(--gold)',
    },
  },
  moment: {
    label: '🌿 Present Moment',
    selectedStyle: {
      backgroundColor: 'var(--green-pale)',
      borderColor: 'var(--green)',
      color: 'var(--green)',
    },
  },
  growth: {
    label: '⚡ Growth',
    selectedStyle: {
      backgroundColor: 'var(--paper2)',
      borderColor: 'var(--ink)',
      color: 'var(--ink)',
    },
  },
}

const accentColor: Record<Category, string> = {
  boundary: 'var(--red)',
  choice: 'var(--gold)',
  moment: 'var(--green)',
  growth: 'var(--ink)',
}

export default function WinsPage() {
  const { wins, addWin, updateWin, deleteWin } = useApp()

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingWinId, setEditingWinId] = useState<string | null>(null)
  const [editWinTitle, setEditWinTitle] = useState('')
  const [editWinDescription, setEditWinDescription] = useState('')

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

  const canSubmit = selectedCategory !== null && title.trim().length > 0 && description.trim().length > 0

  function handleSubmit() {
    if (!canSubmit || !selectedCategory) return
    addWin({ category: selectedCategory, title: title.trim(), description: description.trim() })
    setSelectedCategory(null)
    setTitle('')
    setDescription('')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <EyebrowLabel color="gold">Private Victories</EyebrowLabel>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
            fontWeight: 300,
            color: 'var(--ink)',
            marginTop: '4px',
            marginBottom: '8px',
          }}
        >
          My Wins
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-soft)', margin: 0 }}>
          Every time you chose yourself — logged here.
        </p>
      </div>

      {/* Add Win panel */}
      <div
        style={{
          marginBottom: '32px',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '24px',
          backgroundColor: 'white',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            color: 'var(--ink)',
            marginBottom: '16px',
            margin: '0 0 16px 0',
          }}
        >
          Log a Win
        </p>

        {/* Category picker */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {(Object.entries(categoryConfig) as [Category, typeof categoryConfig[Category]][]).map(
            ([cat, config]) => {
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    border: `1px solid ${isSelected ? 'transparent' : 'var(--line-md)'}`,
                    borderRadius: '9999px',
                    padding: '6px 16px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? config.selectedStyle.backgroundColor : 'white',
                    borderColor: isSelected
                      ? (config.selectedStyle.borderColor as string)
                      : 'var(--line-md)',
                    color: isSelected ? (config.selectedStyle.color as string) : 'var(--text-soft)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {config.label}
                </button>
              )
            }
          )}
        </div>

        {/* Title input */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-soft)',
              marginBottom: '6px',
              fontFamily: 'var(--font-body)',
            }}
          >
            What happened?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name this win..."
            style={{
              width: '100%',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid var(--line-md)',
              background: 'transparent',
              paddingBottom: '8px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--ink)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderBottomColor = 'var(--gold)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderBottomColor = 'var(--line-md)'
            }}
          />
        </div>

        {/* Description textarea */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-soft)',
              marginBottom: '6px',
              fontFamily: 'var(--font-body)',
            }}
          >
            Tell the full story
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What made this a win for you? How did it feel?"
            style={{
              width: '100%',
              minHeight: '100px',
              border: '1px solid var(--line-md)',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: 'var(--paper)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 300,
              color: 'var(--ink)',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--green)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--line-md)'
            }}
          />
        </div>

        {/* Voice Note */}
        <div style={{
          padding: '14px',
          border: '1px solid rgba(31, 92, 58, 0.15)',
          borderRadius: '10px',
          background: 'rgba(31, 92, 58, 0.06)',
          marginBottom: '6px',
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

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '12px',
            background: canSubmit ? 'var(--green)' : 'var(--line-md)',
            color: canSubmit ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Log This Win →
        </button>
      </div>

      {/* Wins list */}
      <div>
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            {wins.length} wins logged
          </p>
          <p
            style={{
              fontSize: '12px',
              fontStyle: 'italic',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            Keep going.
          </p>
        </div>

        {wins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontStyle: 'italic',
                color: 'var(--text-muted)',
              }}
            >
              Your first win is already on its way.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Log it when you&apos;re ready.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {wins.map((win) => (
              <div
                key={win.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: 'white',
                  position: 'relative',
                  paddingLeft: '24px',
                }}
              >
                {/* Left accent bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '16px',
                    bottom: '16px',
                    width: '3px',
                    borderRadius: '9999px',
                    backgroundColor: accentColor[win.category],
                  }}
                />

                {/* Top row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Category badge */}
                  {win.category === 'boundary' && (
                    <span
                      style={{
                        backgroundColor: 'var(--red-pale)',
                        color: 'var(--red)',
                        border: '1px solid var(--red)',
                        borderRadius: '9999px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '10px',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        padding: '3px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {categoryConfig.boundary.label}
                    </span>
                  )}
                  {win.category === 'choice' && (
                    <Pill variant="gold">{categoryConfig.choice.label}</Pill>
                  )}
                  {win.category === 'moment' && (
                    <Pill variant="green">{categoryConfig.moment.label}</Pill>
                  )}
                  {win.category === 'growth' && (
                    <Pill variant="outline">{categoryConfig.growth.label}</Pill>
                  )}

                  {/* Date + action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {win.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button
                      onClick={() => {
                        setEditingWinId(win.id)
                        setEditWinTitle(win.title)
                        setEditWinDescription(win.description)
                      }}
                      style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4,
                        background: 'none', color: 'var(--text-muted)', border: '1px solid var(--line)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}
                    >Edit</button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this win?')) deleteWin(win.id)
                      }}
                      style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4,
                        background: 'none', color: 'var(--red)', border: '1px solid var(--red-pale)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}
                    >Delete</button>
                  </div>
                </div>

                {/* Title + description or edit form */}
                {editingWinId === win.id ? (
                  <div style={{ marginTop: 12 }}>
                    <input
                      value={editWinTitle}
                      onChange={(e) => setEditWinTitle(e.target.value)}
                      style={{
                        width: '100%', border: 'none', borderBottom: '1px solid var(--line-md)',
                        background: 'none', padding: '0 0 6px', fontSize: 14,
                        fontFamily: 'var(--font-display)', color: 'var(--ink)', outline: 'none',
                        marginBottom: 10, boxSizing: 'border-box',
                      }}
                    />
                    <textarea
                      value={editWinDescription}
                      onChange={(e) => setEditWinDescription(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', border: '1px solid var(--line-md)', borderRadius: 6,
                        padding: 8, fontSize: 12, fontFamily: 'var(--font-body)',
                        color: 'var(--ink)', background: 'var(--paper)', resize: 'none', outline: 'none',
                        marginBottom: 10, boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          updateWin(win.id, { title: editWinTitle, description: editWinDescription })
                          setEditingWinId(null)
                        }}
                        style={{
                          fontSize: 11, padding: '5px 12px', borderRadius: 6,
                          background: 'var(--green)', color: 'white', border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                        }}
                      >Save</button>
                      <button
                        onClick={() => setEditingWinId(null)}
                        style={{
                          fontSize: 11, padding: '5px 12px', borderRadius: 6,
                          background: 'none', color: 'var(--text-muted)', border: '1px solid var(--line-md)',
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                        }}
                      >Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Title */}
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20,
                        color: 'var(--ink)',
                        marginTop: 12,
                        marginBottom: 4,
                      }}
                    >
                      {win.title}
                    </div>

                    {/* Description */}
                    {win.description && (
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text-soft)',
                          fontFamily: 'var(--font-body)',
                          lineHeight: 1.6,
                        }}
                      >
                        {win.description}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

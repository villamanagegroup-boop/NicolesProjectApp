'use client'
import React, { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Button from '@/components/ui/Button'

// Helper to parse entry content for free-write entries
function parseEntry(content: string) {
  const parts = content.split('\n\n')
  if (parts.length > 1 && parts[0].length < 80) {
    return { topic: parts[0], body: parts.slice(1).join('\n\n') }
  }
  return { topic: null, body: content }
}

export default function JournalPage() {
  const { user, dayNumber, todayCard, journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useApp()
  const [entryContent, setEntryContent] = useState('')
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Find today's card entry
  const todayCardEntry = todayCard
    ? journalEntries.find(e => e.cardId === todayCard.id)
    : undefined

  const [isEditingJournal, setIsEditingJournal] = useState(false)

  // Pre-populate textarea with today's card entry content when entry exists
  React.useEffect(() => {
    if (todayCardEntry && !isEditingJournal) {
      setEntryContent(todayCardEntry.content)
    }
  }, [todayCardEntry?.id])

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const journalPrompt = todayCard?.journalPrompt ?? 'What is calling for your attention today?'

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

  const handleDownload = () => {
    const blob = new Blob([entryContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clarity-journal-day-${dayNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Textarea is read-only when todayCardEntry exists and not editing
  const isReadOnly = !!todayCardEntry && !isEditingJournal

  return (
    <div className="two-col-grid" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
      {/* LEFT — Editor */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <EyebrowLabel color="muted">Your Reflections</EyebrowLabel>
        </div>

        {/* Today's prompt bar */}
        <div
          style={{
            backgroundColor: 'var(--paper2)',
            borderRadius: '0 10px 10px 0',
            padding: '16px',
            borderLeft: '2px solid var(--green)',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--green)',
              fontFamily: 'var(--font-body)',
              margin: '0 0 8px 0',
            }}
          >
            Today's Prompt — Day {dayNumber}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '17px',
              color: 'rgba(var(--ink-rgb, 18, 18, 18), 0.8)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {journalPrompt}
          </p>
        </div>

        {/* Textarea */}
        <textarea
          value={entryContent}
          onChange={isReadOnly ? undefined : (e) => setEntryContent(e.target.value)}
          readOnly={isReadOnly}
          placeholder="Begin your reflection here..."
          style={{
            width: '100%',
            minHeight: '280px',
            border: 'none',
            borderBottom: isReadOnly ? '1px solid var(--line)' : '1px solid var(--line-md)',
            background: isReadOnly ? 'var(--paper2)' : 'transparent',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: isReadOnly ? 'var(--text-soft)' : 'var(--ink)',
            cursor: isReadOnly ? 'default' : 'text',
            fontWeight: 300,
            lineHeight: 1.8,
            resize: 'none',
            outline: 'none',
            padding: isReadOnly ? '12px' : '8px 0',
            boxSizing: 'border-box',
            borderRadius: isReadOnly ? '8px' : '0',
          }}
          onFocus={(e) => {
            if (!isReadOnly) e.currentTarget.style.borderBottomColor = 'var(--green)'
          }}
          onBlur={(e) => {
            if (!isReadOnly) e.currentTarget.style.borderBottomColor = 'var(--line-md)'
          }}
        />

        {/* Voice Note section */}
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            border: '1px solid rgba(31, 92, 58, 0.15)',
            borderRadius: '10px',
            background: 'rgba(31, 92, 58, 0.06)',
          }}
        >
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
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>✏️</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Draft saved automatically
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              Download
            </Button>

            {!todayCardEntry ? (
              // No existing card entry — show "Save Entry →" in deep purple
              <button
                onClick={() => {
                  if (!entryContent.trim()) return
                  addJournalEntry({
                    userId: user.id,
                    cardId: todayCard?.id ?? '',
                    dayNumber,
                    content: entryContent,
                  })
                }}
                disabled={!entryContent.trim()}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#6b21a8',
                  color: 'white',
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  opacity: !entryContent.trim() ? 0.5 : 1,
                  cursor: entryContent.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => { if (entryContent.trim()) e.currentTarget.style.background = '#581c87' }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#6b21a8' }}
              >
                Save Entry →
              </button>
            ) : !isEditingJournal ? (
              // Entry exists, not editing — show "Edit Reflection" (green outline)
              <button
                onClick={() => setIsEditingJournal(true)}
                style={{
                  padding: '6px 16px',
                  border: '1px solid var(--green)',
                  borderRadius: '8px',
                  background: 'white',
                  color: 'var(--green)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Edit Reflection
              </button>
            ) : (
              // Entry exists, IS editing — show "Save Changes" + "Cancel"
              <>
                <button
                  onClick={() => {
                    if (!entryContent.trim() || !todayCardEntry) return
                    updateJournalEntry(todayCardEntry.id, entryContent)
                    setIsEditingJournal(false)
                  }}
                  disabled={!entryContent.trim()}
                  style={{
                    padding: '6px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--green)',
                    color: 'white',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    opacity: !entryContent.trim() ? 0.5 : 1,
                    cursor: entryContent.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save Changes →
                </button>
                <button
                  onClick={() => {
                    setEntryContent(todayCardEntry.content)
                    setIsEditingJournal(false)
                  }}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid var(--line-md)',
                    borderRadius: '8px',
                    background: 'white',
                    color: 'var(--text-soft)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — Past entries */}
      <div
        className="journal-sidebar"
        style={{
          width: '260px',
          flexShrink: 0,
          position: 'sticky',
          top: '92px',
          backgroundColor: 'rgba(120, 80, 180, 0.06)',
          border: '1px solid rgba(120, 80, 180, 0.12)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <EyebrowLabel color="muted" className="mb-4">
          Past Entries
        </EyebrowLabel>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
          {journalEntries.length === 0 ? (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-body)',
                margin: 0,
              }}
            >
              No entries yet. Start writing today.
            </p>
          ) : (
            journalEntries.map((entry) => {
              const isSelected = selectedEntryId === entry.id
              const parsed = parseEntry(entry.content)
              return (
                <div
                  key={entry.id}
                  style={{
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  {editingId === entry.id ? (
                    // EDIT MODE
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: 100,
                          border: '1px solid var(--line-md)',
                          borderRadius: 8,
                          padding: 10,
                          fontSize: 12,
                          fontFamily: 'var(--font-body)',
                          color: 'var(--ink)',
                          background: 'white',
                          resize: 'none',
                          outline: 'none',
                          marginBottom: 8,
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            updateJournalEntry(entry.id, editContent)
                            setEditingId(null)
                          }}
                          style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 6,
                            background: 'var(--green)', color: 'white', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                          }}
                        >Save</button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 6,
                            background: 'none', color: 'var(--text-muted)', border: '1px solid var(--line-md)', cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                          }}
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE
                    <div>
                      <div
                        onClick={() => {
                          setSelectedEntryId(entry.id)
                          setEntryContent(entry.content)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                          {entry.cardId === ''
                            ? `✦ Day ${entry.dayNumber} · ${entry.createdAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
                            : `Day ${entry.dayNumber} · ${entry.createdAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                        </div>
                        {parsed.topic && (
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-body)', marginTop: '3px' }}>
                            {parsed.topic}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: isSelected ? 'var(--ink)' : 'var(--text-soft)', marginTop: '4px', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                          {(parsed.body || entry.content).slice(0, 80)}
                          {(parsed.body || entry.content).length > 80 ? '...' : ''}
                        </div>
                      </div>

                      {/* Action row */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => {
                            setEditingId(entry.id)
                            setEditContent(entry.content)
                          }}
                          style={{
                            fontSize: 10, padding: '3px 8px', borderRadius: 4,
                            background: 'none', color: 'var(--text-muted)', border: '1px solid var(--line)',
                            cursor: 'pointer', fontFamily: 'var(--font-body)',
                          }}
                        >Edit</button>

                        {entry.cardId === '' && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this entry?')) deleteJournalEntry(entry.id)
                            }}
                            style={{
                              fontSize: 10, padding: '3px 8px', borderRadius: 4,
                              background: 'none', color: 'var(--red)', border: '1px solid var(--red-pale)',
                              cursor: 'pointer', fontFamily: 'var(--font-body)',
                            }}
                          >Delete</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}

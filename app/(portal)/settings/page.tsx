'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp, getArchetypePlaceholder } from '@/context/AppContext'
import { quizResults } from '@/data/quizData'
import { PATHS, PATH_ORDER, getPath, type PathId } from '@/data/paths'
import { signOut } from '@/lib/supabase/auth'

const SECTIONS = [
  { id: 'profile',       label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'delivery',      label: 'Card Delivery' },
  { id: 'plan',          label: 'Your Plan' },
  { id: 'billing',       label: 'Billing' },
  { id: 'security',      label: 'Security' },
] as const

type SectionId = typeof SECTIONS[number]['id']

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateUser, avatarUrl, setAvatarUrl, dailyReminders, setDailyReminders, enableCardsAddOn } = useApp()

  // ── Profile autosave ─────────────────────────────────────────────────────
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [nameSaved, setNameSaved] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)

  function commitName() {
    if (name.trim() && name !== user.name) {
      updateUser({ name: name.trim() })
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 1500)
    }
  }
  function commitEmail() {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (isValid && email !== user.email) {
      updateUser({ email })
      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 1500)
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [milestoneAlerts, setMilestoneAlerts] = useState(true)

  // ── Plan ────────────────────────────────────────────────────────────────
  const currentPath = getPath(user.selectedPath)
  const upgradePaths = PATH_ORDER
    .map(id => PATHS[id])
    .filter(p => p.tier > currentPath.tier)
  const matchedResult = quizResults.find(r => r.id === user.quizResult)

  function billingLabel(billing: typeof currentPath.billing): string {
    if (billing === 'subscription') return 'Billed monthly'
    if (billing === 'one-time')     return 'One-time purchase'
    return 'Discovery call'
  }

  // ── Scroll-spy ──────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio that's currently intersecting
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) {
          const id = visible[0].target.id as SectionId
          if (id) setActiveSection(id)
        }
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    for (const s of SECTIONS) {
      const el = sectionRefs.current[s.id]
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  function scrollToSection(id: SectionId) {
    const el = sectionRefs.current[id]
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  // ── Danger zone confirmation ────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)

  const photoSrc = avatarUrl ?? getArchetypePlaceholder(user.quizResult)

  return (
    <div>
      {/* ── Hero summary ───────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--green-pale) 0%, var(--paper2) 100%)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: 60, height: 60,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid var(--gold)',
          flexShrink: 0,
          backgroundColor: 'var(--paper2)',
        }}>
          <img src={photoSrc} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 300,
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {user.name}'s settings
          </h1>
          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-soft)',
            fontFamily: 'var(--font-body)',
          }}>
            <span style={{ color: currentPath.accent, fontWeight: 500 }}>
              {currentPath.icon} {currentPath.title}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--green)', fontWeight: 500 }}>Active</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>{billingLabel(currentPath.billing)}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>Next card at 4:00 AM</span>
            {dailyReminders ? null : (
              <>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: 'var(--red)' }}>Reminders off</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column: left rail + right content ───────────────────────── */}
      <div className="two-col-grid" style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: '32px',
        alignItems: 'flex-start',
      }}>
        {/* Left rail */}
        <nav
          className="hide-mobile"
          style={{
            position: 'sticky',
            top: '80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            padding: '0 12px 10px',
          }}>
            Jump to
          </div>
          {SECTIONS.map(s => {
            const active = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: active ? 'var(--green-pale)' : 'transparent',
                  color: active ? 'var(--green)' : 'var(--text-soft)',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  borderLeft: `2px solid ${active ? 'var(--green)' : 'transparent'}`,
                  paddingLeft: '10px',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)' }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-soft)' }}
              >
                {s.label}
              </button>
            )
          })}
          <button
            onClick={async () => { await signOut(); router.push('/') }}
            style={{
              textAlign: 'left',
              padding: '8px 12px',
              marginTop: '12px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              borderLeft: '2px solid transparent',
              paddingLeft: '10px',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
          >
            Sign out →
          </button>
        </nav>

        {/* Right content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          {/* ── Profile ──────────────────────────────────────────────── */}
          <section
            id="profile"
            ref={el => { sectionRefs.current.profile = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Profile</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Changes save automatically
              </p>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Avatar + upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 64, height: 64,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--gold)',
                  flexShrink: 0,
                  backgroundColor: 'var(--paper2)',
                }}>
                  <img src={photoSrc} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <label
                    htmlFor="settings-avatar-upload"
                    style={{
                      display: 'inline-block',
                      padding: '7px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--line-md)',
                      background: 'white',
                      color: 'var(--ink)',
                      fontSize: 12,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                    }}
                  >
                    Upload new photo
                  </label>
                  <input
                    id="settings-avatar-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onloadend = () => setAvatarUrl(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                  {avatarUrl && (
                    <button
                      onClick={() => setAvatarUrl(null)}
                      style={{
                        marginLeft: 8,
                        padding: '7px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '6px 0 0' }}>
                    PNG or JPG, square works best.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 440 }}>
                {/* Name */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                      Full Name
                    </label>
                    {nameSaved && (
                      <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Saved ✓
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={commitName}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
                    style={{
                      width: '100%', border: 'none', borderBottom: '1px solid var(--line-md)',
                      background: 'none', padding: '0 0 8px', fontSize: 15,
                      fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--green)' }}
                  />
                </div>
                {/* Email */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                      Email Address
                    </label>
                    {emailSaved && (
                      <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Saved ✓
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={commitEmail}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
                    style={{
                      width: '100%', border: 'none', borderBottom: '1px solid var(--line-md)',
                      background: 'none', padding: '0 0 8px', fontSize: 15,
                      fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--green)' }}
                  />
                </div>
                {/* Archetype (read-only) */}
                {matchedResult && (
                  <div>
                    <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                      Archetype
                    </label>
                    <div style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>
                      {matchedResult.emoji} {matchedResult.title}
                      <Link href="/profile" style={{ marginLeft: 10, fontSize: 11, color: 'var(--gold)', textDecoration: 'none' }}>
                        Retake quiz at Day 90 →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Notifications ────────────────────────────────────────── */}
          <section
            id="notifications"
            ref={el => { sectionRefs.current.notifications = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Notifications</h2>
            </div>
            <div style={{ padding: '0 24px' }}>
              {([
                { label: 'Daily card reminder',       sub: 'One gentle nudge each morning',     value: dailyReminders, set: setDailyReminders },
                { label: 'Weekly reflection digest',  sub: 'A summary of your entries on Sunday', value: weeklyDigest,   set: setWeeklyDigest },
                { label: 'Milestone alerts',          sub: 'Streak milestones and unlocks',     value: milestoneAlerts, set: setMilestoneAlerts },
              ] as { label: string; sub: string; value: boolean; set: (v: boolean) => void }[]).map((item, i, arr) => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '18px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    aria-label={`${item.value ? 'Disable' : 'Enable'} ${item.label}`}
                    style={{
                      width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                      background: item.value ? 'var(--green)' : 'var(--line-md)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: item.value ? 23 : 3, transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Card Delivery ────────────────────────────────────────── */}
          <section
            id="delivery"
            ref={el => { sectionRefs.current.delivery = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Card Delivery</h2>
            </div>
            <div style={{ padding: '0 24px' }}>
              {([
                { label: 'Delivery time', value: '4:00 AM every day' },
                { label: 'Timezone',      value: 'Auto-detected' },
                { label: 'Language',      value: 'English' },
              ] as { label: string; value: string }[]).map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Your Plan ────────────────────────────────────────────── */}
          <section
            id="plan"
            ref={el => { sectionRefs.current.plan = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Your Plan</h2>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Current plan hero */}
              <div style={{
                background: currentPath.accentPale,
                border: `1px solid ${currentPath.accent}30`,
                borderLeft: `3px solid ${currentPath.accent}`,
                borderRadius: 10,
                padding: '20px 22px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                      Current plan · {currentPath.tierLabel}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 400,
                      color: 'var(--ink)',
                      lineHeight: 1.2,
                      marginBottom: 4,
                    }}>
                      {currentPath.icon} {currentPath.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-soft)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                      {currentPath.description}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: currentPath.accent,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'white',
                    flexShrink: 0,
                  }}>
                    Active
                  </div>
                </div>

                {/* Price + billing */}
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  marginBottom: 14,
                  paddingTop: 12,
                  borderTop: `1px solid ${currentPath.accent}20`,
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--ink)' }}>
                    {currentPath.price}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    {currentPath.priceNote}
                  </span>
                </div>

                {/* Includes list */}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {currentPath.includes.map((item) => (
                    <li key={item} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 12,
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-body)',
                    }}>
                      <span style={{ color: currentPath.accent, flexShrink: 0, fontWeight: 600, marginTop: 1 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Manage button */}
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: 'white',
                      border: '1px solid var(--line-md)',
                      color: 'var(--ink)',
                      fontSize: 12,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                    }}
                    onClick={() => { /* TODO: open Stripe customer portal */ }}
                  >
                    {currentPath.billing === 'call' ? 'Manage coaching' : 'Manage plan'}
                  </button>
                  {currentPath.billing === 'subscription' && (
                    <button
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        background: 'white',
                        border: '1px solid var(--line-md)',
                        color: 'var(--text-soft)',
                        fontSize: 12,
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                      }}
                      onClick={() => { /* TODO: switch to yearly */ }}
                    >
                      Switch to yearly · save 38%
                    </button>
                  )}
                </div>
              </div>

              {/* Daily Cards add-on — Path A only, before they've added it */}
              {user.selectedPath === 'A' && !user.cardsAddOnAt && (
                <>
                  <div style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    margin: '4px 0 12px',
                  }}>
                    Add to your plan
                  </div>
                  <div style={{
                    border: `1px solid ${PATHS.B.accent}30`,
                    borderRadius: 10,
                    padding: '16px 20px',
                    background: PATHS.B.accentPale,
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    marginBottom: 20,
                  }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                        Add-on
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
                        {PATHS.B.icon} Daily Cards — 365 Days of Alignment
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-soft)', fontFamily: 'var(--font-body)', lineHeight: 1.6, marginBottom: 6 }}>
                        Layer the daily card practice on top of Seal the Leak. The day you add it becomes your Cards Day 1 — the normal Day-6 gate doesn&apos;t apply to you.
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                        👉 Best if you want the daily rhythm alongside your 7-day reset.
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
                          {PATHS.B.price}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 3 }}>
                          {PATHS.B.priceNote}
                        </div>
                      </div>
                      <button
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          background: PATHS.B.accent,
                          color: 'white',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: 'var(--font-body)',
                          cursor: 'pointer',
                        }}
                        onClick={async () => {
                          // TODO: send through Stripe checkout before writing the add-on row.
                          if (!confirm('Add Daily Cards to your plan? Today becomes your Cards Day 1.')) return
                          await enableCardsAddOn()
                          alert('Daily Cards added — head to the Daily Alignment sidebar.')
                        }}
                      >
                        Add Daily Cards →
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Daily Cards already added — show as confirmed */}
              {user.selectedPath === 'A' && user.cardsAddOnAt && (
                <div style={{
                  background: PATHS.B.accentPale,
                  border: `1px solid ${PATHS.B.accent}30`,
                  borderLeft: `3px solid ${PATHS.B.accent}`,
                  borderRadius: 10,
                  padding: '14px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: PATHS.B.accent, fontWeight: 600, marginBottom: 3 }}>
                      Add-on active
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
                      🌿 Daily Cards added {new Date(user.cardsAddOnAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade options — tiers above current */}
              {upgradePaths.length > 0 && (
                <>
                  <div style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    margin: '4px 0 12px',
                  }}>
                    Go deeper
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {upgradePaths.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          border: `1px solid ${p.accent}30`,
                          borderRadius: 10,
                          padding: '16px 20px',
                          background: p.accentPale,
                          display: 'flex',
                          gap: 16,
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                            {p.tierLabel}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
                            {p.icon} {p.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-soft)', fontFamily: 'var(--font-body)', lineHeight: 1.6, marginBottom: 6 }}>
                            {p.description}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                            👉 {p.bestFor}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
                              {p.price}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 3 }}>
                              {p.priceNote}
                            </div>
                          </div>
                          <button
                            style={{
                              padding: '8px 16px',
                              borderRadius: 6,
                              background: p.accent,
                              color: 'white',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 500,
                              fontFamily: 'var(--font-body)',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              if (p.billing === 'call') { alert('Discovery call — booking coming soon') }
                              else { alert('Stripe checkout — coming soon') }
                            }}
                          >
                            {p.billing === 'call' ? 'Book a call →' : 'Upgrade →'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ── Billing ──────────────────────────────────────────────── */}
          <section
            id="billing"
            ref={el => { sectionRefs.current.billing = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Billing</h2>
            </div>
            <div style={{ padding: '0 24px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0', borderBottom: '1px solid var(--line)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Payment method</span>
                <button style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Add payment method
                </button>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0', borderBottom: '1px solid var(--line)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Billing history</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>No charges yet</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Cancel subscription</span>
                <button
                  style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  onClick={() => { /* TODO */ }}
                >
                  Request cancellation
                </button>
              </div>
            </div>
          </section>

          {/* ── Security ─────────────────────────────────────────────── */}
          <section
            id="security"
            ref={el => { sectionRefs.current.security = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Security</h2>
            </div>
            <div style={{ padding: '0 24px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0', borderBottom: '1px solid var(--line)',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Password</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>Last changed — never</div>
                </div>
                <button style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Change password
                </button>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Two-factor authentication</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>Extra security on sign-in</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Coming soon
                </span>
              </div>
            </div>
          </section>

          {/* ── Danger Zone ──────────────────────────────────────────── */}
          <section style={{
            border: '1px solid rgba(178,60,60,0.35)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'rgba(178,60,60,0.03)',
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(178,60,60,0.2)', background: 'rgba(178,60,60,0.05)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--red)', margin: 0 }}>Danger zone</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
                These actions are permanent.
              </p>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Delete account</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2, lineHeight: 1.5 }}>
                    Erases your profile, reflections, and journey history. Cannot be undone.
                  </div>
                </div>
                {confirmDelete ? (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => { alert('Account deletion — coming soon') }}
                      style={{
                        fontSize: 12,
                        padding: '8px 14px',
                        borderRadius: 6,
                        border: 'none',
                        background: 'var(--red)',
                        color: 'white',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Confirm delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{
                        fontSize: 12,
                        padding: '8px 14px',
                        borderRadius: 6,
                        border: '1px solid var(--line-md)',
                        background: 'white',
                        color: 'var(--text-soft)',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      fontSize: 12,
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid rgba(178,60,60,0.4)',
                      background: 'white',
                      color: 'var(--red)',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Request deletion
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Fine-print footer ────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 4px 20px',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}>
            <span>v1.0.0 · Built by Hicks Virtual Solutions LLC</span>
            <span>
              <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', marginRight: 14 }}>Privacy</a>
              <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

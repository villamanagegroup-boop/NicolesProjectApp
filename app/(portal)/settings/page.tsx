'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'

export default function SettingsPage() {
  const { user, updateUser, dailyReminders, setDailyReminders } = useApp()

  // Editable profile fields
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [profileSaved, setProfileSaved] = useState(false)

  function handleSaveProfile() {
    updateUser({ name, email })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  // Notification toggles — daily reminders synced with context
  const [notif2, setNotif2] = useState(false)  // Weekly digest
  const [notif3, setNotif3] = useState(true)   // Milestone alerts

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Header */}
      <EyebrowLabel color="muted">Account &amp; Preferences</EyebrowLabel>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 300, color: 'var(--ink)', margin: '8px 0 36px', lineHeight: 1.1 }}>
        Settings
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ===== SECTION 1: Profile ===== */}
        <section style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Profile</h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 440 }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%', border: 'none', borderBottom: '1px solid var(--line-md)',
                    background: 'none', padding: '0 0 8px', fontSize: 15,
                    fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--green)' }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--line-md)' }}
                />
              </div>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', border: 'none', borderBottom: '1px solid var(--line-md)',
                    background: 'none', padding: '0 0 8px', fontSize: 15,
                    fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--green)' }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--line-md)' }}
                />
              </div>
              {/* Save button */}
              <div>
                <button
                  onClick={handleSaveProfile}
                  style={{
                    padding: '9px 22px', borderRadius: 8,
                    background: profileSaved ? 'var(--green-dim, #2d7a52)' : 'var(--ink)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500,
                    transition: 'background 0.2s',
                  }}
                >
                  {profileSaved ? 'Saved ✓' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: Notifications ===== */}
        <section style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Notifications</h2>
          </div>
          <div style={{ padding: '0 24px' }}>
            {([
              { label: 'Daily card reminder', sub: 'Delivered at 4am every day', value: dailyReminders, set: setDailyReminders },
              { label: 'Weekly reflection digest', sub: 'Summary of your journal entries', value: notif2, set: setNotif2 },
              { label: 'Milestone alerts', sub: 'Streak milestones and unlocks', value: notif3, set: setNotif3 },
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

        {/* ===== SECTION 3: Card Delivery ===== */}
        <section style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Card Delivery</h2>
          </div>
          <div style={{ padding: '0 24px' }}>
            {([
              { label: 'Delivery time', value: '4:00 AM every day' },
              { label: 'Timezone', value: 'Auto-detected' },
              { label: 'Language', value: 'English' },
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

        {/* ===== SECTION 4: Subscription ===== */}
        <section style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Subscription</h2>
          </div>
          <div style={{ padding: '24px' }}>
            {/* Current plan */}
            <div style={{
              background: 'var(--green-pale)',
              border: '1px solid var(--green-dim, #2d7a52)',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--green)', fontFamily: 'var(--font-body)' }}>
                  🌿 Daily Practice — Path B
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 4 }}>
                  Daily clarity cards · Journal · Card archive
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-body)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Active
              </div>
            </div>

            {/* Upgrade teaser */}
            <div style={{
              background: 'var(--gold-pale)',
              border: '1px solid var(--gold-line)',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gold)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
                ⚡ Unlock The Work — Path A
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-soft)', fontFamily: 'var(--font-body)', lineHeight: 1.7, marginBottom: 12 }}>
                Add self-paced video lessons and guided program modules to your daily practice.
              </div>
              <button
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: 'var(--gold)', color: 'white',
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 500,
                }}
                onClick={() => {
                  // TODO: trigger Stripe checkout
                  alert('Stripe checkout — coming soon')
                }}
              >
                Upgrade Now →
              </button>
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: Billing ===== */}
        <section style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Billing</h2>
          </div>
          <div style={{ padding: '0 24px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 0', borderBottom: '1px solid var(--line)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Payment method</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>— not on file</span>
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
                onClick={() => {/* TODO */}}
              >
                Request cancellation
              </button>
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: Account / About ===== */}
        <section style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Account</h2>
          </div>
          <div style={{ padding: '0 24px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 0', borderBottom: '1px solid var(--line)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Password</span>
              <button style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Change password</button>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 0', borderBottom: '1px solid var(--line)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Version</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>1.0.0</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 0', borderBottom: '1px solid var(--line)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Built by</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Hicks Virtual Solutions LLC</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 0',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Delete account</span>
              <button style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Request deletion</button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

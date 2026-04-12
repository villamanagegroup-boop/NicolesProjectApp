'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <div className="landing-shell">

        {/* Fixed nav */}
        <nav className="landing-nav">
          <span className="landing-wordmark">
            <span style={{ color: 'var(--gold)' }}>✦</span> Seal Your Leak
          </span>
          <div className="landing-nav-buttons">
            <Link href="/login" className="landing-nav-signin">Sign In</Link>
            <Link href="/quiz" className="landing-nav-cta">Begin Journey →</Link>
          </div>
        </nav>

        {/* Main content area */}
        <div className="landing-main">

          {/* Photo — first in DOM so it's first on mobile; CSS moves it right on desktop */}
          <div className="landing-photo">
            <img
              src="/hero-alignment.jpg"
              alt="Seal Your Leak"
              className="landing-photo-img"
            />
          </div>

          {/* Hero text */}
          <div className="landing-content">
            <p className="landing-eyebrow">Daily Clarity App &amp; Program</p>

            <h1 className="landing-h1">
              Stop the<br />
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Leak.</em><br />
              Reclaim Your Energy
            </h1>

            <p className="landing-desc">
              A daily clarity app and step-by-step reset program — personalized to your energy archetype. Stop leaking and start living aligned.
            </p>

            <div className="landing-cta-row">
              <Link href="/quiz" className="landing-cta-primary">Find My Leak →</Link>
              <Link href="/login" className="landing-cta-secondary">Sign In</Link>
            </div>
          </div>
        </div>

        {/* Feature row — always in document flow */}
        <div className="landing-features">
          {[
            { title: '365 Daily Cards', label: 'Wisdom. One day at a time.' },
            { title: '4 Archetypes',   label: 'Know your pattern.' },
            { title: '3 Paths',        label: 'Choose your journey.' },
          ].map((item, i) => (
            <div key={item.title} className="landing-feature-item">
              {i > 0 && <div className="landing-feature-divider" />}
              <div>
                <div className="landing-feature-title">{item.title}</div>
                <div className="landing-feature-label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        /* ── Base (mobile-first) ─────────────────────────────── */
        .landing-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: var(--font-body);
          background: #fdfcfa;
          background-image:
            radial-gradient(ellipse at 8% 18%,  rgba(60,160,90,0.15)  0%, transparent 54%),
            radial-gradient(ellipse at 92% 12%, rgba(210,72,60,0.13)  0%, transparent 50%),
            radial-gradient(ellipse at 50% 92%, rgba(230,185,40,0.13) 0%, transparent 54%),
            radial-gradient(ellipse at 78% 62%, rgba(210,72,60,0.08)  0%, transparent 44%),
            radial-gradient(ellipse at 15% 80%, rgba(60,160,90,0.08)  0%, transparent 46%);
        }

        /* Nav */
        .landing-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(253,252,250,0.88);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(12,12,10,0.06);
        }
        .landing-wordmark {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
          color: var(--ink);
        }
        /* Hide buttons on mobile */
        .landing-nav-buttons { display: none; }

        /* Main: column on mobile */
        .landing-main {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        /* Photo: full width, 280px, directly below nav */
        .landing-photo {
          width: 100%;
          height: 280px;
          flex-shrink: 0;
          overflow: hidden;
          margin-top: 54px; /* clear fixed nav */
        }
        .landing-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
        }

        /* Hero text */
        .landing-content {
          padding: 32px 24px 28px;
          display: flex;
          flex-direction: column;
        }
        .landing-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--gold);
          margin: 0 0 20px;
        }
        .landing-h1 {
          font-family: var(--font-display);
          font-weight: 300;
          font-size: clamp(40px, 9vw, 64px);
          color: var(--ink);
          line-height: 1.1;
          margin: 0;
        }
        .landing-desc {
          font-size: 14px;
          color: rgba(12,12,10,0.55);
          max-width: 400px;
          margin: 20px 0 32px;
          line-height: 1.8;
        }
        .landing-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .landing-cta-primary {
          flex: 1 1 auto;
          text-align: center;
          background-color: var(--gold);
          color: #fff;
          padding: 13px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
        }
        .landing-cta-secondary {
          flex: 1 1 auto;
          text-align: center;
          border: 1px solid rgba(12,12,10,0.18);
          color: rgba(12,12,10,0.65);
          padding: 13px 20px;
          border-radius: 8px;
          font-size: 14px;
          text-decoration: none;
        }

        /* Feature row */
        .landing-features {
          display: flex;
          align-items: stretch;
          border-top: 1px solid rgba(12,12,10,0.07);
          background: rgba(12,12,10,0.02);
          padding: 20px 24px;
        }
        .landing-feature-item {
          display: flex;
          align-items: stretch;
          flex: 1;
        }
        .landing-feature-divider {
          width: 1px;
          background: rgba(12,12,10,0.08);
          margin-right: 16px;
          flex-shrink: 0;
        }
        .landing-feature-title {
          font-family: var(--font-display);
          font-size: 15px;
          color: var(--ink);
          margin-bottom: 3px;
        }
        .landing-feature-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(12,12,10,0.4);
        }

        /* ── Desktop ─────────────────────────────────────────── */
        @media (min-width: 769px) {
          .landing-nav {
            padding: 20px 40px;
          }
          .landing-wordmark { font-size: 20px; }
          .landing-nav-buttons {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          .landing-nav-signin {
            border: 1px solid rgba(12,12,10,0.18);
            color: var(--ink);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            text-decoration: none;
          }
          .landing-nav-cta {
            background-color: var(--gold);
            color: #fff;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            text-decoration: none;
          }

          /* Main: side-by-side */
          .landing-main {
            flex-direction: row;
            min-height: calc(100vh - 72px); /* leave room for features */
          }

          /* Photo moves to the right on desktop */
          .landing-photo {
            width: 42%;
            height: auto;
            order: 1;       /* right side */
            margin-top: 0;  /* no offset needed — main handles it */
            flex-shrink: 0;
          }

          /* Text takes remaining space, centred, with nav offset */
          .landing-content {
            flex: 1;
            justify-content: center;
            padding: 100px 64px 40px;
          }

          .landing-eyebrow { margin-bottom: 24px; }
          .landing-desc { margin: 24px 0 40px; }

          .landing-cta-primary,
          .landing-cta-secondary {
            flex: 0 0 auto;
            text-align: left;
          }

          /* Feature row: wider padding, taller dividers */
          .landing-features {
            padding: 24px 64px;
          }
          .landing-feature-divider { margin-right: 40px; }
          .landing-feature-title { font-size: 18px; }
          .landing-feature-label { font-size: 10px; }
        }
      `}</style>
    </>
  )
}

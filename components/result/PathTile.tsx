import type { PathDefinition } from '@/data/paths'

interface PathTileProps {
  def: PathDefinition
  featured?: boolean
}

export default function PathTile({ def, featured = false }: PathTileProps) {
  const accent = def.accent

  return (
    <div
      className="path-tile"
      style={{
        border: featured ? `2px solid ${accent}` : '1px solid rgba(12,12,10,0.1)',
        borderRadius: '12px',
        padding: featured ? '36px 32px' : '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        background: featured ? '#fffdf7' : 'white',
        boxShadow: featured ? `0 8px 32px ${accent}20` : 'none',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: featured ? '4px' : '3px',
        background: accent,
        borderRadius: '12px 12px 0 0',
      }} />

      {/* Featured badge */}
      {featured && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: accent,
          color: 'white',
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: '3px',
          fontFamily: 'var(--font-body)',
        }}>
          Recommended
        </div>
      )}

      {/* Title */}
      <div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: featured ? '32px' : '26px',
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 6px',
          lineHeight: 1.1,
        }}>
          {def.icon} {def.title}
        </h3>
        <p style={{
          fontSize: '11px',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: accent,
          margin: 0,
          fontFamily: 'var(--font-body)',
          opacity: 0.85,
        }}>
          {def.tierLabel}
        </p>
      </div>

      {/* Price */}
      <div style={{ borderTop: '1px solid rgba(12,12,10,0.07)', paddingTop: '14px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: featured ? '40px' : '34px',
          fontWeight: 400,
          color: 'var(--ink)',
          lineHeight: 1,
        }}>
          {def.price}
        </span>
        {def.priceNote && (
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '6px 0 0',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.5,
          }}>
            {def.priceNote}
          </p>
        )}
      </div>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: 'var(--text-soft)',
        lineHeight: 1.7,
        margin: 0,
        fontFamily: 'var(--font-body)',
      }}>
        {def.description}
      </p>

      {/* Includes */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {def.includes.map((item) => (
          <li key={item} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '13px',
            color: 'var(--ink)',
            fontFamily: 'var(--font-body)',
          }}>
            <span style={{ color: accent, flexShrink: 0, marginTop: '1px', fontWeight: 600 }}>✓</span>
            {item}
          </li>
        ))}
      </ul>

      {/* Best for callout */}
      <div style={{
        background: featured ? `${accent}10` : 'rgba(12,12,10,0.03)',
        border: `1px solid ${featured ? `${accent}28` : 'rgba(12,12,10,0.07)'}`,
        borderRadius: '6px',
        padding: '10px 14px',
      }}>
        <p style={{
          fontSize: '12px',
          color: featured ? accent : 'var(--text-soft)',
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}>
          👉 {def.bestFor}
        </p>
      </div>

      {/* CTA */}
      <a
        href={def.ctaHref}
        aria-label={def.ctaLabel}
        style={{
          display: 'block',
          width: '100%',
          background: accent,
          color: 'white',
          borderRadius: '6px',
          padding: featured ? '15px' : '13px',
          fontSize: '14px',
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.2px',
          textAlign: 'center',
          textDecoration: 'none',
          marginTop: '4px',
          boxSizing: 'border-box',
        }}
      >
        {def.ctaLabel}
      </a>
    </div>
  )
}

import { QuizResultId } from '@/types'

const ARCHETYPES = {
  seeker: {
    titleName: "Seeker",
    emoji: "🌿",
    outcome: "Your mind rarely gets to rest.",
    description: "You're always thinking — processing, analyzing, replaying. Your mind is your greatest gift and your biggest drain. Your path is about learning to be in your body, not just your head. Stillness isn't the enemy. It's where your answers actually live.",
    strengths: ["Deep intuition", "Emotional intelligence", "Natural wisdom-keeper"]
  },
  healer: {
    titleName: "Healer",
    emoji: "🌸",
    outcome: "Your energy turns on for others.",
    description: "You show up fully — for everyone else. You're the one people call, lean on, and count on. But somewhere along the way, you stopped being on your own list. Your path is about learning to receive as freely as you give.",
    strengths: ["Empathic presence", "Emotional depth", "Transforms pain into purpose"]
  },
  builder: {
    titleName: "Builder",
    emoji: "⚡",
    outcome: "Your energy depends on momentum.",
    description: "You're wired for progress. When you're moving, you're alive. When you stop, doubt creeps in. Your path is about building something sustainable — not just something fast. Real power has a rhythm, not just a pace.",
    strengths: ["Decisive leadership", "Strategic thinking", "Consistent follow-through"]
  },
  visionary: {
    titleName: "Visionary",
    emoji: "✨",
    outcome: "You keep going past your signals.",
    description: "You feel everything — deeply — and you keep moving anyway. You've learned to push through so well that you barely notice when your body and spirit are asking you to stop. Your path is about learning to trust the pause as much as the push.",
    strengths: ["Creative brilliance", "Spiritual sensitivity", "Ahead-of-time thinking"]
  }
}

interface ArchetypeRevealProps {
  resultId: QuizResultId
}

export default function ArchetypeReveal({ resultId }: ArchetypeRevealProps) {
  const archetype = ARCHETYPES[resultId]

  return (
    <div style={{ textAlign: 'center' }}>
      <p
        style={{
          fontSize: '10px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--green)',
          margin: '0 0 24px',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
        }}
      >
        Your Archetype
      </p>

      <div
        className="archetype-emoji"
        style={{ fontSize: '72px', lineHeight: 1, marginBottom: '20px' }}
      >
        {archetype.emoji}
      </div>

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '18px',
          color: 'rgba(12,12,10,0.45)',
          margin: '0 0 16px',
        }}
      >
        {archetype.outcome}
      </p>

      <h1
        className="archetype-title"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '64px',
          fontWeight: 300,
          color: 'var(--ink)',
          margin: '0 0 28px',
          lineHeight: 1,
        }}
      >
        The{' '}
        <em style={{ color: 'var(--green)', fontStyle: 'italic' }}>
          {archetype.titleName}
        </em>
      </h1>

      <p
        style={{
          fontSize: '15px',
          color: 'rgba(12,12,10,0.55)',
          fontWeight: 300,
          lineHeight: 1.8,
          maxWidth: '480px',
          margin: '0 auto 32px',
          fontFamily: 'var(--font-body)',
        }}
      >
        {archetype.description}
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {archetype.strengths.map((s) => (
          <span
            key={s}
            style={{
              border: '1px solid rgba(12,12,10,0.18)',
              color: 'rgba(12,12,10,0.65)',
              fontSize: '11px',
              letterSpacing: '0.5px',
              padding: '6px 14px',
              borderRadius: '3px',
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              display: 'inline-block',
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

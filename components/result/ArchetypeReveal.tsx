import { QuizResultId } from '@/types'

const ARCHETYPES = {
  seeker: {
    titleName: "Overthinker's Throne",
    emoji: "🌿",
    tagline: "Your mind doesn't clock out.",
    body: "You think through things before they happen, while they're happening, and long after they're done.\nYou catch things others miss. You anticipate. You prepare.\nIt feels productive — but it doesn't feel like rest.",
    unsaid: "you haven't been overthinking because you're anxious. You've been overthinking because it's how you've stayed safe.",
    resolution: "The exhaustion isn't from doing too much.\nIt's from a mind that's been on surveillance mode for years.\nYou don't need to think less. You need permission to finally put it down.",
  },
  healer: {
    titleName: "Open Door",
    emoji: "🌸",
    tagline: "You don't wait to be needed. You just open.",
    body: "Someone walks in with a problem — your energy shows up before they finish the sentence.\nYou make space. You adjust. You hold things.\nAnd you do it so naturally, most people don't even notice you had to.",
    unsaid: "you've been more accessible than you've been replenished.",
    resolution: "You're not tired because you gave too much.\nYou're tired because no one has been holding space for you the way you hold it for them.\nThis isn't about giving less.\nIt's about finally being someone you give to too.",
  },
  builder: {
    titleName: "Interrupted Engine",
    emoji: "⚡",
    tagline: "When you move, you're unstoppable. The problem is everything that stops you.",
    body: "You don't lack drive. You don't lack discipline.\nWhen momentum is on your side, you can outwork almost anyone.\nBut life keeps interrupting. And every time you have to start again, it costs more than just time.",
    unsaid: "every restart chips away at the trust you have in yourself.",
    resolution: "You're not drained because you're lazy.\nYou're drained because rebuilding momentum over and over is a heavy kind of work — and nobody talks about that.\nYou don't need more motivation. You need to stop bleeding energy at the breaks.",
  },
  visionary: {
    titleName: "Pushthrough",
    emoji: "✨",
    tagline: "You don't wait for permission to push. You just go.",
    body: "Tired? You keep going.\nOverwhelmed? You manage it.\nReady? You've never needed to be — you just move.\nThat's how you've gotten everything you have. That ability is real.",
    unsaid: "your body has been asking you to stop for a long time. You've just been too good at ignoring it.",
    resolution: "You're not worn down because you're weak.\nYou're worn down because rest has never felt like something you were allowed to have.\nThis isn't about slowing down forever. It's about learning that pausing is a power move — not a retreat.",
  },
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
        {archetype.tagline}
      </p>

      <h1
        className="archetype-title"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '64px',
          fontWeight: 300,
          color: 'var(--ink)',
          margin: '0 0 32px',
          lineHeight: 1,
        }}
      >
        The{' '}
        <em style={{ color: 'var(--green)', fontStyle: 'italic' }}>
          {archetype.titleName}
        </em>
      </h1>

      {/* Body */}
      <p
        style={{
          fontSize: '15px',
          color: 'rgba(12,12,10,0.55)',
          fontWeight: 300,
          lineHeight: 1.9,
          maxWidth: '480px',
          margin: '0 auto 28px',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'pre-line',
        }}
      >
        {archetype.body}
      </p>

      {/* Unsaid */}
      <div
        style={{
          background: 'rgba(12,12,10,0.035)',
          borderLeft: '2px solid var(--green)',
          borderRadius: '4px',
          padding: '16px 20px',
          margin: '0 auto 28px',
          maxWidth: '480px',
          textAlign: 'left',
        }}
      >
        <p
          style={{
            fontSize: '11px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--green)',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            margin: '0 0 8px',
          }}
        >
          Here&apos;s what usually goes unsaid:
        </p>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(12,12,10,0.65)',
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            lineHeight: 1.7,
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          {archetype.unsaid}
        </p>
      </div>

      {/* Resolution */}
      <p
        style={{
          fontSize: '15px',
          color: 'rgba(12,12,10,0.55)',
          fontWeight: 300,
          lineHeight: 1.9,
          maxWidth: '480px',
          margin: '0 auto',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'pre-line',
        }}
      >
        {archetype.resolution}
      </p>
    </div>
  )
}

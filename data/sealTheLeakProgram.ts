export type Phase = 'Awareness' | 'Interruption' | 'Reclamation' | 'Identity'

export interface ProgramDay {
  day: number
  title: string
  phase: Phase
  openingFrame: string
  prompt: { title: string; body: string; instruction?: string; items: string[] }
  action: { title: string; body: string }
  seal: string
  sealedIdentity?: string // Day 7 only
  proofs?: { label: string; quote: string }[] // Day 7 only
}

export interface ProgramRoute {
  id: string
  name: string
  color: string
  badgeColor: string
  textColor: string
  coreWound: string
  coreShift: string
  imageUrl: string
  days: ProgramDay[]
}

// Mapping from quiz archetype to program route
// Adjust this mapping as needed
export const archetypeToRoute: Record<string, string> = {
  seeker:    'door',
  visionary: 'throne',
  builder:   'engine',
  healer:    'push',
}

export const PHASE_ORDER: Phase[] = ['Awareness', 'Interruption', 'Reclamation', 'Identity']

export const PHASE_DAYS: Record<Phase, number[]> = {
  Awareness:    [1, 2],
  Interruption: [3, 4],
  Reclamation:  [5, 6],
  Identity:     [7],
}

export const programRoutes: Record<string, ProgramRoute> = {
  door: {
    id: 'door',
    name: 'The Open Door',
    color: '#3D3080',
    badgeColor: '#EEEDFE',
    textColor: '#3D3080',
    coreWound: 'Accessible to everyone but themselves.',
    coreShift: 'Choosing who and what gets their energy.',
    imageUrl: '/archetypes/door.jpg',
    days: [
      {
        day: 1,
        title: 'The cost of always being available',
        phase: 'Awareness',
        openingFrame: "You didn't decide to become the person everyone comes to. It happened gradually — and you were good at it, so it kept happening. Today isn't about guilt. It's about getting honest about what being available for everyone has cost you.",
        prompt: {
          title: 'The honest inventory',
          body: "Write down the last 5 times you gave your energy — time, attention, help, or emotional presence — to someone or something. Next to each one, mark: was this asked of me, or did I offer it before being asked? Was I replenished or depleted after? Don't judge what you find. Just see it.",
          items: [
            "Write down the last 5 times you gave your energy — time, attention, help, or emotional presence — to someone or something.",
            "Was each one asked of you, or did you offer before being asked?",
            "Were you replenished or depleted after each one?",
            "What patterns do you notice without judgment?",
          ],
        },
        action: {
          title: 'The 24-hour audit',
          body: "For the rest of today, every time you're about to give — respond to a message, help someone, volunteer information, offer to do something — pause for 3 seconds first. You don't have to stop doing it. Just pause and notice the impulse. That pause is the beginning of the seal.",
        },
        seal: 'I can see my pattern. Seeing it clearly is the first act of choosing differently.',
      },
      {
        day: 2,
        title: 'Who taught you this?',
        phase: 'Awareness',
        openingFrame: "Before you were someone who gave automatically, someone taught you — directly or indirectly — that your value was in your usefulness. Today you trace it back. Not to blame anyone. But to understand that what feels like your personality might actually be a learned survival strategy.",
        prompt: {
          title: 'The origin question',
          body: "Think back to the first relationship where you learned that being available, helpful, or needed kept things okay. It might have been a parent, a friend dynamic, a home environment. What did giving get you then? (Safety? Love? Peace? Approval?) How much of that trade is still running in the background today?",
          items: [
            "Think back to the first relationship where you learned that being available kept things okay. What was that environment like?",
            "What did giving get you then? Safety? Love? Peace? Approval?",
            "How much of that trade is still running in the background today?",
          ],
        },
        action: {
          title: 'Delay one response by 30 minutes',
          body: "Find one message or request you'd normally respond to immediately and let it sit for 30 minutes. While it sits, notice what happens in your body. Do you feel anxious? Guilty? Relieved? The feeling that comes up is data — it's showing you what you've been managing with your constant availability.",
        },
        seal: "My giving came from somewhere. Understanding where doesn't make me a victim — it makes me free.",
      },
      {
        day: 3,
        title: 'The check-in',
        phase: 'Interruption',
        openingFrame: "Here's the thing about automatic giving: it bypasses you entirely. The request comes in, and your 'yes' is already out the door before you've had a chance to consult yourself. Today you're installing a checkpoint — a brief moment between the ask and the answer where you actually exist in the equation.",
        prompt: {
          title: 'The consultation',
          body: "Before you say yes to anything today, ask yourself three questions in under 10 seconds: Do I actually want to do this? Do I have the energy for this right now? If I do this, what am I not doing for myself? You don't have to say no. You just have to check in first.",
          items: [
            "Do I actually want to do this?",
            "Do I have the energy for this right now?",
            "If I do this, what am I not doing for myself?",
          ],
        },
        action: {
          title: '"Let me check and get back to you" — once today',
          body: "To someone, for something. Any request. Use that exact phrase. Notice how the world doesn't end. Notice if they even push back. Most people will simply say 'of course.' The urgency you feel is internal — and today you're testing whether it's real.",
        },
        seal: "I am part of my own equation. My needs don't disappear — I've just been deciding they can wait. They can't.",
      },
      {
        day: 4,
        title: "What you haven't been protecting",
        phase: 'Interruption',
        openingFrame: "You are very good at protecting other people's time, comfort, and peace. You rearrange your schedule. You absorb the awkwardness so they don't have to. You hold back what you feel so the room stays okay. What would it look like to give yourself even half of that same protection?",
        prompt: {
          title: 'The protection inventory',
          body: "List three ways you protected someone else's comfort or peace in the last week. Then ask: who protected mine? If the answer is 'me' or 'no one' — that's the leak. Not dramatic. Just true. Write one thing you will protect for yourself today. One thing that is yours.",
          items: [
            "List three ways you protected someone else's comfort or peace in the last week.",
            "Who protected yours? If the answer is 'me' or 'no one' — that's the leak.",
            "Write one thing you will protect for yourself today. One thing that is yours.",
          ],
        },
        action: {
          title: 'One full no — or one quiet boundary',
          body: "It doesn't have to be big. Say no to a request you'd normally absorb, or simply don't volunteer for something you'd normally step forward for. You are not abandoning anyone. You are practicing being someone who also matters in their own life.",
        },
        seal: 'I protect what matters to me. I matter to me.',
      },
      {
        day: 5,
        title: 'Pouring back in',
        phase: 'Reclamation',
        openingFrame: "You've been identifying the leak for four days. Today isn't about the leak — it's about what gets to fill the space when the leak slows down. You've been so focused on what you give that you may have forgotten what you actually want. Today is about that.",
        prompt: {
          title: 'The want list',
          body: "Finish these sentences without editing yourself: I want more time for... I feel most like myself when... The last time I did something just for me was... If no one needed anything from me for 24 hours, I would... Don't worry if the answers feel small or selfish. That voice that called them selfish is exactly what we're retraining.",
          instruction: "Finish these sentences without editing yourself.",
          items: [
            "I want more time for...",
            "I feel most like myself when...",
            "The last time I did something just for me was...",
            "If no one needed anything from me for 24 hours, I would...",
          ],
        },
        action: {
          title: '30 uninterrupted minutes — yours entirely',
          body: "Do one thing from your want list above. No multitasking. No checking in on anyone. No justifying it. You don't need to earn this time. It's already yours. You're just claiming it.",
        },
        seal: 'My energy belongs to me first. What I give from here is a choice — not a reflex.',
      },
      {
        day: 6,
        title: 'Supportive without self-abandonment',
        phase: 'Reclamation',
        openingFrame: "Here's the fear that might be surfacing: 'If I stop giving the way I used to, will people still need me? Will they still love me?' That fear is real — and it's also the cage. Being supportive and being self-abandoning are not the same thing. Today you learn the difference in your body, not just your head.",
        prompt: {
          title: 'The difference question',
          body: "Think of one relationship where you give the most. Write about what it would look like to show up for that person from a full cup instead of a depleted one. What would you offer? What would you stop offering? What would actually change — and what wouldn't?",
          items: [
            "Think of one relationship where you give the most. What does it look like right now?",
            "What would you offer from a full cup instead of a depleted one?",
            "What would you stop offering?",
            "What would actually change — and what wouldn't?",
          ],
        },
        action: {
          title: 'Protect your calendar for 2 hours today',
          body: "Block two hours with no commitments to anyone else. Call it whatever you need to — 'focus time,' 'appointment,' 'unavailable.' Hold it. If someone asks, you're busy. You are.",
        },
        seal: "I can be someone's person without losing my own.",
      },
      {
        day: 7,
        title: 'Sealing the door',
        phase: 'Identity',
        openingFrame: "Seven days ago, your door was always open. For everyone. All the time. Without question. You've spent this week learning to be the one who decides when the door opens — not the hinge everyone swings through without knocking. This is the last day of the reset. It's also the first day of who you're becoming.",
        prompt: {
          title: 'The new identity letter',
          body: "Write a short letter (5–10 sentences) from your future self — the version of you six months from now who has been living with the door intentionally open and intentionally closed. What does she want you to know right now? What did she have to let go of? What did she get back?",
          items: [
            "Write a letter from your future self — six months from now — who has been living with the door on her terms.",
            "What does she want you to know right now?",
            "What did she have to let go of?",
            "What did she get back?",
          ],
        },
        action: {
          title: 'One full yes — and one full no',
          body: "Today, say yes to something that fills you. Say no to (or don't volunteer for) something that would have emptied you. Not as an exercise — as a declaration. This is who you are now. Someone who chooses.",
        },
        seal: "I can be someone's person without losing my own.",
        sealedIdentity: "I am no longer over-accessible. I am intentionally available — to myself first, and then by choice to others. My door opens on my terms now.",
        proofs: [
          { label: 'You showed up for yourself', quote: 'I paused before pouring out — and the world stayed intact.' },
          { label: 'You interrupted the pattern', quote: 'I said let me get back to you. I said no. I took the 30 minutes.' },
          { label: 'You reclaimed something real', quote: 'I remembered what I want — and I gave it to myself.' },
          { label: 'You changed the story', quote: "Being a giver doesn't mean being depleted. That story is done." },
        ],
      },
    ],
  },

  throne: {
    id: 'throne',
    name: 'The Overthink Throne',
    color: '#1A5230',
    badgeColor: '#E1F5EE',
    textColor: '#1A5230',
    coreWound: 'The mind became a control mechanism. Thinking feels safe; not-thinking feels dangerous.',
    coreShift: 'Action as the antidote to mental noise.',
    imageUrl: '/archetypes/throne.jpg',
    days: [
      {
        day: 1,
        title: 'What your mind is actually doing',
        phase: 'Awareness',
        openingFrame: "Your mind is not broken. It's working exactly as it was trained to work — scanning, preparing, anticipating, replaying. The problem isn't your intelligence. It's that your mind has been doing security detail 24 hours a day and nobody gave it permission to stand down.",
        prompt: {
          title: 'The mental inventory',
          body: "For 10 minutes, write down every thought that's been cycling through your mind this week. Everything — big, small, mundane. Don't organize it. Let it pour out messy. At the end, look at the list and ask: how many of these are things I can actually control or change right now? Circle those. Everything else is the noise.",
          items: [
            "Write down every thought that's been cycling this week — big, small, mundane. Let it pour out messy.",
            "Which of these can you actually control or change right now?",
            "What is the loudest piece of mental noise you're ready to name?",
          ],
        },
        action: {
          title: 'Write it once — then close the tab',
          body: "Pick the thought you've replayed the most this week. Write it down in one sentence. Underneath it, write: 'I have recorded this. It no longer needs to repeat.' Then close the journal. Walk away.",
        },
        seal: "My mind has been trying to protect me. Today I start showing it that I'm safe — even without all the answers.",
      },
      {
        day: 2,
        title: 'The throne you built',
        phase: 'Awareness',
        openingFrame: "Here's something most people never say out loud: overthinking has benefits. It feels productive. It feels responsible. It keeps you in a state of 'getting ready' that lets you avoid the risk of actually doing. Today you get honest about what the throne has given you — and what it's cost you.",
        prompt: {
          title: 'The payoff question',
          body: "What has overthinking protected you from? Write honestly — has it kept you from failing? From being judged? From having to be vulnerable? From deciding and being wrong? And then: what has it kept you from having? The relationship? The business? The conversation? The move? Both answers are true. Hold them both.",
          items: [
            "What has overthinking protected you from? (Failing? Being judged? Being vulnerable? Being wrong?)",
            "What has it kept you from having? (A relationship? A business? A conversation? A move?)",
            "What does it feel like to hold both of those truths at once?",
          ],
        },
        action: {
          title: 'Make one decision in under 60 seconds',
          body: "Find something you've been 'thinking about' — a response to send, a small choice to make, an action you keep postponing. Give yourself 60 seconds, decide, and execute. Notice what happens when the decision is made — is the relief bigger than the anxiety was?",
        },
        seal: "I don't need to figure everything out before I move. Clarity is something I walk toward — not something I think my way into.",
      },
      {
        day: 3,
        title: 'Breaking the loop',
        phase: 'Interruption',
        openingFrame: "The overthinking loop has a physical location — you can actually feel it start in your chest or your head when a thought begins to spiral. Today you're learning to interrupt the loop before it runs. Not by thinking better thoughts. By doing something instead.",
        prompt: {
          title: 'Map the loop',
          body: "Think about the last time you spiraled on a thought or decision. Write out exactly how it moved: what triggered it, how it escalated, how long it lasted, how it ended. Then ask: what physical action, done in that first moment, might have interrupted the spiral before it started?",
          items: [
            "What triggered the last spiral?",
            "How did it escalate, and how long did it last?",
            "How did it end?",
            "What physical action, done in that first moment, might have interrupted it before it started?",
          ],
        },
        action: {
          title: "Take one imperfect action on something you've been overthinking",
          body: "It doesn't need to be finished. It doesn't need to be right. It needs to exist — in the real world, outside your head. Send the draft. Make the appointment. Write the first sentence. Take the one step.",
        },
        seal: "Done is more powerful than perfect. I can correct course when I'm moving — I can't correct course when I'm standing still.",
      },
      {
        day: 4,
        title: 'Deciding instead of spiraling',
        phase: 'Interruption',
        openingFrame: "Spiraling is a substitute for deciding. As long as you're turning something over in your mind, you haven't had to commit — and you can't be wrong. But you also can't move. Today you practice the muscle that ends the spiral: the decision muscle.",
        prompt: {
          title: 'The decision drain',
          body: "List every decision — small and large — that is currently 'open' in your mind. Things you haven't decided yet. Things you keep revisiting. Look at each one and ask: if I had to decide this right now with what I already know, what would I choose? Write the answer.",
          items: [
            "List every decision — small and large — currently 'open' in your mind.",
            "For each one: if you had to decide right now with what you already know, what would you choose?",
            "Which open decision is draining the most energy? What's actually stopping you from closing it?",
          ],
        },
        action: {
          title: 'Close three open loops today',
          body: "Pick three small decisions from your list and make them final. Send the response. Confirm the plan. Cancel the thing you know you're not going to do. Make the call. Each closed loop is energy returned to you.",
        },
        seal: "I trust myself to decide. I don't need certainty first — I need courage first.",
      },
      {
        day: 5,
        title: 'What rest for your mind actually feels like',
        phase: 'Reclamation',
        openingFrame: "You have probably tried to 'stop overthinking' before. Told yourself to just let it go. It didn't work — because you were trying to use your mind to stop your mind. Today instead of fighting your thoughts, you're going to give your nervous system a different experience entirely.",
        prompt: {
          title: 'The body question',
          body: "When did your mind last feel genuinely quiet? Not numbed out, not exhausted — actually quiet. What were you doing? Where were you? What did your body feel like in that moment? Write about it in detail. You're not just remembering it — you're identifying your personal pathway to mental rest.",
          items: [
            "When did your mind last feel genuinely quiet — not numbed, not exhausted, actually quiet?",
            "What were you doing? Where were you?",
            "What did your body feel like in that moment?",
          ],
        },
        action: {
          title: 'One hour with no analyzing',
          body: "Do something that engages your body or your senses — walk without a podcast, cook, draw, move, sit outside, shower slowly. No problem-solving allowed. If a thought comes up, don't follow it. Let it pass like a cloud.",
        },
        seal: "I live beyond my thoughts. They pass through me — they do not define what's possible for me.",
      },
      {
        day: 6,
        title: 'Building the new relationship with your mind',
        phase: 'Reclamation',
        openingFrame: "You are not trying to get rid of your analytical mind. It's a gift — you see things, you solve things, you connect dots that other people miss. What you're building is a different relationship with it. One where you are the one in charge, not the one being driven.",
        prompt: {
          title: 'The reclaimed gifts',
          body: "Write about three ways your mind serves you powerfully — not anxiously, but genuinely. How does your depth of thinking benefit your life, your work, your relationships? Now: what would you gain if you could turn it on and off by choice instead of having it run constantly?",
          items: [
            "Write about three ways your mind serves you powerfully — not anxiously, but genuinely.",
            "How does your depth of thinking benefit your life, your work, your relationships?",
            "What would you gain if you could turn it on and off by choice instead of having it run constantly?",
          ],
        },
        action: {
          title: 'Use your mind on purpose today',
          body: "Pick one area of your life where your analytical thinking is genuinely useful. Give your mind 30 focused minutes on that thing. Then close it deliberately. Tell yourself: 'I've thought about this enough for today.' Then do something physical.",
        },
        seal: "My mind is a tool I use — not a room I'm trapped in.",
      },
      {
        day: 7,
        title: 'Stepping down from the throne',
        phase: 'Identity',
        openingFrame: "The throne was built for a reason. It kept you prepared, in control, ready for whatever came. You're not destroying it — you're just learning that you don't have to live there. You can think powerfully without thinking constantly. That's the identity you're stepping into today.",
        prompt: {
          title: 'The identity shift letter',
          body: "Write to the version of you who used to stay up turning things over and over. Tell her what you know now. Tell her what changed this week. Tell her what it feels like to take an imperfect action and survive it. Tell her she can put it down.",
          items: [
            "Write to the version of you who used to stay up turning things over and over.",
            "Tell her what you know now that she didn't.",
            "Tell her what changed this week.",
            "Tell her what it feels like to take an imperfect action and survive it.",
          ],
        },
        action: {
          title: "Make one real move on something you've been overthinking for weeks",
          body: "Not months of deliberation. Not the perfect conditions. Today. One move. Your mind has had enough time with this one. Let your action catch up.",
        },
        seal: "My mind is a tool I use — not a room I'm trapped in.",
        sealedIdentity: "I am no longer someone who thinks instead of lives. I have a powerful mind and I choose when to use it. I move — even without all the answers. Especially without all the answers.",
        proofs: [
          { label: 'You interrupted the loop', quote: 'I wrote it down once and walked away. The thought survived. So did I.' },
          { label: 'You made imperfect moves', quote: 'I acted without certainty — and it worked well enough.' },
          { label: 'You found your rest', quote: 'I know what quiet feels like for me now. I can return to it.' },
          { label: 'You reclaimed your mind', quote: "It's a gift when I use it. It's a prison when it uses me. I know the difference now." },
        ],
      },
    ],
  },

  engine: {
    id: 'engine',
    name: 'The Interrupted Engine',
    color: '#7D1F1F',
    badgeColor: '#FAECE7',
    textColor: '#7D1F1F',
    coreWound: 'Momentum interruptions erode self-trust over time. Each restart costs more than the last.',
    coreShift: "Building an engine that doesn't require perfect conditions.",
    imageUrl: '/archetypes/engine.jpg',
    days: [
      {
        day: 1,
        title: 'The real cost of starting over',
        phase: 'Awareness',
        openingFrame: "You know how to begin. That was never the problem. The problem is what happens to your belief in yourself every time life interrupts and you have to begin again. The cost isn't just the lost time — it's the quiet accumulation of evidence your brain is collecting that says 'you can't finish things.' Today you audit that evidence.",
        prompt: {
          title: 'The restart inventory',
          body: "Write down every major thing you've started and restarted in the last year. A goal, a habit, a project, a plan. Next to each one, don't write 'why I stopped.' Write what it felt like to have to start again. Was it shame? Frustration? A quiet giving-up? The emotional cost is what matters here, not the logistics.",
          items: [
            "Write down every major thing you've started and restarted in the last year — a goal, habit, project, plan.",
            "For each one: what did it feel like to have to start again? (Shame? Frustration? A quiet giving-up?)",
            "What is the emotional cost you've been carrying without naming it?",
          ],
        },
        action: {
          title: 'Name the actual interruption pattern',
          body: "Looking at your list above, what is the most common thing that derails your momentum? (Be specific — not 'life,' but: emotional overwhelm? Other people's needs? Perfectionism?) Write it in one sentence. Naming it precisely is the beginning of outsmarting it.",
        },
        seal: "Every restart I've survived proves I have more resilience than evidence. Today I start counting differently.",
      },
      {
        day: 2,
        title: 'When you were in flow',
        phase: 'Awareness',
        openingFrame: "You've felt the other side — the version of you that's locked in, moving, building. That experience is real data. Today you go back to it not to feel nostalgic but to understand your own operating system. What were the exact conditions when your engine ran clean?",
        prompt: {
          title: 'The flow state autopsy',
          body: "Think of a time in the last two years when you were genuinely in momentum. Describe it in detail: what were you working on? What time of day? What was your environment like? What had you done the night before? Understanding your personal flow conditions is how you start engineering them.",
          items: [
            "Think of a time in the last two years when you were genuinely in momentum. What were you working on?",
            "What time of day was it? What was your environment like?",
            "What had you done the night before? What conditions made it possible?",
          ],
        },
        action: {
          title: 'Recreate one flow condition today',
          body: "Pick one element from your flow state description — the time of day, the environment, the routine — and recreate it today. Work on anything. The point isn't the project. The point is that your nervous system remembers what flow feels like when you give it the conditions.",
        },
        seal: "I know what I need to run well. That knowledge is power — and I'm using it.",
      },
      {
        day: 3,
        title: 'The minimum viable move',
        phase: 'Interruption',
        openingFrame: "One of the hidden reasons your engine keeps stalling: you're requiring too much of yourself at the re-entry point. After an interruption, you try to come back at full speed — and when that's not possible, you don't come back at all. Today you learn the power of the minimum viable move.",
        prompt: {
          title: 'The minimum version',
          body: "Think about the goal or project you've restarted most often. What is the absolute smallest version of showing up to it? Not 2 hours. Not a full session. The version that takes 10 minutes or less but still counts. Write that minimum version down. Make it embarrassingly small.",
          items: [
            "What is the goal or project you've restarted most often?",
            "What is the absolute smallest version of showing up to it — 10 minutes or less, but still counts?",
            "Why has 'minimum' felt like not enough? What story are you ready to let go of?",
          ],
        },
        action: {
          title: 'Do the minimum version right now',
          body: "10 minutes. On the thing. Not perfectly. Just present. The minimum version is not the goal — it's the bridge that keeps you connected to the goal during the interruptions. You are not falling behind when you show up in 10 minutes. You are staying in the game.",
        },
        seal: "I don't restart — I continue. The size of the step doesn't determine whether I moved.",
      },
      {
        day: 4,
        title: 'Protecting the momentum',
        phase: 'Interruption',
        openingFrame: "Momentum is not just something that happens to you — it's something you can protect. That requires knowing your specific interruption patterns (you identified one on Day 1) and building a small buffer around your most important work. Today you build the buffer.",
        prompt: {
          title: 'The protection plan',
          body: "For the one thing that matters most to you right now, answer: What time of day is this most protected? What one thing usually interrupts it, and how can I reduce that this week? Who knows I'm working on this? What does 'showing up even when it's imperfect' look like for this specific thing?",
          items: [
            "What is the one thing that matters most to you right now?",
            "What time of day is it most protected?",
            "What one thing usually interrupts it — and how can you reduce that this week?",
            "What does 'showing up even when it's imperfect' look like for this specific thing?",
          ],
        },
        action: {
          title: 'Set up one protection',
          body: "Block time on your calendar. Tell one person what you're working on. Remove one friction point from the re-entry (have your journal already open, your workout clothes already out, the app already on your homescreen). Small protections compound into sustained momentum.",
        },
        seal: "I protect what I'm building. Not because it's fragile — because it's worth protecting.",
      },
      {
        day: 5,
        title: 'Rebuilding trust with yourself',
        phase: 'Reclamation',
        openingFrame: "Here's the real wound under the momentum problem: every time you stopped and didn't come back, a part of you registered it as a promise broken to yourself. Over time, those small breaks in self-trust accumulated into a pattern where your own commitments feel negotiable. Today you start rebuilding that trust — one kept promise at a time.",
        prompt: {
          title: 'The trust ledger',
          body: "Write two lists. First: things I said I would do for myself that I didn't follow through on. Second: things I said I would do for myself and I did. Look at both lists. Which is longer? Now ask: how would I treat a friend who showed the same pattern with me?",
          items: [
            "Things I said I would do for myself that I didn't follow through on:",
            "Things I said I would do for myself and I actually did:",
            "Which list is longer? How would you treat a friend who showed the same pattern with you?",
          ],
        },
        action: {
          title: 'Keep one promise to yourself today — a small one',
          body: "Make a commitment to yourself this morning that you can absolutely keep by tonight. Something small. And then keep it. Not for motivation. Not for the outcome. For the deposit it makes in your self-trust account.",
        },
        seal: "I am someone who follows through. I'm building the evidence right now, today, with this one thing.",
      },
      {
        day: 6,
        title: 'What consistency actually feels like',
        phase: 'Reclamation',
        openingFrame: "Consistency doesn't feel like fire every day. Most people who are consistent don't feel motivated — they feel disciplined. They've made a decision and they return to it even when the feeling is flat. But there is something that grows underneath that discipline: a quiet, deep confidence. Today you practice what that feels like.",
        prompt: {
          title: 'The consistency question',
          body: "Think about one area of your life where you are already consistent — even if it feels mundane. How did you build that consistency? Was it forced at first? Did it eventually become natural? You already have this skill. The question is: where else are you going to apply it?",
          items: [
            "What is one area of your life where you're already consistent — even if it feels mundane?",
            "How did you build that consistency? Was it forced at first?",
            "Where else are you going to apply this same capacity?",
          ],
        },
        action: {
          title: "Repeat yesterday's action",
          body: "Do the same thing you did yesterday. The minimum version. The kept promise. The 10 minutes. Two consecutive days is the beginning of a pattern. It is no longer a single event — it's a streak. And your brain treats streaks very differently than single actions.",
        },
        seal: "Two days is a streak. Three is a pattern. I am building something real — one return at a time.",
      },
      {
        day: 7,
        title: 'The engine that runs in any weather',
        phase: 'Identity',
        openingFrame: "A week ago, you needed perfect conditions to keep going. You needed the mood, the energy, the clear calendar, the right moment. This week you proved that's not true. You moved when it was inconvenient. You showed up in the minimum version. You kept one promise. The engine didn't need perfect conditions. It just needed you.",
        prompt: {
          title: 'The proof letter',
          body: "Write out the evidence from this week. What did you actually do — even the small things? What did you keep going despite? What surprised you about your own follow-through? You are writing the new story about who you are.",
          items: [
            "What did you actually do this week — even the small things?",
            "What did you keep going despite?",
            "What surprised you about your own follow-through?",
          ],
        },
        action: {
          title: 'Complete one thing fully today',
          body: "It can be small. But let it have a beginning, a middle, and a done. Feel what 'done' feels like in your body. That feeling is available to you all the time — you just need to keep choosing it.",
        },
        seal: "Two days is a streak. Three is a pattern. I am building something real — one return at a time.",
        sealedIdentity: "I am not someone who needs perfect conditions to move. I am an engine that runs in any weather. Interruptions don't stop me — they just mean I get to prove it again.",
        proofs: [
          { label: 'You named the pattern', quote: 'I know what interrupts me. And I know how to protect against it.' },
          { label: 'You used the minimum', quote: '10 minutes counts. Showing up in the minimum version is still showing up.' },
          { label: 'You kept a promise', quote: "I made a commitment to myself and I held it. That's a deposit I don't take back." },
          { label: 'You built a streak', quote: 'Two days became the proof. The engine runs — even without the fire.' },
        ],
      },
    ],
  },

  push: {
    id: 'push',
    name: 'The Pushthrough',
    color: '#7A5800',
    badgeColor: '#FAEEDA',
    textColor: '#7A5800',
    coreWound: 'Rest was never safe, so the body learned to be ignored.',
    coreShift: 'The body becomes a trusted source of information — not an obstacle to override.',
    imageUrl: '/archetypes/push.jpg',
    days: [
      {
        day: 1,
        title: "The signals you've been skipping",
        phase: 'Awareness',
        openingFrame: "Your body has a communication system that's been running the whole time. Tight chest. Heavy eyelids. That irritability that shows up from nowhere. The headache that arrives by 3pm. You haven't been ignoring these signals because you're careless — you've been ignoring them because at some point, stopping didn't feel like an option. Today you start listening.",
        prompt: {
          title: 'The body audit',
          body: "Right now, sit quietly for 3 minutes. Starting from your feet and moving up through your body — what do you notice? Where is there tension? Where do you feel heavy or tight? Where are you holding something? Write it down without trying to fix it. Your body has been keeping score of everything you've pushed through.",
          items: [
            "Sit quietly for 3 minutes. Starting from your feet and moving up — what do you notice?",
            "Where is there tension? Where do you feel heavy or tight?",
            "Where are you holding something? What has your body been keeping score of?",
          ],
        },
        action: {
          title: 'Pause for 10 minutes — no input',
          body: "No phone. No podcast. No content. Sit or lie down in a quiet space for 10 minutes. If your mind tells you this is a waste of time, that thought is the data. You don't have to feel peaceful — you just have to stay.",
        },
        seal: "My body has been speaking. Today I finally sat down long enough to hear it.",
      },
      {
        day: 2,
        title: 'Where did pushing come from?',
        phase: 'Awareness',
        openingFrame: "You didn't start out overriding your limits. Something taught you to. Maybe rest felt lazy in the home you grew up in. Maybe you learned early that needing things made you a burden. Maybe the only way to feel valuable was to keep producing. Today you trace it — gently, without blame.",
        prompt: {
          title: 'The origin of the push',
          body: "When did you first learn that pushing through was the right thing to do? Was it praised at home? Necessary for survival? A way to feel in control? Write about the version of you who first learned to override — what were they dealing with? What did pushing through get them?",
          items: [
            "When did you first learn that pushing through was the right thing to do?",
            "Was it praised at home? Necessary for survival? A way to feel in control?",
            "What was that version of you dealing with — and what did pushing through get her?",
          ],
        },
        action: {
          title: 'Stop one thing earlier than you normally would',
          body: "Pick any task today and stop before you hit the wall. Before you're done, before you're exhausted, before you've squeezed every drop. Stop while there's still something left. Stopping early is not failure. It is an act of profound self-respect.",
        },
        seal: "The version of me who learned to push through did what she had to. I'm building a different way now — and she would be proud.",
      },
      {
        day: 3,
        title: 'Real time response',
        phase: 'Interruption',
        openingFrame: "The gap between what your body signals and what you do about it has been very wide for a long time. Today you practice collapsing that gap. Not dramatically — just by responding to one signal, in real time, before you override it.",
        prompt: {
          title: 'The signal log',
          body: "Set three reminders on your phone today at random times. When each one goes off, stop and write: What is my body telling me right now? What am I doing instead of responding to that? What would responding to it actually take? This is not about always responding — it's about always knowing.",
          items: [
            "What is my body telling me right now?",
            "What am I doing instead of responding to that?",
            "What would responding to it actually take?",
          ],
        },
        action: {
          title: 'Respond to one signal today — in the moment',
          body: "One time. When your body sends a signal, don't defer it. Drink the water. Eat when you're actually hungry. Step outside for 5 minutes. Stretch the tension in your neck. Lie down for 10. The action itself is less important than the practice of responding before it becomes an emergency.",
        },
        seal: "I respond to my body in real time. I don't wait until I'm running on empty to notice I'm low.",
      },
      {
        day: 4,
        title: 'Redefining what rest is',
        phase: 'Interruption',
        openingFrame: "For most pushroughs, 'rest' has been defined as collapse — what happens when you finally have no choice but to stop. That's not rest. That's recovery from depletion. Real rest is something you choose before the depletion hits. It's strategic. It's powerful. Today you start to see it that way.",
        prompt: {
          title: 'The rest question',
          body: "What does genuine rest feel like for you — not just sleep, but true restoration? Is it quiet? Movement? Creative? Social? Time in nature? Solitude? Write about the last time you felt genuinely restored. What were the ingredients?",
          items: [
            "What does genuine rest feel like for you — not just sleep, but true restoration?",
            "Is it quiet? Movement? Creative? Social? Time in nature? Solitude?",
            "Write about the last time you felt genuinely restored. What were the ingredients?",
          ],
        },
        action: {
          title: 'Slow your pace intentionally for one hour',
          body: "Whatever you're doing this hour — do it at 70% speed. Walk more slowly. Eat without looking at a screen. Drive without urgency. Respond to messages without rushing. Slowing down on purpose interrupts the signal to your nervous system that everything is an emergency.",
        },
        seal: "Rest is not what happens when I break down. Rest is what I choose so I don't.",
      },
      {
        day: 5,
        title: 'Proactive rest',
        phase: 'Reclamation',
        openingFrame: "You've rested reactively your whole life — after the breakdown, after the burnout, after you had no choice. Proactive rest is different. It's the choice you make before the exhaustion arrives — as a strategy, not a surrender. Today you practice taking rest before you need it.",
        prompt: {
          title: 'The fuel gauge check',
          body: "On a scale of 1–10, rate your current energy in these four areas: physical, mental, emotional, spiritual. Write a sentence about each. Where are you running lowest? What would replenish it — not temporarily, but actually?",
          items: [
            "Physical energy (1–10) — what does that number feel like in your body right now?",
            "Mental energy (1–10) — what's draining it most?",
            "Emotional energy (1–10) — what are you carrying?",
            "Spiritual energy (1–10) — what would actually replenish it?",
          ],
        },
        action: {
          title: 'Rest before you need to — today',
          body: "Before you hit your threshold, take a deliberate rest. Schedule it. Protect it. Use it for the thing that replenishes your lowest area from the prompt above. Proactive rest is what sustainable high performance actually looks like.",
        },
        seal: "Rest is proactive, not reactive. I choose it before I need it — and that's what makes me sustainable.",
      },
      {
        day: 6,
        title: 'What it feels like to be connected',
        phase: 'Reclamation',
        openingFrame: "Most pushroughs live slightly above their bodies — operating from the neck up, managing the physical self from a distance. Connection to your body isn't a luxury or a wellness trend. It's the difference between living in your life and managing it from a distance. Today you practice what it feels like to be in yours.",
        prompt: {
          title: 'The connection check',
          body: "Check in with your body three times today at set intervals — morning, midday, evening. Each time, write three words that describe what you physically feel. At the end of the day, look at the three entries. What changed throughout the day? What stayed the same?",
          items: [
            "Morning check-in — three words that describe what you physically feel:",
            "Midday check-in — three words:",
            "Evening check-in — three words:",
            "What changed throughout the day? What stayed the same?",
          ],
        },
        action: {
          title: 'Move your body in a way that feels good — not productive',
          body: "Not a workout for results. Movement that you choose because it feels good — a slow walk, stretching, dancing alone in your kitchen, lying on the floor. Your body deserves to be in motion for pleasure, not just performance.",
        },
        seal: "I am connected to myself. My body is not an obstacle to manage — it is home.",
      },
      {
        day: 7,
        title: 'Honoring your energy',
        phase: 'Identity',
        openingFrame: "You have pushed through more than most people will ever attempt. That strength is real and it has served you. But strength that doesn't know when to rest eventually becomes brittleness. The version of you emerging this week is not weaker — she is more regulated, more sustainable, more powerful in the long run. She is you, finally listening.",
        prompt: {
          title: 'The letter to your body',
          body: "Write a letter to your body. Acknowledge what you've asked it to carry. Thank it for what it's continued to do despite being overridden. Tell it what's changing. Tell it what you're committing to. Make it a real commitment — not a list of habits, but a promise of relationship.",
          items: [
            "Acknowledge what you've asked your body to carry.",
            "Thank it for what it's continued to do despite being overridden.",
            "Tell it what's changing.",
            "Tell it what you're committing to — not a list of habits, but a promise of relationship.",
          ],
        },
        action: {
          title: 'Move slowly and intentionally all day',
          body: "Not just this hour. All day. Let this be a practice in what it feels like to be present in your own life rather than racing through it. Notice what you see when you slow down. Notice who you are when you're not performing endurance.",
        },
        seal: "I am connected to myself. My body is not an obstacle to manage — it is home.",
        sealedIdentity: "I honor my energy. I have proven that I can push through anything — now I'm proving that I don't have to. Rest is not weakness in my story. It is the most powerful thing I've ever chosen.",
        proofs: [
          { label: 'You heard the signal', quote: "I stopped and listened — and nothing fell apart when I did." },
          { label: 'You stopped early', quote: "I left something in the tank. That's not weakness. That's wisdom." },
          { label: 'You rested proactively', quote: "I chose rest before the emergency. That's a different version of me." },
          { label: 'You came home', quote: "I am connected to my body now. That connection is the foundation of everything else." },
        ],
      },
    ],
  },
}

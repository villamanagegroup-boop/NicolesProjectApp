import { ProgramModule } from '@/types'

export const mockModules: ProgramModule[] = [
  {
    id: 'module-1',
    title: 'The Foundation',
    description:
      'Before transformation comes truth. This module strips away the noise and brings you back to yourself — who you are beneath the roles, the titles, and the expectations.',
    orderIndex: 1,
    lessons: [
      {
        id: 'lesson-1-1',
        moduleId: 'module-1',
        title: 'Who Were You Before the World Got to You?',
        description:
          'An honest look at identity, conditioning, and reclaiming your original self. We explore the difference between who you were shaped to be and who you actually are.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 18,
        orderIndex: 1,
      },
      {
        id: 'lesson-1-2',
        moduleId: 'module-1',
        title: 'The Stories You Inherited',
        description:
          'The beliefs you carry were largely handed to you — by family, culture, religion, and circumstance. This lesson helps you identify which ones to keep and which ones to release.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 22,
        orderIndex: 2,
      },
      {
        id: 'lesson-1-3',
        moduleId: 'module-1',
        title: 'Mapping Your Inner Landscape',
        description:
          'A guided self-audit to understand your values, your wounds, and your gifts. You cannot build a new life on a foundation you have not examined.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 25,
        orderIndex: 3,
      },
      {
        id: 'lesson-1-4',
        moduleId: 'module-1',
        title: 'Choosing Your Path Forward',
        description:
          'With a clear picture of where you have been, you are now equipped to choose — deliberately, consciously — where you are going. This lesson closes the foundation and opens the door.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 20,
        orderIndex: 4,
      },
    ],
  },
  {
    id: 'module-2',
    title: 'The Inner Work',
    description:
      'This is where the real transformation happens. Module 2 takes you into the patterns, emotions, and wounds that have been running your life from backstage — and teaches you how to take the wheel.',
    orderIndex: 2,
    lessons: [
      {
        id: 'lesson-2-1',
        moduleId: 'module-2',
        title: 'Understanding Your Emotional Blueprint',
        description:
          'Your emotional responses were learned, not born with you. This lesson breaks down how your nervous system learned to protect you — and how to gently retrain it for growth.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 28,
        orderIndex: 1,
      },
      {
        id: 'lesson-2-2',
        moduleId: 'module-2',
        title: 'Breaking the Pattern Loop',
        description:
          'Why do the same situations keep showing up in your life? This lesson explores the mechanics of behavioral patterns and gives you a practical framework for interrupting them.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 24,
        orderIndex: 2,
      },
      {
        id: 'lesson-2-3',
        moduleId: 'module-2',
        title: 'Healing the Inner Critic',
        description:
          'The harshest voice in your life is often the one inside your own head. This lesson explores where that voice came from and how to transform it from saboteur to supporter.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 30,
        orderIndex: 3,
      },
    ],
  },
  {
    id: 'module-3',
    title: 'The New Becoming',
    description:
      'You have done the excavation. Now you build. This module is about embodying the person you are choosing to be — through new habits, new language, new relationships, and a new relationship with yourself.',
    orderIndex: 3,
    lessons: [
      {
        id: 'lesson-3-1',
        moduleId: 'module-3',
        title: 'Building Rituals That Hold You',
        description:
          'Transformation without ritual does not stick. This lesson helps you design a daily practice that is sustainable, personalized, and rooted in who you are — not who the internet tells you to be.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 26,
        orderIndex: 1,
      },
      {
        id: 'lesson-3-2',
        moduleId: 'module-3',
        title: 'Rewriting the Narrative',
        description:
          'The story you tell about your life shapes the life you live. This lesson teaches you how to reframe your past without erasing it — and how to author the next chapter with intention.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 22,
        orderIndex: 2,
      },
      {
        id: 'lesson-3-3',
        moduleId: 'module-3',
        title: 'Relationships at Your New Level',
        description:
          'Growth changes you — and sometimes it changes who belongs in your life. This lesson navigates the relational shifts that come with becoming, and how to move through them with grace.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 27,
        orderIndex: 3,
      },
      {
        id: 'lesson-3-4',
        moduleId: 'module-3',
        title: 'Living as the Person You Are Becoming',
        description:
          'This final lesson is not a conclusion — it is a commission. You will leave with a clear vision, a grounded identity, and the tools to keep choosing yourself every single day.',
        videoUrl: null, // TODO: Add video URL
        durationMinutes: 32,
        orderIndex: 4,
      },
    ],
  },
]

import { QuizResultId } from '@/types'
import { quizQuestions } from '@/data/quizData'

export function scoreQuiz(answers: Record<number, string>): QuizResultId {
  const counts: Record<QuizResultId, number> = {
    seeker: 0,
    builder: 0,
    healer: 0,
    visionary: 0,
  }

  for (const question of quizQuestions) {
    const selectedValue = answers[question.id]
    if (!selectedValue) continue

    const selectedOption = question.options.find(opt => opt.value === selectedValue)
    if (selectedOption) {
      counts[selectedOption.archetype]++
    }
  }

  // Find the archetype with the highest count
  const winner = (Object.entries(counts) as [QuizResultId, number][]).reduce(
    (best, current) => (current[1] > best[1] ? current : best),
    ['seeker', 0] as [QuizResultId, number]
  )

  return winner[0]
}

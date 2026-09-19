import { getDateKey } from "./dateKey"
import type { Dish, UserState } from "./models"

export interface QuizQuestion {
  id: string
  hint: string
  options: Dish[]
  answerId: string
}

function hash(value: string): number {
  let code = 2166136261
  for (const char of value) code = Math.imul(code ^ char.charCodeAt(0), 16777619)
  return code >>> 0
}

export function getDailyQuestions(dishes: Dish[], date = getDateKey()): QuizQuestion[] {
  const pool = dishes.filter((dish) => dish.active && dish.type !== "limited")
  if (pool.length < 4) return []
  const ranked = [...pool].sort((a, b) => hash(`${date}:${a.id}`) - hash(`${date}:${b.id}`))
  return ranked.slice(0, Math.min(3, Math.floor(ranked.length / 4))).map((answer, index) => {
    const decoys = ranked.filter((dish) => dish.id !== answer.id).slice(3 + index * 3, 6 + index * 3)
    const options = [answer, ...decoys].sort((a, b) => hash(`${date}:${index}:${a.id}`) - hash(`${date}:${index}:${b.id}`))
    return { id: `quiz-${date}-${index}`, hint: answer.description || `Món ${answer.category || "ngon"}`, options, answerId: answer.id }
  })
}

export function answerDailyQuestion(state: UserState, question: QuizQuestion, answerId: string, date = getDateKey()): { state: UserState; correct: boolean; error?: string } {
  const questionsForDay = question.id.startsWith(`quiz-${date}-`)
  if (!questionsForDay || !question.options.some((option) => option.id === answerId)) return { state, correct: false, error: "Câu hỏi không hợp lệ." }
  const answers = state.dailyQuiz?.date === date ? state.dailyQuiz.answers : {}
  if (answers[question.id]) return { state, correct: false, error: "Bạn đã trả lời câu này hôm nay." }
  const correct = answerId === question.answerId
  const now = new Date().toISOString()
  const keys = state.keys + (correct ? 1 : 0)
  return {
    correct,
    state: {
      ...state,
      keys,
      dailyQuiz: { date, answers: { ...answers, [question.id]: answerId } },
      keyTransactions: correct ? [...state.keyTransactions, { id: crypto.randomUUID(), amount: 1, balanceAfter: keys, reason: "daily_quiz", createdAt: now, referenceId: question.id }] : state.keyTransactions,
      updatedAt: now,
    },
  }
}

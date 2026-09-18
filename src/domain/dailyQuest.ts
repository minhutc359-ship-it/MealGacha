import { getCurrentHour, getDateKey } from "./dateKey"
import { Dish, KeyTransaction, UserState } from "./models"

export const DAILY_QUEST_KEYS = 3

export type DailyQuestId = "taste_code" | "meal_oracle"

export interface DailyQuestOption {
  id: string
  label: string
}

export interface DailyQuest {
  id: DailyQuestId
  cycle: string
  title: string
  clue: string
  options: DailyQuestOption[]
  targetOptionId: string
}

const MEAL_LABELS = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
} as const

function hash(value: string): number {
  return [...value].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    7,
  )
}

export function getQuestCycleKey(date: Date = new Date()): string {
  return `${getDateKey(date)}-${Math.floor(getCurrentHour(date) / 3)}`
}

function getActiveDishes(dishes: Dish[]): Dish[] {
  return dishes.filter((dish) => dish.active)
}

export function getDailyQuests(
  dishes: Dish[],
  date: Date = new Date(),
): DailyQuest[] {
  const active = getActiveDishes(dishes)
  if (active.length < 3) return []

  const cycle = getQuestCycleKey(date)
  const target = active[hash(`${cycle}:taste_code`) % active.length]
  const targetIndex = active.indexOf(target)
  const options = [target]
  for (let offset = 1; options.length < 3; offset += 1) {
    const candidate = active[(targetIndex + offset) % active.length]
    if (!options.some((dish) => dish.id === candidate.id)) options.push(candidate)
  }
  const targetMeal = target.mealSlots[hash(`${cycle}:${target.id}`) % target.mealSlots.length]
  const category = target.category ? `nhóm ${target.category}` : "một món quen thuộc"

  const oracleDish = active[hash(`${cycle}:meal_oracle`) % active.length]
  const oracleMeal = oracleDish.mealSlots[
    hash(`${cycle}:${oracleDish.id}:meal`) % oracleDish.mealSlots.length
  ]

  return [
    {
      id: "taste_code",
      cycle,
      title: "Đoán món bí mật",
      clue: `Món này thuộc ${category}, hợp cho ${MEAL_LABELS[targetMeal]}.`,
      options: options.map((dish) => ({ id: dish.id, label: dish.name })),
      targetOptionId: target.id,
    },
    {
      id: "meal_oracle",
      cycle,
      title: `Nhà tiên tri: ${oracleDish.name}`,
      clue: "Món này nên xuất hiện trong khung bữa nào?",
      options: Object.entries(MEAL_LABELS).map(([id, label]) => ({ id, label })),
      targetOptionId: oracleMeal,
    },
  ]
}

export function canClaimDailyQuest(state: UserState, quest: DailyQuest): boolean {
  if (state.dailyQuestCycle !== quest.cycle) return true
  return !(state.completedDailyQuestIds ?? []).includes(quest.id)
}

export function applyDailyQuest(
  state: UserState,
  quest: DailyQuest,
  selectedOptionId: string,
): { state: UserState; correct: boolean } {
  if (
    !canClaimDailyQuest(state, quest) ||
    selectedOptionId !== quest.targetOptionId
  ) {
    return { state, correct: false }
  }

  const now = new Date().toISOString()
  const transaction: KeyTransaction = {
    id: crypto.randomUUID(),
    amount: DAILY_QUEST_KEYS,
    balanceAfter: state.keys + DAILY_QUEST_KEYS,
    reason: "daily_quest",
    createdAt: now,
    referenceId: quest.id,
  }
  const completedDailyQuestIds =
    state.dailyQuestCycle === quest.cycle
      ? [...(state.completedDailyQuestIds ?? []), quest.id]
      : [quest.id]

  return {
    correct: true,
    state: {
      ...state,
      keys: state.keys + DAILY_QUEST_KEYS,
      dailyQuestCycle: quest.cycle,
      completedDailyQuestIds,
      keyTransactions: [...state.keyTransactions, transaction],
      updatedAt: now,
    },
  }
}

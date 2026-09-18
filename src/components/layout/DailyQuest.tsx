import { useEffect, useMemo, useState } from "react"
import { canClaimDailyQuest, getDailyQuests } from "../../domain/dailyQuest"
import { useAppStore } from "../../store/useAppStore"

export function DailyQuest({ compact = false }: { compact?: boolean }) {
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const claimDailyQuest = useAppStore((state) => state.claimDailyQuest)
  const [now, setNow] = useState(() => new Date())
  const [wrongOption, setWrongOption] = useState<{
    questId: string
    optionId: string
  } | null>(null)
  const quests = useMemo(() => getDailyQuests(dishes, now), [dishes, now])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!wrongOption) return
    const timer = window.setTimeout(() => setWrongOption(null), 2_000)
    return () => window.clearTimeout(timer)
  }, [wrongOption])

  if (quests.length === 0) return null

  const chooseOption = (questId: string, optionId: string) => {
    const quest = quests.find((item) => item.id === questId)
    if (!quest || !canClaimDailyQuest(user, quest)) return
    const result = claimDailyQuest(questId, optionId)
    if (result.error) return
    setWrongOption(result.correct ? null : { questId, optionId })
  }

  return (
    <div className={`daily-quests ${compact ? "daily-quest-compact" : ""}`}>
      <div className="daily-quests-label">NHIỆM VỤ MỖI 3 GIỜ · +3 🔑 / NHIỆM VỤ</div>
      {quests.map((quest) => {
        const canClaim = canClaimDailyQuest(user, quest)
        return (
          <section className="daily-quest" key={quest.id}>
            <div className="daily-quest-heading">
              <div>
                <small>MẬT MÃ VỊ GIÁC</small>
                <strong>{quest.title}</strong>
              </div>
              <span>{canClaim ? "+3 🔑" : "✓"}</span>
            </div>
            {canClaim ? (
              <>
                <p className="daily-quest-clue">{quest.clue}</p>
                <div className="daily-quest-options">
                  {quest.options.map((option) => (
                    <button
                      key={option.id}
                      className={
                        wrongOption?.questId === quest.id &&
                        wrongOption.optionId === option.id
                          ? "is-wrong"
                          : ""
                      }
                      onClick={() => chooseOption(quest.id, option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {wrongOption?.questId === quest.id && (
                  <p className="daily-quest-feedback">Chưa đúng, thử lại nhé.</p>
                )}
              </>
            ) : (
              <p className="daily-quest-done">Đã nhận thưởng trong cycle này.</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
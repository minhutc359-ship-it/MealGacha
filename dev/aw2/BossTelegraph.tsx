import type { CombatBattle } from "../../src/aw2/combat"
import { useEffect, useRef } from "react"
import {
  FORGOTTEN_HOST_SKILLS,
  forgottenHostTargets,
} from "../../src/aw2/combat/forgottenHost"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"

interface Props {
  battle: CombatBattle
  stopped?: boolean
}
export function BossTelegraph({ battle, stopped = false }: Props) {
  const panel = useRef<HTMLElement>(null)
  const actor = battle.actors.find((unit) => unit.bossKit)
  const kit = actor?.bossKit
  useEffect(() => {
    const element = panel.current
    const container = element?.closest<HTMLElement>(".aw2-battle")
    if (!element || !container) return
    const observer = new ResizeObserver(([entry]) => {
      container.style.setProperty(
        "--boss-telegraph-height",
        `${entry.target.getBoundingClientRect().height}px`,
      )
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      container.style.removeProperty("--boss-telegraph-height")
    }
  }, [actor?.id])
  if (!actor || !kit) return null
  const intent = kit.intent
  const remaining = intent ? Math.max(0, intent.resolveTick - battle.tick) : 0
  return (
    <section
      ref={panel}
      className="aw2-boss-telegraph"
      data-testid="boss-telegraph"
      aria-label="Chiêu của Người Giữ Bàn Quên"
    >
      <h2>Nhịp của Người Giữ Bàn Quên</h2>
      {stopped || battle.status !== "active" ? (
        <p>Thử thách đã kết thúc.</p>
      ) : (
        <>
          <p role="status" data-testid="boss-intent">
            {intent
              ? `${FORGOTTEN_HOST_SKILLS[intent.kind].name} · còn ${remaining} nhịp`
              : kit.barrierHits > 0
                ? "Ghế trống đang bảo vệ boss"
                : "Boss đang đánh thường"}
          </p>
          {intent && (
            <>
              <progress
                max={3}
                value={remaining}
                aria-label="Nhịp trước khi đòn tới"
              />
              <p>
                {intent.kind === "sweep"
                  ? `Vùng quét đã chốt: ${Math.max(0, intent.areaCenter - intent.areaRadius).toFixed(0)}–${Math.min(100, intent.areaCenter + intent.areaRadius).toFixed(0)} trên trục bước tiến.`
                  : "Ba nhịp rồi tác động toàn đội. Canh khiên và hồi phục trước khi đòn tới."}
              </p>
              <p data-testid="boss-targets">
                Đang trong vùng:{" "}
                {forgottenHostTargets(battle, actor)
                  .map(
                    (unit) =>
                      STARTER_ASSETS[unit.spiritId]?.displayName ?? unit.id,
                  )
                  .join(", ") || "Chưa có ai"}
                . Mục tiêu có thể đổi khi đội di chuyển.
              </p>
            </>
          )}
          {kit.barrierHits > 0 && (
            <div data-testid="boss-protection">
              <label>
                Ghế trống · còn {kit.barrierHits}/4 đòn thường{" "}
                <progress
                  max={4}
                  value={kit.barrierHits}
                  aria-label="Đòn thường cần để phá bảo vệ"
                />
              </label>
              <p>
                Để đội đánh thường phá bảo vệ rồi dùng tuyệt kỹ gây sát thương.
                Đòn phá cuối cũng bị chặn; bảo vệ tự tan sau{" "}
                {Math.max(0, kit.barrierExpiresAtTick - battle.tick)} nhịp.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}

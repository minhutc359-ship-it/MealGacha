import { useEffect, useRef, useState, type ReactNode } from "react"
import { CARD_MAP, SCHOOLS } from "../../game/catalog"
import {
  ADVENTURE_AREA_MAP,
  captureChance,
  schoolMultiplier,
  spiritMaxHp,
  spiritSpeed,
  type AdventureAction,
  type AdventureSave,
} from "../../game/adventure"
import {
  skillsFor,
  SCHOOL_ORDER,
  STATUS_NAMES,
} from "../../game/adventureSkills"
import { SpiritSprite } from "./AdventureArt"

export function AdventureDialog({
  children,
  titleId,
  className,
  dismiss,
}: {
  children: ReactNode
  titleId: string
  className: string
  dismiss?: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      dialog = ref.current
    dialog?.showModal()
    return () => {
      dialog?.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        dismiss?.()
      }}
    >
      {children}
    </dialog>
  )
}
export function AdventureMeter({
  value,
  max,
  label,
  kind = "hp",
}: {
  value: number
  max: number
  label: string
  kind?: "hp" | "xp"
}) {
  return (
    <div
      className={`adv-meter is-${kind} ${value < max * 0.3 ? "is-low" : ""}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <i
        style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }}
      />
    </div>
  )
}
export function SchoolChart() {
  return (
    <details className="adv-type-chart">
      <summary>Tương khắc 5 hệ</summary>
      <p>Hàng là hệ tấn công, cột là hệ phòng thủ. Kỹ năng thường luôn ×1.</p>
      <table>
        <caption>Hệ số sát thương</caption>
        <thead>
          <tr>
            <th scope="col">↓ / →</th>
            {SCHOOL_ORDER.map((school) => (
              <th scope="col" key={school} title={SCHOOLS[school].name}>
                {SCHOOLS[school].symbol}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCHOOL_ORDER.map((a) => (
            <tr key={a}>
              <th scope="row">{SCHOOLS[a].name}</th>
              {SCHOOL_ORDER.map((d) => (
                <td
                  key={d}
                  className={
                    schoolMultiplier(a, d) > 1
                      ? "is-strong"
                      : schoolMultiplier(a, d) < 1
                        ? "is-weak"
                        : ""
                  }
                >
                  {schoolMultiplier(a, d)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p>Lợi thế ×1,5 · bị kháng ×0,67. Tốc độ quyết định ai ra đòn trước.</p>
    </details>
  )
}
export function AdventureBattle({
  save,
  act,
}: {
  save: AdventureSave
  act: (action: AdventureAction) => void
}) {
  const e = save.encounter!,
    member = save.team.find((item) => item.uid === e.activeUid)!
  const ally = CARD_MAP[member.cardId],
    enemy = CARD_MAP[e.cardId]
  const [tab, setTab] = useState<"skills" | "bag" | "team">("skills")
  const skills = skillsFor(member.cardId, member.level),
    exhausted = skills.every((skill) => !(member.pp?.[skill.id] ?? 0))
  const [target, setTarget] = useState(member.uid)
  const cast = (skillId: string) =>
    act({ type: "battle", move: "skill", skillId })
  const playerFast =
    spiritSpeed(member.cardId, member.level, member.status) >=
    spiritSpeed(e.cardId, e.level, e.enemyStatus)
  return (
    <AdventureDialog
      className={`adv-battle is-${e.kind}`}
      titleId="adv-battle-title"
    >
      <div
        className="adv-battle-bg"
        style={{
          backgroundImage: `url(${ADVENTURE_AREA_MAP[save.areaId].art})`,
        }}
      />
      <header className="adv-battle-head">
        <div>
          <span>
            {e.kind === "wild"
              ? "VỊ LINH HOANG DÃ"
              : e.kind === "keeper"
                ? "THỬ THÁCH GIỮ ẤN"
                : "ĐẤU VỚI LẢ"}
          </span>
          <h1 id="adv-battle-title">
            {enemy.name} · Cấp {e.level}
          </h1>
        </div>
        <strong>
          Lượt {e.turn}
          {e.roster ? ` · Đối thủ ${(e.wave ?? 0) + 1}/${e.roster.length}` : ""}
        </strong>
      </header>
      <div
        className="adv-battle-arena"
        key={`${e.cardId}-${e.activeUid}-${e.turn}`}
      >
        <section className={`adv-combatant enemy school-${enemy.school}`}>
          <span>
            {enemy.symbol} {SCHOOLS[enemy.school].name}
          </span>
          <strong>{enemy.name}</strong>
          <small>
            Cấp {e.level} · Tốc độ{" "}
            {spiritSpeed(e.cardId, e.level, e.enemyStatus)}
          </small>
          <AdventureMeter
            value={e.hp}
            max={e.maxHp}
            label={`HP ${enemy.name}`}
          />
          <small>
            {e.hp}/{e.maxHp} HP{" "}
            {e.enemyStatus &&
              `· ${STATUS_NAMES[e.enemyStatus]} ${e.enemyStatusTurns} lượt`}
          </small>
        </section>
        <div className={`adv-battle-model enemy school-${enemy.school}`}>
          <SpiritSprite cardId={e.cardId} />
        </div>
        <div className={`adv-battle-model ally school-${ally.school}`}>
          <SpiritSprite cardId={member.cardId} back />
        </div>
        <section className={`adv-combatant ally school-${ally.school}`}>
          <span>
            {ally.symbol} {SCHOOLS[ally.school].name}
          </span>
          <strong>{ally.name}</strong>
          <small>
            Cấp {member.level} · Tốc độ{" "}
            {spiritSpeed(member.cardId, member.level, member.status)}
          </small>
          <AdventureMeter
            value={member.hp}
            max={spiritMaxHp(member.cardId, member.level)}
            label={`HP ${ally.name}`}
          />
          <small>
            {member.hp}/{spiritMaxHp(member.cardId, member.level)} HP{" "}
            {member.status &&
              `· ${STATUS_NAMES[member.status]} ${member.statusTurns} lượt`}
          </small>
        </section>
        <span className="adv-turn-order">
          {playerFast ? "Bạn ra đòn trước" : "Đối thủ ra đòn trước"}
        </span>
      </div>
      <div className="adv-battle-console">
        <div
          className="adv-battle-log"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {e.log.slice(-5).map((line, i) => (
            <p key={`${e.turn}-${i}-${line}`}>{line}</p>
          ))}
        </div>
        <section className="adv-battle-menu">
          <nav aria-label="Hành động chiến đấu">
            {(["skills", "bag", "team"] as const).map((id) => (
              <button
                type="button"
                key={id}
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
              >
                {id === "skills"
                  ? "Kỹ năng"
                  : id === "bag"
                    ? "Túi đồ"
                    : "Đổi Vị Linh"}
              </button>
            ))}
          </nav>
          {tab === "skills" && (
            <div className="adv-skill-grid">
              {skills.map((skill) => {
                const multiplier = skill.school
                  ? schoolMultiplier(skill.school, enemy.school)
                  : 1
                return (
                  <button
                    type="button"
                    key={skill.id}
                    className={
                      multiplier > 1
                        ? "is-strong"
                        : multiplier < 1
                          ? "is-weak"
                          : ""
                    }
                    disabled={!(member.pp?.[skill.id] ?? 0)}
                    onClick={() => cast(skill.id)}
                    title={skill.description}
                  >
                    <strong>{skill.name}</strong>
                    <small>
                      {skill.school ? SCHOOLS[skill.school].name : "Thường"} ·
                      PP {member.pp?.[skill.id] ?? 0}/{skill.pp}
                    </small>
                    <span>
                      {skill.power
                        ? `Lực ×${skill.power} · hiệu quả ×${multiplier}`
                        : skill.description}
                    </span>
                    {skill.effect && <small>{skill.description}</small>}
                  </button>
                )
              })}
              {exhausted && (
                <button
                  type="button"
                  onClick={() => act({ type: "battle", move: "strike" })}
                >
                  <strong>Cố Sức</strong>
                  <small>Hết PP · đánh thường, mất HP</small>
                </button>
              )}
              <button
                type="button"
                onClick={() => act({ type: "battle", move: "guard" })}
              >
                <strong>Giữ mâm</strong>
                <small>Ưu tiên phòng thủ</small>
              </button>
              <button
                type="button"
                disabled={e.kind !== "wild"}
                onClick={() => act({ type: "battle", move: "flee" })}
              >
                <strong>Rút lui</strong>
                <small>
                  {e.kind === "wild" ? "75% thoát" : "Hoàn thành cuộc đấu NPC"}
                </small>
              </button>
            </div>
          )}
          {tab === "bag" && (
            <div className="adv-battle-bag">
              <button
                type="button"
                disabled={e.kind !== "wild" || !save.aromaSeals}
                onClick={() => act({ type: "battle", move: "befriend" })}
              >
                <strong>Hương Ấn · {save.aromaSeals}</strong>
                <small>
                  {e.kind === "wild"
                    ? `${Math.round(captureChance(e) * 100)}% · yếu HP / trạng thái dễ kết bạn hơn`
                    : "Vị Linh thuộc đội NPC"}
                </small>
              </button>
              <label>
                Vị Linh nhận vật phẩm
                <select
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                >
                  {save.team.map((item) => (
                    <option key={item.uid} value={item.uid}>
                      {CARD_MAP[item.cardId].name} · {item.hp} HP
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!save.inventory.potion}
                onClick={() =>
                  act({
                    type: "battle",
                    move: "item",
                    item: "potion",
                    uid: target,
                  })
                }
              >
                Canh Ấm · {save.inventory.potion}{" "}
                <small>Hồi 30 HP · gỡ trạng thái · dùng một lượt</small>
              </button>
              <button
                type="button"
                disabled={!save.inventory.revive}
                onClick={() =>
                  act({
                    type: "battle",
                    move: "item",
                    item: "revive",
                    uid: target,
                  })
                }
              >
                Lá Tỉnh · {save.inventory.revive}
                <small>Hồi sinh 50% HP · dùng một lượt</small>
              </button>
            </div>
          )}
          {tab === "team" && (
            <div className="adv-switch-team">
              {save.team.map((item) => (
                <button
                  type="button"
                  key={item.uid}
                  disabled={!item.hp || item.uid === member.uid}
                  onClick={() =>
                    act({ type: "battle", move: "switch", uid: item.uid })
                  }
                >
                  <SpiritSprite cardId={item.cardId} />
                  <span>
                    <strong>{CARD_MAP[item.cardId].name}</strong>
                    <small>
                      Cấp {item.level} · {item.hp} HP
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
      <SchoolChart />
    </AdventureDialog>
  )
}

import { CARD_MAP } from "../../game/catalog"
import { tcgCharacter } from "../../game/tcgCharacterMotion"
import { monsterCharacter } from "../../infrastructure/assets/characterSprites"
import { RPG_ROLE_NAMES } from "../../game/adventureRpg/engine"
import { ELEMENTAL_IMPACTS, IMPACT_ROWS } from "../../game/visualPack"
import type {
  RpgAction,
  RpgActor,
  RpgBattle,
} from "../../game/adventureRpg/types"
import { CharacterSprite } from "./CharacterSprite"
import "../../game/characterMotion.css"
import "../../game/adventureRpg/rpg.css"

export function RpgMeter({
  value,
  max,
  label,
  energy = false,
}: {
  value: number
  max: number
  label: string
  energy?: boolean
}) {
  return (
    <span
      className={`rpg-meter ${energy ? "is-energy" : ""}`}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <i
        style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }}
      />
    </span>
  )
}
function position(actor: RpgActor) {
  const ally = [
      [40, 72],
      [34, 46],
      [12, 75],
      [17, 49],
      [23, 27],
    ],
    enemy = [
      [62, 70],
      [68, 44],
      [87, 72],
      [82, 32],
      [90, 48],
    ]
  const [left, top] = (actor.side === "ally" ? ally : enemy)[actor.slot]
  return { left: `${left}%`, top: `${top}%` }
}
export function RpgBattleView({
  battle: b,
  title,
  art,
  quiet = false,
  paused = false,
  onAction,
  readOnly = false,
}: {
  battle: RpgBattle
  title: string
  art: string
  quiet?: boolean
  paused?: boolean
  onAction: (action: RpgAction) => void
  readOnly?: boolean
}) {
  const allies = b.actors.filter((a) => a.side === "ally"),
    burst = [...b.events]
      .reverse()
      .find((e) => e.kind === "burst" && b.tick - e.tick < 4)
  const last = [...b.events].reverse().find((e) => e.kind !== "hit")
  const boss = b.actors.find((a) => a.boss && a.hp > 0)
  const blocked = readOnly || b.paused || paused || !!b.result
  return (
    <section
      className={`rpg-battle ${quiet ? "is-quiet" : ""}`}
      aria-label="Trận Adventure"
      inert={readOnly || undefined}
    >
      <header className="rpg-battle-heading">
        <div>
          <small>
            ĐỢT {b.wave + 1}/{b.waves.length} · {Math.floor(b.tick / 4)} / 180s
          </small>
          <h2>{title}</h2>
        </div>
        <div className="rpg-battle-controls">
          <button
            type="button"
            aria-pressed={b.auto}
            onClick={() => onAction({ type: "auto" })}
          >
            AUTO {b.auto ? "ON" : "OFF"}
          </button>
          <button type="button" onClick={() => onAction({ type: "speed" })}>
            ×{b.speed}
          </button>
          <button
            type="button"
            aria-label={b.paused ? "Tiếp tục trận" : "Tạm dừng trận"}
            disabled={!!b.result}
            onClick={() => onAction({ type: "pause" })}
          >
            {b.paused ? "▶" : "Ⅱ"}
          </button>
        </div>
      </header>
      <div
        className="rpg-arena"
        style={{
          backgroundImage: `linear-gradient(180deg,#0b192230,#0b192278),url(${art})`,
        }}
      >
        <div className="rpg-arena-floor" />
        {boss && (
          <div className="rpg-boss-health">
            <strong>
              {boss.name} {boss.phase ? "· Cuồng nộ" : ""}
            </strong>
            <RpgMeter value={boss.hp} max={boss.maxHp} label="HP boss" />
          </div>
        )}
        {b.warning && (
          <div className="rpg-warning" role="status">
            ⚠ Đòn lớn vào tuyến {b.warning.row === "front" ? "trước" : "sau"} ·{" "}
            {Math.max(0, (b.warning.until - b.tick) / 4).toFixed(1)}s
          </div>
        )}
        {b.actors.map((a) => {
          const model =
            a.side === "ally"
              ? tcgCharacter(CARD_MAP[a.id])!
              : monsterCharacter(a.id)
          const hit = [...b.events]
            .reverse()
            .find(
              (e) =>
                e.targets.includes(a.uid) &&
                ["hit", "heal", "shield"].includes(e.kind) &&
                b.tick - e.tick < 3,
            )
          const guarding =
            b.tick < b.guardUntil &&
            a.side === "ally" &&
            (a.slot < 2 ? "front" : "back") === b.guardRow
          const motion =
            b.tick - a.motionAt < 4 ||
            a.motion === "fall" ||
            a.motion === "victory"
              ? a.motion
              : "idle"
          return (
            <div
              key={a.uid}
              className={`rpg-combatant side-${a.side} school-${a.school} ${
                a.boss ? "is-boss" : ""
              } ${!a.hp ? "is-fallen" : ""} ${
                guarding || a.shield ? "is-shielded" : ""
              }`}
              style={position(a)}
              data-uid={a.uid}
              data-hp={a.hp}
            >
              <CharacterSprite
                model={model}
                motion={motion}
                stamp={`${b.id}:${a.motionAt}:${motion}`}
                quiet={quiet}
                paused={paused || b.paused}
                flip={a.side === "enemy"}
                fallback={CARD_MAP[a.id]?.art}
              />
              {!quiet && hit && (
                <span
                  key={`fx:${hit.serial}`}
                  className="rpg-impact"
                  style={{
                    backgroundImage: `url(${ELEMENTAL_IMPACTS})`,
                    backgroundPositionY: `${IMPACT_ROWS[hit.school] * 25}%`,
                  }}
                  aria-hidden="true"
                />
              )}
              {hit && hit.value > 0 && (
                <b key={hit.serial} className={`rpg-number kind-${hit.kind}`}>
                  {hit.kind === "hit" ? "−" : "+"}
                  {hit.value}
                </b>
              )}
              <div className="rpg-actor-caption">
                <strong>{a.boss ? "BOSS" : a.name}</strong>
                <RpgMeter value={a.hp} max={a.maxHp} label={`HP ${a.name}`} />
                {a.side === "ally" && (
                  <RpgMeter
                    value={a.energy}
                    max={100}
                    label={`Năng lượng ${a.name}`}
                    energy
                  />
                )}
                {(a.burn > 0 || a.stun > 0 || a.weaken > 0) && (
                  <small>
                    {a.burn ? "♨" : ""} {a.stun ? "✦" : ""}{" "}
                    {a.weaken ? "↓" : ""}
                  </small>
                )}
              </div>
            </div>
          )
        })}
        {burst && (
          <div
            className={`rpg-burst-banner school-${burst.school}`}
            key={burst.serial}
          >
            <span>✦ TUYỆT KỸ</span>
            <strong>{burst.text}</strong>
          </div>
        )}
        {(b.paused || paused) && !readOnly && (
          <div className="rpg-pause-mark">Trận đang tạm dừng</div>
        )}
      </div>
      <div className="rpg-tactical">
        <span>
          {last?.text ??
            "Tự đánh · Chạm Vị Linh khi đầy năng lượng để tung tuyệt kỹ"}
        </span>
        <div>
          {(["front", "back"] as const).map((row) => (
            <button
              key={row}
              type="button"
              disabled={blocked || b.tick < b.guardReady}
              onClick={() => onAction({ type: "guard", row })}
            >
              {b.tick < b.guardReady
                ? `${Math.ceil((b.guardReady - b.tick) / 4)}s`
                : "Che"}{" "}
              tuyến {row === "front" ? "trước" : "sau"}
            </button>
          ))}
        </div>
      </div>
      <div className="rpg-burst-deck">
        {allies.map((a) => (
          <button
            key={a.uid}
            type="button"
            className={`rpg-burst-button ${
              a.energy >= 100 && a.hp ? "is-ready" : ""
            }`}
            aria-label={`Tuyệt kỹ ${a.name} · ${a.energy}/100 năng lượng`}
            disabled={blocked || a.energy < 100 || !a.hp || a.stun > 0}
            onClick={() => onAction({ type: "burst", uid: a.uid })}
          >
            <strong>{a.name}</strong>
            <small>{RPG_ROLE_NAMES[a.role]}</small>
            <RpgMeter value={a.hp} max={a.maxHp} label={`HP ${a.name}`} />
            <RpgMeter
              value={a.energy}
              max={100}
              label={`Năng lượng ${a.name}`}
              energy
            />
            <b>
              {!a.hp ? "Gục" : a.energy >= 100 ? "TUYỆT KỸ" : `${a.energy}/100`}
            </b>
          </button>
        ))}
      </div>
    </section>
  )
}

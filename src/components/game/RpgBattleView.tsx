import { enemyVisual } from "../../game/enemyVisuals"
import { activeEnemyWarning, enemyWarningIsGlobal, isEnemyPhaseEvent } from "../../game/enemyPresentation"
import { RpgEnemyTelegraph } from "./RpgEnemyTelegraph"
import { rpgVisualContact } from "../../game/visualTiming"
import { useRpgImpactFrame } from "./useRpgImpactFrame"
import { awakenedKit } from "../../game/adventureRpg/awakening"
import { RpgCinematic } from "./RpgCinematic"
import { actorAnchor, actorAttackMotion } from "../../game/adventureRpg/formationLayout"
import { RpgBattleVfx } from "./RpgBattleVfx"
import { SpiritArt, SkillArt } from "./SpiritArt"
import { spiritKit, REACTION_HELP } from "../../game/adventureRpg/skills"
import { adventureCharacterModel } from "../../game/adventureRpg/presentationModel"
import { RPG_ROLE_NAMES } from "../../game/adventureRpg/engine"
import type { BattlePresentationPhase } from "../../game/adventureV560"
import type { School } from "../../game/types"
import type {
  RpgAction,
  RpgActor,
  RpgBattle,
} from "../../game/adventureRpg/types"
import type { CSSProperties } from "react"
import { CharacterSprite } from "./CharacterSprite"
import { RpgShield } from "./RpgShield"
import { BattleStatus } from "./BattleStatus"
import { starterCharacter } from "../../game/starterCharacters"
import "../../game/characterMotion.css"
import "../../game/adventureRpg/rpg.css"
import "./starterPresentation.css"

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
function position(actor: RpgActor, target?: RpgActor) {
  const p = actorAnchor(actor)
  const style = { left: `${p.x}%`, top: `${p.y}%`, "--wide-left": `${actorAnchor(actor,true).x}%`, zIndex: Math.round(p.y) } as CSSProperties
  if (!target) return style
  const motion = actorAttackMotion(actor,target), wide = actorAttackMotion(actor,target,true)
  return {
    ...style,
    "--attack-x": `${motion.x}cqw`,
    "--attack-y": `${motion.y}cqh`,
    "--attack-windup-x": `${motion.windupX}cqw`,
    "--attack-windup-y": `${motion.windupY}cqh`,
    "--attack-wide-x": `${wide.x}cqw`,
    "--attack-wide-y": `${wide.y}cqh`,
    "--attack-wide-windup-x": `${wide.windupX}cqw`,
    "--attack-wide-windup-y": `${wide.windupY}cqh`,
  } as CSSProperties
}
export function RpgBattleView({
  battle: b,
  title,
  art,
  quiet = false,
  paused = false,
  onAction,
  readOnly = false,
  reduced = false,
  presentation = "fight",
  school = "hearth",
}: {
  battle: RpgBattle
  title: string
  art: string
  quiet?: boolean
  paused?: boolean
  onAction: (action: RpgAction) => boolean | void
  readOnly?: boolean
  reduced?: boolean
  presentation?: BattlePresentationPhase
  school?: School
}) {
  const visual = useRpgImpactFrame(b,paused || b.paused,quiet)
  const allies = b.actors.filter((a) => a.side === "ally"),
    burst = [...b.events]
      .reverse()
      .find((e) => e.kind === "burst" && b.tick - e.tick < 4)
  const last = [...b.events].reverse().find((e) => e.kind !== "hit")
  const boss = b.actors.find((a) => a.boss && a.hp > 0)
  const activeWarning = activeEnemyWarning(b)
  const warning = activeWarning?.warning
  const warningSource = activeWarning?.actor
  const warningSupport = warningSource && !warningSource.boss && ["bulwark","mender"].includes(warningSource.style ?? "")
  // The showcase presents an already committed cast; combat stays frozen until completion.
  const blocked = readOnly || b.paused || paused || !!b.result || !!b.cinematic || presentation !== "fight"
  return (
    <section
      className={`rpg-battle ${quiet ? "is-quiet" : ""} ${b.paused || paused ? "is-paused" : ""} presentation-${presentation}`}
      aria-label="Trận Adventure"
      inert={readOnly || undefined}
    >
      <header className="rpg-battle-heading">
        <div>
          <small>
            {readOnly ? "TRẬN MINH HOẠ · " : ""}
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
      {!readOnly && b.rulesVersion!==530 && <small>Trận đang lưu giữ bộ kỹ năng cũ. Bộ kỹ năng mới mở từ chuyến tiếp theo.</small>}
      <div className="rpg-arena-hud">
        {boss && <div className="rpg-boss-health"><strong>{boss.name} {boss.phase ? "· Cuồng nộ" : ""}</strong><RpgMeter value={boss.hp} max={boss.maxHp} label="HP boss" /></div>}
        <div className={`rpg-warning ${warning ? "is-active" : ""}`} role="status">{warning ? `⚠ ${warning.skill ?? "Đòn lớn"} · ${warningSupport ? "Ngắt chiêu để chặn hỗ trợ" : warningSource && (b.rulesVersion??510)>=520 && enemyWarningIsGlobal(warningSource) ? "Toàn đội" : `Tuyến ${warning.row === "front" ? "trước" : "sau"}`} · ${Math.max(0,(warning.until-b.tick)/4).toFixed(1)}s` : "Ưu tiên người hồi phục / dệt sương · Giữ Che chắn cho đòn báo trước"}</div>
      </div>
      <div
        className="rpg-arena"
        style={{
          backgroundImage: `linear-gradient(180deg,#0b192230,#0b192278),url(${art})`,
        }}
      >
        <div className="rpg-arena-floor" />
        <RpgEnemyTelegraph battle={b}/>
        <div className="rpg-combatants">
        {visual.actors.map((a) => {
          const baseModel = adventureCharacterModel(a.id, a.side)
          const authored = starterCharacter(a.id) ?? enemyVisual(a.id)
          // Adventure actors are large enough that the 64 px pixel atlas becomes
          // visibly soft on high-density phones. Keep the authored 256 px source;
          // the canvas DPR budget still lowers raster cost in light mode.
          const model = baseModel
          const hit = [...visual.events]
            .reverse()
            .find(
              (e) =>
                e.targets.includes(a.uid) &&
                ["hit", "heal", "shield"].includes(e.kind) &&
                b.tick - e.tick < 3,
            )
          const shownValue = hit ? hit.values?.[a.uid] ?? hit.value : 0
          const guarding =
            b.tick < b.guardUntil &&
            a.side === "ally" &&
            (a.slot < 2 ? "front" : "back") === b.guardRow
          const ownCue = [...b.events].reverse().find(e=>e.source===a.uid && (e.animation || e.kind === "burst" || e.kind === "skill") && b.tick-e.tick<(e.animation==="ultimate"?10:e.animation==="attack"?5:4))
          const attackTarget = ownCue?.animation === "attack" ? visual.actors.find(target=>ownCue.targets.includes(target.uid)) : undefined
          const attackMotion = attackTarget ? actorAttackMotion(a,attackTarget) : null
          const charging = warning?.source === a.uid && !a.stun
          const phaseCue = [...b.events].reverse().find(e=>isEnemyPhaseEvent(e,a) && b.tick-e.tick<5)
          const arriving = ["enter", "wave-enter", "start"].includes(presentation)
          const motion = arriving && a.hp ? "walk" : !a.hp || b.result === "loss" && a.side === "ally" ? "fall" : (b.result === "win" && a.side === "ally" || b.result === "loss" && a.side === "enemy") ? "victory" : authored && a.stun > 0 ? "stun" : starterCharacter(a.id) && guarding && !ownCue ? "guard" : ownCue?.animation === "ultimate" && starterCharacter(a.id) ? "ultimate" : phaseCue && enemyVisual(a.id) ? "phase" : ownCue?.animation === "enemy" && enemyVisual(a.id)?.defense ? "guard" : charging && enemyVisual(a.id) ? "channel" : charging || ownCue && ownCue.animation !== "attack" ? "cast" : ownCue?.animation === "attack" ? "attack" : b.tick-a.motionAt<4 ? a.motion : "idle"
          const motionStamp = motion === "fall" || motion === "victory" ? String(a.motionAt) : phaseCue ? `phase:${phaseCue.serial}` : charging ? `charge:${warning!.until}` : ownCue ? `cue:${ownCue.serial}` : String(a.motionAt)
          return (
            <div
              key={a.uid}
              className={`rpg-combatant side-${a.side} school-${a.school} ${
                a.boss ? "is-boss" : a.elite ? "is-elite" : ""
              } ${!a.hp ? "is-fallen" : ""} ${
                guarding || a.shield ? "is-shielded" : ""
              } ${attackMotion ? `is-attacking attack-range-${attackMotion.band}` : ""}`}
              style={position(a,attackTarget)}
              data-uid={a.uid}
              data-hp={a.hp}
              data-attack-range={attackMotion?.range}
            >
              <div className={`rpg-actor-body ${warning?.source === a.uid ? "is-channeling" : ""} ${b.events.some(e=>e.source===a.uid && e.kind==="burst" && b.tick-e.tick<5) ? `is-ultimate role-${a.role}` : ""}`}>{warning?.source === a.uid && <span className="rpg-channel-halo" aria-hidden="true" />}<CharacterSprite
                model={model}
                contactMs={rpgVisualContact(ownCue?.animation)}
                motion={motion}
                stamp={`${b.id}:${motionStamp}:${motion}`}
                quiet={quiet}
                paused={paused || b.paused || (!!b.cinematic && b.cinematic.source !== a.uid)}
                flip={a.side === "enemy"}
              /></div>
              <RpgShield
                active={a.hp > 0 && (guarding || a.shield > 0)}
                strength={a.shield / a.maxHp}
                breakSerial={[...b.events].reverse().find(e => e.shieldBroken?.includes(a.uid) && b.tick - e.tick < 4)?.serial}
              />
              {hit && shownValue > 0 && (
                <b key={hit.serial} className={`rpg-number kind-${hit.kind}`}>
                  {hit.kind === "hit" ? "−" : "+"}
                  {shownValue}
                </b>
              )}
              <div className="rpg-actor-caption">
                <strong>{a.boss ? "BOSS" : a.elite ? "✦ " + a.name : a.name}</strong>
                <RpgMeter value={a.hp} max={a.maxHp} label={`HP ${a.name}`} />
                {(a.side === "ally" || b.rulesVersion===530) && (
                  <RpgMeter
                    value={a.energy}
                    max={100}
                    label={`Năng lượng ${a.name}`}
                    energy
                  />
                )}
                {a.mark && a.mark.until >= b.tick && <small className={`rpg-mark school-${a.mark.school}`} title="Dấu nguyên tố">✧ {a.mark.school === "ember" ? "Hỏa" : a.mark.school === "tide" ? "Thủy" : a.mark.school === "grove" ? "Mộc" : a.mark.school === "hearth" ? "Bếp" : "Ngọt"}</small>}
                {(a.burn > 0 || a.stun > 0 || a.weaken > 0 || !!a.wither || !!a.traits?.regen || !!a.traits?.taunt || !!a.traits?.fracture) && (
                  <small>
                    {a.burn ? "♨" : ""} {a.stun ? "✦" : ""}{" "}
                    {a.weaken ? "↓" : ""} {a.wither ? "✚↓" : ""} {a.traits?.regen ? "✚↑" : ""} {a.traits?.taunt ? "⌾" : ""} {a.traits?.fracture ? "◇↓" : ""}
                  </small>
                )}
              </div>
            </div>
          )
        })}
        </div>
        <RpgBattleVfx battle={b} quiet={quiet} paused={paused || b.paused || presentation !== "fight"} />
        <BattleStatus phase={presentation} wave={b.wave} />
        {b.events.filter(e=>e.kind === "reaction" && b.tick-e.tick < 4).slice(-1).map(e=><div key={`reaction:${e.serial}`} className={`rpg-reaction-pill school-${e.school}`} role="status"><SkillArt index={60 + ["Bốc hơi","Nở rộ","Sinh trưởng","Mộng ấm"].indexOf(e.text)} />{e.text}</div>)}
        {burst && !b.cinematic && (b.rulesVersion !== 530 || b.cinematics === false) && <RpgCinematic key={`${b.id}:${burst.serial}`} id={b.actors.find(a=>a.uid===burst.source)!.id} reduced={quiet || reduced} paused={paused || b.paused} combo={b.chain?.count} onDone={()=>{}}/>}
        {b.cinematic && <RpgCinematic key={`${b.id}:${b.cinematic.serial}`} id={b.actors.find(a=>a.uid===b.cinematic!.source)!.id} reduced={quiet || reduced} paused={paused || b.paused} combo={b.chain?.count} onTogglePause={()=>onAction({type:"pause"})} onDone={()=>onAction({type:"cinematicDone",serial:b.cinematic!.serial})}/>}
        {(b.paused || paused) && !readOnly && !b.cinematic && (
          <div className="rpg-pause-mark">Trận đang tạm dừng</div>
        )}
      </div>
      {!!b.rulesVersion && <details className="rpg-strategy"><summary>Liên hương {b.chain && b.chain.until >= b.tick ? `×${b.chain.count} · ${((b.chain.until-b.tick)/4).toFixed(1)}s` : "· Tự đánh địch gần nhất"}</summary><p>{REACTION_HELP}</p>{b.rulesVersion===530 && <p>Đồng minh tự chọn kẻ địch gần nhất theo vị trí đội hình. Địch thường cần 60 năng lượng, boss cần 80 để dùng kỹ năng; hút năng lượng có thể trì hoãn hoặc ngắt chiêu.</p>}</details>}
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
            <SpiritArt id={a.id} />
            <SkillArt index={b.rulesVersion===530?64+awakenedKit(a.id).iconCell:spiritKit(a.id, a.role).icon + 1} />
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

import {livingActorFrame} from "../../game/livingClips"
import { motionAccent, drawMotionTrail } from "../../game/motionProfiles"
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react"
import {
  AUTO_SCHOOLS,
  MONSTER_MAP,
  SKILL_LABELS,
  UNIT_MAP,
} from "../../game/autochess/catalog"
import { enemyPlan } from "../../game/autochess/combat"
import { drawChannel, drawProjectile, drawImpact, skillVfx } from "../../game/battleVfx"
import type { Actor, AutoRun } from "../../game/autochess/types"
import { actorPosition as position, actorFrame, SPRITE_SHEETS, starScale, type StarUpgrade } from "../../game/autochess/presentation"
import { arenaTheme, drawArena, drawCastAura, drawWard, drawSkillBurst, drawDeparture } from "../../game/autochess/arenaVfx"
import { drawStarUpgrade } from "../../game/autochess/starVfx"
import { characterImage as getImage, acquireCharacterImage, unitCharacter, monsterCharacter, fitCharacter } from "../../infrastructure/assets/characterSprites"

const CELLS = Array.from({ length: 36 }, (_, i) => i)
const paths = Object.fromEntries(Object.entries(SPRITE_SHEETS).map(([key, sheet]) => [key, sheet.path]))
type Frames = () => { run: AutoRun | null; alpha: number }
export function AutoBoard({
  run,
  getFrame,
  selected,
  reducedMotion,
  lowQuality,
  celebrating,
  upgrades,
  onCell,
  onPiecePointerDown,
  onCellPointerDown,
  onInspectCell,
}: {
  run: AutoRun
  getFrame: Frames
  selected: string | null
  reducedMotion: boolean
  lowQuality: boolean
  celebrating: boolean
  upgrades: StarUpgrade[]
  onCell: (cell: number, dragged?: string, keyboard?: boolean) => void
  onPiecePointerDown?: (uid: string, event: PointerEvent<HTMLElement>) => void
  onCellPointerDown?: (cell: number, event: PointerEvent<HTMLElement>) => void
  onInspectCell?: (cell: number) => void
}) {
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null)
  const options = useRef({ selected, reducedMotion, lowQuality, celebrating, upgrades })
  useEffect(() => {
    options.current = { selected, reducedMotion, lowQuality, celebrating, upgrades }
  }, [selected, reducedMotion, lowQuality, celebrating, upgrades])
  useEffect(() => {
    const element = root.current!,
      surface = canvas.current!,
      ctx = surface.getContext("2d")
    if (!ctx) return
    let width = 1,
      height = 1,
      cell = 1,
      left = 0,
      top = 0,
      handle = 0
    let lastDraw = -Infinity
    const frozen = new Map<string, { x: number; y: number }>()
    const healthTrails = new Map<string, { hp: number; from: number; at: number }>()
    const facing = new Map<string, boolean>()
    const placements = new Map<string, { x: number; y: number; fromX: number; fromY: number; start: number }>()
    let endedAt: number | null = null
    let currentBattle = "",
      lastLowQuality = lowQuality
    const images: Partial<Record<string, HTMLImageElement>> = {}
    const leases = new Map<string, ReturnType<typeof acquireCharacterImage>>()
    const leased = (key:string, path:string) => {
      let lease=leases.get(key); if(!lease){lease=acquireCharacterImage(path);leases.set(key,lease)}
      return lease.image
    }
    const resize = () => {
      const bounds = element.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      const dpr = Math.min(
        options.current.lowQuality ? 1 : 2,
        window.devicePixelRatio || 1,
      )
      surface.width = Math.max(1, Math.round(width * dpr))
      surface.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      cell = Math.max(1, Math.min((width - 16) / 6, (height - 16) / 6))
      left = (width - cell * 6) / 2
      top = (height - cell * 6) / 2
      element.style.setProperty("--ac-grid-size", `${cell * 6}px`)
      element.style.setProperty("--ac-grid-left", `${left}px`)
      element.style.setProperty("--ac-grid-top", `${top}px`)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    const px = (x: number) => left + (x + 0.5) * cell,
      py = (y: number) => top + (y + 0.82) * cell
    const orb = (x: number, y: number, r: number, color: string, alpha = 1) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    const draw = (now: number) => {
      const { run: current, alpha } = getFrame()
      const fps = current?.paused && current.phase === "combat" ? 15 : options.current.lowQuality || options.current.reducedMotion ? 30 : 60
      if (document.hidden || now - lastDraw < 1000 / fps - 1) { handle = requestAnimationFrame(draw); return }
      lastDraw = now
      if (!current) {
        handle = requestAnimationFrame(draw)
        return
      }
      if (lastLowQuality !== options.current.lowQuality) {
        lastLowQuality = options.current.lowQuality
        resize()
      }
      const b = current.combat,
        opts = options.current,
        time = b ? b.tick + (opts.reducedMotion ? 0 : alpha) : now / 50
      if ((b?.id ?? "prepare") !== currentBattle) {
        healthTrails.clear()
        frozen.clear()
        facing.clear()
        endedAt = null
        currentBattle = b?.id ?? "prepare"
      }
      if (!b?.result) endedAt = null
      else endedAt ??= now
      const visualTime = time + (endedAt === null ? 0 : (now - endedAt) / 50)
      ctx.clearRect(0, 0, width, height)
      drawArena(ctx, left, top, cell * 6, arenaTheme(current), visualTime, opts.reducedMotion || current.paused, opts.lowQuality, (b?.tick ?? 0) >= 1100)
      for (const i of CELLS) {
        const x = left + (i % 6) * cell,
          y = top + Math.floor(i / 6) * cell
        ctx.fillStyle =
          ((i % 6) + Math.floor(i / 6)) % 2
            ? "rgba(237,207,153,.035)"
            : "rgba(2,15,24,.055)"
        ctx.fillRect(x, y, cell, cell)
        ctx.strokeStyle =
          i < 18 ? "rgba(232,143,112,.2)" : "rgba(235,209,164,.25)"
        ctx.lineWidth = 0.7
        ctx.strokeRect(x, y, cell, cell)
      }
      ctx.strokeStyle = "#e7bd73"
      ctx.lineWidth = 2
      ctx.strokeRect(left, top, cell * 6, cell * 6)
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = "rgba(236,201,151,.55)"
      ctx.beginPath()
      ctx.moveTo(left, top + cell * 3)
      ctx.lineTo(left + cell * 6, top + cell * 3)
      ctx.stroke()
      ctx.setLineDash([])
      const actors: Actor[] = b
        ? b.actors
        : [
            ...current.roster
              .filter((p) => p.cell !== null)
              .map(
                (p) =>
                  ({
                    uid: p.uid,
                    id: p.id,
                    side: "ally",
                    cell: p.cell!,
                    star: p.star,
                    hp: UNIT_MAP[p.id].hp,
                    maxHp: UNIT_MAP[p.id].hp,
                    mana: 0,
                    shield: 0,
                    action: null,
                    diedAt: null,
                    phase: 0,
                  }) as Actor,
              ),
            ...enemyPlan(current).map(
              ({ def, cell }, i) =>
                ({
                  uid: `preview${i}`,
                  id: def.id,
                  side: "enemy",
                  cell,
                  star: 1,
                  hp: def.hp,
                  maxHp: def.hp,
                  mana: 0,
                  shield: 0,
                  action: null,
                  diedAt: null,
                  phase: 0,
                }) as Actor,
            ),
          ]
      const actorMap = new Map(actors.map(a => [a.uid, a]))
      const coords = new Map(actors.map((a) => {
        const pos = position(a, time)
        if (b || opts.reducedMotion) return [a.uid, pos] as const
        const last = placements.get(a.uid)
        if (!last) placements.set(a.uid, { ...pos, fromX: pos.x, fromY: pos.y, start: now })
        else if (last.x !== pos.x || last.y !== pos.y) {
          const t = Math.min(1, (now - last.start) / 220)
          const ease = t * t * (3 - 2 * t)
          placements.set(a.uid, { ...pos, fromX: last.fromX + (last.x - last.fromX) * ease, fromY: last.fromY + (last.y - last.fromY) * ease, start: now })
        }
        const motion = placements.get(a.uid)!
        const t = Math.min(1, (now - motion.start) / 220), ease = t * t * (3 - 2 * t)
        return [a.uid, { x: motion.fromX + (pos.x - motion.fromX) * ease, y: motion.fromY + (pos.y - motion.fromY) * ease }] as const
      }))
      if (b) placements.clear()
      // Telegraph the actual skill target while the caster winds up.
      if (b)
        for (const a of actors.filter(
          (a) => a.hp > 0 && a.action?.kind === "cast" && time <= a.action.hit,
        )) {
          const target = actorMap.get(a.action!.target ?? ""),
            pos = target ? coords.get(target.uid)! : coords.get(a.uid)!
          const skill = a.action!.skill ?? a.skill
          if (["steam", "dash", "charge"].includes(skill)) {
            ctx.fillStyle =
              a.side === "enemy"
                ? "rgba(255,108,78,.18)"
                : "rgba(112,218,236,.14)"
            if (skill === "steam")
              ctx.fillRect(left + pos.x * cell, top, cell, cell * 6)
            else ctx.fillRect(left, top + pos.y * cell, cell * 6, cell)
          }
          const color =
            a.side === "enemy"
              ? "#ff826e"
              : AUTO_SCHOOLS[UNIT_MAP[a.id].school].color
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.55 + 0.2 * Math.sin(time * 0.4)
          const x = px(pos.x),
            y = py(pos.y)
          ctx.setLineDash([3, 4])
          ctx.beginPath()
          ctx.ellipse(
            x,
            y - cell * 0.15,
            cell * 0.5,
            cell * 0.32,
            0,
            0,
            Math.PI * 2,
          )
          ctx.stroke()
          ctx.setLineDash([])
          ctx.globalAlpha = 1
        }
      for (const actor of [...actors].sort(
        (a, c) => (coords.get(a.uid)?.y ?? 0) - (coords.get(c.uid)?.y ?? 0),
      )) {
        const def =
            actor.side === "ally" ? UNIT_MAP[actor.id] : MONSTER_MAP[actor.id],
          model = actor.side === "enemy" ? monsterCharacter(actor.id) : unitCharacter(actor.id),
          fresh = model.sheet !== "base"
        const spriteKey = model.sheet, row = model.row
        const sheet = images[spriteKey] ??= leased(spriteKey,paths[spriteKey])
        const spriteRow = SPRITE_SHEETS[spriteKey].rows[row]
        let p = coords.get(actor.uid)!
        if (actor.hp <= 0) {
          if (!frozen.has(actor.uid)) frozen.set(actor.uid, p)
          p = frozen.get(actor.uid)!
        }
        const deadAge = actor.diedAt === null ? 0 : visualTime - actor.diedAt
        if (actor.hp <= 0 && deadAge > 20) continue
        const x = px(p.x),
          y = py(p.y),
          size =
            cell *
            (actor.side === "enemy" && MONSTER_MAP[actor.id].boss ? .9 : .75) * (actor.side === "ally" ? starScale(actor.star) : 1),
          color = AUTO_SCHOOLS[def.school].color
        ctx.globalAlpha = actor.hp <= 0 ? Math.max(0, 1 - deadAge / 20) : 1
        if (actor.hp > 0) {
          const aura = ctx.createRadialGradient(x, y - cell * .25, 0, x, y - cell * .25, cell * .55)
          aura.addColorStop(0, `${color}38`); aura.addColorStop(.6, `${color}16`); aura.addColorStop(1, `${color}00`)
          ctx.fillStyle = aura; ctx.beginPath(); ctx.ellipse(x, y - cell * .25, cell * .46, cell * .53, 0, 0, Math.PI * 2); ctx.fill()
        }
        ctx.fillStyle = "rgba(0,0,0,.46)"
        ctx.beginPath()
        ctx.ellipse(x, y + 2, cell * 0.33, cell * 0.11, 0, 0, Math.PI * 2)
        ctx.fill()
        if (actor.hp > 0 && actor.star >= 2 && actor.side === "ally") {
          ctx.save(); ctx.globalAlpha = actor.star === 3 ? .48 : .28
          ctx.strokeStyle = actor.star === 3 ? "#ffe49b" : "#b9d8ec"; ctx.lineWidth = actor.star === 3 ? 2 : 1
          ctx.beginPath(); ctx.ellipse(x, y, cell * .38, cell * .14, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
        }
        if (actor.uid === opts.selected) {
          ctx.strokeStyle = "#ffe5a8"
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.ellipse(x, y, cell * 0.43, cell * 0.19, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        if (actor.shield > 0 || actor.phase > 0) {
          ctx.strokeStyle = actor.phase ? "#e7a6f4" : "#80daef"
          ctx.globalAlpha = 0.6
          ctx.lineWidth = actor.phase ? 3 : 1.5
          ctx.beginPath()
          ctx.ellipse(
            x,
            y - size * 0.47,
            size * 0.4,
            size * 0.5,
            0,
            0,
            Math.PI * 2,
          )
          ctx.stroke()
          ctx.globalAlpha = 1
        }
        if (actor.shield > 0 && actor.hp > 0) drawWard(ctx, x, y, size, visualTime, opts.reducedMotion || current.paused)
        const dancing = opts.celebrating && actor.side === "ally" && actor.hp > 0
        const beat = visualTime * .38 + row * .28
        const index = spriteKey.startsWith("living-") ? livingActorFrame(actor,time,b,opts.reducedMotion,dancing) : dancing
          ? opts.reducedMotion ? (fresh ? 0 : 13) : (spriteKey.startsWith("roster") ? [5, 1, 5, 2] : fresh ? [0, 1, 2, 1] : [13, 1, 13, 3])[Math.floor(visualTime / 5 + row * .2) % 4]
          : actorFrame(actor, time, fresh, b)
        const breath = !opts.reducedMotion && !actor.action && actor.hp > 0 && !current.paused
          ? Math.sin(visualTime / 10 + row) * cell * .009 : 0
        if (sheet.complete && sheet.naturalWidth && spriteRow) {
          const [sx, sy, sw, sh, anchorX, anchorY] = spriteRow.frames[index]
          ctx.save()
          const target = actorMap.get(actor.action?.target ?? "")
          // The original enemy atlas faces left; the newer sheets face right.
          const nativeLeft = spriteKey === "enemy"
          if (target && Math.abs(position(target, time).x - p.x) > .05)
            facing.set(actor.uid, (position(target, time).x < p.x) !== nativeLeft)
          else if (actor.action?.kind === "move" && actor.action.to % 6 !== actor.action.from % 6)
            facing.set(actor.uid, (actor.action.to % 6 < actor.action.from % 6) !== nativeLeft)
          const flip = facing.get(actor.uid) ?? false
          const upgrade = opts.upgrades.find(u => u.uid === actor.uid)
          const age = upgrade ? (now - upgrade.at) / 1000 : 10
          const awaken = !opts.reducedMotion && age < .7 ? 1 + Math.sin(Math.min(1, age / .7) * Math.PI) * .09 : 1
          const { scale, offsetX, offsetY } = fitCharacter(model, cell * .9 * (actor.side === "ally" ? starScale(actor.star) : 1), size, flip)
          let lungeX = 0, lungeY = 0, gait = 0
          if (!opts.reducedMotion && actor.action && !dancing) {
            const progress = Math.max(0, Math.min(1, (time - actor.action.start) / Math.max(1, actor.action.end - actor.action.start)))
            if (actor.action.kind === "move") gait = -Math.abs(Math.sin(progress * Math.PI * 2)) * cell * .018
            else if (target) {
              const dest = coords.get(target.uid)!, dx = dest.x - p.x, dy = dest.y - p.y
              const length = Math.max(1, Math.hypot(dx, dy))
              const contact = Math.max(.1, Math.min(.9, (actor.action.hit - actor.action.start) / Math.max(1, actor.action.end - actor.action.start)))
              const reach = progress < contact ? progress < .22 ? -Math.sin(progress / .22 * Math.PI) * .16 : Math.sin((progress - .22) / Math.max(.01, contact - .22) * Math.PI / 2)
                : Math.cos((progress - contact) / (1 - contact) * Math.PI / 2)
              const lunge = reach * cell * (actor.range === 1 ? .2 : .055)
              lungeX = dx / length * lunge
              lungeY = dy / length * lunge
            }
          }
          const hop = dancing && !opts.reducedMotion ? -Math.abs(Math.sin(beat)) * cell * .075 : 0
          const sway = dancing && !opts.reducedMotion ? Math.sin(beat) * cell * .045 : 0
          let recoilX = 0, recoilY = 0
          let hit = null
          if (!opts.reducedMotion && b) for (let i = b.events.length - 1; i >= 0; i--) {
            const event = b.events[i]
            if (time - event.tick >= 3) break
            if (event.kind === "hit" && event.target === actor.uid && time >= event.tick) { hit = event; break }
          }
          if (hit) {
            const origin = coords.get(hit.source), delta = origin ? { x: p.x - origin.x, y: p.y - origin.y } : { x: 0, y: 1 }
            const length = Math.max(1, Math.hypot(delta.x, delta.y)), amount = Math.sin((time - hit.tick) / 3 * Math.PI) * cell * .055
            recoilX = delta.x / length * amount; recoilY = delta.y / length * amount
          }
          ctx.translate(x + offsetX + lungeX + sway + recoilX, y + offsetY + breath + lungeY + gait + hop + recoilY)
          const departure = actor.hp <= 0 && !opts.reducedMotion ? Math.max(.6, 1 - deadAge / 60) : 1
          const action = actor.action
          const accent = motionAccent(actor.id, action ? (time - action.start) / Math.max(1, action.end - action.start) : 0, action?.kind === "cast", opts.reducedMotion || opts.lowQuality || current.rulesVersion < 6 || !action || action.kind === "move")
          ctx.translate(0, accent.lift * cell); ctx.rotate(accent.rotation); ctx.scale(1 - accent.stretch, 1 + accent.stretch)
          ctx.scale(awaken * departure, awaken * departure)
          if (flip) ctx.scale(-1, 1)
          if (dancing && !opts.reducedMotion) {
            ctx.rotate(Math.sin(beat) * .065)
            const stretch = Math.cos(beat * 2) * .018
            ctx.scale(1 - stretch, 1 + stretch)
          }
          drawMotionTrail(ctx, cell, action ? (time-action.start)/Math.max(1,action.end-action.start) : 0, action?.kind === "cast", color, opts.reducedMotion || opts.lowQuality || current.paused || actor.hp<=0 || !action || action.kind === "move")
          ctx.drawImage(sheet, sx, sy, sw, sh, -anchorX * scale, -anchorY * scale, sw * scale, sh * scale)
          ctx.restore()
        } else orb(x, y - cell * .5, cell * .25, color)
        ctx.globalAlpha = 1
        const upgrade = opts.upgrades.find(u => u.uid === actor.uid)
        if (upgrade) drawStarUpgrade(ctx, upgrade, now, x, y, cell, left, top, opts.reducedMotion, opts.lowQuality)
        if (actor.hp > 0) {
          const bw = cell * 0.86,
            by = Math.max(top + p.y * cell + 2, y - size - cell * .05)
          ctx.fillStyle = "#101b21"
          ctx.fillRect(x - bw / 2, by, bw, 4)
          const lastHp = healthTrails.get(actor.uid)
          if (!lastHp) healthTrails.set(actor.uid, { hp: actor.hp, from: actor.hp, at: now })
          else if (lastHp.hp !== actor.hp) {
            const old = lastHp.from + (lastHp.hp - lastHp.from) * Math.min(1, (now - lastHp.at) / 280)
            healthTrails.set(actor.uid, { hp: actor.hp, from: Math.max(old, actor.hp), at: now })
          }
          const trail = healthTrails.get(actor.uid)!
          const tail = opts.reducedMotion ? actor.hp : trail.from + (actor.hp - trail.from) * Math.min(1, (now - trail.at) / 280)
          ctx.fillStyle = "#e6c77e"; ctx.fillRect(x - bw / 2, by, bw * tail / actor.maxHp, 4)
          ctx.fillStyle = actor.side === "ally" ? "#a6e0b0" : "#ed9c91"
          ctx.fillRect(x - bw / 2, by, (bw * actor.hp) / actor.maxHp, 4)
          ctx.fillStyle = "#8dd6ec"
          ctx.fillRect(x - bw / 2, by + 5, (bw * actor.mana) / 100, 2)
          ctx.font = `${Math.max(8, cell * 0.2)}px sans-serif`
          ctx.fillStyle = "#ffd880"
          ctx.textAlign = "center"
          if (actor.side === "ally") {
            const title = def.name.length > (cell < 45 ? 8 : 12) ? def.name.slice(0, cell < 45 ? 7 : 11) + "…" : def.name
            ctx.font = `bold ${Math.max(7,cell * .16)}px sans-serif`
            ctx.fillStyle = "rgba(10,24,32,.8)"; ctx.fillRect(x - cell * .46,y + cell * -.025,cell * .92,cell * .18)
            ctx.fillStyle = "#f5e4c2"; ctx.fillText(title,x,y + cell * .1,cell * .88)
            ctx.fillStyle = "#ffd880"; ctx.fillText("★".repeat(actor.star),x,y + cell * .18)
          }
          if (actor.stunnedUntil > time) ctx.fillText("✦", x, y - size)
          if (actor.sealedUntil > time) {
            ctx.fillStyle = "#e4b4ef"
            ctx.fillText("Khóa phép", x, y - size)
          }
        }
      }
      if (b) {
        for (const u of actors.filter(a => a.hp > 0 && a.action && a.action.kind !== "move" && time < a.action.hit)) {
          const action = u.action!, origin = coords.get(u.uid)!
          const target = actorMap.get(action.target ?? "")
          const end = target ? coords.get(target.uid)! : origin
          const t = Math.max(0, Math.min(1, (time - action.start) / Math.max(1, action.hit - action.start)))
          const school = (u.side === "ally" ? UNIT_MAP[u.id] : MONSTER_MAP[u.id]).school
          const kind = action.kind === "cast" ? skillVfx(action.skill ?? u.skill, u.range) : u.range <= 1 ? "slash" : "projectile"
          const from = { x:px(origin.x), y:py(origin.y)-cell*.48 }, to = { x:px(end.x), y:py(end.y)-cell*.48 }
          if (opts.reducedMotion) continue
          if (action.kind === "cast") {
            drawChannel(ctx, { x:from.x,y:py(origin.y) },school,t,cell*.48,opts.lowQuality)
            drawCastAura(ctx, from.x, py(origin.y), cell, school, t, opts.lowQuality)
          }
          // Support recipients are selected at resolution. Never send a healing
          // projectile to the enemy held in the action's generic target field.
          if (action.kind === "cast" && ["heal", "shield"].includes(kind)) continue
          if (kind === "slash") {
            if(t>.72) drawImpact(ctx,to,school,(t-.72)*.3,cell*.45,"slash",opts.lowQuality)
          } else if (["shield","summon"].includes(kind) || !target || target.uid === u.uid) {
            if(t>.4) drawImpact(ctx,from,school,(t-.4)*.6,cell*.42,kind,opts.lowQuality)
          } else if(t>.25) drawProjectile(ctx,from,to,school,(t-.25)/.75,cell*(action.kind === "cast" ? .22 : .16),opts.lowQuality,kind)
        }
        const popup = new Map<string, number>()
        for (const event of b.events) if (visualTime >= event.tick && visualTime - event.tick < 32) popup.set(event.kind === "cast" ? `cast:${event.source}` : `${event.kind === "heal" ? "heal" : "damage"}:${event.target}`, event.id)
        const labels = new Set([...popup.keys()].filter(key => key.startsWith("cast:")).sort((a,b) => popup.get(b)! - popup.get(a)!).slice(0, 4))
        for (const e of b.events.filter(
          (e) => e.kind !== "move" && e.kind !== "attack",
        )) {
          const age = (visualTime - e.tick) / 20
          if (age < 0 || age > 1.6) continue
          const point = coords.get(e.target) ?? {
              x: e.cell % 6,
              y: Math.floor(e.cell / 6),
            },
            x = px(point.x),
            y = py(point.y) - cell * 0.45
          const color =
            e.kind === "heal"
              ? "#b6f2a8"
              : e.kind === "burn"
                ? "#ff9b62"
                : AUTO_SCHOOLS[e.school].color
          const sourceActor = actorMap.get(e.source)
          if (e.kind === "cast" && e.amount > 0 && sourceActor) {
            const sourcePos = coords.get(e.source)!
            drawSkillBurst(ctx, px(sourcePos.x), py(sourcePos.y) - cell * .3, cell, e.school, e.skill ?? sourceActor.skill, age, opts.reducedMotion, opts.lowQuality)
          }
          if (e.kind === "death") drawDeparture(ctx, x, y, cell, e.school, age, opts.reducedMotion, opts.lowQuality)
          if (!opts.reducedMotion && age < .7 && ["hit","shield","heal","phase","summon","burn"].includes(e.kind)) {
            const source = actorMap.get(e.source)
            const kind = e.kind === "heal" ? "heal" : e.kind === "shield" ? "shield" : e.kind === "summon" ? "summon"
              : e.kind === "hit" && source?.range === 1 ? "slash" : "projectile"
            drawImpact(ctx,{x,y},e.school,age,cell*(e.kind === "phase" ? .75 : .4),kind,opts.lowQuality)
            const art = kind === "shield" ? "shield" : e.school === "ember" ? "fire-impact" : e.school === "tide" ? "water-impact" : null
            if(art && !opts.lowQuality) {
              const texture = getImage(`/assets/tcg/fx/${art}.webp`)
              if(texture.complete && texture.naturalWidth) {
                ctx.save();ctx.globalAlpha=(1-age/.7)*.65
                const extent=cell*(.7+age*.65);ctx.drawImage(texture,x-extent/2,y-extent/2,extent,extent);ctx.restore()
              }
            }
          }
          if (
            ["hit", "heal", "burn"].includes(e.kind) &&
            e.amount > 0 &&
            age < 1.1 && popup.get(`${e.kind === "heal" ? "heal" : "damage"}:${e.target}`) === e.id
          ) {
            ctx.globalAlpha = Math.min(1, (1.1 - age) * 2)
            ctx.font = `bold ${Math.max(8, cell * .2)}px sans-serif`
            ctx.textAlign = "center"
            ctx.fillStyle = e.kind === "heal" ? "#b6f2a8" : "#fff1d3"
            ctx.strokeStyle = "#172430"
            ctx.lineWidth = 3
            const label = `${e.kind === "heal" ? "+" : "−"}${e.amount}`
            ctx.strokeText(label, x, y - (opts.reducedMotion ? 0 : age * 20))
            ctx.fillText(label, x, y - (opts.reducedMotion ? 0 : age * 20))
            ctx.globalAlpha = 1
          }
          if (e.kind === "cast" && e.amount > 0 && popup.get(`cast:${e.source}`) === e.id && labels.has(`cast:${e.source}`)) {
            const u = actorMap.get(e.source)
            if (u) {
              const pos = coords.get(u.uid)!
              ctx.font = `bold ${Math.max(8, cell * .16)}px sans-serif`
              ctx.textAlign = "center"
              ctx.fillStyle = color
              ctx.strokeStyle = "#172430"
              ctx.lineWidth = 3
              const label = SKILL_LABELS[e.skill ?? u.skill]
              const cx = Math.min(width - 48, Math.max(48, px(pos.x))),
                cy = py(pos.y) - cell * 1.1
              ctx.strokeText(label, cx, cy, cell * 1.6)
              ctx.fillText(label, cx, cy, cell * 1.6)
            }
          }
        }
      }
      if (opts.celebrating && !opts.reducedMotion) {
        const count = opts.lowQuality ? 8 : 24
        for (let k = 0; k < count; k++) {
          const t = ((visualTime / 45 + k / count) % 1)
          const cx = left + ((k * .61803) % 1) * cell * 6
          const cy = top + t * cell * 6
          ctx.save()
          ctx.globalAlpha = Math.sin(t * Math.PI) * .8
          ctx.translate(cx + Math.sin(t * 6 + k) * cell * .18, cy)
          ctx.rotate(t * 6 + k)
          ctx.fillStyle = ["#ffd381", "#91dfbf", "#eea6b3"][k % 3]
          ctx.fillRect(-2, -3, 4, 6)
          ctx.restore()
        }
      }
      handle = requestAnimationFrame(draw)
    }
    handle = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(handle)
      observer.disconnect()
      leases.forEach(lease=>lease.release())
    }
  }, [getFrame])
  const preview = enemyPlan(run)
  return (
    <div className="ac-board" ref={root}>
      <canvas ref={canvas} aria-hidden="true" />
      <div
        className="ac-cell-grid"
        role="group"
        aria-label="Bàn 6 nhân 6. Kéo quân để xếp; giữ 0,3 giây để xem. PC có thể chọn quân rồi chọn ô."
      >
        {CELLS.map((cell) => {
          const piece = run.roster.find((p) => p.cell === cell),
            enemy = preview.find((p) => p.cell === cell)
          const liveActor =
            run.phase !== "prepare"
              ? run.combat?.actors.find((a) => a.cell === cell && a.hp > 0)
              : null
          const name =
            run.phase === "prepare"
              ? piece
                ? UNIT_MAP[piece.id].name
                : enemy?.def.name
              : liveActor
                ? (UNIT_MAP[liveActor.id] ?? MONSTER_MAP[liveActor.id]).name
                : undefined
          return (
            <button
              key={cell}
              data-cell={cell}
              aria-label={`Hàng ${Math.floor(cell / 6) + 1}, cột ${(cell % 6) + 1}${
                name ? ` · ${name}` : " · ô trống"
              }`}
              className={
                run.phase === "prepare" && cell >= 18 ? "can-place" : ""
              }
              draggable={false}
              data-piece={run.phase === "prepare" ? piece?.uid : undefined}
              data-star={piece?.star}
              data-star-scale={piece ? starScale(piece.star) : undefined}
              aria-keyshortcuts={run.phase === "prepare" && piece ? "W E" : undefined}
              onPointerDown={e => { if (run.phase === "prepare" && piece) onPiecePointerDown?.(piece.uid, e); else onCellPointerDown?.(cell, e) }}
              onContextMenu={e => { e.preventDefault(); onInspectCell?.(cell) }}
              aria-pressed={piece ? piece.uid === selected : undefined}
              data-placement={run.phase === "prepare" && cell >= 18 && !!selected ? "available" : undefined}
              onDragStart={(e) => {
                if (piece) e.dataTransfer.setData("text/plain", piece.uid)
              }}
              onDragOver={(e) => {
                if (run.phase === "prepare" && cell >= 18) e.preventDefault()
              }}
              onDrop={(e) => {
                e.preventDefault()
                onCell(cell, e.dataTransfer.getData("text/plain"))
              }}
              onClick={e => onCell(cell, undefined, e.detail === 0)}
              onKeyDown={(e) => {
                const delta = ({
                  ArrowUp: -6,
                  ArrowDown: 6,
                  ArrowLeft: -1,
                  ArrowRight: 1,
                } as Record<string, number>)[e.key]
                if (delta !== undefined) {
                  e.preventDefault()
                  root.current
                    ?.querySelector<HTMLButtonElement>(
                      `button[data-cell="${Math.max(0, Math.min(35, cell + delta))}"]`,
                    )
                    ?.focus()
                }
              }}
              style={{ "--cell": cell } as CSSProperties}
            />
          )
        })}
      </div>
    </div>
  )
}

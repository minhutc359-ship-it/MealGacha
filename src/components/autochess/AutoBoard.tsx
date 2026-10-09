import { useEffect, useRef, type CSSProperties } from "react"
import {
  AUTO_SCHOOLS,
  MONSTER_MAP,
  SKILL_LABELS,
  UNIT_MAP,
} from "../../game/autochess/catalog"
import { enemyPlan } from "../../game/autochess/combat"
import type { Actor, AutoRun } from "../../game/autochess/types"
import { actorPosition as position, actorFrame, SPRITE_SHEETS } from "../../game/autochess/presentation"
import { characterImage as getImage } from "../../infrastructure/assets/characterSprites"

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
  onCell,
}: {
  run: AutoRun
  getFrame: Frames
  selected: string | null
  reducedMotion: boolean
  lowQuality: boolean
  celebrating: boolean
  onCell: (cell: number, dragged?: string) => void
}) {
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null)
  const options = useRef({ selected, reducedMotion, lowQuality, celebrating })
  useEffect(() => {
    options.current = { selected, reducedMotion, lowQuality, celebrating }
  }, [selected, reducedMotion, lowQuality, celebrating])
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
    const frozen = new Map<string, { x: number; y: number }>()
    const facing = new Map<string, boolean>()
    const placements = new Map<string, { x: number; y: number; fromX: number; fromY: number; start: number }>()
    let endedAt: number | null = null
    let currentBattle = "",
      lastLowQuality = lowQuality
    const images = Object.fromEntries(
      Object.entries(paths).map(([k, path]) => [k, getImage(path)]),
    )
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
        frozen.clear()
        facing.clear()
        endedAt = null
        currentBattle = b?.id ?? "prepare"
      }
      if (!b?.result) endedAt = null
      else endedAt ??= now
      const visualTime = time + (endedAt === null ? 0 : (now - endedAt) / 50)
      ctx.clearRect(0, 0, width, height)
      const wash = ctx.createLinearGradient(0, top, 0, top + cell * 6)
      wash.addColorStop(0, "rgba(9,28,40,.6)")
      wash.addColorStop(1, "rgba(35,39,36,.84)")
      ctx.fillStyle = wash
      ctx.fillRect(left, top, cell * 6, cell * 6)
      for (const i of CELLS) {
        const x = left + (i % 6) * cell,
          y = top + Math.floor(i / 6) * cell
        ctx.fillStyle =
          ((i % 6) + Math.floor(i / 6)) % 2
            ? "rgba(237,207,153,.045)"
            : "rgba(2,15,24,.15)"
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
          const target = actors.find((t) => t.uid === a.action!.target),
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
          fresh =
            actor.side === "enemy" ||
            (actor.side === "ally" && UNIT_MAP[actor.id].portrait >= 18)
        const sheet =
          actor.side === "enemy"
            ? images.enemy
            : fresh
              ? images.fresh
              : images.base
        const spriteKey = actor.side === "enemy" ? "enemy" : fresh ? "fresh" : "base"
        const row = actor.side === "enemy" ? MONSTER_MAP[actor.id].sprite : fresh ? UNIT_MAP[actor.id].portrait - 18 : UNIT_MAP[actor.id].sprite
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
            (actor.side === "enemy" && MONSTER_MAP[actor.id].boss ? .9 : .75),
          color = AUTO_SCHOOLS[def.school].color
        ctx.globalAlpha = actor.hp <= 0 ? Math.max(0, 1 - deadAge / 20) : 1
        ctx.fillStyle = "rgba(0,0,0,.46)"
        ctx.beginPath()
        ctx.ellipse(x, y + 2, cell * 0.33, cell * 0.11, 0, 0, Math.PI * 2)
        ctx.fill()
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
        const dancing = opts.celebrating && actor.side === "ally" && actor.hp > 0
        const beat = visualTime * .38 + row * .28
        const index = dancing
          ? opts.reducedMotion ? (fresh ? 0 : 13) : (fresh ? [0, 1, 2, 1] : [13, 1, 13, 3])[Math.floor(visualTime / 5 + row * .2) % 4]
          : actorFrame(actor, time, fresh, b)
        const breath = !opts.reducedMotion && !actor.action && actor.hp > 0 && !current.paused
          ? Math.sin(visualTime / 10 + row) * cell * .009 : 0
        if (sheet.complete && sheet.naturalWidth && spriteRow) {
          const [sx, sy, sw, sh, anchorX, anchorY] = spriteRow.frames[index]
          const scale = size / spriteRow.height
          ctx.save()
          const target = actors.find(a => a.uid === actor.action?.target)
          if (target && Math.abs(position(target, time).x - p.x) > .05)
            facing.set(actor.uid, (position(target, time).x < p.x) !== (actor.side === "enemy"))
          else if (actor.action?.kind === "move" && actor.action.to % 6 !== actor.action.from % 6)
            facing.set(actor.uid, (actor.action.to % 6 < actor.action.from % 6) !== (actor.side === "enemy"))
          const flip = facing.get(actor.uid) ?? false
          let lungeX = 0, lungeY = 0, gait = 0
          if (!opts.reducedMotion && actor.action && !dancing) {
            const progress = Math.max(0, Math.min(1, (time - actor.action.start) / Math.max(1, actor.action.end - actor.action.start)))
            if (actor.action.kind === "move") gait = -Math.abs(Math.sin(progress * Math.PI * 2)) * cell * .018
            else if (target) {
              const dest = coords.get(target.uid)!, dx = dest.x - p.x, dy = dest.y - p.y
              const length = Math.max(1, Math.hypot(dx, dy))
              const lunge = Math.sin(Math.max(0, Math.min(1, (progress - .12) / .78)) * Math.PI) * cell * (actor.range === 1 ? .2 : .055)
              lungeX = dx / length * lunge
              lungeY = dy / length * lunge
            }
          }
          const hop = dancing && !opts.reducedMotion ? -Math.abs(Math.sin(beat)) * cell * .075 : 0
          const sway = dancing && !opts.reducedMotion ? Math.sin(beat) * cell * .045 : 0
          ctx.translate(x + lungeX + sway, y + breath + lungeY + gait + hop)
          if (flip) ctx.scale(-1, 1)
          if (dancing && !opts.reducedMotion) {
            ctx.rotate(Math.sin(beat) * .065)
            const stretch = Math.cos(beat * 2) * .018
            ctx.scale(1 - stretch, 1 + stretch)
          }
          ctx.drawImage(sheet, sx, sy, sw, sh, -anchorX * scale, -anchorY * scale, sw * scale, sh * scale)
          ctx.restore()
        } else orb(x, y - cell * .5, cell * .25, color)
        ctx.globalAlpha = 1
        if (actor.hp > 0) {
          const bw = cell * 0.86,
            by = Math.max(top + p.y * cell + 2, y - size - cell * .05)
          ctx.fillStyle = "#101b21"
          ctx.fillRect(x - bw / 2, by, bw, 4)
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
        for (const u of actors.filter(
          (a) =>
            a.hp > 0 &&
            a.action &&
            a.action.kind !== "move" &&
            time < a.action.hit,
        )) {
          const a = u.action!,
            target = actors.find((t) => t.uid === a.target)
          if (!target) continue
          const origin = coords.get(u.uid)!,
            end = coords.get(target.uid)!,
            t = Math.max(0, (time - a.start) / (a.hit - a.start))
          if (a.kind === "attack" && u.range <= 1) continue
          const color =
            AUTO_SCHOOLS[
              (u.side === "ally" ? UNIT_MAP[u.id] : MONSTER_MAP[u.id]).school
            ].color
          const x = px(origin.x + (end.x - origin.x) * t),
            y =
              py(origin.y + (end.y - origin.y) * t) -
              cell * 0.5 -
              Math.sin(t * Math.PI) * cell * 0.15
          orb(x, y, a.kind === "cast" ? 4 + t * 4 : 3, color)
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.globalAlpha = 0.45
          ctx.beginPath()
          ctx.moveTo(px(origin.x), py(origin.y) - cell * 0.5)
          ctx.lineTo(x, y)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
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
          const sparkCount = opts.reducedMotion ? 2 : opts.lowQuality ? 5 : 12
          if (
            ["hit", "cast", "shield", "phase", "summon"].includes(e.kind) &&
            age < 0.7
          ) {
            for (let k = 0; k < sparkCount; k++) {
              const angle = (k / sparkCount) * Math.PI * 2 + e.id,
                radius = age * cell * (e.kind === "phase" ? 1.7 : 0.7)
              orb(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                Math.max(1, 3 * (1 - age)),
                color,
                Math.max(0, 0.85 - age),
              )
            }
          }
          if (
            ((e.kind === "cast" && e.amount > 0) ||
              e.kind === "shield" ||
              e.kind === "heal" ||
              e.kind === "phase") &&
            age < 0.8
          ) {
            ctx.save()
            ctx.translate(x, y)
            ctx.globalAlpha = Math.max(0, 0.8 - age)
            ctx.strokeStyle = color
            ctx.fillStyle = color
            ctx.lineWidth = opts.lowQuality ? 2 : 3
            const radius = cell * (0.18 + age * 0.65)
            if (e.kind === "shield" || e.school === "hearth") {
              ctx.beginPath()
              ctx.moveTo(0, -radius)
              ctx.lineTo(radius * 0.7, -radius * 0.7)
              ctx.lineTo(radius * 0.6, radius * 0.4)
              ctx.lineTo(0, radius)
              ctx.lineTo(-radius * 0.6, radius * 0.4)
              ctx.lineTo(-radius * 0.7, -radius * 0.7)
              ctx.closePath()
              ctx.stroke()
            } else if (e.school === "ember") {
              for (let k = 0; k < (opts.lowQuality ? 3 : 5); k++) {
                const dx = (k - 2) * radius * 0.32,
                  dy = -age * cell * 0.5
                ctx.beginPath()
                ctx.moveTo(dx - radius * 0.2, dy + radius * 0.3)
                ctx.quadraticCurveTo(
                  dx - radius * 0.3,
                  dy - radius * 0.1,
                  dx,
                  dy - radius * (0.6 + (k % 2) * 0.3),
                )
                ctx.quadraticCurveTo(
                  dx + radius * 0.3,
                  dy,
                  dx + radius * 0.2,
                  dy + radius * 0.3,
                )
                ctx.fill()
              }
            } else if (e.school === "tide") {
              for (let k = 0; k < 3; k++) {
                ctx.beginPath()
                ctx.ellipse(
                  0,
                  0,
                  radius + k * cell * 0.08,
                  radius * 0.45 + k * cell * 0.04,
                  age * 2 + k * 0.4,
                  0,
                  Math.PI * 1.7,
                )
                ctx.stroke()
              }
            } else if (e.school === "grove" || e.kind === "heal") {
              for (let k = 0; k < 4; k++) {
                ctx.save()
                ctx.rotate((k * Math.PI) / 2 + age * 2)
                ctx.beginPath()
                ctx.moveTo(radius * 0.3, 0)
                ctx.quadraticCurveTo(radius, -radius * 0.35, radius * 1.2, 0)
                ctx.quadraticCurveTo(radius, radius * 0.35, radius * 0.3, 0)
                ctx.fill()
                ctx.restore()
              }
            } else {
              ctx.rotate(age)
              ctx.beginPath()
              for (let k = 0; k < 10; k++) {
                const r = radius * (k % 2 ? 0.4 : 1),
                  angle = (k * Math.PI) / 5 - Math.PI / 2
                const dx = Math.cos(angle) * r,
                  dy = Math.sin(angle) * r
                if (k) ctx.lineTo(dx, dy)
                else ctx.moveTo(dx, dy)
              }
              ctx.closePath()
              ctx.stroke()
            }
            ctx.restore()
          }
          if (
            ["hit", "heal", "burn"].includes(e.kind) &&
            e.amount > 0 &&
            age < 1.1
          ) {
            ctx.globalAlpha = Math.min(1, (1.1 - age) * 2)
            ctx.font = `bold ${Math.max(10, cell * 0.27)}px sans-serif`
            ctx.textAlign = "center"
            ctx.fillStyle = e.kind === "heal" ? "#b6f2a8" : "#fff1d3"
            ctx.strokeStyle = "#172430"
            ctx.lineWidth = 3
            const label = `${e.kind === "heal" ? "+" : "−"}${e.amount}`
            ctx.strokeText(label, x, y - age * 20)
            ctx.fillText(label, x, y - age * 20)
            ctx.globalAlpha = 1
          }
          if (e.kind === "cast" && e.amount > 0) {
            const u = actors.find((a) => a.uid === e.source)
            if (u) {
              const pos = coords.get(u.uid)!
              ctx.font = `bold ${Math.max(9, cell * 0.22)}px sans-serif`
              ctx.textAlign = "center"
              ctx.fillStyle = color
              ctx.strokeStyle = "#172430"
              ctx.lineWidth = 3
              const label = SKILL_LABELS[u.skill]
              const cx = Math.min(width - 48, Math.max(48, px(pos.x))),
                cy = py(pos.y) - cell * 1.1
              ctx.strokeText(label, cx, cy)
              ctx.fillText(label, cx, cy)
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
    }
  }, [getFrame])
  const preview = enemyPlan(run)
  return (
    <div className="ac-board" ref={root}>
      <canvas ref={canvas} aria-hidden="true" />
      <div
        className="ac-cell-grid"
        role="group"
        aria-label="Bàn 6 nhân 6. Chọn quân rồi chọn ô để di chuyển."
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
              draggable={run.phase === "prepare" && !!piece}
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
              onClick={() => onCell(cell)}
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

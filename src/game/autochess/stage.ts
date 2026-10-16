/** One projection for floor, actors, effects and pointer targets. Units remain
 * upright billboards; this is a 2.5D stage, not a mesh/rig renderer. */
export function stagePoint(x: number, y: number) {
  const depth = y / 6
  return { x: .5 + (x / 6 - .5) * (.78 + .22 * depth), y: .12 + depth * .82 }
}
export function stageCell(index: number) {
  const x = index % 6, y = Math.floor(index / 6)
  return [stagePoint(x, y), stagePoint(x + 1, y), stagePoint(x + 1, y + 1), stagePoint(x, y + 1)]
}
export function stageCellStyle(index: number) {
  const points = stageCell(index), left = Math.min(...points.map(p => p.x)), right = Math.max(...points.map(p => p.x))
  const top = points[0].y, bottom = points[2].y
  return {
    left: `${left * 100}%`, top: `${top * 100}%`, width: `${(right - left) * 100}%`, height: `${(bottom - top) * 100}%`,
    clipPath: `polygon(${points.map(p => `${(p.x - left) / (right - left) * 100}% ${(p.y - top) / (bottom - top) * 100}%`).join(",")})`,
  }
}
export function stageScale(y: number) { return .86 + Math.max(0, Math.min(5, y)) * .028 }

/** Static polished stone is cached once per canvas resize, not repainted per actor. */
export function drawStageFloor(ctx: CanvasRenderingContext2D, left: number, top: number, size: number) {
  const point = (x: number, y: number) => { const p = stagePoint(x, y); return { x: left + p.x * size, y: top + p.y * size } }
  const path = (points: {x: number; y: number}[]) => {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath()
  }
  ctx.save()
  const a = point(0, 6), b = point(6, 6), rim = size * .026
  path([a, b, {x: b.x, y: b.y + rim}, {x: a.x, y: a.y + rim}])
  const edge = ctx.createLinearGradient(0, a.y, 0, a.y + rim)
  edge.addColorStop(0, "#886c45"); edge.addColorStop(1, "#17272b")
  ctx.fillStyle = edge; ctx.fill()
  for (let i = 0; i < 36; i++) {
    const points = stageCell(i).map(p => ({x: left + p.x * size, y: top + p.y * size}))
    path(points)
    const light = ctx.createLinearGradient(points[0].x, points[0].y, points[2].x, points[2].y)
    light.addColorStop(0, (i + Math.floor(i / 6)) % 2 ? "#8b836a9c" : "#a39779a3")
    light.addColorStop(1, "#354b48b3")
    ctx.fillStyle = light; ctx.fill()
    ctx.lineWidth = Math.max(.8, size / 500); ctx.strokeStyle = "#e3c99865"; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(points[3].x + 1, points[3].y - 1); ctx.lineTo(points[2].x - 1, points[2].y - 1)
    ctx.strokeStyle = "#0a202878"; ctx.stroke()
  }
  path([point(0,0), point(6,0), point(6,6), point(0,6)])
  ctx.strokeStyle = "#e4bf7d"; ctx.lineWidth = Math.max(1.5, size / 250); ctx.stroke()
  ctx.beginPath(); const l = point(0,3), r = point(6,3); ctx.moveTo(l.x,l.y);ctx.lineTo(r.x,r.y)
  ctx.setLineDash([4,6]); ctx.strokeStyle = "#f0d59c99"; ctx.lineWidth = 1; ctx.stroke()
  ctx.restore()
}

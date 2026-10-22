import { useState } from "react"
import {
  BATTLE_STATES,
  DIRECTIONS,
  SKILL_SLOTS,
  type BattleState,
  type SkillSlot,
  type SpiritAssetManifest,
  type WorldDirection,
} from "../../src/aw2/assets/types"
import { validateAssetManifest } from "../../src/aw2/assets/animation"
import { ROSTER } from "../../src/aw2/world/ids"
import { AssetCanvas } from "./AssetCanvas"

const stateLabels: Record<BattleState, string> = {
  idle: "Đứng",
  move: "Di chuyển",
  attack: "Đánh thường",
  cast: "Thi triển",
  hit: "Trúng đòn",
  guard: "Phòng thủ",
  ultimate: "Tuyệt kỹ",
  defeat: "Bị hạ",
}
const directionLabels: Record<WorldDirection, string> = {
  down: "Xuống",
  left: "Trái",
  right: "Phải",
  up: "Lên",
}

export function AssetPreview({
  manifest,
  combatImplemented = true,
}: {
  manifest: SpiritAssetManifest
  combatImplemented?: boolean
}) {
  const errors = validateAssetManifest(manifest)
  const character = ROSTER.find((unit) => unit.spiritId === manifest.spiritId)!
  const hasMotionCels = manifest.battle.idle.frames.length >= 4
  const [mode, setMode] = useState<"world" | "battle">("battle")
  const [state, setState] = useState<BattleState>("idle")
  const [direction, setDirection] = useState<WorldDirection>("down")
  const [walking, setWalking] = useState(true)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [playId, setPlayId] = useState(0)
  const [skill, setSkill] = useState<SkillSlot | null>(null)
  function play(next: BattleState, nextSkill: SkillSlot | null = null) {
    setState(next)
    setSkill(nextSkill)
    setMode("battle")
    setPaused(false)
    setPlayId((id) => id + 1)
  }
  return (
    <main className="aw2-save aw2-asset-preview">
      <p className="eyebrow">{manifest.spiritId} · base-v1 · bộ tham chiếu</p>
      <h1>{manifest.displayName} · Bộ chuyển động tham chiếu</h1>
      <p>
        {hasMotionCels
          ? "Chibi bốn hướng và tám trạng thái HD, mỗi trạng thái có bốn khung hình riêng. Đây là bộ chuyển động tham chiếu đang kiểm duyệt."
          : "Chibi bốn hướng và tám tư thế HD, kèm hiệu ứng riêng. Battle dùng tư thế gốc + chuyển động nội suy; chưa phải hoạt ảnh vẽ từng khung."}
      </p>
      <p>
        <a href="/dev/aw2/world.html">Về world thử nghiệm</a> ·{" "}
        <a href="/dev/aw2/starters.html">Năm starter</a> ·{" "}
        <a href="/dev/aw2/roster.html">Các bộ nhân vật</a> ·{" "}
        <a href={manifest.provenance.prompts}>Prompt và nguồn tạo ảnh</a>
      </p>
      {manifest.spiritId === "aw2-muoi" && combatImplemented && (
        <p>
          Kit đã có trong{" "}
          <a href="/dev/aw2/battle.html?team=muoi">trận luyện Muối Đen</a>; thu
          thập và đưa vào đội hành trình còn đang phát triển.
        </p>
      )}
      {errors.length > 0 ? (
        <p role="alert">Manifest lỗi: {errors.join("; ")}</p>
      ) : (
        <>
          <div className="actions" aria-label="Chọn bộ hình">
            <button
              aria-pressed={mode === "world"}
              onClick={() => {
                setMode("world")
                setSkill(null)
                setPaused(false)
                setPlayId((id) => id + 1)
              }}
            >
              World / chibi
            </button>
            <button
              aria-pressed={mode === "battle"}
              onClick={() => play("idle")}
            >
              HD battle
            </button>
          </div>
          {mode === "battle" ? (
            <div className="actions" aria-label="Tám trạng thái HD">
              {BATTLE_STATES.map((next) => (
                <button
                  key={next}
                  data-testid={`state-${next}`}
                  aria-pressed={state === next}
                  onClick={() => play(next)}
                >
                  {stateLabels[next]}
                </button>
              ))}
            </div>
          ) : (
            <div className="actions" aria-label="Bốn hướng world">
              {DIRECTIONS.map((next) => (
                <button
                  key={next}
                  data-testid={`direction-${next}`}
                  aria-pressed={direction === next}
                  onClick={() => {
                    setDirection(next)
                    setPlayId((id) => id + 1)
                  }}
                >
                  {directionLabels[next]}
                </button>
              ))}
              <label>
                <input
                  type="checkbox"
                  checked={walking}
                  onChange={(event) => setWalking(event.target.checked)}
                />{" "}
                Đi bộ
              </label>
            </div>
          )}
          <AssetCanvas
            manifest={manifest}
            mode={mode}
            state={state}
            skill={skill}
            direction={direction}
            walking={walking}
            playId={playId}
            paused={paused}
            reduced={reduced}
            audioEnabled={audioEnabled}
          />
          <div className="actions" aria-label="Điều khiển phát">
            <button onClick={() => setPaused((value) => !value)}>
              {paused ? "Tiếp tục" : "Tạm dừng"}
            </button>
            <button
              onClick={() => {
                setPlayId((id) => id + 1)
                setPaused(false)
              }}
            >
              Phát lại
            </button>
            <label>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(event) => setReduced(event.target.checked)}
              />{" "}
              Giảm chuyển động
            </label>
            <label>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(event) => setAudioEnabled(event.target.checked)}
              />{" "}
              Bật âm thanh
            </label>
          </div>
          <h2>Bốn kỹ năng · cue tham chiếu</h2>
          <div
            className="actions"
            aria-label={`Kỹ năng ${manifest.displayName}`}
          >
            {SKILL_SLOTS.map((slot) => (
              <button
                key={slot}
                data-testid={`skill-${slot}`}
                onClick={() =>
                  play(manifest.skills[slot].battleState as BattleState, slot)
                }
              >
                {manifest.skills[slot].displayName}
              </button>
            ))}
          </div>
          <p>
            Nội tại chỉ mô phỏng proc khi chọn ở đây; cần sự kiện combat:{" "}
            {manifest.skills.passive.trigger}.
          </p>
          <p>
            {manifest.skills.basic.projectile
              ? "Đạn có hình/đường bay/impact riêng. Điểm impact ở đây là mốc trình diễn; engine combat sẽ xác nhận trúng đích."
              : "Đánh cận chiến; không có projectile."}{" "}
            Mọi cue trong preview đều không gây sát thương, chữa máu hay nhận
            thưởng.
          </p>
        </>
      )}
      <section className="aw2-asset-details">
        <img
          src={manifest.assets.portrait.url}
          width={180}
          height={180}
          loading="lazy"
          alt={
            manifest.spiritId === "aw2-than"
              ? "Chân dung Than áo chàm và khiên đồng"
              : `Chân dung ${manifest.displayName}`
          }
        />
        <div>
          <h2>Danh tính và nguồn</h2>
          <p>
            {manifest.displayName} · {character.recipeAffiliation} ·{" "}
            {character.rarity} · {character.role} · {manifest.spiritId}
          </p>
          <p>
            Ảnh tạo bằng {manifest.provenance.generator}; audio tổng hợp riêng
            từ mã nguồn. License: {manifest.provenance.licenseStatus}. Chưa có
            duyệt pháp lý phát hành.
          </p>
          <p>
            {combatImplemented
              ? "Đã có combat và cấp độ thử nghiệm."
              : "Nhân vật này mới có bộ hình tham chiếu; kỹ năng combat và thu thập chưa được triển khai."}{" "}
            Bộ tham chiếu còn chờ duyệt mỹ thuật, cân bằng, âm thanh, thiết bị
            và quyền sử dụng. Trang này không truy cập save.
          </p>
          <p>
            <a href={manifest.assets.reference.url}>Xem ảnh tham chiếu gốc</a>
          </p>
        </div>
      </section>
    </main>
  )
}

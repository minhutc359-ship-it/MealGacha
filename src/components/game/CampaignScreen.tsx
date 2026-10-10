import { LivingJournal } from "./LivingJournal"
import { useState, type CSSProperties } from "react"
import { CHAPTERS, isStageUnlocked } from "../../game/story"
import { SCHOOLS } from "../../game/catalog"
import { useGameStore } from "../../game/useGameStore"
import { CharacterPortrait } from "./CharacterPortrait"
import { MemoryJournal } from "./MemoryJournal"
import { CultureJournal } from "./CultureJournal"
import { Dialog } from "./Dialog"

const GUARDIANS = ["bach", "nhien", "moc", "hai", "lien", "hero", "an", "hai", "an"] as const
const STOPS: CSSProperties[] = [
  { left: "19%", top: "22%" },
  { left: "18%", top: "76%" },
  { left: "49%", top: "40%" },
  { left: "62%", top: "76%" },
  { left: "79%", top: "44%" },
  { left: "81%", top: "17%" },
]
export function CampaignScreen({ onStage }: { onStage: (id: string) => void }) {
  const ending = useGameStore(s => s.save.storyEnding)
  const cleared = useGameStore((s) => s.save.clearedStages)
  const history = useGameStore((s) => s.save.history)
  const [selected, setSelected] = useState(() =>
    Math.min(CHAPTERS.length - 1, Math.floor(cleared.length / 3)),
  )
  const [reader, setReader] = useState<"memory" | "culture" | "map" | "living" | null>(
    null,
  )
  const chapter = CHAPTERS[selected]
  const open = isStageUnlocked(chapter.stages[0].id, cleared, ending)
  const map = (
    <div className="tcg-world-map">
      <img
        className="tcg-world-map-art"
        src="/assets/tcg/map/meal-world-map.webp"
        alt="Bản đồ kỳ ảo của sáu miền ký ức"
        width="1024"
        height="1024"
        decoding="async"
      />
      <div className="tcg-world-map-shade" aria-hidden="true" />
      <svg
        className="tcg-world-map-route"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="tcg-route-underlay"
          pathLength="100"
          d="M190 220 C105 385 105 600 180 760 C285 760 385 575 490 400 C565 465 625 610 620 760 C705 720 765 580 790 440 C825 335 830 235 810 170"
        />
        <path
          className="tcg-route-progress"
          pathLength="100"
          d="M190 220 C105 385 105 600 180 760 C285 760 385 575 490 400 C565 465 625 610 620 760 C705 720 765 580 790 440 C825 335 830 235 810 170"
          style={{ strokeDasharray: `${(Math.min(18, cleared.length) / 18) * 100} 100` }}
        />
      </svg>
      {CHAPTERS.slice(0, 6).map((ch, i) => {
        const unlocked = isStageUnlocked(ch.stages[0].id, cleared, ending)
        const count = ch.stages.filter((s) => cleared.includes(s.id)).length
        return (
          <button
            key={ch.id}
            className={`tcg-map-stop ${
              count === 3
                ? "is-complete"
                : unlocked
                  ? "is-current"
                  : "is-locked"
            }`}
            style={STOPS[i]}
            disabled={!unlocked}
            aria-label={
              unlocked
                ? `Đến chương ${i + 1}: ${ch.title}, ${count} trên 3 chặng đã vượt qua`
                : `Chương ${i + 1} chưa mở`
            }
            onClick={() => {
              setSelected(i)
              setReader(null)
            }}
          >
            <span className="tcg-map-pin">
              {count === 3 ? "✓" : unlocked ? SCHOOLS[ch.school].symbol : "◇"}
            </span>
            <span className="tcg-map-stop-label">
              <small>CHƯƠNG 0{i + 1}</small>
              <strong>{unlocked ? ch.title : `Ký ức ${i + 1}`}</strong>
            </span>
          </button>
        )
      })}
    </div>
  )
  return (
    <section className="tcg-campaign-screen">
      <div className="tcg-section-heading">
        <div>
          <span className="tcg-kicker">
            CHIẾN DỊCH · {cleared.length}/27 MÀN
          </span>
          <h1>Bản đồ ký ức</h1>
        </div>
        <button
          className="tcg-button ghost tcg-open-map"
          onClick={() => setReader("map")}
        >
          ◇ Bản đồ
        </button>
      </div>
      <div className="tcg-screen-tools" aria-label="Sổ hành trình">
        <button className="tcg-button ghost" onClick={()=>setReader("living")}>Sổ Chợ Sống</button>
        <button
          className="tcg-button ghost"
          onClick={() => setReader("memory")}
        >
          Nhật ký & lời thoại
        </button>
        <button
          className="tcg-button ghost"
          onClick={() => setReader("culture")}
        >
          Văn hóa Việt Nam
        </button>
      </div>
      <div className="tcg-chapter-picker" role="group" aria-label="Chọn chương">
        {CHAPTERS.map((ch, i) => (
          <button
            key={ch.id}
            aria-pressed={selected === i}
            disabled={!isStageUnlocked(ch.stages[0].id, cleared, ending)}
            aria-label={`Xem chương ${i + 1}`}
            onClick={() => setSelected(i)}
          >
            <b>{String(i + 1).padStart(2, "0")}</b>
            <span>
              {isStageUnlocked(ch.stages[0].id, cleared, ending) ? ch.title : "Chưa mở"}
            </span>
            <small>
              {ch.stages.filter((s) => cleared.includes(s.id)).length}/3
            </small>
          </button>
        ))}
      </div>
      <div className="tcg-campaign-layout">
        <div className="tcg-campaign-atlas" aria-label="Bản đồ chiến dịch">
          {map}
          <p>Chọn điểm sáng để chuyển chương.</p>
        </div>
        <section
          id={`chapter-${chapter.id}`}
          className={`tcg-chapter ${open ? "" : "is-locked"}`}
        >
          <div className="tcg-chapter-art">
            {open && <img src={chapter.art} alt="" decoding="async" />}
            <span>CHƯƠNG 0{selected + 1}</span>
            <div>
              <small>{open ? chapter.subtitle : "Một trang chưa mở"}</small>
              <h2>{open ? chapter.title : `Ký ức ${selected + 1}`}</h2>
            </div>
            <b>{open ? SCHOOLS[chapter.school].symbol : "⚿"}</b>
            {open && (
              <CharacterPortrait
                id={GUARDIANS[selected]}
                decorative
                className="tcg-chapter-character"
              />
            )}
          </div>
          <p>
            {open
              ? chapter.intro
              : "Hoàn thành chương trước để khám phá ký ức và minh họa tại đây."}
          </p>
          <details className="tcg-chapter-note">
            <summary>Về chương này</summary>
            <p>
              {open
                ? chapter.intro
                : "Hoàn thành chương trước để mở ký ức tại đây."}
            </p>
          </details>
          <div className="tcg-stages">
            {chapter.stages.map((s, i) => (
              <button
                key={s.id}
                disabled={!isStageUnlocked(s.id, cleared, ending)}
                onClick={() => onStage(s.id)}
              >
                <span className={cleared.includes(s.id) ? "complete" : ""}>
                  {cleared.includes(s.id) ? "✓" : i + 1}
                </span>
                <div>
                  <strong>{open ? s.title : `Ký ức ${i + 1}`}</strong>
                  <small>
                    {open
                      ? !cleared.includes(s.id) &&
                        history.find(
                          (item) =>
                            item.mode === "story" && item.stageId === s.id,
                        )?.result === "loss"
                        ? "CHƯA VƯỢT MÀN · Thử lại để mở chặng kế tiếp"
                        : `${s.boss ? "BOSS · " : ""}${s.opponent}`
                      : "Nội dung chưa mở"}
                  </small>
                </div>
                <b>{isStageUnlocked(s.id, cleared, ending) ? "→" : "⚿"}</b>
              </button>
            ))}
          </div>
        </section>
      </div>
      {reader && (
        <Dialog
          title={
            reader === "living" ? "Sổ Chợ Sống" : reader === "memory"
              ? "Nhật ký ký ức"
              : reader === "culture"
                ? "Văn hóa Việt Nam"
                : "Bản đồ chiến dịch"
          }
          onClose={() => setReader(null)}
          wide
          className="tcg-journal-dialog"
        >
          {reader === "living" ? <LivingJournal /> : reader === "memory" ? (
            <MemoryJournal />
          ) : reader === "culture" ? (
            <CultureJournal />
          ) : (
            map
          )}
        </Dialog>
      )}
    </section>
  )
}

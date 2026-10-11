import { LivingJournal } from "./LivingJournal"
import { useState } from "react"
import { CampaignMap } from "./CampaignMap"
import { CHAPTERS, isStageUnlocked } from "../../game/story"
import { SCHOOLS } from "../../game/catalog"
import { useGameStore } from "../../game/useGameStore"
import { CharacterPortrait } from "./CharacterPortrait"
import { MemoryJournal } from "./MemoryJournal"
import { CultureJournal } from "./CultureJournal"
import { Dialog } from "./Dialog"
import { campaignProgress } from "../../game/storyPresentation"

const GUARDIANS = ["bach", "nhien", "moc", "hai", "lien", "hero", "an", "hai", "an"] as const
export function CampaignScreen({ onStage }: { onStage: (id: string) => void }) {
  const ending = useGameStore(s => s.save.storyEnding)
  const cleared = useGameStore((s) => s.save.clearedStages)
  const progress = campaignProgress(cleared)
  const history = useGameStore((s) => s.save.history)
  const [selected, setSelected] = useState(() =>
    Math.min(CHAPTERS.length - 1, Math.floor(cleared.length / 3)),
  )
  const [reader, setReader] = useState<"memory" | "culture" | "map" | "living" | null>(
    null,
  )
  const chapter = CHAPTERS[selected]
  const open = isStageUnlocked(chapter.stages[0].id, cleared, ending)
  const [mapRegion, setMapRegion] = useState(() => selected >= 6 ? 1 : 0)
  const selectChapter = (index: number) => {
    setSelected(index)
    setMapRegion(index >= 6 ? 1 : 0)
    setReader(null)
  }
  const map = <CampaignMap region={mapRegion} onRegion={setMapRegion}
    selected={selected} onChapter={selectChapter} cleared={cleared} ending={ending} />
  return (
    <section className="tcg-campaign-screen">
      <div className="tcg-section-heading">
        <div>
          <span className="tcg-kicker">
            CHIẾN DỊCH · {progress.cleared}/{progress.total} MÀN
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
            onClick={() => selectChapter(i)}
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
          <p>Chọn miền và điểm sáng để chuyển chương. 10–12: Coming soon.</p>
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

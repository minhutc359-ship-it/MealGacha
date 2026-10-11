import { STAGES } from "../../game/story"
import { storyLines, campaignProgress } from "../../game/storyPresentation"
import { SCENES, ENDINGS } from "../../game/narrative"
import { useGameStore } from "../../game/useGameStore"
import { StoryScene } from "./StoryScene"
import { stageArtId } from "../../game/storyArt"

export function MemoryJournal() {
  const cleared = useGameStore((s) => s.save.clearedStages)
  const save = useGameStore((s) => s.save)
  const ending = save.storyEnding
  const progress = campaignProgress(cleared)
  const clues = STAGES.filter((stage) => SCENES[stage.id].clue)
  return (
    <section className="tcg-memory-journal tcg-panel">
      <span className="tcg-kicker">HỒ SƠ CHIẾC GHẾ TRỐNG</span>
      <h2>Những điều chưa khớp</h2>
      <p>
        Manh mối mở sau mỗi boss. Đọc lại khi một sự thật làm thay đổi ý nghĩa
        của điều đã biết.
      </p>
      <div className="tcg-clue-grid">
        {clues.map((stage, i) => {
          const unlocked = cleared.includes(stage.id)
          const clue = SCENES[stage.id].clue!
          return (
            <article key={stage.id} className={unlocked ? "" : "is-sealed"}>
              <span>
                0{i + 1} · {unlocked ? "ĐÃ GIẢI MÃ" : "CHƯA MỞ"}
              </span>
              <h3>{unlocked ? clue.title : "Một trang chưa được kể"}</h3>
              <p>
                {unlocked
                  ? clue.text
                  : `Hoàn thành ${stage.title} để mở trang này.`}
              </p>
            </article>
          )
        })}
      </div>
      {ending && (
        <article className="tcg-epilogue">
          <span className="tcg-kicker">ĐOẠN KẾT BẠN ĐÃ CHỌN</span>
          <h3>{ENDINGS[ending].title}</h3>
          <StoryScene
            key={ending}
            art={ending === "remember" ? "last-table" : "lantern"}
            lines={[
              { speaker: "Người kể", text: ENDINGS[ending].text },
              { speaker: "Nhiều năm sau", text: ENDINGS[ending].epilogue },
            ]}
          />
        </article>
      )}
      <details className="tcg-story-archive">
        <summary>Đọc lại hành trình · {progress.cleared}/{progress.total} màn</summary>
        <p>Lời thoại theo lựa chọn đang lưu trong Sổ Chợ Sống; xem lại không nhận thêm phần thưởng.</p>
        {STAGES.filter((stage) => cleared.includes(stage.id)).map((stage) => (
          <details key={stage.id}>
            <summary>
              {stage.chapter.title} · {stage.title}
            </summary>
            <StoryScene
              lines={[...storyLines(stage.id, save, "before"), ...storyLines(stage.id, save, "after")]}
              art={stageArtId(stage.id)}
            />
          </details>
        ))}
        {!cleared.length && (
          <p>Vượt màn đầu tiên để mở lại lời thoại và đoạn kết tại đây.</p>
        )}
      </details>
    </section>
  )
}

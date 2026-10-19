import { useEffect, useRef, useState } from "react"
import { CULTURAL_PAGES, cultureOpen } from "../../game/culture"
import { useCultureContent } from "../../game/useCultureContent"
import { useGameStore } from "../../game/useGameStore"
import { STORY_ART } from "../../game/storyArt"
import { RPG_MAPS } from "../../game/adventureRpg/content"

export function CultureJourney({ initialId }: { initialId: string | null }) {
  const save = useGameStore((s) => s.save),
    advance = useGameStore((s) => s.cultureStep)
  const [selected, setSelected] = useState(initialId ?? "tet"),
    [feedback, setFeedback] = useState<number | null>(null),
    [replay, setReplay] = useState<number | null>(null),
    [failed, setFailed] = useState(false)
  const { pages, error, retry } = useCultureContent()
  const summary =
    CULTURAL_PAGES.find((page) => page.id === selected) ?? CULTURAL_PAGES[0]
  const page = pages?.find((page) => page.id === summary.id),
    open = cultureOpen(save, summary)
  const step = replay ?? save.cultureJourney?.[summary.id] ?? 0
  const task = useRef<HTMLDivElement>(null)
  useEffect(() => {
    task.current?.focus({ preventScroll: true })
  }, [summary.id, step, page?.id])
  const encounter = page?.steps[step],
    choice = feedback === null ? null : encounter?.choices[feedback]
  const next = () => {
    if (replay !== null) {
      setReplay(replay + 1)
      setFeedback(null)
      return
    }
    if (advance(summary.id, step)) {
      setFeedback(null)
      setFailed(false)
    } else setFailed(true)
  }
  return (
    <section className="culture-journey">
      <h3>Cùng người giữ nghề</h3>
      <p>
        9 chặng ·{" "}
        {Object.values(save.cultureJourney ?? {}).filter((n) => n === 3).length}
        /9 trang lưu niệm. Các cuộc gặp là hư cấu, lấy cảm hứng từ đời sống và
        thực hành văn hóa Việt.
      </p>
      <div className="culture-stop-list" aria-label="Chọn chặng văn hóa">
        {CULTURAL_PAGES.map((p) => (
          <button
            type="button"
            key={p.id}
            aria-pressed={summary.id === p.id}
            onClick={() => {
              setSelected(p.id)
              setFeedback(null)
              setReplay(null)
              setFailed(false)
            }}
          >
            {save.cultureJourney?.[p.id] === 3
              ? "✓ "
              : cultureOpen(save, p)
                ? ""
                : "🔒 "}
            {p.questTitle}
          </button>
        ))}
      </div>
      {!open ? (
        <p role="status">
          Tiếp tục truyện TCG để khám phá “{summary.title}”, hoặc vượt màn đầu
          vùng {RPG_MAPS.find((map) => map.id === summary.mapId)?.name} ở Phiêu
          lưu để gặp người truyền nghề.
        </p>
      ) : error ? (
        <p role="alert">
          Chưa tải được câu chuyện.{" "}
          <button type="button" onClick={retry}>
            Thử lại
          </button>
        </p>
      ) : !page ? (
        <p role="status">Đang mở câu chuyện…</p>
      ) : (
        <article className="culture-encounter" key={summary.id}>
          <img
            src={STORY_ART[summary.art].src}
            alt={STORY_ART[summary.art].alt}
            loading="lazy"
            width="1280"
            height="720"
          />
          <small>{page.region}</small>
          <h4>{page.questTitle}</h4>
          <p>
            <b>Người đồng hành:</b> {page.teacher}
            <br />
            <b>Bên bếp:</b> {page.dish}
          </p>
          <p>{page.opening}</p>
          {encounter ? (
            <div ref={task} tabIndex={-1} className="culture-task">
              <strong>Bước {step + 1}/3</strong>
              <p>{encounter.prompt}</p>
              <div className="culture-options">
                {encounter.choices.map((c, i) => (
                  <button
                    type="button"
                    key={c.label}
                    aria-pressed={feedback === i}
                    onClick={() => {
                      setFeedback(i)
                      setFailed(false)
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {choice && (
                <div role="status">
                  <p>{choice.reply}</p>
                  {choice.advance ? (
                    <button type="button" onClick={next}>
                      {step === 2
                        ? "Ghi vào sổ lưu niệm"
                        : "Tiếp tục cùng người hướng dẫn →"}
                    </button>
                  ) : (
                    <p>Hãy thử một cách khác.</p>
                  )}
                </div>
              )}
              {failed && (
                <p role="alert">
                  Chưa lưu được bước này. Hãy kiểm tra bộ nhớ trình duyệt rồi
                  thử lại.
                </p>
              )}
            </div>
          ) : (
            <div className="culture-complete" role="status">
              <strong>✓ Trang lưu niệm · {page.questTitle}</strong>
              <p>{page.ending}</p>
              <button
                type="button"
                onClick={() => {
                  setReplay(0)
                  setFeedback(null)
                }}
              >
                Trải nghiệm lại
              </button>
            </div>
          )}
          <details className="culture-facts">
            <summary>Tìm hiểu ngoài đời · Việt / English & nguồn</summary>
            <h4>{page.title}</h4>
            <p>{page.fact}</p>
            <h4 lang="en">{page.englishTitle}</h4>
            <p lang="en">{page.englishFact}</p>
            {page.sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label} ↗
              </a>
            ))}
          </details>
        </article>
      )}
    </section>
  )
}

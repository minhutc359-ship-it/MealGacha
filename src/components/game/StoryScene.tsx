import { useState } from "react"
import type { StoryLine } from "../../game/narrative"

interface Props {
  lines: StoryLine[]
  onComplete?: () => void
}
export function StoryScene({ lines, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const current = lines[index]
  const finish = () => {
    setIndex(lines.length - 1)
    onComplete?.()
  }
  return (
    <section className="tcg-scene" aria-label="Đoạn truyện">
      <div
        className="tcg-scene-progress"
        aria-label={`Đoạn ${index + 1} trên ${lines.length}`}
      >
        {lines.map((_, i) => (
          <i key={i} className={i <= index ? "active" : ""} />
        ))}
      </div>
      <div className="tcg-scene-line" key={index} aria-live="polite">
        <span className="tcg-scene-speaker">{current.speaker}</span>
        <p>{current.text}</p>
      </div>
      <div className="tcg-scene-controls">
        <button
          className="tcg-button ghost"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={!index}
        >
          ← Trước
        </button>
        {index < lines.length - 1 ? (
          <>
            <button className="tcg-button ghost" onClick={finish}>
              Đọc nhanh
            </button>
            <button
              className="tcg-button primary"
              onClick={() => {
                const next = index + 1
                setIndex(next)
                if (next === lines.length - 1) onComplete?.()
              }}
            >
              Tiếp tục →
            </button>
          </>
        ) : (
          <span>✦ Đoạn truyện đã mở</span>
        )}
      </div>
      <details className="tcg-scene-transcript">
        <summary>Xem toàn bộ lời thoại</summary>
        {lines.map((line, i) => (
          <p key={i}>
            <strong>{line.speaker}:</strong> {line.text}
          </p>
        ))}
      </details>
    </section>
  )
}

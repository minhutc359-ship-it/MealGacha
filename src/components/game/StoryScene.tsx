import { useRef, useState } from "react"
import type { StoryLine } from "../../game/narrative"
import { STORY_ART, type StoryArtId } from "../../game/storyArt"
import { storyMusic } from "../../game/audioScore"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { AudioButton, useStoryMusic } from "./GameAudio"

interface Props {
  lines: StoryLine[]
  art?: StoryArtId
  onComplete?: () => void
}

export function StoryScene({ lines, art = "lantern", onComplete }: Props) {
  const root = useRef<HTMLElement>(null)
  useStoryMusic(root, storyMusic(art))
  const [index, setIndex] = useState(0)
  const completed = useRef(false)
  const current = lines[Math.min(index, lines.length - 1)]
  const picture = STORY_ART[art]
  const complete = () => {
    if (!completed.current) {
      completed.current = true
      onComplete?.()
    }
  }
  const finish = () => {
    gameAudio.play("story-next")
    setIndex(lines.length - 1)
    complete()
  }
  if (!current) return null
  return (
    <section
      ref={root}
      className="tcg-scene is-illustrated"
      aria-label="Đoạn truyện"
    >
      <figure className="tcg-scene-art">
        <img
          src={picture.src}
          alt={picture.alt}
          width="1280"
          height="720"
          decoding="async"
        />
        <figcaption>
          <span>BÀN KÝ ỨC</span>
          {picture.title}
        </figcaption>
      </figure>
      <div className="tcg-scene-copy">
        <div
          className="tcg-scene-progress"
          aria-label={`Đoạn ${index + 1} trên ${lines.length}`}
        >
          {lines.map((_, i) => (
            <i key={i} className={i <= index ? "active" : ""} />
          ))}
        </div>
        <div
          className="tcg-scene-line"
          key={index}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="tcg-scene-speaker">{current.speaker}</span>
          <p>{current.text}</p>
        </div>
        <div className="tcg-scene-controls">
          <button
            className="tcg-button ghost"
            onClick={() => {
              gameAudio.play("story-next")
              setIndex(Math.max(0, index - 1))
            }}
            disabled={!index}
          >
            ← Trước
          </button>
          <small>
            {index + 1} / {lines.length}
          </small>
          <AudioButton label="Âm thanh cutscene" />
          {index < lines.length - 1 ? (
            <>
              <button className="tcg-button ghost" onClick={finish}>
                Đọc nhanh
              </button>
              <button
                className="tcg-button primary"
                onClick={() => {
                  gameAudio.play("story-next")
                  const next = index + 1
                  setIndex(next)
                  if (next === lines.length - 1) complete()
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
          {lines.map((item, i) => (
            <p key={i}>
              <strong>{item.speaker}:</strong> {item.text}
            </p>
          ))}
        </details>
      </div>
    </section>
  )
}

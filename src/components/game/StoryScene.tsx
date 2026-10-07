import { useRef, useState } from "react"
import type { StoryLine } from "../../game/narrative"
import { STORY_ART, type StoryArtId } from "../../game/storyArt"
import { storyMusic } from "../../game/audioScore"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { CHARACTER_ART, speakerCharacter } from "../../game/characters"
import { CharacterPortrait } from "./CharacterPortrait"
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
  const portrait = current ? speakerCharacter(current.speaker) : null
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
      className={`tcg-scene is-illustrated tcg-anime-scene ${
        portrait ? "has-speaker" : "is-narration"
      }`}
      aria-label="Đoạn truyện"
      data-beat={current.beat ?? "quiet"}
    >
      <figure
        className="tcg-scene-art"
        key={`${art}-${current.beat ?? "quiet"}`}
      >
        <img
          className="tcg-scene-backdrop"
          src={picture.src}
          alt={picture.alt}
          width="1280"
          height="720"
          decoding="async"
        />
        {portrait && (
          <div
            className={`tcg-scene-actor actor-${portrait}`}
            key={portrait}
            data-character={portrait}
          >
            <img
              src={CHARACTER_ART[portrait]}
              alt={`${current.speaker} đang nói`}
              width="640"
              height="960"
              decoding="async"
            />
          </div>
        )}
        <figcaption>
          <span>
            {portrait ? `ĐANG NÓI · ${current.speaker}` : "BÀN KÝ ỨC · LỜI DẪN"}
          </span>
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
          <div className="tcg-speaker-row">
            {portrait && <CharacterPortrait id={portrait} decorative />}
            <span className="tcg-scene-speaker">{current.speaker}</span>
          </div>
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
            <div key={i} className="tcg-transcript-line">
              {speakerCharacter(item.speaker) && (
                <CharacterPortrait
                  id={speakerCharacter(item.speaker)!}
                  decorative
                />
              )}
              <p>
                <strong>{item.speaker}:</strong> {item.text}
              </p>
            </div>
          ))}
        </details>
      </div>
    </section>
  )
}

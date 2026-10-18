import { useState } from "react"
import {
  ADVENTURE_MANGA_CHAPTERS,
  TCG_MANGA_CHAPTERS,
  tcgEndingBeat,
  unlockedAdventureManga,
  unlockedTcgManga,
  type MangaBeat,
  type MangaTrack,
} from "../../game/mangaChronicle"
import "../../game/mangaChronicle.css"

interface Props {
  track: MangaTrack
  clearedStages?: readonly string[]
  stars?: Readonly<Record<string, number>>
  choices?: Readonly<Record<string, 0 | 1>>
  storyEnding?: "remember" | "release" | null
}

export function MangaChronicle({
  track,
  clearedStages = [],
  stars = {},
  choices = {},
  storyEnding,
}: Props) {
  const chapters = track === "tcg" ? TCG_MANGA_CHAPTERS : ADVENTURE_MANGA_CHAPTERS
  const unlocked = new Set(track === "tcg" ? unlockedTcgManga(clearedStages) : unlockedAdventureManga(stars))
  const [page, setPage] = useState("cover")
  const chapter = chapters.find((item) => item.id === page)
  const availableBeats: MangaBeat[] = chapter ? [...chapter.beats] : []
  if (track === "adventure" && chapter?.choices && choices[chapter.id] !== undefined)
    availableBeats.push(chapter.choices[choices[chapter.id]])
  if (track === "tcg" && chapter?.id === "last-table") {
    const ending = tcgEndingBeat(storyEnding)
    if (ending) availableBeats.push(ending)
  }
  const cover = `/assets/manga5915/${track}/cover.webp`
  return (
    <section className={`manga-chronicle manga-${track}`}>
      <header className="manga-heading">
        <div>
          <small>{track === "tcg" ? "TẬP I · BÀN KÝ ỨC" : "TẬP II · TÁM HƯƠNG ẤN"}</small>
          <h1>{track === "tcg" ? "Bữa cơm còn một ghế" : "Con đường của Vân"}</h1>
          <p>Hạ boss cuối chương để mở trang kế tiếp.</p>
        </div>
      </header>

      <nav className="manga-shelf">
        <button type="button" className={page === "cover" ? "is-active" : ""} onClick={() => setPage("cover")}>
          <span>BÌA</span><b>Khởi hành</b><small>Luôn mở</small>
        </button>
        {chapters.map((item, index) => {
          const open = unlocked.has(item.id)
          return <button type="button" key={item.id} disabled={!open} className={page === item.id ? "is-active" : ""}
            onClick={() => setPage(item.id)}>
            <span>{open ? `TRANG ${index + 1}` : "🔒 KHÓA"}</span>
            <b>{open ? item.title : `Chương ${index + 1}`}</b>
            <small>{open ? "Đã mở" : "Vượt boss để mở"}</small>
          </button>
        })}
      </nav>

      {page === "cover" ? (
        <article className="manga-reader is-cover">
          <figure><img src={cover} alt="Bìa manga" width="1086" height="1448" /></figure>
        </article>
      ) : chapter && unlocked.has(chapter.id) ? (
        <article className="manga-reader">
          <figure>
            <img src={chapter.image} alt={chapter.title} width="1086" height="1448" loading="lazy" />
          </figure>
          <div className="manga-copy">
            <small>CHƯƠNG {chapters.indexOf(chapter) + 1}</small>
            <h2>{chapter.title}</h2>
            <p>{chapter.hook}</p>
            <section className="manga-script">
              {availableBeats.map((item, beatIndex) => <details key={`${item.title}-${beatIndex}`} open={beatIndex === 0}>
                <summary>{beatIndex + 1}. {item.title}</summary>
                {item.lines.map((line, lineIndex) => <blockquote key={`${line.speaker}-${lineIndex}`}>
                  <strong>{line.speaker}</strong><p>{line.text}</p>
                </blockquote>)}
              </details>)}
            </section>
          </div>
        </article>
      ) : null}
    </section>
  )
}

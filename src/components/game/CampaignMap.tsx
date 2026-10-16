import { CHAPTERS, isStageUnlocked } from "../../game/story"
import { SCHOOLS } from "../../game/catalog"
import "./campaignMap.css"

const MEMORY_STOPS = [
  { left: "19%", top: "22%" },
  { left: "18%", top: "76%" },
  { left: "49%", top: "40%" },
  { left: "62%", top: "76%" },
  { left: "79%", top: "44%" },
  { left: "81%", top: "17%" },
]
const LIVING_STOPS = [
  { left: "17%", top: "69%" },
  { left: "32%", top: "31%" },
  { left: "52%", top: "68%" },
  { left: "68%", top: "35%" },
  { left: "83%", top: "67%" },
  { left: "87%", top: "22%" },
]
const MEMORY_ROUTE =
  "M190 220 C105 385 105 600 180 760 C285 760 385 575 490 400 C565 465 625 610 620 760 C705 720 765 580 790 440 C825 335 830 235 810 170"
const LIVING_ROUTE =
  "M170 690 C175 470 245 335 320 310 C410 275 430 610 520 680 C610 735 605 390 680 350 C760 305 760 650 830 670 C900 665 890 360 870 220"

type Props = {
  region: number
  onRegion: (region: number) => void
  selected: number
  onChapter: (index: number) => void
  cleared: string[]
  ending?: "remember" | "release" | null
}

export function CampaignMap({
  region,
  onRegion,
  selected,
  onChapter,
  cleared,
  ending,
}: Props) {
  const start = region * 6
  const stops = region === 1 ? LIVING_STOPS : MEMORY_STOPS
  const route = region === 1 ? LIVING_ROUTE : MEMORY_ROUTE
  const stages = CHAPTERS.slice(start, start + 6).flatMap(
    (chapter) => chapter.stages,
  )
  const progress = stages.length
    ? (stages.filter((stage) => cleared.includes(stage.id)).length /
        stages.length) *
      100
    : 0
  return (
    <>
      <div
        className="tcg-map-regions"
        role="group"
        aria-label="Chọn miền bản đồ"
      >
        <button
          type="button"
          aria-pressed={region === 0}
          onClick={() => onRegion(0)}
        >
          Miền ký ức · 01–06
        </button>
        <button
          type="button"
          aria-pressed={region === 1}
          onClick={() => onRegion(1)}
        >
          Chợ Sống · 07–12
        </button>
      </div>
      <div
        className={`tcg-world-map ${region === 1 ? "tcg-living-map" : ""}`}
        aria-label={
          region === 0 ? "Bản đồ chương 1 đến 6" : "Bản đồ chương 7 đến 12"
        }
      >
        <img
          className="tcg-world-map-art"
          src={
            region === 0
              ? "/assets/tcg/map/meal-world-map.webp"
              : "/assets/tcg/map/living-world-v582.webp"
          }
          alt=""
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
          <path className="tcg-route-underlay" pathLength="100" d={route} />
          <path
            className="tcg-route-progress"
            pathLength="100"
            d={route}
            style={{
              strokeDasharray: `${
                region === 1 ? progress * 0.5 : progress
              } 100`,
            }}
          />
        </svg>
        {stops.map((style, offset) => {
          const index = start + offset
          const chapter = CHAPTERS[index]
          const unlocked =
            !!chapter && isStageUnlocked(chapter.stages[0].id, cleared, ending)
          const count =
            chapter?.stages.filter((stage) => cleared.includes(stage.id))
              .length ?? 0
          const complete = !!chapter && count === chapter.stages.length
          return (
            <button
              type="button"
              key={index}
              style={style}
              className={`tcg-map-stop ${
                !chapter
                  ? "is-coming-soon"
                  : complete
                    ? "is-complete"
                    : unlocked
                      ? "is-current"
                      : "is-locked"
              }`}
              disabled={!unlocked}
              aria-current={selected === index ? "location" : undefined}
              aria-label={
                !chapter
                  ? `Chương ${index + 1}: Coming soon`
                  : `Đến chương ${index + 1}: ${chapter.title}, ${
                      unlocked
                        ? `${count}/${chapter.stages.length} chặng đã vượt qua`
                        : "chưa mở"
                    }`
              }
              onClick={() => {
                if (unlocked) onChapter(index)
              }}
            >
              <span className="tcg-map-pin">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="tcg-map-stop-label">
                <small>CHƯƠNG {String(index + 1).padStart(2, "0")}</small>
                <strong>{!chapter ? "Coming soon" : chapter.title}</strong>
              </span>
            </button>
          )
        })}
      </div>
      <div className="tcg-map-chapter-list" aria-label="Các chương trong miền">
        {stops.map((_, offset) => {
          const index = start + offset, chapter = CHAPTERS[index]
          const unlocked = !!chapter && isStageUnlocked(chapter.stages[0].id, cleared, ending)
          const count = chapter?.stages.filter(stage => cleared.includes(stage.id)).length ?? 0
          return <button type="button" key={index} disabled={!unlocked}
            aria-current={selected === index ? "location" : undefined}
            className={chapter ? "" : "is-coming-soon"}
            onClick={() => onChapter(index)}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <span><strong>{chapter?.title ?? "Sắp ra mắt"}</strong>
              <small>{chapter ? `${SCHOOLS[chapter.school].name} · ${unlocked ? `${count}/${chapter.stages.length} chặng` : "Chưa mở"}` : "Vùng đất chưa khám phá"}</small></span>
          </button>
        })}
      </div>
    </>
  )
}

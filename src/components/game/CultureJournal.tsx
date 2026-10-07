import { useState } from "react"
import {
  CULTURAL_PAGES,
  discoveredCulture,
  type CulturalPage,
} from "../../game/culture"
import { STORY_ART } from "../../game/storyArt"
import { useGameStore } from "../../game/useGameStore"

export function CultureJournal() {
  const cleared = useGameStore((s) => s.save.clearedStages)
  const [english, setEnglish] = useState(false)
  const [copyStatus, setCopyStatus] = useState("")
  const discovered = discoveredCulture(cleared)
  const openIds = new Set(discovered.map((page) => page.id))
  const copyIntroduction = async (page: CulturalPage) => {
    const text = [
      english ? page.englishTitle : page.title,
      english ? page.englishFact : page.fact,
      ...page.sources.map((source) => `${source.label}: ${source.url}`),
      `MealGacha · ${window.location.origin}/?tab=story`,
    ].join("\n\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus(page.id)
    } catch {
      setCopyStatus(`error:${page.id}`)
    }
  }
  return (
    <section
      className="tcg-culture-journal tcg-panel"
      aria-labelledby="culture-title"
    >
      <span className="tcg-kicker">
        HƯƠNG VỊ GIỮ NGƯỜI · VĂN HÓA ĐƯỢC TRAO TRUYỀN
      </span>
      <div className="tcg-culture-heading">
        <h2 id="culture-title">Sổ hành trình Việt Nam</h2>
        <span>
          {discovered.length}/{CULTURAL_PAGES.length} trang
        </span>
      </div>
      <p>
        Thành phố, nhân vật, trận lũ và phép thuật là hư cấu. Những trang mở
        trên đường đi giới thiệu các thực hành văn hóa có thật, cùng người gìn
        giữ chúng. Mỗi cộng đồng có cách thực hành riêng; sáu trang này là lời
        mời khám phá thêm.
      </p>
      <details className="tcg-culture-pages">
        <summary>Mở sổ văn hóa · {discovered.length} trang đã khám phá</summary>
        <div
          className="tcg-culture-language"
          role="group"
          aria-label="Ngôn ngữ giới thiệu văn hóa"
        >
          <button
            type="button"
            aria-pressed={!english}
            onClick={() => setEnglish(false)}
          >
            Tiếng Việt
          </button>
          <button
            type="button"
            aria-pressed={english}
            onClick={() => setEnglish(true)}
          >
            English
          </button>
        </div>
        <p className="tcg-culture-guide" lang={english ? "en" : "vi"}>
          {english
            ? "These cultural notes introduce living Vietnamese traditions. The city, characters, flood and magic are fictional. Illustrations are fantasy interpretations. Follow the official sources to learn more about the communities behind each practice."
            : "Đọc ký ức trong truyện rồi tìm hiểu nét văn hóa ngoài đời. Minh họa mang phong cách kỳ ảo. Nguồn chính thức ở cuối mỗi trang giúp bạn tìm hiểu thêm."}
        </p>
        <div className="tcg-culture-grid">
          {CULTURAL_PAGES.map((page, index) =>
            openIds.has(page.id) ? (
              <article
                key={page.id}
                className="tcg-culture-page"
                data-culture-id={page.id}
              >
                <img
                  src={STORY_ART[page.art].src}
                  alt={STORY_ART[page.art].alt}
                  width="1280"
                  height="720"
                  loading="lazy"
                />
                <div className="tcg-culture-page-copy">
                  <span className="tcg-kicker" lang={english ? "en" : "vi"}>
                    {english ? page.englishRegion : page.region}
                  </span>
                  <h3 lang={english ? "en" : "vi"}>
                    {english ? page.englishTitle : page.title}
                  </h3>
                  {!english && (
                    <blockquote>
                      <b>Ký ức trong truyện</b>
                      <p>{page.memory}</p>
                    </blockquote>
                  )}
                  <h4 lang={english ? "en" : "vi"}>
                    {english ? "In Vietnam" : "Ngoài đời Việt Nam"}
                  </h4>
                  <p lang={english ? "en" : "vi"}>
                    {english ? page.englishFact : page.fact}
                  </p>
                  <div
                    className="tcg-culture-sources"
                    aria-label={
                      english ? "Official sources" : "Nguồn chính thức"
                    }
                  >
                    {page.sources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.label} ↗
                      </a>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="tcg-culture-copy"
                    onClick={() => void copyIntroduction(page)}
                  >
                    {english ? "Copy introduction" : "Sao chép giới thiệu"}
                  </button>
                  {(copyStatus === page.id ||
                    copyStatus === `error:${page.id}`) && (
                    <p
                      className="tcg-culture-copy-status"
                      role="status"
                      lang={english ? "en" : "vi"}
                    >
                      {copyStatus === page.id
                        ? english
                          ? "Copied with official sources. Ready to share."
                          : "Đã sao chép kèm nguồn. Bạn có thể chia sẻ."
                        : english
                          ? "Clipboard unavailable. You can select and copy the text above."
                          : "Chưa sao chép được. Bạn có thể chọn và sao chép đoạn giới thiệu phía trên."}
                    </p>
                  )}
                </div>
              </article>
            ) : (
              <article key={page.id} className="tcg-culture-sealed">
                <span className="tcg-kicker">TRANG 0{index + 1} · CHƯA MỞ</span>
                <h3>Một cuộc gặp đang chờ</h3>
                <p>
                  Tiếp tục chương {index + 1} để khám phá. Tiến trình đã chơi tự
                  mở các trang tương ứng.
                </p>
              </article>
            ),
          )}
        </div>
      </details>
    </section>
  )
}

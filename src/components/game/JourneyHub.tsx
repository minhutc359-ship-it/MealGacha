import { useState } from "react"
import { useGameStore } from "../../game/useGameStore"
import { NPC_NAMES } from "../../game/characters"
import {
  SIDE_QUESTS,
  SIDE_QUEST_MAP,
  emptyWeekly,
  sideQuestUnlocked,
  weeklyChallenge,
} from "../../game/journeys"
import { STAGE_MAP } from "../../game/story"
import { activeRun } from "../../game/expedition"
import { CARD_MAP } from "../../game/catalog"
import type { NpcId } from "../../game/types"
import { CharacterPortrait } from "./CharacterPortrait"
import { StoryScene } from "./StoryScene"
import { GameCardView } from "./GameCardView"
import { Dialog } from "./Dialog"
export function JourneyHub() {
  const save = useGameStore((s) => s.save)
  const [questId, setQuestId] = useState<NpcId | null>(null),
    [read, setRead] = useState(false),
    [choice, setChoice] = useState<"share" | "listen">("share"),
    [deckOpen, setDeckOpen] = useState(false)
  const [section, setSection] = useState<"friends" | "weekly">("friends")
  const [friend, setFriend] = useState<NpcId>(save.companion ?? "bach")
  const challenge = weeklyChallenge(),
    record = save.weeklyRecords?.[challenge.week] ?? emptyWeekly()
  const blocked = activeRun(save.expedition),
    quest = questId ? SIDE_QUEST_MAP[questId] : null
  return (
    <section className="tcg-journey-screen">
      <div className="tcg-section-heading">
        <div>
          <span className="tcg-kicker">BÀN ĂN CẦN NHỮNG NGƯỜI CÙNG NGỒI</span>
          <h1>Lời hứa bên bếp</h1>
          <p>
            Những câu chuyện nhỏ mở theo chiến dịch. Lựa chọn của bạn quyết định
            cách người bạn ấy trợ chiến ở lượt 3.
          </p>
        </div>
      </div>
      <div
        className="tcg-segmented"
        role="group"
        aria-label="Hoạt động bên bếp"
      >
        <button
          aria-pressed={section === "friends"}
          onClick={() => setSection("friends")}
        >
          Người đồng hành
        </button>
        <button
          aria-pressed={section === "weekly"}
          onClick={() => setSection("weekly")}
        >
          Thử thách tuần
        </button>
      </div>
      {blocked && (
        <p className="tcg-info-strip">
          Hãy kết thúc chuyến thám hiểm để bắt đầu truyện phụ hoặc thử thách
          tuần.
        </p>
      )}
      {section === "weekly" && (
        <section className="tcg-panel tcg-weekly">
          <div>
            <span className="tcg-kicker">
              THỬ THÁCH TUẦN · {challenge.week}
            </span>
            <h2>{challenge.title}</h2>
            <p>
              Ba trận, một bộ bài cho mọi người. Cùng tuần có cùng cách xáo bài;
              quyết định của bạn tạo ra kết quả khác nhau.
            </p>
            <p>
              Điểm mỗi trận: 100 + ý chí còn lại ×3 − lượt ×4 + combo ×15 (tối
              thiểu 10). Thua bắt đầu lại chuỗi.
            </p>
            <div className="tcg-weekly-steps">
              {challenge.stages.map((s, i) => (
                <span
                  key={s}
                  className={
                    i < record.stage
                      ? "done"
                      : i === record.stage
                        ? "current"
                        : ""
                  }
                >
                  {i < record.stage ? "✓" : i + 1} · {s}
                </span>
              ))}
            </div>
            <p>
              Điểm chuỗi: <strong>{record.score}</strong> · Kỷ lục trên thiết
              bị: <strong>{record.best}</strong> · Hoàn thành{" "}
              {record.completions} lần
            </p>
            <p>
              {record.claimed
                ? "Đã nhận quà tuần. Chơi lại để cải thiện kỷ lục."
                : "Quà hoàn thành lần đầu trong tuần: 150 xu · 30 tinh chất · 40 XP · 1 vé."}
            </p>
            <div className="tcg-dialog-actions">
              <button
                className="tcg-button gold"
                disabled={blocked}
                onClick={() => useGameStore.getState().startWeekly()}
              >
                {record.stage
                  ? `Tiếp chặng ${record.stage + 1}/3`
                  : "Bắt đầu thử thách"}{" "}
                →
              </button>
              <button
                className="tcg-button ghost"
                onClick={() => setDeckOpen(true)}
              >
                Xem bộ bài tuần
              </button>
            </div>
          </div>
          <CharacterPortrait id="hero" />
        </section>
      )}
      {section === "friends" && (
        <>
          <div className="tcg-companion-heading">
            <h2>Người đồng hành</h2>
            <p>
              Đang mời:{" "}
              <strong>
                {save.companion ? NPC_NAMES[save.companion] : "Tự giữ bàn"}
              </strong>
            </p>
            {save.companion && (
              <button
                className="tcg-button ghost"
                onClick={() => useGameStore.getState().equipCompanion(null)}
              >
                Đi một mình
              </button>
            )}
          </div>
          <div
            className="tcg-friend-picker"
            role="group"
            aria-label="Chọn người đồng hành"
          >
            {SIDE_QUESTS.map((q) => (
              <button
                key={q.id}
                aria-pressed={friend === q.id}
                onClick={() => setFriend(q.id)}
              >
                <CharacterPortrait id={q.id} decorative />
                <span>{NPC_NAMES[q.id]}</span>
              </button>
            ))}
          </div>
          <div className="tcg-companion-grid">
            {SIDE_QUESTS.filter((q) => q.id === friend).map((q) => {
              const unlocked = sideQuestUnlocked(save, q.id),
                bond = save.bonds?.[q.id]
              return (
                <article
                  className={`tcg-panel tcg-companion-card ${
                    unlocked ? "" : "is-locked"
                  }`}
                  key={q.id}
                >
                  <CharacterPortrait id={q.id} />
                  <div>
                    <span className="tcg-kicker">
                      {NPC_NAMES[q.id]} ·{" "}
                      {bond?.completed
                        ? "ĐÃ GIỮ LỜI HỨA"
                        : unlocked
                          ? "CÂU CHUYỆN ĐÃ MỞ"
                          : "CHƯA GẶP"}
                    </span>
                    <h3>{q.title}</h3>
                    <p>
                      {unlocked
                        ? q.intro[0].text
                        : `Gặp sau màn ${STAGE_MAP[q.unlock]?.title ?? q.unlock}.`}
                    </p>
                    {bond?.completed && (
                      <small>
                        {q[bond.choice].detail.split(". ").slice(1).join(". ")}
                      </small>
                    )}
                    <div className="tcg-dialog-actions">
                      <button
                        className="tcg-button ghost"
                        disabled={!unlocked || blocked}
                        onClick={() => {
                          setQuestId(q.id)
                          setRead(false)
                          setChoice(bond?.choice ?? "share")
                        }}
                      >
                        {bond?.completed
                          ? "Đọc & chơi lại"
                          : "Ngồi lại nghe chuyện"}
                      </button>
                      {bond?.completed && (
                        <button
                          className={`tcg-button ${
                            save.companion === q.id ? "primary" : "gold"
                          }`}
                          disabled={save.companion === q.id}
                          onClick={() =>
                            useGameStore.getState().equipCompanion(q.id)
                          }
                        >
                          {save.companion === q.id
                            ? "Đang đồng hành"
                            : "Mời trợ chiến"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
      {quest && (
        <Dialog
          title={`${NPC_NAMES[quest.id]} · ${quest.title}`}
          onClose={() => setQuestId(null)}
          wide
        >
          <StoryScene
            key={quest.id}
            art={quest.art}
            lines={quest.intro}
            onComplete={() => setRead(true)}
          />
          <div className="tcg-choice-row tcg-npc-choices">
            {(["share", "listen"] as const).map((id) => (
              <button
                key={id}
                className={choice === id ? "active" : ""}
                aria-pressed={choice === id}
                onClick={() => setChoice(id)}
              >
                <strong>{quest[id].label}</strong>
                <small>{quest[id].detail}</small>
              </button>
            ))}
          </div>
          <p>
            Thắng để giữ lời hứa và mở trợ chiến. Quà lần đầu: 80 xu · 15 tinh
            chất · 40 XP. Chơi lại để đổi cách trợ chiến; không nhận lại quà.
          </p>
          <button
            className="tcg-button primary"
            disabled={!read || blocked}
            onClick={() => {
              if (useGameStore.getState().startSideQuest(quest.id, choice))
                setQuestId(null)
            }}
          >
            Bước vào Bàn Ký Ức →
          </button>
        </Dialog>
      )}
      {deckOpen && (
        <Dialog
          title="Bộ bài tuần · 18 lá cố định"
          onClose={() => setDeckOpen(false)}
          wide
        >
          <p>
            Bạn được mượn bộ này, không cần sở hữu các thẻ. Mọi thẻ và sức mạnh
            giữ nguyên giữa ba chặng; mỗi trận bắt đầu với ý chí đầy.
          </p>
          <div className="tcg-card-grid">
            {[...new Set(challenge.deck)].map((id) => (
              <GameCardView
                key={id}
                card={CARD_MAP[id]}
                compact
                count={challenge.deck.filter((c) => c === id).length}
              />
            ))}
          </div>
        </Dialog>
      )}
    </section>
  )
}

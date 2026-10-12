import { useCallback, useEffect, useState } from "react"
import { BrandMark } from "../components/layout/BrandMark"
import { ModeSwitch } from "../components/layout/ModeSwitch"
import { ModeIntroButton } from "../components/layout/ModeIntroButton"
import {
  AudioButton,
  useGameAudio,
  useGameMusic,
} from "../components/game/GameAudio"
import { useGameStore } from "../game/useGameStore"
import { useAppStore } from "../store/useAppStore"
import { CARD_MAP, SCHOOLS } from "../game/catalog"
import {
  ADVENTURE_AREAS,
  ADVENTURE_AREA_MAP,
  ADVENTURE_STARTERS,
  ADVENTURE_SHOP,
  newAdventure,
  spiritMaxHp,
  xpForNext,
  type AdventureAction,
  type AdventureDirection,
  type AdventureSpirit,
} from "../game/adventure"
import { ADVENTURE_MAP_BY_ID } from "../game/adventureWorld"
import { skillsFor, STATUS_NAMES } from "../game/adventureSkills"
import {
  AdventureBattle,
  AdventureDialog,
  AdventureMeter,
  SchoolChart,
} from "../components/game/AdventureBattle"
import { AdventureWorld } from "../components/game/AdventureWorld"
import { SpiritSprite } from "../components/game/AdventureArt"
import { gameAudio } from "../infrastructure/audio/gameAudio"
import "../game/characterMotion.css"
import "../game/adventure.css"
import "../game/adventure460.css"

function SpiritImage({ cardId }: { cardId: string }) {
  const card = CARD_MAP[cardId]
  return (
    <img
      src={card.art}
      alt={card.name}
      width="320"
      height="220"
      loading="lazy"
      decoding="async"
    />
  )
}
function StarterChoice({ choose }: { choose: (id: string) => void }) {
  return (
    <main className="adv-starter">
      <div className="adv-starter-art">
        <img
          src="/assets/tcg/map/meal-world-map.webp"
          alt="Thế giới Soul of Meal"
        />
      </div>
      <section>
        <span className="adv-kicker">CHUYẾN PHIÊU LƯU ĐẦU TIÊN</span>
        <h1>
          Một món ăn.
          <br />
          Một người bạn.
          <br />
          Cả thế giới đang chờ.
        </h1>
        <p>
          Chọn Vị Linh đi theo bạn qua năm vùng đất. Khám phá những ngôi nhà,
          gặp người giữ ký ức và thu thập Giao Ước Năm Vị.
        </p>
        <div className="adv-starter-grid">
          {ADVENTURE_STARTERS.map((id) => (
            <button
              type="button"
              key={id}
              className={`school-${CARD_MAP[id].school}`}
              onClick={() => choose(id)}
            >
              <SpiritImage cardId={id} />
              <span>{SCHOOLS[CARD_MAP[id].school].name}</span>
              <strong>{CARD_MAP[id].name}</strong>
              <small>{CARD_MAP[id].lore.split(".")[0]}.</small>
              <b>Chọn đồng hành →</b>
            </button>
          ))}
        </div>
        <div className="adv-rules-strip">
          <span>20 bản đồ</span>
          <span>6 Vị Linh trong đội</span>
          <span>Nhà · NPC · cửa hàng</span>
          <span>PP · trạng thái · tương khắc</span>
        </div>
        <details className="adv-help">
          <summary>Hướng dẫn chơi</summary>
          <p>
            WASD / mũi tên để đi, E tương tác với NPC và cửa nhà. Đổi Vị Linh,
            chọn kỹ năng theo hệ và nhìn HP/PP trong trận.
          </p>
          <ModeIntroButton mode="adventure" />
        </details>
      </section>
    </main>
  )
}
function SpiritRow({
  member,
  active,
  storage,
  act,
}: {
  member: AdventureSpirit
  active?: boolean
  storage?: "team" | "reserve"
  act: (action: AdventureAction) => void
}) {
  const card = CARD_MAP[member.cardId],
    max = spiritMaxHp(member.cardId, member.level)
  return (
    <article
      className={`adv-spirit-row school-${card.school} ${
        active ? "is-active" : ""
      }`}
    >
      <div className="adv-spirit-summary">
        <SpiritSprite cardId={member.cardId} quiet lazy />
        <div>
          <strong>{card.name}</strong>
          <small>
            Cấp {member.level} · {SCHOOLS[card.school].name}
            {member.status && ` · ${STATUS_NAMES[member.status]}`}
          </small>
          <AdventureMeter
            value={member.hp}
            max={max}
            label={`HP ${card.name}`}
          />
          <small>
            {member.hp}/{max} HP · {member.xp}/{xpForNext(member.level)} KN
          </small>
        </div>
      </div>
      <details>
        <summary>Kỹ năng và vật phẩm</summary>
        <div className="adv-member-skills">
          {skillsFor(member.cardId, member.level).map((skill) => (
            <p key={skill.id} title={skill.description}>
              <span>{skill.name}</span>
              <b>
                {member.pp?.[skill.id] ?? 0}/{skill.pp} PP
              </b>
            </p>
          ))}
        </div>
        <div className="adv-row-actions">
          {storage !== "reserve" && (
            <>
              <button
                type="button"
                disabled={active || !member.hp}
                onClick={() => act({ type: "lead", uid: member.uid })}
              >
                Dẫn đội
              </button>
              <button
                type="button"
                onClick={() =>
                  act({ type: "item", item: "potion", uid: member.uid })
                }
              >
                Canh Ấm
              </button>
              <button
                type="button"
                onClick={() =>
                  act({ type: "item", item: "revive", uid: member.uid })
                }
              >
                Lá Tỉnh
              </button>
            </>
          )}
          {storage && (
            <button
              type="button"
              onClick={() =>
                act({
                  type: storage === "team" ? "deposit" : "withdraw",
                  uid: member.uid,
                })
              }
            >
              {storage === "team" ? "Gửi vào tủ" : "Nhận vào đội"}
            </button>
          )}
        </div>
      </details>
    </article>
  )
}
export function AdventurePage() {
  useGameAudio()
  const raw = useGameStore((state) => state.save.adventure),
    save = raw ?? newAdventure()
  const dispatch = useGameStore((state) => state.adventureAction),
    notice = useGameStore((state) => state.notice),
    dismissNotice = useGameStore((state) => state.dismiss)
  const prefs = useAppStore((state) => state.user.preferences)
  const [panel, setPanel] =
    useState<"menu" | "journey" | "team" | "archive" | "help" | null>(null)
  const area = ADVENTURE_AREA_MAP[save.areaId],
    map = ADVENTURE_MAP_BY_ID[save.mapId]
  useGameMusic(
    save.encounter
      ? save.encounter.kind === "keeper"
        ? "boss"
        : "battle"
      : area.music,
    8,
  )
  const act = useCallback(
    (action: AdventureAction) => {
      const before = useGameStore.getState().save.adventure
      if (!dispatch(action)) return false
      const after = useGameStore.getState().save.adventure
      if (before?.encounter && !after?.encounter)
        gameAudio.play(
          after?.mapId.endsWith(":clinic")
            ? "defeat"
            : action.type === "battle" && action.move === "befriend"
              ? "capture"
              : action.type === "battle" && action.move === "flee"
                ? "vanish"
                : "victory",
        )
      else if (action.type === "battle")
        gameAudio.play(
          action.move === "skill" || action.move === "strike"
            ? "cast"
            : action.move === "guard"
              ? "shield"
              : "select",
        )
      else if (action.type !== "move" && before?.mapId === after?.mapId)
        gameAudio.play(
          action.type === "heal" || action.type === "item" ? "heal" : "select",
        )
      return true
    },
    [dispatch],
  )
  const move = useCallback(
    (direction: AdventureDirection) => act({ type: "move", direction }),
    [act],
  )
  const interact = useCallback(
    () =>
      act({
        type: useGameStore.getState().save.adventure?.message
          ? "dismiss"
          : "interact",
      }),
    [act],
  )
  const openMenu = useCallback(() => setPanel("menu"), [])
  useEffect(() => {
    document.body.classList.add("adventure-open")
    return () => document.body.classList.remove("adventure-open")
  }, [])
  useEffect(() => {
    if (save.service === "storage") setPanel("team")
  }, [save.service])
  const closePanel = () => {
    setPanel(null)
    if (save.service === "storage") act({ type: "dismiss" })
  }
  const allSpecies = [
    ...new Set([
      ...ADVENTURE_STARTERS,
      ...ADVENTURE_AREAS.flatMap((zone) => [
        ...zone.encounters,
        zone.keeper.cardId,
      ]),
    ]),
  ]
  return (
    <div
      className={`adv-app ${prefs.reducedMotion ? "is-reduced-motion" : ""}`}
    >
      <header className="adv-header">
        <a href="/adventure" className="adv-brand">
          <BrandMark />
          <span>
            <strong>SOUL OF MEAL</strong>
            <small>PHIÊU LƯU VỊ LINH</small>
          </span>
        </a>
        {save.started && (
          <>
            <div className="adv-location">
              <span>VÙNG {area.chapter} / 5</span>
              <strong>{map.name}</strong>
            </div>
            <div className="adv-resources">
              <span title="Xu">◉ {save.coins}</span>
              <span title="Hương Ấn">✦ {save.aromaSeals}</span>
              <span title="Ấn đã nhận">◇ {save.badges.length}/5</span>
            </div>
          </>
        )}
        <AudioButton label="Âm thanh" />
        <ModeSwitch mode="adventure" />
      </header>
      {!save.started ? (
        <StarterChoice choose={(cardId) => act({ type: "start", cardId })} />
      ) : (
        <>
          <nav className="adv-panel-tabs" aria-label="Bảng phiêu lưu">
            {(["journey", "team", "archive", "help"] as const).map((id) => (
              <button
                type="button"
                key={id}
                aria-pressed={panel === id}
                onClick={() =>
                  setPanel((current) => (current === id ? null : id))
                }
              >
                {id === "journey"
                  ? "Hành trình & bản đồ"
                  : id === "team"
                    ? "Đội hình & túi đồ"
                    : id === "archive"
                      ? "Sổ Vị Linh"
                      : "Hướng dẫn"}
              </button>
            ))}
          </nav>
          <main className="adv-layout">
            <section
              className="adv-world"
              inert={!!panel}
              aria-label="Khám phá thế giới"
            >
              <AdventureWorld
                save={save}
                move={move}
                interact={interact}
                onMenu={openMenu}
                readOnly={!!panel}
                paused={!!panel || !!save.encounter}
              />
            </section>
            {panel && (
              <AdventureDialog
                className="adv-panel-dialog"
                titleId="adv-panel-title"
                dismiss={closePanel}
              >
                <header className="adv-panel-heading">
                  <h2 id="adv-panel-title">
                    {panel === "menu"
                      ? "Menu phiêu lưu"
                      : panel === "team"
                        ? "Đội hình & túi đồ"
                        : panel === "journey"
                          ? "Hành trình"
                          : panel === "archive"
                            ? "Sổ Vị Linh"
                            : "Hướng dẫn chơi"}
                  </h2>
                  <button
                    type="button"
                    aria-label="Đóng bảng phiêu lưu"
                    onClick={closePanel}
                  >
                    ×
                  </button>
                </header>
                <aside className="adv-sidebar">
                  {panel === "menu" ? (
                    <div className="adv-field-menu">
                      <p>
                        Chọn việc muốn làm, hoặc đóng menu để tiếp tục hành
                        trình.
                      </p>
                      {(["team", "journey", "archive", "help"] as const).map(
                        (id) => (
                          <button
                            type="button"
                            key={id}
                            onClick={() => setPanel(id)}
                          >
                            <b>
                              {id === "team"
                                ? "Đội hình & túi đồ"
                                : id === "journey"
                                  ? "Bản đồ & mục tiêu"
                                  : id === "archive"
                                    ? "Sổ Vị Linh"
                                    : "Hướng dẫn"}
                            </b>
                            <span>
                              {id === "team"
                                ? `${save.team.length}/6 đồng hành · ${save.inventory.potion} Canh Ấm`
                                : id === "journey"
                                  ? `${save.badges.length}/5 ấn · ${map.name}`
                                  : id === "archive"
                                    ? `${save.discovered.length} loài đã gặp`
                                    : "Điều khiển, tương khắc và giới thiệu"}
                            </span>
                          </button>
                        ),
                      )}
                      <button type="button" onClick={closePanel}>
                        Tiếp tục phiêu lưu →
                      </button>
                    </div>
                  ) : panel === "help" ? (
                    <>
                      <ModeIntroButton
                        mode="adventure"
                        beforeOpen={closePanel}
                      />
                      <p>
                        Giữ D-pad hoặc WASD/mũi tên để đi liên tục. Nút Đi
                        bộ/Chạy đổi tốc độ; Shift để chạy trên bàn phím. A hoặc
                        E/Z để tương tác, X mở Menu. Khi có lời thoại, chọn Tiếp
                        tục trước khi đi. Chạm điểm, NPC hoặc nhà để tự đi tới.
                      </p>
                      <p>
                        Bếp Nghỉ hồi HP/PP và mở tủ. Tiệm Hương bán vật phẩm.
                        Nhà Ký Ức giao nhiệm vụ. Theo Hành trình để nhận đủ năm
                        ấn.
                      </p>
                      <p>
                        Trong trận, chọn kỹ năng theo tương khắc, đổi Vị Linh
                        hoặc mở Túi đồ để dùng Hương Ấn. Mỗi thao tác chiến đấu
                        cho đối thủ cơ hội phản kích.
                      </p>
                      <SchoolChart />
                    </>
                  ) : panel === "journey" ? (
                    <>
                      <span className="adv-kicker">NHIỆM VỤ CHÍNH</span>
                      <h1>{area.objective}</h1>
                      <p>{area.summary}</p>
                      <ol className="adv-route-list">
                        {ADVENTURE_AREAS.map((zone) => (
                          <li
                            key={zone.id}
                            className={zone.id === area.id ? "is-current" : ""}
                          >
                            <span>
                              {save.badges.includes(zone.keeper.badge)
                                ? "✓"
                                : zone.chapter}
                            </span>
                            <div>
                              <strong>{zone.name}</strong>
                              <small>
                                {save.badges.includes(zone.keeper.badge)
                                  ? zone.keeper.badgeName
                                  : "Chưa nhận ấn"}
                              </small>
                            </div>
                            <button
                              type="button"
                              disabled={
                                map.interior ||
                                !save.visitedMaps.includes(zone.id) ||
                                zone.id === save.areaId
                              }
                              onClick={() =>
                                act({ type: "travel", areaId: zone.id })
                              }
                            >
                              Đến
                            </button>
                          </li>
                        ))}
                      </ol>
                      <h2>Trong vùng này</h2>
                      <ul className="adv-checklist">
                        <li>
                          {save.completedQuests.includes(`talk:${area.id}`)
                            ? "✓"
                            : "○"}{" "}
                          Gặp{" "}
                          {area.npc.id === "bach"
                            ? "Bách"
                            : area.npc.id === "hai"
                              ? "Hải"
                              : area.npc.id === "moc"
                                ? "Mộc"
                                : area.npc.id === "nhien"
                                  ? "Nhiên"
                                  : "Liên"}
                        </li>
                        <li>
                          {save.defeatedTrainers.includes(`trainer:${area.id}`)
                            ? "✓"
                            : "○"}{" "}
                          Thắng Lả (2 Vị Linh)
                        </li>
                        <li>
                          {save.completedQuests.includes(`memory:${area.id}`)
                            ? "✓"
                            : "○"}{" "}
                          Kể tên {area.chapter + 2} loài tại Nhà Ký Ức
                        </li>
                        <li>
                          {save.claimedFinds.includes(area.finds[0].id)
                            ? "✓"
                            : "○"}{" "}
                          Tìm túi quà trong bãi hương
                        </li>
                      </ul>
                      {save.completed && (
                        <p className="adv-complete">
                          Giao Ước Năm Vị hoàn tất. Tiếp tục thu phục và khám
                          phá tự do.
                        </p>
                      )}
                      <SchoolChart />
                      <details className="adv-help">
                        <summary>
                          Hướng dẫn chơi · Điều khiển & địa điểm
                        </summary>
                        <ModeIntroButton
                          mode="adventure"
                          beforeOpen={closePanel}
                        />
                        <p>
                          WASD / mũi tên: di chuyển. Giữ Shift: chạy. E: tương
                          tác theo hướng nhìn. Chọn một điểm trên bản đồ để tự
                          đi đến.
                        </p>
                        <p>
                          Bếp Nghỉ: hồi HP, PP và đổi dự bị ở tủ. Tiệm Hương:
                          mua vật phẩm. Nhà Ký Ức: nhiệm vụ sưu tầm. NPC có ⚔:
                          cuộc đấu theo lượt.
                        </p>
                      </details>
                    </>
                  ) : panel === "team" ? (
                    <>
                      <span className="adv-kicker">BẠN ĐỒNG HÀNH</span>
                      <div className="adv-party-title">
                        <h1>Đội {save.team.length}/6</h1>
                        <span>Tủ {save.reserve.length}/60</span>
                      </div>
                      <div className="adv-bag-summary">
                        <span>Canh Ấm {save.inventory.potion}</span>
                        <span>Lá Tỉnh {save.inventory.revive}</span>
                      </div>
                      <p>
                        {save.service === "storage"
                          ? "Tủ đang mở: gửi và nhận Vị Linh bên dưới."
                          : "Đổi người dẫn đội hoặc dùng vật phẩm. Ghé Bếp Nghỉ để hồi PP và mở tủ dự bị."}
                      </p>
                      <div className="adv-party-list">
                        {save.team.map((member, index) => (
                          <SpiritRow
                            key={member.uid}
                            member={member}
                            active={index === 0}
                            storage={
                              save.service === "storage" ? "team" : undefined
                            }
                            act={act}
                          />
                        ))}
                      </div>
                      {save.service === "storage" && (
                        <details open className="adv-reserve">
                          <summary>
                            Tủ Vị Linh · {save.reserve.length}/60
                          </summary>
                          {save.reserve.map((member) => (
                            <SpiritRow
                              key={member.uid}
                              member={member}
                              storage="reserve"
                              act={act}
                            />
                          ))}
                          {!save.reserve.length && (
                            <p>
                              Tủ hiện trống. Vị Linh thứ 7 trở đi sẽ về đây.
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => act({ type: "dismiss" })}
                          >
                            Đóng tủ
                          </button>
                        </details>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="adv-kicker">SỔ VỊ LINH</span>
                      <h1>
                        {save.discovered.length}/{allSpecies.length} loài đã gặp
                      </h1>
                      <p>
                        {save.team.length + save.reserve.length} bạn đồng hành ·{" "}
                        {save.visitedMaps.length}/20 địa điểm đã tới
                      </p>
                      <div className="adv-codex">
                        {allSpecies.map((id) => {
                          const known = save.discovered.includes(id),
                            caught = [...save.team, ...save.reserve].some(
                              (member) => member.cardId === id,
                            )
                          return (
                            <article
                              key={id}
                              className={
                                known
                                  ? `school-${CARD_MAP[id].school}`
                                  : "is-unknown"
                              }
                            >
                              {known ? (
                                <>
                                  <SpiritSprite cardId={id} quiet lazy />
                                  <strong>{CARD_MAP[id].name}</strong>
                                  <small>
                                    {SCHOOLS[CARD_MAP[id].school].name} ·{" "}
                                    {caught ? "Đã kết bạn" : "Đã gặp"}
                                  </small>
                                </>
                              ) : (
                                <>
                                  <span>?</span>
                                  <strong>Chưa gặp</strong>
                                </>
                              )}
                            </article>
                          )
                        })}
                      </div>
                    </>
                  )}
                </aside>
              </AdventureDialog>
            )}
          </main>
        </>
      )}
      {save.service === "shop" && (
        <AdventureDialog
          className="adv-shop-dialog"
          titleId="adv-shop-title"
          dismiss={() => act({ type: "dismiss" })}
        >
          <header>
            <span className="adv-kicker">TIỆM HƯƠNG · {save.coins} XU</span>
            <h2 id="adv-shop-title">Chuẩn bị cho chuyến đi</h2>
            <button
              type="button"
              aria-label="Đóng cửa hàng"
              onClick={() => act({ type: "dismiss" })}
            >
              ×
            </button>
          </header>
          {ADVENTURE_SHOP.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                <small>
                  Đang có:{" "}
                  {item.id === "seal"
                    ? save.aromaSeals
                    : save.inventory[item.id]}
                </small>
              </div>
              <button
                type="button"
                disabled={save.coins < item.price}
                onClick={() => act({ type: "buy", item: item.id })}
              >
                Mua · {item.price} xu
              </button>
            </article>
          ))}
        </AdventureDialog>
      )}
      {notice && !save.encounter && save.service !== "shop" && (
        <div className="adv-toast" role="alert">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Đóng thông báo"
            onClick={dismissNotice}
          >
            ×
          </button>
        </div>
      )}
      {save.encounter && <AdventureBattle save={save} act={act} />}
    </div>
  )
}

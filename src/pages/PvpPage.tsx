import { useEffect, useState, useSyncExternalStore } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useGameStore } from "../game/useGameStore"
import { deckErrors } from "../game/catalog"
import { RoomSession, savedRoom } from "../game/pvp/session"
import { formatKey, normalizeKey, validKey } from "../game/pvp/peer"
import type { Profile, RoomMode } from "../game/pvp/room"
import { BattleBoardView } from "../components/game/BattleBoard"
import { PvpAutoBoard } from "../components/autochess/PvpAutoBoard"
import { CharacterPortrait } from "../components/game/CharacterPortrait"
import {
  AudioControls,
  useGameAudio,
  useGameMusic,
} from "../components/game/GameAudio"
import { Dialog } from "../components/game/Dialog"
import "../game/tcg.css"
import "../game/combat.css"
import "../game/story.css"
import "../game/livingTable.css"
import "../game/animeStage.css"
import "../game/compactScreen.css"
import "../game/spiritArena.css"
import "../game/characterMotion.css"
import "../game/autochess/autochess.css"
import "../game/autochess/marketHud.css"
import "../game/pvp/pvp.css"
export function PvpPage() {
  const [params, setParams] = useSearchParams(),
    mode: RoomMode = params.get("mode") === "auto" ? "auto" : "tcg"
  const save = useGameStore((s) => s.save),
    deck = save.decks.find((d) => d.id === save.activeDeckId) ?? save.decks[0]
  const [name, setName] = useState(() => savedRoom()?.name ?? "Người chơi"),
    [key, setKey] = useState(""),
    [notice, setNotice] = useState(""),
    [session, setSession] = useState<RoomSession | null>(null),
    [audio, setAudio] = useState(false)
  const errors = mode === "tcg" ? deckErrors(deck?.cards ?? [], save.cards) : []
  useGameAudio()
  useEffect(() => () => session?.close(), [session])
  const connect = (host: boolean, resume = false) => {
    if (!name.trim()) {
      setNotice("Hãy nhập tên hiển thị.")
      return
    }
    if (errors.length) {
      setNotice(errors[0])
      return
    }
    const old = resume ? savedRoom() : null,
      code = old?.code ?? normalizeKey(key)
    if (!host && !validKey(code)) {
      setNotice("Mã phòng gồm 16 ký tự. Bạn có thể dán cả dấu gạch nối.")
      return
    }
    const profile: Profile = {
      name: old?.name ?? name.trim(),
      deck: mode === "tcg" ? [...deck.cards] : [],
    }
    try {
      setSession(
        new RoomSession(
          mode,
          profile,
          host,
          host ? undefined : code,
          old?.token,
        ),
      )
      setNotice("")
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Chưa thể mở phòng.")
    }
  }
  return (
    <main className="pvp-screen">
      <header className="pvp-header">
        <Link to={mode === "auto" ? "/autochess" : "/"}>
          ‹ {mode === "auto" ? "Auto chess" : "TCG"}
        </Link>
        <strong>⚔ PHÒNG GIAO HỮU</strong>
        <button onClick={() => setAudio(true)} aria-label="Cài đặt âm thanh">
          ♫
        </button>
      </header>
      {session ? (
        <ConnectedRoom
          session={session}
          save={save}
          leave={() => setSession(null)}
        />
      ) : (
        <div className="pvp-lobby">
          <div className="pvp-hero">
            <CharacterPortrait id="hero" />
            <div>
              <small>HAI NGƯỜI · MỘT BÀN ĐẤU</small>
              <h1>Mời bạn cùng chơi</h1>
              <p>Thiết bị người tạo phòng giữ và điều khiển trận.</p>
            </div>
          </div>
          <div className="pvp-mode-tabs" role="group" aria-label="Chế độ PvP">
            {(["tcg", "auto"] as const).map((m) => (
              <button
                key={m}
                aria-pressed={mode === m}
                onClick={() => {
                  setParams({ mode: m })
                  setNotice("")
                }}
              >
                {m === "tcg" ? "▱ TCG" : "♟ Auto chess"}
              </button>
            ))}
          </div>
          <label>
            Tên hiển thị
            <input
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="nickname"
            />
          </label>
          <div className="pvp-rules">
            {mode === "tcg" ? (
              <>
                <b>
                  {deck?.name} · {deck?.cards.length ?? 0}/24 lá
                </b>
                <p>
                  Bàn 4 quân + 1 bẫy. Mỗi người dùng bộ đang trang bị của mình;
                  tự chọn kích hoạt hoặc giữ bẫy.
                </p>
                {errors.length > 0 && (
                  <p role="alert">
                    {errors[0]} <Link to="/?tab=decks">Sửa bộ bài →</Link>
                  </p>
                )}
              </>
            ) : (
              <>
                <b>3 vòng farm → 1 vòng PvP</b>
                <p>
                  Hai người khởi đầu như nhau với 100 ý chí. Thắng quái nhận đồ;
                  sau mỗi 3 vòng, hai đội hình đấu nhau. Cả hai cùng sẵn sàng để
                  bắt đầu.
                </p>
              </>
            )}
          </div>
          <button
            className="pvp-primary"
            disabled={!!errors.length}
            onClick={() => connect(true)}
          >
            ＋ Tạo phòng
          </button>
          <div className="pvp-join">
            <label>
              Mã phòng
              <input
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={key}
                onChange={(e) => setKey(e.target.value.slice(0, 40))}
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
            <button disabled={!!errors.length} onClick={() => connect(false)}>
              Vào phòng →
            </button>
          </div>
          {savedRoom()?.mode === mode && (
            <button onClick={() => connect(false, true)}>
              Nối lại phòng trước
            </button>
          )}
          {notice && (
            <p className="pvp-notice" role="alert">
              {notice}
            </p>
          )}
          <p className="pvp-footnote">
            Chỉ 2 người được vào. Chủ phòng giữ tab mở; đổi tab sẽ tạm dừng
            trận. Trận giao hữu có tài nguyên riêng, giữ nguyên tiến trình chơi
            đơn. Máy chủ phòng nắm toàn bộ trạng thái trận; bài và bẫy được che
            trên giao diện đối thủ.{" "}
            <Link to="/legal/privacy">Dữ liệu kết nối</Link>
          </p>
        </div>
      )}
      {audio && (
        <Dialog title="Âm thanh" onClose={() => setAudio(false)}>
          <AudioControls />
        </Dialog>
      )}
    </main>
  )
}
function ConnectedRoom({
  session,
  save,
  leave,
}: {
  session: RoomSession
  save: ReturnType<typeof useGameStore.getState>["save"]
  leave: () => void
}) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot),
    v = state.view
  const [atRoom, setAtRoom] = useState(false),
    [confirm, setConfirm] = useState(false),
    [copy, setCopy] = useState("")
  const playing =
    !!v && v.phase !== "lobby" && !atRoom && state.status !== "closed"
  useGameMusic(v?.auto?.phase === "combat" && v.auto.run.combat?.boss ? "boss" : "mode-autochess", 1)
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", prevent)
    return () => window.removeEventListener("beforeunload", prevent)
  }, [])
  useEffect(() => {
    if (v?.phase === "playing") setAtRoom(false)
  }, [v?.phase])
  const status = !v?.connected.every(Boolean)
    ? "Tạm dừng · chờ đủ hai người kết nối"
    : v.tcg?.pvp?.reactionOwner
      ? "Chờ quyết định của người có bẫy"
      : v.canAct
        ? "Lượt của bạn"
        : "Lượt của đối thủ"
  const exitGame = () => {
    if (v?.phase === "playing") session.command({ type: "surrender" })
    setAtRoom(true)
  }
  return (
    <>
      <div className="pvp-room-bar">
        <span>
          {state.host ? "Chủ phòng" : "Khách"} · {formatKey(state.code)}
        </span>
        <button onClick={() => setConfirm(true)}>Rời phòng</button>
      </div>
      {state.notice && (
        <p className="pvp-notice" role="status">
          {state.notice}
        </p>
      )}
      {state.status === "disconnected" && (
        <button className="pvp-reconnect" onClick={() => session.reconnect()}>
          Kết nối lại
        </button>
      )}
      {playing && v?.tcg ? (
        <div className="pvp-tcg">
          <BattleBoardView
            stored={v.tcg}
            presentation={v.presentation}
            storySave={save}
            ending={save.storyEnding}
            act={(action) => session.command({ type: "tcg", action })}
            leaveBattle={() => {}}
            acknowledgeScene={() => {}}
            chooseEnding={() => {}}
            onExit={exitGame}
            network={{
              locked: state.pending || !v.canAct,
              status,
              draw: v.winner === "draw",
            }}
          />
        </div>
      ) : playing && v?.auto ? (
        <>
          <PvpAutoBoard
            view={v}
            pending={state.pending}
            command={(command) => session.command(command)}
          />
          {v.phase === "finished" && (
            <Dialog
              title={
                v.winner === "draw"
                  ? "Trận hòa"
                  : v.winner === v.seat
                    ? "Bạn thắng trận"
                    : "Trận giao hữu hoàn tất"
              }
              onClose={() => setAtRoom(true)}
            >
              <p>
                Đội hình và tài nguyên trong phòng kết thúc cùng trận. Tiến
                trình chơi đơn của bạn được giữ nguyên.
              </p>
              <button onClick={() => setAtRoom(true)}>Trở về phòng</button>
            </Dialog>
          )}
        </>
      ) : (
        <div className="pvp-lobby">
          <h1>
            {state.status === "closed"
              ? "Phòng đã đóng"
              : v?.phase === "finished"
                ? "Hẹn trận tiếp theo"
                : "Phòng của hai người"}
          </h1>
          <label>
            Mã hệ thống tạo
            <input
              className="pvp-code"
              readOnly
              value={formatKey(state.code)}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(formatKey(state.code))
                setCopy("Đã sao chép")
              } catch {
                setCopy("Chạm mã để chọn và sao chép")
              }
            }}
          >
            {copy || "Sao chép mã"}
          </button>
          <div className="pvp-seats">
            {([0, 1] as const).map((seat) => (
              <article key={seat}>
                <CharacterPortrait id={seat === 0 ? "hero" : "lien"} />
                <b>{v?.names[seat] ?? "Chờ bạn vào"}</b>
                <small>
                  {v?.connected[seat]
                    ? v.ready[seat]
                      ? "✓ Sẵn sàng"
                      : "● Đã kết nối"
                    : v?.names[seat]
                      ? "Đang nối lại"
                      : "Ghế trống"}
                </small>
              </article>
            ))}
          </div>
          {v?.phase === "lobby" && (
            <button
              className="pvp-primary"
              disabled={!v.connected.every(Boolean) || state.pending}
              onClick={() =>
                session.command({ type: "ready", value: !v.ready[v.seat] })
              }
            >
              {v.ready[v.seat] ? "Hủy sẵn sàng" : "Sẵn sàng vào trận"}
            </button>
          )}
          {v?.phase === "finished" && state.host && (
            <button
              className="pvp-primary"
              onClick={() => session.command({ type: "rematch" })}
            >
              Mở trận mới
            </button>
          )}
          <p className="pvp-footnote">
            Giữ tab của chủ phòng mở. Nếu khách mất mạng, trận tạm dừng và giữ
            ghế để nối lại bằng tab này. Tải lại tab chủ phòng sẽ kết thúc
            phòng.
          </p>
          {state.status === "closed" && (
            <button onClick={leave}>Trở lại tạo / vào phòng</button>
          )}
        </div>
      )}
      {confirm && (
        <Dialog title="Rời phòng?" onClose={() => setConfirm(false)}>
          <p>
            {state.host
              ? "Rời phòng sẽ đóng trận trên cả hai thiết bị."
              : "Nếu trận đang diễn ra, rời phòng sẽ nhường trận cho đối thủ."}
          </p>
          <button
            onClick={() => {
              session.close()
              leave()
            }}
          >
            Rời phòng
          </button>
          <button onClick={() => setConfirm(false)}>Tiếp tục chơi</button>
        </Dialog>
      )}
    </>
  )
}

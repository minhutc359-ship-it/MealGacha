import { useCallback, useEffect, useRef, useState } from "react"
import { useAppStore } from "../../store/useAppStore"
import type { RoomView, RoomCommand } from "../../game/pvp/room"
import type { AutoAction } from "../../game/autochess/reducer"
import { capacity, traitCounts } from "../../game/autochess/economy"
import { UNIT_MAP } from "../../game/autochess/catalog"
import { ITEM_MAP, ITEM_RECIPES, itemPreview } from "../../game/autochess/items"
import { AutoSoundscape } from "../../game/autochess/soundscape"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { AutoBoard } from "./AutoBoard"
import { AutoPreparation } from "./AutoPreparation"
import { AutoTraits } from "./AutoTraits"
import { QuickUnitInfo } from "./QuickUnitInfo"
import { AutoPortrait } from "./AutoArt"
import { ItemArt } from "./ItemArt"
import { useFormationDrag, type PeekTarget } from "./useFormationDrag"
import { useStarUpgrades } from "./useStarUpgrades"
import { Dialog } from "../game/Dialog"
export function PvpAutoBoard({
  view,
  pending,
  command,
}: {
  view: RoomView
  pending: boolean
  command: (c: RoomCommand) => boolean
}) {
  const a = view.auto!,
    run = a.run,
    ready = a.ready[view.seat],
    online = view.connected.every(Boolean),
    preparing = a.phase === "prepare" && !ready && online && !pending
  const prefs = useAppStore((s) => s.user.preferences)
  const [selected, setSelected] = useState<string | null>(null),
    [inspect, setInspect] = useState<PeekTarget | null>(null),
    [details, setDetails] = useState<"traits" | "items" | null>(null)
  const [shopOpen, setShopOpen] = useState(true),
    [inventoryOpen, setInventoryOpen] = useState(false),
    [traitsOpen, setTraitsOpen] = useState(false)
  const frame = useRef({ run, at: performance.now(), online })
  // UI-only updates must not restart the interpolation window.
  if (frame.current.run !== run || frame.current.online !== online)
    frame.current = { run, at: performance.now(), online }
  const getFrame = useCallback(
    () => ({
      run: frame.current.run,
      alpha:
        frame.current.online && frame.current.run.phase === "combat" && !frame.current.run.paused && !frame.current.run.combat?.pendingScene
          ? Math.min(2, (performance.now() - frame.current.at) / 50)
          : 0,
    }),
    [],
  )
  const sound = useRef({ id: "", value: new AutoSoundscape() })
  useEffect(() => {
    if (!run.combat) return
    if (sound.current.id !== run.combat.id)
      sound.current = { id: run.combat.id, value: new AutoSoundscape() }
    for (const cue of sound.current.value.collect(
      run.combat.events,
      run.combat.actors,
      performance.now(),
    ))
      gameAudio.play(cue.cue, 0, cue.pan)
  }, [run.combat])
  useEffect(() => {
    if (run.lastResult)
      gameAudio.play(
        run.lastResult.result === "win" ? "auto-victory" : "auto-defeat",
      )
  }, [run.lastResult?.id])
  const upgrades = useStarUpgrades(run)
  const act = (action: AutoAction) => {
    const ok = command({ type: "auto", action })
    if (ok)
      gameAudio.play(
        action.type === "battle"
          ? "summon"
          : action.type === "move"
            ? "select"
            : action.type === "craft"
              ? "combo"
              : "confirm",
      )
    return ok
  }
  const drag = useFormationDrag({
    enabled: preparing,
    peekEnabled: true,
    onDrop: (uid, target) => {
      act({ type: "move", uid, ...target })
      setSelected(null)
    },
    onSelect: setSelected,
    onSell: (uid) => {
      act({ type: "sell", uid })
      setSelected(null)
    },
    onItemDrop: (index, target) =>
      target.kind === "equip"
        ? act({ type: "equip", uid: target.uid, item: run.inventory[index] })
        : act({ type: "craft", index, target: target.index }),
    previewItem: (index, target) => itemPreview(run, index, target),
    inspectPiece: (uid) => {
      const p = run.roster.find((p) => p.uid === uid)
      return p ? { id: p.id, uid } : null
    },
  })
  const peek = inspect ?? drag.peek,
    ghost = run.roster.find((p) => p.uid === drag.dragging)
  const click = (cell: number, _dragged?: string, keyboard?: boolean) => {
    if (drag.ignoreClick() || (!keyboard && drag.touchTap())) return
    const p = run.roster.find((p) => p.cell === cell)
    if (preparing && selected && cell >= 18) {
      act({ type: "move", uid: selected, cell })
      setSelected(null)
    } else if (p) {
      if (preparing) setSelected(p.uid === selected ? null : p.uid)
      else setInspect({ id: p.id, uid: p.uid })
    } else {
      const actor = run.combat?.actors.find((p) => p.cell === cell && p.hp > 0)
      if (actor) setInspect({ id: actor.id, uid: actor.uid })
    }
  }
  return (
    <section className="pvp-auto ac-game" aria-label="Bàn Auto chess PvP">
      <div className="pvp-auto-hud">
        <span>
          <b>{view.names[view.seat]}</b>
          <strong>♥ {run.health}</strong>
        </span>
        <span>
          <b>{view.names[view.seat === 0 ? 1 : 0]}</b>
          <strong>♥ {a.opponent.health}</strong>
        </span>
        <small>
          ◉ {run.gold} · Cấp {capacity(run.xp)}
        </small>
      </div>
      <div
        className="pvp-round-track"
        aria-label="Chu kỳ 3 vòng farm rồi 1 vòng PvP"
      >
        {["Farm 1", "Farm 2", "Farm 3", "PvP"].map((label, i) => (
          <span
            key={label}
            className={(a.round - 1) % 4 === i ? "is-current" : ""}
          >
            {label}
          </span>
        ))}
        <b>Vòng {a.round}</b>
      </div>
      <p className="pvp-auto-status" role="status">
        {!online
          ? "Tạm dừng · chờ người chơi nối lại"
          : a.phase === "combat"
            ? a.kind === "pvp"
              ? "Đối đầu đội hình người bạn"
              : "Đánh quái · thắng để nhận mảnh trang bị"
            : a.phase === "result"
              ? run.lastResult?.reason
              : ready
                ? "Đã sẵn sàng · đang chờ người bạn"
                : "Xếp đội hình, mua quân, ghép đồ rồi sẵn sàng"}
      </p>
      <div className="pvp-auto-arena">
        <AutoBoard
          run={run}
          getFrame={getFrame}
          selected={selected}
          reducedMotion={prefs.reducedMotion}
          lowQuality={prefs.graphicsQuality === "low"}
          celebrating={false}
          upgrades={upgrades}
          opponentPieces={a.kind === "pvp" ? a.opponent.roster : undefined}
          onCell={click}
          onPiecePointerDown={(uid, e) => drag.start(uid, e)}
          onInspectCell={(cell) => {
            const actor = run.combat?.actors.find(
                (u) => u.cell === cell && u.hp > 0,
              ),
              p = run.roster.find((u) => u.cell === cell)
            if (actor || p)
              setInspect({ id: (actor ?? p)!.id, uid: (actor ?? p)!.uid })
          }}
        />
      </div>
      <div className="pvp-auto-controls">
        {a.phase === "prepare" ? (
          <>
            <fieldset disabled={!preparing}>
              <AutoPreparation
                run={run}
                selected={selected}
                onSelect={setSelected}
                upgrades={upgrades}
                reducedMotion={prefs.reducedMotion}
                drag={drag}
                onAction={act}
                onInspect={setInspect}
                shopOpen={shopOpen}
                onToggleShop={() => setShopOpen(!shopOpen)}
                inventoryOpen={inventoryOpen}
                onToggleInventory={() => setInventoryOpen(!inventoryOpen)}
                onInventoryDetails={() => setDetails("items")}
                beginLabel="Sẵn sàng"
              />
            </fieldset>
            {ready && (
              <button
                disabled={pending || !online}
                onClick={() => act({ type: "battle" })}
              >
                Hủy sẵn sàng
              </button>
            )}
          </>
        ) : a.phase === "result" ? (
          <div className="pvp-auto-result">
            <strong>
              {a.kind === "pvp"
                ? a.last?.winner === "draw"
                  ? "Trận hòa"
                  : a.last?.winner === view.seat
                    ? "Bạn thắng đối đầu"
                    : "Bạn thua đối đầu"
                : run.lastResult?.result === "win"
                  ? "Thắng quái"
                  : "Quái giữ được bàn"}
            </strong>
            <p>
              +{run.lastResult?.gold} vàng ·{" "}
              {run.lastResult?.damage
                ? `−${run.lastResult.damage} ý chí`
                : "Đội hình trở lại ở vòng sau"}
            </p>
            {view.phase === "playing" && (
              <button
                disabled={pending || !online}
                onClick={() => act({ type: "next" })}
              >
                {ready ? "Hủy tiếp tục" : "Sẵn sàng vòng tiếp"}
              </button>
            )}
          </div>
        ) : (
          <div className="pvp-auto-result">
            <strong>{a.kind === "pvp" ? "⚔ Đối đầu" : "♨ Farm đồ"}</strong>
            <p>Quân chiến đấu tự động · hai người cùng theo dõi.</p>
          </div>
        )}
        <AutoTraits
          counts={traitCounts(run.roster)}
          expanded={traitsOpen}
          onToggle={() => setTraitsOpen(!traitsOpen)}
          onDetails={() => setDetails("traits")}
        />
      </div>
      {ghost && (
        <div ref={drag.ghostRef} className="ac-drag-ghost">
          <AutoPortrait index={UNIT_MAP[ghost.id].portrait} />
          <strong>{"★".repeat(ghost.star)}</strong>
        </div>
      )}
      {drag.itemIndex !== null && run.inventory[drag.itemIndex] && (
        <div ref={drag.ghostRef} className="ac-drag-ghost">
          <ItemArt id={run.inventory[drag.itemIndex]} />
        </div>
      )}
      {drag.preview && (
        <div className="ac-drop-preview">{drag.preview.text}</div>
      )}
      {peek && (
        <Dialog title="Thông tin quân" onClose={() => setInspect(null)}>
          <div className="pvp-auto-dialog">
            <QuickUnitInfo
              id={peek.id}
              piece={run.roster.find((p) => p.uid === peek.uid)}
              actor={run.combat?.actors.find((p) => p.uid === peek.uid)}
            />
            {preparing &&
              peek.uid &&
              run.roster
                .find((p) => p.uid === peek.uid)
                ?.items.map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      act({ type: "unequip", uid: peek.uid!, item })
                    }
                  >
                    Gỡ {ITEM_MAP[item].name}
                  </button>
                ))}
          </div>
        </Dialog>
      )}
      {details && (
        <Dialog
          title={details === "traits" ? "Tộc và nghề" : "Ghép và trao trang bị"}
          onClose={() => setDetails(null)}
        >
          <div className="pvp-auto-dialog">
            {details === "traits" ? (
              <AutoTraits
                counts={traitCounts(run.roster)}
                expanded
                onToggle={() => {}}
                onDetails={() => {}}
              />
            ) : (
              <>
                <p>
                  Thắng vòng farm nhận một mảnh. Kéo đồ lên quân, kéo hai mảnh
                  vào nhau để ghép. Mỗi quân nhận tối đa 2 trang bị.
                </p>
                {ITEM_RECIPES.map((r) => (
                  <p key={r.result}>
                    {ITEM_MAP[r.parts[0]].name} + {ITEM_MAP[r.parts[1]].name} →{" "}
                    {ITEM_MAP[r.result].name}
                  </p>
                ))}
              </>
            )}
          </div>
        </Dialog>
      )}
    </section>
  )
}

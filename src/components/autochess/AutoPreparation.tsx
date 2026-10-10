import type { CSSProperties, PointerEvent } from "react"
import { AUTO_SCHOOLS, UNIT_MAP, PROFESSIONS } from "../../game/autochess/catalog"
import { BENCH_SLOTS, MAX_LEVEL } from "../../game/autochess/config"
import { benchLayout, boardPieces, capacity, copies, levelProgress, unitRole } from "../../game/autochess/economy"
import { ITEM_MAP, equipPreview } from "../../game/autochess/items"
import { starScale, type StarUpgrade } from "../../game/autochess/presentation"
import type { AutoRun } from "../../game/autochess/types"
import type { AutoAction } from "../../game/autochess/reducer"
import type { useFormationDrag, PeekTarget } from "./useFormationDrag"
import { AutoPortrait } from "./AutoArt"
import { ItemArt } from "./ItemArt"
import { SCHOOL_ICONS, PROFESSION_ICONS } from "./AutoTraits"

type Props = {
  run: AutoRun; selected: string | null; onSelect: (uid: string | null) => void; upgrades: StarUpgrade[]; reducedMotion: boolean
  drag: ReturnType<typeof useFormationDrag>; onAction: (action: AutoAction) => boolean; onInspect: (target: PeekTarget) => void
  shopOpen: boolean; onToggleShop: () => void; inventoryOpen: boolean; onToggleInventory: () => void; onInventoryDetails: () => void
}
export function AutoPreparation({ run, selected, onSelect, upgrades, reducedMotion, drag, onAction, onInspect, shopOpen, onToggleShop, inventoryOpen, onToggleInventory, onInventoryDetails }: Props) {
  const bench = benchLayout(run), selectedPiece = run.roster.find(p => p.uid === selected), progress = levelProgress(run.xp)
  const moveToBench = (index: number, keyboard: boolean) => {
    if (drag.ignoreClick() || !keyboard && drag.touchTap()) return
    const piece = bench[index]
    if (selected && selected !== piece?.uid) {
      onAction({ type: "move", uid: selected, cell: null, benchSlot: index }); onSelect(null)
    } else if (piece) onSelect(piece.uid === selected ? null : piece.uid)
  }
  return <section className={`ac-market ${shopOpen ? "is-open" : "is-collapsed"}`} aria-label="Cửa hàng và đội dự bị">
    <div className="ac-bench-line">
      <small>DỰ BỊ <b>{run.roster.filter(p => p.cell === null).length}/{BENCH_SLOTS}</b></small>
      <div className="ac-bench" role="group" aria-label="Ghế dự bị 9 ô">
        {bench.map((piece, index) => {
          const def = piece ? UNIT_MAP[piece.id] : null, upgrade = upgrades.find(u => u.uid === piece?.uid)
          return <button key={index} data-bench-slot={index} data-piece={piece?.uid} data-star={piece?.star}
            data-star-scale={piece ? starScale(piece.star) : undefined} className={`${piece?.uid === selected ? "is-selected" : ""} ${upgrade ? "is-star-upgrade" : ""}`}
            style={{ "--school": def ? AUTO_SCHOOLS[def.school].color : "#697d85", "--star-scale": piece ? starScale(piece.star) : 1 } as CSSProperties}
            aria-label={piece ? `${def!.name} ${piece.star} sao, dự bị ${index + 1}; kéo để xếp, giữ để xem` : `Ghế dự bị ${index + 1} trống`}
            aria-keyshortcuts={piece ? "W E" : undefined} aria-pressed={piece ? piece.uid === selected : undefined} draggable={false}
            onPointerDown={event => { if (piece) drag.start(piece.uid, event) }}
            onContextMenu={event => { event.preventDefault(); if (piece && !drag.touchTap()) onInspect({ id: piece.id, uid: piece.uid }) }}
            onClick={event => moveToBench(index, event.detail === 0)}>
            {piece && def ? <><AutoPortrait index={def.portrait} /><small>{"★".repeat(piece.star)}</small>
              {upgrade && <span key={upgrade.to} className={`ac-bench-awaken ${reducedMotion ? "is-quiet" : ""}`} aria-hidden="true">✦</span>}</> : <span aria-hidden="true">+</span>}
          </button>
        })}
      </div>
    </div>
    <div className="ac-formation-toolbar">
      <span>{selectedPiece ? `${UNIT_MAP[selectedPiece.id].name} · ${unitRole(selectedPiece.id)}` : `Đội ${boardPieces(run).length}/${capacity(run.xp)} · Kéo để xếp · Giữ để xem`}</span>
      {selectedPiece && <button onClick={() => onInspect({ id: selectedPiece.id, uid: selectedPiece.uid })}>Chi tiết</button>}
      {selectedPiece && <button onClick={() => { onAction({ type: "sell", uid: selectedPiece.uid }); onSelect(null) }}>Bán · {UNIT_MAP[selectedPiece.id].cost * copies(selectedPiece.star)} ◉</button>}
      {!selectedPiece && <button onClick={() => onAction({ type: "auto-place" })}>Xếp nhanh</button>}
      <button aria-expanded={inventoryOpen} aria-controls="ac-item-tray" onClick={onToggleInventory} title="Mở kho để kéo trang bị lên quân hoặc ghép hai mảnh">✧ <span>Túi</span> {run.inventory.length}</button>
      <button className="ac-begin" onClick={() => { onSelect(null); onAction({ type: "battle" }) }} disabled={!boardPieces(run).length || !!run.scene}>Xuất trận {boardPieces(run).length}/{capacity(run.xp)} →</button>
    </div>
    {inventoryOpen && <div className="ac-item-tray" id="ac-item-tray" role="group" aria-label="Kho trang bị kéo thả">
      <button className="ac-item-help" onClick={onInventoryDetails} aria-label="Công thức và hướng dẫn trang bị">?</button>
      {!run.inventory.length && <small>Kho trống · thắng đợt 3/6/9 để chọn thưởng.</small>}
      {run.inventory.map((id, index) => {
        const item = ITEM_MAP[id]
        return <button key={`${id}-${index}`} data-item-index={index} className="ac-item-token" draggable={false}
          style={{ "--item": item.color } as CSSProperties} title={`${item.name} · ${item.text}`} aria-label={`${item.name}. ${item.text}. Kéo lên quân hoặc mảnh khác.`}
          onPointerDown={event => drag.startItem(index, event)} onContextMenu={event => event.preventDefault()}
          onClick={() => { if (!drag.ignoreClick() && selectedPiece) onAction({ type: "equip", uid: selectedPiece.uid, item: id }) }}>
          <ItemArt id={id} decorative /><span>{item.name}</span>
        </button>
      })}
      {selectedPiece && <small>{run.inventory.some(id => equipPreview(selectedPiece, id).valid) ? "Chạm đồ để trao cho quân đang chọn" : "Quân chưa nhận thêm được trang bị"}</small>}
    </div>}
    {shopOpen && <AutoShop run={run} onBuy={index => { if (!drag.ignoreClick()) onAction({ type: "buy", index }) }}
      onInspect={target => { if (!drag.touchTap()) onInspect(target) }} onPointerStart={(id, shop, event) => drag.startPeek({ id, shop }, event)} />}
    <footer className="ac-market-toolbar">
      <div className="ac-market-wallet" aria-label={`Vàng hiện có: ${run.gold}`}><small>VÀNG ◉</small><strong title={String(run.gold)}>{run.gold >= 10000 ? `${Math.round(run.gold / 1000)}k` : run.gold.toLocaleString("vi-VN")}</strong></div>
      <button className="ac-roll-control" disabled={run.gold < 2 && !run.freeReroll} onClick={() => onAction({ type: "reroll" })} aria-keyshortcuts="D" title="D · Làm mới cửa hàng">↻ <span>Đổi</span><kbd>D</kbd><small>{run.freeReroll ? "0" : "2"} ◉</small></button>
      <button className="ac-xp-control" disabled={run.gold < 4 || progress.level >= MAX_LEVEL} onClick={() => onAction({ type: "xp" })} aria-keyshortcuts="F"
        aria-label={`Cấp ${progress.level}, ${run.xp}${progress.next === null ? " XP, cấp tối đa" : `/${progress.next} XP, còn ${progress.remaining} XP`}. Mua 4 XP giá 4 vàng`}
        title={progress.next === null ? "Đã mở tối đa 9 quân" : `F · Còn ${progress.remaining} XP; mua 4 XP với 4 vàng`}>
        <strong>Cấp {progress.level}<kbd>F</kbd><span>{progress.next === null ? "MAX" : "+4 XP · 4 ◉"}</span></strong>
        <small>{run.xp}{progress.next !== null ? `/${progress.next}` : ""} XP</small><i className="ac-xp-track" aria-hidden="true"><i style={{ width: `${progress.percent}%` }} /></i>
      </button>
      <button className="ac-shop-lock" aria-pressed={run.locked} onClick={() => onAction({ type: "lock" })} title="Giữ cửa hàng qua vòng sau" aria-label={run.locked ? "Mở khóa cửa hàng" : "Khóa cửa hàng"}>{run.locked ? "▣" : "◇"}</button>
      <button className="ac-shop-toggle" onClick={onToggleShop} aria-expanded={shopOpen} aria-controls="ac-shop-cards">{shopOpen ? "Ẩn" : "Hiện"}<span> shop</span><i>{shopOpen ? "⌄" : "⌃"}</i></button>
    </footer>
  </section>
}
function AutoShop({ run, onBuy, onInspect, onPointerStart }: { run: AutoRun; onBuy: (index: number) => void; onInspect: (target: PeekTarget) => void; onPointerStart: (id: string, shop: number, event: PointerEvent<HTMLElement>) => void }) {
  return <div className="ac-shop" id="ac-shop-cards" role="group" aria-label="Cửa hàng 5 quân">
    {run.shop.map((id, index) => {
      const def = id ? UNIT_MAP[id] : null
      if (!def) return <div key={index} className="ac-shop-empty">Đã mua</div>
      const count = run.roster.filter(p => p.id === id).reduce((n, p) => n + copies(p.star), 0)
      const mergeReady = run.roster.filter(p => p.id === id && p.star === 1).length >= 2
      return <button key={index} data-shop-index={index} className={`ac-shop-card tier-${def.cost} ${count ? "is-owned" : ""} ${mergeReady ? "is-merge-ready" : ""} ${run.gold < def.cost ? "is-unaffordable" : ""}`}
        style={{ "--school": AUTO_SCHOOLS[def.school].color } as CSSProperties} onClick={() => onBuy(index)}
        onPointerDown={event => onPointerStart(def.id, index, event)} onContextMenu={event => { event.preventDefault(); onInspect({ id: def.id, shop: index }) }}
        aria-label={`Mua ${def.name}, ${def.cost} vàng, ${AUTO_SCHOOLS[def.school].name}, ${PROFESSIONS[def.profession].name}${count ? `, đang có ${count} bản` : ""}${mergeReady ? ", mua để ghép sao" : ""}. Giữ để xem thông tin.`}>
        <div className="ac-shop-art"><AutoPortrait index={def.portrait} /><span className="ac-shop-cost">{def.cost} ◉</span>
          {!!count && <b className="ac-shop-owned">{mergeReady ? "✦ Ghép" : `✓ ${count}`}</b>}
          <span className="ac-shop-school" title={AUTO_SCHOOLS[def.school].name}>{SCHOOL_ICONS[def.school]}<small>{AUTO_SCHOOLS[def.school].name}</small></span>
        </div>
        <strong title={def.name}>{def.name}</strong><small className="ac-shop-profession" title={PROFESSIONS[def.profession].text}>{PROFESSION_ICONS[def.profession]} {PROFESSIONS[def.profession].name}</small><small className="ac-shop-role">{unitRole(def.id)}</small>
      </button>
    })}
  </div>
}

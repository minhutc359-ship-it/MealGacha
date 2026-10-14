import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { IntroFrame, IntroScene } from "../../game/modeIntro"
import { newGame } from "../../game/progression"
import { traitCounts, boardPieces, capacity } from "../../game/autochess/economy"
import { maxWillpower, willpowerRatio } from "../../game/autochess/willpower"
import { MONSTER_MAP } from "../../game/autochess/catalog"
import { starUpgrades, type StarUpgrade } from "../../game/autochess/presentation"
import { itemPreview } from "../../game/autochess/items"
import { SEED_DISHES } from "../../infrastructure/catalog/seedCatalog"
import type { RewardInstance } from "../../domain/models"
import { BattleBoardView } from "./BattleBoard"
import { RpgBattleView } from "./RpgBattleView"
import { ELEMENTAL_BOARDS } from "../../game/visualPack"
import { AutoBoard } from "../autochess/AutoBoard"
import { AutoPortrait, WorldArt } from "../autochess/AutoArt"
import { AutoTraits } from "../autochess/AutoTraits"
import { AutoPreparation } from "../autochess/AutoPreparation"
import { useFormationDrag } from "../autochess/useFormationDrag"
import { AutoVictory } from "../autochess/AutoVictory"
import { ChestScene } from "../chest/ChestScene"
import { RevealModal } from "../chest/RevealModal"

const noop = () => {}
const refuse = () => false

function TcgDemo({ frame, paused }: { frame: IntroFrame; paused: boolean }) {
  const save = useMemo(() => newGame(), [])
  if (frame.scene.mode !== "tcg") return null
  return <div className="tcg-app tcg-compact-app"><BattleBoardView stored={frame.scene.battle} presentation={null}
    storySave={save} ending={null} act={refuse} leaveBattle={noop}
    acknowledgeScene={noop} chooseEnding={noop} onExit={noop}
    demo={{ frame: frame.scene.frame, sequence: frame.at, paused }} /></div>
}

function AutoDemo({ scene, paused, quiet }: { scene: Extract<IntroScene, { mode: "auto" }>; paused: boolean; quiet: boolean }) {
  const run = scene.run, preparing = run.phase === "prepare"
  const latest = useRef({ run, alpha: 0 })
  latest.current = { run: { ...run, paused }, alpha: 0 }
  const getFrame = useCallback(() => latest.current, [])
  const previous = useRef(run.roster), [upgrades, setUpgrades] = useState<StarUpgrade[]>([])
  useEffect(() => {
    const merged = starUpgrades(previous.current, run.roster, performance.now())
    if (merged.length) setUpgrades(merged)
    previous.current = run.roster
  }, [run.roster])
  const drag = useFormationDrag({ enabled: false, peekEnabled: false,
    onDrop: noop, onSelect: noop, onSell: noop, onItemDrop: noop,
    previewItem: (index, target) => itemPreview(run, index, target), inspectPiece: () => null })
  return <div className="ac-shell" inert>
    <WorldArt scene={0} className="ac-backdrop" />
    <main className={`ac-game ${preparing ? "is-preparing" : "is-fighting"}`}>
      <div className="ac-hud">
        <AutoPortrait index={0} npc label="An" />
        <div className="ac-health"><span>AN · {run.health}/{maxWillpower(run)} ý chí</span><div><i style={{ width: `${willpowerRatio(run) * 100}%` }} /></div></div>
        <div className="ac-hud-number"><small>VÀNG</small><strong>◉ {run.gold}</strong></div>
        <div className="ac-hud-number"><small>ĐỢT {run.wave}</small><strong>{run.score} <small>điểm</small></strong></div>
      </div>
      <div className="ac-round-heading"><span><strong>{run.combat?.boss ? MONSTER_MAP[run.combat.boss].name : "Chuẩn bị đội hình"}</strong><small>{preparing ? "CHUẨN BỊ · Mua → xếp quân → xuất trận" : `GIAO CHIẾN · ${Math.floor((run.combat?.tick ?? 0) / 20)} giây`}</small></span><button className="ac-trait-summary">Hệ</button></div>
      <div className="ac-battle-layout">
        <AutoTraits counts={traitCounts(boardPieces(run))} expanded={false} onToggle={noop} onDetails={noop} />
        <section className={`ac-arena ${run.combat?.boss ? "is-boss" : ""}`} aria-label="Trận auto chess">
          <WorldArt scene={0} />
          <AutoBoard run={run} getFrame={getFrame} selected={null} reducedMotion={quiet}
            lowQuality={quiet} celebrating={run.combat?.result === "win"} upgrades={upgrades} onCell={noop} />
          {run.combat?.result === "win" && <AutoVictory wave={run.wave} onFinish={noop} />}
        </section>
      </div>
      {preparing ? <AutoPreparation run={run} selected={null} onSelect={noop} upgrades={upgrades} reducedMotion={quiet}
        drag={drag} onAction={refuse} onInspect={noop} shopOpen onToggleShop={noop} inventoryOpen={false} onToggleInventory={noop} onInventoryDetails={noop} />
        : <div className="ac-fight-controls"><div className="ac-combat-strip"><AutoPortrait index={0} npc /><span><strong>Vị Linh đang giữ bàn</strong><small>Mana đầy → tự tung kỹ năng · boss tự phản kích</small></span><button className="ac-button">Tạm dừng</button></div><footer className="ac-controls"><span className="ac-team-caption">{boardPieces(run).length} Vị Linh · Cấp {capacity(run.xp)} · {run.xp} XP</span></footer></div>}
    </main>
  </div>
}

function AdventureDemo({ scene, paused, quiet }: { scene: Extract<IntroScene, { mode: "adventure" }>; paused: boolean; quiet: boolean }) {
  return <div className="rpg-battle-demo" inert><RpgBattleView battle={scene.save.run!.battle} title="Sân đình · Trống Rỗng" art={ELEMENTAL_BOARDS.hearth} paused={paused} quiet={quiet} readOnly onAction={noop} /></div>
}

function ChestDemo({ scene, elapsed, quiet }: { scene: Extract<IntroScene, { mode: "chest" }>; elapsed: number; quiet: boolean }) {
  const dish = SEED_DISHES.find(item => item.id === scene.dishId)!
  const reward: RewardInstance = useMemo(() => ({ id: "intro-reward", dishId: dish.id,
    dish: { id: dish.id, name: dish.name, searchQuery: dish.searchQuery, imageUrl: dish.imageUrl, category: dish.category },
    mealSlot: "breakfast", source: "chest", status: "available", acquiredAt: "2026-01-01T00:00:00Z", acquiredDate: "2026-01-01", favorite: false, rarity: scene.rarity }), [dish, scene.rarity])
  const revealed = scene.phase === "reveal" || scene.phase === "collect"
  const state = scene.phase === "choose" ? "idle" : elapsed < 7_000 ? "key-flight" : elapsed < 9_000 ? "charging" : "opening"
  return <div className={`loot-stage-page ritual-${state}`} inert>
    <div className="meal-banner-tabs"><button className="is-active">Sáng</button><button>Trưa</button><button>Tối</button></div>
    <div className="chest-cinematic"><ChestScene state={state} accent="#dfbb62" rarity={scene.rarity} reducedMotion={quiet} /></div>
    <div className="chest-action-zone"><strong>◇ {scene.keys} chìa mẫu</strong><button className="chest-open-button">Mở rương</button></div>
    {revealed && <RevealModal reward={reward} canOpenAgain={false} onClose={noop} onOpenAgain={noop} onGoCollection={noop} embedded />}
  </div>
}

export function ModeIntroScene({ frame, elapsed, paused, quiet }: { frame: IntroFrame; elapsed: number; paused: boolean; quiet: boolean }) {
  switch (frame.scene.mode) {
    case "tcg": return <TcgDemo frame={frame} paused={paused} />
    case "auto": return <AutoDemo scene={frame.scene} paused={paused} quiet={quiet} />
    case "adventure": return <AdventureDemo scene={frame.scene} paused={paused} quiet={quiet} />
    case "chest": return <ChestDemo scene={frame.scene} elapsed={elapsed} quiet={quiet} />
  }
}

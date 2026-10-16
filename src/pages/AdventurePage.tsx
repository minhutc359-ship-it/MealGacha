import { useSpiritDetails } from "../hooks/useSpiritDetails"
import { useSearchParams } from "react-router-dom"
import { SPIRIT_IDS } from "../game/adventureRpg/spiritArt"
import { SPIRIT_RARITY, SPIRIT_RARITY_NAMES, SPIRIT_THRESHOLDS } from "../domain/spiritSummons"
import { collectedSpiritCards, spiritProgress } from "../domain/spiritCollection"
import { RpgCinematic } from "../components/game/RpgCinematic"
import { AdventureTransition } from "../components/game/AdventureTransition"
import { AdventureVillage } from "../components/game/AdventureVillage"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { SpiritArt, SkillArt } from "../components/game/SpiritArt"
import { REACTION_HELP } from "../game/adventureRpg/skills"
import { BrandMark } from "../components/layout/BrandMark"
import { ModeSwitch } from "../components/layout/ModeSwitch"
import { ModeIntroButton } from "../components/layout/ModeIntroButton"
import {
  AudioButton,
  useGameAudio,
  useGameMusic,
} from "../components/game/GameAudio"
import { CharacterPortrait } from "../components/game/CharacterPortrait"
import { RpgBattleView, RpgMeter } from "../components/game/RpgBattleView"
import { CARD_MAP, SCHOOLS } from "../game/catalog"
import { CHARACTER_NAMES } from "../game/characters"
import { RPG_MAPS, RPG_DUNGEONS, rpgStage } from "../game/adventureRpg/content"
import { RPG_STORY_ARCS } from "../game/adventureRpg/story"
import {
  newRpgSave,
  heroPower,
  heroRole,
  heroSkills,
  heroStats,
  heroXpNext,
  stageUnlocked,
  dungeonTierCap,
  upgradeCost,
  RPG_ROLE_NAMES,
} from "../game/adventureRpg/engine"
import type {
  RpgAction,
  RpgDifficulty,
  RpgHero,
  RpgLine,
  RpgResources,
  RpgSave,
} from "../game/adventureRpg/types"
import { dungeonScaling, formationAverage } from "../game/adventureRpg/enemies"
import { useGameStore } from "../game/useGameStore"
import { useAppStore } from "../store/useAppStore"
import { gameAudio } from "../infrastructure/audio/gameAudio"
import { ELEMENTAL_BOARDS } from "../game/visualPack"
import {
  battlePresentationSequence,
  type AdventureHomeTab,
  type BattlePresentationPhase,
} from "../game/adventureV560"
import "../game/adventureRpg/rpg.css"
import "../components/game/villageRpg.css"

const RESOURCE_NAMES: Record<keyof RpgResources, string> = {
  coins: "Xu",
  experience: "Sổ KN",
  books: "Sách kỹ năng",
  ore: "Quặng",
  essence: "Tinh hương",
  broth: "Canh Ấm",
  leaves: "Lá Tỉnh",
  seals: "Hương Ấn",
}
function costText(cost: Partial<RpgResources>) {
  return Object.entries(cost)
    .map(
      ([key, value]) =>
        `${value} ${RESOURCE_NAMES[(key as keyof RpgResources)]}`,
    )
    .join(" · ")
}
function canPay(save: RpgSave, cost: Partial<RpgResources>) {
  return Object.entries(cost).every(
    ([key, value]) => save.resources[(key as keyof RpgResources)] >= value,
  )
}

function RpgModal({ children, label, onClose }: { children: ReactNode
  label: string
  onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    return () => { dialog.current?.close(); if (previous?.isConnected) previous.focus() }
  }, [])
  return <dialog ref={dialog} className="rpg-modal" aria-label={label} onCancel={e => { e.preventDefault(); onClose() }}>{children}</dialog>
}

function StoryDialog({
  lines,
  onClose,
  onCancel,
  canSkip = false,
}: {
  lines: RpgLine[]
  onClose: () => void
  onCancel: () => void
  canSkip?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [index, setIndex] = useState(0)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    return () => {
      dialog.current?.close()
      previous?.isConnected && previous.focus()
    }
  }, [])
  const line = lines[index]
  return (
    <dialog
      ref={dialog}
      className="rpg-story"
      aria-label="Câu chuyện"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <CharacterPortrait id={line.speaker} decorative />
      <div>
        <small>
          CÂU CHUYỆN · {index + 1}/{lines.length}
        </small>
        <h2>{CHARACTER_NAMES[line.speaker]}</h2>
        <p>{line.text}</p>
        <button
          type="button"
          className="rpg-primary"
          onClick={() => {
            gameAudio.play("story-next")
            index < lines.length - 1 ? setIndex(index + 1) : onClose()
          }}
        >
          {index < lines.length - 1 ? "Tiếp câu chuyện" : "Tiếp tục →"}
        </button>
        {canSkip && index < lines.length - 1 && <button type="button" className="rpg-story-skip" onClick={onClose}>Vào trận ›</button>}
      </div>
    </dialog>
  )
}
function HeroDetails({
  hero,
  save,
  act,
  cards,
  locked,
}: {
  cards: Record<string, number>
  locked: boolean
  hero: RpgHero
  save: RpgSave
  act: (a: RpgAction) => boolean
}) {
  const [preview, setPreview] = useState(false)
  const wish = useAppStore(s=>s.user.spiritWish)
  const chooseWish = useAppStore(s=>s.setSpiritWish)
  const reduced = useAppStore(s=>s.user.preferences.reducedMotion)
  const {details,error:detailsError,retry} = useSpiritDetails()
  const progress = spiritProgress(hero.cardId,cards)
  const card = CARD_MAP[hero.cardId],
    stats = heroStats(hero),
    rankCost = upgradeCost(hero, "rank")
  return (
    <section className="rpg-hero-details" aria-label={`Chi tiết ${card.name}`}>
      <div className="rpg-hero-overview">
        <SpiritArt id={hero.cardId} label={`Vị Linh ${card.name}`} />
        <div>
          <small>
            {SCHOOLS[card.school].name} ·{" "}
            {RPG_ROLE_NAMES[heroRole(hero.cardId)]}
          </small>
          <h2>{card.name}</h2>
          <p>
            Cấp {hero.level}/50 · Bậc {hero.rank}/5 · Lực chiến{" "}
            {heroPower(hero)}
          </p>
          <p>
            HP {stats.hp} · Công {stats.attack} · Giáp {stats.armor}
          </p>
        </div>
      </div>
      <div className="rpg-unlock-progress" data-spirit={hero.cardId}><small>{SPIRIT_RARITY_NAMES[card.rarity]} · {locked ? "CHƯA HỘI NGỘ" : "ĐÃ HỘI NGỘ"}</small><strong>{progress.collected} / {progress.needed} thẻ Vị Linh</strong><RpgMeter value={Math.min(progress.collected,progress.needed)} max={progress.needed} label="Tiến trình mở khóa Vị Linh"/><p>{locked ? "Mở Rương vị giác để nhận thẻ. Đủ mốc sẽ tự hội ngộ; không tiêu hao thẻ." : progress.ready ? "Đã đủ giao ước. Thẻ và mảnh món ăn vẫn được giữ." : "Vị Linh đồng hành đã được giữ lại; tiếp tục thu thập từ rương."}</p><a href="/chest">Mở Rương vị giác ↗</a><button type="button" aria-pressed={wish===hero.cardId} onClick={()=>chooseWish(hero.cardId)}>{wish===hero.cardId?"♥ Đang ước hẹn":"♡ Ước hẹn nhân vật này"}</button><small>Ước hẹn bảo đảm 1 thẻ nhân vật đã chọn mỗi 5 lần mở rương. Đổi người không đặt lại nhịp.</small></div>
      <button type="button" className="rpg-preview-button" onClick={()=>setPreview(true)}>▶ Xem video tuyệt kỹ</button>
      {preview && <RpgModal label="Xem tuyệt kỹ" onClose={()=>setPreview(false)}><div className="rpg-cinematic-preview"><RpgCinematic id={hero.cardId} reduced={reduced} paused={false} onDone={()=>setPreview(false)}/></div></RpgModal>}
      {!locked && <><RpgMeter
        value={hero.xp}
        max={heroXpNext(hero.level)}
        label="Kinh nghiệm nhân vật"
      />
      <div className="rpg-upgrade-actions">
        <button
          type="button"
          className="rpg-primary"
          disabled={hero.level >= 50 || !save.resources.experience}
          onClick={() => act({ type: "train", uid: hero.uid })}
        >
          +180 KN · 1 Sổ KN
        </button>
        <button
          type="button"
          disabled={
            hero.rank >= 5 ||
            hero.level < hero.rank * 5 ||
            !canPay(save, rankCost)
          }
          title={costText(rankCost)}
          onClick={() => act({ type: "rank", uid: hero.uid })}
        >
          Thăng bậc {hero.rank + 1} · cần cấp {hero.rank * 5}
          <small>{costText(rankCost)}</small>
        </button>
      </div>
      <div className="rpg-paths" aria-label="Hướng tuyệt kỹ">
        <h3>Hướng tuyệt kỹ · Cấp 10</h3>
        <p>Đổi miễn phí ngoài chuyến đi. Lựa chọn chỉ áp dụng cho trận mới.</p>
        {(["assault", "support"] as const).map(path => <button type="button" key={path} aria-pressed={hero.path === path} disabled={hero.level < 10 || !!save.run} onClick={() => act({type: "path", uid: hero.uid, path})}>{path === "assault" ? "Phá sương · công +20%, hồi/khiên −15%" : "Dưỡng linh · hồi/khiên +50%, công −15%"}</button>)}
      </div>
      <details className="rpg-strategy"><summary>Phản ứng & cộng hưởng đội hình</summary><p>{REACTION_HELP}</p><p>Ba hệ khác nhau: +10 năng lượng đầu trận. Ba Vị Linh cùng hệ: +12 giáp cho nhóm cùng hệ. Cộng hưởng áp dụng lúc bắt đầu trận.</p></details>
      </>}
      <h3>Bốn kỹ năng</h3>
      {detailsError && <p role="status">Chưa tải được mô tả kỹ năng. <button type="button" onClick={retry}>Thử lại</button></p>}
      <div className="rpg-skill-list">
        {heroSkills(hero,details).map((skill, index) => {
          const cost = upgradeCost(hero, "skill", index)
          return (
            <article key={index} className={!skill.ready ? "is-locked" : ""}>
              <SkillArt index={skill.icon} />
              <div>
                <small>
                  {skill.tag} · Cấp {skill.level}/10
                </small>
                <strong>{skill.name}</strong>
                <p>{skill.text}</p>
                {!skill.ready && (
                  <b>{index === 3 ? "Mở ở bậc 2" : "Mở ở cấp 5"}</b>
                )}
              </div>
              <button
                type="button"
                disabled={
                  locked || !skill.ready ||
                  skill.level >= Math.min(10, hero.level) ||
                  !canPay(save, cost)
                }
                onClick={() => act({ type: "skill", uid: hero.uid, index })}
              >
                Nâng<small>{costText(cost)}</small>
              </button>
            </article>
          )
        })}
      </div>
      {!locked && <h3>Trang bị</h3>}
      {!locked && <div className="rpg-gear-list">
        {[
          "Muôi chiến · Công",
          "Tạp dề · HP + Giáp",
          "Hương phù · Năng lượng",
        ].map((name, index) => {
          const cost = upgradeCost(hero, "gear", index)
          return (
            <button
              type="button"
              key={name}
              disabled={hero.gear[index] >= 10 || !canPay(save, cost)}
              onClick={() => act({ type: "gear", uid: hero.uid, index })}
            >
              <strong>{name}</strong>
              <span>+{hero.gear[index]}/10</span>
              <small>{costText(cost)}</small>
            </button>
          )
        })}
      </div>}
    </section>
  )
}

export function AdventurePage() {
  useGameAudio()
  const game = useGameStore((s) => s.save),
    raw = game.adventureRpg
  const seeded = useMemo(() => newRpgSave(game), [game.adventure, game.cards])
  const save = raw ?? seeded,
    run = save.run,
    b = run?.battle
  const dispatch = useGameStore((s) => s.rpgAction),
    notice = useGameStore((s) => s.notice),
    dismiss = useGameStore((s) => s.dismiss)
  const user = useAppStore((s) => s.user)
  const prefs = user.preferences
  const cards = useMemo(()=>collectedSpiritCards(user),[user.spiritCards,user.rewards])
  const [params] = useSearchParams()
  const requestedHero = params.get("hero")
  const allRoster = useMemo(()=>run ? save.roster : [...save.roster,...SPIRIT_IDS.filter(id=>!save.roster.some(h=>h.cardId===id)).map(id=>({uid:`card:${id}`,cardId:id,level:1,xp:0,rank:1,skills:[1,1,1,1] as [number,number,number,number],gear:[0,0,0] as [number,number,number]}))],[save.roster,!!run])
  const [tab, setTab] = useState<AdventureHomeTab>(
    requestedHero ? "heroes" : "village",
  )
  const [mapIndex, setMapIndex] = useState(() =>
    Math.min(RPG_MAPS.length - 1, RPG_MAPS.filter((m) => save.stars[`${m.id}-6`]).length),
  )
  const [selected, setSelected] = useState(requestedHero && SPIRIT_IDS.includes(requestedHero as typeof SPIRIT_IDS[number]) ? `card:${requestedHero}` : save.formation[0]),
    [slot, setSlot] = useState(0),
    [tier, setTier] = useState(1),
    [difficulty, setDifficulty] = useState<RpgDifficulty>("normal"),
    [filter, setFilter] = useState("")
  const [story, setStory] = useState<{
    lines: RpgLine[]
    start?: string
    difficulty?: RpgDifficulty
  } | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const [hidden, setHidden] = useState(document.hidden)
  const [transition, setTransition] = useState<{
    label: string
    complete: () => void
  } | null>(null)
  const [battlePresentation, setBattlePresentation] =
    useState<BattlePresentationPhase>("fight")
  const shortSound = useRef<ReturnType<typeof gameAudio.playClip> | null>(null)
  useEffect(()=>()=>shortSound.current?.stop(),[])
  useEffect(()=>{if(b?.paused||hidden)shortSound.current?.stop()},[b?.paused,hidden])
  const sound = useRef({ battle: "", serial: 0, result: "" })
  const map = RPG_MAPS[mapIndex],
    mapArc = RPG_STORY_ARCS[map.id],
    activeStage = run?.stageId ? rpgStage(run.stageId) : null
  const dungeon = run?.dungeon
    ? RPG_DUNGEONS.find((d) => d.id === run.dungeon!.kind)
    : null
  const teamSchools = save.formation.map(uid=>CARD_MAP[save.roster.find(h=>h.uid===uid)!.cardId].school)
  const sharedSchool = teamSchools.find(s=>teamSchools.filter(t=>t===s).length>=3)
  const artSchool =
    activeStage?.map.school ??
      (run?.dungeon?.kind === "skills"
        ? "sugar"
        : run?.dungeon?.kind === "forge"
          ? "ember"
          : "hearth")
  const art = activeStage?.map.battleArt ?? ELEMENTAL_BOARDS[artSchool]
  const quiet =
    prefs.reducedMotion ||
    prefs.graphicsQuality === "low" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const beginTransition = useCallback((label: string, complete: () => void) => {
    setTransition((current) => current ?? { label, complete })
  }, [])
  const visitVillage = useCallback(
    (next: Exclude<AdventureHomeTab, "village">, name: string) =>
      beginTransition(`Đang tới ${name}`, () => setTab(next)),
    [beginTransition],
  )
  useEffect(() => {
    if (!transition) return
    const handle = window.setTimeout(() => {
      const complete = transition.complete
      setTransition(null)
      complete()
    }, quiet ? 480 : 1_150)
    return () => clearTimeout(handle)
  }, [transition, quiet])
  useEffect(() => {
    if (!b) {
      setBattlePresentation("fight")
      return
    }
    if (b.result) {
      setBattlePresentation(b.result === "win" ? "win" : "fail")
      return
    }
    const sequence = battlePresentationSequence(b.wave, quiet)
    const timers: number[] = []
    let elapsed = 0
    setBattlePresentation(sequence[0].phase)
    for (let index = 1; index < sequence.length; index++) {
      elapsed += sequence[index - 1].duration
      timers.push(
        window.setTimeout(
          () => setBattlePresentation(sequence[index].phase),
          elapsed,
        ),
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [b?.id, b?.wave, !!b?.result, quiet])
  useGameMusic(
    run
      ? b?.actors.some((a) => a.boss && a.hp > 0)
        ? "boss"
        : map.music
      : tab === "village" ? "mode-adventure" : map.music,
    8,
  )
  const act = useCallback(
    (a: RpgAction) => {
      const ok = dispatch(a)
      if (ok && !["tick","settle","sync","cinematicDone","burst"].includes(a.type))
        gameAudio.play(a.type === "burst" ? "auto-channel" : "confirm")
      return ok
    },
    [dispatch],
  )
  useEffect(() => {
    dispatch({ type: "sync", cards })
  }, [dispatch, cards])
  useEffect(() => {
    const flush = () => useGameStore.getState().flushRpg()
    const visibility = () => {
      setHidden(document.hidden)
      if (document.hidden) flush()
    }
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("pagehide", flush)
    return () => {
      flush()
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("pagehide", flush)
    }
  }, [])
  useEffect(() => {
    if (!b || b.result || b.paused || b.cinematic || hidden || story || confirmExit || transition || battlePresentation !== "fight") return
    const handle = window.setInterval(() => {
      if (!document.hidden) dispatch({ type: "tick", steps: b.speed })
    }, 250)
    return () => clearInterval(handle)
  }, [
    b?.id,
    b?.result,
    b?.paused,
    b?.cinematic?.serial,
    b?.speed,
    hidden,
    story,
    confirmExit,
    transition,
    battlePresentation,
    dispatch,
  ])
  useEffect(() => {
    if (!b?.result || b.settled) return
    const handle = window.setTimeout(
      () => dispatch({ type: "settle" }),
      quiet ? 420 : 1_250,
    )
    return () => clearTimeout(handle)
  }, [b?.id, b?.result, b?.settled, quiet, dispatch])
  useEffect(() => {
    if (!b) return
    if (sound.current.battle !== b.id)
      sound.current = { battle: b.id, serial: b.serial, result: "" }
    const events = b.events.filter((e) => e.serial > sound.current.serial)
    sound.current.serial = b.serial
    const e =
      events.find((e) => e.kind === "burst") ??
      events.find((e) =>
        ["boss", "heal", "shield", "skill"].includes(e.kind),
      ) ??
      events[0]
    if(e && !hidden && b.rulesVersion===530 && e.kind==="burst" && !b.cinematic){
      const id=b.actors.find(a=>a.uid===e.source)?.id
      if(id){shortSound.current?.stop();const at=performance.now();shortSound.current=gameAudio.playClip(`/assets/rpg/awakening530/sounds/${id}.mp3`,()=> (performance.now()-at)/1000)}
    } else if (e && !hidden && !(b.rulesVersion===530 && e.kind==="burst" && b.cinematic))
      gameAudio.play(
        e.kind === "burst"
          ? "combo"
          : e.kind === "heal"
            ? "heal"
            : e.kind === "shield"
              ? "shield"
              : e.kind === "boss"
                ? "auto-boss"
                : e.kind === "skill"
                  ? "auto-channel"
                  : "auto-contact",
      )
    if (b.result && sound.current.result !== b.id) {
      sound.current.result = b.id
      gameAudio.play(b.result === "win" ? "auto-victory" : "auto-defeat")
    }
  }, [b?.serial, b?.id, b?.result, hidden])
  const teamPower = save.formation.reduce(
    (total, uid) => total + heroPower(save.roster.find((h) => h.uid === uid)!),
    0,
  )
  const hero = allRoster.find((h) => h.uid === selected || h.cardId === selected.replace(/^card:/,"")) ?? save.roster[0]
  const locked = !save.roster.some(h=>h.uid===hero.uid)
  const startStage = (id: string) => {
    const s = rpgStage(id)!
    const arc = RPG_STORY_ARCS[s.map.id]
    const previousMap = RPG_MAPS[s.mapIndex - 1]
    const previousChoice = previousMap ? save.choices[previousMap.id] : undefined
    const callback = s.index === 0 && previousMap && previousChoice !== undefined
      ? RPG_STORY_ARCS[previousMap.id].consequences[previousChoice] : []
    const beat = s.index === 0 ? arc.opening : s.index === 2 ? arc.turningPoint : s.index === 5 ? arc.finale : []
    setStory({ lines: [...callback, ...beat, s.stage.before], start: id, difficulty })
  }
  const closeRun = () => {
    act({ type: "close" })
    setConfirmExit(false)
    if (activeStage?.boss && b?.result === "win") {
      setMapIndex(activeStage.mapIndex)
      setStory({ lines: [...activeStage.map.ending, ...RPG_STORY_ARCS[activeStage.map.id].aftermath] })
    }
  }
  const putHero = () => {
    const ids = [...save.formation],
      existing = ids.indexOf(hero.uid)
    if (existing >= 0) [ids[slot], ids[existing]] = [ids[existing], ids[slot]]
    else ids[slot] = hero.uid
    act({ type: "formation", uids: ids.filter(Boolean) })
  }
  return (
    <div className="rpg-app">
      <header className="rpg-header">
        <a href="/" className="rpg-brand">
          <BrandMark />
          <span>
            SOUL OF MEAL<small>GIAO ƯỚC VỊ LINH</small>
          </span>
        </a>
        <div>
          <ModeSwitch mode="adventure" />
          <AudioButton />
        </div>
      </header>
      {run && b ? (
        <main className="rpg-play-screen">
          <RpgBattleView
            battle={b}
            title={
              activeStage
                ? `${activeStage.map.name} · ${activeStage.stage.name}`
                : `${dungeon?.name} · Tầng ${run.dungeon?.floor}/5${run.dungeon?.scaling ? ` · Đội cấp TB ${run.dungeon.scaling.average}` : ""}`
            }
            art={art}
            quiet={quiet}
            reduced={quiet}
            paused={hidden || !!story || confirmExit}
            presentation={battlePresentation}
            school={artSchool}
            onAction={act}
          />
          <footer className="rpg-run-footer">
            <span>
              {run.kind === "dungeon"
                ? "HP và năng lượng được giữ giữa các tầng"
                : "Đội hình 5 Vị Linh · Thắng để mở màn tiếp"}
            </span>
            <button
              type="button"
              disabled={!!b.result && !b.settled}
              onClick={() => (b.result ? closeRun() : setConfirmExit(true))}
            >
              {b.result ? "Về bản đồ" : "Rút lui"}
            </button>
          </footer>
          {b.result && b.settled && (
            <RpgModal label="Kết quả trận" onClose={closeRun}>
              <div className="rpg-result-card">
                <small>
                  {run.dungeon?.status === "complete"
                    ? "HOÀN THÀNH DUNGEON"
                    : "KẾT QUẢ"}
                </small>
                <h2>
                  {b.result === "win"
                    ? "Đã giữ được hương vị"
                    : "Nghỉ một chút, rồi thử lại"}
                </h2>
                {run.kind === "campaign" && b.result === "win" && (
                  <strong className="rpg-stars">
                    {"★".repeat(b.stars)}
                    {"☆".repeat(3 - b.stars)}
                  </strong>
                )}
                <p>
                  {b.reward
                    ? `Đã nhận: ${costText(b.reward)} · cả đội nhận KN`
                    : "Nâng cấp đội và thử lại. Tài nguyên đã có được giữ nguyên."}
                </p>
                {activeStage && b.result === "win" && (
                  <blockquote>
                    {activeStage.stage.after.text}
                    <cite>
                      — {CHARACTER_NAMES[activeStage.stage.after.speaker]}
                    </cite>
                  </blockquote>
                )}
                {run.dungeon?.status === "camp" && (
                  <div className="rpg-choice-actions">
                    <button
                      type="button"
                      onClick={() => act({ type: "camp", choice: "rest" })}
                    >
                      Nghỉ · Hồi 40% HP
                    </button>
                    <button
                      type="button"
                      onClick={() => act({ type: "camp", choice: "power" })}
                    >
                      Tiếp sức · +12% công
                    </button>
                  </div>
                )}
                {run.dungeon &&
                  ["camp", "ready"].includes(run.dungeon.status) && (
                    <div className="rpg-dungeon-health">
                      {b.actors
                        .filter((a) => a.side === "ally")
                        .map((a) => (
                          <span key={a.uid}>
                            {a.name}: {run.dungeon!.health[a.uid]?.hp ?? a.hp}{" "}
                            HP
                          </span>
                        ))}
                      <button
                        type="button"
                        disabled={!save.resources.broth}
                        onClick={() => act({ type: "broth" })}
                      >
                        Canh Ấm ×{save.resources.broth} · hồi 35%
                      </button>
                      {b.actors
                        .filter(
                          (a) =>
                            a.side === "ally" &&
                            run.dungeon!.health[a.uid]?.hp === 0,
                        )
                        .map((a) => (
                          <button
                            type="button"
                            key={`revive:${a.uid}`}
                            disabled={!save.resources.leaves}
                            onClick={() => act({ type: "revive", uid: a.uid })}
                          >
                            Lá Tỉnh · {a.name}
                          </button>
                        ))}
                    </div>
                  )}
                <div className="rpg-result-actions">
                  {run.dungeon?.status === "ready" && (
                    <button
                      type="button"
                      className="rpg-primary"
                      onClick={() =>
                        beginTransition(
                          `Lên tầng ${run.dungeon!.floor + 1}`,
                          () => act({ type: "next" }),
                        )
                      }
                    >
                      Lên tầng {run.dungeon.floor + 1} →
                    </button>
                  )}
                  {activeStage &&
                    b.result === "win" &&
                    activeStage.index < 5 && (
                      <button
                        type="button"
                        className="rpg-primary"
                        onClick={() => {
                          act({ type: "close" })
                          startStage(
                            `${activeStage.map.id}-${activeStage.index + 2}`,
                          )
                        }}
                      >
                        Màn tiếp →
                      </button>
                    )}
                  <button type="button" onClick={closeRun}>
                    {run.dungeon?.status === "complete"
                      ? "Mang tài nguyên về bếp"
                      : "Về bản đồ"}
                  </button>
                </div>
              </div>
            </RpgModal>
          )}
          {confirmExit && (
            <RpgModal label="Rút khỏi chuyến đi" onClose={() => setConfirmExit(false)}>
              <div className="rpg-result-card">
                <h2>Rút khỏi chuyến đi?</h2>
                <p>
                  Phần thưởng các tầng đã nhận vẫn được giữ. Màn đang đánh sẽ
                  bắt đầu lại lần sau.
                </p>
                <div className="rpg-choice-actions">
                  <button type="button" onClick={() => setConfirmExit(false)}>
                    Tiếp tục trận
                  </button>
                  <button type="button" onClick={closeRun}>
                    Rút lui
                  </button>
                </div>
              </div>
            </RpgModal>
          )}
        </main>
      ) : (
        <main className="rpg-home-screen">
          <div className="rpg-resource-bar">
            {(["coins", "experience", "books", "ore", "essence"] as const).map(
              (key) => (
                <span key={key}>
                  <small>{RESOURCE_NAMES[key]}</small>
                  <strong>{save.resources[key]}</strong>
                </span>
              ),
            )}
          </div>
          {tab !== "village" && (
            <nav className="rpg-tabs rpg-place-bar" aria-label="Địa điểm hiện tại">
              <button
                type="button"
                onClick={() => beginTransition("Trở về Làng Giao Ước", () => setTab("village"))}
              >
                ← Về làng
              </button>
              <strong>
                {tab === "campaign"
                  ? "Cổng Ký Ức"
                  : tab === "dungeon"
                    ? "Kho Sương"
                    : tab === "heroes"
                      ? "Nhà Giao Ước"
                      : "Đình Đèn"}
              </strong>
              <small>Muốn đổi chức năng, hãy trở về làng và đi tới địa điểm khác.</small>
            </nav>
          )}
          {tab === "village" && (
            <AdventureVillage
              save={save}
              quiet={quiet}
              onVisit={visitVillage}
            />
          )}
          {tab === "campaign" && (
            <section className="rpg-campaign-screen">
              <nav className="rpg-map-tabs" aria-label="Chọn map">
                {RPG_MAPS.map((m, i) => (
                  <button
                    type="button"
                    key={m.id}
                    className={mapIndex === i ? "is-selected" : ""}
                    onClick={() => setMapIndex(i)}
                  >
                    <b>{i + 1}</b>
                    <span>{m.name}</span>
                    <small>
                      {
                        m.stages.filter(
                          (_, j) => save.stars[`${m.id}-${j + 1}`],
                        ).length
                      }
                      /6
                    </small>
                  </button>
                ))}
              </nav>
              <section
                className="rpg-map-card"
                style={{
                  backgroundImage: `linear-gradient(90deg,#14292cee,#14292c20),url(${map.art})`,
                }}
              >
                <div>
                  <small>
                    CHƯƠNG {mapIndex + 1} · {map.subtitle}
                  </small>
                  <h1>{map.name}</h1>
                  <p>
                    {save.choices[map.id] === undefined
                      ? mapArc.hook
                      : mapArc.consequences[save.choices[map.id]][0].text}
                  </p>
                  <small className="rpg-story-arc">MẠCH TRUYỆN · {mapArc.title}</small>
                  <span>Đội hiện tại · Lực chiến {teamPower}</span>
                </div>
                <CharacterPortrait id={map.guide} decorative />
              </section>
              <div className="rpg-difficulty-chooser" role="group" aria-label="Độ khó Adventure">
                {(["normal", "hard", "extreme"] as const).map((mode) => (
                  <button type="button" key={mode} className={difficulty === mode ? "is-selected" : ""}
                    aria-pressed={difficulty === mode} onClick={() => setDifficulty(mode)}>
                    {mode.toUpperCase()} <small>Địch ×{mode === "extreme" ? 8 : mode === "hard" ? 3 : 1}</small>
                  </button>
                ))}
                <p>Thành tích lưu riêng từng chế độ. Hard/Extreme tăng HP, công và giáp của địch; tinh anh và boss thêm đòn rút năng lượng.</p>
              </div>
              <div className="rpg-stage-path">
                {map.stages.map((stage, i) => {
                  const id = `${map.id}-${i + 1}`,
                    open = stageUnlocked(save, id, difficulty),
                    clearedStars = difficulty === "normal" ? save.stars[id] : save.modeStars?.[`${difficulty}:${id}`]
                  return (
                    <button
                      type="button"
                      key={id}
                      className={`rpg-stage-node ${i === 5 ? "is-boss" : ""} ${
                        clearedStars ? "is-cleared" : ""
                      }`}
                      disabled={!open}
                      onClick={() => startStage(id)}
                    >
                      <span className="rpg-node-number">
                        {open ? (i === 5 ? "♛" : i + 1) : "🔒"}
                      </span>
                      <strong>{stage.name}</strong>
                      <small>Cấp gợi ý {rpgStage(id)!.level}</small>
                      <small>
                        {clearedStars
                          ? "★".repeat(clearedStars)
                          : i === 5
                            ? "BOSS · 4 đợt"
                            : "3 đợt"}
                      </small>
                    </button>
                  )
                })}
              </div>
              <div className="rpg-map-footer">
                {!!save.stars[`${map.id}-6`] && <button type="button" onClick={() => setStory({lines:[...mapArc.opening,...mapArc.turningPoint,...mapArc.finale,...mapArc.aftermath]})}>Đọc lại chương</button>}
                <button
                  type="button"
                  onClick={() =>
                    beginTransition("Đang tới Nhà Giao Ước", () => setTab("heroes"))
                  }
                >
                  Chuẩn bị đội →
                </button>
                <span>
                  5 màn nhỏ + 1 boss ·{" "}
                  {(difficulty === "normal" ? Object.values(save.stars) : Object.entries(save.modeStars ?? {}).filter(([key]) => key.startsWith(`${difficulty}:`)).map(([, stars]) => stars)).reduce((a, n) => a + n, 0)}/{RPG_MAPS.length * 6 * 3} sao
                </span>
              </div>
              {!!save.stars[`${map.id}-6`] && (
                <div className="rpg-map-choice">
                  <strong>Viết tiếp câu chuyện</strong>
                  {map.choices.map((choice, i) => (
                    <button
                      type="button"
                      key={choice}
                      aria-pressed={save.choices[map.id] === i}
                      onClick={() => {
                        if (act({
                          type: "choice",
                          mapId: map.id,
                          choice: i as 0 | 1,
                        })) setStory({lines:mapArc.consequences[i]})
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
          {tab === "dungeon" && (
            <section className="rpg-dungeon-screen">
              <div className="rpg-section-title">
                <div>
                  <small>FARM → NÂNG CẤP → VƯỢT MAP</small>
                  <h1>Kho tài nguyên ký ức</h1>
                  <p>
                    Không tốn vé vào. Nhận tài nguyên sau từng tầng, kể cả khi
                    rút lui. Địch tính theo cấp trung bình {formationAverage(save)} của đội mang vào, cộng độ khó bậc và tầng; giữ mức này suốt chuyến đi.
                  </p>
                </div>
                <label>
                  Độ khó
                  <select
                    value={tier}
                    onChange={(e) => setTier(Number(e.target.value))}
                  >
                    {[1, 2, 3].map((t) => (
                      <option
                        key={t}
                        value={t}
                        disabled={t > dungeonTierCap(save)}
                      >
                        Bậc {t}
                        {t > dungeonTierCap(save)
                          ? " · thắng thêm boss để mở"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="rpg-dungeon-grid">
                {RPG_DUNGEONS.map((d) => (
                  <article
                    key={d.id}
                    style={{
                      backgroundImage: `linear-gradient(0deg,#132e31f5,#132e3110),url(${d.art})`,
                    }}
                  >
                    <small>5 TẦNG · ĐỊCH CẤP {dungeonScaling(save,tier).baseLevel}–{Math.min(50,dungeonScaling(save,tier).baseLevel+4)} · BOSS TẦNG 5</small>
                    <h2>{d.name}</h2>
                    <strong>{d.resource}</strong>
                    <p>{d.text}</p>
                    <span>
                      Đã vượt: {save.dungeonClears[`${d.id}:${tier}`] ?? 0} lần
                    </span>
                    <button
                      type="button"
                      className="rpg-primary"
                      onClick={() =>
                        beginTransition(`Đang mở ${d.name}`, () =>
                          act({ type: "dungeon", kind: d.id, tier }),
                        )
                      }
                    >
                      Vào dungeon →
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
          {tab === "heroes" && (
            <section className="rpg-roster-screen">
              <div className="rpg-formation">
                {Array.from({ length: 5 }, (_, i) => {
                  const m = save.roster.find((h) => h.uid === save.formation[i])
                  return (
                    <button
                      key={i}
                      type="button"
                      className={slot === i ? "is-selected" : ""}
                      disabled={i > save.formation.length}
                      onClick={() => {
                        setSlot(i)
                        if (m) setSelected(m.uid)
                      }}
                    >
                      <small>
                        {i < 2 ? "Tuyến trước" : "Tuyến sau"} · {i + 1}
                      </small>
                      {m ? (
                        <>
                          <SpiritArt id={m.cardId} />
                          <strong>{CARD_MAP[m.cardId].name}</strong>
                          <span>Cấp {m.level}</span>
                        </>
                      ) : (
                        <b>＋</b>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="rpg-roster-intro">139 giao ước · Đủ 15/25/35/45 thẻ rương theo độ hiếm sẽ tự hội ngộ. Thẻ không bị tiêu hao; đội đồng hành và nhân vật cũ được giữ. Hiếm/Sử thi/Huyền thoại tăng 4%/8%/12% HP và công cơ bản; cấp, kỹ năng và trang bị vẫn quyết định sức mạnh.</p>
              <div className="rpg-resonance-summary">✧ {new Set(teamSchools).size >= 3 ? "Đa vị: +10 năng lượng đầu trận" : "Đa vị cần 3 hệ khác nhau"}{sharedSchool ? ` · ${SCHOOLS[sharedSchool].name}: +12 giáp cho nhóm cùng hệ` : " · Đồng vị cần 3 người cùng hệ"}</div>
              <div className="rpg-roster-layout">
                <aside>
                  <input
                    aria-label="Tìm Vị Linh"
                    placeholder="Tìm Vị Linh…"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <div className="rpg-roster-list">
                    {allRoster
                      .filter((m) =>
                        CARD_MAP[m.cardId].name
                          .toLocaleLowerCase("vi")
                          .includes(filter.toLocaleLowerCase("vi")),
                      )
                      .map((m) => (
                        <button
                          type="button"
                          key={m.uid}
                          className={hero.uid === m.uid ? "is-selected" : ""}
                          onClick={() => setSelected(m.uid)}
                        >
                          <SpiritArt id={m.cardId} />
                          <span>
                            <strong>{CARD_MAP[m.cardId].name}</strong>
                            <small>
                              {save.roster.some(h=>h.uid===m.uid) ? `Cấp ${m.level}` : `${cards[m.cardId]??0}/${SPIRIT_THRESHOLDS[SPIRIT_RARITY[m.cardId]]} thẻ`} · {SPIRIT_RARITY_NAMES[CARD_MAP[m.cardId].rarity]}
                            </small>
                          </span>
                          {save.formation.includes(m.uid) && <b>✓</b>}
                        </button>
                      ))}
                  </div>
                  <button
                    type="button"
                    className="rpg-primary"
                    disabled={locked}
                    onClick={putHero}
                  >
                    Đặt vào ô {slot + 1}
                  </button>
                </aside>
                <HeroDetails hero={hero} save={save} act={act} cards={cards} locked={locked} />
              </div>
            </section>
          )}
          {tab === "help" && (
            <section className="rpg-help-screen">
              <h1>Giao ước Vị Linh</h1>
              <p>
                Đi map để tìm lại ký ức, vào dungeon để farm, rồi nâng đội vượt
                boss tiếp theo.
              </p>
              <ModeIntroButton mode="adventure" />
              <div className="rpg-help-grid">
                <article><h2>Hội ngộ từ rương</h2><p>Mỗi rương thêm một thẻ Vị Linh. Cần 15/25/35/45 thẻ cùng người theo độ hiếm. Xem tiến độ và chọn Ước hẹn trong hồ sơ: mỗi 5 rương bảo đảm một thẻ đã chọn. Nhân vật đã có được giữ nguyên.</p></article>
                <article><h2>Video tuyệt kỹ</h2><p>Trận mới có đoạn phim riêng và âm thanh khi tung chiêu. Đồng hồ trận dừng trong phim; có thể dừng, bỏ qua hoặc tắt video để farm nhanh. Sử thi/Huyền thoại có hiệu ứng liên hương; Chân ước cần cấp 10, bậc 2, tuyệt kỹ cấp 3.</p></article>
                <article>
                  <h2>Đội 5 người</h2>
                  <p>
                    Hai ô đầu là tuyến trước, ba ô sau là tuyến sau. Đặt người
                    Giữ tuyến phía trước, Hồi phục và Pháp vị phía sau. Mỗi Vị
                    Linh có hai kỹ năng tự động, một tuyệt kỹ và một nội tại.
                  </p>
                </article>
                <article>
                  <h2>Canh nhịp kỹ năng</h2>
                  <p>
                    Đòn thường và kỹ năng cho năng lượng. Đầy 100: chạm tên nhân
                    vật để tung tuyệt kỹ. AUTO tự dùng tuyệt kỹ; tốc độ ×2 giúp
                    farm nhanh. Boss báo tuyến trước/sau trước 2 giây: che đúng
                    tuyến giảm 65% sát thương trong 3 giây, hồi sau 12 giây. Dệt sương hút năng lượng và giảm hồi phục; ưu tiên nó và người giữ sương. Tuyệt kỹ Hồi phục thanh tẩy Khóa hồi phục.
                  </p>
                </article>
                <article>
                  <h2>Nuôi nhân vật</h2>
                  <p>
                    Sổ KN cho 180 kinh nghiệm. Sách kỹ năng + xu nâng kỹ năng,
                    tối đa bằng cấp nhân vật và cấp 10. Kỹ năng thứ hai mở ở cấp
                    5; thăng bậc 2 mở nội tại. Quặng nâng ba ô trang bị; Tinh
                    hương dùng để thăng bậc. Cấp nhân vật tối đa 50.
                  </p>
                </article>
                <article>
                  <h2>Dungeon và số sao</h2>
                  <p>
                    Dungeon có 5 tầng, HP/năng lượng giữ qua trận. Tầng 2/4 chọn
                    hồi 40% HP hoặc +12% công; Canh Ấm hồi thêm 35%. Gục thì
                    không tự hồi ở tầng kế. Chiến dịch: thắng 1 sao, không ai
                    gục 2 sao, đủ người và dưới 90s được 3 sao. Thua không trừ
                    tài nguyên.
                  </p>
                </article>
                <article><h2>Liên hương & phản ứng</h2><p>{REACTION_HELP}</p></article>
                <article><h2>Chuẩn bị chiến thuật</h2><p>Vị Linh tự đánh kẻ địch gần nhất theo khoảng cách đội hình. Ba hệ khác nhau thêm 10 năng lượng đầu trận; ba Vị Linh cùng hệ thêm 12 giáp cho nhóm đó. Cấp 10 chọn hướng tuyệt kỹ Phá sương hoặc Dưỡng linh, đổi miễn phí ngoài chuyến đi.</p></article>
              </div>
              <p>
                {save.legacy.imported
                  ? `Đã chuyển ${save.legacy.discoveries} khám phá và ${save.legacy.badges.length} huy hiệu cũ. Cấp/KN các Vị Linh được giữ.`
                  : "Mở Rương vị giác để thu thập thẻ Vị Linh: 15/25/35/45 theo độ hiếm. Đủ mốc sẽ hội ngộ, không trừ thẻ; nhân vật cũ được giữ."}{" "}
                Canh Ấm ×{save.resources.broth} · Lá Tỉnh ×
                {save.resources.leaves} · Hương Ấn ×{save.resources.seals}. Bản
                lưu cũ vẫn được giữ trong sao lưu.
              </p>
            </section>
          )}
        </main>
      )}
      {notice && (
        <div className="rpg-toast" role="alert">
          {notice}
          <button type="button" aria-label="Đóng thông báo" onClick={dismiss}>
            ×
          </button>
        </div>
      )}
      {transition && (
        <AdventureTransition save={save} label={transition.label} quiet={quiet} />
      )}
      {story && (
        <StoryDialog
          key={story.start ?? story.lines[0].text}
          lines={story.lines}
          canSkip={!!story.start}
          onCancel={() => setStory(null)}
          onClose={() => {
            if (story.start)
              beginTransition("Vị Linh đang tiến vào chiến địa", () =>
                act({ type: "start", stageId: story.start!, difficulty: story.difficulty }),
              )
            setStory(null)
          }}
        />
      )}
    </div>
  )
}

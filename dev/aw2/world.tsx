import { WalkingStatus } from "./WalkingTarget"
import {
  planWalking,
  reachedWalkingTarget,
  walkingArrivalText,
  type WalkingTarget,
} from "../../src/aw2/world/walkingIntent"
import type { CollectionAction } from "../../src/aw2/collection/model"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Aw2DevSaveStore,
  Aw2SaveError,
  type RecoveryInspection,
} from "../../src/aw2/save/store"
import type { SaveSnapshot } from "../../src/aw2/save/schema"
import { AW2_SAVE_STORAGE_KEYS } from "../../src/aw2/save/schema"
import { ROSTER } from "../../src/aw2/world/ids"
import { newWorldProgress, type WorldProgress } from "../../src/aw2/world/model"
import { zoneById, type WorldObject } from "../../src/aw2/world/maps"
import {
  applyWorldAction,
  describeObject,
  moveWorld,
  nearestObject,
  questLabel,
  currentObjective,
} from "../../src/aw2/world/rules"
import type { WorldBossEncounter } from "../../src/aw2/world/encounter"
import { WorldBattle } from "./WorldBattle"
import {
  WorldSceneHost,
  type WorldSceneHostHandle,
  type PreparedWorldScene,
} from "./WorldSceneHost"
import { mapReadyFor, type WorldMapReadiness } from "./worldCanvasTypes"
import { sceneId, sceneName, scenePosition } from "../../src/aw2/world/scene"
import { InventoryPanel } from "./InventoryPanel"
import { CHEST_RECEIPT, type EconomyAction } from "../../src/aw2/economy/model"
import { type Waypoint } from "../../src/aw2/world/navigation"
import {
  AW2_MODES,
  modeForPortal,
  type Aw2ModeId,
  type ModeEntry,
} from "../../src/aw2/modes/catalog"
import { Aw2ModeAdapter, type ModeVisit } from "../../src/aw2/modes/session"
import { ModeLobby } from "./ModeLobby"
import { worldKeyAction } from "../../src/aw2/world/controls"
import { JourneyGuide } from "./JourneyGuide"
import { DemoCompletion } from "./DemoCompletion"
import { PlaytestFeedback } from "./PlaytestFeedback"
import { WorldGame, type GamePanel } from "./WorldGame"
import {
  PagedCopy,
  trapPanelTab,
  type QuestViewState,
  PanelFrame,
  GamePartyPanel,
  GameQuestPanel,
  GamePlacesPanel,
} from "./GamePanels"
import { JourneyOverview } from "./JourneyOverview"
import { interactionTarget } from "../../src/aw2/world/placeGuidance"
import { RecipePanel } from "./RecipePanel"
import { RoomPracticePanel } from "./RoomPracticePanel"
import { canUseRoomPractice } from "../../src/aw2/modes/roomPractice"
import { PantryInspection } from "./PantryInspection"
import type { ZoneId } from "../../src/aw2/world/ids"
import "./styles.css"
import { prepareDestination } from "./prepareDestination"
import type { ScenePreparationProgress } from "../../src/aw2/assets/prepareScene"
import {
  advanceNpcLife,
  advanceNpcPatrol,
  facePatrolNpc,
  newNpcPatrol,
  PATROL_NPC_ID,
  pinNpcApproach,
  releaseNpcApproach,
  type NpcPatrolState,
} from "../../src/aw2/world/npcPatrol"
import {
  advanceStepPortals,
  newStepPortalLatch,
} from "../../src/aw2/world/stepPortals"
import { npcLifeClock } from "../../src/aw2/world/npcLife"

interface PendingPlaceInteraction {
  id: string
  scene: ReturnType<typeof sceneId>
  raw: string
}

interface ActiveWorldEncounter {
  run: WorldBossEncounter
  checkpointRaw: string
}
interface TravelProgress extends ScenePreparationProgress {
  destination: string
  phase: "loading" | "rendering" | "saving"
}

export function WorldPreview({ production = false }: { production?: boolean }) {
  const singleViewport =
    production || window.location.pathname.endsWith("/game.html")
  const [store] = useState(() => new Aw2DevSaveStore())
  const [snapshot, setSnapshot] = useState<SaveSnapshot>(() => store.load())
  const [recovery, setRecovery] = useState<RecoveryInspection>(() =>
    store.inspectRecovery(),
  )
  const [world, setWorld] = useState(() =>
    snapshot.status === "ready" ? snapshot.save.progress : newWorldProgress(),
  )
  const [dialogObject, setDialogObject] = useState<WorldObject | null>(null)
  const [patrol, setPatrol] = useState(() => newNpcPatrol(world.zoneId))
  const patrolRef = useRef(patrol)
  const patrolReady = useRef(false)
  const reducedMotion = useRef(false)
  const activeWindow = useRef(!document.hidden)
  const [busy, setBusy] = useState(false)
  const [travel, setTravel] = useState<TravelProgress | null>(null)
  const travelAbort = useRef<AbortController | null>(null)
  const sceneHost = useRef<WorldSceneHostHandle | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      travelAbort.current?.abort()
    }
  }, [])
  const [gamePanel, setGamePanel] = useState<GamePanel>("none")
  const [roomPracticeRetry, setRoomPracticeRetry] = useState(false)
  const deskReturnFocus = useRef(false)
  const [questPinned, setQuestPinned] = useState(true)
  const journalMemory = useRef<QuestViewState>({
    page: Math.min(world.questIndex, 3),
    tab: "objective",
    destination: 0,
  })
  const overviewMemory = useRef<ZoneId>(world.zoneId)
  useEffect(() => {
    journalMemory.current.page = Math.min(world.questIndex, 3)
    journalMemory.current.destination = 0
  }, [world.questIndex])
  const gamePanelRef = useRef(gamePanel)
  const queuedWalk = useRef<Waypoint | null>(null)
  const queuedInteraction = useRef<PendingPlaceInteraction | null>(null)
  gamePanelRef.current = gamePanel
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [mapEpoch, setMapEpoch] = useState(0)
  const [mapReadiness, setMapReadiness] = useState<WorldMapReadiness | null>(
    null,
  )
  const handleMapReady = useCallback((state: WorldMapReadiness) => {
    setMapReadiness(state)
  }, [])
  const [activeEncounter, setActiveEncounter] =
    useState<ActiveWorldEncounter | null>(null)
  const [activeMode, setActiveMode] = useState<ModeVisit | null>(null)
  const battleActive = useRef(false)
  battleActive.current = !!activeEncounter
  const [modeAdapter] = useState(
    () => new Aw2ModeAdapter(store, () => !battleActive.current),
  )
  const worldHeading = useRef<HTMLHeadingElement>(null)
  const worldMap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (gamePanel === "none" && deskReturnFocus.current) {
      deskReturnFocus.current = false
      worldMap.current?.focus({ preventScroll: true })
    }
  }, [gamePanel])
  const restoreModeFocus = useRef(false)
  const worldRef = useRef(world)
  const saved = useRef(snapshot)
  const keys = useRef(new Set<string>())
  const route = useRef<Waypoint[]>([])
  const stepPortalLatch = useRef(newStepPortalLatch(world))
  const [walkingTarget, setWalkingTarget] = useState<WalkingTarget | null>(null)
  const walkingRef = useRef(walkingTarget)
  walkingRef.current = walkingTarget
  const pending = useRef(false)
  const paused = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  worldRef.current = world
  saved.current = snapshot
  paused.current =
    !!dialogObject || !!activeEncounter || !!activeMode || gamePanel !== "none"
  patrolReady.current =
    snapshot.status === "ready" &&
    !busy &&
    !error &&
    !!mapReadiness?.ready &&
    mapReadiness.zoneId === world.zoneId &&
    mapReadiness.sceneId === sceneId(world) &&
    mapReadiness.leaderId === (world.partyIds[0] ?? "aw2-than")

  function publishPatrol(next: NpcPatrolState) {
    const prior = patrolRef.current
    if (
      Object.entries(next).every(
        ([key, value]) => value === Reflect.get(prior, key),
      )
    )
      return
    patrolRef.current = next
    setPatrol(next)
  }
  function releasePatrol() {
    publishPatrol(releaseNpcApproach(patrolRef.current))
  }

  function clearWalking() {
    route.current = []
    if (walkingRef.current) {
      walkingRef.current = null
      setWalkingTarget(null)
    }
  }
  function stopWalking() {
    const active = !!walkingRef.current || route.current.length > 0
    keys.current.clear()
    clearWalking()
    queuedWalk.current = null
    queuedInteraction.current = null
    releasePatrol()
    if (active) setMessage("Đã dừng đường đi.")
    worldMap.current?.focus({ preventScroll: true })
  }

  function openInteraction(id?: string) {
    clearWalking()
    if (
      pending.current ||
      paused.current ||
      saved.current.status !== "ready" ||
      !patrolReady.current
    )
      return
    keys.current.clear()
    clearWalking()
    const object = interactionTarget(worldRef.current, id, patrolRef.current)
    if (object) {
      if (object.id === PATROL_NPC_ID)
        publishPatrol(facePatrolNpc(worldRef.current, patrolRef.current))
      else releasePatrol()
      setDialogObject(object)
    } else {
      releasePatrol()
      setMessage("Đến gần một người, đồ vật hoặc cửa rồi nhấn E / Tương tác.")
    }
  }

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    const changedMotion = () => {
      reducedMotion.current = motion.matches
    }
    changedMotion()
    motion.addEventListener("change", changedMotion)
    const isNativeControl = (target: EventTarget | null) =>
      target instanceof Element &&
      !target.closest("[data-aw2-world-control]") &&
      !!target.closest(
        "button, a, input, textarea, select, summary, dialog, [contenteditable]:not([contenteditable='false']), [role='textbox']",
      )
    const down = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (
        singleViewport &&
        event.key.toLowerCase() === "j" &&
        !event.repeat &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !pending.current &&
        saved.current.status === "ready" &&
        (!paused.current || gamePanelRef.current !== "none") &&
        !(
          event.target instanceof Element &&
          event.target.closest(
            "input, textarea, select, [contenteditable='true']",
          )
        )
      ) {
        event.preventDefault()
        keys.current.clear()
        clearWalking()
        queuedWalk.current = null
        queuedInteraction.current = null
        releasePatrol()
        setGamePanel((panel) => (panel === "quest" ? "none" : "quest"))
        return
      }
      if (
        event.key === "Escape" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        walkingRef.current &&
        !paused.current &&
        !pending.current &&
        patrolReady.current &&
        !isNativeControl(event.target)
      ) {
        event.preventDefault()
        stopWalking()
        return
      }
      const action = worldKeyAction(event.key, {
        enabled:
          saved.current.status === "ready" &&
          !paused.current &&
          !pending.current &&
          patrolReady.current,
        nativeControl: isNativeControl(event.target),
        modified: event.ctrlKey || event.metaKey || event.altKey,
        repeat: event.repeat,
      })
      if (!action) return
      event.preventDefault()
      if (action.type === "interact") openInteraction()
      else {
        releasePatrol()
        clearWalking()
        keys.current.add(action.key)
      }
    }
    const up = (event: KeyboardEvent) =>
      keys.current.delete(event.key.toLowerCase())
    const stop = () => {
      keys.current.clear()
      clearWalking()
      releasePatrol()
    }
    const focused = (event: FocusEvent) => {
      if (isNativeControl(event.target)) stop()
    }
    const blur = () => {
      activeWindow.current = false
      stop()
    }
    const focus = () => {
      activeWindow.current = !document.hidden
    }
    const visibility = () => {
      activeWindow.current = !document.hidden
      stop()
    }
    let lifeAccumulator = 0
    const timer = window.setInterval(() => {
      const clockPaused =
        paused.current ||
        pending.current ||
        !patrolReady.current ||
        !activeWindow.current
      let nextPatrol = advanceNpcPatrol(
        worldRef.current,
        patrolRef.current,
        33,
        { paused: clockPaused, reduced: reducedMotion.current },
      )
      if (clockPaused || reducedMotion.current) lifeAccumulator = 0
      else {
        lifeAccumulator += 33
        if (lifeAccumulator >= 500) {
          nextPatrol = advanceNpcLife(nextPatrol, lifeAccumulator)
          lifeAccumulator = 0
        }
      }
      publishPatrol(nextPatrol)
      if (
        paused.current ||
        pending.current ||
        saved.current.status !== "ready" ||
        !patrolReady.current ||
        !activeWindow.current
      )
        return
      const held = (a: string, b: string) =>
        Number(keys.current.has(a) || keys.current.has(b))
      const point = route.current[0]
      const position = scenePosition(worldRef.current)
      const distance = point
        ? Math.hypot(point.x - position.x, point.y - position.y)
        : 0
      const next = moveWorld(
        worldRef.current,
        point
          ? point.x - position.x
          : held("d", "arrowright") - held("a", "arrowleft"),
        point
          ? point.y - position.y
          : held("s", "arrowdown") - held("w", "arrowup"),
        point ? Math.min(0.033, distance / 140) : 0.033,
      )
      const step = advanceStepPortals(
        worldRef.current,
        next,
        stepPortalLatch.current,
      )
      stepPortalLatch.current = step.latch
      if (point && distance <= 140 * 0.033) {
        route.current.shift()
        if (!route.current.length && walkingRef.current) {
          const completed = walkingRef.current
          clearWalking()
          setMessage(
            reachedWalkingTarget(next, completed)
              ? walkingArrivalText(completed)
              : "Đường đi bị gián đoạn. Hãy chọn lại điểm đến.",
          )
        }
      }
      if (step.portal) {
        const open = describeObject(next, step.portal).actions.some(
          (action) => action.id === "travel",
        )
        keys.current.clear()
        clearWalking()
        worldRef.current = next
        setWorld(next)
        if (open) {
          void startStepTravel(next, step.portal)
          return
        }
        setMessage("Cửa đang khóa. Nhấn E / Tương tác để xem điều kiện mở.")
      } else if (next !== worldRef.current) {
        worldRef.current = next
        setWorld(next)
      }
    }, 33)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", blur)
    window.addEventListener("focus", focus)
    window.addEventListener("focusin", focused)
    document.addEventListener("visibilitychange", visibility)
    const changed = (event: StorageEvent) => {
      if (
        event.key === null ||
        AW2_SAVE_STORAGE_KEYS.some((key) => key === event.key)
      ) {
        stop()
        setRecovery({ status: "none" })
        setRoomPracticeRetry(false)
        setError(
          "Kho AW2 đã thay đổi ở tab khác. Đọc lại trước khi tiếp tục lưu.",
        )
      }
    }
    window.addEventListener("storage", changed)
    return () => {
      clearInterval(timer)
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", blur)
      window.removeEventListener("focus", focus)
      window.removeEventListener("focusin", focused)
      document.removeEventListener("visibilitychange", visibility)
      motion.removeEventListener("change", changedMotion)
      window.removeEventListener("storage", changed)
    }
  }, [])

  useEffect(() => {
    if (
      walkingRef.current &&
      (busy ||
        paused.current ||
        error ||
        !mapReadyFor(mapReadiness, world) ||
        walkingRef.current.sceneId !== sceneId(world))
    ) {
      clearWalking()
    }
  }, [
    busy,
    error,
    gamePanel,
    dialogObject,
    activeMode,
    activeEncounter,
    mapReadiness,
    world.zoneId,
    world.interior?.roomId,
  ])

  useEffect(() => {
    if (gamePanel !== "none" || !queuedInteraction.current) return
    const selected = queuedInteraction.current
    queuedInteraction.current = null
    if (
      busy ||
      dialogObject ||
      error ||
      saved.current.status !== "ready" ||
      selected.raw !== saved.current.raw ||
      selected.scene !== sceneId(worldRef.current) ||
      !mapReadyFor(mapReadiness, worldRef.current)
    )
      return
    openInteraction(selected.id)
  }, [gamePanel, busy, dialogObject, error, mapReadiness])

  useEffect(() => {
    if (gamePanel !== "none" || !queuedWalk.current || busy || dialogObject)
      return
    const point = queuedWalk.current
    queuedWalk.current = null
    queuedInteraction.current = null
    if (
      error ||
      !mapReadiness?.ready ||
      mapReadiness.zoneId !== worldRef.current.zoneId ||
      mapReadiness.sceneId !== sceneId(worldRef.current) ||
      mapReadiness.leaderId !== (worldRef.current.partyIds[0] ?? "aw2-than")
    )
      return
    navigate(point)
    worldMap.current?.focus({ preventScroll: true })
  }, [gamePanel, busy, dialogObject, error, mapReadiness])

  useEffect(() => {
    if (dialogObject) {
      dialog.current?.showModal()
      closeButton.current?.focus()
    } else {
      releasePatrol()
      const wasOpen = dialog.current?.open
      dialog.current?.close()
      if (wasOpen) worldMap.current?.focus({ preventScroll: true })
    }
  }, [dialogObject])

  useEffect(() => {
    if (!activeMode && restoreModeFocus.current) {
      restoreModeFocus.current = false
      worldHeading.current?.focus()
    }
  }, [activeMode])

  function reread() {
    if (pending.current) return
    setGamePanel("none")
    setRoomPracticeRetry(false)
    queuedWalk.current = null
    queuedInteraction.current = null
    setMapReadiness(null)
    restoreModeFocus.current = !!activeMode
    modeAdapter.abandon()
    setActiveMode(null)
    setMapEpoch((epoch) => epoch + 1)
    keys.current.clear()
    clearWalking()
    setDialogObject(null)
    setActiveEncounter(null)
    const next = store.load()
    setRecovery(store.inspectRecovery())
    setSnapshot(next)
    saved.current = next
    if (next.status === "ready") {
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
    } else {
      worldRef.current = newWorldProgress()
      setWorld(worldRef.current)
    }
    stepPortalLatch.current = newStepPortalLatch(worldRef.current)
    publishPatrol(newNpcPatrol(worldRef.current.zoneId))
    setMessage("Đã đọc lại AW2.")
    setError("")
  }

  async function recover() {
    if (
      pending.current ||
      saved.current.status === "unavailable" ||
      recovery.status !== "available"
    )
      return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    clearWalking()
    setError("")
    setMessage("")
    try {
      const next = await store.recover(saved.current.raw, recovery.candidate)
      setSnapshot(next)
      setRecovery({ status: "none" })
      saved.current = next
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      setMapEpoch((epoch) => epoch + 1)
      stepPortalLatch.current = newStepPortalLatch(next.save.progress)
      publishPatrol(newNpcPatrol(next.save.progress.zoneId))
      setMessage("Đã phục hồi bản lưu AW2 đã được xác minh.")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Chưa phục hồi được AW2. Hãy đọc lại kho.",
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  async function enterMode(modeId: Aw2ModeId, entry: ModeEntry) {
    if (
      pending.current ||
      activeEncounter ||
      activeMode ||
      saved.current.status !== "ready"
    )
      return
    if (entry === "room-service" && !roomPracticeReady) return
    pending.current = true
    if (entry !== "room-service") setGamePanel("none")
    setRoomPracticeRetry(false)
    queuedWalk.current = null
    queuedInteraction.current = null
    setBusy(true)
    keys.current.clear()
    clearWalking()
    setError("")
    try {
      const started = await modeAdapter.enter(
        saved.current.raw,
        worldRef.current,
        modeId,
        entry,
      )
      setSnapshot(started.checkpoint)
      saved.current = started.checkpoint
      worldRef.current = started.checkpoint.save.progress
      setWorld(started.checkpoint.save.progress)
      setDialogObject(null)
      setGamePanel("none")
      setActiveMode(started.visit)
    } catch (cause) {
      setRoomPracticeRetry(
        entry === "room-service" &&
          cause instanceof Aw2SaveError &&
          cause.code === "write-failed",
      )
      setError(cause instanceof Error ? cause.message : "Chưa ghé được bàn.")
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  function returnFromMode() {
    try {
      const next = modeAdapter.returnToWorld()
      setSnapshot(next)
      setRecovery({ status: "none" })
      saved.current = next
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      restoreModeFocus.current = true
      setActiveMode(null)
      setMessage("Đã trở về hành trình.")
      setError("")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Đọc lại hành trình để tiếp tục.",
      )
    }
  }

  async function performTravel(
    expected: Extract<SaveSnapshot, { status: "ready" }>,
    source: WorldProgress,
    object: WorldObject,
    actionId: "travel" | "enter-room" | "leave-room",
  ) {
    const destination = applyWorldAction(source, object.id, actionId).state
    const abort = new AbortController()
    travelAbort.current = abort
    let release: (() => void) | undefined
    let prepared: PreparedWorldScene | undefined
    try {
      setTravel({
        destination: sceneName(destination),
        phase: "loading",
        completed: 0,
        total: 1,
      })
      release = await prepareDestination(
        destination,
        abort.signal,
        (progress) => {
          if (mounted.current)
            setTravel({
              ...progress,
              destination: sceneName(destination),
              phase: "loading",
            })
        },
      )
      if (!mounted.current || abort.signal.aborted) {
        const error = Error("Đã hủy chuyển vùng.")
        error.name = "AbortError"
        throw error
      }
      setTravel((current) =>
        current ? { ...current, phase: "rendering" } : null,
      )
      if (!sceneHost.current) throw Error("Bản đồ hiện tại đã đóng.")
      prepared = await sceneHost.current.prepare(
        destination,
        expected.save.economy,
        abort.signal,
      )
      // Candidate owns its ambient lease and first frame before durable commit.
      release()
      release = undefined
      travelAbort.current = null
      setTravel((current) => (current ? { ...current, phase: "saving" } : null))
      const next = await store.act(
        expected.raw,
        source,
        object.id,
        actionId,
        prepared.assertReady,
      )
      if (!mounted.current) return
      prepared.activate()
      prepared = undefined
      saved.current = next
      setSnapshot(next)
      worldRef.current = next.save.progress
      stepPortalLatch.current = newStepPortalLatch(next.save.progress)
      setWorld(next.save.progress)
      setDialogObject(null)
      setMessage(`Đã tới ${sceneName(destination)}.`)
    } finally {
      travelAbort.current = null
      prepared?.dispose()
      release?.()
    }
  }

  async function startStepTravel(source: WorldProgress, object: WorldObject) {
    if (pending.current || saved.current.status !== "ready") return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    clearWalking()
    setError("")
    setMessage("")
    try {
      await performTravel(saved.current, source, object, "travel")
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError")
        setMessage("Đã hủy chuyển vùng. Vị trí và bản lưu được giữ nguyên.")
      else
        setError(
          "Chưa chuyển vùng; cảnh nguồn được giữ. " +
            (cause instanceof Error
              ? cause.message
              : "Thao tác chưa hoàn tất."),
        )
    } finally {
      setTravel(null)
      pending.current = false
      setBusy(false)
    }
  }

  async function persist(actionId?: string) {
    if (pending.current || saved.current.status === "unavailable") return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    clearWalking()
    setError("")
    setMessage("")
    try {
      if (
        actionId &&
        ["travel", "enter-room", "leave-room"].includes(actionId) &&
        dialogObject &&
        saved.current.status === "ready"
      ) {
        await performTravel(
          saved.current,
          worldRef.current,
          dialogObject,
          actionId as "travel" | "enter-room" | "leave-room",
        )
        return
      }
      if (
        (actionId === "challenge" || actionId === "rematch") &&
        saved.current.status === "ready"
      ) {
        const started = await store.beginBoss(
          saved.current.raw,
          worldRef.current,
          actionId === "rematch" ? "rematch" : "quest",
        )
        setSnapshot(started.snapshot)
        saved.current = started.snapshot
        worldRef.current = started.snapshot.save.progress
        setWorld(started.snapshot.save.progress)
        setDialogObject(null)
        setActiveEncounter({
          run: started.encounter,
          checkpointRaw: started.snapshot.raw,
        })
        return
      }
      const result =
        actionId && dialogObject
          ? applyWorldAction(worldRef.current, dialogObject.id, actionId)
          : { state: worldRef.current, message: "Đã lưu vị trí AW2." }
      const next =
        actionId && dialogObject && saved.current.status === "ready"
          ? await store.act(
              saved.current.raw,
              worldRef.current,
              dialogObject.id,
              actionId,
            )
          : await store.save(
              saved.current.raw,
              saved.current.status === "ready" ? result.state : undefined,
            )
      setSnapshot(next)
      setRecovery({ status: "none" })
      saved.current = next
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      setDialogObject(null)
      setMessage(result.message)
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError")
        setMessage("Đã hủy chuyển vùng. Vị trí và bản lưu được giữ nguyên.")
      else
        setError(
          (actionId === "travel"
            ? "Chưa chuyển vùng; cảnh nguồn được giữ. "
            : "") +
            (cause instanceof Error
              ? cause.message
              : "Thao tác chưa hoàn tất."),
        )
    } finally {
      setTravel(null)
      pending.current = false
      setBusy(false)
    }
  }
  async function transact(action: EconomyAction) {
    if (pending.current || saved.current.status !== "ready") return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    clearWalking()
    setError("")
    try {
      const next = await store.economyAction(
        saved.current.raw,
        worldRef.current,
        action,
      )
      setSnapshot(next)
      saved.current = next
      setWorld(next.save.progress)
      worldRef.current = next.save.progress
      setDialogObject(null)
      setMessage(
        {
          "claim-quests": "Đã nhận quà nhiệm vụ.",
          "open-chest": "Đã nhận nguyên liệu trong rương.",
          cook: "Đã nấu Chén cơm ấm.",
          "share-meal": "Bữa ăn được chia sẻ. Cả đội nhận 45 EXP.",
        }[action],
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa lưu được túi đồ.")
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  async function collect(action: CollectionAction) {
    if (pending.current || saved.current.status !== "ready") return
    pending.current = true
    setBusy(true)
    keys.current.clear()
    clearWalking()
    setError("")
    try {
      const next = await store.collectionAction(
        saved.current.raw,
        worldRef.current,
        action,
      )
      saved.current = next
      setSnapshot(next)
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      setDialogObject(null)
      setMessage(
        action.type === "recruit"
          ? "Đã mời Vị Linh. Hãy chọn và lưu đội hình nếu muốn đồng hành."
          : "Đã lưu đội hình và nhấn tuyệt kỹ cho trận tiếp theo.",
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chưa lưu được đội hình.",
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  function navigate(point: Waypoint) {
    if (
      pending.current ||
      paused.current ||
      saved.current.status !== "ready" ||
      !patrolReady.current
    )
      return
    keys.current.clear()
    clearWalking()
    const approach = pinNpcApproach(worldRef.current, patrolRef.current, point)
    publishPatrol(approach.patrol)
    const planned = planWalking(
      worldRef.current,
      approach.point,
      approach.patrol,
    )
    if (!planned) {
      releasePatrol()
      setMessage("Chọn một điểm trên lối đi.")
      return
    }
    if (reachedWalkingTarget(worldRef.current, planned.target)) {
      setMessage(walkingArrivalText(planned.target))
      return
    }
    route.current = planned.path
    walkingRef.current = planned.target
    setWalkingTarget(planned.target)
    setMessage("")
  }
  async function finishEncounter() {
    if (!activeEncounter || pending.current) return
    pending.current = true
    setBusy(true)
    setError("")
    try {
      const next = await store.finishBoss(
        activeEncounter.checkpointRaw,
        activeEncounter.run,
      )
      setSnapshot(next)
      saved.current = next
      worldRef.current = next.save.progress
      setWorld(next.save.progress)
      setActiveEncounter(null)
      setMessage(
        activeEncounter.run.snapshot().purpose === "rematch"
          ? "Đã về Phòng Bàn sau lượt đấu lại. Không nhận thưởng; kết thúc, đội hình và tiến trình được giữ nguyên."
          : next.save.progress.bossDefeated
            ? "Đã lưu chiến thắng. Đọc ghi chép bên chén rồi trở về Bà Giữ Chỗ."
            : "Đã về Sân. Tiến trình được giữ, có thể thử lại.",
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chưa lưu được kết quả.",
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  if (activeEncounter)
    return (
      <WorldBattle
        compact={singleViewport}
        encounter={activeEncounter.run}
        busy={busy}
        error={error}
        onFinish={() => void finishEncounter()}
        onReread={reread}
      />
    )
  if (activeMode)
    return (
      <ModeLobby
        compact={singleViewport}
        visit={activeMode}
        error={error}
        onReturn={returnFromMode}
        onReread={reread}
      />
    )
  const description = dialogObject ? describeObject(world, dialogObject) : null
  const interactionDialog = (
    <dialog
      ref={dialog}
      aria-labelledby="interaction-title"
      onKeyDown={
        singleViewport ||
        dialogObject?.kind === "stock" ||
        dialogObject?.kind.startsWith("room")
          ? trapPanelTab
          : undefined
      }
      onCancel={(event) => {
        event.preventDefault()
        if (travel && travel.phase !== "saving") travelAbort.current?.abort()
        else if (!pending.current) setDialogObject(null)
      }}
    >
      <h2 id="interaction-title">
        {dialogObject?.kind === "stock" ? "Kiểm kho" : description?.title}
      </h2>
      {dialogObject?.kind === "stock" && snapshot.status === "ready" ? (
        <PantryInspection
          world={world}
          economy={snapshot.save.economy}
          disabled={
            busy ||
            !!error ||
            !mapReadiness?.ready ||
            mapReadiness.zoneId !== world.zoneId ||
            mapReadiness.sceneId !== sceneId(world) ||
            mapReadiness.leaderId !== (world.partyIds[0] ?? "aw2-than")
          }
          onWalk={(point) => {
            if (
              pending.current ||
              error ||
              !mapReadiness?.ready ||
              mapReadiness.zoneId !== world.zoneId ||
              mapReadiness.sceneId !== sceneId(world)
            )
              return
            keys.current.clear()
            clearWalking()
            queuedWalk.current = point
            setDialogObject(null)
          }}
        />
      ) : singleViewport ? (
        <PagedCopy text={description?.text ?? ""} />
      ) : (
        <p>{description?.text}</p>
      )}
      <div className="actions">
        <button
          ref={closeButton}
          onClick={() => setDialogObject(null)}
          disabled={busy}
        >
          Để sau / Đóng
        </button>
        {dialogObject?.kind === "chest" && snapshot.status === "ready" && (
          <button
            disabled={
              busy || snapshot.save.economy.receipts.includes(CHEST_RECEIPT)
            }
            onClick={() => void transact("open-chest")}
          >
            {snapshot.save.economy.receipts.includes(CHEST_RECEIPT)
              ? "Đã nhận rương"
              : "Mở rương nguyên liệu"}
          </button>
        )}
        {description?.actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              if (
                action.id.startsWith("view-") &&
                world.interior &&
                mapReadyFor(mapReadiness, world) &&
                !pending.current &&
                !error
              ) {
                keys.current.clear()
                clearWalking()
                queuedWalk.current = null
                queuedInteraction.current = null
                deskReturnFocus.current = true
                dialog.current?.close()
                setDialogObject(null)
                setGamePanel(
                  action.id === "view-party"
                    ? "party"
                    : action.id === "view-journal"
                      ? "quest"
                      : action.id === "view-practice"
                        ? "practice"
                        : "recipe",
                )
                return
              }
              const mode = dialogObject && modeForPortal(dialogObject.id)
              if (action.id === "visit-mode" && mode)
                void enterMode(mode.id, "portal")
              else void persist(action.id)
            }}
            disabled={
              busy ||
              (action.id.startsWith("view-") &&
                (!mapReadyFor(mapReadiness, world) || !!error))
            }
          >
            {action.id === "travel" && error
              ? "Thử lại chuyển vùng"
              : ["enter-room", "leave-room"].includes(action.id) && error
                ? `${action.label} · thử lại`
                : action.label}
          </button>
        ))}
      </div>
      {travel && (
        <div
          className="aw2-travel-progress"
          data-testid="travel-progress"
          role="status"
          aria-live="polite"
        >
          <p>
            {travel.phase === "saving"
              ? "Đang ghi điểm đến…"
              : travel.phase === "rendering"
                ? `Đang mở bản đồ ${travel.destination}…`
                : `Đang chuẩn bị ${travel.destination}…`}
          </p>
          <progress
            aria-label="Tải cảnh đích"
            value={travel.completed}
            max={travel.total}
          />
          <small>
            {travel.completed}/{travel.total}
          </small>
          <button
            type="button"
            disabled={travel.phase === "saving"}
            onClick={() => travelAbort.current?.abort()}
          >
            Hủy chuyển vùng
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </dialog>
  )
  function inspectPlace(id: string) {
    if (!navigationReady || saved.current.status !== "ready") return
    if (!interactionTarget(worldRef.current, id, patrolRef.current)) return
    keys.current.clear()
    clearWalking()
    queuedWalk.current = null
    queuedInteraction.current = {
      id,
      scene: sceneId(worldRef.current),
      raw: saved.current.raw,
    }
    deskReturnFocus.current = true
    setGamePanel("none")
  }
  const nearby = nearestObject(world, patrol)
  const roomPracticeReady =
    snapshot.status === "ready" &&
    !busy &&
    mapReadyFor(mapReadiness, world) &&
    canUseRoomPractice(world) &&
    (!error || roomPracticeRetry)
  const navigationReady =
    snapshot.status === "ready" &&
    !busy &&
    !error &&
    !dialogObject &&
    !!mapReadiness?.ready &&
    mapReadiness.zoneId === world.zoneId &&
    mapReadiness.sceneId === sceneId(world) &&
    mapReadiness.leaderId === (world.partyIds[0] ?? "aw2-than")
  const classicPanel =
    !singleViewport && snapshot.status === "ready" && gamePanel !== "none" ? (
      <PanelFrame
        title={
          gamePanel === "places"
            ? "Địa điểm trong vùng"
            : gamePanel === "atlas"
              ? "Bản đồ hành trình"
              : gamePanel === "practice"
                ? "Bàn luyện tập trong tiệm trà"
                : gamePanel === "party"
                  ? "Đội đồng hành"
                  : gamePanel === "recipe"
                    ? "Công thức bên bàn trà"
                    : "Nhật ký nhiệm vụ"
        }
        busy={busy}
        onClose={() => setGamePanel("none")}
      >
        {gamePanel === "practice" ? (
          <RoomPracticePanel
            busy={busy}
            canEnter={roomPracticeReady}
            error={error}
            onEnter={(mode) => void enterMode(mode, "room-service")}
            onReread={reread}
          />
        ) : gamePanel === "places" ? (
          <GamePlacesPanel
            economy={snapshot.save.economy}
            world={world}
            patrol={patrol}
            canWalk={navigationReady}
            onInspect={inspectPlace}
            onWalk={(point) => {
              queuedWalk.current = point
              setGamePanel("none")
            }}
          />
        ) : gamePanel === "atlas" ? (
          <JourneyOverview
            world={world}
            canWalk={navigationReady}
            memory={overviewMemory}
            onWalk={(point) => {
              queuedWalk.current = point
              setGamePanel("none")
            }}
          />
        ) : gamePanel === "party" ? (
          <GamePartyPanel
            save={snapshot.save}
            busy={busy}
            onAction={(action) => void collect(action)}
          />
        ) : gamePanel === "recipe" ? (
          <RecipePanel economy={snapshot.save.economy} />
        ) : (
          <GameQuestPanel
            memory={journalMemory}
            save={snapshot.save}
            world={world}
            patrol={patrol}
            canWalk={navigationReady}
            pinned={questPinned}
            onPin={() => setQuestPinned((value) => !value)}
            onWalk={(point) => {
              queuedWalk.current = point
              setGamePanel("none")
            }}
          />
        )}
      </PanelFrame>
    ) : null
  if (singleViewport)
    return (
      <WorldGame
        production={production}
        pinned={questPinned}
        onPin={() => setQuestPinned((value) => !value)}
        journalMemory={journalMemory}
        overviewMemory={overviewMemory}
        snapshot={snapshot}
        world={world}
        patrol={patrol}
        panel={gamePanel}
        busy={busy}
        error={error}
        message={message}
        mapRef={worldMap}
        headingRef={worldHeading}
        canWalk={navigationReady}
        walkTarget={walkingTarget}
        onStopWalking={stopWalking}
        map={
          snapshot.status === "ready" ? (
            <WorldSceneHost
              ref={sceneHost}
              focusRef={worldMap}
              key={`${snapshot.save.saveId}:${mapEpoch}`}
              world={world}
              patrol={patrol}
              economy={snapshot.save.economy}
              walkTarget={walkingTarget}
              onNavigate={navigate}
              paused={busy || !!dialogObject || gamePanel !== "none"}
              onReadyChange={handleMapReady}
            />
          ) : null
        }
        dialog={interactionDialog}
        onPanel={(panel) => {
          if (panel === "places" || panel === "atlas")
            deskReturnFocus.current = true
          releasePatrol()
          keys.current.clear()
          clearWalking()
          queuedWalk.current = null
          queuedInteraction.current = null
          setGamePanel(panel)
        }}
        onWalk={(point) => {
          if (!navigationReady) return
          keys.current.clear()
          clearWalking()
          queuedWalk.current = point
          setGamePanel("none")
        }}
        onHold={(key, down) => {
          if (!down) {
            keys.current.delete(key)
            return
          }
          if (paused.current || !navigationReady) return
          releasePatrol()
          clearWalking()
          keys.current.add(key)
        }}
        onStep={(key) => {
          if (paused.current || !navigationReady) return
          releasePatrol()
          clearWalking()
          const next = moveWorld(
            worldRef.current,
            key === "d" ? 1 : key === "a" ? -1 : 0,
            key === "s" ? 1 : key === "w" ? -1 : 0,
            0.05,
          )
          worldRef.current = next
          setWorld(next)
        }}
        onInteract={() => openInteraction()}
        onInspect={inspectPlace}
        onSave={() => void persist()}
        onReread={reread}
        recoveryAvailable={recovery.status === "available"}
        onRecover={() => void recover()}
        onEconomy={(action) => void transact(action)}
        onCollection={(action) => void collect(action)}
        onMode={(mode) => void enterMode(mode, "quick-entry")}
        canEnterRoomPractice={roomPracticeReady}
        onRoomPractice={(mode) => void enterMode(mode, "room-service")}
      />
    )
  return (
    <main className="aw2-save aw2-world">
      <p className="eyebrow">SOUL OF MEAL · RPG · BẢN PHÁT TRIỂN</p>
      <h1 ref={worldHeading} tabIndex={-1}>
        Đường qua Phố Đèn Lồng
      </h1>
      <p>
        Chạm lên lối đi hoặc dùng WASD/mũi tên; E để tương tác. Cùng năm Vị Linh
        tìm lại một lời mời bên bếp.
      </p>
      <p>
        <a href="/dev/aw2/index.html">Kho save / xác nhận reset AW2</a> ·{" "}
        <a href="/dev/aw2/starters.html">Năm starter · xem bộ chuyển động</a>
      </p>
      {snapshot.status === "empty" && recovery.status !== "available" ? (
        <button onClick={() => void persist()} disabled={busy}>
          Tạo bản lưu AW2
        </button>
      ) : snapshot.status !== "ready" ? (
        <section>
          <p role="alert">
            {snapshot.status === "empty"
              ? "Bản lưu chính đang trống nhưng có bản an toàn có thể phục hồi."
              : `Chưa mở được save (${snapshot.status}). Dữ liệu gốc được giữ; đọc lại hoặc mở kho save.`}
          </p>
          <div className="actions">
            <button onClick={reread} disabled={busy}>
              Đọc lại
            </button>
            {recovery.status === "available" && (
              <button onClick={() => void recover()} disabled={busy}>
                Phục hồi bản an toàn
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          <DemoCompletion
            save={snapshot.save}
            busy={busy}
            onPractice={(mode) => void enterMode(mode, "quick-entry")}
          />
          <h2 data-testid="zone-name">{sceneName(world)}</h2>
          <p data-testid="npc-life-clock">
            Nhịp sống: {npcLifeClock(patrol.lifeMs).label}
          </p>
          <nav className="actions aw2-mode-menu" aria-label="Ghé bàn nhanh">
            {AW2_MODES.map((mode) => (
              <button
                key={mode.id}
                disabled={busy}
                onClick={() => void enterMode(mode.id, "quick-entry")}
              >
                Ghé nhanh {mode.name}
              </button>
            ))}
          </nav>
          <nav className="actions" aria-label="Khám phá địa điểm">
            <button
              disabled={!navigationReady}
              onClick={() => {
                deskReturnFocus.current = true
                setGamePanel("places")
              }}
            >
              Địa điểm trong vùng
            </button>
            <button
              disabled={!navigationReady}
              onClick={() => {
                deskReturnFocus.current = true
                setGamePanel("atlas")
              }}
            >
              Bản đồ hành trình
            </button>
          </nav>
          <JourneyGuide
            objective={currentObjective(world)}
            world={world}
            patrol={patrol}
            disabled={
              busy ||
              !!dialogObject ||
              !!error ||
              !mapReadiness?.ready ||
              mapReadiness.zoneId !== world.zoneId ||
              mapReadiness.sceneId !== sceneId(world) ||
              mapReadiness.leaderId !== (world.partyIds[0] ?? "aw2-than")
            }
            onNavigate={(point) => {
              navigate(point)
              worldMap.current?.focus({ preventScroll: true })
            }}
          />
          <WorldSceneHost
            ref={sceneHost}
            focusRef={worldMap}
            key={`${snapshot.save.saveId}:${mapEpoch}`}
            world={world}
            patrol={patrol}
            economy={snapshot.save.economy}
            walkTarget={walkingTarget}
            walkControls={
              <WalkingStatus target={walkingTarget} onStop={stopWalking} />
            }
            onNavigate={navigate}
            paused={busy || !!dialogObject || gamePanel !== "none"}
            onReadyChange={handleMapReady}
          />
          <p data-testid="player-position">
            Vị trí {scenePosition(world).x.toFixed(0)},{" "}
            {scenePosition(world).y.toFixed(0)} · {scenePosition(world).facing}
          </p>
          <p data-testid="quest-status">
            Nhiệm vụ: {questLabel(world)} ·{" "}
            {world.questIndex === 4
              ? "Đã hoàn tất"
              : world.accepted
                ? "Đang nhận"
                : "Chưa nhận"}
            ; ký ức {world.memories.length}/3; puzzle {world.puzzleStep}/3
          </p>
          {world.questIndex >= 3 && (
            <p data-testid="boss-objectives">
              Thử thách: {world.bossDefeated ? "Đã thắng" : "Chưa thắng"} · Ghi
              chép: {world.tableNoteRead ? "Đã đọc" : "Chưa đọc"}
            </p>
          )}
          <p data-testid="party">
            Đội ({world.partyIds.length}/5):{" "}
            {world.partyIds
              .map(
                (id) =>
                  ROSTER.find((spirit) => spirit.spiritId === id)!.displayName,
              )
              .join(", ") || "Nhận sau nhập môn"}
          </p>
          <div className="actions" aria-label="Điều khiển di chuyển">
            {[
              ["w", "↑ Lên"],
              ["a", "← Trái"],
              ["s", "↓ Xuống"],
              ["d", "→ Phải"],
            ].map(([key, label]) => (
              <button
                key={key}
                data-aw2-world-control="move"
                disabled={busy}
                style={{ touchAction: "none" }}
                onPointerDown={(event) => {
                  releasePatrol()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  clearWalking()
                  keys.current.add(key)
                }}
                onPointerUp={() => keys.current.delete(key)}
                onPointerCancel={() => keys.current.delete(key)}
                onLostPointerCapture={() => keys.current.delete(key)}
                onClick={(event) => {
                  if (event.detail !== 0 || pending.current || paused.current)
                    return
                  releasePatrol()
                  clearWalking()
                  const next = moveWorld(
                    worldRef.current,
                    key === "d" ? 1 : key === "a" ? -1 : 0,
                    key === "s" ? 1 : key === "w" ? -1 : 0,
                    0.05,
                  )
                  worldRef.current = next
                  setWorld(next)
                }}
              >
                {label}
              </button>
            ))}
            <button
              data-aw2-world-control="interact"
              onClick={() => openInteraction()}
              disabled={busy}
            >
              Tương tác{nearby ? ` · ${nearby.name}` : ""}
            </button>
            <button onClick={() => void persist()} disabled={busy}>
              Lưu vị trí
            </button>
          </div>
          <details className="aw2-bag-panel">
            <summary>
              Đội và túi đồ · {snapshot.save.economy.teamExperience} EXP
            </summary>
            <InventoryPanel
              save={snapshot.save}
              world={world}
              busy={busy}
              onAction={(action) => void transact(action)}
              onCollectionAction={(action) => void collect(action)}
            />
          </details>
        </>
      )}
      <div className="actions">
        <button onClick={reread} disabled={busy}>
          Đọc lại
        </button>
      </div>
      <p role="status">{busy ? "Đang lưu…" : message}</p>
      {error && <p role="alert">{error}</p>}
      <PlaytestFeedback snapshot={snapshot} busy={busy} />
      {interactionDialog}
      {classicPanel}
    </main>
  )
}

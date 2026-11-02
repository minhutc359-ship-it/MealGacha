import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import { Aw2DevSaveStore } from "../../src/aw2/save/store"
import { Aw2ModeAdapter, type ModeVisit } from "../../src/aw2/modes/session"
import type { Aw2ModeId } from "../../src/aw2/modes/catalog"
import { ZONES } from "../../src/aw2/world/maps"
import { GamePartyPanel, PanelFrame } from "./GamePanels"
import { ModeLobby } from "./ModeLobby"
import { BattleCanvas } from "./BattleCanvas"
import {
  createCombatBattle,
  advanceCombatBattle,
  createCombatPresentation,
  reduceCombatPresentation,
} from "../../src/aw2/combat"
import { createForgottenHostSeed } from "../../src/aw2/combat/forgottenHost"
import "./styles.css"
import "./game.css"

// Deliberately isolated QA memory: never reads localStorage or weakens production Web Locks.
const memory = new Map<string, string>()
let queue = Promise.resolve()
const store = new Aw2DevSaveStore({
  storage: () => ({
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value)
    },
    removeItem: (key) => {
      memory.delete(key)
    },
  }),
  lock: <T,>(action: () => T): Promise<T> => {
    const next = queue.then(action)
    queue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  },
  newId: () => "00000000-0000-4000-8000-000000000019",
})
let initial = await store.save(null)
for (const [id, command] of [
  ["aw2-npc-giu-cho", "accept"],
  ["aw2-object-village-table", "inspect"],
  ["aw2-npc-giu-cho", "turn-in"],
]) {
  const object = ZONES[0].objects.find((o) => o.id === id)!
  initial = await store.act(
    initial.raw,
    { ...initial.save.progress, x: object.x, y: object.y },
    id,
    command,
  )
}
function BossLab({ onReturn }: { onReturn: () => void }) {
  const [reduced, setReduced] = useState(false)
  const [battle, setBattle] = useState(() =>
    createCombatBattle({
      id: "boss-source-qa",
      players: [0, 1, 2].map((i) => ({
        id: `qa-player-${i}`,
        spiritId: "aw2-than",
        hp: 50000,
        maxHp: 50000,
        position: 50,
        nextBasicTick: 999,
        nextAutoTick: 999,
      })),
      enemies: [{ ...createForgottenHostSeed(), position: 50 }],
    }),
  )
  return (
    <main className="aw2-save">
      <h1>QA · Boss không phần thưởng</h1>
      <p>
        Luật và renderer thật, bộ nhớ tạm; không có save hoặc quyền nhận thưởng.
        Tick {battle.tick}.
      </p>
      <div className="actions">
        <button onClick={() => setBattle((b) => advanceCombatBattle(b))}>
          Bước boss 1 nhịp
        </button>
        <button onClick={() => setReduced((v) => !v)}>
          {reduced ? "Bật chuyển động" : "Giảm chuyển động"}
        </button>
        <button onClick={onReturn}>Về QA</button>
      </div>
      <BattleCanvas
        battle={battle}
        presentation={reduceCombatPresentation(
          createCombatPresentation(),
          battle.events,
        )}
        reducedMotion={reduced}
      />
    </main>
  )
}
function FreePlayLab() {
  const [boss, setBoss] = useState(false)
  const [saved, setSaved] = useState(initial),
    [adapter] = useState(() => new Aw2ModeAdapter(store))
  const [visit, setVisit] = useState<ModeVisit | null>(null),
    [party, setParty] = useState(false)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const action = async (operation: () => Promise<typeof initial>) => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      setSaved(await operation())
    } catch (e) {
      setError(e instanceof Error ? e.message : "QA failed")
    } finally {
      setBusy(false)
    }
  }
  const enter = async (mode: Aw2ModeId) => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const entered = await adapter.enter(
        saved.raw,
        saved.save.progress,
        mode,
        "quick-entry",
      )
      setSaved(entered.checkpoint)
      setVisit(entered.visit)
    } catch (e) {
      setError(e instanceof Error ? e.message : "QA failed")
    } finally {
      setBusy(false)
    }
  }
  if (boss) return <BossLab onReturn={() => setBoss(false)} />
  if (visit)
    return (
      <ModeLobby
        compact
        visit={visit}
        run={adapter.currentRun()}
        progress={saved.save.modes}
        busy={busy}
        completed={adapter.isComplete()}
        error={error}
        onComplete={() => void action(() => adapter.complete())}
        onReturn={() => {
          if (busy) return
          try {
            setSaved(adapter.returnToWorld())
            setVisit(null)
          } catch (e) {
            setError(String(e))
          }
        }}
        onReread={() => {
          if (busy) return
          adapter.abandon()
          setVisit(null)
          const current = store.load()
          if (current.status === "ready") setSaved(current)
        }}
      />
    )
  return (
    <main className="aw2-save">
      <h1>QA · Chơi miễn phí</h1>
      <p>
        Bộ nhớ tạm trong trang; tải lại bỏ phiên thử. Không đọc hoặc sửa save
        của người chơi. Nhiệm vụ đầu đã chạy bằng luật thật.
      </p>
      <p>
        Schema {saved.save.schemaVersion} · revision {saved.save.revision} · vé{" "}
        {saved.save.summons.tickets} · TCG {saved.save.modes.tcg.bestStage}/3 ·
        Chess {saved.save.modes["auto-chess"].bestStage}/3
      </p>
      <div className="actions">
        <button disabled={busy} onClick={() => setParty(true)}>
          Đội & triệu hồi
        </button>
        <button disabled={busy} onClick={() => void enter("tcg")}>
          TCG
        </button>
        <button disabled={busy} onClick={() => void enter("auto-chess")}>
          Auto Chess
        </button>
        <button disabled={busy} onClick={() => setBoss(true)}>
          Boss · chỉ kiểm tra hình
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {party && (
        <PanelFrame title="Đội" busy={busy} onClose={() => setParty(false)}>
          <GamePartyPanel
            save={saved.save}
            busy={busy}
            onAction={(command) =>
              void action(() =>
                store.collectionAction(saved.raw, saved.save.progress, command),
              )
            }
            onSummon={(command) =>
              void action(() =>
                store.summonAction(saved.raw, saved.save.progress, command),
              )
            }
          />
        </PanelFrame>
      )}
    </main>
  )
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FreePlayLab />
  </React.StrictMode>,
)

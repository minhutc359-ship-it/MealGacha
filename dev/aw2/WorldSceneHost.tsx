import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react"
import { ScenePreflight } from "../../src/aw2/assets/scenePreflight"
import { newNpcPatrol } from "../../src/aw2/world/npcPatrol"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Economy } from "../../src/aw2/economy/model"
import { WorldCanvas } from "./WorldCanvas"
import type { WorldCanvasProps, WorldMapReadiness } from "./worldCanvasTypes"

export interface PreparedWorldScene {
  assertReady: () => void
  activate: () => void
  dispose: () => void
}
export interface WorldSceneHostHandle {
  prepare: (
    world: WorldProgress,
    economy: Readonly<Economy>,
    signal: AbortSignal,
  ) => Promise<PreparedWorldScene>
}
interface Candidate {
  id: number
  world: WorldProgress
  economy: Readonly<Economy>
  preflight: ScenePreflight
  readiness?: WorldMapReadiness
}

/** Stable keyed slots keep the actual candidate canvas/app alive across promotion. */
export function WorldSceneHost(
  props: WorldCanvasProps & { ref?: Ref<WorldSceneHostHandle> },
) {
  const [active, setActive] = useState(0)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const activeId = useRef(0),
    sequence = useRef(0),
    staged = useRef<Candidate | null>(null)
  const latest = useRef(props)
  latest.current = props
  useEffect(() => () => staged.current?.preflight.dispose(), [])

  useImperativeHandle(
    props.ref,
    () => ({
      async prepare(world, economy, signal) {
        if (staged.current) throw Error("Đang chuẩn bị một cảnh đích khác.")
        const id = ++sequence.current
        const preflight = new ScenePreflight(signal, () => {
          if (staged.current?.id !== id) return
          staged.current = null
          setCandidate(null)
        })
        const next: Candidate = { id, world, economy, preflight }
        if (!signal.aborted) {
          staged.current = next
          setCandidate(next)
        }
        await preflight.ready
        return {
          assertReady: preflight.assertReady,
          dispose: preflight.dispose,
          activate: () => {
            preflight.transfer()
            activeId.current = id
            staged.current = null
            setActive(id)
            setCandidate(null)
            if (next.readiness) latest.current.onReadyChange?.(next.readiness)
          },
        }
      },
    }),
    [],
  )

  const status = useCallback((id: number, state: WorldMapReadiness) => {
    if (id === activeId.current) latest.current.onReadyChange?.(state)
    const next = staged.current
    if (next?.id === id) {
      next.readiness = state
      next.preflight.report(state)
    }
  }, [])
  const { ref: _hostRef, ...canvasProps } = props
  const slots = [
    { id: active, props: canvasProps },
    ...(candidate
      ? [
          {
            id: candidate.id,
            props: {
              world: candidate.world,
              economy: candidate.economy,
              patrol: newNpcPatrol(candidate.world.zoneId),
              paused: true,
              onNavigate: () => {},
            },
          },
        ]
      : []),
  ]
  return (
    <>
      {slots.map((slot) => (
        <WorldSceneSlot
          key={slot.id}
          id={slot.id}
          active={slot.id === active}
          canvasProps={slot.props}
          onStatus={status}
        />
      ))}
    </>
  )
}

function WorldSceneSlot({
  id,
  active,
  canvasProps,
  onStatus,
}: {
  id: number
  active: boolean
  canvasProps: WorldCanvasProps
  onStatus: (id: number, state: WorldMapReadiness) => void
}) {
  const latest = useRef(onStatus)
  latest.current = onStatus
  const report = useCallback(
    (state: WorldMapReadiness) => latest.current(id, state),
    [id],
  )
  return (
    <div
      className="aw2-scene-slot"
      data-world-scene-state={active ? "active" : "preparing"}
      data-world-scene-id={id}
      inert={!active}
      aria-hidden={!active || undefined}
    >
      <WorldCanvas {...canvasProps} onReadyChange={report} />
    </div>
  )
}

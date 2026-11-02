import { vi } from "vitest"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { AW2_DEV_SAVE_KEY } from "@/aw2/save/schema"
import { atEntity } from "./entity-fixture"
export async function freePlayFixture(samples: () => number = () => 0) {
  const memory = new Map<string, string>([
    ["foodchest.user.v1", "original-save"],
  ])
  let queue = Promise.resolve(),
    locked = false,
    fail = false
  const random = vi.fn(() => {
    if (!locked) throw Error("random outside lock")
    return samples()
  })
  const setItem = vi.fn((key: string, value: string) => {
    if (fail && key === AW2_DEV_SAVE_KEY) throw Error("quota")
    memory.set(key, value)
  })
  const store = new Aw2DevSaveStore({
    storage: () => ({
      getItem: (key) => memory.get(key) ?? null,
      setItem,
      removeItem: (key) => {
        memory.delete(key)
      },
    }),
    lock: <T>(action: () => T): Promise<T> => {
      const next = queue.then(() => {
        locked = true
        try {
          return action()
        } finally {
          locked = false
        }
      })
      queue = next.then(
        () => undefined,
        () => undefined,
      )
      return next
    },
    random,
    now: () => "2026-11-02T12:00:00.000Z",
    newId: () => "00000000-0000-4000-8000-000000000001",
  })
  const first = await store.save(null)
  return {
    store,
    first,
    memory,
    random,
    setItem,
    fail: (value: boolean) => {
      fail = value
    },
  }
}
export async function completeFirstQuest(
  f: Awaited<ReturnType<typeof freePlayFixture>>,
) {
  let current = f.first
  for (const [id, action] of [
    ["aw2-npc-giu-cho", "accept"],
    ["aw2-object-village-table", "inspect"],
    ["aw2-npc-giu-cho", "turn-in"],
  ])
    current = await f.store.act(
      current.raw,
      atEntity(current.save.progress, id),
      id,
      action,
    )
  return current
}

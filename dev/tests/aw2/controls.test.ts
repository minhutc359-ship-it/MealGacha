import { describe, expect, it } from "vitest"
import {
  worldKeyAction,
  worldMenuKeyAction,
  type WorldKeyContext,
} from "@/aw2/world/controls"

const exploring: WorldKeyContext = {
  enabled: true,
  nativeControl: false,
  modified: false,
  repeat: false,
}
describe("world shortcut ownership", () => {
  it.each(["ArrowDown", "w", "E"])(
    "leaves %s untouched in other modes, dialogs or unavailable saves",
    (key) => {
      expect(worldKeyAction(key, { ...exploring, enabled: false })).toBeNull()
    },
  )
  it.each(["ArrowDown", "w", "e"])(
    "preserves %s for native UI and modifier shortcuts",
    (key) => {
      expect(
        worldKeyAction(key, { ...exploring, nativeControl: true }),
      ).toBeNull()
      expect(worldKeyAction(key, { ...exploring, modified: true })).toBeNull()
    },
  )
  it("allows held movement and uppercase keys but only one interaction per key press", () => {
    expect(worldKeyAction("W", { ...exploring, repeat: true })).toEqual({
      type: "move",
      key: "w",
    })
    expect(worldKeyAction("ArrowRight", exploring)).toEqual({
      type: "move",
      key: "arrowright",
    })
    expect(worldKeyAction("E", exploring)).toEqual({
      type: "interact",
      key: "e",
    })
    expect(worldKeyAction("e", { ...exploring, repeat: true })).toBeNull()
  })
  it.each(["Tab", " ", "Enter", "Escape", "PageDown"])(
    "preserves normal browser key %s",
    (key) => expect(worldKeyAction(key, exploring)).toBeNull(),
  )
})

describe("AW2-018F menu shortcut ownership", () => {
  it.each([
    ["j", "quest"],
    ["I", "bag"],
    ["p", "party"],
    ["M", "atlas"],
    ["h", "help"],
  ])("maps %s to %s", (key, panel) => {
    expect(worldMenuKeyAction(key, exploring)).toBe(panel)
  })

  it.each([
    { enabled: false },
    { nativeControl: true },
    { modified: true },
    { repeat: true },
  ])(
    "does not capture unavailable/native/modified/repeat keys: %j",
    (patch) => {
      expect(worldMenuKeyAction("j", { ...exploring, ...patch })).toBeNull()
    },
  )

  it.each(["e", "w", "ArrowRight", "Escape", "Tab", "?"])(
    "leaves unrelated key %s to its existing owner",
    (key) => expect(worldMenuKeyAction(key, exploring)).toBeNull(),
  )
})

import { describe, expect, it } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { reduceAdventure } from "@/game/adventure"
import { fullPP, spiritMaxHp } from "@/game/adventureSkills"
import { RPG_MAPS, RPG_STAGE_IDS, rpgStage } from "@/game/adventureRpg/content"
import {
  newRpgSave,
  reduceRpg,
  stageUnlocked,
  heroStats,
  heroSkills,
  heroPower,
  advanceRpgBattle,
  dungeonTierCap,
} from "@/game/adventureRpg/engine"
import { rpgSaveSchema } from "@/game/adventureRpg/schema"
import type { RpgSave, RpgAction } from "@/game/adventureRpg/types"

const game = newGame()
function act(s: RpgSave, a: RpgAction) {
  let r = reduceRpg(s, a, game)
  if(r.save.run?.battle.cinematic)r=reduceRpg(r.save,{type:"cinematicDone",serial:r.save.run.battle.cinematic.serial},game)
  expect(r.error, JSON.stringify(a)).toBeUndefined()
  const parsed = rpgSaveSchema.safeParse(r.save)
  expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true)
  return r.save
}
function fight(s: RpgSave) {
  if (!s.run!.battle.auto) s = act(s, { type: "auto" })
  for (let i = 0; i < 720 && !s.run!.battle.result; i++) {
    const b = s.run!.battle
    const priority = b.actors.find(a=>a.side === "enemy" && a.hp > 0 && a.style === "mender") ?? b.actors.find(a=>a.side === "enemy" && a.hp > 0 && a.style === "hexer")
    if ((b.rulesVersion ?? 0) >= 520 && priority && b.focus !== priority.uid) s = act(s,{type:"focus",uid:priority.uid})
    if (b.warning && b.tick >= b.guardReady)
      s = act(s, { type: "guard", row: b.warning.row })
    s = act(s, { type: "tick", steps: 4 })
  }
  return act(s, { type: "settle" })
}
function trained(level = 8) {
  const s = newRpgSave(game)
  for (const hero of s.roster) {
    hero.level = level
    hero.rank = 2
    hero.skills = [3, 3, 3, 2]
    hero.gear = [2, 2, 1]
  }
  return s
}
function openBoss(s: RpgSave, map = "lantern") {
  for (const id of RPG_STAGE_IDS) {
    if (id === `${map}-6`) break
    s.stars[id] = 1
  }
  return act(s, { type: "start", stageId: `${map}-6` })
}

describe("Adventure 5.0 content and retained progress", () => {
  it("has four connected maps, five small stages and one boss per map, with original Vietnamese dialogue", () => {
    expect(RPG_MAPS).toHaveLength(4)
    expect(RPG_STAGE_IDS).toHaveLength(24)
    for (const map of RPG_MAPS) {
      expect(map.stages).toHaveLength(6)
      expect(existsSync(`public${map.art}`)).toBe(true)
      expect(
        map.stages.every(
          (s) => s.before.text.length > 40 && s.after.text.length > 40,
        ),
      ).toBe(true)
    }
    expect(new Set(RPG_MAPS.map((m) => m.boss)).size).toBe(4)
  })
  it("seeds old team/reserve levels and XP once without consuming or changing any old save field", () => {
    const g = newGame()
    g.adventure = reduceAdventure(g.adventure, {
      type: "start",
      cardId: "pho-bo",
    }).save
    g.adventure.team[0].level = 18
    g.adventure.team[0].xp = 92
    g.adventure.coins = 719
    g.adventure.team[0].hp = spiritMaxHp("pho-bo", 18)
    g.adventure.team[0].pp = fullPP("pho-bo", 18)
    g.adventure.badges = ["lantern", "harbor"]
    g.adventure.inventory = { potion: 7, revive: 4 }
    const before = JSON.stringify(g),
      r = reduceRpg(undefined, { type: "sync" }, g).save
    expect(JSON.stringify(g)).toBe(before)
    expect(
      r.roster.find((h) => h.uid === g.adventure!.team[0].uid),
    ).toMatchObject({ level: 18, xp: 92 })
    expect(r.resources).toMatchObject({
      coins: 719,
      broth: 7,
      leaves: 4,
      seals: g.adventure.aromaSeals,
    })
    expect(stageUnlocked(r, "garden-1")).toBe(true)
    const second = reduceRpg(r, { type: "sync" }, g).save
    expect(second).toEqual(r)
    expect(parseGame({ ...g, adventureRpg: r })?.adventure).toEqual(g.adventure)
  })
  it("uses a separate economy and keeps newly unlocked roster members after TCG salvage", () => {
    const before = structuredClone(game),
      g = { ...game, cards: { ...game.cards, "chef-hai": 1 } }
    const s = reduceRpg(newRpgSave(game), { type: "sync", cards: {"chef-hai":45} }, g).save
    expect(s.roster.some((h) => h.cardId === "chef-hai")).toBe(true)
    g.cards["chef-hai"] = 0
    expect(reduceRpg(s, { type: "sync" }, g).save.roster).toEqual(s.roster)
    expect(game).toEqual(before)
  })
  it("preserves legacy in-progress encounters and all account resources through JSON round-trip", () => {
    const g = newGame(),
      old = structuredClone(g)
    const s = act(newRpgSave(g), { type: "start", stageId: "lantern-1" })
    const parsed = parseGame(
      JSON.parse(JSON.stringify({ ...g, adventureRpg: s })),
    )!
    expect(parsed).not.toBeNull()
    expect(parsed.adventureRpg).toEqual(s)
    for (const key of [
      "coins",
      "dust",
      "xp",
      "packTickets",
      "cards",
      "decks",
      "autoChess",
      "adventure",
    ] as const)
      expect(parsed[key]).toEqual(old[key])
  })
})

describe("party, growth and real combat", () => {
  it("rejects locked stages, impossible parties, duplicate characters and changes while fighting", () => {
    const s = newRpgSave(game)
    expect(
      reduceRpg(s, { type: "start", stageId: "tide-6" }, game).error,
    ).toBeDefined()
    expect(
      reduceRpg(
        s,
        { type: "formation", uids: [s.formation[0], s.formation[0]] },
        game,
      ).error,
    ).toBeDefined()
    expect(
      reduceRpg(s, { type: "formation", uids: [] }, game).error,
    ).toBeDefined()
    const running = act(s, { type: "start", stageId: "lantern-1" })
    for (const a of [
      { type: "train", uid: s.formation[0] },
      { type: "formation", uids: s.formation },
      { type: "dungeon", kind: "forge", tier: 1 },
    ] as RpgAction[])
      expect(reduceRpg(running, a, game).error).toBeDefined()
  })
  it("spends experience, books, ore and essence; unlocks support and passive; increases real battle stats", () => {
    let s = newRpgSave(game)
    const uid = s.formation[0],
      initial = heroPower(s.roster[0])
    s.resources = {
      ...s.resources,
      experience: 100,
      coins: 10000,
      books: 100,
      ore: 100,
      essence: 100,
    }
    expect(
      reduceRpg(s, { type: "skill", uid, index: 0 }, game).error,
    ).toBeDefined()
    while (s.roster[0].level < 5) s = act(s, { type: "train", uid })
    s = act(s, { type: "rank", uid })
    s = act(s, { type: "skill", uid, index: 3 })
    s = act(s, { type: "gear", uid, index: 0 })
    expect(heroSkills(s.roster[0]).every((skill) => skill.ready)).toBe(true)
    expect(heroPower(s.roster[0])).toBeGreaterThan(initial)
    expect(s.resources.books).toBe(99)
    expect(s.resources.essence).toBe(98)
    const started = act(s, { type: "start", stageId: "lantern-1" })
    expect(started.run!.battle.actors[0].attack).toBe(
      heroStats(s.roster[0]).attack,
    )
  })
  it("refuses malformed or unaffordable upgrades without subtracting materials", () => {
    const s = newRpgSave(game)
    s.resources.coins = 0
    const before = structuredClone(s)
    for (const index of [-1, 4, NaN])
      expect(
        reduceRpg(s, { type: "skill", uid: s.formation[0], index }, game).error,
      ).toBeDefined()
    expect(
      reduceRpg(s, { type: "gear", uid: s.formation[0], index: 0 }, game).error,
    ).toBeDefined()
    expect(s).toEqual(before)
  })
  it("starter squad wins its first stage and unlocks the next without silently enabling AUTO", () => {
    let s = act(newRpgSave(game), { type: "start", stageId: "lantern-1" })
    expect(s.run!.battle.auto).toBe(false)
    s = fight(s)
    expect(s.run!.battle.result).toBe("win")
    expect(s.stars["lantern-1"]).toBeGreaterThan(0)
    expect(stageUnlocked(s, "lantern-2")).toBe(true)
  })
  it("manual burst costs exactly 100 energy, damages enemies and rejects enemy impersonation", () => {
    let s = act(trained(), { type: "start", stageId: "lantern-1" })
    const a = s.run!.battle.actors.find(
      (a) => a.side === "ally" && a.role === "mage",
    )!
    a.energy = 100
    const enemyHp = s
      .run!.battle.actors.filter((a) => a.side === "enemy")
      .reduce((sum, a) => sum + a.hp, 0)
    expect(
      reduceRpg(
        s,
        {
          type: "burst",
          uid: s.run!.battle.actors.find((a) => a.side === "enemy")!.uid,
        },
        game,
      ).error,
    ).toBeDefined()
    s = act(s, { type: "burst", uid: a.uid })
    expect(s.run!.battle.actors.find((x) => x.uid === a.uid)!.energy).toBe(0)
    expect(s.run!.battle.events.some((e) => e.kind === "burst")).toBe(true)
    expect(
      s.run!.battle.wave > 0 ||
        s
          .run!.battle.actors.filter((a) => a.side === "enemy")
          .reduce((sum, a) => sum + a.hp, 0) < enemyHp,
    ).toBe(true)
  })
  it("pauses and reloads the exact tick, HP, energy, event serial and random-free simulation", () => {
    let s = act(trained(), { type: "start", stageId: "lantern-1" })
    s = act(s, { type: "tick", steps: 8 })
    s = act(s, { type: "pause" })
    const parsed = parseGame(
      JSON.parse(JSON.stringify({ ...game, adventureRpg: s })),
    )!.adventureRpg!
    expect(act(parsed, { type: "tick", steps: 8 })).toEqual(s)
    const a = act(s, { type: "pause" }),
      b = act(parsed, { type: "pause" })
    expect(act(a, { type: "tick", steps: 8 })).toEqual(
      act(b, { type: "tick", steps: 8 }),
    )
  })
  it("limits slow-tab catch-up and stops all battle ticks after the result", () => {
    const s = act(trained(), { type: "start", stageId: "lantern-1" })
    expect(advanceRpgBattle(s.run!.battle, 10000).tick).toBe(8)
    const done = fight(s)
    expect(advanceRpgBattle(done.run!.battle, 8)).toBe(done.run!.battle)
  })
  it("cancels a defeated boss warning while other enemies remain, keeping the mid-battle save importable", () => {
    let s = openBoss(trained(8))
    while (!s.run!.battle.result && s.run!.battle.wave < s.run!.battle.waves.length - 1) s = act(s, { type: "tick", steps: 1 })
    const b = s.run!.battle, boss = b.actors.find(a => a.boss)!, striker = b.actors.find(a => a.side === "ally" && a.role === "striker")!
    boss.hp = 1; striker.energy = 100; b.focus = boss.uid
    b.warning = { source: boss.uid, row: "front", until: b.tick + 8 }
    s = act(s, { type: "burst", uid: striker.uid })
    expect(s.run!.battle.warning).toBeNull()
    expect(s.run!.battle.actors.some(a => a.side === "enemy" && a.hp > 0)).toBe(true)
    expect(parseGame({ ...game, adventureRpg: s })?.adventureRpg).toEqual(s)
  })
  it("settles rewards once even after repeated calls and reload", () => {
    let s = fight(
      act(newRpgSave(game), { type: "start", stageId: "lantern-1" }),
    )
    const received = structuredClone(s.resources)
    s = act(s, { type: "settle" })
    s = parseGame({ ...game, adventureRpg: s })!.adventureRpg!
    s = act(s, { type: "settle" })
    expect(s.resources).toEqual(received)
  })
  for (const map of RPG_MAPS)
    it(`${map.id}: boss warns, changes phase, counterattacks and can be defeated by a prepared squad`, () => {
      const prepared = trained(rpgStage(`${map.id}-6`)!.level)
      for(const h of prepared.roster){h.skills=[6,6,6,6];h.rank=3;h.gear=[3,3,2]}
      let s = openBoss(prepared, map.id),
        warnings = 0,
        phases = 0,
        bossHits = 0
      s = act(s, { type: "auto" })
      while (!s.run!.battle.result) {
        const b = s.run!.battle
        if (b.warning) {
          warnings++
          if (b.tick >= b.guardReady)
            s = act(s, { type: "guard", row: b.warning.row })
        }
        s = act(s, { type: "tick", steps: 1 })
        if (s.run!.battle.actors.some((a) => a.boss && a.phase)) phases++
        bossHits += s.run!.battle.events.filter(
          (e) =>
            e.kind === "hit" &&
            e.tick === s.run!.battle.tick &&
            e.source.includes("boss"),
        ).length
      }
      expect(warnings).toBeGreaterThan(0)
      expect(phases).toBeGreaterThan(0)
      expect(bossHits).toBeGreaterThan(0)
      expect(s.run!.battle.result).toBe("win")
    })
  it("che chắn reduces the warned row's damage, preserves other rows and enforces cooldown", () => {
    let s = openBoss(trained(8)),
      b = s.run!.battle
    b.wave = b.waves.length - 1
    b.actors = b.actors.filter((a) => a.side === "ally")
    const source = {
      ...b.actors[0],
      uid: "test-boss",
      energy: 100,
      id: "boss-drum",
      side: "enemy" as const,
      slot: 0,
      boss: true,
      nextAttack: 100,
      nextSkill: 100,
      attack: 90,
    }
    b.actors.push(source)
    b.warning = { source: source.uid, row: "front", until: 1 }
    for (const a of b.actors) {
      a.nextAttack = 100
      a.nextSkill = 100
      a.nextSupport = 100
    }
    const unguarded = advanceRpgBattle(b, 1),
      guarded = reduceRpg(s, { type: "guard", row: "front" }, game).save
    const protectedBattle = advanceRpgBattle(guarded.run!.battle, 1)
    expect(protectedBattle.actors[0].hp).toBeGreaterThan(unguarded.actors[0].hp)
    expect(protectedBattle.actors[2].hp).toBe(unguarded.actors[2].hp)
    expect(
      reduceRpg(guarded, { type: "guard", row: "back" }, game).error,
    ).toBeDefined()
  })
})

describe("farm loop and schema guards", () => {
  it("a fresh account clears 24 stages by upgrading from earned loot and farming early floors before tackling bosses", () => {
    let s = newRpgSave(game), farms = 0
    const improve = () => {
      const heroes=s.roster.filter(h=>s.formation.includes(h.uid))
      for(let level=1;level<3;level++)for(const h of heroes)for(const index of [0,2]) {
        if(h.skills[index]!==level)continue
        const r=reduceRpg(s,{type:"skill",uid:h.uid,index},game);if(!r.error)s=r.save
      }
      for(let level=0;level<2;level++)for(const h of heroes)for(const index of [0,1]) {
        if(h.gear[index]!==level)continue
        const r=reduceRpg(s,{type:"gear",uid:h.uid,index},game);if(!r.error)s=r.save
      }
    }
    for (const id of RPG_STAGE_IDS) {
      const target = rpgStage(id)!.level
      for (let guard = 0; guard < 200; guard++) {
        const heroes = s.roster.filter(h => s.formation.includes(h.uid)).sort((a, b) => a.level - b.level || a.xp - b.xp)
        if (heroes[0].level >= target) break
        if (s.resources.experience > 0) s = act(s, { type: "train", uid: heroes[0].uid })
        else {
          improve()
          s = fight(act(s, { type: "dungeon", kind: "experience", tier: 1 }))
          expect(s.run!.battle.result).toBe("win")
          for (let floor = 2; floor <= 4; floor++) {
            if (s.run!.dungeon!.status === "camp") s = act(s, { type: "camp", choice: "rest" })
            s = act(s, { type: "next" }); s = fight(s)
            expect(s.run!.battle.result).toBe("win")
          }
          s = act(s, { type: "close" }); farms++
          expect(farms).toBeLessThan(50)
        }
      }
      improve()
      s = fight(act(s, { type: "start", stageId: id }))
      expect(s.run!.battle.result, id).toBe("win")
      s = act(s, { type: "close" })
    }
    expect(Object.keys(s.stars)).toHaveLength(24)
    expect(dungeonTierCap(s)).toBe(3)
    expect(farms).toBeGreaterThan(0)
    expect(Object.values(s.resources).every(value => value >= 0)).toBe(true)
  }, 30_000) // Simulates all 24 stages plus earned-loot farming on shared CI workers.
  for (const kind of ["experience", "skills", "forge"] as const)
    it(`${kind}: farms all five floors with carried HP/energy and two exclusive camp decisions`, () => {
      let s = act(trained(), { type: "dungeon", kind, tier: 1 })
      const before = structuredClone(s.resources)
      for (let floor = 1; floor <= 5; floor++) {
        s = fight(s)
        expect(s.run!.battle.result).toBe("win")
        if (s.run!.dungeon!.status === "camp") {
          s = act(s, { type: "camp", choice: floor === 2 ? "rest" : "power" })
          expect(
            reduceRpg(s, { type: "camp", choice: "rest" }, game).error,
          ).toBeDefined()
        }
        if (floor < 5) {
          const health = structuredClone(s.run!.dungeon!.health)
          s = act(s, { type: "next" })
          for (const a of s.run!.battle.actors.filter((a) => a.side === "ally"))
            expect({ hp: a.hp, energy: a.energy }).toEqual(health[a.uid])
        }
      }
      expect(s.run!.dungeon!.status).toBe("complete")
      expect(s.dungeonClears[`${kind}:1`]).toBe(1)
      const key =
        kind === "experience"
          ? "experience"
          : kind === "skills"
            ? "books"
            : "ore"
      expect(s.resources[key] - before[key]).toBe(14)
      expect(s.resources.coins - before.coins).toBe(90)
      if (kind === "forge") expect(s.resources.essence - before.essence).toBe(7)
    })
  it("keeps loot on retreat and awards nothing for failure or abandoning an unfinished fight", () => {
    let s = act(trained(), { type: "dungeon", kind: "skills", tier: 1 })
    s = fight(s)
    const resources = structuredClone(s.resources)
    s = act(s, { type: "next" })
    s = act(s, { type: "close" })
    expect(s.resources).toEqual(resources)
    s = act(s, { type: "start", stageId: "lantern-1" })
    for (const a of s.run!.battle.actors.filter((a) => a.side === "ally"))
      a.hp = 0
    s = act(s, { type: "tick", steps: 1 })
    s = act(s, { type: "settle" })
    expect(s.resources).toEqual(resources)
    expect(s.stars["lantern-1"]).toBeUndefined()
  })
  it("uses retained broth and resurrection items between floors without reviving everybody for free", () => {
    let s = fight(act(trained(), { type: "dungeon", kind: "forge", tier: 1 }))
    const uid = s.formation[0],
      d = s.run!.dungeon!,
      a = s.run!.battle.actors[0]
    d.health[uid].hp = 0
    a.hp = 0
    s = act(s, { type: "revive", uid })
    expect(s.run!.dungeon!.health[uid].hp).toBe(Math.round(a.maxHp / 2))
    expect(s.resources.leaves).toBe(0)
    const stock = s.resources.broth
    s = act(s, { type: "broth" })
    expect(s.resources.broth).toBe(stock - 1)
  })
  it("gates harder dungeons on actual boss progress and persists narrative choices", () => {
    let s = newRpgSave(game)
    expect(dungeonTierCap(s)).toBe(1)
    expect(
      reduceRpg(s, { type: "dungeon", kind: "forge", tier: 2 }, game).error,
    ).toBeDefined()
    expect(
      reduceRpg(s, { type: "choice", mapId: "lantern", choice: 1 }, game).error,
    ).toBeDefined()
    for (let i = 1; i <= 6; i++) s.stars[`lantern-${i}`] = 1
    s = act(s, { type: "choice", mapId: "lantern", choice: 1 })
    expect(dungeonTierCap(s)).toBe(2)
    expect(
      parseGame({ ...game, adventureRpg: s })!.adventureRpg!.choices.lantern,
    ).toBe(1)
  })
  it("rejects malformed parties, missing actors, skipped campaign stages and false victories on import", () => {
    const valid = act(trained(), { type: "start", stageId: "lantern-1" })
    for (const mutate of [
      (s: RpgSave) => {
        s.formation[0] = "missing"
      },
      (s: RpgSave) => {
        s.stars["harbor-6"] = 3
      },
      (s: RpgSave) => {
        s.run!.battle.result = "win"
      },
      (s: RpgSave) => {
        s.roster[0].skills[0] = 10
      },
    ]) {
      const s = structuredClone(valid)
      mutate(s)
      expect(parseGame({ ...game, adventureRpg: s })).toBeNull()
    }
  })
  it("removes old movement controls and walking assets from the product, while keeping the old save parser", () => {
    const page = readFileSync("src/pages/AdventurePage.tsx", "utf8")
    expect(page).not.toContain("AdventureWorld")
    expect(page).not.toContain("WASD")
    expect(existsSync("public/assets/adventure/terrain-v480.webp")).toBe(false)
    expect(
      existsSync("dev/archive/legacy-adventure-v490/assets/terrain-v480.webp"),
    ).toBe(true)
    expect(readFileSync("src/game/storage.ts", "utf8")).toContain(
      "adventure: adventure.optional()",
    )
    expect(rpgStage("tide-6")!.level).toBe(41)
  })
})

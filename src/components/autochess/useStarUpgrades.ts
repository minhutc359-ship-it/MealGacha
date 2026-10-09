import { useEffect, useRef, useState } from "react"
import type { AutoRun } from "../../game/autochess/types"
import { starUpgrades, STAR_UPGRADE_MS, type StarUpgrade } from "../../game/autochess/presentation"

export function useStarUpgrades(run: AutoRun | null) {
  const previous = useRef(run)
  const [upgrades, setUpgrades] = useState<StarUpgrade[]>([])
  useEffect(() => {
    const before = previous.current
    previous.current = run
    if (!before || !run || before.id !== run.id) { setUpgrades([]); return }
    const next = starUpgrades(before.roster, run.roster, performance.now())
    if (next.length) setUpgrades(current => [...current.filter(u => !next.some(n => n.uid === u.uid)), ...next])
  }, [run])
  useEffect(() => {
    if (!upgrades.length) return
    const expiry = Math.min(...upgrades.map(u => u.at + STAR_UPGRADE_MS))
    const timer = window.setTimeout(() => setUpgrades(current => current.filter(u => u.at + STAR_UPGRADE_MS > performance.now())), Math.max(1, expiry - performance.now() + 10))
    return () => window.clearTimeout(timer)
  }, [upgrades])
  return upgrades
}

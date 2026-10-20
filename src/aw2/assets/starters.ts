import lua from "./lua.base-v1.json"
import lam from "./lam.base-v1.json"
import mocNon from "./moc-non.base-v1.json"
import suong from "./suong.base-v1.json"
import { THAN_ASSETS } from "./than"
import type { SpiritAssetManifest } from "./types"

// Reference assets only. Full character, combat, device and rights gates stay open.
export const STARTER_ASSETS: Record<string, SpiritAssetManifest> = {
  "aw2-than": THAN_ASSETS,
  "aw2-lua": lua,
  "aw2-lam": lam,
  "aw2-moc-non": mocNon,
  "aw2-suong": suong,
}

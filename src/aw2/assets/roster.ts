import { STARTER_ASSETS } from "./starters"
import muoi from "./muoi.base-v1.json"
import nhien from "./nhien.base-v1.json"
import hai from "./hai.base-v1.json"
import lien from "./lien.base-v1.json"
import moc from "./moc.base-v1.json"
import bach from "./bach.base-v1.json"
import van from "./van.base-v1.json"
import type { SpiritAssetManifest } from "./types"

/** Authored reference inventory, independent of collection and the starter team. */
export const ROSTER_ASSETS: Record<string, SpiritAssetManifest> = {
  ...STARTER_ASSETS,
  "aw2-muoi": muoi as SpiritAssetManifest,
  "aw2-nhien": nhien as SpiritAssetManifest,
  "aw2-hai": hai as SpiritAssetManifest,
  "aw2-lien": lien as SpiritAssetManifest,
  "aw2-moc": moc as SpiritAssetManifest,
  "aw2-bach": bach as SpiritAssetManifest,
  "aw2-van": van as SpiritAssetManifest,
}

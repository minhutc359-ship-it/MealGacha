import registry from "./ultimate-art.v1.json"

export interface UltimateArtwork {
  id: string
  url: string
  width: number
  height: number
  bytes: number
  sha256: string
  source: {
    path: string
    sha256: string
  }
  promptSha256: string
  transparentFraction: number
}

/** URLs and dimensions only; importing this registry never fetches an image. */
export const ULTIMATE_ART: Readonly<Record<string, UltimateArtwork>> = registry

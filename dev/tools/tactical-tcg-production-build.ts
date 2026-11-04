import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Plugin } from "vite"
import { AW2_DELIVERY_SECURITY_PROFILE } from "./aw2-delivery-contract.mjs"
import { TACTICAL_PRODUCT_ID } from "../../src/game/tacticalTcg/productContract"
export const TACTICAL_PRODUCTION_CONTRACT = "assets/production-contract.json",
  TACTICAL_RELEASE_IDENTITY = "assets/release-identity.json"
const root = fileURLToPath(new URL("../../", import.meta.url))
export function tacticalProductionSurfaceContract(
  moduleIds: readonly string[],
) {
  const ids = [...new Set(moduleIds.map((id) => id.replace(/\\/g, "/")))],
    forbidden = ids.filter(
      (id) =>
        /\/src\/(?:App|main)\.tsx$/.test(id) ||
        /\/src\/pages\/(?:AutoChessPage|AdventurePage|PvpPage)\.tsx$/.test(
          id,
        ) ||
        /\/src\/components\/layout\/ModeSwitch\.tsx$/.test(id) ||
        /\/dev\/aw2\/(?:WorldGame|world)\.tsx$/.test(id),
    )
  if (forbidden.length)
    throw Error(
      `Retired game runtime entered production: ${forbidden.join(", ")}`,
    )
  for (const required of [
    "/src/production.tsx",
    "/src/TacticalTcgApp.tsx",
    "/src/pages/TCGPage.tsx",
    "/src/OriginalChestApp.tsx",
    "/src/pages/ChestPage.tsx",
  ])
    if (!ids.some((id) => id.endsWith(required)))
      throw Error(`Tactical production graph dropped ${required}`)
  return {
    version: 1,
    defaultSurface: TACTICAL_PRODUCT_ID,
    retainedSurfaces: ["manga", "chest", "legal"],
    retiredSurfaces: ["autochess", "adventure", "aw2", "game"],
    reviewUiModules: 0,
  }
}
export function tacticalReleaseSourceIdentity(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const vercel = environment.VERCEL_GIT_COMMIT_SHA?.trim().toLowerCase(),
    github = environment.GITHUB_SHA?.trim().toLowerCase()
  for (const [name, value] of [
    ["VERCEL_GIT_COMMIT_SHA", vercel],
    ["GITHUB_SHA", github],
  ] as const)
    if (value && !/^[0-9a-f]{40}$/.test(value))
      throw Error(`${name} must be a complete Git SHA`)
  if (vercel && github && vercel !== github)
    throw Error("Host and CI Git revisions disagree")
  return vercel
    ? { provider: "vercel" as const, revision: vercel }
    : github
      ? { provider: "github" as const, revision: github }
      : { provider: "local" as const, revision: null }
}
export function tacticalProductionBuild(): Plugin {
  return {
    name: "tactical-tcg-production-build",
    apply: "build",
    async generateBundle(_, bundle) {
      const modules = Object.values(bundle).flatMap((output) =>
          output.type === "chunk" ? Object.keys(output.modules) : [],
        ),
        contract = tacticalProductionSurfaceContract(modules),
        packageJson = JSON.parse(
          await readFile(join(root, "package.json"), "utf8"),
        )
      this.emitFile({
        type: "asset",
        fileName: TACTICAL_PRODUCTION_CONTRACT,
        source: `${JSON.stringify(contract, null, 2)}\n`,
      })
      this.emitFile({
        type: "asset",
        fileName: TACTICAL_RELEASE_IDENTITY,
        source: `${JSON.stringify({ schema: 1, product: TACTICAL_PRODUCT_ID, version: packageJson.version, candidate: "tactical-tcg-web-v1", source: tacticalReleaseSourceIdentity(), sourcePortable: true, deliverySecurityProfile: AW2_DELIVERY_SECURITY_PROFILE, surface: contract }, null, 2)}\n`,
      })
    },
  }
}

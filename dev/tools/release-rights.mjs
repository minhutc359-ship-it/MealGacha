import { readFileSync } from "node:fs"
const register = JSON.parse(readFileSync(new URL("../../rights/ASSET_REGISTER.json", import.meta.url), "utf8"))
const unresolved = register.assets.filter(asset => asset.review === "owner-verification-required")
console.log(JSON.stringify({ assets: register.assets.length, unresolved: unresolved.map(asset => asset.path), commercialClearance: unresolved.length ? "pending-evidence" : "owner-review-still-required" }, null, 2))
// Inventories are evidence, never certificates of ownership/non-infringement.
if (process.argv.includes("--commercial") && unresolved.length) throw Error("Commercial release blocked: verify recorded rights or replace the listed assets and regenerate the register. Do not relabel a review status without evidence.")

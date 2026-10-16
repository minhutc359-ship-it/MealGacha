import { readFileSync } from "node:fs"

// Build policy only. Do not add this development file to the runtime bundle.
export const WEB_BUDGET = JSON.parse(readFileSync(new URL("../web-budget.json", import.meta.url), "utf8"))
if (!(WEB_BUDGET.staticTargetBytes < WEB_BUDGET.staticBudgetBytes &&
    WEB_BUDGET.initialTargetBytes <= WEB_BUDGET.initialBudgetBytes &&
    Object.values(WEB_BUDGET.allocations).reduce((sum, n) => sum + n, 0) === WEB_BUDGET.additionalAllocationBytes))
  throw Error("Invalid Web budget: targets and approved allocations must agree.")

export function checkWebBudget(bytes, initial = false) {
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw Error("Budget measurement must be nonnegative integer bytes.")
  const target = initial ? WEB_BUDGET.initialTargetBytes : WEB_BUDGET.staticTargetBytes
  const limit = initial ? WEB_BUDGET.initialBudgetBytes : WEB_BUDGET.staticBudgetBytes
  return { targetBytes: target, limitBytes: limit, warning: bytes >= target, exceeded: bytes > limit, remainingBytes: limit - bytes }
}

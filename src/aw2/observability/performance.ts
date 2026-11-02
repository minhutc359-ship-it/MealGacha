export const AW2_PERFORMANCE_CONTRACT_ID = "aw2-performance-v1" as const
export type PerformanceGateStatus = "PASS" | "WARN" | "FAIL" | "NOT_RUN"

export const AW2_PERFORMANCE_BUDGETS = {
  productionBytes: {
    target: 300_000_000,
    limit: 320_000_000,
    direction: "lower",
  },
  offlineShellBytes: {
    target: 8_000_000,
    limit: 12_000_000,
    direction: "lower",
  },
  jsGzipBytes: {
    target: 705_000,
    limit: 710_000,
    direction: "lower",
  },
  pageLoadMs: { target: 3_500, limit: 8_000, direction: "lower" },
  rafHz: { target: 50, limit: 40, direction: "higher" },
  jsHeapBytes: {
    target: 192 * 1024 * 1024,
    limit: 320 * 1024 * 1024,
    direction: "lower",
  },
  longTaskMs: { target: 100, limit: 250, direction: "lower" },
} as const

export const AW2_PERFORMANCE_PUBLIC_SUMMARY = {
  productionLimitMb: 320,
  offlineShellLimitMb: 12,
  jsGzipLimitKb: 710,
  deviceMeasurements: "NOT_RUN",
  telemetry: "LOCAL_OPT_IN_ONLY",
} as const

type BudgetKey = keyof typeof AW2_PERFORMANCE_BUDGETS
type Observation = Partial<Record<BudgetKey, number | null>>

export interface PerformanceGate {
  metric: BudgetKey
  status: PerformanceGateStatus
  observed: number | null
  target: number
  limit: number
}

function evaluateMetric(
  metric: BudgetKey,
  observed: number | null | undefined,
): PerformanceGate {
  const budget = AW2_PERFORMANCE_BUDGETS[metric]
  if (observed === null || observed === undefined)
    return { metric, status: "NOT_RUN", observed: null, ...budget }
  if (!Number.isFinite(observed) || observed < 0)
    return { metric, status: "FAIL", observed: null, ...budget }
  const pass =
    budget.direction === "lower"
      ? observed <= budget.target
      : observed >= budget.target
  const withinLimit =
    budget.direction === "lower"
      ? observed <= budget.limit
      : observed >= budget.limit
  return {
    metric,
    status: pass ? "PASS" : withinLimit ? "WARN" : "FAIL",
    observed: Math.round(observed),
    target: budget.target,
    limit: budget.limit,
  }
}

/** Pure evaluator. Missing runtime/device values stay NOT_RUN. */
export function evaluateAw2Performance(observation: Observation) {
  return (Object.keys(AW2_PERFORMANCE_BUDGETS) as BudgetKey[]).map((metric) =>
    evaluateMetric(metric, observation[metric]),
  )
}

export const AW2_TELEMETRY_METRICS = [
  "page_load_ms",
  "raf_hz",
  "js_heap_bytes",
  "long_task_ms",
  "render_failure_count",
] as const
export type Aw2TelemetryMetric = typeof AW2_TELEMETRY_METRICS[number]
export type Aw2TelemetryRoute = "world" | "chest"

const telemetrySpec: Record<Aw2TelemetryMetric, {
  unit: "ms" | "hz" | "bytes" | "count"
  max: number
}> = {
  page_load_ms: { unit: "ms", max: 120_000 },
  raf_hz: { unit: "hz", max: 240 },
  js_heap_bytes: { unit: "bytes", max: 2_000_000_000 },
  long_task_ms: { unit: "ms", max: 60_000 },
  render_failure_count: { unit: "count", max: 1 },
}

/** Explicit scalar whitelist. The returned event has no save, URL, identity or free-text field. */
export function createAw2TelemetryEvent(input: {
  metric: Aw2TelemetryMetric
  route: Aw2TelemetryRoute
  value: number
}) {
  const spec = telemetrySpec[input.metric]
  if (!spec || !["world", "chest"].includes(input.route))
    throw Error("Unsupported AW2 telemetry field")
  if (!Number.isFinite(input.value) || input.value < 0)
    throw Error("Invalid AW2 telemetry measurement")
  return {
    format: AW2_PERFORMANCE_CONTRACT_ID,
    metric: input.metric,
    route: input.route,
    value: Math.min(spec.max, Math.round(input.value * 10) / 10),
    unit: spec.unit,
  }
}

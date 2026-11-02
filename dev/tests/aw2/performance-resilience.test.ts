import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import buildSize from "../../docs/release/build-size.json"
import { PerformanceDisclosure } from "../../aw2/PerformanceDisclosure"
import {
  Aw2RecoveryFallback,
  safeAw2Incident,
} from "@/aw2/observability/Aw2ErrorBoundary"
import {
  AW2_PERFORMANCE_BUDGETS,
  AW2_PERFORMANCE_CONTRACT_ID,
  createAw2TelemetryEvent,
  evaluateAw2Performance,
} from "@/aw2/observability/performance"

describe("AW2 performance and telemetry contract", () => {
  it("keeps the measured production package inside all build budgets", () => {
    const gates = evaluateAw2Performance({
      productionBytes: buildSize.bytes,
      offlineShellBytes: buildSize.offlineShell.bytes,
      jsGzipBytes: buildSize.js_gzip,
    })
    expect(gates.slice(0, 3).map((gate) => gate.status)).toEqual([
      "PASS",
      "PASS",
      "PASS",
    ])
    expect(gates.slice(3).every((gate) => gate.status === "NOT_RUN")).toBe(true)
    expect(AW2_PERFORMANCE_BUDGETS.jsGzipBytes.limit).toBe(710_000)
  })

  it("distinguishes PASS, WARN, FAIL and NOT_RUN in both directions", () => {
    const gates = evaluateAw2Performance({
      pageLoadMs: 2_000,
      longTaskMs: 200,
      jsHeapBytes: 400 * 1024 * 1024,
      rafHz: null,
    })
    expect(
      Object.fromEntries(gates.map((gate) => [gate.metric, gate.status])),
    ).toMatchObject({
      pageLoadMs: "PASS",
      longTaskMs: "WARN",
      jsHeapBytes: "FAIL",
      rafHz: "NOT_RUN",
    })
    expect(
      evaluateAw2Performance({ rafHz: 45 }).find((g) => g.metric === "rafHz"),
    ).toMatchObject({ status: "WARN" })
  })

  it.each([NaN, Infinity, -1])(
    "never promotes invalid observation %s to PASS",
    (value) => {
      expect(
        evaluateAw2Performance({ pageLoadMs: value }).find(
          (gate) => gate.metric === "pageLoadMs",
        )?.status,
      ).toBe("FAIL")
    },
  )

  it("creates only clamped, rounded, allowlisted scalar events", () => {
    expect(
      createAw2TelemetryEvent({
        metric: "page_load_ms",
        route: "world",
        value: 1234.56,
      }),
    ).toEqual({
      format: AW2_PERFORMANCE_CONTRACT_ID,
      metric: "page_load_ms",
      route: "world",
      value: 1234.6,
      unit: "ms",
    })
    expect(
      createAw2TelemetryEvent({
        metric: "render_failure_count",
        route: "world",
        value: 99,
      }).value,
    ).toBe(1)
    expect(() =>
      createAw2TelemetryEvent({
        metric: "raw_save" as never,
        route: "world",
        value: 1,
      }),
    ).toThrow()
  })

  it("classifies render incidents without retaining private error details", () => {
    const privateError = new TypeError("PRIVATE_SAVE PRIVATE_URL PRIVATE_STACK")
    privateError.stack = "PRIVATE_STACK"
    expect(safeAw2Incident(privateError)).toBe("AW2-UI-RENDER")
    expect(safeAw2Incident(new RangeError("PRIVATE"))).toBe("AW2-UI-RANGE")
    expect(safeAw2Incident("PRIVATE")).toBe("AW2-UI-UNKNOWN")
    expect(JSON.stringify(safeAw2Incident(privateError))).not.toContain(
      "PRIVATE",
    )
  })

  it("renders a no-save-touch recovery surface and honest disclosure", () => {
    const fallback = renderToStaticMarkup(
      createElement(Aw2RecoveryFallback, { incident: "AW2-UI-RENDER" }),
    )
    expect(fallback).toContain("không sửa, xóa hoặc xuất bản lưu")
    expect(fallback).toContain("Tải lại hành trình")
    expect(fallback).toContain('href="/chest"')
    const disclosure = renderToStaticMarkup(
      createElement(PerformanceDisclosure),
    )
    expect(disclosure).toContain("710")
    expect(disclosure).toContain("NOT_RUN")
    expect(disclosure).toContain("không tự gửi mạng")
  })

  it("wires the boundary only around the AW2 production surface", () => {
    const source = readFileSync("src/production.tsx", "utf8")
    const boundary = readFileSync(
      "src/aw2/observability/Aw2ErrorBoundary.tsx",
      "utf8",
    )
    expect(
      source.indexOf('productionSurface(location.pathname) === "chest"'),
    ).toBeLessThan(source.indexOf("<Aw2ErrorBoundary>"))
    expect(source).toContain("<WorldPreview production />")
    expect(boundary).not.toMatch(
      /localStorage|sessionStorage|fetch\(|sendBeacon|XMLHttpRequest/,
    )
  })
})

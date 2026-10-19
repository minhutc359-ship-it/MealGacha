import { useEffect, useState } from "react"
import { CULTURAL_PAGES, type CulturalPage } from "./culture"

let cached: CulturalPage[] | null = null
let pending: Promise<CulturalPage[]> | null = null
function load() {
  return (pending ??= fetch("/assets/culture5920/journeys.json")
    .then(async (response) => {
      if (!response.ok) throw Error("culture")
      const pages = (await response.json()) as CulturalPage[]
      if (
        !Array.isArray(pages) ||
        pages.length !== CULTURAL_PAGES.length ||
        !CULTURAL_PAGES.every((p) =>
          pages.some(
            (v) =>
              v.id === p.id &&
              v.steps?.length === 3 &&
              typeof v.fact === "string",
          ),
        )
      )
        throw Error("culture data")
      return (cached = pages)
    })
    .catch((error) => {
      pending = null
      throw error
    }))
}
export function useCultureContent(enabled = true) {
  const [pages, setPages] = useState(cached),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let current = true
    setError(false)
    void load()
      .then((value) => {
        if (current) setPages(value)
      })
      .catch(() => {
        if (current) setError(true)
      })
    return () => {
      current = false
    }
  }, [enabled, retry])
  return { pages, error, retry: () => setRetry((n) => n + 1) }
}

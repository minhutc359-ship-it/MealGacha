import { useEffect, useState } from "react"

export function useCompactPageSize() {
  const measure = () =>
    typeof window === "undefined"
      ? 3
      : window.innerHeight < 500
        ? 1
        : window.innerHeight < 760
          ? 2
          : 3
  const [size, setSize] = useState(measure)
  useEffect(() => {
    const resize = () => setSize(measure())
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  return size
}

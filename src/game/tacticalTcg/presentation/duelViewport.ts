import { useEffect, useState } from "react"
const KEY = "soul-of-meal.tactical-tcg.landscape.v1"
export function useDuelViewport() {
  const [size, setSize] = useState({ w: 1360, h: 900 })
  const [wide, setWide] = useState(
    () =>
      typeof localStorage === "undefined" ||
      localStorage.getItem(KEY) !== "portrait",
  )
  useEffect(() => {
    const sync = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])
  const rotated = wide && size.w < 640 && size.h > size.w
  return {
    rotated,
    short: (rotated ? size.w : size.h) < 540,
    narrow: (rotated ? size.h : size.w) < 780,
    mobile: size.w < 780 || size.h < 540,
    toggle: () =>
      setWide((v) => {
        const next = !v
        try {
          localStorage.setItem(KEY, next ? "landscape" : "portrait")
        } catch {}
        return next
      }),
    wide,
    size,
    style: rotated
      ? {
          inset: "auto",
          left: "50%",
          top: "50%",
          width: `${size.h}px`,
          height: `${size.w}px`,
          transform: "translate(-50%,-50%) rotate(90deg)",
        }
      : undefined,
  }
}

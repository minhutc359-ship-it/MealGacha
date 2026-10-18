import { createServer } from "vite"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const checking = process.argv.includes("--check")
const additions = JSON.parse(
  readFileSync(path.join(root, "dev/content/manga5916.json"), "utf8"),
)
const measuredFrames = JSON.parse(
  readFileSync(path.join(root, "dev/docs/web-v5916/art-frames.json"), "utf8"),
)
const rows = {
  tcg: {
    lantern: [0, 273, 558, 825, 1083, 1448],
    harbor: [0, 319, 541, 800, 1145, 1448],
    garden: [0, 362, 624, 861, 1101, 1448],
    tide: [0, 288, 567, 817, 1135, 1448],
    moon: [0, 319, 565, 820, 1146, 1448],
    "last-table": [0, 381, 665, 904, 1085, 1448],
    "living-market": [0, 271, 542, 770, 1137, 1448],
    "rain-harbor": [0, 273, 559, 892, 1163, 1448],
    "tomorrow-table": [0, 385, 628, 876, 1168, 1448],
  },
  adventure: {
    lantern: [0, 270, 633, 952, 1164, 1448],
    harbor: [0, 257, 467, 769, 1127, 1448],
    garden: [0, 378, 586, 884, 1126, 1448],
    tide: [0, 316, 585, 862, 1112, 1448],
    mistwood: [0, 341, 636, 892, 1162, 1448],
    sugartower: [0, 267, 478, 946, 1183, 1448],
    ashalley: [0, 269, 599, 836, 1144, 1448],
    lasttable: [0, 325, 560, 821, 1084, 1448],
  },
}
const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: "custom",
})
try {
  const {
    TCG_MANGA_CHAPTERS,
    ADVENTURE_MANGA_CHAPTERS,
    mangaPages,
    mangaEdition,
  } = await server.ssrLoadModule("/src/game/mangaChronicle.ts")
  const { LIVING_CHOICES } = await server.ssrLoadModule(
    "/src/game/livingChoices.ts",
  )
  const report = []
  for (const [track, chapters] of [
    ["tcg", TCG_MANGA_CHAPTERS],
    ["adventure", ADVENTURE_MANGA_CHAPTERS],
  ]) {
    for (const chapter of chapters) {
      const scenes = additions[track][chapter.id].map(([title, ...rest]) => ({
        title,
        lines: Array.from({ length: rest.length / 2 }, (_, i) => ({
          speaker: rest[i * 2],
          text: rest[i * 2 + 1],
        })),
      }))
      const edges = rows[track][chapter.id]
      const extra = {
        scenes,
        originalFrames: edges
          .slice(0, -1)
          .map((top, i) => [0, top, 1086, edges[i + 1] - top]),
        extraFrames: measuredFrames[`${track}/${chapter.id}`],
        originalSize: [1086, 1448],
        extraSize: [1536, 1024],
        extraImage: `/assets/manga5916/${track}/${chapter.id}.webp`,
      }
      // Slanted panels: preserve each entire panel's bounding box, including its
      // diagonal edges. The full untouched page is always available in the reader.
      if (track === "adventure" && chapter.id === "garden")
        extra.originalFrames = [
          [0, 0, 1086, 378],
          [0, 316, 1086, 273],
          [0, 562, 1086, 322],
          [0, 860, 1086, 266],
          [0, 1060, 1086, 388],
        ]
      const editions = { base: mangaPages(track, chapter, extra) }
      const contexts =
        track === "adventure"
          ? [{ choice: 0 }, { choice: 1 }]
          : chapter.id === "last-table"
            ? [{ storyEnding: "remember" }, { storyEnding: "release" }]
            : LIVING_CHOICES.some((c) => c.id === chapter.id)
              ? [null, "remember", "release"].flatMap((storyEnding) =>
                  [
                    undefined,
                    ...LIVING_CHOICES.find(
                      (c) => c.id === chapter.id,
                    ).options.map((o) => o.id),
                  ].map((decision) => ({
                    storyEnding,
                    story400: {
                      version: 1,
                      giftClaimed: false,
                      originEnding: storyEnding,
                      decisions: decision ? { [chapter.id]: decision } : {},
                      choices: {},
                      seenScenes: [],
                      claimedRewards: [],
                    },
                  })),
                )
              : []
      for (const context of contexts)
        editions[mangaEdition(track, chapter.id, context)] = mangaPages(
          track,
          chapter,
          extra,
          context,
        )
      const file = path.join(
        root,
        `public/assets/manga5916/${track}/${chapter.id}.json`,
      )
      const text = JSON.stringify({ ...extra, editions }) + "\n"
      if (checking) {
        if (readFileSync(file, "utf8") !== text)
          throw Error(`Stale manga book: ${file}`)
      } else {
        mkdirSync(path.dirname(file), { recursive: true })
        writeFileSync(file, text)
      }
      report.push({
        track,
        id: chapter.id,
        title: chapter.title,
        pages: editions.base.length,
        maxPages: Math.max(...Object.values(editions).map((e) => e.length)),
        editions: Object.keys(editions).length,
        bytes: Buffer.byteLength(text),
      })
    }
  }
  const reportPath = path.join(root, "dev/docs/web-v5916/books.json")
  if (!checking)
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n")
  console.log(
    JSON.stringify({
      chapters: report.length,
      pages: report.reduce((n, r) => n + r.pages, 0),
      min: Math.min(...report.map((r) => r.pages)),
      max: Math.max(...report.map((r) => r.maxPages)),
      bytes: report.reduce((n, r) => n + r.bytes, 0),
      checking,
    }),
  )
} finally {
  await server.close()
}

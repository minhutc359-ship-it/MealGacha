import { writeFileSync } from "node:fs"
// Original vector sprites. Pixel coordinates are deliberate: no external sprites or image samples.
const palette = {
  hero: ["#293e3b", "#f1c39b", "#547b71", "#f3d67e"],
  bach: ["#3e3330", "#e9b890", "#8e6654", "#d9b962"],
  hai: ["#283649", "#e6bd98", "#497d9a", "#bddcd4"],
  moc: ["#334237", "#e7bd94", "#64845d", "#e3db91"],
  nhien: ["#513b34", "#e7b08e", "#b96546", "#f1c469"],
  lien: ["#41374b", "#efc4aa", "#877192", "#f0d3a0"],
  grandmother: ["#b8bcb2", "#ddb193", "#88664f", "#e6d5ae"],
  merchant: ["#4b3c35", "#dcab80", "#5e7b85", "#d6b46e"],
  child: ["#443934", "#eebf9a", "#bf735c", "#e4ca76"],
  la: ["#463644", "#e8b69e", "#91707b", "#d7c488"],
}
const rect = (x, y, w, h, c) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
const symbols = []
for (const [name, [hair, skin, coat, trim]] of Object.entries(palette))
  for (const direction of ["down", "up", "left", "right"])
    for (let frame = 0; frame < 2; frame++) {
      const side = direction === "left" || direction === "right",
        back = direction === "up",
        flip = direction === "left"
      let body =
        rect(6, 19, 4, 4, "#304039") +
        rect(11, 19, 4, 4, "#304039") +
        rect(5, 23 - frame, 5, 2, "#453b35") +
        rect(11, 22 + frame, 5, 2, "#453b35")
      body +=
        rect(5, 11, 11, 9, coat) +
        rect(4, 12 + frame, 3, 6, skin) +
        rect(14, 13 - frame, 3, 6, skin) +
        rect(7, 17, 7, 2, trim)
      body +=
        rect(6, 3, 9, 9, skin) +
        rect(5, 2, 11, 5, hair) +
        rect(5, 5, 2, 5, hair) +
        rect(14, 5, 2, 4, hair)
      if (back) body += rect(6, 6, 9, 5, hair)
      else if (side)
        body += rect(12, 7, 2, 2, "#253b35") + rect(14, 9, 2, 1, "#bb7b65")
      else
        body +=
          rect(7, 7, 2, 2, "#253b35") +
          rect(12, 7, 2, 2, "#253b35") +
          rect(9, 10, 3, 1, "#bb7b65")
      if (name === "hero")
        body +=
          rect(4, 1, 13, 3, trim) +
          rect(7, 0, 7, 1, trim) +
          rect(8, 12, 3, 4, "#ecddb3")
      symbols.push(
        `<symbol id="${name}-${direction}-${frame}" viewBox="0 0 22 28"><g${
          flip ? ' transform="translate(22 0) scale(-1 1)"' : ""
        }>${body}</g></symbol>`,
      )
    }
symbols.push(
  `<symbol id="tree" viewBox="0 0 32 40"><path fill="#374e3a" d="M13 24h7v15h-7z"/><path fill="#315c46" d="M8 4h16v4h4v6h3v13h-5v5H6v-5H1V14h3V8h4z"/><path fill="#527852" d="M8 4h14v5h5v10H5V10h3z"/><path fill="#73935c" d="M9 5h9v4H7v6H4v-5h5z"/></symbol>`,
)
symbols.push(
  `<symbol id="grass" viewBox="0 0 32 32"><path fill="#628e59" d="M3 25V11l5 8 3-13 3 15 5-12 3 11 6-8v13z"/><path fill="#92b36a" d="M5 25v-8l4 6 3-8 2 10zm14 0 3-11 2 9 4-7v9z"/></symbol>`,
)
symbols.push(
  `<symbol id="sign" viewBox="0 0 32 36"><path fill="#67523a" d="M14 15h5v20h-5z"/><path fill="#bca26b" d="M3 3h26v16H3z"/><path fill="#eee0a3" d="M5 5h22v11H5z"/><path stroke="#765f41" stroke-width="2" d="M9 9h15m-15 4h10"/></symbol>`,
)
symbols.push(
  `<symbol id="gift" viewBox="0 0 32 32"><path fill="#91633e" d="M6 9h20v19H6z"/><path fill="#eac36a" d="M3 8h26v7H3zM14 8h4v20h-4z"/><path fill="#efdd96" d="m16 8-8-2V2h6zm0 0 8-2V2h-6z"/></symbol>`,
)
symbols.push(
  `<symbol id="storage" viewBox="0 0 32 36"><path fill="#77583e" d="M3 3h26v30H3z"/><path fill="#cbae73" d="M5 5h22v26H5z"/><path fill="#4d765f" d="M7 7h18v9H7z"/><path fill="#e8d995" d="M10 9h12v5H10z"/><path stroke="#79623e" stroke-width="2" d="M7 21h18m-18 6h18"/></symbol>`,
)
for (const [kind, roof, emblem] of [
  ["clinic", "#a55d50", "♨"],
  ["shop", "#648894", "✦"],
  ["home", "#788462", "◇"],
])
  symbols.push(
    `<symbol id="house-${kind}" viewBox="0 0 128 128"><path fill="#3c493d" opacity=".25" d="M7 42h114v78H7z"/><path fill="#e5cd9b" d="M10 42h108v69H10z"/><path fill="#927548" d="M10 98h108v13H10z"/><path fill="${roof}" d="M7 22h114v12h7v18H0V34h7z"/><path stroke="#3e4a3d" opacity=".3" stroke-width="3" d="M7 30h114M0 40h128"/><path fill="#425e56" d="M19 63h21v20H19zm70 0h21v20H89z"/><path stroke="#e7ce95" stroke-width="3" d="M30 63v20m70-20v20"/><path fill="#886343" d="M43 80h30v31H43z"/><path fill="#304940" d="M48 84h20v27H48z"/><path fill="#f0dfa5" d="M48 53h30v22H48z"/><text x="63" y="70" text-anchor="middle" fill="#64533a" font-size="17">${emblem}</text></symbol>`,
  )
writeFileSync(
  "public/assets/adventure/world.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><defs>${symbols.join("\n")}</defs></svg>\n`,
)
console.log(`Generated ${symbols.length} original SVG sprite symbols.`)

import assert from "node:assert/strict"
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import path from "node:path"
import { createServer } from "vite"

// Resolve the actual runtime catalog and manifests; do not infer completion from names.
const server = await createServer({configFile:"dev/tools/vite.pvp-qa.config.ts",server:{middlewareMode:true},appType:"custom"})
try {
  const [{SPIRIT_IDS}, {CHARACTER_VISUALS}, {CARD_MAP}, {tcgCharacter}, {UNIT_MAP}] = await Promise.all([
    server.ssrLoadModule("/src/game/adventureRpg/spiritArt.ts"),
    server.ssrLoadModule("/src/game/characterVisuals.ts"),
    server.ssrLoadModule("/src/game/catalog.ts"),
    server.ssrLoadModule("/src/game/tcgCharacterMotion.ts"),
    server.ssrLoadModule("/src/game/autochess/catalog.ts"),
  ])
  const rows=SPIRIT_IDS.map(id=>({id,name:CARD_MAP[id].name,authored32Poses:!!CHARACTER_VISUALS[id],autoRoster:!!UNIT_MAP[id],model:tcgCharacter(CARD_MAP[id])}))
  const produced=rows.filter(r=>r.authored32Poses).map(r=>r.id)
  for(const id of produced) for(const asset of [CHARACTER_VISUALS[id].atlas,CHARACTER_VISUALS[id].pixel])
    assert(existsSync(`public${asset}`),`Missing production atlas ${asset}`)
  const portraitOnly=rows.filter(r=>r.model.sheet.startsWith("portrait-")).map(r=>r.id)
  const legacyAnimated=rows.filter(r=>!r.authored32Poses&&!r.model.sheet.startsWith("portrait-")).map(r=>r.id)
  assert.equal(produced.length+portraitOnly.length+legacyAnimated.length,139)
  assert.equal(new Set(rows.map(r=>`${r.model.sheet}:${r.model.row}`)).size,139,"Shared character model")
  const result={version:JSON.parse(readFileSync("package.json","utf8")).version,total:rows.length,produced:{count:produced.length,ids:produced},remaining:{count:portraitOnly.length+legacyAnimated.length,portraitOnly,legacyAnimated},autoRosterCount:Object.keys(UNIT_MAP).length,uniqueTcgModels:true,rows}
  const out=process.argv[2]??"dev/docs/web-v5912/model-audit.json";mkdirSync(path.dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(result,null,2)+"\n")
  console.log(JSON.stringify({total:result.total,produced:produced.length,portraitOnly:portraitOnly.length,legacyAnimated:legacyAnimated.length,autoRoster:result.autoRosterCount}))
} finally {await server.close()}

import assert from "node:assert/strict"
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import path from "node:path"
import { createServer } from "vite"

// Resolve the actual runtime catalog and manifests; do not infer completion from names.
const server = await createServer({configFile:"dev/tools/vite.pvp-qa.config.ts",server:{middlewareMode:true},appType:"custom"})
try {
  const [{SPIRIT_IDS}, {CHARACTER_VISUALS}, {CARD_MAP}, {tcgCharacter}, {UNIT_MAP}, {unitCharacter}] = await Promise.all([
    server.ssrLoadModule("/src/game/adventureRpg/spiritArt.ts"),
    server.ssrLoadModule("/src/game/characterVisuals.ts"),
    server.ssrLoadModule("/src/game/catalog.ts"),
    server.ssrLoadModule("/src/game/tcgCharacterMotion.ts"),
    server.ssrLoadModule("/src/game/autochess/catalog.ts"),
    server.ssrLoadModule("/src/infrastructure/assets/characterSprites.ts"),
  ])
  const rows=SPIRIT_IDS.map(id=>({id,name:CARD_MAP[id].name,authored32Poses:!!CHARACTER_VISUALS[id],autoRoster:!!UNIT_MAP[id],model:tcgCharacter(CARD_MAP[id])}))
  const produced=rows.filter(r=>r.authored32Poses).map(r=>r.id)
  for(const id of produced) for(const asset of [CHARACTER_VISUALS[id].atlas,CHARACTER_VISUALS[id].pixel])
    assert(existsSync(`public${asset}`),`Missing production atlas ${asset}`)
  const portraitOnly=rows.filter(r=>r.model.sheet.startsWith("portrait-")).map(r=>r.id)
  const legacyAnimated=rows.filter(r=>!r.authored32Poses&&!r.model.sheet.startsWith("portrait-")).map(r=>r.id)
  const autoRows=Object.keys(UNIT_MAP).map(id=>({id,model:unitCharacter(id)}))
  const genericAuto=autoRows.filter(r=>["base","fresh"].includes(r.model.sheet)).map(r=>r.id)
  const uniqueAutoModels=new Set(autoRows.map(r=>`${r.model.sheet}:${r.model.row}`))
  assert.equal(produced.length+portraitOnly.length+legacyAnimated.length,139)
  assert.equal(new Set(rows.map(r=>`${r.model.sheet}:${r.model.row}`)).size,139,"Shared character model")
  assert.equal(uniqueAutoModels.size,autoRows.length,"Shared Auto roster model")
  const version=JSON.parse(readFileSync("package.json","utf8")).version
  const result={version,total:rows.length,produced:{count:produced.length,ids:produced},remaining:{count:portraitOnly.length+legacyAnimated.length,portraitOnly,legacyAnimated},autoRosterCount:autoRows.length,autoRoster:{count:autoRows.length,uniqueModelCount:uniqueAutoModels.size,authored32PoseCount:autoRows.filter(r=>!!CHARACTER_VISUALS[r.id]).length,legacyAtlasModelIds:genericAuto},uniqueTcgModels:true,rows}
  const out=process.argv[2]??`dev/docs/web-v${version.replaceAll(".","")}/model-audit.json`;mkdirSync(path.dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(result,null,2)+"\n")
  console.log(JSON.stringify({total:result.total,produced:produced.length,portraitOnly:portraitOnly.length,legacyAnimated:legacyAnimated.length,autoRoster:result.autoRoster}))
} finally {await server.close()}

import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { inspectRelease } from "../../releaseGuard.mjs"

test("rejects source, archive, inline map, credential and symlink publication", () => {
  const root = mkdtempSync(path.join(tmpdir(),"meal-release-"))
  try {
    mkdirSync(path.join(root,"assets"));mkdirSync(path.join(root,"src"))
    writeFileSync(path.join(root,"src","hidden.ts"),"export const x = 1")
    writeFileSync(path.join(root,"assets","app.js"),"console.log('Soul of Meal')")
    writeFileSync(path.join(root,"index.html"),"<!doctype html><title>Meal</title>")
    assert.equal(inspectRelease(root).length,1)
    writeFileSync(path.join(root,"assets","app.js"),"//# sourceMappingURL=data:application/json;base64,e30=")
    writeFileSync(path.join(root,".env.production"),"PRIVATE=value")
    writeFileSync(path.join(root,"backup.zip"),"archive")
    writeFileSync(path.join(root,"credentials.txt"),"-----BEGIN PRIVATE KEY-----")
    writeFileSync(path.join(root,"policy.html"),'<a href="https://github.com/minhutc359-ship-it/MealGacha/issues">Support</a>')
    symlinkSync(path.join(root,"index.html"),path.join(root,"alias.html"))
    const found = inspectRelease(root).join("\n")
    for (const marker of ["private directory","embedded source map",".env.production","backup.zip","credential pattern","symlink","project source link"]) assert.ok(found.includes(marker),marker)
    rmSync(path.join(root,"src"),{recursive:true});rmSync(path.join(root,".env.production"));rmSync(path.join(root,"backup.zip"));rmSync(path.join(root,"credentials.txt"));rmSync(path.join(root,"alias.html"))
    writeFileSync(path.join(root,"assets","app.js"),"console.log('Soul of Meal')")
    writeFileSync(path.join(root,"policy.html"),'<a href="https://github.com/facebook/react">Upstream license</a>')
    assert.deepEqual(inspectRelease(root),[])
  } finally {rmSync(root,{recursive:true,force:true})}
})

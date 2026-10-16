import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { acquireCharacterImage, characterCacheStats } from "@/infrastructure/assets/characterSprites"

const made: TestImage[]=[]
class TestImage extends EventTarget {
  decoding="async"
  src=""
  complete=false
  naturalWidth=0
  naturalHeight=0
  constructor(){super();made.push(this)}
  fail(){this.complete=true;this.dispatchEvent(new Event("error"))}
  load(){this.complete=true;this.naturalWidth=this.naturalHeight=16;this.dispatchEvent(new Event("load"))}
}
beforeEach(()=>{made.length=0;vi.stubGlobal("Image",TestImage)})
afterEach(()=>vi.unstubAllGlobals())
describe("character image recovery",()=>{
  it("shares a failed request while visible, then retries after the last consumer leaves",()=>{
    const a=acquireCharacterImage("/qa/offline.webp"),b=acquireCharacterImage("/qa/offline.webp")
    expect(a.image).toBe(b.image);expect(made).toHaveLength(1)
    made[0].fail();a.release();a.release()
    const c=acquireCharacterImage("/qa/offline.webp")
    expect(c.image).toBe(b.image);expect(made).toHaveLength(1)
    c.release();b.release()
    expect(characterCacheStats()).toMatchObject({count:0,leased:0})
    const retry=acquireCharacterImage("/qa/offline.webp")
    expect(retry.image).not.toBe(a.image);expect(made).toHaveLength(2)
    retry.release();made[1].fail()
    expect(characterCacheStats()).toMatchObject({count:0,leased:0})
  })
  it("ignores a late error from a replaced image without discarding the retry",()=>{
    const a=acquireCharacterImage("/qa/late-error.webp"),old=made[0]
    old.complete=true;a.release()
    const retry=acquireCharacterImage("/qa/late-error.webp")
    old.dispatchEvent(new Event("error"))
    const shared=acquireCharacterImage("/qa/late-error.webp")
    expect(shared.image).toBe(retry.image);expect(made).toHaveLength(2)
    shared.release();retry.release();made[1].fail()
    expect(characterCacheStats()).toMatchObject({count:0,leased:0})
  })
  it("retains a successful image for reuse after consumers release it",()=>{
    const a=acquireCharacterImage("/qa/loaded.webp");made[0].load();a.release()
    const b=acquireCharacterImage("/qa/loaded.webp")
    expect(b.image).toBe(a.image);expect(made).toHaveLength(1)
    b.release();expect(characterCacheStats().leased).toBe(0)
  })
})

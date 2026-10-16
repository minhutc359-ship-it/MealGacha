import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WEB_BUDGET, checkWebBudget } from '../tools/web-budget.mjs'

test('Web build warns at 300 MB, permits exactly 320 MB and rejects overflow',()=>{
  assert.equal(checkWebBudget(299_999_999).warning,false)
  assert.equal(checkWebBudget(300_000_000).warning,true)
  assert.equal(checkWebBudget(300_000_000).exceeded,false)
  assert.equal(checkWebBudget(320_000_000).exceeded,false)
  assert.equal(checkWebBudget(320_000_000).remainingBytes,0)
  assert.equal(checkWebBudget(320_000_001).exceeded,true)
})
test('initial delivery has its own 8/12 MB budget and JS retains its approved guard',()=>{
  assert.equal(checkWebBudget(8_000_000,true).warning,true)
  assert.equal(checkWebBudget(12_000_000,true).exceeded,false)
  assert.equal(checkWebBudget(12_000_001,true).exceeded,true)
  assert.equal(WEB_BUDGET.jsGzipBudgetBytes,675_000)
  assert.equal(Object.values(WEB_BUDGET.allocations).reduce((s,n)=>s+n,0),60_000_000)
  assert.equal(WEB_BUDGET.allocations.starterSpirits,12_000_000)
})
test('unused capacity is not a spending target and asset averages are advisory',()=>{
  assert.deepEqual(checkWebBudget(255_361_946),{targetBytes:300_000_000,limitBytes:320_000_000,warning:false,exceeded:false,remainingBytes:64_638_054})
  assert.deepEqual(WEB_BUDGET.assetTargets.heroCharacterBytes,[1_000_000,2_000_000])
  assert.throws(()=>checkWebBudget(-1));assert.throws(()=>checkWebBudget(NaN))
})

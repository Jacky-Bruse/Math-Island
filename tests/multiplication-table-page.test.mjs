import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/pages/MultiplicationTablePage.tsx', import.meta.url), 'utf8')

assert.equal(source.includes('Apple Formula Table'), false)
assert.equal(source.includes('用纯数字表格读口诀，再点进去看每一句的意思。'), false)
assert.equal(
  source.includes('完整朗读会按口诀表顺序从头读到尾，完整跟读会在每句中间停顿，整组朗读只读当前这一组。'),
  true,
)
assert.match(
  source,
  /data-testid="multiplication-table-locked-shell"[\s\S]*className="[^"]*sticky[^"]*top-0[^"]*z-20[^"]*"/,
)

console.log('multiplication table page checks passed')

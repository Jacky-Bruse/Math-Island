// 拼音正字法 / 拼读合法性轻量断言（无测试框架，用 node:assert + tsx 运行）
// 运行：npx tsx scripts/test-pinyin.ts
import assert from 'node:assert/strict'
import { blendBase, applyToneMark, toAudioKey } from '../src/lib/pinyin-orthography'
import { isValidBlend, toSyllable, availableTones } from '../src/lib/pinyin-syllables'
import type { Tone } from '../src/types/pinyin'

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ✓ ${name}`)
}

console.log('blendBase（介韵缩写 / ü 拼写）')
check('g + uei → gui', () => assert.equal(blendBase('g', 'uei'), 'gui'))
check('n + iou → niu', () => assert.equal(blendBase('n', 'iou'), 'niu'))
check('d + uen → dun', () => assert.equal(blendBase('d', 'uen'), 'dun'))
check('j + ü → ju', () => assert.equal(blendBase('j', 'ü'), 'ju'))
check('x + üe → xue', () => assert.equal(blendBase('x', 'üe'), 'xue'))
check('q + üan → quan', () => assert.equal(blendBase('q', 'üan'), 'quan'))
check('n + ü → nü（保留）', () => assert.equal(blendBase('n', 'ü'), 'nü'))
check('l + üe → lüe（保留）', () => assert.equal(blendBase('l', 'üe'), 'lüe'))
check('m + a → ma', () => assert.equal(blendBase('m', 'a'), 'ma'))

console.log('applyToneMark（声调符号位置）')
check('ma 1 → mā', () => assert.equal(applyToneMark('ma', 1), 'mā'))
check('gui 1 → guī（标 i）', () => assert.equal(applyToneMark('gui', 1), 'guī'))
check('liu 2 → liú（标 u）', () => assert.equal(applyToneMark('liu', 2), 'liú'))
check('hao 3 → hǎo（标 a）', () => assert.equal(applyToneMark('hao', 3), 'hǎo'))
check('xue 2 → xué（标 e）', () => assert.equal(applyToneMark('xue', 2), 'xué'))
check('ou 4 → òu（标 o）', () => assert.equal(applyToneMark('ou', 4), 'òu'))
check('nü 3 → nǚ', () => assert.equal(applyToneMark('nü', 3), 'nǚ'))

console.log('toAudioKey（ü→v 归一）')
check('nü 3 → nv3', () => assert.equal(toAudioKey('nü', 3), 'nv3'))
check('lüe 4 → lve4', () => assert.equal(toAudioKey('lüe', 4), 'lve4'))
check('ju 2 → ju2', () => assert.equal(toAudioKey('ju', 2), 'ju2'))
check('ma 1 → ma1', () => assert.equal(toAudioKey('ma', 1), 'ma1'))

console.log('isValidBlend / toSyllable')
check('m + a 合法', () => assert.equal(isValidBlend('m', 'a'), true))
check('g + uei 合法', () => assert.equal(isValidBlend('g', 'uei'), true))
check('b + e 非法', () => assert.equal(isValidBlend('b', 'e'), false))
check('f + i 非法', () => assert.equal(isValidBlend('f', 'i'), false))
check('y 不参与拼读', () => assert.equal(isValidBlend('y', 'a'), false))
check('toSyllable(m,a,1) 结构化', () => {
  assert.deepEqual(toSyllable('m', 'a', 1), { display: 'mā', audioKey: 'ma1', base: 'ma', tone: 1 })
})
check('toSyllable(g,uei,1)', () => {
  assert.deepEqual(toSyllable('g', 'uei', 1), { display: 'guī', audioKey: 'gui1', base: 'gui', tone: 1 })
})
check('toSyllable(b,e,1) 非法→null', () => assert.equal(toSyllable('b', 'e', 1), null))

console.log('整体认读不可拼读 / 声调可用性')
check('zh + i 不可拼读（整体认读 zhi）', () => assert.equal(isValidBlend('zh', 'i'), false))
check('z + i 不可拼读（整体认读 zi）', () => assert.equal(isValidBlend('z', 'i'), false))
check('r + i 不可拼读（整体认读 ri）', () => assert.equal(isValidBlend('r', 'i'), false))
check('ma 四声齐全', () => assert.deepEqual(availableTones('m', 'a'), [1, 2, 3, 4]))
const juTones = availableTones('j', 'v') // j + ü
check('availableTones(j,ü) 非空', () => assert.ok(juTones.length > 0))
{
  const missing = ([1, 2, 3, 4] as Tone[]).find(t => !juTones.includes(t))
  const present = juTones[0]
  if (missing !== undefined) {
    check(`toSyllable(j,ü,${missing}) 缺录音→null`, () => assert.equal(toSyllable('j', 'v', missing), null))
  }
  check(`toSyllable(j,ü,${present}) 有录音→非 null`, () => assert.ok(toSyllable('j', 'v', present) !== null))
}

console.log(`\n全部通过：${passed} 项`)

// 拼音正字法 / 拼读合法性轻量断言（无测试框架，用 node:assert + tsx 运行）
// 运行：npx tsx scripts/test-pinyin.ts
import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { blendBase, applyToneMark, toAudioKey } from '../src/lib/pinyin-orthography'
import { BLEND_FINALS, BLEND_INITIALS, FINALS, INITIALS, WHOLE_SYLLABLES } from '../src/lib/pinyin-data'
import { DAV_OVERRIDE_KEYS, YABLA_LETTER_FALLBACK_KEYS } from '../src/lib/pinyin-audio-overrides'
import { blendBaseFor, isValidBlend, toSyllable, availableTones } from '../src/lib/pinyin-syllables'
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

console.log('认字母分类')
check('声母 23 个', () => assert.equal(INITIALS.length, 23))
check('韵母 24 个', () => assert.equal(FINALS.length, 24))
check('整体认读音节 16 个', () => assert.equal(WHOLE_SYLLABLES.length, 16))
check('韵母分类数量正确', () => {
  assert.deepEqual(
    Object.fromEntries(
      ['single-final', 'compound-final', 'special-final', 'front-nasal-final', 'back-nasal-final']
        .map(category => [category, FINALS.filter(item => item.category === category).length]),
    ),
    {
      'single-final': 6,
      'compound-final': 8,
      'special-final': 1,
      'front-nasal-final': 5,
      'back-nasal-final': 4,
    },
  )
})
check('er 是特殊韵母', () => assert.equal(FINALS.find(item => item.id === 'er')?.category, 'special-final'))

console.log('认字母音频')
const letterAudioKeys = [...new Set([
  ...INITIALS.map(item => item.audioSyllable),
  ...FINALS.map(item => item.audioRepresentative),
  ...WHOLE_SYLLABLES.map(item => item.audioKey),
])]
const yablaFallback = new Set(YABLA_LETTER_FALLBACK_KEYS)
const davOverride = new Set(DAV_OVERRIDE_KEYS)
check('63 张卡片共用 46 个音频键', () => assert.equal(letterAudioKeys.length, 46))
check('Yabla 缺失项仅 ei1', () => assert.deepEqual([...yablaFallback], ['ei1']))
check('其余 Yabla 音频均已复制且非空', () => {
  const missing = letterAudioKeys.filter(key => {
    if (yablaFallback.has(key)) return false
    const file = path.resolve('public/audio/cmn/yabla', `${key}.mp3`)
    return !existsSync(file) || statSync(file).size === 0
  })
  assert.deepEqual(missing, [])
})
check('旧版认字母音频已完整备份', () => {
  for (const key of letterAudioKeys) {
    const originalKey = key === 'ong' ? 'hong1' : key
    const relative = davOverride.has(originalKey)
      ? path.join('dav', `${originalKey}.mp3`)
      : path.join('syllabs', `cmn-${originalKey}.mp3`)
    const original = path.resolve('public/audio/cmn', relative)
    const backup = path.resolve('bak/pinyin-audio', relative)
    assert.ok(existsSync(backup), `缺少备份：${relative}`)
    assert.deepEqual(readFileSync(backup), readFileSync(original), `备份内容不一致：${relative}`)
  }
})

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

console.log('整体认读 -i 可拼读（四声练习） / 声调可用性')
check('zh + i 可拼读（zhi）', () => assert.equal(isValidBlend('zh', 'i'), true))
check('z + i 可拼读（zi）', () => assert.equal(isValidBlend('z', 'i'), true))
check('r + i 可拼读（ri）', () => assert.equal(isValidBlend('r', 'i'), true))
check('zh + i 四声齐全', () => assert.deepEqual(availableTones('zh', 'i'), [1, 2, 3, 4]))
check('toSyllable(sh,i,1) → shī', () => {
  assert.deepEqual(toSyllable('sh', 'i', 1), { display: 'shī', audioKey: 'shi1', base: 'shi', tone: 1 })
})
check('ma 四声齐全', () => assert.deepEqual(availableTones('m', 'a'), [1, 2, 3, 4]))
check('j + ü 四声齐全（含 ju4）', () => assert.deepEqual(availableTones('j', 'v'), [1, 2, 3, 4]))
check('toSyllable(j,ü,4) → jù', () => {
  assert.deepEqual(toSyllable('j', 'v', 4), { display: 'jù', audioKey: 'ju4', base: 'ju', tone: 4 })
})

console.log('拼读课程矩阵 / Yabla 音频')
const validBlendPairs = BLEND_INITIALS.flatMap(initial =>
  BLEND_FINALS
    .filter(final => isValidBlend(initial.id, final.id))
    .map(final => ({ initial, final, base: blendBaseFor(initial.id, final.id) })),
)
const validBlendBases = new Set(validBlendPairs.map(item => item.base))
const blendAudioKeys = validBlendPairs.flatMap(({ initial, final }) =>
  ([1, 2, 3, 4] as Tone[]).map(itemTone => {
    const syllable = toSyllable(initial.id, final.id, itemTone)
    assert.ok(syllable, `${initial.id} + ${final.displayFinal} + ${itemTone} 应合法`)
    return syllable.audioKey
  }),
)
check('课程包含 288 个唯一声韵组合', () => assert.equal(validBlendPairs.length, 288))
check('288 个组合不会生成重复音节', () => assert.equal(validBlendBases.size, 288))
check('j/q/x 只从 ü、ün 入口拼读', () => {
  for (const initial of ['j', 'q', 'x']) {
    assert.equal(isValidBlend(initial, 'u'), false, `${initial} + u 应禁用`)
    assert.equal(isValidBlend(initial, 'uen'), false, `${initial} + un 应禁用`)
    assert.equal(isValidBlend(initial, 'v'), true, `${initial} + ü 应合法`)
    assert.equal(isValidBlend(initial, 'vn'), true, `${initial} + ün 应合法`)
  }
})
check('拼读所需 1152 个 Yabla 音频均存在且非空', () => {
  assert.equal(new Set(blendAudioKeys).size, 1152)
  const missing = blendAudioKeys.filter(key => {
    const file = path.resolve('public/audio/cmn/yabla', `${key}.mp3`)
    return !existsSync(file) || statSync(file).size === 0
  })
  assert.deepEqual(missing, [])
})

console.log(`\n全部通过：${passed} 项`)

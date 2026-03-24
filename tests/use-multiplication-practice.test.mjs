import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/hooks/useMultiplicationPractice.ts', import.meta.url), 'utf8')

assert.match(source, /const stateRef = useRef\(state\)/)
assert.match(source, /stateRef\.current = state/)
assert.match(source, /const current = stateRef\.current/)
assert.doesNotMatch(source, /\}\s*,\s*\[level,\s*state\]\)/)

assert.match(source, /const levelRef = useRef\(level\)/)
assert.match(source, /levelRef\.current = level/)
assert.match(source, /const pendingNextRef = useRef<number \| null>\(null\)/)
assert.match(source, /window\.clearTimeout\(pendingNextRef\.current\)/)
assert.match(source, /setState\(createPracticeState\(levelRef\.current,\s*nextCount\)\)/)

assert.match(source, /const previousLevelRef = useRef\(level\)/)
assert.match(source, /if \(previousLevelRef\.current === level\) return/)
assert.match(source, /clearPendingNext\(\)/)
assert.match(source, /setState\(createPracticeState\(level,\s*0\)\)/)

console.log('useMultiplicationPractice checks passed')

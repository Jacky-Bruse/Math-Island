import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/pages/MultiplicationTablePage.tsx', import.meta.url), 'utf8')

assert.match(source, /const registerCell = useCallback\(/)
assert.match(source, /const handlePlayGroup = useCallback\(/)
assert.match(source, /const handleOpenUnderstand = useCallback\(/)
assert.match(source, /activeKey=\{activeGroup === group \? activeKey : null\}/)
assert.match(source, /const GroupRow = memo\(function GroupRow\(/)

console.log('multiplication table page performance checks passed')

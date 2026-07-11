import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const home = read('../src/pages/HomePage.tsx')
const arithmetic = read('../src/pages/ArithmeticSelectPage.tsx')
const app = read('../src/App.tsx')

assert.equal(home.includes("key: 'comparison'"), false)
assert.match(arithmetic, /key: 'comparison'[\s\S]*path: '\/arithmetic\/comparison'/)
assert.match(app, /path="\/arithmetic\/comparison" element=\{<ComparisonTrainingPage \/>\}/)
assert.equal(app.includes('path="/comparison"'), false)

console.log('arithmetic comparison navigation checks passed')

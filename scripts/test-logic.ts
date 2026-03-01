import { generateArithmeticProblem } from '../src/lib/arithmetic-generator.ts'
import { generateComparisonProblem } from '../src/lib/comparison-generator.ts'
import { getDifficultyProgress, getDifficultyBucket } from '../src/lib/difficulty.ts'
import * as fs from 'fs'

let errors = 0

// === 加减法验证 ===
console.log('\n=== 加减法验证 ===')

for (const range of [10, 20, 100] as const) {
  let fails = 0
  let carryCount = 0
  const total = 200

  for (let i = 0; i < total; i++) {
    const p = generateArithmeticProblem(range, i)
    const maxOp = range === 100 ? 99 : range

    if (p.a < 0 || p.b < 0) { fails++; console.log(`  FAIL [${range}] 负操作数:`, p) }
    if (p.a > maxOp) { fails++; console.log(`  FAIL [${range}] a超范围:`, p) }
    if (p.answer < 0) { fails++; console.log(`  FAIL [${range}] 负结果:`, p) }
    if (p.answer > range) { fails++; console.log(`  FAIL [${range}] 结果超范围:`, p) }
    if (p.operator === '+' && p.a + p.b !== p.answer) { fails++; console.log(`  FAIL [${range}] 加法答案错:`, p) }
    if (p.operator === '-' && p.a - p.b !== p.answer) { fails++; console.log(`  FAIL [${range}] 减法答案错:`, p) }
    if (p.isCarryOrBorrow) carryCount++
  }

  console.log(`  ${range}以内: ${total}题, 错误${fails}个, 进退位${carryCount}题 (${(carryCount/total*100).toFixed(0)}%)`)
  if (fails > 0) errors++
}

// === 比大小验证 ===
console.log('\n=== 比大小验证 ===')
{
  let fails = 0
  let sameTensCount = 0
  const total = 200

  for (let i = 0; i < total; i++) {
    const p = generateComparisonProblem(i)

    if (p.left === p.right) { fails++; console.log('  FAIL 相等:', p) }
    if (p.left < 10 || p.left > 99) { fails++; console.log('  FAIL left范围:', p) }
    if (p.right < 10 || p.right > 99) { fails++; console.log('  FAIL right范围:', p) }
    if (p.left > p.right && p.correctAnswer !== '>') { fails++; console.log('  FAIL 答案:', p) }
    if (p.left < p.right && p.correctAnswer !== '<') { fails++; console.log('  FAIL 答案:', p) }
    if (p.sameTens) sameTensCount++
  }

  console.log(`  比大小: ${total}题, 错误${fails}个, 十位相同${sameTensCount}题 (${(sameTensCount/total*100).toFixed(0)}%)`)
  if (fails > 0) errors++
}

// === 难度曲线验证 ===
console.log('\n=== 难度曲线验证 ===')
{
  const tests = [
    { k: 0, expected: 'easy' },
    { k: 5, expected: 'easy' },
    { k: 9, expected: 'easy' },
    { k: 15, expected: 'medium' },  // p=0.41, >= 10 so normal bucket
    { k: 20, expected: 'medium' },
    { k: 40, expected: 'medium' },
    { k: 60, expected: 'hard' },
    { k: 90, expected: 'hard' },
  ]
  let fails = 0
  for (const t of tests) {
    const bucket = getDifficultyBucket(t.k)
    const p = getDifficultyProgress(t.k)
    const ok = bucket === t.expected
    if (!ok) { fails++; console.log(`  FAIL k=${t.k}: 期望${t.expected}, 实际${bucket}, p=${p.toFixed(3)}`) }
  }
  console.log(`  难度曲线: ${tests.length}组测试, ${fails}个失败`)
  if (fails > 0) errors++
}

// === 数独题库验证 ===
console.log('\n=== 数独题库验证 ===')
for (const size of [4, 6, 8] as const) {
  const data = JSON.parse(fs.readFileSync(`public/puzzles/sudoku-${size}x${size}.json`, 'utf8'))
  let solvable = 0
  let blanks = 0

  for (const puzzle of data) {
    let hasBlank = false
    let valid = true
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (puzzle.givens[r][c] === 0) {
          hasBlank = true
          blanks++
        }
        // 验证 solution 完整
        if (puzzle.solution[r][c] < 1 || puzzle.solution[r][c] > size) valid = false
        // 验证 givens 是 solution 的子集
        if (puzzle.givens[r][c] !== 0 && puzzle.givens[r][c] !== puzzle.solution[r][c]) valid = false
      }
    }
    if (hasBlank && valid) solvable++
  }

  const avgBlanks = blanks / data.length
  console.log(`  ${size}×${size}: ${data.length}盘, 有效${solvable}盘, 平均挖空${avgBlanks.toFixed(1)}格`)
  if (solvable < data.length) errors++
}

// === 总结 ===
console.log(`\n${'='.repeat(40)}`)
if (errors === 0) {
  console.log('✅ 全部验证通过!')
} else {
  console.log(`❌ 有 ${errors} 项验证失败`)
}

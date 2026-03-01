/**
 * 离线数独题库生成脚本
 * 用法: npx tsx scripts/generate-sudoku.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type Size = 4 | 6 | 8
type Grid = number[][]

const BOX_SIZES: Record<Size, [number, number]> = {
  4: [2, 2],
  6: [2, 3],
  8: [2, 4],
}

function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array(size).fill(0))
}

function isValid(grid: Grid, row: number, col: number, num: number, size: Size): boolean {
  const [boxR, boxC] = BOX_SIZES[size]

  // Check row
  for (let c = 0; c < size; c++) {
    if (grid[row][c] === num) return false
  }

  // Check column
  for (let r = 0; r < size; r++) {
    if (grid[r][col] === num) return false
  }

  // Check box
  const startRow = Math.floor(row / boxR) * boxR
  const startCol = Math.floor(col / boxC) * boxC
  for (let r = startRow; r < startRow + boxR; r++) {
    for (let c = startCol; c < startCol + boxC; c++) {
      if (grid[r][c] === num) return false
    }
  }

  return true
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateFullSolution(size: Size): Grid | null {
  const grid = createEmptyGrid(size)
  const nums = Array.from({ length: size }, (_, i) => i + 1)

  function fill(pos: number): boolean {
    if (pos === size * size) return true
    const row = Math.floor(pos / size)
    const col = pos % size

    for (const num of shuffle(nums)) {
      if (isValid(grid, row, col, num, size)) {
        grid[row][col] = num
        if (fill(pos + 1)) return true
        grid[row][col] = 0
      }
    }
    return false
  }

  return fill(0) ? grid : null
}

function countSolutions(grid: Grid, size: Size, limit: number = 2): number {
  const nums = Array.from({ length: size }, (_, i) => i + 1)
  let count = 0

  function solve(pos: number): boolean {
    if (pos === size * size) {
      count++
      return count >= limit
    }
    const row = Math.floor(pos / size)
    const col = pos % size

    if (grid[row][col] !== 0) return solve(pos + 1)

    for (const num of nums) {
      if (isValid(grid, row, col, num, size)) {
        grid[row][col] = num
        if (solve(pos + 1)) {
          grid[row][col] = 0
          return true
        }
        grid[row][col] = 0
      }
    }
    return false
  }

  solve(0)
  return count
}

function createPuzzle(solution: Grid, size: Size, blanks: number): Grid | null {
  const puzzle = solution.map(row => [...row])
  const positions = shuffle(
    Array.from({ length: size * size }, (_, i) => i)
  )

  let removed = 0
  for (const pos of positions) {
    if (removed >= blanks) break
    const row = Math.floor(pos / size)
    const col = pos % size
    const backup = puzzle[row][col]
    puzzle[row][col] = 0

    const testGrid = puzzle.map(r => [...r])
    if (countSolutions(testGrid, size) === 1) {
      removed++
    } else {
      puzzle[row][col] = backup
    }
  }

  return removed >= blanks * 0.8 ? puzzle : null
}

function generatePuzzles(size: Size, count: number): { givens: number[][]; solution: number[][] }[] {
  const blanksRange: Record<Size, [number, number]> = {
    4: [6, 8],
    6: [14, 18],
    8: [28, 36],
  }
  const [minBlanks, maxBlanks] = blanksRange[size]
  const results: { givens: number[][]; solution: number[][] }[] = []

  let attempts = 0
  while (results.length < count && attempts < count * 20) {
    attempts++
    const solution = generateFullSolution(size)
    if (!solution) continue

    const blanks = minBlanks + Math.floor(Math.random() * (maxBlanks - minBlanks + 1))
    const puzzle = createPuzzle(solution, size, blanks)
    if (!puzzle) continue

    results.push({
      givens: puzzle,
      solution: solution.map(r => [...r]),
    })

    if (results.length % 10 === 0) {
      console.log(`  ${size}×${size}: ${results.length}/${count}`)
    }
  }

  return results
}

// Main
const outDir = path.join(__dirname, '..', 'public', 'puzzles')
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const configs: { size: Size; count: number }[] = [
  { size: 4, count: 100 },
  { size: 6, count: 100 },
  { size: 8, count: 50 },
]

for (const { size, count } of configs) {
  console.log(`生成 ${size}×${size} 题库 (${count} 盘)...`)
  const puzzles = generatePuzzles(size, count)
  const outPath = path.join(outDir, `sudoku-${size}x${size}.json`)
  fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2))
  console.log(`  完成: ${puzzles.length} 盘 → ${outPath}`)
}

console.log('全部生成完毕！')

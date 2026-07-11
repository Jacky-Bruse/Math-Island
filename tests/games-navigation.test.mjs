import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const gamePageUrl = new URL('../src/pages/GameSelectPage.tsx', import.meta.url)
const home = read('../src/pages/HomePage.tsx')
const app = read('../src/App.tsx')
const sudoku = read('../src/pages/SudokuSelectPage.tsx')

assert.equal(existsSync(gamePageUrl), true)
const games = read('../src/pages/GameSelectPage.tsx')

assert.match(home, /key: 'games'[\s\S]*path: '\/games'/)
assert.equal(home.includes("key: 'sudoku'"), false)
assert.match(games, /key: 'sudoku'[\s\S]*path: '\/games\/sudoku'/)
assert.match(games, /key: 'robot-courier'[\s\S]*path: '\/games\/robot-courier'/)
assert.match(app, /path="\/games" element=\{<GameSelectPage \/>\}/)
assert.match(app, /path="\/games\/robot-courier" element=\{<RobotCourierPage \/>\}/)
assert.match(app, /path="\/games\/sudoku" element=\{<SudokuSelectPage \/>\}/)
assert.match(app, /path="\/games\/sudoku\/:size" element=\{<SudokuTrainingPage \/>\}/)
assert.equal(app.includes('path="/sudoku'), false)
assert.match(sudoku, /navigate\(`\/games\/sudoku\/\$\{size\}`\)/)

console.log('games navigation checks passed')

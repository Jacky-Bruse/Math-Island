import { openDB, type IDBPDatabase } from 'idb'
import type { Poem } from '../types/poem'

interface MathIslandDB {
  'sudoku-drafts': {
    key: string
    value: {
      id: string
      size: number
      givens: number[][]
      solution: number[][]
      board: number[][]
      hintsRemaining: number
      timestamp: number
    }
  }
  'sudoku-dedup': {
    key: string
    value: {
      size: number
      recentIds: number[]
    }
  }
  'poems': {
    key: string
    value: Poem
  }
}

let dbPromise: Promise<IDBPDatabase<MathIslandDB>> | null = null

function getDB(): Promise<IDBPDatabase<MathIslandDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MathIslandDB>('math-island', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('sudoku-drafts', { keyPath: 'id' })
          db.createObjectStore('sudoku-dedup', { keyPath: 'size' })
        }
        if (oldVersion < 2) {
          db.createObjectStore('poems', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// Draft operations
export async function saveDraft(size: number, givens: number[][], solution: number[][], board: number[][], hintsRemaining: number): Promise<void> {
  const db = await getDB()
  await db.put('sudoku-drafts', {
    id: `draft-${size}`,
    size,
    givens,
    solution,
    board,
    hintsRemaining,
    timestamp: Date.now(),
  })
}

export async function loadDraft(size: number) {
  const db = await getDB()
  return db.get('sudoku-drafts', `draft-${size}`)
}

export async function deleteDraft(size: number): Promise<void> {
  const db = await getDB()
  await db.delete('sudoku-drafts', `draft-${size}`)
}

export async function hasDraft(size: number): Promise<boolean> {
  const draft = await loadDraft(size)
  return !!draft
}

// Dedup queue operations (N=10)
const DEDUP_SIZE = 10

export async function getRecentPuzzleIds(size: number): Promise<number[]> {
  const db = await getDB()
  const record = await db.get('sudoku-dedup', size)
  return record?.recentIds || []
}

export async function addRecentPuzzleId(size: number, puzzleId: number): Promise<void> {
  const db = await getDB()
  const record = await db.get('sudoku-dedup', size)
  const ids = record?.recentIds || []
  ids.push(puzzleId)
  if (ids.length > DEDUP_SIZE) ids.shift()
  await db.put('sudoku-dedup', { size, recentIds: ids })
}

export async function clearAllDB(): Promise<void> {
  const db = await getDB()
  await db.clear('sudoku-drafts')
  await db.clear('sudoku-dedup')
  await db.clear('poems')
}

// Poem operations
export async function getAllPoems(): Promise<Poem[]> {
  const db = await getDB()
  return db.getAll('poems')
}

export async function getPoem(id: string): Promise<Poem | undefined> {
  const db = await getDB()
  return db.get('poems', id)
}

export async function savePoem(poem: Poem): Promise<void> {
  const db = await getDB()
  await db.put('poems', poem)
}

export async function deletePoem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('poems', id)
}

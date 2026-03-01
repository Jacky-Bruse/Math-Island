import { openDB, type IDBPDatabase } from 'idb'

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
}

let dbPromise: Promise<IDBPDatabase<MathIslandDB>> | null = null

function getDB(): Promise<IDBPDatabase<MathIslandDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MathIslandDB>('math-island', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sudoku-drafts')) {
          db.createObjectStore('sudoku-drafts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('sudoku-dedup')) {
          db.createObjectStore('sudoku-dedup', { keyPath: 'size' })
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
}

import { useState, useEffect, useCallback } from 'react'
import type { Poem } from '../types/poem'
import { getAllPoems, getPoem, savePoem, deletePoem as dbDeletePoem } from '../lib/db'

export function usePoemLibrary() {
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const all = await getAllPoems()
    all.sort((a, b) => b.updatedAt - a.updatedAt)
    setPoems(all)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const addPoem = useCallback(async (data: { title: string; author?: string; dynasty?: string; content: string }) => {
    const now = Date.now()
    const poem: Poem = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      author: data.author?.trim() || undefined,
      dynasty: data.dynasty?.trim() || undefined,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    }
    await savePoem(poem)
    await refresh()
    return poem
  }, [refresh])

  const updatePoem = useCallback(async (id: string, data: { title: string; author?: string; dynasty?: string; content: string }) => {
    const existing = await getPoem(id)
    if (!existing) return
    const updated: Poem = {
      ...existing,
      title: data.title.trim(),
      author: data.author?.trim() || undefined,
      dynasty: data.dynasty?.trim() || undefined,
      content: data.content,
      updatedAt: Date.now(),
    }
    await savePoem(updated)
    await refresh()
  }, [refresh])

  const removePoem = useCallback(async (id: string) => {
    await dbDeletePoem(id)
    await refresh()
  }, [refresh])

  const importPoems = useCallback(async (newPoems: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const existing = await getAllPoems()
    let added = 0
    let skipped = 0

    const normalizeContent = (c: string) =>
      c.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n')

    for (const p of newPoems) {
      const isDup = existing.some(
        e => e.title === p.title && normalizeContent(e.content) === normalizeContent(p.content),
      )
      if (isDup) {
        skipped++
        continue
      }
      const now = Date.now()
      await savePoem({
        id: crypto.randomUUID(),
        title: p.title,
        author: p.author,
        dynasty: p.dynasty,
        content: p.content,
        createdAt: now,
        updatedAt: now,
      })
      added++
    }

    await refresh()
    return { added, skipped }
  }, [refresh])

  return { poems, loading, addPoem, updatePoem, removePoem, importPoems, refresh }
}

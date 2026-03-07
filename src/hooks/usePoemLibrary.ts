import { useState, useEffect, useCallback } from 'react'
import type { Poem } from '../types/poem'
import * as api from '../lib/poems-api'

export function usePoemLibrary() {
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const all = await api.fetchPoems()
      all.sort((a, b) => b.updatedAt - a.updatedAt)
      setPoems(all)
    } catch (err) {
      console.error('Failed to fetch poems:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const addPoem = useCallback(async (data: { title: string; author?: string; dynasty?: string; content: string }) => {
    const poem = await api.createPoem(data)
    await refresh()
    return poem
  }, [refresh])

  const updatePoem = useCallback(async (id: string, data: { title: string; author?: string; dynasty?: string; content: string }) => {
    await api.updatePoem(id, data)
    await refresh()
  }, [refresh])

  const removePoem = useCallback(async (id: string) => {
    await api.deletePoem(id)
    await refresh()
  }, [refresh])

  const importPoems = useCallback(async (newPoems: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const result = await api.importPoems(newPoems)
    await refresh()
    return result
  }, [refresh])

  return { poems, loading, addPoem, updatePoem, removePoem, importPoems, refresh }
}

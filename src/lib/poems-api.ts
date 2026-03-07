import type { Poem } from '../types/poem'

const SESSION_KEY = 'admin-password'

export function getCachedPassword(): string | null {
  return sessionStorage.getItem(SESSION_KEY)
}

export function setCachedPassword(password: string): void {
  sessionStorage.setItem(SESSION_KEY, password)
}

export function clearCachedPassword(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function hasAdminAccess(): boolean {
  return !!getCachedPassword()
}

function adminHeaders(): Record<string, string> {
  const pw = getCachedPassword()
  if (!pw) return {}
  return { 'X-Admin-Password': pw }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearCachedPassword()
    throw new AuthError('密码错误')
  }
  if (res.status === 403) {
    throw new AuthError('服务端未配置管理密码')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `请求失败 (${res.status})`)
  }
  return res.json()
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// ---------- Read APIs (no password) ----------

export async function fetchPoems(): Promise<Poem[]> {
  const res = await fetch('/api/poems')
  return handleResponse<Poem[]>(res)
}

export async function fetchPoem(id: string): Promise<Poem> {
  const res = await fetch(`/api/poems/${id}`)
  return handleResponse<Poem>(res)
}

// ---------- Write APIs (password required) ----------

export async function createPoem(data: {
  title: string
  author?: string
  dynasty?: string
  content: string
}): Promise<Poem> {
  const res = await fetch('/api/poems', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(data),
  })
  return handleResponse<Poem>(res)
}

export async function updatePoem(
  id: string,
  data: { title: string; author?: string; dynasty?: string; content: string },
): Promise<Poem> {
  const res = await fetch(`/api/poems/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(data),
  })
  return handleResponse<Poem>(res)
}

export async function deletePoem(id: string): Promise<void> {
  const res = await fetch(`/api/poems/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })
  await handleResponse(res)
}

export async function importPoems(
  poems: { title: string; author?: string; dynasty?: string; content: string }[],
): Promise<{ added: number; skipped: number }> {
  const res = await fetch('/api/poems/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(poems),
  })
  return handleResponse<{ added: number; skipped: number }>(res)
}

// ---------- Verify password ----------

export async function verifyPassword(password: string): Promise<boolean> {
  const res = await fetch('/api/admin/verify', {
    method: 'POST',
    headers: { 'X-Admin-Password': password },
  })
  if (res.status === 401) return false
  if (res.status === 403) throw new AuthError('服务端未配置管理密码')
  return res.ok
}

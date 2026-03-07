import type { Poem } from '../types/poem'

type PoemData = Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>

/**
 * 将 Markdown 文本解析为古诗数组。
 * 自动识别两种格式：
 * 1. 富文本格式：## 标题 + - 标题/朝代/作者 元数据 + ```text 正文 ```
 * 2. 简单格式：每首诗第 1 行为标题，后续非空行为正文，多首诗之间用 --- 分隔。
 */
export function parsePoemsMarkdown(markdown: string): PoemData[] {
  // 检测是否为富文本格式（包含 ## 标题和 - 标题：元数据）
  if (/^## /m.test(markdown) && /^- 标题：/m.test(markdown)) {
    return parseRichMarkdown(markdown)
  }
  return parseSimpleMarkdown(markdown)
}

/**
 * 解析富文本 Markdown 格式的古诗。
 */
function parseRichMarkdown(markdown: string): PoemData[] {
  const poems: PoemData[] = []
  // 按 ## 标题分割
  const sections = markdown.split(/^(?=## )/m)

  for (const section of sections) {
    const trimmed = section.trim()
    if (!trimmed.startsWith('## ')) continue

    const titleMatch = trimmed.match(/^- 标题：(.+)$/m)
    const title = titleMatch?.[1]?.trim()
    if (!title) continue

    const dynastyMatch = trimmed.match(/^- 朝代：(.+)$/m)
    const dynasty = dynastyMatch?.[1]?.trim()

    const authorMatch = trimmed.match(/^- 作者：(.+)$/m)
    const author = authorMatch?.[1]?.trim()

    // 提取 ```text ... ``` 代码块中的正文
    const contentMatch = trimmed.match(/```text\r?\n([\s\S]*?)```/)
    if (!contentMatch) continue

    const content = contentMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .join('\n')
    if (!content) continue

    poems.push({
      title,
      ...(dynasty ? { dynasty } : {}),
      ...(author ? { author } : {}),
      content,
    })
  }

  return poems
}

/**
 * 解析简单格式的 Markdown 古诗。
 * 格式：每首诗第 1 行为标题，后续非空行为正文，多首诗之间用 --- 分隔。
 */
function parseSimpleMarkdown(markdown: string): PoemData[] {
  const blocks = markdown.split(/^---$/m)
  const poems: PoemData[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length < 2) continue

    const title = lines[0]
    const contentLines = lines.slice(1)

    poems.push({
      title,
      content: contentLines.join('\n'),
    })
  }

  return poems
}

/**
 * 将古诗数组导出为富文本 Markdown 格式。
 * 包含标题、朝代、作者元数据和正文代码块，可直接重新导入。
 */
export function exportPoemsMarkdown(poems: Poem[]): string {
  return poems
    .map((p, i) => {
      const lines = [`## ${i + 1}. ${p.title}`, '']
      lines.push(`- 标题：${p.title}`)
      if (p.dynasty) lines.push(`- 朝代：${p.dynasty}`)
      if (p.author) lines.push(`- 作者：${p.author}`)
      lines.push('- 正文：', '')
      lines.push('```text')
      const contentLines = p.content.split('\n').filter(l => l.trim().length > 0)
      lines.push(...contentLines)
      lines.push('```')
      return lines.join('\n')
    })
    .join('\n\n')
}

/**
 * 检测导入的古诗是否与已有古诗重复（标题相同且正文相同）。
 */
export function isDuplicatePoem(
  imported: { title: string; content: string },
  existingPoems: Poem[],
): boolean {
  const normalizeContent = (c: string) =>
    c.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n')

  return existingPoems.some(
    p => p.title === imported.title && normalizeContent(p.content) === normalizeContent(imported.content),
  )
}

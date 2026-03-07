import type { Poem } from '../types/poem'

/**
 * 将 Markdown 文本解析为古诗数组。
 * 格式：每首诗第 1 行为标题，后续非空行为正文，多首诗之间用 --- 分隔。
 */
export function parsePoemsMarkdown(markdown: string): Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>[] {
  const blocks = markdown.split(/^---$/m)
  const poems: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>[] = []

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
 * 将古诗数组导出为 Markdown 文本。
 * 格式与导入一致：标题 + 正文行，多首之间用 --- 分隔。
 */
export function exportPoemsMarkdown(poems: Poem[]): string {
  return poems
    .map(p => {
      const lines = [p.title]
      const contentLines = p.content.split('\n').filter(l => l.trim().length > 0)
      lines.push(...contentLines)
      return lines.join('\n')
    })
    .join('\n\n---\n\n')
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

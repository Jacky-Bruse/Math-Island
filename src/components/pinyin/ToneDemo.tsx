import type { Tone } from '../../types/pinyin'

interface Props {
  // 同一韵母的无调 base（如 'a'），四声音频为 base+1..4
  base: string
  displays: [string, string, string, string] // ['ā','á','ǎ','à']
  onPlayTone: (audioKey: string) => void
  onPlayAll: (audioKeys: string[]) => void
}

export default function ToneDemo({ base, displays, onPlayTone, onPlayAll }: Props) {
  const keys = [1, 2, 3, 4].map(t => `${base}${t}`)

  return (
    <div className="rounded-2xl bg-pinyin-light border border-pinyin/20 p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-text">四声</span>
        <button
          onClick={() => onPlayAll(keys)}
          className="text-xs px-3 py-1 rounded-full bg-pinyin text-white active:scale-95 transition-transform"
        >
          ▶ 连读
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {displays.map((d, i) => (
          <button
            key={i}
            onClick={() => onPlayTone(keys[i])}
            className="aspect-square rounded-xl bg-surface border border-border flex items-center justify-center text-2xl font-extrabold text-pinyin active:scale-95 transition-transform"
            aria-label={`第${(i + 1) as Tone}声`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

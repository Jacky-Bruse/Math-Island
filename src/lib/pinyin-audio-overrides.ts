// 按音节覆盖音源：少数 hugolpz 录音听感不佳的音节，改用 davinfifield/mp3-chinese-pinyin-sound
// （The Unlicense，公有领域）。这些 audioKey 的音频从 public/audio/dav/syllabs/{key}.mp3 读取。
// 纯数据，无 DOM/Vite 依赖，供 app 与音频脚本共用。

// davinfifield 仓库（音频源）
export const DAV_REPO = 'davinfifield/mp3-chinese-pinyin-sound'
export const DAV_RAW = `https://raw.githubusercontent.com/${DAV_REPO}/master/mp3`

// 需要改用 davinfifield 的音频 stem（如 'chi1' 同时供声母 ch 与整体认读 chi）
export const DAV_OVERRIDE_KEYS: string[] = ['chi1']

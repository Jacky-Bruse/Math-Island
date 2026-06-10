// 按音节覆盖音源：少数 hugolpz 录音听感不佳的音节，改用 davinfifield/mp3-chinese-pinyin-sound
// （The Unlicense，公有领域）。这些 audioKey 的音频从 public/audio/dav/syllabs/{key}.mp3 读取。
// 纯数据，无 DOM/Vite 依赖，供 app 与音频脚本共用。

// davinfifield 仓库（音频源）
export const DAV_REPO = 'davinfifield/mp3-chinese-pinyin-sound'
export const DAV_RAW = `https://raw.githubusercontent.com/${DAV_REPO}/master/mp3`

// 需要改用 davinfifield 的音频 stem：
// - a1~a4：单韵母 a 四声演示。hugolpz syllabs 裸单韵母仅录一声（缺 a2/a3/a4），
//   四声全切 davinfifield 以保证同一人声、四声齐全。
// - chi1~chi4：同时供声母 ch 与整体认读 chi（hugolpz 录音偏 zh）。
//   ch+i 放开拼读后需四声切换，四声全切 davinfifield 以保证同一人声。
export const DAV_OVERRIDE_KEYS: string[] = ['a1', 'a2', 'a3', 'a4', 'chi1', 'chi2', 'chi3', 'chi4']

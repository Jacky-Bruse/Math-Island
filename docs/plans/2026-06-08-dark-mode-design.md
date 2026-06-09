# 暗黑模式（深色主题）设计方案

日期：2026-06-08
状态：待评审 / 待实施

## 1. 背景与目标

为「数力岛」（React 19 + Tailwind CSS v4 + Vite + PWA）增加暗黑模式，提供 **浅色 / 深色 / 跟随系统** 三档，默认跟随系统。要求：

- 切换全局即时生效，首屏无白屏闪烁（FOUC）。
- 长期可维护：颜色统一走语义令牌，避免硬编码散落。

## 2. 现状关键事实（决定实现方式）

1. **颜色令牌已部分语义化**：`@theme` 已定义 `--color-bg`/`--color-card`/`--color-text` 等，组件中语义令牌（`bg-bg`/`bg-card`/`text-text`）约 114 处。
2. **硬编码颜色约 109 处（24 文件）**：`bg-white`/`bg-gray-100|300`/`border-gray-*` 等灰阶，以及乘法模块约 45 处裸十六进制（含 `bg-[radial-gradient(...)]`、`shadow-[...rgba(...)]`）。这些**不会**随 CSS 变量切换。
3. **无全局设置 Context**：`useSettings()` 是各页面独立 `useState(loadSettings)`，4 个消费者互不同步。→ 主题不能依赖 React 状态传播，必须走 **DOM 类 + CSS 变量**，在 CSS 层全局生效。
4. **`SettingsPanel` 仅在 `HomePage` 渲染**，主题开关 UI 放此处。
5. **构建产物实测**：`.bg-bg{background-color:var(--color-bg)}`——Tailwind v4 确实输出 `var()` 引用，变量定义在 `@layer theme { :root,:host { ... } }`。→ `.dark` 覆盖变量可级联（前提见 §3 的层级注意）。

## 3. 令牌架构（src/index.css）

保持普通 `@theme`（**不要改 `@theme inline`**，否则值被内联、覆盖失效）。新增令牌写入 `@theme` 以生成工具类；深色值在 `.dark` 覆盖。

### 3.1 新增灰阶语义令牌（替换硬编码）

| 用途 | 令牌 | 替换 |
|---|---|---|
| 表层/卡片 | `--color-surface` | `bg-white`（卡片底）、`bg-gray-50` |
| 次级表层 | `--color-surface-muted` | `bg-gray-100` |
| 边框 | `--color-border` | `border-gray-100/200` |
| 强边框/控件底 | `--color-border-strong` | `bg-gray-300` |

`bg-black/30` 遮罩保持不变（半透明，两模式通用）。彩底上的 `text-white` 保持不变。

### 3.2 乘法模块专用令牌（替换 ~45 处裸 hex）

`--color-mult-ink`(#9a3412)、`--color-mult-ink-soft`(#c2410c)、`--color-mult-surface`(#fffdfb)、`--color-mult-surface-2`(#fff7ed)、`--color-mult-border`、`--color-mult-accent`(#ea580c)、`--color-mult-accent-soft`(#fb923c)。
组件 `bg-[#ea580c]` → `bg-mult-accent`，`text-[#9a3412]` → `text-mult-ink`。

### 3.3 深色取值方向（基调：暖棕灰）

已定基调为**暖棕灰**（柔和护眼，与乘法橙系最协调）。核心取值：

| 令牌 | 浅色 | 深色（暖棕灰） |
|---|---|---|
| `--color-bg` | #f0f4ff | ~#1c1917 |
| `--color-card` / `--color-surface` | #ffffff | ~#292524 |
| `--color-surface-muted` | (gray-50/100) | ~#322c28 |
| `--color-border` | (gray-100/200) | ~#3f3833 |
| `--color-text` | #1e293b | ~#ede9e4 |
| `--color-text-secondary` | #64748b | ~#a8a29e |

其余：各模块 `*-light` 背景由浅彩转低饱和深彩（在暖底上压暗、降饱和）；乘法 surface 转深棕（`--color-mult-surface` ~#26201c、`-2` ~#2e2722）、ink 转暖浅色（`--color-mult-ink` ~#fdba74、`-soft` ~#fb923c）；彩底按钮 accent 大体保留。具体数值实施时按对比度（正文文字 ≥ 4.5:1）微调。

### 3.4 【修正①·关键】.dark 覆盖的层级问题

实测变量定义在 `@layer theme { :root,:host {...} }`，而 `:root` 与 `.dark` **特异性相同 (0,1,0)**。CSS 中**层级（@layer）优先级高于特异性**：unlayered 规则胜过所有 `@layer`，而层内规则按层序比较，特异性只在同层内才起作用。

**规则（统一采用）**：`.dark { --color-*: ... }` 覆盖块写成 **unlayered（非 @layer 的裸规则）**，置于 `@import "tailwindcss"` 之后——它胜过 `@layer theme` 里的 `:root`，无需纠结特异性。

**注意**：不要简单依赖 `:root.dark` / `html.dark` 的「特异性更高」来兜底——若它落在比 `@layer theme` 更低序的层里，仍会输给层级规则。若确要用 `:root.dark`，必须把它放进 `@layer theme` 内、`@theme` 块之后（同层、靠后、特异性更高三者同时满足）。最简单可靠的做法就是 unlayered `.dark {}`。

### 3.5 渐变 / 阴影（P3 重点）

乘法页 `bg-[radial-gradient(...#fff8ef...)]`、`shadow-[0_14px_28px_rgba(234,88,12,.26)]` **不被颜色令牌覆盖**，必须改成令牌化任意值（如 `bg-[radial-gradient(...var(--color-mult-surface)...)]`）或专用工具类，并在深色下调低阴影透明度避免过重。
`src/index.css` 的 `.apple-token` 亮红渐变拟物元素，深色下**保持原样**（亮红与深底反而协调）。

### 3.6 【修正⑤·实测】令牌按需输出（tree-shaking）陷阱

实测：Tailwind v4 仅把**被某个生成工具类引用过**的 `@theme` 变量输出到 `:root`。当前 `@theme` 定义 22 个令牌，但 dist 实际只输出其中被用到的；`--color-card`、`--color-multiplication(-light)`、`--color-primary-dark/light` 因无工具类引用，**未出现在构建产物里**。

**后果**：若某令牌**仅**出现在裸 `var()`（如 `bg-[radial-gradient(...var(--color-mult-surface)...)]`）而无对应工具类（`bg-mult-surface`），Tailwind 不会输出该变量定义 → `var()` 解析为空 → 渐变/阴影坏掉，深色覆盖也无从谈起。

**规则**：
- 既作工具类又进渐变的令牌（如 `--color-mult-accent` 同时有 `bg-mult-accent`）——正常，会被输出。
- **仅在任意值/裸 `var()` 中出现**的令牌——必须保证输出。两种做法择一：
  1. 用 `@theme static { ... }` 块声明（强制输出全部变量，不做 tree-shaking）；
  2. 或把这类令牌写成普通 `:root { --color-...: ... }`（在 `@theme` 之外），`.dark` 同样可覆盖。
- 实施时对每个新令牌确认：要么有真实工具类引用，要么落在 `@theme static` / 普通 `:root` 中。

## 4. 主题状态与应用机制

### 4.1 Settings 扩展（src/types/settings.ts）

新增 `theme: 'light' | 'dark' | 'system'`，`DEFAULT_SETTINGS.theme = 'system'`。`loadSettings` 已 `{...DEFAULT, ...parsed}` 合并，旧数据自动兼容。**必须先改类型**，否则 `onUpdate({ theme })` 过不了 TS。

### 4.2 新建 src/lib/theme.ts

- `applyTheme(theme)`：根据传入值在 `documentElement` 上挂/摘 `.dark`；`system` 时读 `matchMedia('(prefers-color-scheme: dark)').matches`。
- `initTheme()`：**【修正②】挂一个常驻单一监听器**到 `matchMedia(...)`，回调中**重新读取当前存储的 theme**，仅当 `theme === 'system'` 时才应用系统值。避免「仅初始为 system 时挂监听」导致 light→system 切换后不重载就不跟随系统。

### 4.3 首屏防闪（index.html）

`<head>` 内联 `<script>`：渲染前读 `localStorage.getItem('math-island:settings')`，`JSON.parse` 取 `.theme`（缺省按 `system`），按 system/explicit 分支决定是否给 `<html>` 加 `.dark`。分支逻辑必须与 `applyTheme`/`initTheme` **完全一致**（explicit `light`/`dark` 直接定；`system` 读 `matchMedia`），避免首屏与水合后不一致。
**注意**：
- 键名必须是 `math-island:settings`（见 `src/lib/storage.ts` 前缀），不是单独 key。
- 脚本需容错（try/catch，解析失败回退 system）。
- **位置**：放在 `<head>` 最靠前、**任何样式表 `<link>`/内联样式之前**，确保样式表评估前 `.dark` 已就位，杜绝首帧样式闪烁。

### 4.4 切换契约（src/pages/SettingsPanel.tsx）

主题三选一分段控件 → `onUpdate({ theme })`；**【修正③】紧接着 `applyTheme(theme)` 传显式值**，不读 storage（`useSettings` 在 setState 更新器内才 `saveSettings`，紧随其后读 localStorage 会读到旧值）。
`main.tsx` 启动时调 `initTheme()`。

### 4.5 【修正④】PWA 一致性

- `vite.config.ts` 为 `registerType:'prompt'` 且 `globPatterns` 含 `html` → index.html 被预缓存。**已安装的 PWA 客户端要等一轮 SW 更新被接受后**才拿到带 FOUC 脚本的新 html（一次性、自愈）。文档须说明该过渡期。
- manifest `theme_color:#6366f1`/`background_color:#f0f4ff` 与 [index.html] 的 `meta theme-color` 均为浅色写死。
- **`meta theme-color` 动态同步属可选 polish（非地基、非阻塞）**：仅影响 PWA standalone 状态栏配色。若纳入，则在 `applyTheme` 中同步改 `meta[name=theme-color]`（深色取 `--color-bg` 值）。本方案默认**不**放进 P1，待状态栏打磨需求明确再做。manifest 静态值保持浅色。

## 5. 设置面板 UI

在 `SettingsPanel` 现有「声音」开关上方加一组三选一分段按钮：浅色 ☀️ / 深色 🌙 / 跟随系统 🖥️，复用现有分段按钮样式（`bg-primary text-white` 选中态）。

## 6. 改动文件清单（约 27 个）

- **核心**：`src/index.css`、`index.html`、`src/types/settings.ts`、新建 `src/lib/theme.ts`、`src/main.tsx`、`src/pages/SettingsPanel.tsx`、`vite.config.ts`（manifest，可选）
- **灰阶迁移**：其余约 20 个含 `bg-white`/`bg-gray-*`/`border-gray-*` 的组件，机械替换为新令牌（需逐处区分「卡片底→surface」与「彩底真白→保留」）
- **乘法模块**：4 个乘法页 hex/渐变/阴影 → 令牌（最费时）

## 7. 风险点

1. `bg-white` 不能无脑替换：区分卡片底（→`surface`）与彩底纯白文字/控件（保留）。
2. 乘法渐变/阴影深色下偏重，需调透明度。
3. `.apple-token` 亮红拟物，深色保持原样。
4. `.dark` 覆盖必须 unlayered/`:root.dark`，否则被 `@layer theme` 压住失效（§3.4）。
5. PWA 老客户端一轮更新延迟（§4.5）。

## 8. 分阶段实施

> 【修正⑥】原「P1 完成后即整体可用」过于乐观：P1 只切语义令牌时，仍用 `bg-white` 的卡片（如 `SettingsPanel` 自身）会变成**白底 + 浅字（`text-text` 已转浅）→ 不可读**。开关 UI 自己就在 `SettingsPanel` 里，必须保证它在深色下可读。故 P1 范围上移「开关链路所涉表层」。

1. **P1 地基 + 开关链路可读**：
   - 令牌体系（含 §3.4 层级规则、§3.6 输出规则）+ `theme.ts`（含 §4.2 常驻监听）+ FOUC 脚本（§4.3 位置约束）+ 设置三选一开关。
   - **同时迁移开关链路所涉表层**，确保深色下可读：`SettingsPanel`、`ConfirmDialog`、`PasswordDialog`、`NumberKeyboard`、`BackButton`、`MascotBubble` 等共享弹窗/按钮的 `bg-white`/`bg-gray-*`/`border-gray-*` → 新令牌。
   - 验收标准：切深色后，**首页 + 设置面板 + 共享弹窗**完整可读、无白底浅字；其余业务页允许暂时混色（留待 P2）。
   - PWA `meta theme-color` 动态同步**不**在 P1（§4.5，可选 polish）。
2. **P2 灰阶迁移**：其余非乘法业务页 `bg-white`/`bg-gray-*`/`border-gray-*` → 新令牌。
3. **P3 乘法模块**：hex + 渐变 + 阴影令牌化（注意 §3.6 输出）+ 深色视觉微调。

每阶段独立可验证、可回滚，分别提交。

## 9. 评审记录

- 2026-06-08 Codex 首轮评审：确认核心 `var()` 机制成立；提出 matchMedia 监听、applyTheme 时序、PWA 缓存三项，已并入 §4.2/§4.4/§4.5。
- 本方对照构建产物实测补充 §3.4 层级特异性规则（Codex 未指出）。
- 2026-06-08 Codex 二轮评审（针对本文档）：
  - 收紧 §3.4 措辞（层级优先于特异性，统一 unlayered `.dark`）。
  - 实测确认并新增 §3.6（`@theme` 变量按需输出，渐变-only 令牌需 `@theme static`/普通 `:root`）。
  - 修正 §8 phasing：P1 纳入开关链路表层，避免 SettingsPanel 白底浅字不可读。
  - §4.3 补 FOUC 脚本位置约束；§4.5 meta sync 明确降为可选、移出 P1。
- 待 Codex 三轮确认。

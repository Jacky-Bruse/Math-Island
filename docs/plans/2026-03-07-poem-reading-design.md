# 古诗阅读功能设计

## 1. 目标

- 为项目新增独立的"古诗阅读"模块。
- 支持家长或老师自行添加、编辑、删除古诗内容。
- 支持按"标题 -> 作者/朝代（如有） -> 正文逐句"的顺序进行语音朗读。
- 朗读过程中同步高亮当前内容，帮助孩子明确读到的位置。
- 采用 Docker 部署的 TTS 服务（基于 node-edge-tts），提供微软神经网络语音的高质量朗读体验。

## 2. 设计原则

- 本地优先：古诗内容和朗读设置优先保存在本地；朗读能力由仓库内置的 TTS 服务提供，不依赖额外业务后端。
- 轻量集成：尽量复用现有 `React + TypeScript + localStorage/IndexedDB` 架构。
- 渐进增强：先实现逐句朗读和逐句高亮，再视需求升级到逐字高亮。
- 儿童友好：界面反馈明确、按钮大、当前朗读位置醒目、操作路径简单。
- 优雅降级：TTS 服务不可用时，阅读页仍可正常展示，仅禁用播放功能。

## 3. 适配当前项目的总体方案

采用"独立古诗模块 + 本地古诗库 + 同仓库双服务部署（前端 + node-edge-tts API） + 分段同步高亮"的方案。

原因：

- 当前项目是本地型轻量 PWA，已有设置体系和首页模块入口，适合新增一个独立模块页。
- node-edge-tts 提供微软神经网络语音（如 Xiaoxiao、Yunxi），音质自然，免费可用。
- 同仓库维护前端和 TTS API，统一部署即可启动，无需用户额外手工搭建第二套项目。
- 逐句拆分并配合预加载下一句音频，可以稳定实现"读到哪句，高亮哪句"。

## 4. 功能范围

### 4.1 第一版范围

- 首页新增"古诗阅读"入口。
- 古诗列表页：
  - 查看已添加的古诗。
  - 进入阅读页。
  - 进入新增/编辑页。
  - 列表为空时展示空状态引导用户新增。
  - 提供管理区：导入 Markdown 古诗文件、导出全部本地古诗。
- 古诗编辑页：
  - 新增古诗。
  - 编辑古诗。
  - 删除古诗。
  - 字段校验（见第 8.1 节）。
- 古诗阅读页：
  - 展示标题、作者/朝代（如有）、正文。
  - 播放、暂停、继续、停止。
  - 上一句、下一句、重读当前句。
  - 点击任意句跳转朗读。
  - 当前句高亮，自动滚动跟随。
- TTS 服务：
  - 同仓库内置的 node-edge-tts API 服务。
  - 提供语音合成 API 和可用语音列表 API。
- 设置扩展：
  - 朗读开关。
  - 语音角色选择（从服务端获取可用列表）。
  - 语速、音调。
  - 是否朗读标题/作者信息（如有）。
  - 高级服务设置：使用默认内置接口、使用自定义接口、恢复默认接口。

### 4.2 暂不进入第一版

- 精确字级卡拉 OK 效果。
- 内置古诗库。
- 账号同步。
- 分享链接。
- 复杂的内容分类、标签、收藏体系。

## 5. 页面与路由建议

建议新增独立路由，而不是复用训练页壳子。当前项目使用 HashRouter。

- `/poems`
  - 古诗列表页。
- `/poems/:id`
  - 古诗阅读页。
- `/poems/edit`
  - 新增古诗页（无 id 参数）。
- `/poems/edit/:id`
  - 编辑古诗页（有 id 参数）。

新增和编辑共用同一个页面组件，根据是否有 `id` 参数区分模式。

首页新增一个模块卡片，风格与现有数学训练模块一致，但颜色单独定义：

- `poem`
- `poem-light`

阅读页不使用当前训练模块的 `TrainingShell`，原因是：

- 训练页自带计时、休息、总结等状态，与阅读业务无关。
- 古诗阅读更适合"内容 + 播放控制 + 高亮同步"的轻量交互模型。

## 6. 数据结构建议

### 6.1 古诗实体

```ts
export interface Poem {
  id: string
  title: string
  author?: string
  dynasty?: string
  content: string
  createdAt: number
  updatedAt: number
}
```

说明：第一版所有古诗均为用户自行添加，不区分内置/自定义。

### 6.2 朗读分段

阅读时不要直接整篇一次性朗读，先转换成可控的段落队列：

```ts
export interface PoemSegment {
  type: 'title' | 'meta' | 'line'
  text: string
}
```

使用 `PoemSegment[]` 数组，数组索引即为播放顺序。

说明：

- `title` 对应诗名。
- `meta` 对应作者或"朝代 · 作者"组合文本。
- `line` 对应正文逐句。

### 6.3 设置扩展

在现有 `Settings` 接口上新增字段，保持 `sound` 不变：

```ts
export interface Settings {
  sound: boolean                // 保持不变
  trainingDuration: 15 | 20 | 30
  defaultSudokuSize: 4 | 6 | 8
  poemTtsEnabled: boolean       // 朗读开关
  poemTtsUseCustomService: boolean
  poemTtsServiceUrl: string     // 自定义 TTS 服务地址，默认留空
  poemTtsVoice: string          // 语音角色名称
  poemTtsRate: number           // 语速
  poemTtsPitch: number          // 音调
  poemReadTitle: boolean        // 是否朗读标题
  poemReadMeta: boolean         // 是否朗读作者信息
}
```

兼容策略：

- 现有 `loadSettings()` 已有 `{ ...DEFAULT_SETTINGS, ...saved }` 的合并逻辑。
- 新增字段在 `DEFAULT_SETTINGS` 中提供默认值即可自动兼容，无需数据迁移。

默认值建议：

```ts
poemTtsEnabled: true
poemTtsUseCustomService: false
poemTtsServiceUrl: ''
poemTtsVoice: 'zh-CN-XiaoxiaoNeural'
poemTtsRate: 1.0
poemTtsPitch: 1.0
poemReadTitle: true
poemReadMeta: true
```

说明：

- 当 `poemTtsUseCustomService = false` 时，前端默认请求当前站点的内置接口：`/api/tts`、`/api/voices`、`/api/health`。
- 当 `poemTtsUseCustomService = true` 且 `poemTtsServiceUrl` 有值时，前端改为请求自定义接口地址。
- 当用户开启自定义接口但地址为空、格式非法或健康检查失败时，禁止保存该模式，并继续使用默认内置接口。
- 设置页高级服务设置中提供"恢复默认接口"按钮，将 `poemTtsUseCustomService` 重置为 `false`，并清空 `poemTtsServiceUrl`。

## 7. 本地存储方案

### 7.1 存储选型

- `localStorage` 继续存设置。
- `IndexedDB` 新增古诗数据存储。

原因：

- 古诗内容比设置更适合结构化存储。
- 后续如果支持导入导出、分类、朗读历史，IndexedDB 更容易扩展。

### 7.2 IndexedDB 版本升级策略

当前数据库 `math-island` 为 v1，包含 `sudoku-drafts` 和 `sudoku-dedup` 两个 store。新增 `poems` store 需要将版本升级到 v2。

```ts
const db = await openDB('math-island', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('sudoku-drafts', { keyPath: 'id' })
      db.createObjectStore('sudoku-dedup', { keyPath: 'size' })
    }
    if (oldVersion < 2) {
      db.createObjectStore('poems', { keyPath: 'id' })
    }
  }
})
```

说明：

- 按 `oldVersion` 增量创建，保证老用户已有数据不受影响。
- `clearAllDB()` 方法需同步更新，新增对 `poems` store 的清理。
- 当前第一版不做阅读进度持久化，后续如需保存阅读进度再扩展。

### 7.3 Markdown 导入导出

第一版支持在古诗列表页管理区导入/导出 `Markdown (.md)` 文件。

规则：

- 一个 `.md` 文件可包含多首古诗。
- 不包含朗读设置，导入后统一使用当前本地朗读设置。
- 导入成功后立即持久化保存到 IndexedDB。
- 导出范围为全部本地古诗，格式与导入格式一致（标题 + 正文行，不包含作者和朝代）。
- 每首古诗之间使用 `---` 分隔。
- 每首古诗的第 1 行固定为标题，后续各行全部视为正文原文。
- 导入阶段不解析作者、朝代；如需补充，可在编辑页手动填写。
- 如果导入内容与本地已有古诗满足"标题相同且正文相同"，视为重复，直接跳过。
- 导入完成后给出结果摘要：新增几首、跳过几首、失败几首。

## 8. 古诗内容解析方案

### 8.1 输入规则与校验

编辑页字段拆开，不要求用户把标题和作者写进正文：

- 诗名（标题）
- 朝代
- 作者
- 正文文本

字段校验规则：

| 字段 | 是否必填 | 校验规则 |
|------|---------|---------|
| 标题 | 必填 | 去除首尾空格后不能为空 |
| 朝代 | 选填 | 无特殊校验 |
| 作者 | 选填 | 无特殊校验 |
| 正文 | 必填 | 去除空白后至少能切出一句 |

不做同名标题重复校验——用户可能录入同名但不同版本的内容。

### 8.2 正文切句规则

第一版优先按原始断行处理正文，不再进行基于标点的二次切句。

规则：

1. 按换行切分正文。
2. 去掉空白行。
3. 保留原文字顺序。
4. 每一行作为一个朗读单元和展示单元。

示例：

```text
春眠不觉晓
处处闻啼鸟
夜来风雨声
花落知多少
```

切分结果：

- 春眠不觉晓
- 处处闻啼鸟
- 夜来风雨声
- 花落知多少

### 8.3 朗读文本组装

朗读顺序：

1. 标题（受 `poemReadTitle` 控制）
2. 朝代 + 作者（如有，受 `poemReadMeta` 控制）
3. 正文按原始断行逐行朗读

### 8.4 Markdown 导入格式

第一版采用极简的 Markdown 结构：

```md
静夜思
床前明月光
疑是地上霜
举头望明月
低头思故乡

---

春晓
春眠不觉晓
处处闻啼鸟
夜来风雨声
花落知多少
```

解析规则：

- 使用 `---` 分隔多首古诗。
- 每首古诗的第 1 行为标题。
- 从第 2 行开始到下一个 `---` 之前的所有非空行均视为正文。
- 正文保持原始断行顺序，用于列表展示、阅读展示和逐行朗读。
- 作者和朝代不在导入文件中解析；如有需要，导入后可在编辑页补充。

## 9. TTS 技术方案

### 9.1 方案概述

采用同仓库内置的 node-edge-tts API 服务，通过 HTTP API 提供微软神经网络语音合成能力。

优点：

- 微软神经网络语音音质自然，带情感表达。
- 免费，无需 API Key 或付费订阅。
- 与前端一起部署，默认即可被前端直接使用。
- 不依赖特定浏览器，Chrome、Edge 等均可使用。

风险：

- 依赖微软非官方 Edge TTS 端点，微软可能变更接口。
- 需要网络连接（连接到微软 TTS 服务）。
- 需要 Docker 环境运行 TTS 服务。

### 9.2 TTS 服务设计

#### 目录结构

```
/docker-compose.yml
/tts-service
├── src/
│   └── index.ts          # Express 服务
├── package.json
├── tsconfig.json
└── Dockerfile
```

#### API 设计

**语音合成接口**

```
POST /api/tts
Content-Type: application/json

Request Body:
{
  "text": "春眠不觉晓",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": 1.0,
  "pitch": 1.0
}

Response: audio/mp3 音频流
```

**可用语音列表接口**

```
GET /api/voices

Response:
{
  "voices": [
    { "name": "zh-CN-XiaoxiaoNeural", "displayName": "晓晓（女声）" },
    { "name": "zh-CN-YunxiNeural", "displayName": "云希（男声）" },
    ...
  ]
}
```

**健康检查接口**

```
GET /api/health

Response: { "status": "ok" }
```

#### 服务拓扑

```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports:
      - "80:80"
    depends_on:
      - tts-api
    restart: unless-stopped

  tts-api:
    build: ./tts-service
    restart: unless-stopped
```

说明：

- `web` 继续负责静态页面和 nginx。
- `tts-api` 在容器内部运行 Node 服务，并调用 `node-edge-tts`。
- nginx 通过反向代理将 `/api/*` 转发到 `tts-api`，因此前端默认可直接请求同源 `/api`。
- 启动命令仍为 `docker compose up -d`。

#### 本地开发跨域处理

本地开发时前端 Vite 跑在 `localhost:5173`，TTS 服务跑在 `localhost:3001`，需要在 `vite.config.ts` 中配置代理：

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

这样前端请求 `/api/*` 会自动转发到 TTS 服务，无需 TTS 服务添加 CORS 头。

### 9.3 推荐语音

默认使用 `zh-CN-XiaoxiaoNeural`（晓晓），音色自然、适合朗读。

可选语音包括：

- `zh-CN-XiaoxiaoNeural` — 晓晓（女声，自然亲切）
- `zh-CN-YunxiNeural` — 云希（男声，沉稳）
- `zh-CN-XiaoyiNeural` — 晓伊（女声，温柔）

具体可用列表通过 `/api/voices` 动态获取。

### 9.4 接口切换策略

- 默认模式：使用同源内置接口 `/api/tts`、`/api/voices`、`/api/health`。
- 高级模式：允许用户手填自定义 TTS 服务地址，对接其他方案。
- 自定义接口需兼容同一组相对路径约定：`${baseUrl}/tts`、`${baseUrl}/voices`、`${baseUrl}/health`。
- 当自定义接口地址为空、格式非法或健康检查失败时，禁止保存该模式，并继续使用默认内置接口。
- 恢复默认：一键切回内置接口并清空自定义地址。

### 9.5 中长期升级路线

- 评估是否增加持久化音频缓存，减少重复请求。
- 评估是否增加更多兼容的第三方 TTS Provider。

## 10. 播放与同步高亮方案

### 10.1 核心机制

每个分段通过 TTS 服务生成音频，使用 `Audio` 对象播放。

播放流程：

1. 构建 `segments[]`。
2. 根据设置解析当前 API 基地址（默认内置 `/api`，或用户填写的自定义地址）。
3. 记录 `currentSegmentIndex`。
4. 先查会话内缓存；若无缓存，则向 TTS 服务请求当前 segment 的音频。
5. 使用 `Audio` 对象播放音频，并在当前句播放时并行预加载下一句音频。
6. 在 `onplay` 时设置当前高亮。
7. 在 `onended` 时优先使用已预加载/已缓存的下一句音频继续播放。
8. 播放完全部 segment 后进入 `finished` 状态。

### 10.2 预加载与会话内缓存

第一版引入两级优化：

- 预加载下一句：当前句开始播放后，后台立即请求下一句音频，减少句间停顿。
- 会话内内存缓存：缓存键使用 `text + voice + rate + pitch`，用于重读当前句、上一句/下一句回退、点击已读句重播。

约束：

- 仅做当前页面会话内缓存，不写入 IndexedDB。
- 离开阅读页后缓存清空。
- 点击跳转、上一句、下一句时，丢弃旧的预加载结果，并以新位置重新预加载。

### 10.3 为什么推荐分段朗读

原因：

- 分段后更容易实现暂停、跳句、重播当前句。
- 分段后高亮同步逻辑更稳定，每段音频对应一个高亮区域。
- 每段音频体积小，更适合配合预加载与缓存。

### 10.4 高亮策略

第一版默认实现"整句高亮"。

展示建议：

- 当前句：高饱和强调色、字号略大、可带轻微发光/底色。
- 已读句：降低透明度但仍可辨认。
- 未读句：默认正文色。

### 10.5 自动滚动

朗读推进到新句子时，自动将当前句滚动到可视区域中央：

```ts
element.scrollIntoView({ behavior: 'smooth', block: 'center' })
```

确保长诗朗读时孩子始终能看到当前高亮句。

### 10.6 逐字高亮的增强方案

逐字高亮不属于第一版范围，仅作为后续增强方向保留。

## 11. 阅读页交互建议

### 11.1 播放控件

- 播放
- 暂停
- 继续
- 停止
- 上一句
- 下一句
- 重读当前句

### 11.2 状态机

```text
idle -> playing -> paused -> playing  (继续)
playing -> idle                       (停止)
paused  -> idle                       (停止)
playing -> finished -> idle           (自然播完)
```

四个状态：`idle`、`playing`、`paused`、`finished`。

说明：

- `stop` 操作从 `playing` 或 `paused` 都可直接回到 `idle`，重置到首句。
- `next` / `prev` 触发时先暂停当前音频，再播放目标句。
- `finished` 表示自然播完全部句子，等待用户操作（点击播放重新开始、点击某句跳转等）时回到对应状态，不使用定时器自动重置。

### 11.3 点击句子跳转

点击阅读页中的任意句子：

1. 暂停当前正在播放的音频。
2. 将 `currentSegmentIndex` 设为点击句子的索引。
3. 从该句开始自动播放到末尾。

交互体验与音乐播放器点击歌词跳转一致。

## 12. UI 设计建议

### 12.1 阅读页布局

- 顶部：返回、诗名。
- 中部：正文大字展示，可滚动。
- 底部：播放控制条。

### 12.2 儿童阅读体验

- 每句单独成块，不建议密集排成长段。
- 当前句颜色变化明显，建议同时加轻微背景强调。
- 字号偏大，行距明显。
- 点击某一句可直接从该句开始朗读（见 11.3 节）。

### 12.3 视觉状态建议

- 当前句：`poem` 主色。
- 已读句：降低透明度但仍可辨认。
- 未读句：常规文本色。

如果后续支持逐字高亮：

- 当前字可叠加更亮颜色。
- 当前句继续保持底色，避免孩子丢失整句位置。

## 13. 异常与降级处理

### 13.1 TTS 服务不可用

- 进入阅读页时，通过当前启用的接口地址检测健康状态：默认 `/api/health`，自定义模式下为 `${baseUrl}/health`。
- 服务不可用时，禁用播放按钮并提示"TTS 服务未连接，请检查服务是否已启动"。
- 阅读页仍可正常展示古诗内容，支持手动阅读。
- 在高级服务设置中，如果自定义接口健康检查失败，则禁止保存切换，继续使用默认内置接口。

### 13.2 音频请求失败

- 单句请求超时或失败时，自动重试 1 次。
- 若重试后仍失败，则停止本次播放并提示错误。
- 保留失败时的当前高亮位置，不自动跳到下一句，避免孩子跟读位置错乱。

### 13.3 页面切换与清理

- 组件卸载时调用 `audio.pause()` 并释放资源。
- 切换古诗或离开页面时重置高亮和播放状态。

## 14. 推荐实现拆分

### 14.1 TTS 服务（同仓库独立服务）

- `docker-compose.yml`
- `tts-service/src/index.ts`
- `tts-service/Dockerfile`
- `tts-service/package.json`
- `nginx.conf`

### 14.2 类型与存储

- `src/types/poem.ts`
- 扩展 `src/lib/db.ts`（版本升级到 v2）
- 扩展 `src/lib/storage.ts`
- 扩展 `src/types/settings.ts`

### 14.3 页面

- `src/pages/PoemListPage.tsx`
- `src/pages/PoemEditorPage.tsx`
- `src/pages/PoemReadPage.tsx`

### 14.4 Hook 与工具函数

- `src/hooks/usePoemLibrary.ts` — 古诗 CRUD 操作
- `src/hooks/usePoemTts.ts` — 播放状态管理、预加载、重试、音频播放控制
- `src/lib/tts.ts` — TTS 服务通信、切句逻辑
- `src/lib/poem-markdown.ts` — Markdown 导入导出与解析

### 14.5 组件

- `src/components/poem/PoemCard.tsx`
- `src/components/poem/PoemReader.tsx`
- `src/components/poem/PoemPlaybackBar.tsx`
- `src/components/poem/PoemLine.tsx`

## 15. 分阶段实施建议

### Phase 1

- 搭建同仓库双服务部署：前端 `web` + `tts-api`。
- 新增古诗模块入口。
- 完成古诗数据模型与本地存储（含 IndexedDB v2 升级）。
- 完成古诗列表页和编辑页。
- 完成列表页管理区：Markdown 导入、导出全部本地古诗。

### Phase 2

- 完成阅读页。
- 完成 TTS 服务对接与逐段朗读。
- 完成整句高亮同步、自动滚动、下一句预加载。
- 完成播放控制：上一句、下一句、重读当前句、点击跳转。
- 完成阅读设置接入：朗读开关、语音角色、语速、音调、是否朗读标题/作者。
- 完成高级服务设置：默认内置接口、自定义接口、恢复默认接口。

### Phase 3

- 完善异常处理、单句失败重试、会话内缓存和降级逻辑。

### Phase 4

- 评估逐字高亮可行性。
- 评估持久化音频缓存方案。
- 评估更多可兼容的第三方 TTS Provider。

## 16. 验收标准

- 可新增、编辑、删除自定义古诗。
- 可导入 Markdown 古诗文件，并在导入后立即持久化保存。
- 可导出全部本地古诗为 Markdown 文件。
- 可读取标题、作者信息（如有）和正文句子。
- TTS 服务可通过 Docker 一键部署启动。
- 可逐句自动播放并同步句级高亮。
- 朗读时自动滚动到当前句。
- 启用下一句预加载后，连续播放时优先使用已预取音频。
- 若下一句预取成功，则句间切换不再依赖阻塞式实时请求。
- 若预取失败，则允许退化为实时请求下一句，但播放流程必须保持正确。
- 可暂停、继续、停止、跳转句子。
- 点击任意句子可从该句开始朗读。
- 可在高级服务设置中切换自定义接口并恢复默认接口。
- 单句请求失败时可自动重试 1 次，仍失败则停止并提示。
- TTS 服务可用时，功能稳定使用。
- TTS 服务不可用时，页面仍可正常阅读并优雅降级。

## 17. 结论

针对当前项目，采用以下方案：

- 新增独立"古诗阅读"模块。
- 古诗数据本地化管理，支持 Markdown 导入导出。
- 采用同仓库内置的 node-edge-tts API 服务，前端默认使用同源内置接口。
- 实现逐句朗读与逐句高亮，支持自动滚动、下一句预加载、会话内缓存。
- 将逐字高亮与持久化音频缓存作为后续增强项。

该方案与现有代码结构兼容度高，语音质量自然，且能较快产出适合孩子使用的阅读体验。

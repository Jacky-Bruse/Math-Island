# Math-Island（数力岛）

面向平板端儿童的数学与逻辑训练 PWA，当前包含四大模块：

- 加减法训练（10 / 20 / 100 以内）
- 比大小训练（两位数 10-99，使用 `>` / `<`）
- 数独训练（4x4 / 6x6 / 8x8）
- 古诗阅读（列表 / 阅读 / 页内切换 / 编辑 / 导入导出 / 朗读 / 跟读）

技术栈：

- 前端：`React + TypeScript + Vite + Tailwind CSS + vite-plugin-pwa`
- 本地存储：`IndexedDB (idb)`，用于数独草稿等本地数据
- 服务端：`Express + node-edge-tts`
- 部署：`Nginx + Docker Compose`

## 功能概览

- 首页四入口，长按标题区域打开设置
- 训练计时支持 `15 / 20 / 30` 分钟，并带到点休息提醒
- 训练页支持静音快捷按钮
- 数独支持草稿保存与恢复（IndexedDB）
- 古诗支持列表浏览、阅读、页内上一首 / 下一首切换、编辑、删除
- 古诗支持 Markdown 导入与导出
- 古诗支持 TTS 朗读，支持语音角色、语速、音调配置
- 古诗朗读支持 `常规朗读 / 跟读模式`
- 跟读模式支持按句长自适应停顿，并可在设置中通过小型调节图标临时展开滑杆微调
- 古诗写操作受家长密码保护
- 古诗数据由 `tts-service` 持久化保存
- 内置离线资源，支持 PWA 安装和离线访问

## 快速开始

### 1. 安装依赖

```bash
npm install
cd tts-service && npm install
```

### 2. 启动 TTS 服务

古诗管理功能（新增 / 编辑 / 删除 / 导入）依赖服务端管理密码。

PowerShell：

```powershell
$env:ADMIN_PASSWORD="123456"
cd tts-service
npm run dev
```

macOS / Linux：

```bash
cd tts-service
ADMIN_PASSWORD=123456 npm run dev
```

### 3. 启动前端开发服务

```bash
npm run dev
```

默认前端地址为 `http://localhost:5173`。  
Vite 会把 `/api` 代理到 `http://localhost:3001`。

### 4. 代码检查

```bash
npm run lint
```

### 5. 生产构建

```bash
npm run build
cd tts-service && npm run build
```

### 6. 本地预览构建产物

```bash
npm run preview
```

## 古诗朗读说明

### 页内切换

古诗阅读页支持在页面内直接切换 `上一首 / 下一首`，无需退回列表页重新选择。

### 朗读模式

- `常规朗读`：句间停顿较短，适合顺畅读完整首诗
- `跟读模式`：句间会加入更明显的停顿，适合孩子跟读

### 跟读模式调节

- 设置页默认不显示停顿摘要
- 只有在 `跟读模式` 下，右侧才显示一个小型调节图标
- 点击图标后临时展开停顿滑杆
- 滑杆变化立即生效并自动保存
- 点击空白区域后自动收起
- 切回 `常规朗读` 时不会丢失上次的跟读停顿值

## 逻辑验证脚本

项目提供了一个逻辑自检脚本（不在 `package scripts` 中）：

```bash
npx tsx scripts/test-logic.ts
```

覆盖内容包括：

- 加减法出题边界与答案正确性
- 比大小出题边界与答案正确性
- 难度曲线分档
- 数独题库基本有效性检查

## 数独题库生成

可重新生成离线题库：

```bash
npx tsx scripts/generate-sudoku.ts
```

输出目录：

- `public/puzzles/sudoku-4x4.json`
- `public/puzzles/sudoku-6x6.json`
- `public/puzzles/sudoku-8x8.json`

## Docker Compose 部署

项目当前推荐使用预编译的单镜像部署，镜像内同时包含前端静态资源、Nginx 和 `tts-service`：

```bash
MATH_ISLAND_IMAGE=你的DockerHub用户名/math-island:latest ADMIN_PASSWORD=你的密码 docker compose up -d
```

启动后：

- 前端访问：`http://localhost`
- 容器内的 Nginx 提供静态资源，并将 `/api/` 代理到同容器内的 `tts-api`
- `tts-api` 负责 TTS、古诗数据存储和管理密码校验
- `tts-data` volume 用于持久化古诗数据到 `/app/tts-service/data`

如果需要本地构建同款单镜像：

```bash
docker build -t math-island:local .
MATH_ISLAND_IMAGE=math-island:local ADMIN_PASSWORD=你的密码 docker compose up -d
```

如果不设置 `ADMIN_PASSWORD`，古诗写操作会返回 `403`，阅读功能仍可用。

## PWA 与缓存策略

- 使用 `vite-plugin-pwa`（`generateSW`）
- 静态 hash 资源长期缓存
- `sw.js` / `registerSW.js` / `manifest.webmanifest` 禁强缓存
- Manifest 使用 PNG 图标（`192x192` / `512x512`），满足主流浏览器安装检查
- Nginx 配置了 SPA fallback（`try_files ... /index.html`）

## 目录结构（核心）

```text
src/
  components/      UI 组件（训练壳子、数独面板、古诗组件、通用组件）
  hooks/           业务 Hook（计时、训练会话、题目逻辑、草稿、古诗朗读）
  lib/             题目生成、数独引擎、存储、TTS / 古诗 API
  pages/           页面层（Home / 训练页 / 古诗页面）
  types/           类型定义
tts-service/
  src/index.ts     TTS 服务、古诗 CRUD、导入导出、管理密码校验
scripts/
  generate-sudoku.ts
  test-logic.ts
public/
  puzzles/         预生成数独题库
```

## CI

GitHub Actions 会在 `main` 分支 push 时执行 Docker 构建并推送镜像：

- `.github/workflows/docker-build.yml`

## 当前状态

- 核心训练流程、休息状态机、PWA 构建已完成并可运行
- 古诗阅读模块已接入服务端存储与管理鉴权
- 古诗阅读页已支持页内切换上一首 / 下一首，不必返回列表重新选择
- 古诗 TTS 已支持常规朗读与跟读模式，跟读停顿可按设置实时调整
- Docker Compose 形态下，前端与 `tts-service` 可联动运行
- 音效模块代码已预留（`src/hooks/useSound.ts`），业务事件接入可在后续版本补齐

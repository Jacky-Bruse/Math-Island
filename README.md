# Math-Island（数力岛）

面向平板端儿童的数学与逻辑训练 PWA，当前包含四大模块：

- 加减法（10/20/100 以内）
- 比大小（两位数 10-99，`>` / `<`）
- 数独（4x4 / 6x6 / 8x8）
- 古诗阅读（列表 / 阅读 / 编辑 / 导入导出 / 朗读）

项目技术栈：

- 前端：`React + TypeScript + Vite + Tailwind CSS + vite-plugin-pwa`
- 前端存储：`IndexedDB(idb)`（主要用于数独草稿等本地数据）
- 服务端：`Express + node-edge-tts`
- 部署：`Nginx + Docker Compose`

## 功能概览

- 首页四入口，长按标题区域打开设置
- 训练计时（15/20/30 分钟），含中途/到点休息提醒
- 训练页支持静音快捷按钮（完整设置仅首页）
- 数独支持草稿保存与恢复（IndexedDB）
- 古诗支持列表浏览、阅读、编辑、删除
- 古诗支持 Markdown 导入与导出
- 古诗支持 TTS 朗读、语音角色/语速/音调配置
- 古诗写操作受家长密码保护
- 古诗数据由 `tts-service` 持久化保存
- 题库内置离线资源，支持 PWA 安装和离线访问

## 快速开始

### 1) 安装依赖

```bash
npm install
cd tts-service && npm install
```

### 2) 启动 TTS 服务

管理功能（新增 / 编辑 / 删除 / 导入古诗）依赖服务端管理密码。

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

### 3) 启动前端开发服务

```bash
npm run dev
```

默认前端开发地址：`http://localhost:5173`

Vite 会把 `/api` 代理到 `http://localhost:3001`。

### 4) 代码检查

```bash
npm run lint
```

### 5) 生产构建

```bash
npm run build
cd tts-service && npm run build
```

### 6) 本地预览构建产物

```bash
npm run preview
```

## 逻辑验证脚本

项目提供了逻辑自检脚本（不在 package scripts 中）：

```bash
npx tsx scripts/test-logic.ts
```

覆盖内容包括：

- 加减法出题边界与答案正确性
- 比大小出题边界与答案正确性
- 难度曲线分桶
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

如果需要本地生成同款单镜像，可先执行：

```bash
docker build -t math-island:local .
MATH_ISLAND_IMAGE=math-island:local ADMIN_PASSWORD=你的密码 docker compose up -d
```

如果不设置 `ADMIN_PASSWORD`，古诗写操作会返回 403，阅读功能仍可用。

## PWA 与缓存策略

- 使用 `vite-plugin-pwa`（`generateSW`）
- 静态 hash 资源长期缓存
- `sw.js` / `registerSW.js` / `manifest.webmanifest` 禁强缓存
- Nginx 配置了 SPA fallback（`try_files ... /index.html`）

## 目录结构（核心）

```text
src/
  components/      UI 组件（训练框架、数独面板、共享组件）
  hooks/           业务 Hook（计时、训练会话、题目逻辑、草稿、古诗朗读）
  lib/             题目生成、数独引擎、存储、TTS/古诗 API
  pages/           页面层（Home/训练页/古诗页面）
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

GitHub Actions 在 `main` 分支 push 时执行 Docker 构建并推送镜像：

- `.github/workflows/docker-build.yml`

## 当前状态说明

- 核心训练流程、休息状态机、PWA 构建已完成并可运行
- 古诗阅读模块已接入服务端存储与管理鉴权
- Docker Compose 形态下，前端与 `tts-service` 可联动运行
- 音效模块代码已预留（`src/hooks/useSound.ts`），业务事件接入可在后续版本补齐

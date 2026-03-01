# Math-Island（数力岛）

面向平板端儿童的数学与逻辑训练 PWA，当前包含三大模块：

- 加减法（10/20/100 以内）
- 比大小（两位数 10-99，`>` / `<`）
- 数独（4x4 / 6x6 / 8x8）

项目技术栈：`React + TypeScript + Vite + Tailwind CSS + vite-plugin-pwa + IndexedDB(idb)`

## 功能概览

- 首页三入口，长按标题区域打开设置
- 训练计时（15/20/30 分钟），含中途/到点休息提醒
- 训练页支持静音快捷按钮（完整设置仅首页）
- 数独支持草稿保存与恢复（IndexedDB）
- 题库内置离线资源，支持 PWA 安装和离线访问

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 本地开发

```bash
npm run dev
```

### 3) 代码检查

```bash
npm run lint
```

### 4) 生产构建

```bash
npm run build
```

### 5) 本地预览构建产物

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

## Docker 部署

项目已提供多阶段 Dockerfile（Node 构建 + Nginx 静态服务）：

```bash
docker build -t math-island .
docker run --rm -p 8080:80 math-island
```

浏览器访问：`http://localhost:8080`

## PWA 与缓存策略

- 使用 `vite-plugin-pwa`（`generateSW`）
- 静态 hash 资源长期缓存
- `sw.js` / `registerSW.js` / `manifest.webmanifest` 禁强缓存
- Nginx 配置了 SPA fallback（`try_files ... /index.html`）

## 目录结构（核心）

```text
src/
  components/      UI 组件（训练框架、数独面板、共享组件）
  hooks/           业务 Hook（计时、训练会话、题目逻辑、草稿）
  lib/             题目生成、数独引擎、存储与 IndexedDB
  pages/           页面层（Home/模块选择/训练页）
  types/           类型定义
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
- 音效模块代码已预留（`src/hooks/useSound.ts`），业务事件接入可在后续版本补齐

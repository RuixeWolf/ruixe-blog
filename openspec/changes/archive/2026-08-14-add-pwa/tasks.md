# Implementation Tasks: add-pwa

> 任务拆分为 7 个组，按依赖顺序执行。每组可在独立 AI Session 中完成。
> 前置依赖：Group 1 → Group 2；Group 3、Group 4 独立；Group 5 依赖 Group 3；Group 6 依赖 Group 1-5 全部；Group 7 依赖 Group 6。
>
> 并行执行建议：
>
> - Session A：Group 1 → Group 2（图标 → manifest，顺序执行）
> - Session B：Group 3（SW + 注册组件，独立）
> - Session C：Group 4（next.config.ts headers，独立）
> - Session D：Group 5（layout.tsx，依赖 Group 3 完成）
> - Session E：Group 6 → Group 7（验证，依赖全部完成）

## 1. PWA 图标生成脚本与图标生成

> 新增 `sharp` devDependency 与图标生成脚本，从 `app/icon.png` 自动生成 3 个 PWA 图标至 `public/`。无 UI 改动，纯工具链与静态资产。

- [x] 1.1 运行 `pnpm add -D sharp` 安装 sharp devDependency（`sharp@~0.35.3`，已作为 next 传递依赖存在于 pnpm store，显式声明以供脚本 import）
- [x] 1.2 在 `package.json` 的 `scripts` 对象新增 `"generate-pwa-icons": "node scripts/generate-pwa-icons.mjs"`，保持 scripts 内字母顺序
- [x] 1.3 创建 `scripts/generate-pwa-icons.mjs`，文件首行 `#!/usr/bin/env node`
- [x] 1.4 在脚本中 import `sharp`、`node:path`、`node:url`，用 `fileURLToPath(import.meta.url)` 解析项目根目录（参考 `scripts/delete-post.mjs` 的路径解析模式）
- [x] 1.5 定义源图路径 `SOURCE = path.join(root, 'app', 'icon.png')` 与输出目录 `PUBLIC = path.join(root, 'public')`
- [x] 1.6 定义浅色背景色常量 `BG = { r: 244, g: 245, b: 246, alpha: 1 }`（light `--background` oklch `oklch(97.02% 0.0015 243.6)` 转换为 sRGB hex `#f4f5f6` 后的 RGB 值）
- [x] 1.7 定义 maskable 安全区比例常量 `SAFE_RATIO = 0.8`（W3C maskable spec 中央 80%）
- [x] 1.8 实现 `any` purpose 图标生成：遍历 `[192, 512]` 尺寸，对每个尺寸执行 `sharp(SOURCE).resize(size, size).png().toFile(path.join(PUBLIC, 'icon-' + size + '.png'))`，输出 `public/icon-192.png` 与 `public/icon-512.png`
- [x] 1.9 实现 `maskable` purpose 图标生成：先用 `sharp(SOURCE).resize(Math.round(512 * SAFE_RATIO), Math.round(512 * SAFE_RATIO)).toBuffer()` 缩放源图到 410×410（512×0.8），再用 `sharp({ create: { width: 512, height: 512, channels: 4, background: BG } }).composite([{ input: content, gravity: 'center' }]).png().toFile(path.join(PUBLIC, 'icon-512-maskable.png'))` 合成到 512×512 背景画布上
- [x] 1.10 在脚本末尾输出成功日志 `console.log('✓ PWA icons generated in public/')`
- [x] 1.11 为脚本添加 JSDoc 注释，说明用途（从 `app/icon.png` 生成 PWA 图标）、输出文件（3 个 PNG）、maskable 安全区逻辑、复用 `sharp` 库、手动运行方式（`pnpm generate-pwa-icons`），参考 `scripts/delete-post.mjs` 的注释风格
- [x] 1.12 运行 `pnpm generate-pwa-icons`，确认 `public/` 下生成 `icon-192.png`、`icon-512.png`、`icon-512-maskable.png` 三个文件
- [x] 1.13 验证生成图标的尺寸：用 `node -e` 读取每个 PNG 的 IHDR（偏移 16/20 的 UInt32BE width/height），确认 `icon-192.png` 为 192×192、`icon-512.png` 与 `icon-512-maskable.png` 为 512×512
- [x] 1.14 验证 maskable 安全区：用浏览器或图片查看器打开 `public/icon-512-maskable.png`，确认内容居中且外围有 `#f4f5f6` 浅色 padding（对比 `icon-512.png` 应为全画布无 padding）
- [x] 1.15 运行 `pnpm lint` 确认无类型错误与 lint 问题（`.mjs` 文件可能不在 eslint 范围，确认无报错即可）

## 2. Web App Manifest

> 创建 `app/manifest.ts` 文件约定，复用 `siteConfig`，声明 PWA 可安装性元数据。依赖 Group 1 的图标已生成（manifest 引用图标路径）。参考 `app/robots.ts`、`app/sitemap.ts` 的文件约定模式。

- [x] 2.1 创建 `app/manifest.ts`，import `type { MetadataRoute } from 'next'` 与 `import { siteConfig } from '@/lib/site-config'`，确保 import 顺序符合 `.prettierrc.json`（`next` → `@/*` 别名）
- [x] 2.2 实现 `export default function manifest(): MetadataRoute.Manifest`，返回 manifest 对象
- [x] 2.3 设置 `id: '/'`（显式 PWA 标识符，未来改 `start_url` 不破坏已安装实例）
- [x] 2.4 设置 `name: siteConfig.siteTitle` 与 `short_name: siteConfig.siteTitle`（"Ruixe Blog" = 10 字符，≤12 限制内，无需缩短）
- [x] 2.5 设置 `description: siteConfig.siteDescription`
- [x] 2.6 设置 `start_url: '/'` 与 `scope: '/'`（复用 `proxy.ts` 既有语言检测重定向）
- [x] 2.7 设置 `display: 'standalone'`
- [x] 2.8 设置 `background_color: '#f4f5f6'` 与 `theme_color: '#f4f5f6'`（浅色背景 hex，manifest 单值；深浅切换通过 `viewport.themeColor` 实现，见 Group 5）
- [x] 2.9 设置 `icons` 数组，3 个条目：`{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }`、`{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }`、`{ src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }`
- [x] 2.10 为 `manifest` 函数添加 JSDoc 注释，说明用途（Web App Manifest 文件约定）、复用 `siteConfig`、Next.js 自动生成 `/manifest.webmanifest` 路由并注入 `<link rel="manifest">`、构建时静态生成，参考 `app/robots.ts` 的注释风格
- [x] 2.11 运行 `pnpm lint` 确认无类型错误与 lint 问题
- [x] 2.12 验证：`pnpm build` 后确认构建输出中 `/manifest.webmanifest` 路由标记为 `○`（静态）
- [x] 2.13 验证：`pnpm dev` 后用 `curl http://localhost:3000/manifest.webmanifest` 确认返回有效 JSON，包含 `name`、`short_name`、`description`、`start_url`、`display`、`theme_color`、`background_color`、`icons` 字段，`icons` 数组含 3 个条目
- [x] 2.14 验证：浏览器访问 `http://localhost:3000/zh`，查看页面源码确认 `<head>` 中自动注入 `<link rel="manifest" href="/manifest.webmanifest">` 标签

## 3. Service Worker 与注册组件

> 创建 no-op Service Worker 与 client 注册组件。独立于 Group 1-2，可并行执行。

- [x] 3.1 创建 `public/sw.js`，内容为最小 no-op SW：`self.addEventListener('install', () => self.skipWaiting())` 与 `self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))`，不注册任何 `fetch` 监听
- [x] 3.2 在 `public/sw.js` 顶部添加注释，说明用途（no-op SW 满足 PWA 可安装性，不缓存任何资源）、`skipWaiting`/`clients.claim` 行为、手动运行方式（生产环境由注册组件自动注册）
- [x] 3.3 创建 `components/pwa/ServiceWorkerRegister.tsx`，首行 `'use client'`
- [x] 3.4 import `useEffect` from `react`，确保 import 顺序符合 `.prettierrc.json`（`react` → builtins → 第三方 → `@/*` 别名）
- [x] 3.5 实现 `export function ServiceWorkerRegister(): null`，在 `useEffect` 中：检查 `process.env.NODE_ENV !== 'production'` 则 return（dev 模式跳过）；检查 `'serviceWorker' in navigator` 则 return（旧浏览器降级）；调用 `navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})`（静默失败，SW 是渐进增强）
- [x] 3.6 组件返回 `null`（无 UI，纯副作用组件）
- [x] 3.7 为 `ServiceWorkerRegister` 组件添加 JSDoc 注释，说明用途（生产环境注册 no-op SW）、dev 守卫（避免缓存干扰）、SSR 安全（`'serviceWorker' in navigator` 检查）、静默失败（渐进增强）、返回 `null`（纯副作用），参考 `components/theme/ThemeProvider.tsx` 的注释风格
- [x] 3.8 运行 `pnpm lint` 确认无类型错误与 lint 问题
- [x] 3.9 验证：`pnpm build` 后确认构建输出中 `/sw.js` 作为静态文件被输出（`public/` 下文件直接复制）
- [x] 3.10 验证：`pnpm dev` 后用 `curl http://localhost:3000/sw.js` 确认返回 no-op JS 内容（含 `install` 与 `activate` 监听）

## 4. next.config.ts Headers 配置

> 为 `/sw.js` 设置 Content-Type、Cache-Control、CSP headers。独立于 Group 1-3，可并行执行。参考 Next.js PWA 文档推荐配置。

- [x] 4.1 在 `next.config.ts` 的 `nextConfig` 对象中新增 `async headers()` 方法（与既有 `async redirects()` 并列），返回数组
- [x] 4.2 在 `headers()` 返回数组中新增一个对象：`{ source: '/sw.js', headers: [...] }`
- [x] 4.3 为 `/sw.js` 配置 3 个 headers：`{ key: 'Content-Type', value: 'application/javascript; charset=utf-8' }`、`{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }`、`{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" }`
- [x] 4.4 为 `headers()` 方法添加 JSDoc 注释，说明用途（为 `/sw.js` 设置 Content-Type、Cache-Control、CSP headers）、参考 Next.js PWA 文档推荐、确保 SW 更新及时（`no-cache`）与 CSP 安全加固，参考同文件 `readRedirectRules` 的注释风格
- [x] 4.5 运行 `pnpm lint` 确认无类型错误与 lint 问题
- [x] 4.6 验证：`pnpm dev` 后用 `curl -I http://localhost:3000/sw.js` 确认响应 headers 包含 `Content-Type: application/javascript; charset=utf-8`、`Cache-Control: no-cache, no-store, must-revalidate`、`Content-Security-Policy: default-src 'self'; script-src 'self'`
- [x] 4.7 验证：确认 `redirects()` 既有行为不受影响（`pnpm build` 后访问已删除文章的旧 URL 仍正确 308 重定向）

## 5. layout.tsx 元数据扩展与 SW 注册挂载

> 修改 `app/[lang]/layout.tsx`：新增 `viewport` export 的 `themeColor`（`metadata.themeColor` 已弃用）与 `generateMetadata()` 的 `appleWebApp`，在 `LocaleLayout` 组件挂载 `<ServiceWorkerRegister />`。依赖 Group 3 的注册组件已创建。

- [x] 5.1 在 `app/[lang]/layout.tsx` 顶部 import `ServiceWorkerRegister` from `@/components/pwa/ServiceWorkerRegister`，确保 import 顺序符合 `.prettierrc.json`（`@/*` 别名在第三方之后，按字母序插入既有 `@/components/` import 块）
- [x] 5.2 在 `app/[lang]/layout.tsx` 新增 `export const viewport: Viewport` 导出，其 `themeColor` 字段值为数组：`[{ color: '#f4f5f6', media: '(prefers-color-scheme: light)' }, { color: '#050606', media: '(prefers-color-scheme: dark)' }]`（浅色 `#f4f5f6` = light `--background` oklch 转换；深色 `#050606` = dark `--background` oklch 转换；`themeColor` 在 `metadata` 中自 Next.js 14 起弃用，须通过 `viewport` export 配置）
- [x] 5.3 在 `generateMetadata()` 的返回对象中，`description` 字段之后新增 `appleWebApp` 字段，值为 `{ capable: true, title: siteConfig.siteTitle, statusBarStyle: 'default' }`
- [x] 5.4 在 `LocaleLayout` 组件的 JSX 中，`<Analytics />` 之前插入 `<ServiceWorkerRegister />`（位于 `<ThemeProvider>` 内、`</body>` 之前）
- [x] 5.5 为 `viewport.themeColor` 与 `appleWebApp` 添加行内注释，说明 `themeColor` 用 `ThemeColorDescriptor[]` 数组随 `prefers-color-scheme` 切换运行时状态栏色（manifest `theme_color` 仅单值用于闪屏），`appleWebApp` 生成 iOS standalone App meta 标签
- [x] 5.6 运行 `pnpm lint` 确认无类型错误与 lint 问题
- [x] 5.7 验证：`pnpm build` 后确认构建成功，无动态路由（`ƒ`）引入
- [x] 5.8 验证：`pnpm dev` 后访问 `/zh`，查看页面源码确认 `<head>` 中包含 `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f4f5f6">` 与 `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#050606">` 两个标签
- [x] 5.9 验证：查看页面源码确认 `<head>` 中包含 `<meta name="apple-mobile-web-app-capable" content="yes">`（或 `mobile-web-app-capable`）与 `<meta name="apple-mobile-web-app-title" content="Ruixe Blog">` 标签
- [x] 5.10 验证：确认 `<ServiceWorkerRegister />` 已挂载（dev 模式下不注册 SW，但组件应无报错渲染）

## 6. 格式化、Lint 与构建验证

> 全局验证与收尾。依赖 Group 1-5 全部完成。

- [x] 6.1 运行 `pnpm format-lint` 统一格式化与 lint 修复
- [x] 6.2 运行 `pnpm build` 确认构建成功，`/manifest.webmanifest` 与 `/sw.js` 标记为 `○`（静态），无动态路由（`ƒ`）引入
- [x] 6.3 验证 `proxy.ts` matcher 未被修改（`/manifest.webmanifest` 与 `/sw.js` 路径含 `.` 已被 `.*\\..*` 排除，无需改动），运行 `pnpm format-lint` 后确认 matcher 仍为纯字符串数组（未被 Prettier 转为 `String.raw`）
- [x] 6.4 确认 `next.config.ts` 的 `redirects()` 既有行为不受影响（`headers()` 新增不干扰 `redirects()`）
- [x] 6.5 确认 `package.json` 新增 `sharp` devDependency 与 `generate-pwa-icons` script，无其他意外变更
- [x] 6.6 确认未修改 `content/site.yaml`（复用 `siteConfig`，不改动）
- [x] 6.7 确认未修改 `app/icon.png` 与 `app/apple-icon.png`（既有 favicon 文件约定保持不变）
- [x] 6.8 运行 OpenSpec 验证：`openspec validate add-pwa` 确认变更 artifacts 合规

## 7. 端到端 PWA 验证

> 生产构建本地运行，DevTools 与 Lighthouse 验证 PWA 可安装性。依赖 Group 6 完成。

- [x] 7.1 运行 `pnpm build && pnpm start` 启动生产构建（`NODE_ENV=production`，SW 注册组件的守卫放行）
- [x] 7.2 打开浏览器访问 `http://localhost:3000`，打开 DevTools → Application → Manifest，确认 manifest 检测无错误，3 个图标加载无 404，显示 "Installability: No errors"
- [x] 7.3 在 DevTools → Application → Service Workers，确认 `sw.js` 显示 activated 且无错误
- [x] 7.4 在 DevTools → Application → Storage，确认 "Service Workers" 已注册，无 "Cache Storage" 条目（no-op SW 不缓存）
- [x] 7.5 查看页面源码确认 `<head>` 包含：`<link rel="manifest">`、两个 `<meta name="theme-color">`（light/dark）、`apple-mobile-web-app-capable`、`apple-mobile-web-app-title` 标签
- [x] 7.6 运行 Lighthouse PWA audit（DevTools → Lighthouse → PWA 类别），确认 "Installable" 检查通过，无 manifest 验证错误
- [x] 7.7 验证深浅主题切换：在 DevTools → Rendering → Emulate CSS prefers-color-scheme 切换 light/dark，确认 `<meta name="theme-color">` 的 active 值随之切换（无需页面刷新）
- [x] 7.8 验证 SW 不缓存：在 DevTools → Application → Service Workers 勾选 "Offline"，刷新页面，确认页面正常失败（不返回缓存内容），证明 no-op SW 无离线能力（符合 Non-Goal）
- [x] 7.9 验证图标生成可重复性：再次运行 `pnpm generate-pwa-icons`，用 `git status` 确认 `public/icon-*.png` 无变更（deterministic 生成，byte-identical 输出）
- [x] 7.10 端到端验证：`curl http://localhost:3000/manifest.webmanifest` 确认返回有效 JSON；`curl -I http://localhost:3000/sw.js` 确认 3 个 headers 正确；`curl http://localhost:3000/icon-192.png` 确认图标可访问
- [x] 7.11 停止 `pnpm start` 进程，清理验证环境

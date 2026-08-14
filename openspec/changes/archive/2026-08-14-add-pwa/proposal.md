## Why

博客网站需要支持 PWA（Progressive Web App），让读者可将网站添加至操作系统桌面，实现类原生 App 的快捷打开与 standalone 体验。项目文档明确要求"可将网站添加至操作系统桌面，实现快捷打开，不需要过多缓存数据"——即聚焦**可安装性（installability）**，离线缓存是明确的非目标。作为 AI Coding 时代产物的个人博客，提供 PWA 安装能力既是技术实践，也提升移动端读者的访问体验。

## What Changes

- 新增 Web App Manifest（`app/manifest.ts`），复用 `siteConfig` 的 `siteTitle`/`siteDescription`，声明 `start_url: '/'`、`display: 'standalone'`、3 个 PWA 图标（192 any + 512 any + 512 maskable），Next.js 文件约定自动生成 `/manifest.webmanifest` 路由并注入 `<link rel="manifest">`
- 新增最小 no-op Service Worker（`public/sw.js`），仅含 `install`/`activate` 空壳 + `skipWaiting`/`clients.claim`，**不缓存任何资源**，满足跨浏览器可安装性且缓存数据≈0
- 新增 SW 注册组件（`components/pwa/ServiceWorkerRegister.tsx`，client component），生产环境注册 `/sw.js`，dev 模式跳过避免缓存干扰
- 新增 `sharp` 图标生成脚本（`scripts/generate-pwa-icons.mjs`），从 `app/icon.png`（1184×1184 RGBA 源图）自动缩放生成 3 个 PWA 图标至 `public/`，maskable 版本带 80% 安全区 padding
- 修改 `app/[lang]/layout.tsx`：新增 `viewport` export 的 `themeColor`（media query 数组，随系统深浅切换运行时状态栏色；`themeColor` 在 `metadata` 中自 Next.js 14 起弃用，须用 `viewport`），`generateMetadata()` 新增 `appleWebApp`（iOS standalone App 支持）元数据
- 修改 `app/[lang]/layout.tsx` 的 `LocaleLayout` 组件，挂载 `<ServiceWorkerRegister />`
- 修改 `next.config.ts`，新增 `headers()` 为 `/sw.js` 设置 `Content-Type`、`Cache-Control: no-cache`、`Content-Security-Policy`
- 修改 `package.json`，新增 `sharp` devDependency 与 `generate-pwa-icons` script

## Capabilities

### New Capabilities

- `pwa`: PWA 可安装性能力，包括 Web App Manifest 生成、Service Worker 注册、PWA 图标自动生成、运行时主题色与 iOS standalone 元数据

### Modified Capabilities

（无 -- 本次变更不修改任何既有 spec 的需求级别行为。`seo` spec 的元数据扩展属于 PWA 能力的新增行为，不改变既有 SEO 需求）

## Impact

- **新增文件**：`app/manifest.ts`、`public/sw.js`、`public/icon-192.png`、`public/icon-512.png`、`public/icon-512-maskable.png`、`components/pwa/ServiceWorkerRegister.tsx`、`scripts/generate-pwa-icons.mjs`
- **修改文件**：`app/[lang]/layout.tsx`（挂载注册组件 + viewport export 加 themeColor + generateMetadata 加 appleWebApp）、`next.config.ts`（新增 headers）、`package.json`（新增 sharp devDep + generate-pwa-icons script）
- **新增依赖**：`sharp`（devDependency，~0.35.3，已作为 next 传递依赖存在于 pnpm store，显式声明以供脚本 import）
- **构建产物**：`/manifest.webmanifest` 静态文件、`/sw.js` 静态文件、3 个 PWA 图标 PNG
- **无破坏性变更**：不修改任何现有 URL 或页面行为；既有 favicon（`app/icon.png` 文件约定）、apple-touch-icon（`app/apple-icon.png`）、sitemap、robots、RSS feed 均不受影响
- **SSG 影响**：`app/manifest.ts` 是特殊 Route Handler，默认静态缓存（无 Request-time API），构建时生成，不引入动态渲染；所有路由保持静态生成（`○`）
- **proxy.ts**：`/manifest.webmanifest` 与 `/sw.js` 路径含 `.`，已被现有 matcher `.*\\..*` 正则排除，middleware 不拦截，无需修改 matcher
- **Vercel 部署**：PWA 图标由 sharp 脚本本地生成后提交 git，Vercel 构建不依赖脚本运行；`sharp` 是 devDependency，Vercel 默认安装 devDeps 但构建时不需要执行脚本

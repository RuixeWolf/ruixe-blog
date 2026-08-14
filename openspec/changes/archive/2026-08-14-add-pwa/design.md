## Context

博客已有成熟的"构建时静态生成 + 文件约定"模式（favicon via `app/icon.png`、apple-touch-icon via `app/apple-icon.png`、sitemap via `app/sitemap.ts`、robots via `app/robots.ts`、RSS feed via `app/[lang]/feed.xml/route.ts`），以及 `content/site.yaml` + `lib/site-config.ts` 的站点配置单一真相源。PWA 功能完全复用这些既有资产，仅引入 `sharp` 一个 devDependency（已作为 `next` 传递依赖存在于 pnpm store）。

项目文档明确要求"可将网站添加至操作系统桌面，实现快捷打开，不需要过多缓存数据"——这把范围收窄到**可安装性（installability）**，离线缓存是明确的非目标。Next.js 16 的 `experimental.useOffline` 特性需要 `cacheComponents: true` + `partialPrefetching: true` 架构级改动，与"不需要过多缓存数据"相悖，不启用。

关键技术约束已通过 Next.js 16 源码与类型定义验证：

- `MetadataRoute.Manifest` 的 `theme_color` 字段类型为 `string`（不支持 media query 数组），但 `viewport` export 的 `themeColor` 支持 `ThemeColorDescriptor[]`（`{ color: string; media?: string }[]`；`metadata.themeColor` 自 Next.js 14 起弃用）——主题色深浅切换通过 `<meta name="theme-color">` 实现，manifest 用单值
- `app/manifest.ts` 文件约定自动生成 `/manifest.webmanifest` 路由并注入 `<link rel="manifest">`，无需手动设 `manifest` 字段
- `proxy.ts` matcher 的 `.*\\..*` 正则排除含 `.` 的路径，`/manifest.webmanifest`、`/sw.js`、`/icon-*.png` 均被排除，middleware 不拦截

## Goals / Non-Goals

**Goals:**

- 让读者可将博客安装至操作系统桌面，以 standalone 模式快捷打开
- 满足跨浏览器（Chrome、Edge、Firefox、Safari iOS）可安装性 criteria
- 运行时状态栏色随系统深浅主题切换
- iOS "添加到主屏幕"后 standalone 体验（非 Safari chrome 包裹）
- PWA 图标通过 `sharp` 脚本从源图自动生成，可重复执行
- 完全复用现有 `lib/site-config.ts` 与文件约定模式，最小化新增依赖

**Non-Goals:**

- 不提供离线浏览能力（no-op SW 不缓存任何资源；断网时全页刷新正常失败）
- 不启用 `experimental.useOffline`（需 Cache Components 架构改动，超出 MVP）
- 不做自定义安装提示 UI（依赖浏览器原生安装提示，iOS 不支持 `beforeinstallprompt`）
- 不做 Web Push Notifications（需 VAPID 密钥与后端存储，超出个人博客 MVP）
- 不做启动闪屏图（`appleWebApp.startupImage`，需额外图片资产）
- 不修改既有 `app/icon.png` / `app/apple-icon.png`（1.1MB 偏大的既有问题，单独 follow-up）
- 不为列表页、关于页生成 PWA 专属资源（manifest 与 SW 全站覆盖即可）

## Decisions

### Decision 1: Manifest 生成方式 -- `app/manifest.ts`（动态 TS）

**选择**：使用 `app/manifest.ts` 文件约定，import `siteConfig` 复用 `site.yaml` 的 title/description。

**理由**：与 `2026-07-24-site-config-from-yaml` 的"单一真相源"约定一致，未来改站点名只需改 `content/site.yaml`。`manifest.ts` 是特殊 Route Handler，默认静态缓存（无 Request-time API），构建时生成 `/manifest.webmanifest`，不引入动态渲染。Next.js 自动注入 `<link rel="manifest">`，无需手动设 `metadata.manifest`。

**备选方案**：

- `app/manifest.json`（静态）-- title/description 与 `site.yaml` 重复，未来改站点名要改两处

### Decision 2: 主题色双通道 -- manifest 单值 + `viewport.themeColor` media query 数组

**选择**：manifest 的 `theme_color` / `background_color` 用单值 `#f4f5f6`（浅色背景）；`app/[lang]/layout.tsx` 的 `viewport` export 中 `themeColor` 用 `ThemeColorDescriptor[]` 数组，随 `prefers-color-scheme` 切换。

**理由**：查阅 Next.js 16 类型定义与官方文档（`generate-viewport.md`）：`MetadataRoute.Manifest.theme_color` 类型为 `string`，不支持 media query 数组；而 `themeColor` 在 `metadata` 中自 Next.js 14 起标记为 Deprecated，须通过 `viewport` export 配置（在 metadata 中配置会触发 build warning 且不渲染 `<meta name="theme-color">` 标签），其 `ThemeColorDescriptor = { color: string; media?: string }` 支持数组。两个机制各司其职：manifest `theme_color` 只在安装闪屏那一瞬间用（单值足够），`<meta name="theme-color">` 是 Android Chrome 运行时读取的状态栏色（支持深浅切换）。hex 值由 `app/heroui-theme.css` 的 oklch 值转换：浅色 `--background` `oklch(97.02% 0.0015 243.6)` → `#f4f5f6`，深色 `--background` `oklch(12% 0.0015 243.6)` → `#050606`。

**备选方案**：

- manifest `theme_color` 用 media query 数组 -- 类型不支持，需 `as any` 绕过
- 仅浅色单值 -- 深色模式用户运行时状态栏白闪
- `theme_color` 用 accent 蓝 `#3d91cf` -- 品牌感强但偏重，与文字博客的干净调性不符

### Decision 3: Service Worker 策略 -- 最小 no-op SW

**选择**：`public/sw.js` 仅含 `install`/`activate` 空壳 + `self.skipWaiting()` / `self.clients.claim()`，不注册任何 `fetch` 监听，零缓存。

**理由**：满足跨浏览器可安装性（Firefox 仍要求 SW；Chrome 现已放宽但安装提示不稳定），缓存数据≈0，完全契合"不需要过多缓存数据"。no-op SW 文件 ~200 字节，下载无感知。

**备选方案**：

- App-shell 缓存 SW -- 缓存 HTML shell + 静态资源，离线可开壳，但增加缓存数据、更新陈旧问题、复杂度
- `@serwist/next`（next-pwa 继任者）-- Workbox 预缓存，功能强但重，缓存膨胀，引入依赖与构建插件
- 完全不要 SW -- Chrome 现已放宽但 Firefox 仍要求 SW，无 SW 时安装提示不稳定

### Decision 4: SW 文件位置与注册方式 -- `public/sw.js` + 注册组件

**选择**：SW 放 `public/sw.js`（纯 JS 静态文件），注册组件 `components/pwa/ServiceWorkerRegister.tsx`（`'use client'`，`useEffect` 注册，`process.env.NODE_ENV === 'production'` 守卫）。

**理由**：纯 JS 静态文件无 bundler 魔法，Turbopack 零风险。no-op SW 不需要 import/TS。生产守卫避免 dev 模式缓存旧资源干扰调试。注册组件返回 `null`，纯副作用，挂载到 `app/[lang]/layout.tsx` 的 `<body>` 内 `<Analytics />` 之前。SW `scope: '/'` 合法（根路径 SW 可覆盖全站，包括 `/[lang]` 前缀路由），无需 `Service-Worker-Allowed` header。

**备选方案**：

- `lib/service-worker.js` + `new URL(..., import.meta.url)` -- Next.js 文档示例写法，Turbopack 打包成独立 chunk，允许 TS/import，但 no-op SW 用不上，且 `import.meta.url` 在 Turbopack 下有边缘风险

### Decision 5: PWA 图标生成 -- `sharp` 脚本自动缩放

**选择**：新增 `scripts/generate-pwa-icons.mjs`，用 `sharp` 从 `app/icon.png`（1184×1184 RGBA 源图）自动缩放生成 3 个 PWA 图标至 `public/`：`icon-192.png`（192×192 any）、`icon-512.png`（512×512 any）、`icon-512-maskable.png`（512×512 maskable，内容缩放到中央 80% 安全区，外围填充 `#f4f5f6` 背景色）。`sharp` 显式声明为 devDependency。

**理由**：`sharp@0.35.3` 已作为 `next` 传递依赖存在于 pnpm store（Next.js 用它做 `next/image` 优化），但 pnpm 严格 `node_modules` 使脚本无法直接 import 传递依赖，需显式声明。`sharp.composite()` 生成 maskable 安全区已验证可行（测试输出 512×512, 157KB）。生成文件提交 git，Vercel 构建不依赖脚本运行。手动 `pnpm generate-pwa-icons` 按需重跑（logo 几乎不变）。

**备选方案**：

- `generateImageMetadata` + `ImageResponse` -- Next.js 文件约定自动生成，但 `ImageResponse` 是"用 JSX 画图"（Satori 引擎），不能直接缩放现有栅格图；必须用 JSX 重画图标，放弃现有 logo
- 在线工具（realfavicongenerator.net）一次性生成 -- 最高图片质量，但"一次性上传"仍需手动操作，且不可重复执行
- `ImageResponse` 合成现有 PNG（data URL）-- 实现复杂（读文件→base64→嵌入），Satori 图片渲染质量 ≠ 专业缩放算法

### Decision 6: 图标文件数量 -- 3 文件分离（any + any + maskable）

**选择**：生成 3 个独立 PNG 文件，manifest `icons` 数组声明 3 个条目：192 any、512 any、512 maskable。

**理由**：sharp 自动生成，第 3 个文件零成本。分离后 `any` 用全画布（splash screen 满屏无 padding），`maskable` 用安全区（Android 自适应不裁切），每个用途视觉最优。

**备选方案**：

- 2 文件合并（192 any + 512 any maskable 兼用）-- maskable-safe 图标作 `any` 时略小但可接受，省一张文件
- 仅 512 maskable-safe 一张 -- 缺 192 导致部分 Android 设备回退模糊

### Decision 7: maskable 背景色 -- 浅色 `#f4f5f6`

**选择**：maskable 图标外围填充浅色背景 `#f4f5f6`（light `--background`）。

**理由**：中性，匹配站点主浅色主题。深色模式用户主屏见浅色图标底是常见模式（多数 App 如此）。透明背景不可控（Android 填默认色通常白）。

**备选方案**：

- 深色背景 `#050606` -- 匹配深色模式，浅色模式用户主屏见深色图标底
- 品牌蓝 `#3d91cf` -- 品牌感强但偏重
- 透明 -- Android 填默认色，不可控

### Decision 8: `next.config.ts` Headers -- `/sw.js` 三头

**选择**：新增 `headers()` 为 `/sw.js` 设置 `Content-Type: application/javascript; charset=utf-8`、`Cache-Control: no-cache, no-store, must-revalidate`、`Content-Security-Policy: default-src 'self'; script-src 'self'`。

**理由**：Next.js PWA 文档推荐。确保 SW 更新及时（`no-cache`），CSP 安全加固。这是本次变更唯一需要改 `next.config.ts` 的地方，`redirects()` 保持不变。

**备选方案**：

- 仅 `Cache-Control: no-cache` -- 最小改动，SW 更新有保障，省 CSP/Content-Type
- 不加 headers -- 依赖 SW spec 自身更新机制（24h 检查），最简但更新延迟

### Decision 9: iOS PWA 元数据 -- `appleWebApp` capable + default status bar

**选择**：`generateMetadata()` 新增 `appleWebApp: { capable: true, title: siteConfig.siteTitle, statusBarStyle: 'default' }`。

**理由**：现有 `app/apple-icon.png` 只处理 `apple-touch-icon`（主屏图标），iOS standalone App 还需要 `apple-mobile-web-app-capable` + `apple-mobile-web-app-title` meta 标签。Next.js `appleWebApp` 元数据自动生成这些标签。`statusBarStyle: 'default'` 最安全（保留默认状态栏背景+文字色）。零额外文件，加几行到 `generateMetadata`。

**备选方案**：

- 不设置 -- iOS 安装后仍是 Safari chrome 包裹，体验降级
- A + `startupImage` -- 加启动闪屏图，需额外图片资产，MVP 过度
- `statusBarStyle: 'black-translucent'` -- 透明状态栏，内容延伸到状态栏下，需布局调整

### Decision 10: 构建集成 -- 手动 `pnpm generate-pwa-icons`

**选择**：`package.json` 新增 `generate-pwa-icons` script，手动按需运行，不加 `prebuild` 钩子。

**理由**：logo 几乎不变，生成文件提交 git，Vercel 构建时文件已存在，无需运行脚本。`prebuild` 增加每次构建时间（~1-2s），而 logo 变更频率极低。

**备选方案**：

- `prebuild` 钩子 -- 每次 `pnpm build` 前自动重跑，源图未变时输出相同，安全但略浪费
- 两者都有 -- 手动 + prebuild 兜底

## Risks / Trade-offs

- **[风险] no-op SW 无离线能力**：断网时全页刷新仍失败（软导航靠浏览器 HTTP 缓存）。**缓解**：离线是明确非目标，用户诉求仅"桌面快捷打开"。

- **[风险] `sharp` 原生二进制跨平台**：`sharp` 依赖平台原生二进制（`@img/sharp-win32-x64` 已在 store）。Vercel 构建环境是 Linux，`pnpm install` 会自动拉取 `@img/sharp-linux-x64`。**缓解**：`sharp` 是 devDependency，但生成文件已提交 git，Vercel 构建不需要运行脚本，所以即使 sharp 二进制在 Vercel 不可用也不影响。

- **[风险] manifest oklch 颜色兼容性**：Android 闪屏渲染器可能不解析 oklch。**缓解**：所有颜色已转换为 sRGB hex（`#f4f5f6` / `#050606` / `#3d91cf`）。

- **[风险] dev 模式 SW 干扰**：dev 下 SW 可能缓存旧资源导致调试混乱。**缓解**：注册组件加 `process.env.NODE_ENV === 'production'` 守卫，仅生产注册。

- **[权衡] 生成文件提交 git**：`public/icon-*.png` 进版本库。**权衡**：Vercel 构建不依赖脚本，部署可靠；源图变更时重跑脚本并提交新文件，git diff 可追溯。

- **[权衡] 不做自定义安装提示**：可发现性略低。**权衡**：个人博客 MVP，浏览器原生提示足够，iOS 不支持 `beforeinstallprompt`，后续可补。

- **[权衡] 单 manifest 不分语言**：`lang` 字段不精确。**权衡**：`start_url: '/'` + `proxy.ts` 已做语言跳转，2 语言博客不值得多 manifest。

- **[权衡] 源图 1.1MB 偏大**：`app/icon.png` 1.1MB 是既有问题。**权衡**：本次不动（Non-Goal），sharp 输出的 192/512 PNG 会小得多（测试 512 maskable 仅 157KB）。

## Migration Plan

本次变更为纯新增功能，无数据迁移、无 URL 变更、无破坏性改动：

1. 在 `add-pwa` 分支完成所有实现
2. 运行 `pnpm generate-pwa-icons` 生成 PWA 图标并提交 git
3. `pnpm format-lint` + `pnpm build` 验证
4. 本地 `pnpm start` + DevTools Application 面板验证 manifest/SW/icons
5. Lighthouse PWA audit 验证 "Installable" 通过
6. 合并 `add-pwa` 至 `main`，Vercel 自动部署
7. 生产环境验证安装提示

**回滚策略**：若 PWA 功能导致问题，删除新增文件、还原 `app/[lang]/layout.tsx` / `next.config.ts` / `package.json` 改动即可，无副作用（no-op SW 不缓存任何资源，移除后浏览器自然降级）。

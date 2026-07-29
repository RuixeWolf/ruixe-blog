## 1. 依赖安装

- [x] 1.1 安装 `@giscus/react` 依赖（`pnpm add @giscus/react`），确认与 React 19 兼容（`pnpm build` 无错误）

## 2. Giscus 配置（content/site.yaml + lib/site-config.ts）

- [x] 2.1 在 `content/site.yaml` 追加 `giscus` 块：`repo: RuixeWolf/ruixe-blog`、`repoId: R_kgDOTes-7w`、`category: Comments`、`categoryId: DIC_kwDOTes-784DCN33`、`mapping: pathname`、`reactionsEnabled: 1`、`inputPosition: top`、`strict: 0`、`emitMetadata: 0`
- [x] 2.2 在 `lib/site-config.ts` 新增 `GiscusConfig` 接口（`repo`、`repoId`、`category`、`categoryId`、`mapping`、`reactionsEnabled`、`inputPosition`、`strict`、`emitMetadata` 字段），并 `export` 供 `Comments` 组件 `import type` 使用
- [x] 2.3 在 `SiteConfigRaw` 与 `SiteConfig` 接口新增 `giscus: GiscusConfig` 字段
- [x] 2.4 扩展 `validateSiteConfig`：校验 `giscus` 块存在且为对象；`repo`/`repoId`/`category`/`categoryId`/`mapping` 为非空字符串；`reactionsEnabled`/`strict`/`emitMetadata` 为 `0` 或 `1`；`inputPosition` 为 `top` 或 `bottom`；非法时抛错（错误消息含字段名与文件路径）
- [x] 2.5 确认 `loadSiteConfig` 将 `raw.giscus` 透传至 `siteConfig.giscus`（`...raw` 展开已覆盖，验证无误）

## 3. 评论客户端组件（components/posts/Comments.tsx）

- [x] 3.1 新建 `components/posts/Comments.tsx`，标记 `'use client'`
- [x] 3.2 定义 props 接口：`{ config: GiscusConfig; locale: string }`（`GiscusConfig` 通过 `import type` 从 `@/lib/site-config` 引入，编译期擦除）
- [x] 3.3 实现 locale -> Giscus lang 映射（`zh`->`zh-CN`、`en`->`en`），未知 locale 回退 `en`
- [x] 3.4 实现 resolvedTheme -> Giscus 主题映射（`light`->`light`、`dark`->`dark_dimmed`），通过 `useTheme()` 读取 `resolvedTheme`；`resolvedTheme` 未就绪时（`undefined`）使用 `light` 作为初始 `theme` prop
- [x] 3.5 渲染 `<Giscus>`，传入 `repo`/`repoId`/`category`/`categoryId`/`mapping`/`reactionsEnabled`/`inputPosition`/`strict`/`emitMetadata`（来自 `config`）、`theme`（初始映射值）、`lang`（映射值）、`loading="lazy"`
- [x] 3.6 实现 postMessage 主题同步：`useEffect` 依赖 `theme`（由 `resolvedTheme` 映射而来）；通过 `document.querySelector('giscus-widget')?.shadowRoot?.querySelector('iframe')` 获取 Giscus iframe（`@giscus/react` v3 渲染 `<giscus-widget>` 自定义元素，iframe 在其 shadow DOM 内）；`contentWindow` 非空时 `postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app')`
- [x] 3.7 渲染评论区标题（使用 `useTranslations('Comment')` 读取 `Comment.Title`）与懒加载占位（`Comment.Loading`），包裹于与文章正文一致的容器样式中
- [x] 3.8 验证 React Compiler 友好（无未处理的 ref 副作用、`useEffect` 依赖完整）

## 4. PostLayout 集成

- [x] 4.1 在 `components/posts/PostLayout.tsx` import `Comments` 组件与 `siteConfig`
- [x] 4.2 在 `<article>` 元素之后渲染 `<Comments config={siteConfig.giscus} locale={locale} />`（`locale` 为 `PostLayout` 已有的 prop/参数）
- [x] 4.3 验证 `PostLayout` 仍为 Server Component（未引入 `'use client'` 或客户端 API）

## 5. i18n 文案

- [x] 5.1 在 `i18n/messages/zh.json` 新增 `Comment` 命名空间：`Title`（"评论"）、`Loading`（"加载评论中..."）
- [x] 5.2 在 `i18n/messages/en.json` 新增 `Comment` 命名空间：`Title`（"Comments"）、`Loading`（"Loading comments..."）

## 6. 格式化、构建与本地验证

- [x] 6.1 运行 `pnpm format-lint`（Prettier + ESLint），修复所有问题；确认 `lib/site-config.ts` import 排序符合 `@ianvs/prettier-plugin-sort-imports` 规则
- [x] 6.2 运行 `pnpm build`，确认无类型错误、无构建失败；确认文章详情页仍为 SSG（`○` 或 `ƒ` 标记未因 Giscus 变为动态）
- [x] 6.3 启动 `pnpm dev`，访问任一文章详情页（如 `/zh/posts/hello-world`），验证：评论区在正文后渲染、懒加载（首屏不请求 giscus.app）、主题切换平滑（iframe 不重载、滚动位置保留）、locale 切换评论 UI 语言变化、中英文版文章评论区独立
- [x] 6.4 验证 `siteConfig.giscus` 校验 fail-fast：临时删除 `content/site.yaml` 的 `giscus` 块或某必填字段，确认 dev server 报错且错误消息明确；还原配置

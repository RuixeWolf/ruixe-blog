## 1. R2 域名白名单配置

- [x] 1.1 在 `next.config.ts` 的 `nextConfig.images.remotePatterns` 数组中追加 `{ protocol: 'https', hostname: 'blog-assets.ruixe.net' }`，保留既有 `{ protocol: 'https', hostname: 'placehold.co' }` 条目
- [x] 1.2 更新 `images` 上方的注释，将 "Placeholder image service (phase 2 replaces with Cloudflare R2)" 改为反映 R2 已接入的说明（如 "Cloudflare R2 media + placehold.co for dev placeholders"）
- [x] 1.3 核验 `pnpm dev` 启动无错误，`pnpm build` 全路由保持 SSG（`●`，无 `ƒ`）
- [x] 1.4 在 `next.config.ts` 的 `nextConfig.images.deviceSizes` 中显式设置 `[640, 750, 828]`，覆盖 Next.js 默认值，使 `next/image` 生成的 srcset 不包含 1080-3840 超大档位（满足 `media-hosting` spec 的 srcset 宽度约束，见 design Decision 5）

## 2. MDXImage 组件优化

- [x] 2.1 在 `mdx-components.tsx` 的 `MDXImage` 组件中，将 `sizes="100vw"` 改为 `sizes="(max-width: 1023px) 100vw, 690px"`
- [x] 2.2 更新 `MDXImage` 组件的 JSDoc 注释，说明 `sizes` 值依据文章正文容器宽度计算（桌面端 `max-w-7xl - px-6 - Sidebar - gap-8 - TOC - gap-8 ≈ 688px`，取整 690px；移动端全宽）
- [x] 2.3 核验 `width={0} height={0}` + `style={{ width: '100%', height: 'auto' }}` 保持不变（Decision 3：接受未知尺寸图片 CLS 折中）
- [x] 2.4 确认 `MDXImage` 的 `import` 语句与 `next/image` 的 `Image`、`ImageProps` 类型引用未受影响

## 3. hello-world 占位图替换

- [x] 3.1 通过 PicGo 上传一张测试图片至 R2（如一张 Next.js logo 截图或项目截图），记录返回的 R2 URL（形如 `https://blog-assets.ruixe.net/2026-07/<filename>.png`）
- [x] 3.2 在 `content/posts/hello-world.zh.mdx` 中，将 `![占位图片](https://placehold.co/600x300?text=Placeholder+Image)` 替换为 `![<有意义的中文 alt>](<r2-url>)`
- [x] 3.3 在 `content/posts/hello-world.en.mdx` 中，将占位图 URL 同步替换为同一 R2 URL（`alt` 用英文描述）
- [x] 3.4 确认 MDX 源码中图片语法为标准 Markdown `![alt](url)`，无额外 `width`/`height` 属性（验证 PicGo 工作流零适配）

## 4. 验证与核验

- [x] 4.1 运行 `pnpm dev`，访问 `/zh/posts/hello-world`，打开浏览器 DevTools Network 面板，确认图片请求形如 `/_next/image?url=https%3A%2F%2Fblog-assets.ruixe.net%2F...&w=...&q=75`，状态 200，Content-Type 为 `image/webp` 或 `image/avif`（证明 `next/image` 优化管线生效）
- [x] 4.2 浏览器核验：检查渲染的 `<img>` 元素的 `srcset` 属性，确认最大宽度档位不超过 828px（`sizes="690px"` 后浏览器从 `deviceSizes` 选 640 或 750 档），不出现 1920/3840 等超大档位
- [x] 4.3 浏览器核验：移动端视口（<1024px）下图片全宽渲染，桌面端（≥1024px）下图片宽度不超过文章正文容器
- [x] 4.4 浏览器核验：确认 `placehold.co` 域名仍可用（临时在 MDX 插入 `![test](https://placehold.co/100x100)` 验证渲染正常后删除）
- [x] 4.5 运行 `pnpm build`，确认无类型错误、无构建失败，全路由保持 SSG（`●`），`.next` 构建输出无 `images` 相关警告
- [x] 4.6 运行 `pnpm format-lint`（Prettier + ESLint），确认通过；特别检查 `next.config.ts` 与 `mdx-components.tsx` 的 import 排序、Tailwind class 排序、无 semicolons
- [x] 4.7 核验 `proxy.ts` matcher 仍为纯字符串数组（未受本次改动影响，但项目已知坑点）
- [x] 4.8 核验 `package.json` 未引入新依赖（`next/image` 随 Next.js 内置，无新增包），`typescript`/`eslint` 版本未漂移

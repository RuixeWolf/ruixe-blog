## Why

业务功能开发阶段 2 要求"接入 CloudFlare R2 对象存储，实现文章内容添加图片等媒体内容"。外部工作流已就绪（R2 存储桶 `blog-assets.ruixe.net` 已创建、PicGo + Typora 粘贴自动上传已配置），但项目侧 `next.config.ts` 的 `images.remotePatterns` 仅注册了占位图服务 `placehold.co`，未包含 R2 域名 -- MDX 中写入 R2 图片 URL 会触发 `next/image` 的 400 Bad Request。此外，现有 `mdx-components.tsx` 的 `MDXImage` 组件使用 `width={0} height={0} sizes="100vw"`，存在布局位移（CLS）与 srcset 档位浪费问题，需趁此次接入一并修正。

## What Changes

- 在 `next.config.ts` 的 `images.remotePatterns` 注册 Cloudflare R2 公开访问域名 `blog-assets.ruixe.net`，使 `next/image` 接受该域名的远程图片 src
- 在 `next.config.ts` 的 `images.deviceSizes` 中显式设置 `[640, 750, 828]`，封顶 `next/image` 生成的 srcset 档位，避免为正文容器宽度有限的图片生成 1080-3840 超大档位（`sizes` 仅影响浏览器选档，不影响生成哪些档位）
- 优化 `mdx-components.tsx` 的 `MDXImage` 组件：将 `sizes` 从 `100vw` 调整为反映文章正文容器真实宽度的响应式声明（如 `(max-width: 768px) 100vw, 720px`），减少不必要的大尺寸 srcset 档位生成，降低 Vercel 图片优化配额消耗
- 缓解 `MDXImage` 的 CLS（累积布局位移）：通过 `style={{ width: '100%', height: 'auto' }}` 配合容器约束，或为 `next/image` 提供合理的默认宽高比行为
- 更新 `content/posts/hello-world.zh.mdx` 与 `hello-world.en.mdx` 中的占位图片：将 `placehold.co` 替换为 R2 真实图片 URL，验证完整管线
- 保留 `placehold.co` 在 `remotePatterns` 中（占位图在开发/测试场景仍可能用到），或评估移除

## Capabilities

### New Capabilities

- `media-hosting`: Cloudflare R2 远程图片接入 `next/image` 优化管线，包括 R2 域名白名单配置、MDX 图片组件的响应式尺寸与 CLS 处理、文章正文容器宽度感知的 srcset 生成策略

### Modified Capabilities

<!-- 无。现有 `mdx-content` spec 的"全局 MDX 组件映射"要求（img -> next/image）不变，本次仅细化远程图片的渲染行为，属新增能力范畴。 -->

## Impact

- **代码**：`next.config.ts`（`images.remotePatterns` 数组）、`mdx-components.tsx`（`MDXImage` 组件 `sizes` 与尺寸处理）
- **内容**：`content/posts/hello-world.{zh,en}.mdx` 占位图片 URL 更新
- **依赖**：无新增依赖（`next/image` 已随 Next.js 内置，`mdx-components.tsx` 已 import）
- **构建与部署**：不影响 SSG，全路由保持 `●` 静态；`images.remotePatterns` 是构建期配置，不引入运行时动态行为
- **运行时成本**：启用 Vercel 图片优化，Hobby 档每月 1000 次免费优化配额；每张独特图片首次请求按 `(url, width, quality)` 组合消耗配额，缓存后重复请求不计。个人博客配图量预期不会超限
- **外部工作流**：PicGo + Typora 的粘贴上传与 markdown 输出零适配，`![alt](https://blog-assets.ruixe.net/...)` 直接可用

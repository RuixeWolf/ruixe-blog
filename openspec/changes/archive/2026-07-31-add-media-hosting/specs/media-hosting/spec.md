## Purpose

定义 Ruixe Blog 的远程媒体（图片）接入能力，使文章作者可通过标准 Markdown 图片语法直接引用 Cloudflare R2 托管的图片资源，图片经 `next/image` 优化管线渲染（格式转换、响应式 srcset、懒加载），并保证加载时不产生显著布局位移。

## ADDED Requirements

### Requirement: R2 图片域名白名单

系统 SHALL 在 `next.config.ts` 的 `images.remotePatterns` 中注册 Cloudflare R2 公开访问域名 `blog-assets.ruixe.net`，使 `next/image` 接受以 `https://blog-assets.ruixe.net/` 为前缀的远程图片 `src`。未在 `remotePatterns` 中注册的域名 MUST 被 `next/image` 拒绝（返回 400 Bad Request），防止未授权域名消耗图片优化配额或引发 SSRF 风险。`remotePatterns` 配置 MUST 同时保留既有占位图服务域名 `placehold.co`，以支持开发与测试场景的占位图渲染。

#### Scenario: R2 图片正常经优化管线渲染

- **WHEN** MDX 内容含 `![alt](https://blog-assets.ruixe.net/2026-07/foo.png)`
- **THEN** 图片经 `next/image` 优化管线渲染，浏览器请求 `/_next/image?url=<encoded-r2-url>&w=<width>&q=75`，服务端从 R2 拉取原图并返回优化后（WebP/AVIF）的图片

#### Scenario: 未注册域名被拒绝

- **WHEN** MDX 内容含 `![alt](https://evil.example.com/foo.png)` 且 `evil.example.com` 未在 `remotePatterns` 中注册
- **THEN** `next/image` 返回 400 Bad Request，图片不渲染，不消耗优化配额

#### Scenario: 既有占位图域名保留

- **WHEN** MDX 内容含 `![alt](https://placehold.co/600x300)`
- **THEN** 占位图仍经 `next/image` 正常渲染，`placehold.co` 域名保留在 `remotePatterns` 中

### Requirement: PicGo 与 Typora 工作流零适配

系统 SHALL 接受 Typora + PicGo 粘贴上传工作流输出的标准 Markdown 图片语法 `![<filename>](<r2-url>)`，无需作者手动添加 `width`/`height`/`sizes` 等属性。MDX 渲染管线 MUST 将 `img` 元素经 `mdx-components.tsx` 映射至 `next/image` 的 `<Image>` 组件（此映射由 `mdx-content` 能力定义），本能力仅需保证 R2 URL 通过域名白名单校验。

#### Scenario: PicGo 输出的图片语法直接可用

- **WHEN** 作者在 Typora 中粘贴图片，PicGo 自动上传至 R2 并插入 `![image-20260728104935117](https://blog-assets.ruixe.net/2026-07/28104936420-image-20260728104935117.png)`
- **THEN** MDX 渲染时该图片经 `next/image` 优化管线正常渲染，无需作者编辑 MDX 源码补充尺寸或属性

### Requirement: 文章正文容器宽度感知的 srcset

系统 SHALL 为 MDX 中的远程图片生成与文章正文容器实际宽度匹配的响应式 srcset，而非按全视口宽度（`100vw`）生成。`<Image>` 组件的 `sizes` 属性 MUST 反映文章正文容器的响应式宽度约束：移动端（视口宽度小于容器断点）使用 `100vw` 保证全宽渲染，桌面端（视口宽度达到或超过容器断点）使用文章正文容器的最大宽度（约 `720px`）。此约束 MUST 降低生成的 srcset 最大宽度档位，避免为宽度有限的正文容器生成 3840px 等超大档位，减少 Vercel 图片优化配额消耗与移动端带宽浪费。

#### Scenario: 桌面端 srcset 受容器宽度约束

- **WHEN** 桌面端浏览器（视口宽度 ≥ 1024px）渲染文章中的 R2 图片
- **THEN** `next/image` 生成的 `srcset` 中最大宽度档位不超过文章正文容器宽度对应的需求，不生成 `3840` 等超大档位

#### Scenario: 移动端全宽渲染

- **WHEN** 移动端浏览器（视口宽度 < 1024px）渲染文章中的 R2 图片
- **THEN** 图片以 `100vw` 宽度渲染，`srcset` 包含匹配移动端设备宽度（如 `640`、`750`）的档位

### Requirement: 图片布局位移缓解

系统 SHALL 采取措施缓解 MDX 中的远程图片加载产生的累积布局位移（Cumulative Layout Shift, CLS）。对于已知原始尺寸的图片（如作者手动在 MDX 中标注 `width`/`height`），系统 MUST 通过 `next/image` 的 `width`/`height` 属性为浏览器提供宽高比以预留空间。对于 PicGo 工作流输出的未知尺寸远程图片，系统 SHOULD 通过 `sizes` 属性与响应式容器约束降低 CLS 影响，但承认此类图片在加载完成前无法精确预留高度，仍会产生一定的 CLS（这是不引入构建期图片尺寸抓取插件前提下的已知折中）。

#### Scenario: 已知尺寸的图片零 CLS

- **WHEN** MDX 含一张图片且作者通过某种方式提供了原始 `width`/`height`（如静态导入或显式属性）
- **THEN** 浏览器在图片加载前即根据宽高比预留空间，图片加载完成时下方内容不跳动，CLS 贡献为 0

#### Scenario: 未知尺寸的远程图片 CLS 可控

- **WHEN** MDX 含一张 R2 图片，其 MDX 源码未提供 `width`/`height` 属性（PicGo 输出场景）
- **THEN** 系统通过 `sizes` 约束与懒加载（`loading="lazy"`）降低 CLS 影响，但承认图片加载完成时仍会有一定的高度跳变（已知折中，非零 CLS）

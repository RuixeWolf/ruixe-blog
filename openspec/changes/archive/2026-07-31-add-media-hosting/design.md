## Context

项目已通过 `mdx-components.tsx` 将 MDX `img` 映射至 `next/image`（见 `mdx-content` spec 的"全局 MDX 组件映射"要求），但存在两个问题：

1. `next.config.ts` 的 `images.remotePatterns` 仅注册 `placehold.co`，未包含 R2 域名 `blog-assets.ruixe.net`，导致 MDX 中写入 R2 URL 会触发 `next/image` 400 错误
2. 现有 `MDXImage` 组件使用 `sizes="100vw"`，按全视口宽度生成 srcset 档位（最大 3840px），而文章正文容器在桌面端仅约 688px，产生大量不必要的大尺寸档位，浪费 Vercel 图片优化配额与带宽

外部工作流已就绪：R2 存储桶 `blog-assets.ruixe.net` 已创建，PicGo + Typora 粘贴自动上传已配置，输出标准 Markdown `![filename](r2-url)` 语法。本次改动仅需打通项目侧配置。

## Goals / Non-Goals

**Goals:**

- 在 `next.config.ts` 注册 R2 域名，使 `next/image` 接受 R2 远程图片
- 优化 `MDXImage` 的 `sizes` 属性，使 srcset 档位匹配文章正文容器实际宽度
- 用 R2 真实图片替换 `hello-world` 文章的 `placehold.co` 占位图，验证完整管线
- 保持全路由 SSG，不引入运行时动态行为

**Non-Goals:**

- **不**实现 Web 端图片上传（明确排除，永远通过 PicGo + Typora 桌面端）
- **不**引入构建期图片尺寸抓取插件（如 `rehype-img-size` 或自定义 remark 插件获取远程图片维度）-- 这会为每张图片增加构建期网络请求与 `image-size` 依赖，收益（零 CLS）不抵复杂度
- **不**实现图片格式转换 / 压缩的客户端逻辑 -- 格式优化由 `next/image` 运行时处理
- **不**将 R2 域名外部化至 `content/site.yaml` -- `remotePatterns` 是构建期配置，域名变更需重新部署，外部化无收益
- **不**移除 `placehold.co` -- 保留用于开发与测试场景的占位图

## Decisions

### Decision 1: R2 域名硬编码于 `next.config.ts`

**选择**：在 `next.config.ts` 的 `images.remotePatterns` 数组中直接追加 `{ protocol: 'https', hostname: 'blog-assets.ruixe.net' }`。

**理由**：`remotePatterns` 是 Next.js 构建期配置，修改后需重新构建部署。R2 域名是静态基础设施配置（存储桶创建后基本不变），与 `content/site.yaml` 中"可编辑的站点身份配置"（GitHub 用户名、站点标题等）性质不同。外部化至 YAML 会让 `next.config.ts` 在构建期读取 YAML 文件，引入不必要的文件 I/O 依赖，且域名变更仍需重新部署，外部化不改变这一事实。

**备选**：将域名放入 `content/site.yaml` 新增 `media.r2Domain` 字段，`next.config.ts` 构建期读取。**否决**：增加配置层间接性，无实际收益。

### Decision 2: `MDXImage` 的 `sizes` 值

**选择**：将 `sizes` 从 `"100vw"` 改为 `"(max-width: 1023px) 100vw, 690px"`。

**理由**：

- 桌面端（`lg` 断点 1024px 及以上）文章正文容器宽度计算：`max-w-7xl (1280px) - px-6 (48px) - Sidebar (256px) - gap-8 (32px) - TOC (224px) - gap-8 (32px) ≈ 688px`，取整 `690px`
- 移动端（<1024px）Sidebar 隐藏、TOC 折叠进 Accordion，文章正文容器接近全视口宽度，用 `100vw`
- `next/image` 的 `deviceSizes` 默认为 `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`。`sizes="100vw"` 时，浏览器按视口宽度选档，最坏会请求 3840px 档。改为 `690px` 后，浏览器从 `deviceSizes` 中选不超过 690px 的最大档（即 640px），大幅降低优化配额消耗与带宽。配合 Decision 5 将 `deviceSizes` 封顶至 `[640, 750, 828]`，srcset 本身不再生成 1080-3840 档位，`src` 回退也从 `w=3840` 降至 `w=828`，满足 `media-hosting` spec 的 srcset 宽度约束
- 断点用 `1023px` 而非 `1024px`，与 Tailwind `lg:` 前缀语义一致（`lg:` 生效于 ≥1024px，故 `<1024px` 即 `≤1023px`）

**备选 A**：`sizes="(max-width: 768px) 100vw, 720px"`（用 `md` 断点）。**否决**：Sidebar 在 `lg` (1024px) 才出现，768-1023px 区间文章正文仍是全宽，不应在此区间限制为 720px。

**备选 B**：用 `calc()` 精确计算 `(max-width: 1279px) calc(100vw - 48px - 256px - 32px - 224px - 32px), 690px`。**否决**：过度复杂，`sizes` 只是浏览器选档提示，略宽于实际不会导致质量问题，只会略增配额。

### Decision 3: CLS 处理策略 -- 接受未知尺寸图片的折中

**选择**：保留 `MDXImage` 的 `width={0} height={0}` + `style={{ width: '100%', height: 'auto' }}` 模式，仅改进 `sizes`。不为 PicGo 输出的未知尺寸远程图片引入零 CLS 方案。

**理由**：

- PicGo + Typora 工作流输出的 Markdown 不含 `width`/`height` 元数据，`next/image` 无法获知图片宽高比
- 不引入 `width`/`height` 时，浏览器在图片加载前无法预留高度，加载完成时下方内容会跳变 -- 这是已知 CLS
- 零 CLS 的唯一可靠途径是构建期抓取远程图片维度（remark/rehype 插件 + `image-size` 包），但会为每张图片增加构建期 HTTP 请求与依赖，与"文件驱动、低复杂度"架构不一致
- `loading="lazy"`（`next/image` 默认）使首屏外的图片延迟加载，CLS 影响主要在用户滚动到图片时才发生，对首屏 LCP 无影响
- 个人博客配图量有限，CLS 的实际用户体验影响可接受

**备选 A**：用 `fill` + 容器 `aspect-ratio: 16/9` + `object-fit: contain`。**否决**：截图宽高比不固定（4:3、16:9、1:1 均常见），固定 `aspect-ratio` 会导致 letterboxing（留黑边）或裁切，视觉比 CLS 更差。

**备选 B**：构建期用 `rehype-img-size` 抓取远程图片维度。**否决**：增加构建期网络请求（每张图一次 HEAD/GET）、新增 `image-size` 依赖、构建变慢，收益（零 CLS）不抵复杂度。

### Decision 4: `hello-world` 占位图替换

**选择**：上传一张小尺寸测试图片至 R2（如 `blog-assets.ruixe.net/2026-07/hello-world-cover.png`），将 `hello-world.{zh,en}.mdx` 中的 `placehold.co` 占位图 URL 替换为该 R2 URL，验证完整管线（PicGo 上传 -> R2 存储 -> MDX 引用 -> `next/image` 优化 -> 浏览器渲染）。

**理由**：`placehold.co` 占位图无法验证 R2 域名白名单与优化管线是否真正打通。用 R2 真实图片替换后，`pnpm dev` 与 `pnpm build` 的渲染结果可直接证明配置生效。

**备选**：保留 `placehold.co`，另写一篇测试文章引用 R2 图片。**否决**：`hello-world` 是唯一已有文章，替换其占位图最简单，且 `placehold.co` 域名仍保留在 `remotePatterns` 中供未来开发使用。

### Decision 5: 封顶 `images.deviceSizes` 至 `[640, 750, 828]`

**选择**：在 `next.config.ts` 的 `images.deviceSizes` 中显式设置 `[640, 750, 828]`，覆盖 Next.js 默认值 `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`。

**理由**：

- Decision 2 的 `sizes` 属性仅影响浏览器从 srcset 中**选**哪个档位，不影响 `next/image` **生成**哪些档位。默认 `deviceSizes` 下，`next/image` 仍会为每张图片生成包含 1080/1200/1920/2048/3840 的完整 srcset，且 `src` 回退属性指向 `w=3840`
- `media-hosting` spec 的 Requirement "文章正文容器宽度感知的 srcset" 要求 srcset **不生成** 3840 等超大档位。仅靠 `sizes` 无法满足此 MUST，必须封顶 `deviceSizes`
- 文章正文容器在桌面端约 690px，移动端至多 1023px 视口宽度。`[640, 750, 828]` 覆盖：640 档服务小屏手机，750 档服务大屏手机/小平板，828 档服务平板至 1023px 视口。桌面端浏览器按 `sizes="690px"` 选 640 档（略小于 690，视觉无损），移动端按 `100vw` 选 640/750/828 档
- 封顶后 srcset 最大档位为 828，`src` 回退属性指向 `w=828`，彻底消除 3840 档位的配额消耗与带宽浪费

**备选 A**：保持默认 `deviceSizes`，仅依赖 `sizes` 引导浏览器选档。**否决**：无法满足 spec 的 srcset 生成约束，且 `src` 回退仍指向 3840。

**备选 B**：进一步收窄至 `[640, 750]`。**否决**：平板视口（768-1023px）会强制选 750 档，略低于视口宽度，可能出现轻微模糊。

## Risks / Trade-offs

- **[Vercel 图片优化配额超限]** -> Hobby 档每月 1000 次免费优化。每张独特 `(url, width, quality)` 组合首次请求消耗 1 次配额，缓存后重复请求不计。`sizes` 改进后每张图仅生成 1-2 个档位（640px 档 + 可能的 750px 档），10 篇文章 × 每篇 5 张图 × 2 档 = 100 次配额，远低于上限。若未来配额紧张，可考虑切到方案 B（`unoptimized: true`，R2 直连）或升级 Vercel Pro。

- **[R2 域名变更需重新部署]** -> `remotePatterns` 是构建期配置，域名变更需修改 `next.config.ts` 并重新构建。这是 Next.js 的固有限制，非本设计引入。R2 存储桶域名稳定，变更概率极低。

- **[未知尺寸图片的 CLS]** -> PicGo 输出的图片无尺寸元数据，加载时会产生 CLS。这是 Decision 3 的已知折中。若未来 CLS 成为问题（如 Lighthouse 评分下降），可再评估构建期维度抓取方案。

- **[R2 存储桶公开访问权限]** -> R2 存储桶需配置为公开访问（`blog-assets.ruixe.net` 自定义域名或 R2 公开 URL）。这是 R2 侧配置，非项目代码范畴。若存储桶权限错误，`next/image` 优化时会从 R2 拉取失败，返回错误图片。

## Migration Plan

1. 在 `next.config.ts` 的 `images.remotePatterns` 追加 R2 域名
2. 修改 `mdx-components.tsx` 的 `MDXImage` 组件 `sizes` 值
3. 上传测试图片至 R2，更新 `hello-world.{zh,en}.mdx` 占位图 URL
4. `pnpm dev` 验证 R2 图片正常渲染（浏览器 Network 面板看到 `/_next/image?url=...blog-assets.ruixe.net...` 请求）
5. `pnpm build` 确认全路由保持 SSG，无构建警告
6. `pnpm format-lint` 通过

**回滚**：`git revert` 本次提交即可，无数据库迁移或环境变量变更。

## Open Questions

- **R2 测试图片的文件名与路径约定**：PicGo 默认用时间戳命名（如 `28104936420-image-20260728104935117.png`）。是否需要在 design 中约定 R2 的目录结构（如按 `YYYY-MM/` 分目录）？这属于内容创作工作流约定，不影响项目代码，留待作者自行决定，本设计不强制。

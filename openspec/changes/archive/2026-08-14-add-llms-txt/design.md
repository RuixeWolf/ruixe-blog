## Context

博客已有成熟的"构建时静态生成 + Route Handler"模式（RSS feed via `app/[lang]/feed.xml/route.ts`、sitemap via `app/sitemap.ts`、robots via `app/robots.ts`），以及 `lib/posts.ts` 中 `PostMeta.content` 字段（frontmatter 剥离后的原始 Markdown 正文）。llms.txt 功能完全复用这些既有资产，不引入新依赖。

关键技术约束已通过源码验证：Next.js 16 的 `getSegmentParam()` 要求动态段文件夹名以 `]` 结尾，因此 `app/[lang]/posts/[slug].md/route.ts`（`[slug].md` 以 `d` 结尾）会被当作静态字面量段，不可行。llms.txt v2 规范为"无文件名 URL"推荐追加 `index.md`，采用 `app/[lang]/posts/[slug]/index.md/route.ts` 结构（`[slug]` 动态段 + `index.md` 静态子段）既符合规范又避开路由限制。

## Goals / Non-Goals

**Goals:**

- 让 LLM/Agent 通过 `/llms.txt` 发现全站文章并按需获取纯净 Markdown 正文
- 每篇文章提供 `.md` 版本，构建时静态预渲染，不引入动态渲染
- 文章详情页提供人类可见的 Markdown 链接入口（查看 + 复制）
- 完全复用现有 `lib/` 模块与 UI 模式，不引入新 npm 依赖

**Non-Goals:**

- 不生成 `llms-full.txt`（v1 遗留的全量拼接文件，v2 规范已转向"索引 + 按需获取"）
- 不为列表页（首页、分类页、标签页）、关于页生成 `.md` 版本（这些页面对 LLM 价值有限，llms.txt 本身已是更好的索引）
- 不在 HTML `<head>` 中添加 `rel="describedby"` 或 `rel="alternate" type="text/markdown"` link 标签（规范的可发现性增强，非必需；llms.txt 存在于 `/llms.txt` 即可被发现，类似 robots.txt）
- 不修改现有 `proxy.ts` matcher（`/llms.txt` 与 `.md` 路径含 `.`，已被 `.*\\..*` 正则排除）

## Decisions

### Decision 1: 文章 Markdown 版本 URL 格式 -- `/{locale}/posts/{slug}/index.md`

**选择**：在文章 HTML URL 后追加 `/index.md` 子路径，而非 `.md` 扩展名。

**理由**：llms.txt v2 规范原文为"URLs without file names should append `index.html.md` or `index.md`"。文章 URL `/{locale}/posts/{slug}` 无文件名，追加 `index.md` 是规范推荐格式。更关键的是，Next.js App Router 的 `getSegmentParam()` 要求动态段文件夹名以 `]` 结尾，`[slug].md` 会被当作静态字面量段（只匹配 URL 中的字面量 `[slug].md`），不可行。`[slug]/index.md` 结构中 `[slug]` 正确识别为动态段，`index.md` 作为静态子段字面量匹配。

**备选方案**：

- `[slug].md` 目录（不可行，上述路由限制）
- `next.config.ts` rewrite 将 `/:slug.md` 映射到内部路由（可行但增加配置复杂度，且 URL 不如 `index.md` 符合规范）

### Decision 2: llms.txt 单文件，按语言分节

**选择**：仅在根路径 `/llms.txt` 生成单一索引文件，内部按语言 H2 分节（`## 中文文章` / `## English Posts`）。

**理由**：规范说"文件覆盖其路径下的所有 URL"，根路径 `/llms.txt` 天然覆盖全站。2 个语言的个人博客，单文件按语言分节即可，Agent 一次获取全貌。每语言独立文件（`/{locale}/llms.txt`）是过度设计。

### Decision 3: llms.txt 内容语言为英文，文章标题保留原文

**选择**：llms.txt 的 H1、blockquote 摘要、H2 节标题、列表项描述用英文；文章标题保留 frontmatter 原文（中文文章标题用中文）。

**理由**：llms.txt 的受众是 LLM/Agent，英文是最高效的通用语言。文章标题保留原文让 Agent 知道每篇文章的实际语言，便于按需获取。

**备选方案**：

- 双语（中英文都写）-- 冗长，膨胀文件体积
- 全中文 -- 对中文 LLM 友好但限制通用性

### Decision 4: 文章 `.md` 版本返回 `PostMeta.content`，不重新组装 frontmatter

**选择**：文章 Markdown 版本路由直接返回 `PostMeta.content`（gray-matter 已剥离 frontmatter 的原始 Markdown 正文），不在响应中重新拼接 YAML frontmatter。

**理由**：`PostMeta.content` 已是现成的纯净 Markdown 正文，零成本复用。LLM 需要的是正文内容，frontmatter 元数据（title/description/dates）已在 llms.txt 索引与 HTML 页面的 JSON-LD 中提供，重复在 `.md` 中输出无意义且增加噪声。

### Decision 5: Markdown 链接按钮 -- 链接 + 复制双按钮

**选择**：文章详情页 header 标签行之后放置两个并排按钮：HeroUI `Link`（"查看原文"，`target="_blank"`，带 `ExternalLink` 图标 + 文字）+ HeroUI `Button`（"复制"，`isIconOnly`，`Copy`/`Check` 图标）。

**理由**：复用 `CodeBlock.tsx` 的剪贴板逻辑（`navigator.clipboard.writeText` + `copied` 状态 + 2 秒重置计时器 + Clipboard API 不可用静默失败）。链接按钮用 HeroUI `Link`（原生 `<a>`）而非 `next-intl/navigation` `Link`，因为 `.md` 是 Route Handler 提供的静态文件，非 App Router page，客户端导航不适用（与 `RssButton` 模式一致）。

**备选方案**：

- 单一复制按钮（丢失"直接访问"入口）
- URL 展示条 + 复制（信息量大但 URL 过长时布局难处理）
- 下拉菜单（过度设计，2 个操作不需要菜单）

### Decision 6: 按钮视觉样式 -- 低调文字按钮

**选择**：链接按钮用 `buttonVariants({ variant: 'tertiary', size: 'sm' })`，复制按钮用 `Button` + `isIconOnly` + `variant="tertiary"`。色调为 `text-muted`，hover 变 `text-foreground`。

**理由**：与既有元信息行交互一致（`RssButton` 也用 `buttonVariants`）。按钮是辅助功能，不应抢文章标题视觉重心。

### Decision 7: 不添加 HTML `<link>` 关联标签（MVP）

**选择**：不在页面 `<head>` 中添加 `rel="describedby"`（指向 llms.txt）或 `rel="alternate" type="text/markdown"`（指向 .md 版本）link 标签。

**理由**：llms.txt 只需存在于 `/llms.txt` 即可被发现（类似 robots.txt）。`<link>` 标签是规范的可发现性增强，非必需。Next.js metadata API 中 `rel="describedby"` 需要用 `other` 字段，实现时需验证，增加复杂度。MVP 先不做，后续如需可补充。

## Risks / Trade-offs

- **[风险] `index.md` URL 较长**：`/{locale}/posts/{slug}/index.md` 比 `/{locale}/posts/{slug}.md` 长。**缓解**：这是规范为"无文件名 URL"推荐的标准格式，且是避开 Next.js 路由限制的唯一可行方案。用户通过文章详情页按钮直接访问，无需手动输入 URL。

- **[风险] `.md` 版本中的图片引用指向 R2 远程 URL**：`PostMeta.content` 中的 `![](r2-url)` 指向 Cloudflare R2 图片。**缓解**：LLM 无法"看"图片，但能获取 URL 上下文，可接受。无需特殊处理。

- **[风险] 文章更新后 `.md` 与 HTML 不同步**：两者都从同一 `PostMeta.content` 读取，构建时预渲染，天然同步。无额外风险。

- **[权衡] 不提供 llms-full.txt**：部分用户可能希望一次性获取全量文章。**权衡**：v2 规范明确转向"索引 + 按需获取"，llms-full.txt 是 v1 遗留概念。文章增多后全量文件超出上下文窗口，不是规范方向。

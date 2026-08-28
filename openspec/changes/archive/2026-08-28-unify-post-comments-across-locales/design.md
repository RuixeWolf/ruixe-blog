# Design: unify-post-comments-across-locales

## Context

现状：Giscus 以 `mapping: pathname` 匹配 Discussion（giscus.app 加载时用 GitHub Discussions 搜索 API 按"标题包含页面 pathname"查找），`/zh/posts/foo` 与 `/en/posts/foo` 各自对应独立 Discussion。评论组件链路为 `PostLayout`（RSC）-> `Comments`（client，接收 `config` + `locale` props）-> `<Giscus>`。配置源为 `content/site.yaml` 的 `giscus` 块，经 `lib/site-config.ts` 校验后以 `GiscusConfig` 类型导出（`import type` 消费，编译期擦除）。

约束：`@giscus/react@^3.1.0` 的 `GiscusProps` 原生支持 `mapping: 'specific'`、`term?: string`、`strict?: '0' | '1'`（已核实 `node_modules/@giscus/react/dist/types.d.ts`），无需升级依赖。`content/*.yaml` 不在模块图内，改动后需重启 dev server（无 HMR）。仓库 Discussions 实况（2026-08 抓取）：`Comments` 分类下仅 2 条 Discussion - #19 `zh/posts/my-first-blog-website`（1 条真实评论，作者 XinzheGao）与 #7 `en/posts/hello-world`（0 评论，slug 已不存在的测试遗留）。

giscus 机制关键事实（官方 ADVANCED-USAGE.md）：所有 mapping 策略本质都是"按 Discussion 标题搜索"；`strict: '1'` 时改为计算 term 的 SHA-1 并在 Discussion **正文**中搜索该哈希，bot 新建 Discussion 时自动以 `<!-- sha1: <hash> -->` HTML 注释写入正文。

## Goals / Non-Goals

**Goals:**

- 同一 slug 的所有 locale 共享一个 Discussion（评论区跨语言）
- 匹配确定性：相似 slug 不误命中（开启 strict 哈希匹配）
- 存量唯一含评论的 Discussion（#19）无损迁移
- 配置回归防护：mapping 被 yaml 改回 pathname 时构建期 fail-fast

**Non-Goals:**

- 不处理 giscus backlink 的语言偏向（首评者 locale 的 URL 写入 Discussion 正文，纯 GitHub 侧溯源信息）
- 不改评论 UI 语言策略（`lang` 仍跟随访问者 locale）
- 不引入"改文章 slug"的工作流（现有流程只增删文章；slug 不可变性作为防御性约束写入 spec）
- 不做自动化 Discussion 迁移脚本（一次性手动操作，成本低于写脚本）

## Decisions

### D1: mapping 用 `specific` + `term = slug`（而非其他 giscus mapping 策略）

**选择**：`mapping: 'specific'`，`<Giscus term={meta.slug}>`。

**理由**：giscus 的候选策略中，`title`/`og:title` 依赖各 locale 不同的本地化标题，天然无法跨语言归一；`number` 需要维护 slug->Discussion 编号映射表且不支持首评自动建帖；`url` 与 `pathname` 同理按页面划分。`specific` 的 term 完全由站点代码控制，而本站 slug 天然跨 locale 唯一并稳定（`content/posts/{slug}.{lang}.mdx` 的文件名锚点），是唯一同时满足"跨语言共享 + 自动建帖"的选项。

**替代方案**：`number` 映射（精确但维护映射表、无自动建帖）；保留 `pathname` 并在 URL 层做 tricks（不可行 - giscus 读 iframe 所在页面真实 URL）。

### D2: term 取裸 slug（无前缀）

**选择**：`term = meta.slug`（如 `my-first-blog-website`），不加 `post:` 等前缀。

**理由**：giscus 搜索限定在 `Comments` 分类内（`categoryId` 已配置），撞词空间极小；裸 slug 让 Discussion 标题即文章名，GitHub 侧可读性最好，也使 `delete-post.mjs` 的 `discussions_q=<slug>` 搜索精确命中。

**替代方案**：带前缀 term（防御性更强，但牺牲可读性，收益不成立）。

### D3: 开启 `strict: '1'`（SHA-1 哈希匹配）

**选择**：`strict: '1'`。

**理由**：仓库存在高相似度 slug 对（`vercel-agent-browser-first-look` vs `vscode-agents-window-first-look`），strict=0 的 GitHub 模糊标题搜索有真实误命中风险（官方文档明示的失效场景）。strict=1 改为在正文搜 `SHA1(term)`，bot 建帖自动带哈希。代价是存量 Discussion 必须手动注入哈希（见迁移计划），一次性成本。

**替代方案**：strict=0（省去手动注哈希，但把正确性押在 GitHub 模糊搜索上，不可控）。

### D4: `GiscusConfig.mapping` 类型收紧为 `'specific'` 字面量

**选择**：`lib/site-config.ts` 中新增 `const GISCUS_MAPPING_VALUES = ['specific'] as const`（与现有 `GISCUS_FLAG_VALUES` 模式一致），接口字段 `mapping: 'specific'`，校验从 `assertNonEmptyString` 升级为 `assertOneOf`。

**理由**：本设计的组件层无条件传 `term`--若 yaml 的 mapping 被改回 `pathname`，giscus 会静默忽略 term，行为回退到按语言分裂且无任何报错。fail-fast 校验在模块求值期拦截这种静默回归。本地定义字面量联合（不从 `@giscus/react` import `Mapping`），保持 server-only 模块对客户端包零引用（`import type` 虽擦除，本地定义更干净、且语义上是"本站仅支持 specific"而非"giscus 全集"）。连带收益：`Comments.tsx` 中 `mapping as 'pathname'` 强转可删除。

**替代方案**：校验放宽为 giscus 全集 6 值（对齐上游类型，但失去回归防护）。

### D5: 存量迁移走手动 GitHub UI 操作（M1）

**选择**：三个有序步骤（详见迁移计划），全部 GitHub UI 手动完成，用户执行。

**理由**：实测存量仅 2 条 Discussion、1 条真实评论，合并/搬运的自动化脚本成本远超手动操作。#19 保留（改名 + 注哈希），#7 删除（0 评论的测试遗留孤儿）。

### D6: `delete-post.mjs` 提示文案纳入本次变更

**选择**：更新 `printGiscusHints` 文案：受影响的"讨论"从每 locale 一条改为一条标题为 slug 的共享 Discussion。

**理由**：新方案下删除文章后需 lock 的 Discussion 只有一条（旧方案两条），不改文案会误导后续删除操作。其 `discussions_q=<slug>` 搜索 URL 无需改动（新方案下反而更精确）。

## Risks / Trade-offs

- [strict=1 依赖正文哈希注释存在] -> 存量 #19 手动注入 `<!-- sha1: bed6968ea5cdf32f420fc2c15cfc620b6f9d7a86 -->`（值已算好）；bot 新建的帖自动带哈希。spec 已写入"哈希注释不得清理"约束，防后人误删。
- [迁移与部署顺序敏感] -> 先 GitHub 侧迁移、后代码部署；顺序颠倒会导致 strict=1 搜不到 #19 的哈希、首评另建新帖、既有评论被遗弃。已作为有序任务写入 tasks.md。
- [slug 不可变性成为硬依赖] -> 本站无改 slug 流程（只增删），风险为零；spec 中记录防御性约束（改 slug 需同步改 Discussion 标题 + 重注哈希）。
- [locale 切换时 iframe 重载] -> 与现状一致（lang prop 变化触发），term 不变故仍命中同一 Discussion，无新增风险。
- [backlink 语言偏向] -> 接受为已知权衡（见 Non-Goals），不影响评论功能本身。

## Migration Plan

**顺序强制：步骤 1-2（GitHub 侧，用户手动）必须先于步骤 3（代码部署）。**

1. **迁移 Discussion #19**（GitHub UI）：标题 `zh/posts/my-first-blog-website` -> `my-first-blog-website`；正文末尾追加 `<!-- sha1: bed6968ea5cdf32f420fc2c15cfc620b6f9d7a86 -->`（即 `sha1('my-first-blog-website')`，HTML 注释形式与 giscus bot 一致，正文不可见）。保留既有评论。
2. **删除孤儿 Discussion #7**（`en/posts/hello-world`，0 评论）：用户手动 delete。
3. **部署代码**（本变更的全部代码改动）。其余 3 篇文章无存量 Discussion，首次评论时由 bot 自动按新机制建帖（标题 = slug，正文自动含哈希）。

**回滚策略**：代码层回滚 = revert 合并 + `site.yaml` 恢复 `mapping: pathname` / `strict: '0'`（pathname 按 `/[lang]/posts/[slug]` 路径重新各自命中/建帖；#19 因已改名不再被 pathname 匹配，其评论需改回原标题或接受新建帖）。若迁移未部署即回滚，GitHub 侧操作可手动还原（标题改回、删掉哈希注释）。

**部署后验证协议**：

1. `/zh/posts/my-first-blog-website` 评论区显示既有评论（哈希命中 #19）
2. `/en/posts/my-first-blog-website` 显示同一条评论（跨语言共享达成，核心验收点）
3. 在无存量帖的文章（如 `/nginx-certbot-https`）任一 locale 首评 -> GitHub 新建标题为 slug 的 Discussion 且正文自动含哈希
4. GitHub 用 `discussions_q=my-first-blog-website` 搜索只命中一条
5. 切换 locale/主题：评论线程不变，主题 postMessage 照常生效

注意：本地验证需重启 dev server（`site.yaml` 不在模块图内，无 HMR）。

## Open Questions

（无 - 探索阶段已收敛全部决策：mapping 策略、term 格式、strict、迁移方式、UI 语言、校验收紧、孤儿处置、脚本文案、backlink 取舍均已定案。）

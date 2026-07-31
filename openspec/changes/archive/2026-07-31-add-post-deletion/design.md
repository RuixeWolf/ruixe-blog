## Context

当前博客采用文件驱动 MDX 架构，文章为 `content/posts/{slug}.{lang}.mdx` 文件。删除一篇文章意味着删除其所有 locale 变体的 MDX 文件，但旧 URL（`/[lang]/posts/<slug>`）会因 `generateStaticParams` 不再返回该 slug 而落入 `notFound()` 路径，产生 404 死链。Next.js 16 的 `redirects()`（见 Context7 `/vercel/next.js` 文档）支持在 `next.config.ts` 中声明异步函数返回 `{ source, destination, permanent }` 数组，其执行优先级高于页面 `notFound()` 与 `proxy.ts` middleware，适合作为已删文章旧 URL 的兜底机制。

项目已有约束：`yaml` 包（^2.9.0）已用于 `lib/site-config.ts` 与 `lib/taxonomy.ts`；Node 脚本应为 `.mjs` 文件（AGENTS.md 约定，避免 Windows 终端截断 `node -e` 一行命令）；`content/` 下的 YAML 文件不参与模块图，编辑后需重启 dev server（非 HMR）；`server-only` 包仅用于阻止 client bundle 引入，`next.config.ts` 不属于 client bundle。

## Goals / Non-Goals

**Goals:**

- 提供一条命令完成文章删除（删文件 + 登记重定向 + 提示锁定评论）
- 已删文章旧 URL 返回 308 永久重定向，不产生 404
- 零新依赖（复用 `yaml` 包与 Node 内置模块），零外部 API 调用，fresh clone 零配置
- 重定向清单自文档化（含 slug、删除日期、受影响 locale）
- 支持自定义重定向目标（内部路径含 `{lang}` 占位符、外部 URL），以覆盖搬迁场景
- 全路由保持 `● (SSG)`，不引入动态渲染

**Non-Goals:**

- 不自动锁定 Giscus Discussion（避免 GitHub GraphQL API 不确定性与 token 依赖；手动锁定作为额外防御层，308 重定向已阻断旧 URL 的新评论访问路径）
- 不支持单 locale 删除（文章始终整篇删除，所有 locale 变体同时移除）
- 不执行 `git rm` / `git commit`（脚本单一职责，Git 操作由用户完成）
- 不实现 410 Gone 状态码（需求明确要求 Redirect；410 需自定义 route handler，复杂度高且不传递链接权重，作未来优化）
- 不实现"墓碑页"（独立已删除提示页增加路由复杂度，列表页重定向已足够）
- 不处理 taxonomy ID 删除/修改的重定向（现有 `mdx-content` spec 已提及该需求，本变更不扩展至 taxonomy 层面）

## Decisions

### Decision 1: 重定向清单格式 — 语义化分组（格式 B）

**选择：** `content/redirects.yaml` 采用语义化分组格式，每条记录为 `{ slug, deletedAt, locales[], destination? }`，由 `next.config.ts` `redirects()` 读取后展开为 N 条 `{ source, destination, permanent }` 规则（N = locales 数量）。

**替代方案：** 扁平 redirect 数组（与 `redirects()` 返回值 1:1，每条直接写 `source: /zh/posts/hello-world`）。

**理由：** 语义化分组自文档化（`deletedAt` 留审计痕迹，`locales` 明确受影响范围），脚本追加时只需写一条记录而非 N 条，且 reader 展开逻辑极简（约 10 行）。扁平格式无元信息，维护时需人工推断 slug 与 locale。

### Decision 2: 默认重定向目标 + 可选 `--target` 覆盖

**选择：** 默认目标 `/{lang}/posts`（文章列表页）；`--target <destination>` 可选参数支持三类值：内部路径（如 `/{lang}/posts/other-slug`，含 `{lang}` 占位符）、无占位符内部路径（如 `/about`）、外部 URL（`http(s)://...`）。

**替代方案：** 固定目标无 `--target`（YAGNI，但搬迁场景需手动编辑 YAML）；墓碑页（增加路由）。

**理由：** 列表页是最相关的存活页面且已存在；`--target` 覆盖搬迁外链或合并到另一篇文章的场景；`{lang}` 占位符由 reader 替换，避免脚本为每个 locale 重复写目标。

### Decision 3: locale 范围由文件扫描得出，无硬编码

**选择：** 脚本扫描 `content/posts/` 下 `{slug}.*.mdx` 文件，从文件名提取 locale 列表；`redirects.yaml` 的 `locales` 字段记录扫描结果，reader 只为这些 locale 生成规则。

**替代方案：** 硬编码 `['zh', 'en']`（漂移风险）；为所有 `routing.locales` 生成规则（即便该 locale 无文件，产生无意义规则）。

**理由：** `.mjs` 脚本无法 import TypeScript 的 `i18n/routing.ts`；文件扫描天然正确，新增 locale 时脚本零改动。

### Decision 4: Giscus Discussion 手动锁定（策略 C）

**选择：** 脚本删除完成后打印 Discussions 分类链接、slug 搜索链接、受影响 pathname 与文章标题清单，提示用户在 GitHub UI 手动锁定。不调用 GitHub API，不要求 `GITHUB_TOKEN`。

**替代方案：** GraphQL `lockLockable` mutation 全自动（依赖 token，且 `mapping: pathname` 下 pathname->Discussion 映射存储方式不确定，训练数据不可靠）；Giscus API（内部接口，稳定性无保证）。

**理由：** 零 token 依赖保持 fresh clone 零配置；308 重定向已阻断旧 URL 的新评论访问路径，手动锁定是额外防御而非必需；避免 GraphQL 不确定性与 token 权限管理复杂度。

### Decision 5: 脚本为 `scripts/delete-post.mjs`（纯 JS + `yaml` 包）

**选择：** 纯 JavaScript `.mjs` 文件，使用 `yaml` 包（已装）解析/序列化 YAML，Node 内置 `node:fs`、`node:readline/promises`、`node:path`、`node:process` 处理 I/O 与 CLI 参数。

**替代方案：** `scripts/delete-post.ts` + `tsx` devDep（类型安全但增加依赖）；`node -e` 一行命令（Windows 终端截断长命令，AGENTS.md 已明确禁止）。

**理由：** AGENTS.md 约定 Node 脚本应为 `.mjs`；`yaml` 包已满足需求；零新依赖。

### Decision 6: 确认机制为 `readline` y/N + `--force`

**选择：** Node 内置 `readline/promises` 实现 y/N 提示，`--force` 跳过。

**替代方案：** `@inquirer/prompts`（更美观但增加依赖）。

**理由：** 单作者工具，零依赖优先；`readline` 足够。

### Decision 7: 仅整篇删除（不支持单 locale）

**选择：** 脚本始终删除该 slug 的所有 locale 文件，`redirects.yaml` 的 `locales` 记录全部受影响 locale。

**替代方案：** `--lang zh` 删单语言（需处理"另一 locale 仍工作"的复杂重定向逻辑）。

**理由：** 简化范围；单 locale 删除是边缘场景，可未来扩展。

### Decision 8: 尽力型事务性，写失败打印恢复指令

**选择：** 步骤顺序为校验 -> 确认 -> 删文件 -> 写重定向 -> 打印 Giscus 提示。删文件成功但写重定向失败时，脚本打印应追加的 YAML 片段供手动恢复，以非零退出码退出；不回滚已删文件。

**替代方案：** 事务性回滚（恢复已删文件，复杂且对个人博客不值得）。

**理由：** 写入失败罕见（多为权限或磁盘问题）；打印恢复指令足够；回滚增加复杂度。

### Decision 9: 308 永久重定向

**选择：** `redirects()` 返回 `permanent: true`，Next.js 默认 308 状态码。

**替代方案：** 410 Gone（显式告知搜索引擎内容已移除，需自定义 route handler，不传递链接权重）。

**理由：** 需求明确要求 Redirect；308 传递链接权重，SEO 友好；410 复杂度高，作未来优化。

### Decision 10: 支持 `--dry-run`

**选择：** `--dry-run` 打印完整执行计划（将删文件、将追加 YAML 记录、将显示 Giscus 提示），不写入，退出码 0。

**理由：** 删除是破坏性操作，预览成本低收益高。

### Decision 11: pnpm script `delete-post`

**选择：** `package.json` 新增 `"delete-post": "node scripts/delete-post.mjs"`。

**理由：** 一致性与可发现性；用户通过 `pnpm delete-post <slug>` 调用。

### Decision 12: `redirects()` 内联读取，不新建 `lib/redirects.ts`

**选择：** YAML 读取与展开逻辑直接内联进 `next.config.ts`（约 15 行），不新建 `lib/redirects.ts`。

**替代方案：** `lib/redirects.ts` 加 `import 'server-only'`（语义不准确，`next.config.ts` 不是 RSC；且 `server-only` 在 next.config 上下文无实际保护作用）。

**理由：** `next.config.ts` 是 Node 配置文件，不是 RSC，不需要 `server-only` 边界；内联避免模块解析复杂度（next.config 的模块解析行为与 app 代码不同，V1 验证点已标注）。

## Risks / Trade-offs

- **[风险] `next.config.ts` 内联 YAML 读取的模块解析** -> `next.config.ts` 的模块解析可能与 app 代码不同，`@/*` 别名或 `lib/` 导入可能失败。**缓解：** 逻辑内联进 `next.config.ts`，仅依赖 `yaml` 包（已是 dependency）与 `node:fs`/`node:path`；实现后用 `pnpm build` 核验。若 `yaml` 包导入失败，降级为内联 YAML 解析（正则）或改用 JSON 清单（`content/redirects.json`）。

- **[风险] Giscus `mapping: pathname` 下 Discussion 查找不确定** -> 手动锁定依赖用户能在 GitHub UI 找到对应 Discussion，但 pathname 映射下 Discussion 的 title 存储方式（页面标题 vs pathname 字符串）不确定。**缓解：** 脚本同时打印 slug 搜索链接与文章标题清单，覆盖两种可能；用户在 Discussions 页面搜索 slug 或标题即可定位。

- **[风险] 删文件成功但写 `redirects.yaml` 失败** -> 罕见但会导致旧 URL 无重定向兜底（仍命中 404）。**缓解：** 脚本打印应追加的 YAML 片段供手动恢复，非零退出码提示用户检查；不回滚已删文件（回滚复杂且无必要）。

- **[风险] `redirects.yaml` 手动编辑导致构建失败** -> 用户手动编辑 YAML 格式错误会使 `redirects()` 抛错，阻断构建。**缓解：** header 注释明确"请勿手动编辑条目"；`redirects()` 内 try/catch 在解析失败时打印警告并返回空数组（不阻断构建，但旧 URL 将命中 404）；构建错误信息指向 `content/redirects.yaml`。

- **[权衡] 308 vs 410** -> 308 传递链接权重但语义上"内容只是搬走了"，410 明确"内容已移除"但不传递权重且需自定义 route handler。选择 308 优先 SEO 友好度。

- **[权衡] 手动锁定 Giscus vs 自动锁定** -> 手动锁定依赖用户执行，可能遗漏；自动锁定消除遗漏但引入 token 依赖与 API 不确定性。选择手动锁定，靠 308 重定向作为阻断新评论的主要机制。

- **[权衡] 语义化 YAML vs 扁平数组** -> 语义化格式需 reader 展开（约 10 行逻辑），扁平格式直接 1:1 映射但无元信息。选择语义化优先可维护性。

## Migration Plan

1. **实现 `scripts/delete-post.mjs`** 并在 `package.json` 注册 `delete-post` script
2. **修改 `next.config.ts`** 新增 `async redirects()`，读取 `content/redirects.yaml`（不存在时返回空数组）
3. **验证**：`pnpm build` 确认全路由 `● (SSG)`；`pnpm dev` 下创建临时测试文章，运行 `pnpm delete-post <test-slug> --dry-run` 预览，再不带 `--dry-run` 执行删除，访问旧 URL 确认 308 重定向，`git checkout` 恢复测试文件
4. **回滚策略**：若 `redirects()` 导致构建失败，删除 `next.config.ts` 中的 `redirects()` 函数即可回滚（`content/redirects.yaml` 可保留，无消费者即无效）；脚本本身无副作用，删除 `scripts/delete-post.mjs` 与 `package.json` 的 script 即可移除

## Open Questions

无。所有决策在探索阶段已与用户确认：

- D2 `--target`：已确认添加（Decision 2）
- D4 Giscus 锁定：已确认手动提示（Decision 4）
- D7 单 locale 删除：已确认仅整篇删除（Decision 7）
- 其余决策按探索阶段倾向确认

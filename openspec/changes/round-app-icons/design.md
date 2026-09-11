# round-app-icons — Design

## Context

现状（详见 proposal.md 的 Why）：

- 五份图标工件全部为不透明全出血方形：`app/icon.png`（1184×1184，同时是生成脚本的输入源）、`app/apple-icon.png`（与前者字节相同）、`app/favicon.ico`（32×32 单帧、BMP 编码的一次性遗留产物）、`public/icon-192.png`、`public/icon-512.png`、`public/icon-512-maskable.png`（navy 底 + 80% 安全区）。
- 生成脚本 `scripts/generate-pwa-icons.mjs` 只读 `app/icon.png`、只写 `public/`，`favicon.ico` 游离于管线之外。
- Next.js 16 的文件约定会为 `favicon.ico`、`icon.png`、`apple-icon.png` 各注入一个 `<link>`（favicon 置首），href 携带内容哈希查询参数（缓存失效自动处理）；`sizes` 属性由 Next.js 按文件内容探测生成——实测 Turbopack 构建取 ICO **最大帧**尺寸，PNG 取实际尺寸。
- 平台约束：iOS 主屏遮罩自施加且透明背景合成黑底 → apple-icon 必须不透明方形；Android maskable 由启动器遮罩 → 必须全出血不透明。

探索阶段已完成的关键验证（内存干跑，未改文件）：

- `sharp` 官方 README 即采用「SVG `rect rx` + `composite({ blend: 'dest-in' })`」实现圆角遮罩。
- 实测：512px 遮罩后四角 alpha=0、边缘过渡像素 727 个；16px（4× 超采样）ASCII alpha 图圆角平滑；1184px 输出 1,026,606 字节。
- ICO 手工容器干跑：3 帧（32/16/48）共 7,173 字节，经 Next.js 内置 `image-size` 解析为 `width:32, images:[32,16,48]`；两次构建 SHA256 一致。

## Goals / Non-Goals

**Goals:**

- `favicon.ico`、`app/icon.png`、`public/icon-192.png`、`public/icon-512.png` 呈现为圆角矩形（圆弧角、四角透明），使用统一圆角比例。
- `favicon.ico` 可由 master 源图重建（多帧 ICO），不再依赖一次性手工转换。
- 单一 master 源图（全出血方形）驱动全部图标输出；脚本可安全重复运行、输出确定性（字节相同）。
- `apple-icon.png` 与 `icon-512-maskable.png` 保持不透明方形（平台遮罩规则）。
- 零新增依赖（`sharp` 已在 devDependencies；ICO 容器手写）。

**Non-Goals:**

- 超椭圆（squircle）圆角——用户明确选择圆弧角；圆角路径差异在 ≤512px 下不可辨。
- SVG favicon 方案（Safari 支持缺口 + 无矢量源图）。
- `app/icon.png` 瘦身（保持 1184×1184 高分辨率源）。
- 重命名脚本 / npm script（保留 `generate-pwa-icons`，避免波及已发布文章与既有 spec 引用）。
- 修改 manifest 条目、URL 结构、页面代码。
- 解决绕过 HTML 直抓 `/favicon.ico` 的消费方的缓存滞后（Next.js 已通过哈希查询参数处理 head 注入场景）。

## Decisions

### D1: 生成时烘焙圆角（SVG 遮罩 + `dest-in` 合成）

用与输出同尺寸的 SVG（`<rect width rx fill="white"/>`，SVG 默认背景透明）作为合成层，`blend: 'dest-in'` 使画面在遮罩外 alpha=0。这是 `sharp` README 的官方圆角配方，`dest-in` 仅取遮罩 alpha 通道，遮罩颜色无关。

- 备选：CSS `border-radius`——对图标文件无效，排除。
- 备选：SVG favicon——Safari 对 `rel="icon"` SVG 支持不完整，且无法覆盖 ICO/apple 场景，排除。
- 备选：在线 favicon 转换工具——正是一次性遗留产物的来源，破坏仓库「脚本可重建 + 输出提交 git」约定，排除。
- 实测依据：角部 alpha=0、边中 alpha=255、抗锯齿过渡环 ~727 像素（512px）；无需颜色去污（角部区域源色均匀为 navy，透明过渡不产生白边）。

### D2: 圆角比例 RATIO = 0.24（占画布边长），单一常量

圆弧角在同等名义内缩下比 iOS 超椭圆观感略「欠圆」，24% 作轻微补偿，且贴合 Android 自适应图标的视觉密度。所有输出按同一比例缩放，保证跨尺寸观感一致。常量集中定义，改一个数值重跑脚本即可全量调整。

| 输出                  | 尺寸 | 圆角半径 |
| --------------------- | ---- | -------- |
| `app/icon.png`        | 1184 | 284.16px |
| `public/icon-512.png` | 512  | 122.88px |
| `public/icon-192.png` | 192  | 46.08px  |
| ICO 帧 48             | 48   | 11.52px  |
| ICO 帧 32             | 32   | 7.68px   |
| ICO 帧 16             | 16   | 3.84px   |

- 备选：22.37%（iOS 超椭圆名义值）——圆形弧与超椭圆在此差值下 16px 亚像素级不可辨，任取其一；选 24% 因圆弧角偏「欠圆」。

### D3: master 移居 `assets/app-icon.png`，`app/icon.png` 变为纯输出

解除「输出即输入」耦合：脚本从 `assets/app-icon.png`（全出血方形 1184）读取，向 `app/` 与 `public/` 写出全部工件。若就地对 `app/icon.png` 圆角化，下一轮生成时 maskable/apple 将读到带透明角的输入，产生圆角嵌入 navy 的视觉污染，且「重建 master 为方形」不可逆。

- 备选：自变换式 master（读入后原地覆盖）——重跑语义漂移、失败态不可恢复，排除。
- 备选：master 留在 `app/` 用命名区分——Next.js 文件约定只识别 `icon.*`，无法共存两个同角色文件，排除。
- `git mv` 迁移；master 保持原字节（git 历史完整）。

### D4: 按消费方拆分「圆角 / 不透明方形」

| 输出                                         | 形态                           | 依据                                               |
| -------------------------------------------- | ------------------------------ | -------------------------------------------------- |
| `app/favicon.ico`                            | 圆角 + 透明角                  | 浏览器 tab 原样展示；平台不遮罩                    |
| `app/icon.png`                               | 圆角 + 透明角                  | 桌面 PWA 安装、书签等原样展示                      |
| `public/icon-192.png`、`icon-512.png`（any） | 圆角 + 透明角                  | 桌面平台原样展示                                   |
| `app/apple-icon.png`                         | 不透明方形                     | iOS 自施加 squircle 遮罩；透明角合成为黑底         |
| `public/icon-512-maskable.png`               | 不透明方形（保持现状字节不变） | Android 启动器自施加形状遮罩；预圆角会导致双重遮罩 |

### D5: `favicon.ico` = 多帧 PNG-in-ICO，帧序 `[32, 16, 48]`，容器手写

- **帧集合**：16/32/48 覆盖浏览器 tab、书签与 Windows 列表视图；相对单帧 32（Evil Martians 指南的极简建议）多出小尺寸清晰度与 48px 场景，体积代价仅 ~7KB。
- **帧序**：Next.js 16.3.1 默认 Turbopack 构建按 ICO **最大帧**生成 `<link sizes>`（实测：`[32,16,48]`→`48x48`、`[16,48,32]`→`48x48`、`[16,32]`→`32x32`，帧序无关；webpack loader 路径的 `image-size` 才取首帧）。经决策接受声明值 `48x48`（spec 不约束具体值）；帧序保留 `[32,16,48]` 以兼容首帧消费方与 32 优先惯例。
- **格式**：PNG-in-ICO（浏览器与 Windows Vista+ 均支持），避免手写 BMP（32-bit BGRA + AND mask，~60 行额外代码换取递减的旧平台利益）；若未来确需 BMP，写入器可局部替换。
- **容器**：6 字节 ICONDIR + 16 字节×3 ICONDIRENTRY + PNG 载荷，约 30 行手写代码；干跑产物已被 Next.js 自带解析器验证。**备选**：`png-to-ico` 类新依赖——违反零新依赖约束且其输出顺序不可控，排除。
- spec 层面**不**约束 `sizes` 属性值（内容探测结果，易随工具链漂移）；只断言 link 存在与 `/favicon.ico` 可直接访问。

### D6: ≤48px 帧 4× 超采样，其余输出按目标尺寸直接遮罩

小尺寸帧先生成 4× 面罩图（64/128/192）再 lanczos3 缩至目标（16/32/48），保证细粒度圆弧平滑；≥192 的输出直接按目标尺寸遮罩（实测 727 过渡像素已足够平滑）。

### D7: `app/apple-icon.png` 纳入脚本输出

它当前与 `app/icon.png` 字节完全相同（SHA256 相同、线上 URL 哈希相同），属重复手工文件。脚本化后两者分别从 master 生成（一方遮罩、一方不遮罩），永久同步、不再漂移。

### D8: 维持既有工程约定

输出提交 git、手动 `pnpm generate-pwa-icons`（无 prebuild 钩子）、确定性字节输出——与现状一致，变更仅是输出集合扩大。

## Risks / Trade-offs

- **[PNG-in-ICO 对旧式 Windows 外壳（如固定网站的磁贴缓存）兼容性]** → 现代浏览器全部支持；如需兜底，BMP 帧写入器可隔离在单一函数内替换。
- **[浏览器在 favicon.ico 与 icon.png 两个 `<link>` 间择取逻辑不统一]** → 两个候选均为圆角，择取结果一致，风险消解。
- **[已访问用户的 favicon 缓存]** → head 内 href 携带内容哈希查询参数自动失效；直抓 `/favicon.ico` 的少数消费方可能滞后，可接受。
- **[手写 ICO 容器格式出错]** → Next.js 构建期对 ICO 调用 `image-size`，解析失败即报 `E1040` 构建失败；另在实现阶段加入帧数/尺寸解析断言。
- **[确定性绑定 sharp 版本]** → 与现有脚本同一性质；升级 sharp 后重跑脚本并核对 `git status` 即可。
- **[`app/icon.png` 维持 ~1.0MB]** → 用户决策；favicon 由浏览器后台下载不影响页面性能，哈希查询参数保证缓存更新。
- **[master 路径迁移改变脚本输入]** → `AGENTS.md`、pwa spec、脚本 JSDoc 同步更新（已列入 tasks）；`git mv` 保留历史。

## Migration Plan

1. `git mv app/icon.png assets/app-icon.png`；重写脚本（输入路径、遮罩、超采样、ICO 写入器、新输出）。
2. 运行 `pnpm generate-pwa-icons`，执行探针验证（四角 alpha、ICO 帧解析、重跑字节一致）。
3. 提交全部生成工件（`app/*.png`、`app/favicon.ico`、`public/icon-*.png`）与新 master。
4. `pnpm build` 核对 head 三链接与 `sizes` 值；部署走既有 Vercel 流程。
5. 回滚策略：所有工件均已提交，`git revert` 整体回退即可。

## Open Questions

（无——全部设计决策已在探索阶段收敛。）

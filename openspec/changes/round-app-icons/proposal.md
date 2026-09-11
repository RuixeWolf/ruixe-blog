# round-app-icons

## Why

网站图标目前全部是「全出血方形」：`app/icon.png`、`app/apple-icon.png`、`app/favicon.ico` 与 PWA 图标的四角均为不透明的深色底。在**平台不施加遮罩**的消费场景（浏览器 tab、桌面 PWA 安装、书签等）下，直角方形显得生硬；目标形态是圆角矩形、四角透明。

同时有三个既有问题需要一并解决：

1. `app/favicon.ico` 是早期在线转换工具的一次性产物（32×32 单帧、BMP 编码），无法从源图重建，游离于生成管线之外。
2. `app/icon.png` 既是浏览器直接访问的 favicon 源文件，又是图标生成脚本的输入，双重身份导致无法就地圆角化（会污染下游生成结果的输入）。
3. seo spec 声称 favicon 链接为 `sizes="any"`，与线上真实输出不符——Next.js 16 会按 ICO 内容探测尺寸并输出 `sizes="32x32"`；且平台遮罩规则决定「哪些图标可以预圆角化」需要被 spec 明确记录（apple-icon 与 maskable 必须保持不透明方形，否则会双重遮罩或被 iOS 合成黑角）。

## What Changes

- **图标生成管线升级**（`scripts/generate-pwa-icons.mjs`）：在生成阶段烘焙圆角（SVG 圆角遮罩合成），并新增 `favicon.ico` 重建能力（多尺寸帧 ICO：16/32/48；`<link sizes>` 声明值由内容探测生成，spec 不约束具体值）。
- **源图解耦**：master 从 `app/icon.png` 移居 `assets/app-icon.png`（全出血方形，1184×1184）；脚本所有输出改为从 master 单向生成，可安全重复运行且输出确定性。
- **圆角 + 透明角输出**：`app/icon.png`（1184）、`app/favicon.ico`（16/32/48）、`public/icon-192.png`、`public/icon-512.png`。
- **保持不透明方形输出**（平台自行套遮罩，预圆角化会导致双重遮罩/透明角被合成黑底）：`app/apple-icon.png`、`public/icon-512-maskable.png`（后者预期字节不变）。
- **`app/apple-icon.png` 改由脚本生成**：目前它与 `app/icon.png` 字节完全相同（重复手工文件），脚本化后与 master 永久同步、不再漂移。
- **spec 修正**：收窄 seo 中「图标资源必须为实心方形」的约束（实际只适用于 apple-icon）；favicon 与通用图标改为圆角透明角并被场景断言覆盖；修正 favicon 场景中 `sizes="any"` 的漂移。PWA 侧记录源图路径变化与 any/maskable 的形状差异。
- **文档**：`AGENTS.md` 的图标生成说明同步更新。
- **无破坏性变更**：所有 URL、manifest 条目、页面行为不变；仅图标像素与 ICO 内部结构变化。

## Capabilities

### New Capabilities

<!-- 无新增 capability -->

（无）

### Modified Capabilities

- `seo`: 「网站图标资源」requirement — favicon 与通用图标改为圆角矩形 + 透明角；Apple touch icon 保持不透明方形（保留 iOS 黑底理由）；修正 favicon `<link>` 场景断言（`sizes="any"` → 与真实输出一致的声明）。
- `pwa`: 「PWA Icons」requirement — 源图标从 `app/icon.png` 改指 `assets/app-icon.png`；新增 any-purpose 图标圆角透明角、maskable 图标保持不透明全出血的行为约束。

## Impact

- **重写**：`scripts/generate-pwa-icons.mjs`（圆角遮罩、4× 超采样、手写 ICO 容器、新输出集）
- **再生成并提交**：`app/icon.png`、`app/favicon.ico`、`app/apple-icon.png`、`public/icon-192.png`、`public/icon-512.png`
- **新增**：`assets/app-icon.png`（master 源图）；`public/icon-512-maskable.png` 预期字节不变
- **文档**：`AGENTS.md`
- **依赖**：无新增（复用既有 `sharp@~0.35.3` devDependency；ICO 容器为脚本内手写，不引入新包）
- **不涉及**：`app/manifest.ts`、`app/[lang]/layout.tsx`、`lib/feed.ts`（`/favicon.ico` 保留，RSS 引用不失效）、已发布文章

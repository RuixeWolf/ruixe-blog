## MODIFIED Requirements

### Requirement: 网站图标资源

系统 SHALL 通过 Next.js 文件约定提供网站图标。`app/favicon.ico` 提供 `.ico` 格式 favicon，`app/icon.png` 提供通用图标（用于浏览器 tab、PWA 等），`app/apple-icon.png` 提供 Apple touch icon（用于 iOS 添加到主屏幕）。`favicon.ico` 与 `icon.png` MUST 为圆角矩形（圆弧角、四角背景透明）且两者圆角比例一致；`favicon.ico` MUST 为多帧 ICO，至少包含 16×16、32×32、48×48 三个尺寸帧，各帧均四角透明；`apple-icon.png` MUST 保持不透明实心方形——iOS 会为添加到主屏幕的图标自行施加圆角遮罩，且透明背景会被 iOS 强制合成为黑底。三个图标资源 MUST 由同一 master 源图（`assets/app-icon.png`，全出血不透明方形）派生，保持视觉一致，MUST NOT 各自独立手工维护。

#### Scenario: 浏览器加载 favicon

- **WHEN** 用户访问任意页面
- **THEN** 页面 `<head>` 含指向 `/favicon.ico` 的 `<link rel="icon">`（由 Next.js 文件约定注入，href 可含内容哈希查询参数；`sizes` 属性由 Next.js 按图标文件内容探测生成（Turbopack 构建取 ICO 最大帧），spec 不约束具体值）
- **AND** 直接请求 `/favicon.ico` 返回有效 ICO 文件（RSS 阅读器等第三方工具常直接请求该路径，MUST NOT 仅依赖 HTML link 注入）

#### Scenario: favicon 与通用图标为圆角透明角

- **WHEN** 检查 `app/favicon.ico` 的任一尺寸帧或 `app/icon.png` 的四角像素
- **THEN** 四角像素为完全透明（alpha = 0），图标边缘呈现平滑圆弧角

#### Scenario: Apple touch icon

- **WHEN** iOS 用户将网站添加到主屏幕
- **THEN** 主屏幕图标使用 `app/apple-icon.png` 生成的 `<link rel="apple-touch-icon">`
- **AND** 该文件四角为不透明像素（MUST NOT 含透明角，避免 iOS 合成黑底与双重圆角）

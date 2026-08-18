# 我的第一个个人博客网站

记录我开发第一个属于自己的博客网站的过程与想法，这篇文章就作为我博客的第一篇文章吧！

## 背景

在我上大学的时候，我就想自己开发一个属于自己的博客网站，我想有一个不受约束地记录自己的技术博客文章的平台，并作为展示我 Web 开发技术的 “名片”。想法很美好，但我却始终因为各种理由没有付诸行动，大学时忙于上课和毕设论文，毕业后又忙于工作。但现在，2026 年中旬，AI Coding 已经成熟，且已经是我日常的工作流，极大提升了我的开发效率，那么我的个人博客项目开始~~新建文件夹~~了。

## 初始需求

我认为在项目开发过程中，前期为了确认目标和需求而投入大量时间和精力是值得的，这将明显提升项目质量，以及项目实现的目标与预期的相符程度，开发过程也更顺畅。

AI Coding 时代更是如此，明确且详细的目标与需求会让 AI 产出更符合预期的代码。如果让 AI 开始写代码时，自己都不清楚自己想要什么，那么 AI 更不知道自己想要什么了。

我认为在未来 AI Coding 的时代，程序员的职责将会变为 “码农” 和 “产品经理” 之间的角色。向 AI 提出清晰的目标与需求的能力，将会比写出好代码的能力更重要。

> 以上是我 2026 年中旬使用 AI Coding 的想法，这些想法应该会未来随着 AI 模型能力与工具链的进步而改变。说不定未来直接脑机接口读取想法，不需要通过提示词文本与 AI 交互了，然后再以现在 N 倍的速度实现好几版项目，直接选择哪个版本更符合预期，然后再想、再实现几版、再选 🤣

### 博客文章

- 网站定位是个人博客，仅发布我自己的文章，不考虑其他用户发布文章
- 每篇文章有标题、描述摘要、发布时间、修改时间、分类、标签等信息
- 文章中会出现图片等媒体资源
- 文章有简易评论功能，其他用户可用给文章添加留言评论
- 文章有多语言功能，用户可通过 URL 中的语言路径参数访问同一篇文章的不同语言版本
- 文章内容可被搜索，交互方式为点击菜单栏搜索图标，弹出搜索对话框进行关键字搜索

### 页面布局设计

页面布局类似 Github 个人主页，整体划分如下：

- 页头菜单栏
- 菜单栏下方为主要内容
  - 侧栏（常驻），用于展示个人信息名片
  - 页面内容（随 URL 路径动态），用于展示 URL 对应的页面内容

### 其他需求

- 技术栈使用 Next.js，源码托管在 Github，运行部署在 Vercel
- UI 框架使用 HeroUI，图标库使用 Lucide
- 页面支持不同屏幕宽度的响应式布局
- 页面支持多语言国际化
- 页面支持深浅色主题切换
- 良好的 SEO 能力，博客文章列表和内容能被收录至搜索引擎
- 支持 RSS 订阅
- 支持 PWA，可将网站添加至操作系统桌面，实现快捷打开，不需要过多缓存数据
- 支持 llms.txt，提升网站内容 AI 友好度
- 尽量降低运维部署成本

## 技术选型

我现在的 AI Coding 工作流中，新项目的技术选型阶段使用网页版 AI Chat，比如 Gemini 或 ChatGPT，已有项目可选择使用 OpenSpec Explore + 联网搜索，这将协助我快速了解新的技术栈以及更匹配我需求的方案。

我预期这个博客项目的技术栈为 Next.js，UI 框架使用 HeroUI，部署方式通过 Github 开源仓库 + Vercel。

> 试用了 Vercel 部署 Next.js 项目后，我觉得这简直是太方便了，几乎解决了 Next.js 全栈项目全部的后端服务器相关功能的需求，不需要自己搭建服务器、管理数据库、处理请求分析等操作

### 文章数据管理

这是整个博客网站架构设计的大方向，两个方向：文章存放在文件还是数据库。其他功能的技术选型决策，都将基于这一步的技术选型决策。

#### 方案 1：Markdown / MDX 文件驱动型

不开发提供增删改查服务的后端，博客文章以 Markdown 文件保存，通过 Next.js 服务渲染。文章标题、描述摘要、分类标签等信息写在 Markdown 内的 Frontmatter（文件顶部的 YAML 元数据）。

**优点**

- 开发成本较低，不需要前后端分离开发复杂的后端与管理数据库，免得网站开发了很久却还没开始发文章

- 运维部署成本极低，不需要购买服务器用于网站后端

**缺点**

- 每次编辑文章都需要提交 Git Commit，无法直接在线编辑 ~~（这似乎也不是缺点，能用来水 Github commit 数量）~~
- 未来可扩展性不足，比如想再加个文章点赞功能就不太好实现了

#### 方案 2：CMS 数据库驱动型

自建或使用现成的 CMS 内容管理系统框架，由于我想自己开发博客网站，因此如果选择 CMS 数据库驱动型方案，我需要开发增删改查的后端，管理数据库。

**优点**

- 功能扩展灵活，未来更容易给网站添加新功能
- 在线编辑文章秒发布

**缺点**

- 项目开发成本与运维部署成本较高

最终选择方案 1，采用 **Markdown 文件驱动型** 作为项目框架。

### Markdown 文件渲染

既然选择采用 Markdown 文件驱动型方案，需要进一步考虑如何渲染 Markdown 文件内容。Next.js 项目有如下方案：

- **@next/mdx** - Next.js 官方维护的 mdx 渲染工具，与 Next.js AppRouter 配合很好，但需要手动处理文章多语言版本的文件的读取，适合文件驱动型博客网站
- **next-mdx-remote** - 社区开发的 Next.js 远程加载与渲染 mdx 文件的工具，适合 CMS 系统，项目 Github 仓库在2026年4月10日被标记为只读已归档，项目不再维护了
- **@mdx-js/mdx** - 可以不止在 Next.js 项目使用的 mdx 编译器，`@next/mdx` 就是基于该工具的封装

综合考虑后，选择 **@next/mdx**。

### 文章评论功能

我计划接入第三方评论工具，直接嵌入文章详情页面，不开发复杂的用户登录、评论管理等后端功能。经过与 AI 探索，了解到一种低成本的解决方案 Giscus（基于 Github Discussions），因此文章评论功能的技术栈采用 **Giscus**。

### 文章搜索功能

文件驱动型的个人博客可以采用静态搜索方案，以下是两种静态搜索工具：

- **Fuze.js** - 轻量级模糊搜索库，JS/TS 实现，Next.js 项目友好，Github Star 20k+，项目仓库与社区活跃
- **Pagefind** - 全静态搜索库，Rust 实现，Github Star 5k+，项目仓库与社区活跃

又对比了 Algolia、Meilisearch 动态搜索工具，综合考虑后，选择方案 **Fuze.js**。

### 文章内容图片资源托管

我计划使用 CDN 云服务，不把图片等媒体资源存放在 Git 仓库，且考虑全球范围的可访问性，以下是两个云服务厂商的方案：

- **CloudFlare R2** - ClaudeFlare 对象存储服务，免费存储数据量 10 GB
- **Amazon S3** - 亚马逊 S3 对象存储服务，无免费额度
- **Vercel Blob** - Vercel 对象存储服务，免费存储数据量 250 MB
- **Alibaba Cloud OSS** - 阿里云对象存储服务，无免费额度

综合对比后，最终选择了赛博活佛 **CloudFlare R2**，顺便还在 CloudFlare 买了用于我博客网站的域名。

### 网站界面与文章多语言

**网站界面多语言**

我计划使用成熟的 Next.js 项目 i18n 方案：

- **next-intl** - App Router (Next.js 13+) 首选 ，它专为 React Server Components (RSC) 设计，支持无缝的流式渲染，是目前官方推荐且社区热度最高的方案
- **next-i18next** - Pages Router (Next.js 12 及以下)首选 。它是基于经典 i18next 生态打造的专属 Next.js 插件，成熟稳定

综合对比后，选择 **next-intl**。

**文章多语言**

文章 Markdown 文件命名包含语言代码，如 `hello-world.zh.mdx`，写完文章后，手动翻译或者通过 AI 翻译生成其他语言的文章 Markdown 文件。

## 详细需求

通过初始需求进行技术选型后，补充与扩展初始需求，制定详细需求。

### 页面布局设计

**宽屏 / 桌面端**

- Header 菜单栏（常驻）
  - 左侧为网站标题与导航栏，网站标题为 `Ruixe Blog`，导航内容为：首页、关于、个人 Github 主页跳转
  - 右侧为功能栏，内容为：文章搜索按钮、语言切换、深浅主题色切换

- Body 左侧侧栏（常驻）
  - 个人信息名片，包含我的 Github 头像、Github 用户名、Github 跳转链接，可编辑的 Bio、联系方式等信息
  - 文章分类列表
  - 文章标签集合
- Body 页面内容（随 URL 路径动态）
  - 首页 - 博客文章列表
  - 文章详情页 - 页面中央内容为文章信息与内容，页面右侧展示文章目录导航。页头导航菜单不展示入口，可通过文章列表页面打开详情页
  - 关于 - 关于我的信息、关于这个博客网站的信息。

**窄屏 / 移动端**

- Header 菜单栏（常驻）
  - 左侧为 “打开侧栏菜单按钮”，点击打开 Menu Drawer
  - 中间为网站标题
  - 右侧为功能栏，展示一个文章搜索按钮与一个设置按钮；点击文章搜索按钮打开全屏搜索组件；点击设置按钮弹窗内的功能为语言切换、深浅主题色切换
- 菜单 Menu Drawer（隐藏，Header 菜单栏按钮点击展示）
  - 个人信息名片
  - 导航栏，内容与桌面端一致
  - 文章分类列表
  - 文章标签集合
- Body 页面内容（随 URL 路径动态）
  - 首页 - 简易版个人信息、博客文章列表
  - 文章详情页 - 文章信息与内容，文章信息与正文之间以展示文章目录导航，目录使用 Accordion 默认折叠。页头导航菜单不展示入口，可通过文章列表页面打开详情页
  - 关于 - 关于我的信息、关于这个博客网站的信息。

### URL 路径设计

这将决定 Next.js 项目的 AppRouter 结构，综合考虑多语言功能、文章 Slug、SEO 友好等因素，参考微软产品文档、Apple 开发者文档等网站后，URL 路径设计如下：

- `/` - 根路径，浏览器访问该路径时会按浏览器语言设置自动重定向至对应的语言路径
- `/[lang]` - 首页内容路径，包含语言代码路径参数，如 `en` `zh` 等，示例 `/zh`；用户在浏览器访问根路径将会自动重定向至这个路径，首页的页面内容为文章列表
- `/[lang]/posts` - 文章列表路径，示例 `/zh/posts`；页面内容为全部文章列表，与首页一致
- `/[lang]/posts/<article slug>` - 文章详情页，包含文章 slug 路径参数，示例 `/zh/posts/hello-world`，对应的文章 Markdown 文件为 `hello-world.zh.mdx`；页面内容为对应的 Slug 文章的语言版本的详情内容
- `/[lang]/categories/[categoryId]` - 文章分类列表页，示例 `/zh/categories/frontend`
- `/[lang]/tags/[tagId]` - 文章标签列表页，示例 `/zh/tags/next-js`
- `/[lang]/about` - 关于页面

### 文章元数据

使用 Markdown Frontmatter，Schema 示例：Frontmatter Schema 设计：

| 字段          | 说明         |
| ------------- | ------------ |
| title         | 标题         |
| description   | 描述摘要     |
| publishedTime | 发布时间     |
| modifiedTime  | 修改时间     |
| category      | 分类 ID      |
| tags          | 标签 ID 列表 |

Frontmatter Schema 示例：

```markdown
---
title: 'Hello World'
description: 'My first blog post'
publishedTime: '2026-01-01'
modifiedTime: '2026-01-05'
category: 'frontend'
tags:
  - next-js
  - react
---
```

### 文章内容与元数据多语言

**文章内容：**不同语言版本的文章共用一个 Slug ID，通过文件扩展名区分不同的语言版本，文件名格式 `{slug}.{locale}.mdx`，示例 `hello-world.zh.mdx`。

**文章分类与标签：**文章 Frontmatter 中的分类与标签存储的是 Taxonomy ID，通过 Taxonomy 翻译文件实现多语言。

文件目录结构如下：

```
content/
├── posts/
│   ├── hello-world.zh.mdx
│   ├── hello-world.en.mdx
│
└── taxonomy/
    ├── categories.yaml
    └── tags.yaml
```

**categories.yaml**

示例：

```yaml
frontend:
  name:
    zh: 前端开发
    en: Frontend Development

backend:
  name:
    zh: 后端开发
    en: Backend Development

devops:
  name:
    zh: DevOps
    en: DevOps
```

规则：

- ID 唯一
- 不允许层级
- 必须提供所有支持语言翻译
- 删除/修改 ID 需要考虑 URL 兼容

**tags.yaml**

```yaml
next-js:
  name:
    zh: Next.js
    en: Next.js

react:
  name:
    zh: React
    en: React

typescript:
  name:
    zh: TypeScript
    en: TypeScript
```

规则：

- ID 唯一
- 不分组
- 必须完整翻译
- 标签数量可以较多

### 文章删除处理

文章删除后，创建原文章访问路径的 Redirect，为了 SEO 友好，避免死链。

实现一个文章删除脚本，通过 args 传入文章 slug，实现以下功能：

- 判断文章是否存在，若不存在则报错，若存在则提示用户确认删除
- 删除文章文件
- 创建原文章访问路径的 Redirect
- 锁定文章评论 Giscus Discussion

### 个人信息名片

- Github 账号信息（可配置 Github 用户名，每次访问博客网站时，调用 Github API 实时获取）
  - 用户名
  - 用户头像
- 可配置的个人信息
  - Github 用户名（用于获取 Github 用户信息）
  - Bio
  - 联系方式，可添加多个，每项包含类型（邮箱、电话等）和内容

## 项目开发过程

制定了详细的项目需求后，进入开发实现阶段。VSCode，启动！

我现在的 AI Coding 工作流主要使用 VSCode Copilot，搭配 OpenSpec Opsx 工作流，规范驱动 + 意图驱动，我将在另一篇博客文章分享我现在的 AI Coding 工作流。

### 创建项目并完成基础框架

创建 Next.js 项目，使用 `create-next-app`

```
❯ pnpm create next-app@latest ruixe-blog

√ Would you like to use the recommended Next.js defaults? » No, customize settings
√ Would you like to use TypeScript? ... Yes
√ Which linter would you like to use? » ESLint
√ Would you like to use React Compiler? ... Yes
√ Would you like to use Tailwind CSS? ... Yes
√ Would you like your code inside a `src/` directory? ... No
√ Would you like to use App Router? (recommended) ... Yes
√ Would you like to customize the import alias (`@/*` by default)? ... No
√ Would you like to include AGENTS.md to guide coding agents to write up-to-date Next.js code? ... Yes

Creating a new Next.js app in ruixe-blog.
```

使用 PNPM `next-app` 创建项目时有个坑需要注意，项目模板创建完成后 `next-app` 会自动使用 PNPM 安装依赖，但是 PNPM 安装依赖结束后默认拦截第三方依赖的预安装脚本运行，直接报错终止 `next-app` 的后续任务，导致 `AGENTS.md` 创建失败。

我的解决方法是给 `next-app` 添加参数 `--skip-install`，又因为只要给 `next-app` 添加了参数，其他选项就会默认也由 `next-app` 处理，无法自定义选项了，因此我直接在命令行中指定所有选项。

```bash
pnpm create next-app@latest --skip-install --ts --eslint --react-compiler --tailwind --no-src-dir --app --agents-md
```

项目模板创建完成后，运行 `pnpm install` 安装依赖，运行 `pnpm approve-builds` 允许运行预安装脚本，运行 `pnpm dev` 启动项目，访问 `http://localhost:3000`，页面显示 Next.js 欢迎页面。

初始化 OpenSpec 工作流，使用 `openspec init`

```
❯ openspec init

✔ Select tools to set up (31 available) GitHub Copilot
▌ OpenSpec structure created
✔ Setup complete for GitHub Copilot
```

配置 VSCode Copilot MCP 服务，创建 `.vscode/mcp.json`

```json
{
  "servers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "heroui-react": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

然后让 AI 协助完成以下步骤

- 安装与配置 UI 框架 HeroUI
- 安装与配置图标库 `lucide-react`

### Github 仓库创建与 Vercel 部署

项目基础框架完成，dev 启动后页面展示了 HeroUI 与 Lucide 示例，Prettier 与 ESLint 运行正常后，正式创建 Github 项目仓库。

Github 项目仓库地址 https://github.com/RuixeWolf/ruixe-blog

在 Vercel 导入 Github 项目仓库一键部署，网站访问地址 https://ruixe-blog.vercel.app，我计划等待首版业务功能开发完成后再为 Vercel 部署添加自定义域名。

在 Vercel 的项目管理页面可以启用访问分析与速度洞察，启用后需要在项目中添加相应的代码才能生效。Vercel 提供了很方便的功能，可以实现一键让 Vercel 的云端 AI Agent 实现代码改动，然后自动提交 Github PR，我只需要 Code Review 然后合并。等待 Vercel 重新构建部署后，访问博客网站就能在 Vercel 后台看到访问分析与速度洞察了。

那么现在我的博客项目终于从新建文件夹到首次上线了（虽然还只是个 Next.js 演示项目），接下来开始正式开发项目的业务功能。

### 业务功能开发阶段 1

- 实现 URL 路径设计
- 实现页面布局设计，包含宽屏桌面端与窄屏移动端
- 实现文章功能核心架构，包含 content 目录结构、mdx 文件渲染、文章详情页导航目录等功能
- 实现页面与文章多语言功能
- 实现页面主题色切换功能

以上功能是整个博客网站的核心功能与架构，实现过程中总共创建了 5 个 OpenSpec Changes，已归档位于 `openspec/changes/archive` 目录下，分别为：

- **2026-07-22-phase1-core-foundation** - 核心功能实现，包括 URL 路径设计、页面布局设计、文章功能核心架构、页面与文章多语言功能、页面主题色切换功能
- **2026-07-22-fix-phase1-nav-and-notfound** - 修复导航栏与 404 页面
- **2026-07-23-optimize-page-ui** - 页面 UI 优化
- **2026-07-24-add-sidebar-category-counts** - 侧栏分类文章数量统计
- **2026-07-24-site-config-from-yaml** - 站点配置从 YAML 文件读取

### 业务功能开发阶段 2

- 实现文章搜索功能
- 实现文章评论功能
- 实现文章删除功能
- 接入 CloudFlare R2 对象存储，实现文章内容添加图片等媒体内容

使用 Giscus 开发文章评论功能时，需要先在 Github 仓库开通 Discussions 功能，并创建一个合适的分类，然后在 [giscus.app](https://giscus.app) 输入 Github 仓库名并选择讨论分类，获得 Giscus 配置所需的 `repo-id` `category` `category-id`。

接入 CloudFlare R2 的功能主要是为了配置 PicGo 工具，实现 Typora 等 Markdown 编辑工具粘贴图片自动上传。项目的代码改动不多，主要是使用 `next/image` 做一层图片转换处理，访问博客文章页面获取图片时匹配更合适的尺寸与自动压缩图片文件大小。

以上是为博客网站的增强功能，开发过程中总共创建了 4 个 OpenSpec Changes

- **2026-07-29-add-post-search** - 实现文章搜索功能，使用 Fuze.js 静态搜索库
- **2026-07-29-add-post-comments** - 实现文章评论功能，使用 Giscus 第三方评论工具
- **2026-07-31-add-post-deletion** - 实现文章删除功能，创建文章删除脚本
- **2026-07-31-add-media-hosting** - 使用 `next/image` 包装 CloudFlare R2 对象存储，实现文章内容添加图片等媒体内容，优化 MDX 图片组件的响应式尺寸与 CLS 处理

### 业务功能开发阶段 3

- 制作网站图标、OpenGraph 图片
- 实现 SEO 优化，包含 sitemap 等功能
- 实现 RSS 功能
- 实现 llms.txt 功能
- 实现 PWA 功能
- 创建 `publish-post` Agent Skill，用于 AI 辅助快捷发布新文章或更新文章

**网站图标与 OpenGraph 图片**

制作网站图标时我使用 ChatGPT 生成了方形 App 图标和静态默认 OpenGraph 原图片，用一个在线 favicon 转换工具将方形图片转为 32x32 的 `favicon.ico`。

进一步制作静态 OpenGraph 图片时，要将图片裁剪为 `1.91:1` `1200 x 630 px` 这个神奇尺寸，操作系统自带的图片编辑工具无法裁剪这样的尺寸。探索后发现了一个开源好用的图片编辑器 [ShareX](https://getsharex.com/)，直接创建 `1200 x 630 px` 空白画布，再导入原图裁剪得到 `opengraph-image.png`。

文章详情页面的 OpenGraph 图片是动态生成的，使用 `next/og` 生成，文章标题、作者信息、发布时间等信息会渲染在 OpenGraph 图片上。

**llms.txt**

截止我开发 llms.txt 功能时，[llms.txt 规范](https://llmstxt.org/) 已经升级至 v2，推荐网站根路径可访问 `/llms.txt` + `/xxx/xxx.md` 的方式，不再使用 `llms-full.txt`，让 AI Agents 访问网站时精简化按需读取。

**PWA**

网站首版 PWA 功能仅限能安装到桌面，提供基础的 `manifest.json` 配置与 App Icon。浏览器获取 `manifest.json` 时使用 `app/manifest.ts` 动态生成，生成不同尺寸的 App Icon 使用 `scripts/generate-pwa-icons.mjs` 脚本。

**`publish-post` Agent Skill**

- 用户创建或编辑 `/content/posts` 或 `/drafts` 的文章文件后，可以在 Agents 工具对话使用 `publish-post` skills 辅助快捷发布新文章或更新文章
- Skills 可支持不同的 Agents，如 Copilot, OpenCode, Codex 等

`publish-post` skills 流程设计：

- 用户使用该 Skills 需要明确指定要新建或更新位于 `/content/posts` 或 `/drafts` 的指定文件，如果用户没有指定则需要读取 Git 变更然后使用 Agent 工具内置的询问用户工具让用户选择本次发布任务的文章文件
- 对目标文章文件读取当前 Git 变更，区分是新增文章还是更改已有的文章
- 发布文章流程：
  - 补全或完善 Fontmatter
  - 为文章使用合适的分类或标签（如果不确定请向用户提问），如果新增分类或标签，需要更改 `categories.yaml` 与 `tags.yaml`
  - 新增文章：为这篇文章补全创建多语言版本的文章文件
  - 更新文章：按目标文件的改动内容，更改这篇文章的其他语言版本的内容

同时还添加了文章校验工具 `scripts/validate-posts.mjs`，用于校验文章文件的 Fontmatter 是否符合规范，是否缺少多语言版本的文章文件，是否缺少分类或标签的翻译等。

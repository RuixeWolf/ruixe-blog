# Design

## Context

背景见 [proposal.md](./proposal.md)。目前 `app/[lang]/layout.tsx` 既提供整站的语言、主题和搜索环境，也渲染桌面侧栏与主内容容器。首页和文章页分别渲染同一个文章列表，现有移动抽屉已经共用主导航和侧栏内容。`lib/github.ts` 负责按站点配置获取并缓存 GitHub 用户资料。

## Goals / Non-Goals

**Goals**

- 让首页与内页各自布置主内容，并通过同一个 locale 根布局获得站点功能。
- 让名片资料、导航和联系入口可随静态首页输出，复用现有的配置校验、国际化和 GitHub 请求。
- 让访客按当前语言进入文章与关于页，并使用 GitHub 个人主页和公开邮箱继续了解作者或联系合作。

**Non-Goals**

- 精选项目继续由 GitHub 个人主页维护。文章索引、Markdown、RSS 和分享继续走各自现有入口。
- 合作联系采用公开邮箱和邮件客户端。关于页扩充为简明的作者及博客介绍，沿用现有双语内容体系。

## Decisions

### 根布局管理共用功能，页面组合自己的主内容

保留 `app/[lang]/layout.tsx` 中的 HTML 骨架、`generateStaticParams`、站点元数据、Header、移动抽屉、搜索、主题与数据分析。把侧栏与现有内页的内容容器提取成可复用的服务端布局组件，由文章列表、文章详情、分类、标签、关于页及相应的本地化 404 使用。首页自己的 `<main>` 从 Header 下方沿页面向下排布个人介绍。各入口保证只渲染一个主内容 landmark，并复用既有页边距。

考虑过将内页移入 `(blog)` 路由组。用仓库安装的 Next.js 16.4.3 路由处理函数比较后，文章页面地址相同，分组后文件约定生成的 `opengraph-image` 地址会添加后缀。文章 JSON-LD 当前使用无后缀地址。保留路由文件位置可同时保全文章页、Markdown 版本及原分享图地址。共享服务端组件增加少量显式调用点，使页面布局选择在源码中可见。

`i18n/request.ts` 继续从根语言参数解析文案。首页沿用 `buildAlternates('', locale)`，保留自指 canonical、两种语言版本、`x-default` 和 RSS 自动发现链接。页面标题、站点默认描述和分享图沿用现行元数据。

### 站点配置提供身份和联系信息，头像沿用 GitHub

站点 YAML 的 `profile.displayName` 和 `profile.email` 与代码一同发布，由 `lib/site-config.ts` 在加载时校验。有效邮箱是单一地址，不包含换行或附加的邮件参数。服务端读取同一邮箱生成可见地址和 `mailto:`。关于页需要署名时复用显示名。按钮标签、自我介绍与段落内容在中英文 messages 内维护。

首页通过现有的 `getGitHubUser` 读取 `siteConfig.githubUsername` 对应的头像，沿用请求的 1 小时重新验证设置。头像复用仓库已经使用的图片及回退机制。在首页名片里，GitHub 数据仅用于头像，名称、简介和站点操作来自本地资料。用户资料缺失或图片失败时，在同一尺寸的头像位置显示 `R`，由显示名导出。名片的 GitHub 链接复用 `siteConfig.githubUrl`，与站点源码仓库链接区分。

曾考虑提交固定头像和在两份语言文件各放一份邮箱。GitHub 头像可随作者更新，配置中的单一邮箱则使任一语言的显示和跳转一起更新。

### 用一个共享导航入口连接名片、博客与作者资料

`NavLinks` 在现有首页后加入「文章」或「Articles」，同时覆盖桌面和 Drawer。首页的主操作使用同语言 `/posts` 链接，次要链接通往同语言关于页与 GitHub，合作联系展示完整邮箱。新导航项沿用现有抽屉的点击关闭行为。

### 插画横幅和手选文章

首页横幅使用本地 WebP 插画。宽屏在插画左侧排列紧凑头像、姓名和简介，右侧保留角色与书桌。窄屏将插画裁成短横幅置于介绍上方，小头像与姓名仍同行。背景图作为装饰处理，遮罩使用主题背景色，链接可以换行并保留可见键盘焦点。

`content/site.yaml` 的 `featuredPosts` 按阅读顺序保存 slug，两种语言共用。首页依次调用 `getPostBySlug`，用当前语言的 frontmatter 渲染标题和摘要，整行链接到文章。缺少当前语言版本时跳过该项，全部缺失或未配置时省略栏目。完整索引仍按发布时间排序。

关于页沿用现有语言文件和版式，将作者内容放在博客配图与许可信息之前，使用现有站内导航访问相应语言的建站文章。

## Risks / Trade-offs

- 布局抽取触及多个页面和 404 → 复用现有侧栏组件和容器几何尺寸，分别验证文章详情、分类、标签及相应的本地化 404，检查 DOM 主内容区与侧栏显示。
- GitHub 用户接口或图片容灾 → 模拟接口和图片不可用，验证头像回退、静态构建和核心链接均可用。
- 窄屏上完整邮箱和英文入口可能较长 → 在 320 CSS 像素宽度实测内容换行和键盘焦点。
- 文章分享图的地址兼容性仅靠标签存在断言难以验证 → 在生产构建后请求当前文章旧图地址，确认响应实际是图片。

## Migration Plan

将配置字段、双语文案、名片与布局一起随一个版本发布。已有访问与分享入口沿用现有路径。如需回滚，整体回退该发布版本，使页面与它读取的配置保持一致。

## References

- Context7 检索的 Next.js 官方文档，用于核对多语言静态生成、路由组与分享图约定。 [Internationalization](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/internationalization.mdx) · [Route Groups](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/03-file-conventions/route-groups.mdx) · [Open Graph image](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.mdx)
- W3C 对窄视口重排和可见键盘焦点的说明。 [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) · [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)

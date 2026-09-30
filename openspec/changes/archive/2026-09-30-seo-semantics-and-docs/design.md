# Design

## Context

纯收尾型 change，三项独立小改动，无架构决策。`PostLayout.tsx:72-78` 目前以 `<span>` 承载 `t('PublishedTime', { date: formattedPublished })` 与 `t('ModifiedTime', ...)`；日期显示经 `next-intl` `format.dateTime`（`new Date(meta.publishedTime)`，注意 `YYYY-MM-DD` 解析为 UTC 午夜——现状如此，本 change 不改变显示口径）。`AGENTS.md` 的 llms.txt 路由记载与实际根级路由漂移（`/en/llms.txt` 线上 404 已实测）。

## Goals / Non-Goals

**Goals:**

- 文章日期获得机器可读语义（`<time dateTime>`），显示零变化
- 消除 AGENTS.md 对 llms.txt 位置的误导记载
- 留下一次性的 CWV 基线数据（记录在 issue #30），供后续「图片 CLS 是否处理」决策

**Non-Goals:**

- 不改日期显示格式与时区口径（`format.dateTime` 现状保留）
- 不做 `lang="zh-Hans"`（明确跳过，SEO-17）
- 不做图片 CLS 优化本身（等基线数据说话，属未来独立 change）

## Decisions

### D1. `dateTime` 用 frontmatter 原值，不做时区化

`<time>` 的 `dateTime` 直接绑定 `meta.publishedTime` / `meta.modifiedTime`（`YYYY-MM-DD` 是合法的 HTML time 值）。**不**复用 Change A 的 `toIsoDateTime`（那是 JSON-LD 对 Google 时区解释问题的对策；HTML `dateTime` 语义是「日期本身」，且显示文本由 UTC 午夜格式化而来，两者混用时区反而制造不一致）。依赖 Change A 的仅为并行不冲突，无代码耦合。

### D2. `<time>` 替换保持既有 class 与兄弟结构

`PostDetail.PublishedTime` / `ModifiedTime` 的 i18n 消息格式（含日期插值）不动；只把外层 `<span>` 换成 `<time dateTime={...}>`，分隔符 `<span aria-hidden>·</span>` 保持。React 对 `<time>` 无特殊处理，纯 DOM 替换。

### D3. CWV 基线是运维任务而非代码

PSI 采集（首页 + zh/en 文章各一，移动端优先）数据人工回填 issue #30；不产出仓库内文件、不加监控依赖。理由：一次性基线，GSC Core Web Vitals 报告持续存在，无需引入代码资产。

## Risks / Trade-offs

- **[`<time>` 对 SEO 的直接增益微小]** → 接受：成本近零，语义正确性本身是目标；与 JSON-LD 日期（Change A）互为印证。
- **[AGENTS.md 属 agent 指令文件，修改会被 `next dev` 的 generate-agent-files 重写机制影响？]** → 不会：该机制只增补 `nextjs-agent-rules` 标记块，llms.txt 一行在块外，正常编辑安全。

## Migration Plan

部署即生效，无状态。回滚 = revert。

## Open Questions

（无）

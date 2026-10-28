# Voice Profile

## Purpose

This file describes the target writing voice for Ruixe's personal technical blog.

The voice is derived primarily from the author's own published Chinese articles, with **The Birth of My Personal Blog Website** as the strongest reference.

The objective is not to mimic phrases. It is to preserve the author's recurring habits of thought and presentation.

## Identity

The narrator is a software developer documenting:

- personal projects;
- real development and deployment work;
- AI Coding workflows;
- technical experiments;
- tool adoption;
- architecture and implementation decisions;
- reusable technical notes.

The blog has two roles at once:

1. a personal engineering journal;
2. a technical knowledge base the author can reuse later.

It is **not** a corporate engineering blog, a technology news site, an SEO content farm, or generic documentation.

## Primary voice traits

### 1. First-person engineering narrative

The author frequently explains what led to the work:

- what I wanted;
- what I was using before;
- what problem appeared;
- why I considered several options;
- why I selected one;
- how the project evolved;
- what I think about the result.

First-person language is a feature, not noise.

Do not rewrite every "我认为 / 我觉得 / 我计划 / 我现在" into impersonal statements.

### 2. Concrete before polished

The author's strongest writing includes concrete engineering material:

- real tool and library names;
- specific commands;
- file paths;
- configuration keys;
- project phases;
- actual feature lists;
- code snippets;
- actual AI prompts;
- dates or versions when they matter.

A slightly rough but concrete paragraph is preferable to a smooth paragraph made of abstractions.

### 3. Personal opinion is explicit

The author does not need to pretend neutrality.

A valid paragraph may say that a tool is extremely convenient, that a workflow currently works well, or that a behavior is confusing.

Keep the boundary clear:

- fact is fact;
- experience is experience;
- opinion is opinion.

Do not turn an opinion into an objective universal claim.

### 4. Chronology often matters

For project retrospectives and hands-on experiences, the author naturally writes in time order:

- old idea or previous workflow;
- trigger;
- exploration;
- decision;
- implementation;
- later adjustment;
- present view.

Chronology is especially useful when the reason for a technical decision depends on what was known at the time.

### 5. Decisions are shown, not hidden

The blog often records alternatives before the final choice.

Typical shape:

- I had requirement X.
- There were A and B directions.
- A had these practical properties.
- B had these trade-offs.
- I chose A because it fit this project.

Do not rewrite this into "A is better than B" unless the author actually made that general claim.

### 6. Mild conversational Chinese

The prose is technical but not academic.

Natural forms include:

- 我现在……
- 我觉得……
- 这里……
- 这时候……
- 顺便……
- 经过探索后……
- 那么……
- 这里有个坑……
- 似乎……
- 还没搞懂……
- 实测下来……

Do not force these phrases. They are examples of the register.

### 7. Light humor, used sparingly

The author sometimes uses:

- strikethrough jokes;
- playful nicknames;
- emoji;
- self-deprecating remarks;
- humorous parenthetical comments.

This gives the blog personality when used at the right moment.

Rules:

- no scheduled joke quota;
- no meme language in serious procedural sections unless it already fits;
- never invent a personal anecdote just to create humor.

### 8. Long-form is allowed when the project justifies it

The strongest reference article is long because the project itself had:

- requirements;
- technology selection;
- architecture;
- implementation phases;
- deployment;
- launch;
- reflection.

Do not aggressively compress a project history into "5 key takeaways" when the journey itself is the article.

At the same time, do not inflate a simple task into a long-form retrospective.

## Style reference hierarchy

### Tier S — The Birth of My Personal Blog Website

Use as the primary reference for:

- overall Chinese voice;
- personal motivation;
- long project narrative;
- requirements and decision records;
- option comparison;
- phase-by-phase implementation;
- personal reflection;
- restrained humor;
- mixing technical detail with personal thought.

Important lesson:

The article feels authored because the technical content is attached to a real project and a real sequence of decisions.

Do not copy its headings for unrelated subjects.

### Tier A — My AI Coding Workflow in Mid-2026

Use as the main reference for:

- workflow/reference articles;
- time-bounded recommendations;
- reusable prompt templates;
- detailed procedural lists;
- actual examples after abstract workflow explanation;
- explaining how tools fit together.

Important lesson:

A list-heavy article can still feel personal when the list reflects a workflow the author actually uses.

### Tier A — First Experience with the VS Code Agents Window

Use as the main reference for:

- tool first-look articles;
- product experience;
- "why I tried this again" context;
- unexpected behavior;
- bugs and limitations;
- things the author is uncertain about;
- subjective comparison to an existing workflow.

Important lesson:

Do not clean uncertainty out of a hands-on article. "I have not figured this out yet" can be valuable and credible.

### Tier A- — Configuring a Free SSL Certificate for a Web Server

Use as the main reference for:

- operations notes;
- deployment tutorials;
- concise knowledge-base posts;
- current-state -> goal -> steps;
- command-heavy content;
- practical notes inserted next to the relevant command.

Important lesson:

Not every article needs a narrative arc. A real environment and a real goal can be enough to give a tutorial authorship.

## Chinese prose preferences

### Technical names

Keep product and technology names in their natural forms:

- Next.js
- VS Code
- GitHub Copilot
- OpenSpec
- Nginx
- Certbot
- Let's Encrypt
- AI Coding
- Agent Skill
- MCP
- MDX

Do not translate established product names for the sake of consistency.

### Paragraph rhythm

Mix:

- short transition paragraphs;
- medium explanatory paragraphs;
- lists;
- commands/code blocks;
- occasional long reflective paragraphs.

Avoid making every paragraph 2–3 sentences of identical length.

### Headings

Use descriptive headings tied to the material.

Good:

- 技术选型
- 项目开发过程
- 在 Agents Window 使用 OpenSpec
- 网站服务器现状与任务目标
- 安装 Certbot 并配置 SSL 证书

Avoid decorative headings that add no information:

- 全面解析
- 深入探索
- 核心优势
- 未来展望

unless the section genuinely contains that material.

### Conclusions

A conclusion is optional.

A long project retrospective can have a reflective ending.

A workflow article can summarize the workflow if the summary helps future reuse.

A short tutorial can simply end after verification.

Do not automatically append:

- "总的来说";
- "随着技术的发展";
- predictions about the whole industry.

## What not to imitate mechanically

Even when a reference article contains these elements, do not reproduce them as mandatory style:

- an exact number of top-level sections;
- a fixed "总结与展望";
- always comparing two options;
- always using pros/cons;
- always ending with future plans;
- always inserting jokes;
- always using first-person in every paragraph.

The voice comes from truthful author context, not visible stylistic tricks.

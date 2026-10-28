# blog-writer

A personal technical-blog writing Agent Skill for Ruixe Blog.

Its main job is to preserve the author's real engineering voice while reducing generic LLM writing patterns.

## What it can do

- turn project notes into a blog outline;
- draft a new technical article from real source material;
- continue an existing article;
- rewrite an AI-heavy draft in the author's voice;
- review a draft for "AI smell";
- preserve commands, prompts, configs, decisions, and engineering history;
- research external technical facts when the host agent supports web/repository tools.

## Core principle

**The user is the author. The agent is the writing partner.**

The skill must not invent:
- personal experience;
- experiments;
- failures;
- measurements;
- opinions;
- reasons for decisions;
- future plans.

## Style references

Priority order:

1. 《我的个人博客网站的诞生》
2. 《我在 2026 年中旬的 AI Coding 工作流》
3. 《首次使用 VS Code Agents Window》
4. 《为网站服务器配置免费的 SSL 证书》

See `references/source-articles.md`.

## Directory

```text
blog-writer/
├── SKILL.md
├── README.md
└── references/
    ├── anti-ai-patterns.md
    ├── article-types.md
    ├── evidence-and-fact-checking.md
    ├── mdx-style.md
    ├── review-checklist.md
    ├── source-articles.md
    └── voice-profile.md
```

## Example requests

```text
Use blog-writer to turn these development notes into an outline.
Do not write the article yet.
```

```text
Use blog-writer to draft a Chinese article from these notes and Git changes.
Keep my actual decision process and do not invent failed attempts.
```

```text
Use blog-writer to review this draft for AI smell first.
List the problems before rewriting.
```

```text
Use blog-writer to rewrite this article in my blog voice.
Preserve all factual technical details and code blocks.
```

## Design notes

This skill deliberately separates:
- voice;
- article structure;
- evidence policy;
- anti-AI review;
- MDX conventions;
- final review.

That keeps `SKILL.md` small enough to load efficiently while detailed rules can be loaded only when needed.

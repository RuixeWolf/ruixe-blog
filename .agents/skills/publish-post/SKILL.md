---
name: publish-post
description: >-
  Publish or update a blog post for this repository. Use when the user wants to
  publish a new article, move a draft from drafts/ into content/posts/, update
  an existing post, or sync a post's translations across locales. Handles
  frontmatter completion, category/tag assignment (including taxonomy YAML
  updates), locale variant creation/sync, and post-publish validation.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(pnpm validate-post:*)
license: MIT
compatibility: Requires git, pnpm, and scripts/validate-post.mjs.
metadata:
  author: ruixe
  version: '1.0.0'
---

<!-- Canonical copy. Other agent skill directories (e.g. .github/skills/publish-post/
     for GitHub Copilot) hold manual mirrors - update them by hand when this changes. -->

# Publish Post

Publish or update a single blog post (one slug, all its locale variants) in the
file-driven content pipeline of this blog.

## Project facts (hardcoded snapshot - update when locales or schemas change)

- Post files: `content/posts/{slug}.{locale}.mdx` (e.g. `hello-world.zh.mdx`).
- Supported locales: `zh`, `en` (default `zh`). Same slug across locales = same
  post, different translation.
- Required frontmatter fields: `title`, `description`, `publishedTime`
  (`YYYY-MM-DD`), `category` (single ID), `tags` (array of IDs). Optional:
  `modifiedTime` (`YYYY-MM-DD`, must be >= `publishedTime`).
- Taxonomy: `content/taxonomy/categories.yaml` and `content/taxonomy/tags.yaml`.
  Entry shape: each top-level key is an ID whose value is name translations for every
  locale, e.g. `frontend: { name: { zh: ..., en: ... } }`.
  IDs are unique, flat (no hierarchy), kebab-case, and MUST provide translations
  for every supported locale. Changing/deleting an ID breaks URLs (needs redirects).
- Drafts live in `drafts/*.md` (no frontmatter, usually Chinese).
- Dates use local timezone, formatted `YYYY-MM-DD`.

## Guardrails (never violate)

1. NEVER overwrite an existing locale file (or any taxonomy YAML) without first
   showing the user a summary of the planned changes (or a diff) and getting
   explicit confirmation.
2. NEVER run `git commit` or `git push`. Only modify files; the user commits.
3. NEVER invent taxonomy IDs silently. New categories/tags require the user to
   confirm ID + translations for ALL locales before writing YAML.
4. Process ONE slug per publish task (all its locale variants together).
5. When unsure (slug choice, title, description, category, tags, translation
   tone), ASK the user instead of guessing.
6. Edit frontmatter as text (preserve existing YAML style: quoted dates,
   block-list tags). Do not re-serialize YAML wholesale. Run `pnpm format`
   afterwards to normalize.

## Step 1 - Determine the target file

If the user explicitly named a file or slug, use it. Otherwise:

```
git status --porcelain -- content/posts drafts
```

Collect untracked (`??`) and modified (`M`) files, group post files by slug,
and ask the user (using the agent's built-in ask tool) to choose which post to
publish. Include drafts in the choices.

If there are NO pending changes, ask the user what they want to publish.

## Step 2 - Classify the task

| Target                        | Task type           |
| ----------------------------- | ------------------- |
| `drafts/*.md`                 | New post (migration) |
| `content/posts/...` untracked | New post (in place)  |
| `content/posts/...` modified  | Update existing post |

## Step 3a - New post flow (both variants)

1. **Slug**: confirm the slug. Default to the file name stem for in-place
   files; for long draft file names, suggest a shorter kebab-case slug and ask.
   Slug must be lowercase kebab-case (`/^[a-z0-9]+(-[a-z0-9]+)*$/`).
2. **Frontmatter**: draft `title` and `description` from the content (keep the
   user's own title if the draft has an H1) and ask for confirmation.
   `publishedTime` = today (user may override). No `modifiedTime` on first
   publish.
3. **Category/tags**: propose matches from existing taxonomy IDs first. If
   nothing fits, propose new entries: suggest a kebab-case ID + `zh`/`en`
   names, get confirmation, then append to the taxonomy YAML (all locales).
   If taxonomy YAML changed, remind the user to restart `pnpm dev`.
4. **Write the primary locale file**: `content/posts/{slug}.{locale}.mdx`. For
   a draft migration this is a move + rename + insert frontmatter above the
   body. Remove any leading H1 from the body if it duplicates `title`
   (site chrome already renders the title).
5. **Create other locale variants**: translate the full body and localize
   `title`/`description`. Keep `publishedTime`, `category`, `tags` identical
   across variants. Mark the translations as needing human review in your
   final summary.
   - Escape valve: the user may explicitly publish a single locale only (e.g.
     "just publish zh for now") - then skip other locales.
6. **Draft cleanup**: if the source was `drafts/*.md`, ASK the user whether to
   delete the draft file. Do not delete without confirmation.

## Step 3b - Update flow

1. Inspect pending changes: `git diff HEAD -- content/posts/{slug}.*.mdx` plus
   `git status` for new sibling files. If the working tree is clean (changes
   already committed), do NOT guess: ask the user what changed.
2. Present a change summary (added/modified/removed sections, metadata changes)
   and a sync plan for the other locale variants. Get confirmation.
3. **Sync**: apply the changes to other locale variants - re-translate modified
   sections (replacing only those sections), translate+append new sections,
   remove deleted sections. Never touch unrelated paragraphs; the user may have
   hand-polished translations. Sync metadata (`category`, `tags`, dates) across
   all variants.
4. **modifiedTime**: if the body changed substantively (not just frontmatter or
   typos), set `modifiedTime` = today on ALL locale variants. Otherwise leave
   it unchanged.

## Step 4 - Validate and wrap up

Run the validator (single slug or the whole corpus):

```
pnpm validate-post <slug>   # one post
pnpm validate-post          # everything
```

All errors must be fixed before the task is done (warnings about missing
locales are acceptable when the user chose the single-locale escape valve).
Then run `pnpm format`.

Final summary to the user must include: files created/modified, taxonomy
changes (if any, + restart dev server reminder), validator result, a note that
translations need human review, and a reminder that nothing was committed.

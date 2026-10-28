# Markdown / MDX Style

## Project conventions first

When working inside the blog repository:

1. inspect nearby published posts;
2. inspect the current frontmatter schema;
3. inspect taxonomy IDs and locale conventions;
4. preserve existing MDX component conventions.

Do not rely on an old remembered schema if the repository says otherwise.

## Frontmatter

Do not invent metadata.

When frontmatter is part of the task:

- preserve existing field names;
- create a concise description based on the actual article;
- use existing category/tag IDs where appropriate;
- do not create a new category/tag merely to make the metadata look complete.

Publication workflow may belong to a separate publishing skill. This writing skill should focus on article content unless metadata is explicitly requested.

## Headings

Use heading depth semantically.

Avoid:

- one heading per paragraph;
- decorative headings with no content value;
- mechanically identical section trees across unrelated posts.

Long retrospectives can have deep heading trees when they document real project structure.

## Code and commands

Use inline code for:

- file names;
- paths;
- CLI commands mentioned inside prose;
- config keys;
- package names when appropriate;
- code identifiers.

Use fenced code blocks for:

- multi-line shell commands;
- config;
- source code;
- prompts that readers may reuse;
- logs when the formatting matters.

Add a language identifier when known.

Do not "clean up" command output in a way that changes what actually happened.

## Prompt blocks

For AI Coding workflow articles, preserve real prompts as reusable artifacts.

If a prompt was actually used:

- keep its important wording;
- fix only obvious formatting/typos unless the author asks for a rewritten template;
- distinguish the original prompt from an improved prompt if both are shown.

## Lists

Lists are natural for:

- requirements;
- feature scopes;
- workflow steps;
- decision options;
- configuration items;
- validation checklists.

Do not convert every list into prose in the name of sounding human.

Likewise, do not convert every paragraph into bullets for scanability.

## Tables

Use tables when readers need to compare dimensions.

Good uses:

- solution comparison;
- before/after;
- config field meaning;
- migration mapping.

Avoid a table when:

- there are only two simple facts;
- the cells require long paragraphs;
- it is added only for visual variety.

## Links

Prefer descriptive inline links.

Useful targets:

- official product docs;
- GitHub repos;
- referenced standards;
- related posts on the same blog.

Avoid link dumping at the end unless the article is a curated resource list.

## Images

When image placeholders or existing images are present:

- keep them near the paragraph they support;
- add alt text that describes the technical content;
- do not invent what a screenshot shows if the image was not inspected.

## Chinese typography

Prefer normal Chinese punctuation in Chinese prose.

Keep technical tokens untouched:

- `@next/mdx`
- `strict: '1'`
- `/opsx-apply`
- `content/posts`
- `https://example.com`

Do not add spaces inside code tokens.

Use natural spacing around English product names according to the surrounding existing article style; consistency matters less than readability.

## Strikethrough and emoji

Allowed, but rare.

Good use:

- a genuine joke or aside from the author;
- a moment of self-deprecation;
- an intentionally informal aside in a personal retrospective.

Do not use them in security warnings, commands, or critical operational instructions.

## Safety for publishable technical content

Before final output, check for:

- secrets;
- tokens;
- API keys;
- real private IPs;
- internal hostnames;
- private repository URLs;
- personal data;
- confidential screenshots/log excerpts.

Replace with safe placeholders when necessary.

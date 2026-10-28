# Evidence and Fact-Checking

## Three information classes

### A. Author evidence

Information the author personally supplied or that can be directly recovered from the author's project artifacts.

Examples:
- "I used Copilot Chat before Agents Window."
- a command the author actually ran;
- a screenshot of an error;
- a Git commit or project file;
- a measured viewport width;
- a prompt copied from the author's workflow;
- a decision recorded in project docs;
- "I preferred option A."

This is the highest-value material for authored technical writing.

### B. External fact

Information that exists independently of the author's experience.

Examples:
- release dates;
- feature support;
- package behavior;
- protocol semantics;
- current pricing;
- official installation guidance;
- repository status;
- API contracts.

These may require current research.

### C. Author opinion

The author's interpretation or preference.

Examples:
- "I think Vercel is extremely convenient for this project."
- "For my workflow, the local review path is more useful."
- "I would still choose the file-driven approach."

An agent may organize or clarify an opinion the author already expressed.

It must not invent one.

## Never fabricate authorship

Forbidden:
- invented first-person testing;
- invented "I initially thought...";
- invented bugs;
- invented tool usage;
- invented dates;
- invented benchmarks;
- invented reader feedback;
- invented emotions;
- invented future plans;
- invented reasons for a decision.

Bad:
> 我最开始尝试了方案 A，但很快发现性能不够。

if the source never says the author tried A.

Better:
> 方案 A 的一个潜在问题是性能开销。

or leave the comparison out.

## Use source gaps honestly

When author-specific material is missing, choose one of these:

### Interactive path

Ask only questions that materially change the article.

Good questions:
- What were you using before this?
- Why did you choose A over B?
- Did you actually test the alternative or only research it?
- What result made you consider the task complete?

Avoid asking for details that can be read from project files or researched externally.

### Non-interactive path

If the user wants a draft immediately:
- write the factual sections;
- avoid false first person;
- insert a clear placeholder only when necessary, e.g. `[补充：这里写实际遇到的问题]`;
- do not create a fake anecdote.

## Current facts

Technical blog posts age.

Use current authoritative sources when a claim can change:
- software versions;
- product availability;
- pricing;
- feature support;
- deprecation;
- package maintenance status;
- installation recommendations;
- API behavior.

Source preference:
1. official docs;
2. official repo / release / changelog;
3. official issue / PR when behavior is implementation-specific;
4. specialist secondary source.

## Time-bounding

For fast-moving topics such as AI Coding, Agents, models, pricing, and preview features, prefer language such as:

- 截至本文写作时……
- 这是我在 2026 年中旬的工作流……
- 当前版本中……
- 当时 Agents Window 还不支持……

This preserves the historical truth of the article without pretending the observation is permanent.

## Corrections

When research contradicts a draft:

1. identify the conflicting statement;
2. verify with the strongest source available;
3. correct the factual claim;
4. preserve the author's experiential context if it remains true.

Do not silently rewrite a historical observation as if the author had known the corrected fact at the time.

## Links and citations

Ruixe Blog is not an academic paper.

Prefer inline links where they are useful:
- official docs;
- GitHub repositories;
- referenced tools;
- a related article on the same blog.

Do not overload normal prose with citation markers unless the user asks for a heavily sourced article.

For claims with meaningful factual risk, keep a research note during drafting even if the final article uses only a clean hyperlink.

## Sensitive or private material

Before publishing:
- replace real domains/IPs/secrets with safe placeholders when needed;
- remove API keys, tokens, private repository data, internal hostnames, personal identifiers, and confidential logs;
- do not expose private project data merely because it appeared in source material.

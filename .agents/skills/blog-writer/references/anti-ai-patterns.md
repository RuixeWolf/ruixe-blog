# Anti-AI Patterns

This is an editorial warning list, not a mechanical blacklist.

A phrase is only a problem when it is generic, unsupported, repetitive, or detached from the author's actual material.

## 1. Generic scene-setting

Warning patterns:
- 在当今快速发展的……
- 随着人工智能技术不断发展……
- 在数字化浪潮下……
- XXX 正在改变我们……
- 本文将深入探讨……

Preferred fix:
Start from the actual project, problem, tool, or reason the author is writing.

## 2. Answerer inertia

Symptom:
The article reads like a long ChatGPT response to a prompt.

Common signs:
- restating the user's request;
- defining every term before reaching the author's story;
- answering bullet points one by one;
- a mini-summary after every section;
- ending by repeating the initial answer.

Preferred fix:
Build an article narrative independent of the original prompt.

## 3. Forced completeness

Symptom:
Sections exist because an article "should" have them.

Examples:
- 核心优势
- 不足之处
- 最佳实践
- 适用场景
- 未来趋势
- 总结

Preferred fix:
Delete any section not supported by source material.

A tutorial does not need a "future outlook".
A first-look does not need an exhaustive feature catalog.
A retrospective does not need formal pros/cons for every decision.

## 4. Generic conclusion + industry prediction

Warning shape:
- 总的来说……
- XXX 代表了新的方向……
- 随着模型能力继续提升……
- 未来这类工具会越来越……

This is especially suspicious when the article up to that point is concrete and personal.

Preferred fix:
End with one of:
- the final verified result;
- where the tool now fits in the author's workflow;
- an actual unresolved issue;
- what the author plans next, if supplied;
- a short first-person reflection;
- no conclusion at all.

## 5. Abstract praise

Warning words:
- 强大
- 高效
- 无缝
- 显著提升
- 极大优化
- 革命性
- 赋能
- 全面提升

These are not forbidden.

They need evidence.

Weak:
> Agents Window 极大提升了开发效率。

Stronger:
> 一个 Session 可以管理多个 Chats，复杂任务拆成多个对话后，代码改动仍然统一留在同一个 Session 里。对我现在的 OpenSpec 工作流来说，这比一个对话对应一个会话更顺手。

## 6. Fake author experience

Most severe failure.

Never create:
- "我一开始……" without evidence;
- "实测发现……" without a test;
- "踩了一个坑……" without a real issue;
- "最后我选择……" when the user never chose;
- "用了几天后……" when no duration was supplied.

Human-sounding fabrication is worse than obvious AI prose.

## 7. Symmetry addiction

Symptoms:
- every section has exactly three bullets;
- every product gets an equal-length pros/cons list;
- every paragraph has the same sentence count;
- repeated "首先 / 其次 / 最后";
- headings form a suspiciously perfect taxonomy.

Preferred fix:
Let the amount of detail follow the amount of evidence.

## 8. Forced rhetorical contrast

Common LLM patterns:
- 不仅是 X，更是 Y
- 真正重要的不是 X，而是 Y
- 与其说是 X，不如说是 Y
- 这不仅意味着……还意味着……

These are allowed when they express a real distinction.

Do not delete a strong contrast just because the form is common.

Test:
Can both sides of the contrast be tied to concrete evidence or author reasoning?
If not, simplify.

## 9. Repetitive summaries

Avoid:
- intro previews all sections;
- each section ends with a recap;
- conclusion recaps every section again.

Summarize only when it helps navigation or future reuse.

Workflow articles may legitimately have a compact final checklist.

## 10. Excessive meta-writing

Warning phrases:
- 接下来我们将……
- 下面让我们看看……
- 本文接下来分为……
- 通过以上分析我们可以看到……

Use only when navigation genuinely helps a long article.

Prefer direct transitions.

## 11. Marketing voice

Avoid presenting tools like vendor copy.

Warning signs:
- "颠覆性体验";
- "无缝集成";
- "轻松实现";
- "强大的生态";
- "一站式解决";
- claims about "revolutionizing" development.

Replace with:
- what the tool did in the author's task;
- what was easier;
- what still did not work;
- what trade-off remained.

## 12. Artificial beginner explanations

Do not explain every common developer term.

For the target audience, inline code such as `AGENTS.md`, `pnpm`, `Nginx`, `MCP`, `MDX`, `App Router`, `GitHub Discussions` can often be used directly.

Explain a concept when:
- it is central;
- it is unusual;
- the article depends on a subtle mechanism;
- misunderstanding it would break the procedure.

## 13. Vocabulary sanitization

Do not make the author's language sterile.

If the source contains a natural phrase, joke, or informal judgment that fits the blog, preserve it unless it harms clarity.

Do not replace every vivid phrase with "更为便捷" or "具有较高价值".

## 14. Over-humanization

Do not "humanize" by injecting:
- random slang;
- fake typos;
- excessive emojis;
- unnecessary rhetorical questions;
- fake uncertainty;
- irrelevant anecdotes.

The target is authored technical prose, not simulated spontaneity.

## Anti-AI review method

After drafting, check each section:

1. What new information does this section add?
2. Is the author present where first-person material exists?
3. Are subjective claims tied to author evidence?
4. Is there any paragraph that could fit almost any technology article?
5. Did a transition arise from the material or from writing habit?
6. Does the ending say something the article has not already said?
7. Did the agent create any experience or opinion that the author did not supply?

Rewrite only where the answer reveals a real problem.

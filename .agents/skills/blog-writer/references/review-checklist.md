# Review Checklist

Run this after drafting or rewriting.

## 1. Authorship

- Does the article contain the author's real motivation where available?
- Are first-person statements grounded in supplied evidence?
- Did the agent invent any experience, failure, measurement, emotion, or opinion?
- Does the author's presence disappear halfway through the article for no reason?

If any first-person claim is unsupported, remove or neutralize it.

## 2. Narrative

- Is there a clear reason for the order of sections?
- Does the structure match the article type?
- Are there sections added only because they are common in technical articles?
- Is chronology preserved where it explains decisions?

## 3. Technical value

- Are commands, config, file paths, prompts, measurements, or architecture details preserved where useful?
- Are technical explanations located near the step or decision they explain?
- Is the article too abstract in places where concrete evidence exists?
- Are examples real rather than invented?

## 4. Facts

- Which claims are time-sensitive?
- Were current claims verified when necessary?
- Are historical observations left in their historical context?
- Are uncertain claims still expressed as uncertain?
- Are opinion and fact clearly distinguishable?

## 5. AI smell

Search for:
- generic intro;
- "本文将...";
- forced pros/cons;
- repetitive three-item lists;
- repeated "首先/其次/最后";
- abstract praise;
- generic "总的来说";
- unsupported future prediction;
- identical paragraph rhythm;
- fake rhetorical contrast;
- repeated summary of already stated material.

Fix only real problems.

## 6. Voice

- Does the Chinese sound like a developer writing from experience rather than a technical media outlet?
- Are natural first-person phrases preserved?
- Are jokes/asides restrained and context-appropriate?
- Did editing make the prose sterile?
- Did "humanization" introduce fake slang or fake uncertainty?

## 7. Ending

Ask:
- Does the article need a conclusion?
- If yes, does it add reflection, current assessment, next steps, or a useful compact recap?
- If no, can the article end immediately after the final result or verification?

Delete generic industry outlooks unless the author genuinely wants to make that argument.

## 8. MDX quality

- Heading hierarchy is valid.
- Code fences are correct.
- Inline code is used for technical tokens where useful.
- Tables are readable.
- Links are relevant.
- Existing project conventions are preserved.
- No secrets or private data are exposed.

## 9. Final read

Read the article once as a reader, not as an editor.

The target impression is:

> A developer is recording something they actually built, tried, learned, or currently use.

Not:

> An AI generated a complete article about a technology.

# Article Types

Classify the article before building the outline.

Use the closest type, or combine two types if the material genuinely spans them.

## Type A — Project Journey / Retrospective

Primary reference: **The Birth of My Personal Blog Website**

Use when the article documents a project from idea to a meaningful milestone.

Typical material:
- origin or motivation;
- initial requirements;
- technology selection;
- architecture;
- development stages;
- deployment;
- launch;
- lessons or present view.

Useful narrative spine:

1. Why I wanted to build it
2. Initial requirements or constraints
3. Decisions that shaped the architecture
4. Implementation stages
5. Important issues or discoveries
6. Final result
7. Reflection or next steps, if the author has them

Rules:
- Preserve chronology when it explains decisions.
- Show alternatives when they were actually considered.
- Technical lists are welcome when they document real scope.
- A long article is acceptable if the project history is the value.
- Do not compress the journey into generic "lessons learned" bullets.

## Type B — Workflow / Personal Practice

Primary reference: **My AI Coding Workflow in Mid-2026**

Use when the article records a reusable workflow the author currently follows.

Typical material:
- project initialization;
- tool setup;
- prompt templates;
- repeatable sequence;
- decision rules;
- one or more real examples.

Useful structure:

1. What the workflow is for
2. Current setup
3. Reusable components
4. Step-by-step flow
5. Decision points / when to use a lighter or heavier path
6. Full practice example
7. Current assessment

Rules:
- Time-bound fast-changing practices.
- Prefer actual prompts, commands, file names, and steps.
- Distinguish "I currently use" from "everyone should use".
- A procedural list is not an AI smell when the subject is procedural.
- Include a hands-on example when it materially proves how the workflow works.

## Type C — Hands-on / First Look

Primary reference: **First Experience with the VS Code Agents Window**

Use when the author tries a tool, product, model, library, or feature.

Avoid turning it into a product overview.

Useful narrative spine:

1. Why I tried or revisited it
2. Previous workflow / expectation
3. First important difference
4. Actual task used for testing
5. Useful features found during use
6. Bugs, unclear behavior, limitations, or friction
7. Where the tool fits in my current workflow

Rules:
- Anchor feature descriptions to actual use.
- Keep uncertainty when the author was uncertain.
- Do not invent benchmarks or broad market comparisons.
- Avoid vendor-marketing adjectives.
- Product history belongs only where it explains the author's decision.

## Type D — Tutorial / Knowledge Base

Primary reference: **Configuring a Free SSL Certificate for a Web Server**

Use when the primary goal is to record a reproducible technical procedure.

Useful structure:

1. Short real-world context
2. Current environment
3. Target state
4. Steps
5. Relevant explanation beside each step
6. Verification
7. Optional operational notes

Rules:
- Prefer commands and config over long conceptual background.
- Explain why a non-obvious command/flag exists close to the command.
- Do not add a story if there was no meaningful story.
- Use placeholders such as `example.com` when publishing sensitive deployment details.
- Finish when the task is complete; a conclusion is optional.

## Type E — Debugging / Incident / Postmortem

Secondary reference style.

Use when the value lies in finding the root cause, not merely showing the fix.

Useful narrative spine:

1. Symptom
2. Reproduction
3. Unexpected observations
4. Hypotheses
5. Measurements or evidence
6. Rejected approaches
7. Root cause
8. Fix
9. Verification
10. What is worth remembering

Rules:
- Do not rewrite the investigation into a hindsight-perfect tutorial.
- Keep failed approaches if they teach something.
- Use measured evidence where available.
- Never invent a rejected fix to create drama.

## Type F — Technical Explainer / Decision Note

Use when the article explains a concept or a decision without a large personal journey.

Useful structure:

1. The concrete question
2. Relevant context
3. How the mechanism works
4. Alternatives or trade-offs
5. What the author chose or currently recommends, if known

Rules:
- Start from the question, not a generic industry introduction.
- Include personal judgment only when supplied by the author.
- Do not force a tutorial if no step-by-step action is required.

## Hybrid articles

Common useful hybrids:
- Project Journey + Workflow
- Hands-on + Tutorial
- Workflow + Case Study
- Debugging + Technical Explainer

When combining types, identify one **primary narrative**.

Do not create two separate introductions and two separate conclusions.

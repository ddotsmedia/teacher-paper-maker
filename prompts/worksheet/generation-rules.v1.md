# Worksheet Generation Rules (v1)

Cross-cutting rules applied to every worksheet-generation step (blueprint,
questions, answer key). Compose this with the step-specific prompts in
`prompts/worksheet/` and the model-facing [[shared-context.v1]].

OUTPUT: JSON ONLY. No markdown, explanation, or preamble.

RULES:

1. Grade-appropriate only
2. Curriculum-aligned
3. Unambiguous questions
4. Clear correct answers
5. No inappropriate content
6. No placeholder values like "..."
7. No duplicate concepts
8. Educational explanations only

SCHEMA: Validate against provided Zod schema strictly.
COST: Every token counts. Concise answers only.

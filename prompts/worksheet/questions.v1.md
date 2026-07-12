# Question Generation (v1)

Step 2 of worksheet generation (runs per blueprint section). Compose with
[[generation-rules.v1]] and [[shared-context.v1]]. `{braces}` are filled per
section from the [[blueprint.v1]] output at request time.

TASK: Generate {count} {type} questions.

INPUT: {sectionContext}

OUTPUT (JSON array ONLY):
[
{
"id": "q1",
"type": "{type}",
"question": "Question text",
"options": ["A) ...", "B) ...", "C) ...", "D) ..."],
"correct_answer": "B",
"explanation": "Why B is correct",
"marks": {marks},
"difficulty": "{difficulty}",
"bloom": "remember"
}
]

VALIDATION:

- Exactly {count} questions
- Total marks = {count} × {marks}
- No duplicates
- Correct answer in options
- Grade-appropriate

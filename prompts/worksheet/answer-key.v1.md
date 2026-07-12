# Answer Key Generation (v1)

Step 3 of worksheet generation. Compose with [[generation-rules.v1]] and
[[shared-context.v1]]. `{braces}` are filled at request time from the generated
[[questions.v1]] output.

TASK: Create answer key for questions.

INPUT: {questionsJSON}

OUTPUT (JSON ONLY):
{
"answers": [
{
"id": "q1",
"answer": "B",
"keywords": ["keyword1", "keyword2"],
"explanation": "Why B is correct",
"notes": "Common misconception: students pick A"
}
],
"total_marks": {totalMarks},
"marking_time": "15-20 min"
}

VALIDATION:

- Answer matches question
- Keywords are actual terms
- No placeholder values

# Blueprint Generation (v1)

Step 1 of worksheet generation. Compose with [[generation-rules.v1]] and
[[shared-context.v1]]. Placeholders in `{braces}` are filled from the worksheet
spec at request time.

TASK: Create worksheet blueprint matching spec.

INPUT:

- Curriculum: {curriculum}
- Grade: {grade}
- Subject: {subject}
- Topic: {topic}
- Total Marks: {totalMarks}
- Difficulty: Easy {easyPercent}%, Medium {mediumPercent}%, Hard {hardPercent}%

OUTPUT (JSON ONLY):
{
"sections": [{"id": "s1", "title": "Section A", "type": "multiple_choice", "count": 5, "marks_each": 1, "total_marks": 5, "difficulty": "easy"}],
"total_marks": {totalMarks},
"questions_count": 11,
"bloom_levels": {"remember": 40, "understand": 30, "apply": 20, "analyze": 10}
}

VALIDATION (STRICT):

- Total marks = {totalMarks}
- Difficulty % sum = 100
- No placeholder values

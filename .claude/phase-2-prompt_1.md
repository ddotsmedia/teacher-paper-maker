# PHASE 2: Worksheet Generation with AI

**Duration**: 2 weeks | **Lead**: AI Agent + Backend Agent | **No questions, full autopilot**

**Prerequisite**: Phase 1 complete (auth working, dashboard live)

## Objective

Teacher fills a form → AI generates worksheet questions → Questions displayed → Teacher can edit → Save → Generate answer key. Core feature: AI-powered worksheet generator with schema validation, retry logic, cost tracking.

## Acceptance Criteria

- [ ] Worksheet form (curriculum, grade, subject, chapter, topic, marks, question types)
- [ ] AI blueprint generation (multi-section distribution)
- [ ] AI question generation (section by section, with retry)
- [ ] AI answer key generation
- [ ] Question editor UI (edit, add, delete, reorder, regenerate)
- [ ] Question schema validation (all questions pass Zod)
- [ ] Marks validation (total = requested ± 0.5)
- [ ] Token tracking (input, output, cost, latency logged)
- [ ] Generation job status tracking (PENDING → PROCESSING → COMPLETED/FAILED)
- [ ] Teacher review notice (AI content must be reviewed before classroom use)
- [ ] Retry logic on AI failure (max 3 attempts, exponential backoff)
- [ ] All AI calls logged with version, tokens, cost
- [ ] TypeScript strict, zero errors
- [ ] Integration tests pass (AI adapter tested with fixtures)
- [ ] No secrets exposed in logs
- [ ] CI/CD pipeline green

## What to Build

### 1. Prompt Files (Versioned)

Create in `prompts/worksheet/`:

#### `prompts/worksheet/shared-context.v1.md`
```markdown
# Shared Context for Worksheet Generation

You are an expert educator creating curriculum-aligned, grade-appropriate worksheets.

## Constraints
- Never include inappropriate content
- Respect curriculum standards
- Match grade level exactly
- Ensure answer consistency
- Questions should be clear and unambiguous
- Avoid trick questions
- Include diverse question types

## Output Format
Always output valid JSON only. No markdown, no explanation.
```

#### `prompts/worksheet/blueprint.v1.md`
```markdown
# Worksheet Blueprint Generation

Create a blueprint for a worksheet with the given specification.

## Input
- Curriculum: {curriculum}
- Grade: {grade}
- Subject: {subject}
- Chapter: {chapter}
- Topic: {topic}
- Total Marks: {totalMarks}
- Difficulty Distribution: Easy {easyPercent}%, Medium {mediumPercent}%, Hard {hardPercent}%
- Question Groups: {questionGroups JSON}

## Output (JSON only, no markdown)
```json
{
  "sections": [
    {
      "id": "s1",
      "title": "Section A: Multiple Choice",
      "questionType": "multiple_choice",
      "count": 5,
      "marksEach": 1,
      "totalMarks": 5,
      "difficulty": "easy",
      "learningObjectives": ["identify", "recall"]
    }
  ],
  "totalMarks": {totalMarks},
  "estimatedQuestions": {totalQuestions},
  "bloomLevels": {
    "remember": 40,
    "understand": 30,
    "apply": 20,
    "analyze": 10
  }
}
```

## Constraints
- Total marks must equal requested total
- Difficulty distribution must sum to 100%
- Question count must match form request
- Sections should be balanced
```

#### `prompts/worksheet/questions.v1.md`
```markdown
# Question Generation for Worksheet Section

Generate {count} {questionType} questions for the given section.

## Context
- Curriculum: {curriculum}
- Grade: {grade}
- Subject: {subject}
- Chapter: {chapter}
- Topic: {topic}
- Section: {sectionTitle}
- Learning Objectives: {learningObjectives}
- Difficulty: {difficulty}
- Marks per Question: {marksEach}

## Output (JSON array only)
```json
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "Which of the following...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "B",
    "explanation": "...",
    "marks": 1,
    "difficulty": "easy",
    "bloomLevel": "remember",
    "learningObjective": "identify basic concepts"
  }
]
```

## Validation Rules
- Every question must be unique (not duplicate of another)
- Correct answer must be in options
- Explanation must be clear
- Marks must match requested value
- Bloom level must match difficulty
- Type-specific fields must exist (options for MC, keywords for short answer)
```

#### `prompts/worksheet/answer-key.v1.md`
```markdown
# Answer Key Generation

Create detailed answer key for the provided questions.

## Input Questions (JSON)
{questionsJSON}

## Output (JSON only)
```json
{
  "answerKey": [
    {
      "questionId": "q1",
      "question": "Which of the following...",
      "correctAnswer": "Anther",
      "keywords": ["anther", "pollen", "stamen"],
      "explanation": "The anther is the part of the stamen that produces pollen.",
      "acceptableAlternatives": ["anther structure", "pollen-producing part"],
      "marksAllocation": {
        "fullMarks": 1,
        "partialMarks": []
      },
      "teacherNotes": "Students often confuse anther with pistil."
    }
  ],
  "totalMarks": 20,
  "estimatedTimeToMark": "15-20 minutes"
}
```

## Rules
- All answers must be consistent with generated questions
- Explanations must be educational
- Keywords help teachers identify correct answers
- Teacher notes flag common misconceptions
```

#### `prompts/worksheet/validation.v1.md`
```markdown
# Worksheet Validation

Check the worksheet for educational quality issues.

## Input (JSON)
{worksheetJSON}

## Output (JSON)
```json
{
  "isValid": true,
  "flags": [
    {
      "type": "warning|error",
      "questionId": "q3",
      "message": "Question is ambiguous. Could mean X or Y."
    }
  ],
  "summary": "Worksheet meets all quality standards."
}
```

## Checks
- Grade appropriateness
- Curriculum alignment
- Answer key consistency
- No duplicate concepts
- No inappropriate content
- Question clarity
```

### 2. Database Updates

**Modify `packages/database/prisma/schema.prisma`**:
- Question table: id, documentId, type, question, answerJson, marks, difficulty, bloomLevel, displayOrder
- Implement soft deletes if needed

**Run migration**:
```bash
pnpm db:migrate:dev --name add_questions_table
```

### 3. AI Provider Implementation

**`packages/ai/src/anthropic.ts`** — Implement real generation:

```ts
export class AnthropicProvider implements AiProvider {
  async generateStructured<TInput, TOutput>(
    request: StructuredGenerationRequest<TInput, TOutput>
  ): Promise<StructuredGenerationResult<TOutput>> {
    const startTime = Date.now();
    
    try {
      // Load prompt from file
      const prompt = await loadPrompt(request.promptVersion);
      
      // Fill template with input
      const filledPrompt = interpolatePrompt(prompt, request.input);
      
      // Call Claude with timeout
      const response = await timeout(
        this.client.messages.create({
          model: request.modelConfig?.model || 'claude-3-5-sonnet-20241022',
          max_tokens: request.modelConfig?.maxTokens || 4096,
          messages: [{ role: 'user', content: filledPrompt }],
        }),
        request.timeout || 30000
      );
      
      // Extract JSON from response
      const jsonMatch = response.content[0].type === 'text'
        ? response.content[0].text.match(/\{[\s\S]*\}/)
        : null;
      
      if (!jsonMatch) throw new Error('No JSON in response');
      
      // Parse and validate
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = request.schema.parse(parsed);
      
      // Calculate cost (Anthropic pricing)
      const cost = (
        (response.usage.input_tokens * 0.003) +
        (response.usage.output_tokens * 0.015)
      ) / 1000;
      
      return {
        output: validated,
        provider: 'anthropic',
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latencyMs: Date.now() - startTime,
        estimatedCost: cost,
        retryCount: 0,
        validationStatus: 'success',
      };
    } catch (error) {
      throw new GenerationError(error.message, { retryable: true });
    }
  }
}
```

**Add to `packages/ai/src/`**:
- `prompt-loader.ts` - Load prompts from files, interpolate variables
- `retry.ts` - Exponential backoff retry logic (max 3 attempts)
- `errors.ts` - GenerationError with retryable flag

### 4. Worksheet Creation Flow

**`apps/web/src/app/worksheet/new/page.tsx`** — Multi-step form:

```
Step 1: Basic Info
  - Curriculum (select)
  - Grade (select)
  - Subject (select)
Step 2: Content
  - Chapter (text input)
  - Topic (text input)
  - Learning Objectives (text area, comma-separated)
Step 3: Question Config
  - Total Marks (number)
  - Difficulty Distribution (easy%, medium%, hard% sliders, sum=100)
  - Question Types (checkboxes: multiple_choice, short_answer, long_answer, etc.)
  - Marks per type (number inputs)
Step 4: Review & Generate
  - Show spec summary
  - Button: "Generate Worksheet"
  - Show loading spinner during generation
```

**API Route**: `POST /api/worksheets/generate`

**Input**:
```ts
interface GenerateWorksheetRequest {
  curriculum: string;
  grade: string;
  subject: string;
  chapter: string;
  topic: string;
  learningObjectives?: string[];
  totalMarks: number;
  difficulty: { easy: number; medium: number; hard: number };
  questionGroups: { type: string; count: number; marksEach: number }[];
}
```

**Process**:
1. Validate input with WorksheetSpecificationSchema
2. Create GenerationJob record (status: PENDING)
3. Enqueue BullMQ job: `generateWorksheet`
4. Return jobId immediately
5. Frontend polls `GET /api/worksheets/jobs/{jobId}` for status

### 5. Background Job (Worker)

**`apps/worker/src/jobs/worksheet.ts`**:

```ts
export const generateWorksheetJob = async (job: Job) => {
  const { userId, spec } = job.data;
  
  // Update job status
  await updateGenerationJob(job.id, { status: 'PROCESSING' });
  
  try {
    // Stage 1: Blueprint
    const blueprint = await aiProvider.generateStructured({
      promptVersion: 'worksheet/blueprint.v1',
      schema: BlueprintSchema,
      input: spec,
      userId,
      generationJobId: job.id,
    });
    
    // Stage 2: Questions (section by section)
    const allQuestions = [];
    for (const section of blueprint.output.sections) {
      const questions = await aiProvider.generateStructured({
        promptVersion: 'worksheet/questions.v1',
        schema: z.array(QuestionSchema),
        input: { ...spec, section },
        userId,
        generationJobId: job.id,
      });
      allQuestions.push(...questions.output);
    }
    
    // Stage 3: Answer Key
    const answerKey = await aiProvider.generateStructured({
      promptVersion: 'worksheet/answer-key.v1',
      schema: AnswerKeySchema,
      input: { questions: allQuestions },
      userId,
      generationJobId: job.id,
    });
    
    // Stage 4: Validate
    validateWorksheet({
      questions: allQuestions,
      answerKey: answerKey.output,
      spec,
    });
    
    // Stage 5: Educational Review (Optional for Phase 2)
    // Could add here in Phase 2.5
    
    // Save document
    const document = await prisma.document.create({
      data: {
        userId,
        type: 'WORKSHEET',
        title: `${spec.subject} - ${spec.topic}`,
        curriculum: spec.curriculum,
        grade: spec.grade,
        subject: spec.subject,
        chapter: spec.chapter,
        topic: spec.topic,
        status: 'DRAFT',
        contentJson: {
          spec,
          blueprint: blueprint.output,
          questions: allQuestions,
          answerKey: answerKey.output,
        },
      },
    });
    
    // Update job
    await updateGenerationJob(job.id, {
      status: 'COMPLETED',
      documentId: document.id,
    });
    
  } catch (error) {
    await updateGenerationJob(job.id, {
      status: 'FAILED',
      errorCode: error.code,
    });
    throw error;
  }
};
```

### 6. Question Editor UI

**`apps/web/src/app/worksheet/\[id\]/edit/page.tsx`**:

- Display questions in order
- Each question card:
  - Question text (editable)
  - Type badge
  - Marks input
  - Options (for MC)
  - Correct answer (editable)
  - Explanation (editable)
  - Actions: Edit full, Delete, Duplicate, Regenerate single
- Add Question button (opens form)
- Reorder questions (drag-drop or up/down buttons)
- Save button: PUT `/api/worksheets/{id}`
- Generate Answer Key button: POST `/api/worksheets/{id}/answer-key`

### 7. Answer Key Generation (After Questions Finalized)

**`POST /api/worksheets/{id}/answer-key`**:
- Fetch document with questions
- Send to AI for answer key
- Save to document.contentJson.answerKey
- Return answer key data

### 8. Integration Testing

**`tests/integration/worksheet.test.ts`**:
- Generate worksheet spec validation
- Blueprint generation (with fixture)
- Question generation (with fixture)
- Answer key generation
- Marks validation
- Token tracking
- Job status tracking

**`tests/prompt-evals/`** (Fixture-based):
- Grade 5 Science: 20-mark worksheet
- Grade 8 Mathematics: 50-mark worksheet
- Measure: Marks accuracy, schema validity, latency, cost

### 9. E2E Test (Critical User Workflow)

**`tests/e2e/worksheet-generation.spec.ts`**:
```
1. Login as teacher
2. Dashboard → "New Worksheet"
3. Fill form: CBSE, Grade 5, Science, "Reproduction in Plants", "Pollination", 20 marks
4. Choose question types: 5 MC (1 mark), 5 short answer (2 marks), 1 long answer (5 marks)
5. Click "Generate"
6. Wait for generation (show spinner)
7. Questions appear on screen
8. Edit one question
9. Click "Save Worksheet"
10. Click "Generate Answer Key"
11. Answer key appears
```

### 10. Token Tracking

**`packages/database/prisma/schema.prisma`** — Already have GenerationJob table:
```ts
model GenerationJob {
  id, userId, documentId, provider, model, requestType,
  status, inputTokens, outputTokens, estimatedCost, latencyMs,
  errorCode, createdAt, completedAt
}
```

**Log every AI call**:
```ts
const job = await prisma.generationJob.create({
  data: {
    userId,
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    requestType: 'worksheet_blueprint',
    status: 'PENDING',
  },
});

// After AI call:
await prisma.generationJob.update({
  where: { id: job.id },
  data: {
    status: 'COMPLETED',
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    estimatedCost: result.estimatedCost,
    latencyMs: result.latencyMs,
  },
});
```

### 11. Error Handling & Retry

**In AI adapter**:
```ts
async function generateWithRetry(request, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await aiProvider.generateStructured(request);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

**Error responses to frontend**:
- Schema validation fail: "Generation failed, please try again"
- Timeout: "Generation taking too long, please retry"
- Rate limit: "Daily limit reached, try tomorrow"

### What NOT to Do

- ❌ Do NOT implement payment/quotas yet
- ❌ Do NOT build public templates marketplace
- ❌ Do NOT add student collaboration
- ❌ Do NOT implement live exams
- ❌ Do NOT build PDF export yet (Phase 3)
- ❌ Do NOT send emails for every generation
- ❌ Do NOT cache AI responses (log everything)
- ❌ Do NOT skip retry logic
- ❌ Do NOT expose API keys in frontend

## Steps to Execute

### 1. Prompt Files
- Create all prompt files in `prompts/worksheet/`
- No AI calls yet, just templates

### 2. Database
- Add Question table to Prisma
- Run migration
- Verify schema

### 3. AI Implementation
- Implement AnthropicProvider.generateStructured()
- Add prompt loader, retry logic, error handling
- Test with fixture data (no real API calls yet if network fails)

### 4. API Routes
- `POST /api/worksheets/generate` - Validate & enqueue
- `GET /api/worksheets/jobs/{jobId}` - Check status
- `GET /api/worksheets/{id}` - Fetch worksheet
- `PUT /api/worksheets/{id}` - Update questions
- `POST /api/worksheets/{id}/answer-key` - Generate key

### 5. Background Job
- Create BullMQ job: `generateWorksheet`
- Implement stages (blueprint → questions → answer key → validate)
- Register in worker

### 6. UI
- Worksheet creation form (4-step wizard)
- Question editor
- Answer key display

### 7. Testing
- Unit tests (schema validation, retry logic)
- Integration tests (AI adapter with fixtures)
- E2E test (full generation flow)
- > 80% coverage

### 8. Build & Verify
- All tests pass
- CI/CD green
- Docker stack works
- No secrets in logs

## Validation Checklist

- [ ] All prompt files exist in `prompts/worksheet/`
- [ ] Worksheet form loads and validates
- [ ] Can submit generation request
- [ ] BullMQ job created and processed
- [ ] Questions appear in editor after generation
- [ ] Can edit questions, save
- [ ] Can generate answer key
- [ ] Answer key displays correctly
- [ ] Token usage logged in GenerationJob
- [ ] All generated content matches spec (marks, count, type)
- [ ] Retry logic works (kill Redis during generation, resumes)
- [ ] Error handling shows user-friendly messages
- [ ] No secrets in logs
- [ ] Tests all pass, > 80% coverage
- [ ] CI/CD pipeline green

## Exit Criteria (Phase 2 DONE when)

1. ✅ All acceptance criteria met
2. ✅ Teacher can generate worksheet in < 30 seconds
3. ✅ All questions valid (pass schema validation)
4. ✅ Marks total correctly
5. ✅ Answer key generated automatically
6. ✅ Questions editable before save
7. ✅ Token usage tracked and logged
8. ✅ No AI secrets exposed
9. ✅ Tests pass, > 80% coverage
10. ✅ PR merged to `develop`, CI green

---

**CRITICAL**: Follow UNIVERSAL_PROMPT_LAWS.md. Every prompt versioned. Every AI call logged. No questions.

**EXECUTE WITHOUT ASKING.**

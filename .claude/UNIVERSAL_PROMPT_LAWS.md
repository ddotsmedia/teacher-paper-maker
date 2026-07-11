# Universal Prompt Laws - Teacher Paper Maker

**Apply these to EVERY prompt, EVERY phase, EVERY task.**

## Token Efficiency (MANDATORY)

1. **No narration**: Never explain what you're about to do. Just do it.
2. **No summaries**: Skip "Here's what I did" at the end.
3. **Output only outcomes**: "✅ Build passed. 12 tests passed. TypeScript clean." (one sentence)
4. **Batch operations**: Combine file writes, never one tool call per file.
5. **Skip intermediate reads**: Don't verify what you just wrote.
6. **No verification agents**: Skip extra review unless explicitly required.
7. **Use tools in parallel**: When independent, call all at once.
8. **Minimal code comments**: Only for non-obvious logic.
9. **No defensive coding**: Write what's needed, not what-ifs.
10. **Cache reads**: If you read a file this turn, reuse it don't re-read.

## Code Quality (MANDATORY)

1. **TypeScript strict**: `strict: true` in tsconfig.json. ZERO `any` types.
2. **Zod validation**: Every API input validated with Zod schema.
3. **No hardcoded values**: Use .env for all configuration.
4. **Import organization**: Group imports (React, external, types, local).
5. **Error boundaries**: Try-catch for async, proper error types.
6. **No console.log**: Use structured logging in production.
7. **Consistent naming**: camelCase for functions/vars, PascalCase for types/components.
8. **DRY principle**: Extract duplicate logic into shared functions/packages.

## Database (MANDATORY)

1. **Additive migrations only**: Never destructive. New tables/columns only.
2. **Index critical fields**: userId, status, createdAt on every relevant table.
3. **No N+1 queries**: Use JOINs, relations, or batch loads.
4. **Soft deletes pattern**: Use deletedAt field, filter in queries.
5. **Transactions for multi-step ops**: Wrap in `prisma.$transaction()`.
6. **User data scoped by userId**: Every query filters by `where: { userId }`.
7. **Seed data for tests**: Use prisma/seed.ts for reproducible test data.

## AI Integration (MANDATORY)

1. **Provider-agnostic interface**: Swap Claude → OpenAI/Gemini without code changes.
2. **Schema validation (Zod)**: Validate AI outputs before storing.
3. **Token tracking**: Log input/output tokens in GenerationJob table.
4. **Timeouts**: 30s default, 60s max. Fail gracefully.
5. **Retry logic**: Exponential backoff (1s, 2s, 4s, 8s).
6. **User review before approval**: Never auto-approve AI-generated content (worksheets/questions).
7. **No student data in prompts**: Only teacher context, never student PII.

## Security (MANDATORY)

1. **Server-side auth only**: No client-side token storage. Use secure httpOnly cookies.
2. **User data scoped**: Every query filters by authenticated userId.
3. **No PII in logs**: Hash emails before logging, never log passwords.
4. **No secrets in code**: All env vars validated, never hardcoded.
5. **Rate limiting**: Prepare for middleware (Upstash/custom). Log abuse.
6. **CORS whitelist**: Only `NEXT_PUBLIC_API_URL`.
7. **Prepared for external services**: Validate API responses, timeout on calls.

## Git Workflow (MANDATORY)

1. **Small commits**: One feature/fix per commit. Atomic, reviewable.
2. **Feature branches**: `feature/name`, never work on main/develop.
3. **Commit message format**: `type: description` (feat:, fix:, docs:, test:, refactor:).
4. **PR before merge**: Always create PR, even for solo work.
5. **No commits to main**: Develop branch is primary, main is production-only.

## Testing (MANDATORY)

1. **Unit tests**: Every function/component tested in isolation.
2. **Integration tests**: Happy path + error cases for workflows.
3. **E2E tests**: Register → Create → Export workflow end-to-end.
4. **Coverage > 80%**: Report coverage in CI.
5. **Test data**: Use fixtures, seed database for reproducibility.
6. **Mock externals**: Mock AI provider, storage, Redis in tests.
7. **Test file naming**: `*.test.ts` or `*.spec.ts` colocated with source.
8. **Run all tests before commit**: `pnpm test:unit` passes locally.

## Documentation (MANDATORY)

1. **Code explains itself**: Self-documenting names, minimal comments.
2. **Complex logic commented**: Only non-obvious sections (algorithms, hacks, workarounds).
3. **README in packages**: Each app/package has setup instructions.

## Deployment (MANDATORY)

1. **CI/CD required**: All tests must pass before merge.
2. **Environment parity**: .env.example matches actual vars used in code.

## Autopilot Requirements (NON-NEGOTIABLE)

1. **Complete acceptance criteria**: Every prompt defines testable exit conditions.
2. **No clarification needed**: Read UNIVERSAL_PROMPT_LAWS before each phase. If unclear, re-read it (answer is there).

---

**BOTTOM LINE**: Every prompt assumes you've read this. Every task uses these laws. No exceptions.

If a prompt conflicts with these laws → the laws win. If unclear → re-read the laws.

# All Phase Prompts - Complete Index

**Everything needed to build Teacher Paper Maker end-to-end, fully autopilot, no questions.**

## Quick Navigation

| Document | Purpose | When to Use |
|----------|---------|-----------|
| `UNIVERSAL_PROMPT_LAWS.md` | Rules for ALL work | Read first, apply always |
| `AUTO_APPROVAL_CONFIG.md` | Automated PR/deployment approvals | Setup once, runs forever |
| **Phase Prompts** | Feature implementation | One per phase, in order |
| This file | Index & overview | Quick reference |

---

## Complete Phase Breakdown

### Phase 1: Web App Foundation + Authentication (1 week)
**File**: `.claude/phase-1-prompt.md`

**What gets built**:
- Email registration & login
- Google OAuth
- Password reset flow
- Teacher profile setup (curriculum, grades, subjects)
- Dashboard (document list)
- Navigation shell

**Acceptance criteria**: 14 criteria, all testable  
**Exit condition**: Can register → login → see dashboard  
**Tests**: Unit + integration tests, > 80% coverage  
**Deliverable**: Working web app at `http://localhost:3000`

**Key files created**:
- `apps/web/src/auth.config.ts` - Auth setup
- `apps/web/src/app/auth/*` - Auth pages
- `apps/web/src/app/api/auth/*` - Auth API routes
- Database migration: User + TeacherProfile tables
- Schema: `packages/schemas/src/auth.ts`

---

### Phase 2: Worksheet Generation with AI (2 weeks)
**File**: `.claude/phase-2-prompt.md`

**What gets built**:
- Worksheet creation form (multi-step)
- AI blueprint generation (Claude)
- AI question generation (with retry/validation)
- AI answer key generation
- Question editor UI
- Marks validation
- Token tracking & cost logging
- Background job processing (BullMQ)

**Acceptance criteria**: 14 criteria, AI-specific  
**Exit condition**: Teacher can generate 20-mark worksheet in < 30 seconds  
**Tests**: Unit + integration + prompt evals, > 80% coverage  
**Deliverable**: Working worksheet generator + editor

**Key files created**:
- `prompts/worksheet/blueprint.v1.md`
- `prompts/worksheet/questions.v1.md`
- `prompts/worksheet/answer-key.v1.md`
- `packages/ai/src/anthropic.ts` - Real AI implementation
- `apps/worker/src/jobs/worksheet.ts` - Background job
- Database tables: Question, GenerationJob, UsageRecord, AuditLog

---

### Phase 3: PDF Export & Print Layout (1 week)
**File**: `.claude/phase-3-prompt.md`

**What gets built**:
- A4 preview page (responsive layout)
- Print CSS (proper margins, page breaks)
- PDF generation via Playwright
- Page numbers, headers, footers
- Answer key formatting
- File storage (MinIO/local)
- Download links

**Acceptance criteria**: 14 criteria, print/PDF-specific  
**Exit condition**: Teacher can export print-ready PDF  
**Tests**: Layout tests, PDF generation tests, > 80% coverage  
**Deliverable**: PDF export working, file downloadable

**Key files created**:
- `packages/document-engine/src/worksheet-html.ts` - HTML generation
- `apps/web/src/app/api/worksheets/[id]/export/pdf/route.ts` - PDF API
- `apps/web/src/app/worksheet/[id]/preview/page.tsx` - Preview UI
- CSS for print layout (inline in HTML)

---

### Phase 4: Mobile App (React Native) (2 weeks)
**File**: `.claude/phase-4-prompt.md`

**What gets built**:
- iOS app (Expo)
- Android app (Expo)
- Email + Google login
- Worksheet creation form
- Question editor
- PDF preview + export
- Local SQLite database
- Background sync (queue changes when offline)
- Push notifications

**Acceptance criteria**: 14 criteria, mobile-specific  
**Exit condition**: App builds for iOS + Android, features work offline + online  
**Tests**: Unit + integration + E2E (Detox), > 80% coverage  
**Deliverable**: APK + IPA binaries, app store ready

**Key files created**:
- `apps/mobile/src/` - React Native app
- `packages/api-client/` - Shared TypeScript SDK
- Sync manager, local database schema
- Navigation (bottom tabs)
- Auth screens, worksheet form, editor

---

### Phase 5: Desktop App (Tauri) (1 week)
**File**: `.claude/phase-5-prompt.md`

**What gets built**:
- Windows desktop app
- macOS desktop app
- Linux desktop app
- Native titlebar + menu
- System tray integration
- Keyboard shortcuts (Cmd+S, Ctrl+N, etc.)
- File system access (save PDF to Documents)
- Auto-updates

**Acceptance criteria**: 14 criteria, desktop-specific  
**Exit condition**: App builds for Windows, macOS, Linux; features work  
**Tests**: File system tests, keyboard shortcut tests, > 80% coverage  
**Deliverable**: .exe, .dmg, .AppImage binaries

**Key files created**:
- `apps/desktop/src/` - Tauri app (React frontend)
- `apps/desktop/src-tauri/src/main.rs` - Rust backend
- File operations, system tray, menus
- Reuses web components (no duplication)

---

### Phase 6: Cloud Deployment (1 week)
**File**: `.claude/phase-6-prompt.md`

**What gets built**:
- Live production deployment (teacherpaper.app)
- PostgreSQL (Vercel)
- Redis (Upstash)
- Storage (Cloudflare R2)
- Job queue (QStash)
- CI/CD pipeline (auto-deploy on push to main)
- Monitoring + alerts (Sentry)
- Auto-scaling

**Acceptance criteria**: 9 criteria, deployment-specific  
**Exit condition**: App live at teacherpaper.app, all features working  
**Tests**: Health checks, integration tests against prod-like env  
**Deliverable**: Live production app

**Key files created**:
- `.github/workflows/deploy-production.yml` - CI/CD pipeline
- Environment configs (all secrets in Vercel dashboard, not in code)
- Rate limiting, security headers
- Monitoring + alerts setup

---

## How to Execute (Step by Step)

### Step 1: Universal Laws (ALWAYS)
Read and apply `UNIVERSAL_PROMPT_LAWS.md` to EVERY task:
- No narration
- Batch operations
- TypeScript strict
- All tests required
- Small commits

### Step 2: Run Phase Prompts (In Order)
```
Phase 1 → Auth + Dashboard (1 week)
  ↓
Phase 2 → Worksheet Generation + AI (2 weeks)
  ↓
Phase 3 → PDF Export (1 week)
  ↓
Phase 4 → Mobile App (2 weeks) [parallel with Phase 3]
  ↓
Phase 5 → Desktop App (1 week) [parallel with Phase 4]
  ↓
Phase 6 → Production Deploy (1 week)
```

### Step 3: Auto-Approval Setup
After Phase 1 is working:
- Implement `.claude/AUTO_APPROVAL_CONFIG.md`
- Enable auto-merge for CI-passing PRs
- No manual PR reviews needed (auto-approved if tests pass)

---

## Key Principles (From UNIVERSAL_PROMPT_LAWS)

### Token Efficiency
- No narration or summaries
- Batch file operations
- Reuse cached reads
- Minimal code comments

### Code Quality
- TypeScript strict mode (no `any`)
- Zod validation on all inputs
- Tests for every feature (> 80% coverage)
- No hardcoded secrets

### Database
- Additive migrations only
- Index critical fields (userId, status, createdAt)
- No N+1 queries
- Transactions for multi-step ops

### AI Integration
- Provider-agnostic interface
- Schema validation (Zod)
- Token tracking & cost logging
- Timeouts + retry logic
- User review before final approval

### Security
- Server-side auth only
- User data scoped by userId
- No PII in logs
- No student data in AI prompts
- Rate limiting prepared

### Git Workflow
- Small commits (one feature per commit)
- Feature branches (feature/name)
- PR to develop (never direct to main)
- Automated CI/CD (format → lint → type → test → build)

---

## File Structure (After All Phases)

```
teacher-paper-maker/
├── .claude/
│   ├── UNIVERSAL_PROMPT_LAWS.md      ← Read first, always apply
│   ├── AUTO_APPROVAL_CONFIG.md        ← Setup auto-PR approval
│   ├── PROMPTS_INDEX.md               ← This file
│   ├── phase-1-prompt.md              ← Auth + Dashboard
│   ├── phase-2-prompt.md              ← Worksheet AI generation
│   ├── phase-3-prompt.md              ← PDF export
│   ├── phase-4-prompt.md              ← Mobile app
│   ├── phase-5-prompt.md              ← Desktop app
│   └── phase-6-prompt.md              ← Production deploy
│
├── apps/
│   ├── web/                           ← Next.js web app (Phase 1-6)
│   ├── mobile/                        ← React Native app (Phase 4)
│   └── desktop/                       ← Tauri desktop app (Phase 5)
│
├── packages/
│   ├── database/                      ← Prisma schema + migrations
│   ├── schemas/                       ← Zod validation
│   ├── ai/                            ← AI provider interface + Claude adapter
│   ├── api-client/                    ← Shared TypeScript SDK
│   ├── document-engine/               ← PDF generation, validation
│   ├── storage/                       ← File storage abstraction
│   ├── config/                        ← Environment validation
│   └── ui/                            ← Shared React components
│
├── prompts/
│   ├── worksheet/
│   │   ├── blueprint.v1.md
│   │   ├── questions.v1.md
│   │   ├── answer-key.v1.md
│   │   └── validation.v1.md
│   └── shared-context.v1.md
│
├── tests/
│   ├── unit/                          ← Unit tests
│   ├── integration/                   ← Integration tests
│   ├── e2e/                           ← E2E tests (Playwright)
│   ├── prompt-evals/                  ← AI prompt evaluation
│   └── fixtures/                      ← Test data
│
├── docs/                              ← Already created in Phase 1
│   ├── product/
│   ├── architecture/
│   ├── security/
│   ├── testing/
│   └── operations/
│
├── docker-compose.yml                 ← Local dev stack
├── .github/workflows/                 ← CI/CD pipelines
│   ├── ci.yml                         ← PR checks
│   ├── deploy-production.yml          ← Auto-deploy to prod
│   └── auto-merge.yml                 ← Auto-approve + merge
│
├── .env.example                       ← Template (no secrets)
├── pnpm-workspace.yaml                ← Monorepo config
├── turbo.json                         ← Build orchestration
├── package.json                       ← Root scripts
└── CLAUDE.md                          ← Project config
```

---

## Estimated Timeline

| Phase | Duration | Effort | Dependencies |
|-------|----------|--------|--------------|
| 1 | 1 week | 40h | None |
| 2 | 2 weeks | 80h | Phase 1 |
| 3 | 1 week | 40h | Phase 2 |
| 4 | 2 weeks | 80h | Phase 1 (can run parallel with 3) |
| 5 | 1 week | 40h | Phase 1 (can run parallel with 4) |
| 6 | 1 week | 40h | Phases 1-5 |
| **Total** | **6-7 weeks** | **320h** | Sequential by dependencies |

---

## Success Criteria (Each Phase)

### Phase 1 ✅
- Can register → login → see dashboard
- All tests pass
- CI/CD green
- Zero TypeScript errors

### Phase 2 ✅
- Can generate worksheet in < 30 seconds
- All questions valid (Zod schema)
- Marks total correctly
- Answer key generated
- Token usage tracked
- > 80% test coverage

### Phase 3 ✅
- Can export A4 PDF
- PDF is print-ready
- Answer key formatted correctly
- Page breaks avoid orphans
- File stored in storage (MinIO/R2)

### Phase 4 ✅
- iOS app builds (Expo)
- Android app builds (Expo)
- All features work (login, create, export)
- Offline sync works (queue + pull)
- APK + IPA generated

### Phase 5 ✅
- Windows app builds
- macOS app builds
- Linux app builds
- All features work
- Keyboard shortcuts functional
- System tray works

### Phase 6 ✅
- App live at teacherpaper.app
- Database + Redis connected
- Storage (R2) working
- CI/CD auto-deploys on push to main
- Health checks passing
- Monitoring active

---

## NO QUESTIONS NEEDED

**Every prompt is self-contained, actionable, and complete.**

Just execute phase by phase. All acceptance criteria, tests, validation, and exit conditions are defined. No clarification questions needed.

**If anything is unclear**: Re-read the UNIVERSAL_PROMPT_LAWS. If still unclear, that's a bug in the prompt (not your fault).

---

## Immediate Next Step

```bash
cd /home/user/teachers-app

# Fix network issue (pnpm install)
# Then run Phase 1 prompt

# Once Phase 1 is done:
# - Commit and push to feature/phase-1-auth
# - Create PR to develop
# - CI runs automatically
# - Auto-merge when green (once AUTO_APPROVAL_CONFIG enabled)
# - Move to Phase 2
```

---

**Everything is ready. Just execute the phases. No approvals, no questions, full autopilot.**

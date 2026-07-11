# PHASE 1: Web App Foundation + Authentication

**Duration**: 1 week | **Lead**: Frontend + Backend agents | **No questions, full autopilot**

## Objective

Build a working Next.js web app with email + Google authentication, teacher profile setup, and a functional dashboard. First user can register, log in, configure preferences, see their documents.

## Acceptance Criteria

- [ ] Email registration (name, email, password)
- [ ] Email login with persistent session
- [ ] Google OAuth login (sign up + sign in)
- [ ] Password reset flow (email link)
- [ ] Teacher profile form (curriculum, grades, subjects, school name)
- [ ] Dashboard (lists documents, shows recent activity)
- [ ] Navigation shell (header with user menu, logout)
- [ ] Mobile-responsive design (375px+ works)
- [ ] All TypeScript strict, zero errors
- [ ] All tests pass (unit + integration)
- [ ] CI/CD pipeline green
- [ ] Docker Compose starts without errors
- [ ] PostgreSQL migrations apply cleanly
- [ ] App health endpoints respond
- [ ] No secrets in code or logs

## What to Build

### 1. Authentication Setup (Auth.js)

**Files to create/modify**:
- `apps/web/src/auth.config.ts` - Auth.js configuration
- `apps/web/src/app/auth/[...nextauth]/route.ts` - Auth API route
- `apps/web/src/middleware.ts` - Protect routes, session handling
- Update `.env.example` with `AUTH_SECRET`, auth provider IDs

**Implementation**:
- Email provider: Username = email, password hashed with bcryptjs
- Google OAuth: Get client ID/secret from Google Cloud Console (or use dummy for dev)
- Database: Store hashed passwords, never plaintext
- Session: HTTP-only cookies, 24h default expiry
- Logout: Clear session, redirect to login

**No third-party auth SDKs outside Auth.js** (keep vendor lock minimized).

### 2. Database Migrations

**Action**: Create first Prisma migration
```bash
# Locally (once pnpm install works):
pnpm db:migrate:dev --name init
```

**Migration should**:
- Create User table from schema
- Create TeacherProfile table
- Add indexes on email, userId
- Set up constraints
- Output: `packages/database/prisma/migrations/001_init/migration.sql`

**No test database yet** — use dev database, data will be cleared.

### 3. Auth Pages

**Create these Next.js App Router pages**:

#### `apps/web/src/app/auth/register/page.tsx`
- Form: email, name, password, confirm password, agree to terms
- Validation: Zod schema (email format, password 8+ chars, 1 uppercase, 1 number)
- Submit: POST to `/api/auth/register`
- Error handling: Show validation errors inline
- Success: Redirect to `/auth/login` with toast "Check your email"
- No login required

#### `apps/web/src/app/auth/login/page.tsx`
- Form: email, password, "Remember me" checkbox
- Submit: Sign in with Auth.js `signIn('credentials')`
- Google button: Sign in with Google
- Error: Show "Invalid credentials"
- Success: Redirect to `/dashboard`
- Already logged in? Redirect to `/dashboard`

#### `apps/web/src/app/auth/reset-password/page.tsx`
- Form: email
- Submit: POST to `/api/auth/reset-password-request`
- Response: "Check your email for reset link"
- Token valid 1 hour, sent via email

#### `apps/web/src/app/auth/reset-password/\[token\]/page.tsx`
- Form: new password, confirm password
- Validate token (must not be expired)
- Submit: POST to `/api/auth/reset-password-confirm`
- Success: Redirect to login "Password updated"

### 4. API Routes

**Create these Next.js API routes** (TypeScript, strict):

#### `POST /api/auth/register`
- Input: `{ email, name, password }`
- Validate with Zod (see schemas below)
- Check email not already registered
- Hash password with bcryptjs (salt 10)
- Create User record
- Create empty TeacherProfile
- Send welcome email (via Mailpit in dev)
- Return: `{ success: true, message: "Check email to verify" }`
- Error: `{ error: "Email already registered" }` (400)

#### `POST /api/auth/reset-password-request`
- Input: `{ email }`
- Find user by email
- Generate 32-char random token
- Store token in DB (temporary, expires in 1h) — use a password_reset table or add field
- Send reset link via email
- Return: `{ success: true }` (always, don't leak if email exists)

#### `POST /api/auth/reset-password-confirm`
- Input: `{ token, password }`
- Validate token (must exist, not expired)
- Hash new password
- Update User.password
- Delete token
- Return: `{ success: true }`
- Error: `{ error: "Token invalid or expired" }` (400)

#### `GET /api/auth/session`
- Returns current session user (public, no auth required yet)
- Response: `{ user: { id, email, name } | null }`

### 5. Teacher Profile Setup

#### `apps/web/src/app/onboarding/profile/page.tsx`
- Protected route (requires login, redirects if not)
- Form: school name, curriculum select, grade multi-select, subject multi-select
- Curriculum options: CBSE, ICSE, IB, UAE, IGCSE
- Grades: 1-12 checkboxes
- Subjects: English, Mathematics, Science, Social Studies, EVS, Hindi
- Save button: PUT to `/api/teacher/profile`
- Success: Redirect to `/dashboard`
- Can be edited later from `/settings/profile`

#### `PUT /api/teacher/profile`
- Requires auth
- Input: `{ schoolName?, preferredCurriculum?, preferredGrades[], preferredSubjects[] }`
- Validate: Curriculum in allowed list, grades 1-12, subjects exist
- Update TeacherProfile record
- Return: `{ success: true, profile: {...} }`

### 6. Dashboard

#### `apps/web/src/app/dashboard/page.tsx`
- Protected route
- Sections:
  - **Header**: "Welcome, [Name]" + quick stats (total sheets, used today)
  - **Create New**: Big button "New Worksheet" (links to `/worksheet/new`)
  - **Recent Documents**: Table (title, date, status, actions)
  - **Quick Actions**: Export, duplicate, delete (buttons per row)
- No documents? Show empty state with "Get Started" link
- Load from `GET /api/documents?limit=10&sort=recent`

#### `GET /api/documents`
- Query params: `limit=10`, `sort=recent|oldest|starred`
- Requires auth
- Return: `{ documents: [...], total: number, hasMore: boolean }`
- Each doc: `{ id, title, curriculum, grade, subject, status, createdAt, updatedAt }`
- Order by: createdAt DESC

### 7. Navigation Shell

#### `apps/web/src/components/AppShell.tsx`
- Header: Logo + title, search (future), user menu
- User Menu Dropdown:
  - Profile → `/settings/profile`
  - Settings → `/settings`
  - Logout → signOut()
- Sidebar (mobile collapse):
  - Dashboard → `/dashboard`
  - New Worksheet → `/worksheet/new`
  - Saved Templates → `/templates` (stub)
  - Settings → `/settings`
- Footer: Copyright, privacy, terms (links to static pages)

### 8. Styling & Components

**Use shadcn/ui components** (already in `packages/ui`):
- Button, Input, Select, Checkbox, Card, Alert, Dialog, DropdownMenu
- Tailwind CSS for layout + spacing
- Mobile-first responsive design
- Dark mode support (optional for Phase 1, but add dark: class support)

**Form styling**:
- Labels above inputs
- Error messages in red below field
- Focus states clear
- Loading state: button disabled, spinner

### 9. Environment & Config

**Update `.env.example`**:
```
# Auth
AUTH_SECRET="generate-random-string"
AUTH_GOOGLE_ID="google-oauth-client-id"
AUTH_GOOGLE_SECRET="google-oauth-secret"

# Email (for password reset, Mailpit)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_FROM="noreply@teacherpaper.local"

# Other existing vars remain
```

**`packages/config/src/index.ts`**: Extend validation to include AUTH_SECRET

### 10. Database Schemas (Zod)

**Create `packages/schemas/src/auth.ts`**:
```ts
export const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

export const TeacherProfileSchema = z.object({
  schoolName: z.string().max(200).optional(),
  preferredCurriculum: z.enum(SUPPORTED_CURRICULA).optional(),
  preferredGrades: z.array(z.enum(SUPPORTED_GRADES)).optional(),
  preferredSubjects: z.array(z.enum(SUPPORTED_SUBJECTS)).optional(),
});
```

### 11. Testing

**Unit tests** (`tests/unit/`):
- Auth schemas (valid/invalid inputs)
- Password validation
- Email validation

**Integration tests** (`tests/integration/`):
- User registration (happy path)
- User registration (duplicate email, invalid password)
- Email login
- Google OAuth flow (mock)
- Password reset request + confirm
- Teacher profile update

**E2E tests** (Playwright, `tests/e2e/`):
- Register → Login → Dashboard
- Email reset password flow
- Google login

**Coverage**: > 80% on auth routes

### 12. Email Templates

**Create `apps/web/src/emails/`**:
- `welcome.tsx` - Welcome email after registration
- `reset-password.tsx` - Password reset link
- `verification.tsx` - Email verification (optional Phase 1)

Use React Email or simple HTML templates. Send via nodemailer + Mailpit in dev.

### 13. Migrations

Run migrations:
```bash
pnpm db:migrate
```

Verify tables exist in database.

### 14. CI/CD

Update `.github/workflows/ci.yml`:
- Add `NODE_ENV=test`
- Add DATABASE_URL for test
- Run `pnpm test:integration` with PostgreSQL service
- Ensure auth tests pass

### What NOT to Do

- ❌ Do NOT add student management
- ❌ Do NOT build worksheet generation yet
- ❌ Do NOT add payment/subscriptions
- ❌ Do NOT implement full audit logging (basic auth logs only)
- ❌ Do NOT use session storage (HTTP-only cookies only)
- ❌ Do NOT expose passwords in responses
- ❌ Do NOT forget TypeScript types on all functions
- ❌ Do NOT skip error handling
- ❌ Do NOT commit real secrets

## Steps to Execute (In Order)

### 1. Database Layer (No questions)
- Modify Prisma schema to add PasswordResetToken table
- Run migration
- Verify tables in psql

### 2. Auth Config
- Create `apps/web/src/auth.config.ts`
- Set up Auth.js with email + Google providers
- Create middleware.ts for route protection

### 3. Auth API Routes
- `/api/auth/register` (POST)
- `/api/auth/reset-password-request` (POST)
- `/api/auth/reset-password-confirm` (POST)
- `/api/auth/session` (GET)
- `/api/teacher/profile` (PUT)
- `/api/documents` (GET)

### 4. Auth Pages
- Register page
- Login page
- Reset password pages (request + confirm)
- Onboarding profile page

### 5. Dashboard
- Dashboard page
- Document list component
- Empty state

### 6. Navigation
- AppShell component
- Integrate into layout

### 7. Styling
- Apply Tailwind + shadcn/ui
- Test mobile responsiveness (DevTools)

### 8. Testing
- Write all test files
- Achieve > 80% coverage
- All tests pass

### 9. Build & Verify
- `pnpm format`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm docker:up`
- `pnpm db:migrate`
- `pnpm dev` (start app, verify http://localhost:3000 loads)

### 10. Commit
- Small, focused commits (one feature per commit)
- Push to `feature/phase-1-auth` branch
- Create PR to `develop`

## Validation Checklist (Verify Locally)

- [ ] `pnpm install` succeeds (once network fixed)
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` shows zero errors
- [ ] `pnpm typecheck` shows zero errors
- [ ] `pnpm test:unit` all pass
- [ ] `pnpm test:integration` all pass
- [ ] Docker Compose starts: `pnpm docker:up`
- [ ] PostgreSQL health check: `docker-compose ps postgres` (healthy)
- [ ] Redis health check: `docker-compose ps redis` (healthy)
- [ ] DB migrations applied: `pnpm db:migrate`
- [ ] Web app starts: `pnpm dev` → http://localhost:3000 loads
- [ ] Health endpoint: `curl http://localhost:3000/api/health` → `{status: ok}`
- [ ] Register flow works: fill form → submit → email sent to Mailpit
- [ ] Login flow works: email + password → dashboard loads
- [ ] Dashboard empty state shows when no docs
- [ ] Mobile view works: DevTools 375px width loads, nav collapses
- [ ] User menu dropdown works: click user avatar → dropdown appears
- [ ] Logout works: click logout → redirects to login
- [ ] Protected routes work: access `/dashboard` without auth → redirects to `/auth/login`
- [ ] CI passes on GitHub Actions

## Exit Criteria (Phase 1 is DONE when)

1. ✅ All 14 acceptance criteria met
2. ✅ All tests pass (> 80% coverage)
3. ✅ Zero TypeScript errors
4. ✅ Zero ESLint errors
5. ✅ Zero Prettier formatting issues
6. ✅ Docker Compose health checks pass
7. ✅ Can register → login → see dashboard
8. ✅ Password reset email flow works
9. ✅ PR merged to `develop`
10. ✅ CI/CD pipeline green

---

**CRITICAL**: Follow UNIVERSAL_PROMPT_LAWS.md on EVERY file, EVERY commit. No exceptions.

**NO QUESTIONS TO USER. This prompt is complete. Execute it.**

# Teacher Paper Maker — Project Config

Monorepo (pnpm + Turborepo) for an AI-assisted worksheet/paper generator for teachers.
Phase 1 delivers the web app foundation: authentication, teacher profile, dashboard.

## Layout

- `apps/web` — Next.js 15 App Router web app (`@tpm/web`)
- `packages/config` — env validation (`@tpm/config`)
- `packages/schemas` — Zod schemas + shared domain constants (`@tpm/schemas`)
- `packages/database` — Prisma schema, client, migrations (`@tpm/database`)
- `packages/ui` — shared React/shadcn components + Tailwind preset (`@tpm/ui`)
- `tests/` — unit, integration, e2e (Playwright)

Internal packages export TypeScript source directly (Turborepo "internal packages"
pattern) and are compiled by consumers via `transpilePackages` / Vitest.

## Commands (run from repo root)

```
pnpm install
pnpm docker:up            # postgres + redis + mailpit (if Docker available)
pnpm db:migrate:dev       # create/apply local migrations
pnpm db:generate          # regenerate Prisma client
pnpm dev                  # start web app on http://localhost:3000
pnpm format / pnpm lint / pnpm typecheck / pnpm build
pnpm test:unit / pnpm test:integration / pnpm test:e2e
```

## Conventions

Follow `.claude/UNIVERSAL_PROMPT_LAWS.md`: TypeScript strict (no `any`), Zod on every
API input, env-driven config (no hardcoded secrets), server-side auth via httpOnly
cookies, user data scoped by `userId`, additive migrations, small atomic commits.

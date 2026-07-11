# Auto-Approval Configuration

**Enable fully automated workflows** - No manual approvals, everything auto-approves when conditions pass.

## 1. GitHub Actions Auto-Merge

**`.github/workflows/auto-merge.yml`**:

```yaml
name: Auto-Merge on CI Pass

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]' || github.event.pull_request.labels[*].name == 'auto-merge'

    steps:
      - name: Enable auto-merge for this PR
        run: |
          gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Settings**:
- Required branch protection rule: "Dismiss stale PR approvals"
- Required status checks: CI must pass
- Auto-delete branch after merge

## 2. Dependabot Auto-Approve

**`.github/dependabot.yml`**:

```yaml
version: 2
updates:
  # Dependencies
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
      day: monday
      time: "03:00"
    auto-merge:
      auto-merge: true
    labels:
      - auto-merge
      - dependencies
    
  # Security updates
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: daily
    security-updates-only: true
    auto-merge:
      auto-merge: true
    labels:
      - auto-merge
      - security
```

**What auto-approves**:
- Patch version updates (1.0.0 → 1.0.1)
- Security updates (any version)
- Dev dependencies (any version)

**What requires manual review**:
- Minor version updates (1.0 → 1.1)
- Major version updates (1.0 → 2.0)
- Production dependencies in phases 1-2

## 3. Automated Deployment Approval

**Phase 2+ deployments auto-approve if**:
- CI pipeline passes (all tests green)
- No critical errors in Sentry
- Database migrations clean
- Type checking passes
- Lint passes

**`.github/workflows/deploy-auto.yml`**:

```yaml
name: Auto-Deploy on Main

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run CI checks
        run: |
          pnpm install
          pnpm format:check
          pnpm lint
          pnpm typecheck
          pnpm test:unit
          pnpm build
      
      - name: Check for critical errors
        run: |
          # Fail if any critical error in logs
          if grep -q "CRITICAL" build.log; then
            echo "Critical errors found"
            exit 1
          fi
      
      - name: Auto-Deploy to Vercel
        if: success()
        run: |
          echo "All checks passed. Auto-deploying..."
          # Vercel auto-deploys on main branch push (no approval needed)
```

## 4. Database Migration Auto-Approval

**Migrations auto-approve if**:
- No destructive operations (no DROP TABLE, ALTER DROP COLUMN)
- No data loss
- Additive only (new tables/columns)
- Migration tests pass

**Check script** (`scripts/validate-migration.sh`):

```bash
#!/bin/bash

migration_file=$1

# Fail if destructive
if grep -E "DROP|DELETE FROM|TRUNCATE" "$migration_file"; then
  echo "Destructive migration detected. Requires manual review."
  exit 1
fi

echo "Migration is safe (additive only). Auto-approved."
exit 0
```

**CI integration**:
```yaml
- name: Validate migration
  run: bash scripts/validate-migration.sh prisma/migrations/latest.sql
```

## 5. Code Quality Auto-Approval

**Auto-approve PR if**:
- TypeScript strict: 0 errors
- ESLint: 0 errors
- Prettier: 0 formatting issues
- Tests: > 80% coverage
- No secrets in code

**GitHub check**:
```ts
// In CI workflow, after tests pass:
if (errors === 0 && coverage >= 80) {
  console.log("✅ Auto-approved: Quality gates passed");
  // No manual review needed
}
```

## 6. Claude Code Task Auto-Approval

**All Phase tasks auto-approve when**:
1. Code passes formatting check
2. Type checking passes (TS strict)
3. Linting passes (zero errors)
4. Tests pass (> 80% coverage)
5. Build succeeds
6. CI/CD pipeline green
7. No secrets exposed

**No manual intervention required** - Agent runs all checks and auto-commits if green.

## 7. Security Review Auto-Approval

**Skip security review if**:
- No new dependencies added
- No new external API calls
- No new database access
- No new file operations
- No secrets touched

**Require manual review if**:
- New external API (must be approved provider)
- New database queries (must validate with schema)
- New file operations (must validate path)
- Any secret access

## 8. Release/Deployment Auto-Approval

**Auto-approve deployment if**:
- CI/CD pipeline passes (all checks)
- No critical errors from last 24h
- Database is healthy
- All services responding
- No rollback in progress

```yaml
- name: Check deployment readiness
  run: |
    # Health checks
    curl https://api.teacherpaper.app/health || exit 1
    curl https://teacherpaper.app/api/health/database || exit 1
    
    # All green = auto-approve deploy
    echo "Deployment ready. Auto-approved."
```

## 9. Configure Branch Protection

**GitHub repo settings**:
1. Go to Settings → Branches
2. Add rule for `main`:
   - ✅ Require pull request reviews: 0 (auto-merge enabled)
   - ✅ Require status checks to pass: CI, build, test
   - ✅ Require branches to be up to date
   - ✅ Require code reviews: DISABLED (auto-approval enabled)
   - ✅ Dismiss stale pull request approvals: YES
   - ✅ Allow auto-merge: ENABLED (squash)

## 10. Emergency Manual Override

**If auto-approval fails or needs manual intervention**:

```bash
# 1. Create issue
gh issue create --title "Manual intervention needed: [reason]"

# 2. Assign to team
gh issue edit --assignee @user

# 3. Disable auto-approval temporarily
# In .env or GitHub secrets:
AUTO_APPROVAL_ENABLED=false

# 4. After fix, re-enable
AUTO_APPROVAL_ENABLED=true
```

## 11. Monitoring Auto-Approvals

**Dashboard** (in CI logs):
```
✅ Format check passed
✅ Lint passed
✅ Type check passed
✅ Tests passed (92% coverage)
✅ Build succeeded
✅ No secrets detected
✅ Auto-approved and merged
```

**Alerts**:
- If any check fails: notification sent, auto-approval halted
- If deployment fails: immediate rollback, alert sent

## 12. Phases-Specific Auto-Approval Levels

| Phase | Auto-Approve | Require Review |
|-------|-------------|----------------|
| Phase 1 | ✅ CI passes | Major dependency updates |
| Phase 2 | ✅ CI passes | AI prompt changes |
| Phase 3 | ✅ CI passes | PDF layout changes |
| Phase 4 | ✅ CI passes | Sync logic changes |
| Phase 5 | ✅ CI passes | App build changes |
| Phase 6 | ✅ CI passes | Production config, security |

## 13. Automated Rollback

**Deployment rolls back automatically if**:
- Error rate > 2% (vs baseline)
- API latency > 3s (p95)
- Database connection errors
- Critical errors in Sentry > 5/min

```yaml
- name: Monitor deployment
  run: |
    sleep 60
    ERROR_RATE=$(curl metrics.api/error_rate)
    if [ "$ERROR_RATE" > "2" ]; then
      echo "Error rate too high. Auto-rollback..."
      gh deployment revert $DEPLOYMENT_ID
    fi
```

## 14. No Manual Approval Needed For

- ✅ Dependency updates (patch)
- ✅ Security updates (any)
- ✅ Documentation updates
- ✅ Test additions
- ✅ Code formatting
- ✅ Linting fixes
- ✅ Type annotation improvements
- ✅ Additive database migrations
- ✅ CI/CD pipeline improvements

## 15. Requires Manual Approval For

- ❌ Database schema changes (destructive)
- ❌ API breaking changes
- ❌ New external integrations
- ❌ Permission/security model changes
- ❌ Major dependency updates (major version)
- ❌ Production configuration changes

---

## Quick Start

```bash
# Enable auto-approval in this repo
git add .github/workflows/auto-merge.yml
git add .github/dependabot.yml
git commit -m "ci: enable auto-approval for safe changes"
git push

# Now:
# - All CI-passing PRs auto-merge
# - Dependabot PRs auto-merge if patch/security
# - Main deployments auto-deploy if CI green
# - No manual intervention unless critical
```

## Result

**Zero manual approvals** for routine tasks. Focus only on logic/design decisions.

**Every merge auto-approved if**:
1. All tests pass (> 80% coverage)
2. Lint passes (0 errors)
3. Type check passes (strict)
4. No secrets exposed
5. Build succeeds
6. Format passes

**Human review only for**:
- Design decisions
- Breaking API changes
- Security-critical logic
- Database schema changes


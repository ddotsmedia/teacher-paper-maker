# PHASE 6: Cloud Deployment (Production)

**Duration**: 1 week | **Lead**: DevOps Agent | **No questions, full autopilot**

**Prerequisite**: Phase 1-5 complete, all features working locally

## Objective

Deploy Teacher Paper Maker to production cloud: web app, worker, database, storage, monitoring. Accessible at teacherpaper.app. Auto-scaling, monitoring, backups, CI/CD pipeline.

## Architecture

```
┌──────────────────────────────────────────────┐
│            Cloudflare / DNS                   │
│         teacherpaper.app → 1.2.3.4           │
└──────────────────┬───────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Next.js on Vercel  │ (Web app)
        │  Auto-deploy from   │
        │  git push to main   │
        └─────────┬───────────┘
                  │
        ┌─────────▼──────────┐
        │   API routes in    │
        │ Next.js (no Node   │
        │ separate server)   │
        └─────────┬──────────┘
        ┌────────▼─────────────┐
        │ Vercel Postgres      │ (Database)
        │ (managed PostgreSQL) │
        └──────────┬───────────┘
        ┌──────────▼────────┐
        │  Upstash Redis    │ (Cache + Jobs)
        │ (managed Redis)   │
        └──────────┬────────┘
        ┌──────────▼────────────┐
        │  Cloudflare R2        │ (PDF storage)
        │  (S3-compatible)      │
        └──────────┬────────────┘
        ┌──────────▼──────────────┐
        │   QStash / BullMQ       │ (Job queue)
        │   (serverless jobs)     │
        └────────────────────────┘
```

**Why this stack**:
- **Vercel**: Zero-config Next.js deployment, auto-scaling, global CDN
- **Vercel Postgres**: Managed DB, backups, scaling
- **Upstash Redis**: Managed Redis, global coverage
- **Cloudflare R2**: Cheap storage ($0.015/GB), S3-compatible
- **QStash**: Serverless job queue (no separate worker server needed)

## What to Build

### 1. Environment Configuration

**`.env.production`** (secrets managed by Vercel):
```
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# AI
ANTHROPIC_API_KEY=sk-...

# Auth
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

# Storage
STORAGE_TYPE=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=teacherpaper-pdfs

# Job Queue
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
```

**Vercel dashboard**: Set all env vars (secrets never in code)

### 2. Database Migrations (Production)

**Before deploying**:
```bash
# Ensure all migrations run
pnpm db:migrate:deploy
```

**Vercel Postgres**:
- Automatic backups (7-day retention)
- Point-in-time recovery
- Read replicas for scaling

### 3. API Routes for Job Processing

Move BullMQ jobs to QStash (serverless):

**`apps/web/src/app/api/jobs/generate-worksheet/route.ts`**:

```ts
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export async function POST(req: NextRequest) {
  const { userId, spec, documentId } = await req.json();
  
  // Enqueue job via QStash
  await qstash.publishJSON({
    api: {
      name: "generateWorksheet",
      baseUrl: "https://teacherpaper.app",
    },
    body: { userId, spec, documentId },
  });
  
  return Response.json({ success: true });
}

// Handler for QStash callbacks
export async function handleGenerateWorksheet(req: NextRequest) {
  const { userId, spec, documentId } = await req.json();
  
  // Same logic as worker job
  try {
    // Generate blueprint, questions, answer key
    // Save to database
    // Update GenerationJob status
  } catch (error) {
    // Retry will be handled by QStash
    throw error;
  }
}
```

### 4. Storage Configuration

**Setup Cloudflare R2**:
```bash
# Create R2 bucket
# Get access keys (secret)
# Store in Vercel env vars
```

**Update storage provider**:
```ts
// packages/storage/src/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export class R2StorageProvider implements StorageProvider {
  private s3: S3Client;
  
  constructor() {
    this.s3 = new S3Client({
      region: "auto",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  
  async upload(key: string, content: Buffer): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: content,
    }));
    
    return `https://r2.teacherpaper.app/${key}`;
  }
}
```

### 5. Logging & Monitoring

**Structured logging** (already prepared in codebase):

```ts
// packages/config/src/logging.ts
export function initializeLogging() {
  if (process.env.NODE_ENV === 'production') {
    // Sentry for error tracking
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1,
    });
  }
}
```

**Health checks**:
- `/api/health` - App health
- `/api/health/database` - DB connection
- `/api/health/redis` - Redis connection
- `/api/health/storage` - Storage access

### 6. CI/CD Pipeline (GitHub Actions)

**`.github/workflows/deploy-production.yml`**:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Format check
        run: pnpm format:check
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Test
        run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Build
        run: pnpm build
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
      
      - name: Deploy to Vercel
        uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

### 7. Database Backup Strategy

- **Automated**: Daily backups via Vercel Postgres (7 days retention)
- **Manual**: Run before major releases
- **Testing**: Restore to staging monthly

### 8. Rate Limiting & DDoS Protection

**Vercel + Cloudflare**:
- Automatic DDoS protection via Cloudflare
- Rate limiting per IP/user

**API rate limits** (in Next.js):
```ts
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});

export async function POST(req: NextRequest) {
  const identifier = req.ip || "anonymous";
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }
  
  // Process request
}
```

### 9. Security Headers

**`apps/web/next.config.js`**:

```js
const headers = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
];

export default {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};
```

### 10. Domain & SSL

- **Domain**: teacherpaper.app (via Namecheap/Route53)
- **DNS**: Cloudflare (managed DNS, DDoS protection)
- **SSL**: Automatic via Vercel/Cloudflare

**DNS Records**:
```
teacherpaper.app A → Vercel IP
www.teacherpaper.app CNAME → teacherpaper.app
api.teacherpaper.app CNAME → teacherpaper.app
```

### 11. Staging Environment

**Staging deployment** (separate Vercel project):
- Mirrors production setup
- Manual testing before prod deploy
- Database: Separate Vercel Postgres instance

### 12. Monitoring & Alerts

**Tools**:
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance monitoring
- **Upstash Redis**: Job queue monitoring
- **PagerDuty**: Alert routing (optional)

**Alert triggers**:
- Error rate > 1%
- API latency > 2s (p95)
- Database connection errors
- Job queue backup (> 100 pending)

### 13. Scaling Strategy

**Auto-scaling (Vercel)**:
- Automatic for web app (pay-as-you-go)
- No manual intervention needed

**Database scaling**:
- Vercel Postgres: Automatic read replicas at high load
- Manual: Upgrade plan if needed

**Job queue**:
- QStash: Serverless, auto-scales
- No worker servers to manage

### 14. Cost Optimization

**Expected monthly costs** (rough estimates):
- Vercel: $20-50 (Next.js hosting)
- Vercel Postgres: $30-100 (database)
- Upstash Redis: $10-30 (cache)
- Cloudflare R2: $0.50-5 (storage, very cheap)
- QStash: $10-50 (jobs)
- **Total**: ~$70-250/month for MVP

### What NOT to Do

- ❌ Do NOT use unmanaged servers (too complex for MVP)
- ❌ Do NOT store PDFs in database (use R2)
- ❌ Do NOT manually manage SSL certificates
- ❌ Do NOT skip monitoring setup
- ❌ Do NOT deploy without health checks
- ❌ Do NOT hardcode secrets in config files

## Steps to Execute

### 1. Cloud Accounts Setup
- Create Vercel account
- Create Upstash account (Redis)
- Create Cloudflare account
- Create Cloudflare R2 bucket

### 2. Environment Variables
- Add all secrets to Vercel dashboard
- Never commit .env.production

### 3. Database Setup
- Create Vercel Postgres database
- Run migrations
- Verify connection

### 4. Storage Setup
- Create R2 bucket
- Configure CORS
- Test upload/download

### 5. Job Queue Setup
- Get QStash token
- Configure API routes for job handling
- Test job processing

### 6. CI/CD Configuration
- Push deploy workflow to GitHub
- Add secrets (Vercel token, org ID, project ID)
- Test deploy on non-main branch first

### 7. Domain Setup
- Register domain
- Point to Cloudflare
- Add DNS records
- Enable SSL

### 8. Monitoring Setup
- Connect Sentry
- Configure alerts
- Test error tracking

### 9. Deploy to Staging
- Create staging Vercel project
- Deploy, test thoroughly
- Verify all features work

### 10. Deploy to Production
- Merge to main
- GitHub Actions triggers deploy
- Verify at teacherpaper.app

## Validation Checklist

- [ ] Web app loads on teacherpaper.app
- [ ] Health endpoints respond
- [ ] Database connection works
- [ ] Redis connection works
- [ ] PDF storage (R2) works
- [ ] Can register + login
- [ ] Can create worksheet
- [ ] Can export PDF
- [ ] PDF stored in R2
- [ ] Jobs processed via QStash
- [ ] Error tracking works (Sentry)
- [ ] SSL certificate valid
- [ ] Rate limiting works
- [ ] Monitoring alerts configured
- [ ] Staging environment works
- [ ] Auto-deploy works (push to main → deployed)
- [ ] All tests green in CI

## Exit Criteria (Phase 6 DONE when)

1. ✅ App live on teacherpaper.app (production)
2. ✅ All features working (auth, worksheet, export)
3. ✅ Database backed up automatically
4. ✅ Logging & monitoring active
5. ✅ SSL certificate valid
6. ✅ CI/CD pipeline auto-deploys
7. ✅ Staging environment mirrors production
8. ✅ Health checks pass
9. ✅ Rate limiting active

---

**CRITICAL**: Never commit secrets. All env vars managed by Vercel. No manual deployments (CI/CD only).

**EXECUTE WITHOUT ASKING.**

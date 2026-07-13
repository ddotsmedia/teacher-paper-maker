#!/bin/bash
set -e

echo "🚀 Deploying Teacher Paper Maker to VPS..."

# Load environment
if [ ! -f .env.prod ]; then
  echo "❌ .env.prod not found. Create it with:"
  echo "   DOMAIN=your-domain.com"
  echo "   DB_PASSWORD=secure-password"
  echo "   REDIS_PASSWORD=secure-password"
  echo "   NEXTAUTH_SECRET=secure-secret"
  echo "   ANTHROPIC_API_KEY=sk-ant-..."
  echo "   AWS_REGION=us-east-1"
  echo "   AWS_ACCESS_KEY_ID=..."
  echo "   AWS_SECRET_ACCESS_KEY=..."
  echo "   AWS_S3_BUCKET=tpm-docs"
  echo "   SENTRY_DSN=..."
  exit 1
fi

source .env.prod

echo "📦 Pulling latest code..."
git pull origin main

echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ Database migrations..."
docker-compose -f docker-compose.prod.yml exec -T web pnpm db:migrate:deploy

echo "✅ Deployment complete!"
echo ""
echo "Services running:"
echo "  Web:      https://\"
echo "  API:      https://\/api"
echo "  Postgres: localhost:5432"
echo "  Redis:    localhost:6379"
echo ""
echo "Logs: docker-compose -f docker-compose.prod.yml logs -f"

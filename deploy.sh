#!/bin/bash
# Cloudflare Pages 자동 배포 스크립트

echo "🚀 Deploying to Cloudflare Pages..."

CLOUDFLARE_API_TOKEN="qFxtERdmxMGEq66t_0QdcHPQXStFw9FT7OKaClve" \
  npx wrangler pages deploy . --project-name=maruschedule

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
  echo "🌐 Production: https://maruschedule.pages.dev"
else
  echo "❌ Deployment failed!"
  exit 1
fi

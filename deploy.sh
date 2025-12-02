#!/bin/bash

# ===========================================
# Shift Schedule Management System
# Auto Deploy Script for GitHub Pages
# ===========================================

echo "🚀 Starting deployment process..."

# 사용자 설정 (여기만 수정하세요!)
GITHUB_USERNAME="your-username"  # GitHub 아이디
REPO_NAME="shift-scheduler"
TOKEN=""  # 여기에 Personal Access Token 붙여넣기 (절대 공유 금지!)

# 토큰 확인
if [ -z "$TOKEN" ]; then
    echo "❌ Error: GitHub Personal Access Token이 설정되지 않았습니다."
    echo "📝 deploy.sh 파일에서 TOKEN 변수를 설정해주세요."
    exit 1
fi

echo "✅ Configuration loaded"

# Git 초기화 확인
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
fi

# 원격 저장소 설정
REMOTE_URL="https://${TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
if git remote | grep -q origin; then
    echo "🔄 Updating remote origin..."
    git remote set-url origin $REMOTE_URL
else
    echo "🔗 Adding remote origin..."
    git remote add origin $REMOTE_URL
fi

# 스테이징
echo "📁 Adding files..."
git add .

# 커밋
COMMIT_MSG="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
echo "💾 Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# 푸시
echo "⬆️  Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🌐 Your site will be live at:"
    echo "   https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"
    echo ""
    echo "⏳ GitHub Pages may take 1-2 minutes to update."
    echo "📝 Don't forget to enable GitHub Pages in repository settings:"
    echo "   https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/settings/pages"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "💡 Check the error message above."
fi

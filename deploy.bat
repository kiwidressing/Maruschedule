@echo off
REM ===========================================
REM Shift Schedule Management System
REM Auto Deploy Script for GitHub Pages (Windows)
REM ===========================================

echo 🚀 Starting deployment process...

REM 사용자 설정 (여기만 수정하세요!)
SET GITHUB_USERNAME=your-username
SET REPO_NAME=shift-scheduler
SET TOKEN=

REM 토큰 확인
IF "%TOKEN%"=="" (
    echo ❌ Error: GitHub Personal Access Token이 설정되지 않았습니다.
    echo 📝 deploy.bat 파일에서 TOKEN 변수를 설정해주세요.
    pause
    exit /b 1
)

echo ✅ Configuration loaded

REM Git 초기화 확인
IF NOT EXIST .git (
    echo 📦 Initializing Git repository...
    git init
    git branch -M main
)

REM 원격 저장소 설정
SET REMOTE_URL=https://%TOKEN%@github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
git remote | findstr origin >nul
IF %ERRORLEVEL% EQU 0 (
    echo 🔄 Updating remote origin...
    git remote set-url origin %REMOTE_URL%
) ELSE (
    echo 🔗 Adding remote origin...
    git remote add origin %REMOTE_URL%
)

REM 스테이징
echo 📁 Adding files...
git add .

REM 커밋
FOR /F "tokens=*" %%i IN ('powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') DO SET TIMESTAMP=%%i
SET COMMIT_MSG=Deploy: %TIMESTAMP%
echo 💾 Committing: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

REM 푸시
echo ⬆️  Pushing to GitHub...
git push -u origin main

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Deployment successful!
    echo 🌐 Your site will be live at:
    echo    https://%GITHUB_USERNAME%.github.io/%REPO_NAME%/
    echo.
    echo ⏳ GitHub Pages may take 1-2 minutes to update.
    echo 📝 Don't forget to enable GitHub Pages in repository settings:
    echo    https://github.com/%GITHUB_USERNAME%/%REPO_NAME%/settings/pages
) ELSE (
    echo.
    echo ❌ Deployment failed!
    echo 💡 Check the error message above.
)

pause

@echo off
REM ============================================
REM Shift Schedule Management System
REM File Download & Setup Script (Windows)
REM ============================================

echo 🚀 Shift Schedule Management System - File Setup
echo ================================================
echo.

REM 다운로드 위치 설정
SET DOWNLOAD_DIR=%USERPROFILE%\Desktop\shift-scheduler

echo 📁 Creating project directory: %DOWNLOAD_DIR%
mkdir "%DOWNLOAD_DIR%" 2>nul
mkdir "%DOWNLOAD_DIR%\css" 2>nul
mkdir "%DOWNLOAD_DIR%\js" 2>nul

cd /d "%DOWNLOAD_DIR%"

echo ✅ Directories created successfully!
echo.
echo 📝 Now you need to manually copy the file contents:
echo.
echo Please copy and paste the following files from the chat:
echo.
echo Root files:
echo   1. index.html
echo   2. README.md
echo   3. .gitignore
echo   4. DEPLOYMENT.md
echo   5. DEPLOY_GUIDE.md
echo   6. deploy.sh
echo   7. deploy.bat
echo.
echo CSS files:
echo   8. css\style.css
echo.
echo JS files:
echo   9.  js\auth.js
echo   10. js\database.js
echo   11. js\shift-manager.js
echo   12. js\export.js
echo   13. js\app.js
echo.
echo 📂 Opening project folder: %DOWNLOAD_DIR%
echo.
echo Next steps:
echo 1. Copy file contents from the chat interface
echo 2. Create each file with Notepad
echo 3. Paste the contents
echo 4. Save As - Encoding: UTF-8
echo.
echo Or use the file download feature if available in your interface!

REM 폴더 열기
start "" "%DOWNLOAD_DIR%"

pause

@echo off
echo 🚀 Starting deployment with version control...
echo.

REM Check if Git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

REM Check if we're in a Git repository
git status >nul 2>&1
if errorlevel 1 (
    echo ❌ Not a Git repository. Initializing...
    git init
    echo ⚠️ Please add your GitHub remote:
    echo    git remote add origin https://github.com/yourusername/yourrepo.git
    echo    Then run this script again.
    pause
    exit /b 1
)

REM Get current timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,4%-%dt:~4,2%-%dt:~6,2% %dt:~8,2%:%dt:~10,2%:%dt:~12,2%"

echo 📋 Staging all changes...
git add .

echo 📝 Committing changes...
git commit -m "Deploy: %timestamp%"

echo 🚀 Pushing to GitHub...
git push origin main

echo 🚀 Deploying to Vercel...
npx vercel --prod

echo.
echo 🎉 Deployment completed successfully!
echo 📝 Commit: Deploy: %timestamp%
echo 🔗 Check your GitHub repository for the latest changes
pause 
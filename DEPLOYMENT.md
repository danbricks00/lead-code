# Deployment Guide with Version Control

This project now includes automatic version control with GitHub integration.

## 🚀 Quick Deployment Options

### Option 1: Full Deployment with Version Control (Recommended)
```bash
npm run deploy
```
This will:
- ✅ Stage all changes
- ✅ Commit with timestamp
- ✅ Push to GitHub
- ✅ Deploy to Vercel

### Option 2: Windows Batch File
```bash
deploy.bat
```
Double-click the `deploy.bat` file or run it from command prompt.

### Option 3: Simple Vercel Deployment (No Git)
```bash
npm run deploy:simple
```
This only deploys to Vercel without Git operations.

### Option 4: Git Only (No Deployment)
```bash
npm run commit
```
This only commits and pushes to GitHub without deploying.

## 🔧 Setup Instructions

### 1. Initialize Git Repository (if not already done)
```bash
git init
git remote add origin https://github.com/yourusername/yourrepo.git
```

### 2. First Time Setup
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 3. Configure Git (if not already done)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 📋 What Gets Committed

The deployment script automatically:
- Stages all changed files
- Creates a commit with timestamp
- Lists changed files in commit message
- Pushes to your GitHub repository
- Deploys to Vercel

## 🔍 Commit Messages Format

```
Deploy: 2025-08-10T14-30-45

Changed files:
- api/send-to-sheets.js
- package.json
- vercel.json
- ... and 5 more files
```

## 🛠️ Troubleshooting

### Git Not Found
- Install Git from https://git-scm.com/
- Add Git to your system PATH

### Remote Repository Not Configured
```bash
git remote add origin https://github.com/yourusername/yourrepo.git
```

### Push Fails
- Check your GitHub credentials
- Ensure you have write access to the repository
- Try: `git push -u origin main`

### Vercel Deployment Fails
- Check your Vercel credentials
- Ensure environment variables are set
- Check Vercel dashboard for errors

## 📁 Files Added

- `deploy-and-commit.js` - Main deployment script
- `deploy.bat` - Windows batch file
- `DEPLOYMENT.md` - This guide
- Updated `package.json` with deployment scripts

## 🎯 Benefits

✅ **Version Control** - All changes are tracked in Git  
✅ **Backup** - Code is safely stored on GitHub  
✅ **Collaboration** - Easy to share and collaborate  
✅ **Rollback** - Can revert to previous versions  
✅ **History** - Complete change history with timestamps  
✅ **Automation** - One command does everything  

## 🔄 Workflow

1. Make changes to your code
2. Run `npm run deploy`
3. Changes are automatically:
   - Committed to Git
   - Pushed to GitHub
   - Deployed to Vercel
4. Check GitHub for version history
5. Check Vercel for live deployment

## 📞 Support

If you encounter issues:
1. Check the error messages in the console
2. Verify Git and GitHub setup
3. Check Vercel dashboard for deployment status
4. Review this guide for troubleshooting steps 
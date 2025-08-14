#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting deployment with Git version control...');

// Function to run commands and handle errors
function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

// Function to get current timestamp
function getTimestamp() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/[/:]/g, '-').replace(/,/g, '');
}

// Function to get list of changed files
function getChangedFiles() {
  try {
    const result = execSync('git status --porcelain', { encoding: 'utf8' });
    return result.split('\n').filter(line => line.trim()).map(line => line.slice(3));
  } catch (error) {
    console.log('⚠️ Could not get changed files:', error.message);
    return [];
  }
}

// Function to generate meaningful commit message
function generateCommitMessage(changedFiles) {
  const timestamp = getTimestamp();
  
  // Analyze changes to create a meaningful description
  let description = 'General updates';
  let changeType = 'update';
  
  if (changedFiles.length > 0) {
    const apiChanges = changedFiles.filter(f => f.startsWith('api/'));
    const configChanges = changedFiles.filter(f => f.includes('.json') || f.includes('.js') && !f.startsWith('api/'));
    const htmlChanges = changedFiles.filter(f => f.endsWith('.html'));
    
    if (apiChanges.length > 0) {
      const apiNames = apiChanges.map(f => f.replace('api/', '').replace('.js', ''));
      if (apiNames.includes('send-to-sheets')) {
        description = `Fix email sending and quote generation`;
        changeType = 'fix';
      } else if (apiNames.includes('quote-submission')) {
        description = `Fix quote submission form and pricing calculation`;
        changeType = 'fix';
      } else if (apiNames.includes('quote-database')) {
        description = `Update quote database structure`;
        changeType = 'update';
      } else {
        description = `API updates: ${apiNames.join(', ')}`;
        changeType = 'update';
      }
    } else if (configChanges.length > 0) {
      if (configChanges.includes('deploy-and-commit.js')) {
        description = `Improve deployment script and commit messages`;
        changeType = 'improve';
      } else if (configChanges.includes('package.json')) {
        description = `Update dependencies and scripts`;
        changeType = 'update';
      } else {
        description = `Configuration updates: ${configChanges.join(', ')}`;
        changeType = 'update';
      }
    } else if (htmlChanges.length > 0) {
      description = `Frontend updates: ${htmlChanges.join(', ')}`;
      changeType = 'update';
    }
  }
  
  const fileSummary = changedFiles.length > 0 
    ? `\n\n📁 Changed files:\n${changedFiles.slice(0, 8).map(f => `  • ${f}`).join('\n')}${changedFiles.length > 8 ? `\n  ... and ${changedFiles.length - 8} more files` : ''}`
    : '';
  
  const changeEmoji = changeType === 'fix' ? '🔧' : changeType === 'improve' ? '⚡' : '📝';
  
  return `${changeEmoji} ${description} - ${timestamp}${fileSummary}`;
}

// Function to check if Vercel auto-deployment is enabled
function checkVercelAutoDeploy() {
  try {
    // Check if there's a .vercel/project.json file
    const vercelConfigPath = path.join(process.cwd(), '.vercel', 'project.json');
    if (fs.existsSync(vercelConfigPath)) {
      console.log('⚠️ Vercel project detected - auto-deployment may be enabled');
      console.log('💡 To avoid double deployments, you can:');
      console.log('   1. Use --git-only to only push to GitHub (let Vercel auto-deploy)');
      console.log('   2. Use --vercel-only to only deploy to Vercel (skip GitHub push)');
      console.log('   3. Use --both to do both (may cause double deployment)');
      return true;
    }
  } catch (error) {
    // Ignore errors
  }
  return false;
}

// Main deployment process
async function deployWithVersionControl() {
  try {
    const timestamp = getTimestamp();
    
    // Check command line arguments for deployment strategy
    const args = process.argv.slice(2);
    const strategy = args[0] || 'auto';
    
    console.log(`🎯 Deployment strategy: ${strategy}`);
    
    // Check for Vercel auto-deployment
    const hasVercelAutoDeploy = checkVercelAutoDeploy();
    
    // 1. Check if we're in a Git repository
    try {
      runCommand('git status', 'Checking Git repository status');
    } catch (error) {
      console.log('❌ Not a Git repository. Initializing...');
      runCommand('git init', 'Initializing Git repository');
      
      // Add remote if not exists
      try {
        runCommand('git remote -v', 'Checking Git remotes');
      } catch (error) {
        console.log('⚠️ No remote repository configured. Please add your GitHub remote:');
        console.log('   git remote add origin https://github.com/yourusername/yourrepo.git');
        console.log('   Then run this script again.');
        return;
      }
    }

    // 2. Get current branch
    const currentBranch = runCommand('git branch --show-current', 'Getting current branch').trim();
    console.log(`🌿 Current branch: ${currentBranch}`);

    // 3. Stage all changes
    runCommand('git add .', 'Staging all changes');

    // 4. Get list of changed files and generate commit message
    const changedFiles = getChangedFiles();
    const commitMessage = generateCommitMessage(changedFiles);

    // 5. Commit changes
    try {
      runCommand(`git commit -m "${commitMessage}"`, 'Committing changes');
    } catch (error) {
      console.log('⚠️ No changes to commit or commit failed');
    }

    let deploymentUrl = 'Not deployed';

    // 6. Execute deployment strategy
    if (strategy === 'git-only' || (strategy === 'auto' && hasVercelAutoDeploy)) {
      // Only push to GitHub, let Vercel auto-deploy
      console.log('🚀 Strategy: Push to GitHub only (Vercel will auto-deploy)');
      try {
        runCommand(`git push origin ${currentBranch}`, 'Pushing to GitHub');
        console.log('✅ Changes pushed to GitHub successfully');
        console.log('🔄 Vercel will automatically deploy from GitHub');
      } catch (error) {
        console.log('⚠️ Push failed. This might be normal for the first push or if remote is not configured.');
        console.log('   You can manually push later with: git push origin main');
      }
    } else if (strategy === 'vercel-only') {
      // Only deploy to Vercel, skip GitHub push
      console.log('🚀 Strategy: Deploy to Vercel only (skip GitHub push)');
      const vercelResult = runCommand('npx vercel --prod', 'Deploying to Vercel');
      const urlMatch = vercelResult.match(/Production: (https:\/\/[^\s]+)/);
      deploymentUrl = urlMatch ? urlMatch[1] : 'Deployment URL not found';
    } else {
      // Do both (may cause double deployment)
      console.log('🚀 Strategy: Push to GitHub and deploy to Vercel');
      try {
        runCommand(`git push origin ${currentBranch}`, 'Pushing to GitHub');
        console.log('✅ Changes pushed to GitHub successfully');
      } catch (error) {
        console.log('⚠️ Push failed. This might be normal for the first push or if remote is not configured.');
        console.log('   You can manually push later with: git push origin main');
      }
      
      const vercelResult = runCommand('npx vercel --prod', 'Deploying to Vercel');
      const urlMatch = vercelResult.match(/Production: (https:\/\/[^\s]+)/);
      deploymentUrl = urlMatch ? urlMatch[1] : 'Deployment URL not found';
    }

    console.log('🎉 Deployment with version control completed successfully!');
    console.log(`📝 Commit: ${commitMessage.split('\n')[0]}`);
    console.log(`🌿 Branch: ${currentBranch}`);
    console.log(`🔗 Deployment URL: ${deploymentUrl}`);
    console.log('🔗 Check your GitHub repository for the latest changes');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
deployWithVersionControl(); 
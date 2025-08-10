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
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
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

// Main deployment process
async function deployWithVersionControl() {
  try {
    const timestamp = getTimestamp();
    
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

    // 4. Get list of changed files for commit message
    const changedFiles = getChangedFiles();
    const fileSummary = changedFiles.length > 0 
      ? `\n\nChanged files:\n${changedFiles.slice(0, 10).map(f => `- ${f}`).join('\n')}${changedFiles.length > 10 ? `\n... and ${changedFiles.length - 10} more files` : ''}`
      : '';

    // 5. Create commit message
    const commitMessage = `Deploy: ${timestamp}${fileSummary}`;

    // 6. Commit changes
    try {
      runCommand(`git commit -m "${commitMessage}"`, 'Committing changes');
    } catch (error) {
      console.log('⚠️ No changes to commit or commit failed');
    }

    // 7. Push to GitHub
    try {
      runCommand(`git push origin ${currentBranch}`, 'Pushing to GitHub');
      console.log('✅ Changes pushed to GitHub successfully');
    } catch (error) {
      console.log('⚠️ Push failed. This might be normal for the first push or if remote is not configured.');
      console.log('   You can manually push later with: git push origin main');
    }

    // 8. Deploy to Vercel (only once)
    console.log('🚀 Deploying to Vercel...');
    const vercelResult = runCommand('npx vercel --prod', 'Deploying to Vercel');
    
    // Extract the deployment URL from the output
    const urlMatch = vercelResult.match(/Production: (https:\/\/[^\s]+)/);
    const deploymentUrl = urlMatch ? urlMatch[1] : 'Deployment URL not found';

    console.log('🎉 Deployment with version control completed successfully!');
    console.log(`📝 Commit: ${commitMessage}`);
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
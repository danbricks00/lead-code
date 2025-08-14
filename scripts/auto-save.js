import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

// Get current timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

try {
    console.log('🔄 Starting auto-save process...');
    
    // Add all changes
    console.log('📁 Adding all changes...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Check if there are any changes to commit
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim() === '') {
        console.log('✅ No changes to commit');
        process.exit(0);
    }
    
    // Analyze changes to create meaningful commit message
    console.log('🔍 Analyzing changes...');
    const changes = gitStatus.split('\n').filter(line => line.trim());
    
    let commitMessage = '';
    const modifiedFiles = [];
    const addedFiles = [];
    const deletedFiles = [];
    
    changes.forEach(changeLine => {
        const changeStatus = changeLine.substring(0, 2).trim();
        const file = changeLine.substring(3);
        
        if (changeStatus === 'M' || changeStatus === 'MM') {
            modifiedFiles.push(file);
        } else if (changeStatus === 'A') {
            addedFiles.push(file);
        } else if (changeStatus === 'D') {
            deletedFiles.push(file);
        } else if (changeStatus === '??') {
            addedFiles.push(file);
        }
    });
    
    // Generate meaningful commit message
    const summaries = [];
    
    if (addedFiles.length > 0) {
        const newFiles = addedFiles.slice(0, 3); // Show first 3 files
        let summary = `Add ${addedFiles.length > 1 ? 'files' : 'file'}: ${newFiles.join(', ')}`;
        if (addedFiles.length > 3) summary += ` (+${addedFiles.length - 3} more)`;
        summaries.push(summary);
    }
    
    if (modifiedFiles.length > 0) {
        const changedFiles = modifiedFiles.slice(0, 3); // Show first 3 files
        let summary = `Update ${modifiedFiles.length > 1 ? 'files' : 'file'}: ${changedFiles.join(', ')}`;
        if (modifiedFiles.length > 3) summary += ` (+${modifiedFiles.length - 3} more)`;
        summaries.push(summary);
    }
    
    if (deletedFiles.length > 0) {
        const removedFiles = deletedFiles.slice(0, 3); // Show first 3 files
        let summary = `Remove ${deletedFiles.length > 1 ? 'files' : 'file'}: ${removedFiles.join(', ')}`;
        if (deletedFiles.length > 3) summary += ` (+${deletedFiles.length - 3} more)`;
        summaries.push(summary);
    }
    
    // Create final commit message
    if (summaries.length === 1) {
        commitMessage = summaries[0];
    } else {
        commitMessage = `Update multiple files:\n${summaries.join('\n')}`;
    }
    
    // Add timestamp for reference
    commitMessage += `\n\nTimestamp: ${timestamp}`;
    
    // Commit changes
    console.log('💾 Committing changes...');
    console.log(`📝 Commit message: ${commitMessage.split('\n')[0]}`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    // Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    execSync('git push', { stdio: 'inherit' });
    
    console.log('✅ Auto-save completed successfully!');
    console.log(`📝 Commit: ${commitMessage.split('\n')[0]}`);
    
} catch (error) {
    console.error('❌ Auto-save failed:', error.message);
    process.exit(1);
} 
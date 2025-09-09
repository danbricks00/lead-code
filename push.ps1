# Kiwi Trade - Git Push Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Kiwi Trade - Git Push Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get commit message from parameter or use default
$commitMessage = if ($args[0]) { $args[0] } else { "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }

try {
    Write-Host "[1/4] Adding all changes..." -ForegroundColor Yellow
    git add .
    if ($LASTEXITCODE -ne 0) { throw "Error adding files" }
    Write-Host "✅ Files added successfully" -ForegroundColor Green

    Write-Host ""
    Write-Host "[2/4] Committing changes..." -ForegroundColor Yellow
    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) { throw "Error committing changes" }
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green

    Write-Host ""
    Write-Host "[3/4] Pulling latest changes..." -ForegroundColor Yellow
    git pull origin main
    if ($LASTEXITCODE -ne 0) { throw "Error pulling changes" }
    Write-Host "✅ Latest changes pulled successfully" -ForegroundColor Green

    Write-Host ""
    Write-Host "[4/4] Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "Error pushing to GitHub" }
    Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    🎉 All done! Changes are live!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}
catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check the error above and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"

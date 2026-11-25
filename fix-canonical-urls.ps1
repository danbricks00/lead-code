# Script to fix all canonical URLs to use www subdomain
$files = Get-ChildItem -Path "pages" -Recurse -Filter "*.js" | Where-Object { 
    (Get-Content $_.FullName -Raw) -match 'canonical="https://heat\.nz'
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace 'canonical="https://heat\.nz', 'canonical="https://www.heat.nz'
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($file.Name)"
}

Write-Host "Done! Fixed $($files.Count) files."


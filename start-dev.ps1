Write-Host "Starting JobPilot AI development servers..." -ForegroundColor Cyan

$rootDir = $PSScriptRoot

# Start backend
Write-Host "Starting backend (port 4000)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  npm run start:dev 2>&1
} -ArgumentList "$rootDir\apps\api"

# Start frontend  
Write-Host "Starting frontend (port 3000)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  npx next dev 2>&1
} -ArgumentList "$rootDir\apps\web"

Write-Host ""
Write-Host " Waiting for servers..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  JobPilot AI is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:4000/graphql" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Demo account:" -ForegroundColor Cyan
Write-Host "  Email:    demo@jobpilot.ai" -ForegroundColor White
Write-Host "  Password: Demo123!" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Red

# Monitor jobs
while ($true) {
  Start-Sleep -Seconds 10
  $backendState = (Receive-Job -Job $backendJob -Keep 2>$null | Select-Object -Last 1)
  if ($backendJob.State -eq "Failed") {
    Write-Host "Backend job failed: $(Receive-Job -Job $backendJob)" -ForegroundColor Red
    break
  }
}

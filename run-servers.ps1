$log = "E:\AI项目\ai-workspace\server-launcher.log"
"=== Launching at $(Get-Date) ===" | Out-File $log -Encoding UTF8

$jb = Start-Job -Name "be" -ScriptBlock {
  cd "E:\AI项目\ai-workspace\ai-digital-workspace-server"
  "Backend starting..." | Out-File "E:\AI项目\ai-workspace\server-launcher.log" -Append
  node app.js *>&1 | Out-File "E:\AI项目\ai-workspace\server-launcher.log" -Append
}

Start-Sleep -Seconds 4
Wait-Job $jb -Timeout 2

$jf = Start-Job -Name "fe" -ScriptBlock {
  cd "E:\AI项目\ai-workspace\ai-digital-workspace-client"
  "Frontend starting..." | Out-File "E:\AI项目\ai-workspace\server-launcher.log" -Append
  npx vite --host 0.0.0.0 --port 5173 *>&1 | Out-File "E:\AI项目\ai-workspace\server-launcher.log" -Append
}

Start-Sleep -Seconds 10

Write-Output "=== Log ==="
Get-Content $log

Write-Output "=== Ports ==="
netstat -ano | Select-String "LISTENING" | Select-String ":(3001|5173) "

Write-Output "=== Verify ==="
$body = @{username="admin";password="123456"} | ConvertTo-Json
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
  Write-Output "Backend: $($r.StatusCode)"
  $r2 = Invoke-WebRequest -Uri "http://127.0.0.1:5173" -UseBasicParsing
  Write-Output "Frontend: $($r2.StatusCode)"
} catch { Write-Output "Error: $_" }

# Keep alive for 120s so user can check the page
Write-Output "=== Services should be accessible now. Keeping alive 120s ==="
Start-Sleep -Seconds 120
Write-Output "=== 120s elapsed, shutting down ==="

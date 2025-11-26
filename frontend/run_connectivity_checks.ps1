$log = "' + $log + '"
"=== START CONNECTIVITY CHECKS ===" | Out-File $log

# FRONTEND
"--- FRONTEND: http://127.0.0.1:3001/ ---" | Out-File -Append $log
try {
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:3001/' -Method GET -TimeoutSec 5
    "FRONTEND_OK" | Out-File -Append $log
} catch {
    "FRONTEND_FAIL: $_" | Out-File -Append $log
}

# LOCAL BACKEND
"--- LOCAL BACKEND: http://127.0.0.1:8000/health ---" | Out-File -Append $log
try {
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health' -Method GET -TimeoutSec 5
    ("BACKEND_HEALTH_OK: " + ($r | ConvertTo-Json -Compress)) | Out-File -Append $log
} catch {
    "BACKEND_HEALTH_FAIL: $_" | Out-File -Append $log
}

# NGROK ROOT
$ngrok = 'https://cliquish-unsaluted-pablo.ngrok-free.dev/'
("--- NGROK ROOT: $ngrok ---") | Out-File -Append $log
try {
    $r = Invoke-RestMethod -Uri $ngrok -Method GET -TimeoutSec 10
    ("NGROK_ROOT_OK: " + ($r | ConvertTo-Json -Compress)) | Out-File -Append $log
} catch {
    "NGROK_ROOT_FAIL: $_" | Out-File -Append $log
}

# NGROK /api/chat POST
$ngrok_api = 'https://cliquish-unsaluted-pablo.ngrok-free.dev/api/chat'
("--- NGROK POST: $ngrok_api ---") | Out-File -Append $log
$body = @{ session_id = 'test-session'; message = 'Hello from automated tester' } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri $ngrok_api -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 15
    ("NGROK_API_CHAT_OK: " + ($r | ConvertTo-Json -Compress)) | Out-File -Append $log
} catch {
    "NGROK_API_CHAT_FAIL: $_" | Out-File -Append $log
}

"=== CONNECTIVITY CHECKS COMPLETE ===" | Out-File -Append $log

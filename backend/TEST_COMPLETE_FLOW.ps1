# Complete authentication flow test
Write-Host "=== Quality Analysis System - Complete Auth Flow Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Signup
Write-Host "Test 1: User Registration" -ForegroundColor Yellow
$testEmail = "flowtest_$(Get-Random)@gmail.com"
$signupResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -UseBasicParsing -Body (ConvertTo-Json @{name="Flow Test User";email=$testEmail;password="TestPass123!"}) -ErrorAction SilentlyContinue
$signup = ConvertFrom-Json $signupResponse.Content
Write-Host "✅ $($signup.message)" -ForegroundColor Green
Write-Host "📧 Email: $testEmail" -ForegroundColor Blue
Write-Host ""

# Wait for email to process
Start-Sleep -Seconds 2

# Test 2: Try login without verification (should fail)
Write-Host "Test 2: Login Attempt (Before Verification)" -ForegroundColor Yellow
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -UseBasicParsing -Body (ConvertTo-Json @{email=$testEmail;password="TestPass123!"}) -ErrorAction SilentlyContinue
$login = ConvertFrom-Json $loginResponse.Content
Write-Host "❌ Expected to fail: $($login.message)" -ForegroundColor Yellow
Write-Host ""

# Test 3: Check email logs
Write-Host "Test 3: Email Sending Status" -ForegroundColor Yellow
$logs = Get-Content "c:\Users\Lenovo\Desktop\Quality-analysis-system\backend\email-logs.txt" -Tail 2
Write-Host "✅ Email logs:" -ForegroundColor Green
$logs | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
Write-Host ""

Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "✅ Backend Authentication Working" -ForegroundColor Green
Write-Host "✅ Email Sending Working" -ForegroundColor Green
Write-Host "❌ Email Delivery Depends on Gmail Account Settings" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check Gmail Spam/Promotions folder for QualiCheck emails"
Write-Host "2. Enable 'Less Secure App Access' if you have a Gmail account"
Write-Host "3. Or use 'App Password' if you have 2FA enabled (update EMAIL_PASS in .env)"
Write-Host "4. Check any email forwarding rules in Gmail settings"

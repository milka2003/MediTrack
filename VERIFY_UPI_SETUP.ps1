# UPI Payment Integration Verification Script
# This PowerShell script verifies UPI payment setup
# Usage: .\VERIFY_UPI_SETUP.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🔐 UPI PAYMENT INTEGRATION VERIFICATION SCRIPT          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0

# Helper function
function Test-Check {
    param(
        [string]$name,
        [bool]$condition,
        [string]$details = ""
    )
    
    if ($condition) {
        Write-Host "✅ $name" -ForegroundColor Green
        if ($details) {
            Write-Host "   $details" -ForegroundColor Gray
        }
        $script:passed++
    } else {
        Write-Host "❌ $name" -ForegroundColor Red
        if ($details) {
            Write-Host "   $details" -ForegroundColor Gray
        }
        $script:failed++
    }
}

# ============================================================================
# Check 1: Environment Variables
# ============================================================================
Write-Host "📋 Check 1: Environment Variables" -ForegroundColor Yellow
Write-Host "─" * 60
$envFile = "server\.env"
$envExists = Test-Path $envFile
Test-Check ".env file exists" $envExists $envFile

if ($envExists) {
    $envContent = Get-Content $envFile -Raw
    $hasKeyId = $envContent -match "RAZORPAY_KEY_ID="
    $hasKeySecret = $envContent -match "RAZORPAY_KEY_SECRET="
    
    Test-Check "RAZORPAY_KEY_ID set" $hasKeyId
    Test-Check "RAZORPAY_KEY_SECRET set" $hasKeySecret
    
    if ($hasKeyId -and $hasKeySecret) {
        Write-Host "   ✓ Credentials configured in .env" -ForegroundColor Green
    }
}
Write-Host ""

# ============================================================================
# Check 2: Backend Files
# ============================================================================
Write-Host "📋 Check 2: Backend Files" -ForegroundColor Yellow
Write-Host "─" * 60
$billingFile = "server\routes\billing.js"
$billModelFile = "server\models\Bill.js"

Test-Check "billing.js exists" (Test-Path $billingFile) $billingFile
Test-Check "Bill.js model exists" (Test-Path $billModelFile) $billModelFile

if (Test-Path $billingFile) {
    $billingContent = Get-Content $billingFile -Raw
    Test-Check "create-order endpoint defined" ($billingContent -match "'\/create-order'")
    Test-Check "verify-payment endpoint defined" ($billingContent -match "'\/verify-payment'")
    Test-Check "UPI method configured" ($billingContent -match "method: 'upi'")
}
Write-Host ""

# ============================================================================
# Check 3: Frontend Files
# ============================================================================
Write-Host "📋 Check 3: Frontend Files" -ForegroundColor Yellow
Write-Host "─" * 60
$frontendFile = "meditrack-client\src\pages\BillingDashboard.jsx"
Test-Check "BillingDashboard.jsx exists" (Test-Path $frontendFile) $frontendFile

if (Test-Path $frontendFile) {
    $frontendContent = Get-Content $frontendFile -Raw
    Test-Check "handlePayWithUPI function" ($frontendContent -match "handlePayWithUPI")
    Test-Check "Razorpay checkout script" ($frontendContent -match "checkout.razorpay.com")
    Test-Check "UPI method restriction" ($frontendContent -match "upi: true")
}
Write-Host ""

# ============================================================================
# Check 4: Dependencies
# ============================================================================
Write-Host "📋 Check 4: Dependencies" -ForegroundColor Yellow
Write-Host "─" * 60
$packageFile = "server\package.json"
Test-Check "package.json exists" (Test-Path $packageFile)

if (Test-Path $packageFile) {
    $packageContent = Get-Content $packageFile | ConvertFrom-Json
    Test-Check "razorpay package installed" ($packageContent.dependencies.razorpay -ne $null)
    Test-Check "express package installed" ($packageContent.dependencies.express -ne $null)
    Test-Check "mongoose package installed" ($packageContent.dependencies.mongoose -ne $null)
}
Write-Host ""

# ============================================================================
# Check 5: Database Models
# ============================================================================
Write-Host "📋 Check 5: Database Model Fields" -ForegroundColor Yellow
Write-Host "─" * 60
if (Test-Path $billModelFile) {
    $modelContent = Get-Content $billModelFile -Raw
    Test-Check "razorpayOrderId field" ($modelContent -match "razorpayOrderId")
    Test-Check "razorpayPaymentId field" ($modelContent -match "razorpayPaymentId")
    Test-Check "paymentMethod field" ($modelContent -match "paymentMethod")
    Test-Check "paidAmount field" ($modelContent -match "paidAmount")
}
Write-Host ""

# ============================================================================
# Summary
# ============================================================================
$total = $passed + $failed
$passRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    VERIFICATION SUMMARY                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Checks:  $total" -ForegroundColor White
Write-Host "✅ Passed:      $passed" -ForegroundColor Green
Write-Host "❌ Failed:      $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "Pass Rate:     $passRate%" -ForegroundColor $(if ($passRate -ge 100) { "Green" } else { "Yellow" })
Write-Host ""

# ============================================================================
# Status
# ============================================================================
if ($failed -eq 0) {
    Write-Host "🎉 ALL CHECKS PASSED! UPI Payment ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Ready Credentials:" -ForegroundColor Green
    Write-Host "   KEY_ID: rzp_test_RGXWGOBliVCIpU" -ForegroundColor Cyan
    Write-Host "   UPI: success@razorpay" -ForegroundColor Cyan
    Write-Host "   OTP: 000000" -ForegroundColor Cyan
    Write-Host ""
} elseif ($passRate -ge 80) {
    Write-Host "⚠️  WARNING: Some checks failed. Review above." -ForegroundColor Yellow
} else {
    Write-Host "🔴 ERROR: Critical issues found. Fix above." -ForegroundColor Red
}

Write-Host ""
Write-Host "═" * 60
Write-Host "Next: Run 'npm run start' to begin testing" -ForegroundColor Cyan
Write-Host "═" * 60
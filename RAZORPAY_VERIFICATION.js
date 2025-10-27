/**
 * Razorpay Integration Verification Script
 * Run this to verify all Razorpay setup is correct
 * Usage: node RAZORPAY_VERIFICATION.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(condition, passMessage, failMessage) {
  if (condition) {
    log(`✅ ${passMessage}`, 'green');
    return true;
  } else {
    log(`❌ ${failMessage}`, 'red');
    return false;
  }
}

let passed = 0;
let failed = 0;

log('\n🔍 Razorpay Integration Verification\n', 'cyan');

// ===== Check 1: Environment Variables =====
log('1️⃣  Environment Configuration', 'blue');
const envPath = path.join(__dirname, 'server', '.env');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  passed += check(
    envContent.includes('RAZORPAY_KEY_ID'),
    'RAZORPAY_KEY_ID found in .env',
    'RAZORPAY_KEY_ID missing from .env'
  );
  passed += check(
    envContent.includes('RAZORPAY_KEY_SECRET'),
    'RAZORPAY_KEY_SECRET found in .env',
    'RAZORPAY_KEY_SECRET missing from .env'
  );
  passed += check(
    envContent.includes('NODE_ENV'),
    'NODE_ENV found in .env',
    'NODE_ENV missing from .env'
  );
  
  if (envContent.includes('rzp_test_')) {
    log('   📝 Mode: TEST (Development)', 'yellow');
  }
  if (envContent.includes('rzp_live_')) {
    log('   📝 Mode: LIVE (Production)', 'yellow');
  }
} catch (e) {
  log(`❌ .env file not found at ${envPath}`, 'red');
  failed += 3;
}

// ===== Check 2: Package Dependencies =====
log('\n2️⃣  Dependencies', 'blue');
const packageJsonPath = path.join(__dirname, 'server', 'package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  passed += check(
    packageJson.dependencies.razorpay !== undefined,
    `Razorpay installed (${packageJson.dependencies.razorpay})`,
    'Razorpay not installed'
  );
} catch (e) {
  log(`❌ package.json not readable: ${e.message}`, 'red');
  failed += 1;
}

// ===== Check 3: Backend Implementation =====
log('\n3️⃣  Backend Implementation', 'blue');
const billingRoutePath = path.join(__dirname, 'server', 'routes', 'billing.js');
try {
  const billingContent = fs.readFileSync(billingRoutePath, 'utf8');
  
  passed += check(
    billingContent.includes("require('razorpay')"),
    'Razorpay SDK imported',
    'Razorpay SDK not imported'
  );
  passed += check(
    billingContent.includes("router.post('/create-order'"),
    'Create order endpoint exists',
    'Create order endpoint missing'
  );
  passed += check(
    billingContent.includes("router.post('/verify-payment'"),
    'Verify payment endpoint exists',
    'Verify payment endpoint missing'
  );
  passed += check(
    billingContent.includes("router.get('/razorpay-key'"),
    'Razorpay key endpoint exists',
    'Razorpay key endpoint missing'
  );
  passed += check(
    billingContent.includes('crypto.createHmac'),
    'Signature verification implemented',
    'Signature verification missing'
  );
} catch (e) {
  log(`❌ Could not read billing.js: ${e.message}`, 'red');
  failed += 5;
}

// ===== Check 4: Database Model =====
log('\n4️⃣  Database Model', 'blue');
const billModelPath = path.join(__dirname, 'server', 'models', 'Bill.js');
try {
  const billContent = fs.readFileSync(billModelPath, 'utf8');
  
  passed += check(
    billContent.includes('razorpayOrderId'),
    'razorpayOrderId field added to Bill model',
    'razorpayOrderId field missing'
  );
  passed += check(
    billContent.includes('razorpayPaymentId'),
    'razorpayPaymentId field added to Bill model',
    'razorpayPaymentId field missing'
  );
} catch (e) {
  log(`❌ Could not read Bill.js: ${e.message}`, 'red');
  failed += 2;
}

// ===== Check 5: Frontend Implementation =====
log('\n5️⃣  Frontend Implementation', 'blue');
const billingDashboardPath = path.join(__dirname, 'meditrack-client', 'src', 'pages', 'BillingDashboard.jsx');
try {
  const dashboardContent = fs.readFileSync(billingDashboardPath, 'utf8');
  
  passed += check(
    dashboardContent.includes('checkout.razorpay.com'),
    'Razorpay checkout script loaded',
    'Razorpay checkout script not loaded'
  );
  passed += check(
    dashboardContent.includes('handlePayWithUPI'),
    'handlePayWithUPI function exists',
    'handlePayWithUPI function missing'
  );
  passed += check(
    dashboardContent.includes('window.Razorpay'),
    'Razorpay window object used',
    'Razorpay window object not used'
  );
  passed += check(
    dashboardContent.includes('Pay with UPI'),
    'UPI payment button text found',
    'UPI payment button text missing'
  );
} catch (e) {
  log(`❌ Could not read BillingDashboard.jsx: ${e.message}`, 'red');
  failed += 4;
}

// ===== Summary =====
log('\n' + '='.repeat(50), 'cyan');
log('VERIFICATION SUMMARY', 'cyan');
log('='.repeat(50) + '\n', 'cyan');

const total = passed + failed;
const percentage = Math.round((passed / total) * 100);

log(`✅ Passed: ${passed}/${total}`, 'green');
log(`❌ Failed: ${failed}/${total}`, failed > 0 ? 'red' : 'green');
log(`📊 Score: ${percentage}%`, percentage >= 90 ? 'green' : 'yellow');

if (percentage >= 90) {
  log('\n✨ Razorpay integration is ready!', 'green');
  log('Next steps:', 'blue');
  log('  1. npm run start (backend)', 'cyan');
  log('  2. npm run client (frontend)', 'cyan');
  log('  3. Test UPI payment flow', 'cyan');
} else {
  log('\n⚠️  Please fix the issues above before proceeding', 'yellow');
}

log('\n' + '='.repeat(50) + '\n', 'cyan');
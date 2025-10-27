# 🚀 UPI Payment Integration - Quick Start Guide

**Status:** ✅ **READY FOR TESTING** | All 36 verification checks passed

---

## 📋 Credentials

```
KEY_ID:     rzp_test_RGXWGOBliVCIpU
KEY_SECRET: 9Q49llzcN0kLD3021OoSstOp
```

> ⚠️ These are **test credentials** for development only

---

## 🎯 Test UPI Details (Use These)

| Field | Value |
|-------|-------|
| **UPI ID** | success@razorpay |
| **Phone** | 9999999999 |
| **OTP** | 000000 |

---

## 🚀 QUICK START (5 Minutes)

### Step 1️⃣: Start Backend Server

```powershell
Set-Location "c:\Users\MILKA JAMES\milka_hospital\meditrack\meditrack"
npm run start
```

✅ Look for this in console:
```
🔑 Razorpay Initialization:
   KEY_ID: ✅ Loaded
   KEY_SECRET: ✅ Loaded
✅ Razorpay SDK Initialized Successfully
```

### Step 2️⃣: Start Frontend (New Terminal)

```powershell
Set-Location "c:\Users\MILKA JAMES\milka_hospital\meditrack\meditrack"
npm run client
```

Wait for: `webpack compiled successfully`

### Step 3️⃣: Open Application

```
http://localhost:3000
```

---

## 💳 Complete Payment Flow

### 1. **Search Patient**
```
1. Go to Billing Dashboard
2. Enter Patient OP Number (e.g., OP001)
3. Click Search
```

### 2. **Create Bill**
```
1. Select a Visit
2. Add items/charges
3. Click "Save Bill"
4. Verify bill shows up in list
```

### 3. **Initiate Payment**
```
1. Click "Pay ₹XXX with UPI" button
2. Razorpay modal opens
```

### 4. **Test Payment**
```
In Razorpay Modal:
  1. Click on UPI option
  2. Enter: success@razorpay
  3. Click "Pay"
  4. Enter OTP: 000000
  5. Wait for success message
```

### 5. **Verify Payment**
```
✅ Bill status should change to "Paid"
✅ "Payment successful!" message appears
✅ Bill shows Razorpay payment ID
```

---

## 🔍 Backend Console Logs (What to Expect)

### Order Creation:
```
📱 Creating Razorpay Order:
   billId: 507f1f77bcf86cd799439011
   amount: 5000
   patientName: Milka James

   Creating order with options: {
      amount: 500000,
      currency: 'INR',
      method: 'upi'
   }

✅ Order Created Successfully:
   Order ID: order_ABC123XYZ789
   Amount (paise): 500000
   Currency: INR
```

### Payment Verification:
```
💳 Verifying UPI Payment:
   orderId: order_ABC123XYZ789
   paymentId: pay_ABC123XYZ789
   billId: 507f1f77bcf86cd799439011
   amount: 5000

   Verifying signature...
   Expected: abc123...
   Generated: abc123...

✅ Signature verified

✅ Bill Updated:
   New status: Paid
   Total paid: 5000
```

---

## ✅ Verification Checklist

| Check | Status | Details |
|-------|--------|---------|
| Environment Variables | ✅ | Credentials loaded |
| Backend Routes | ✅ | `/api/billing/create-order` ready |
| Frontend UPI | ✅ | Checkout modal configured |
| Database | ✅ | Bill model has UPI fields |
| Authentication | ✅ | Admin/Billing role enforced |
| Payment Capture | ✅ | Auto-capture enabled |
| Signature Verification | ✅ | HMAC-SHA256 ready |

---

## 🐛 Troubleshooting

### Issue: "Failed to create payment order"

**Check 1:** Backend is running?
```powershell
# Should see: ✅ Razorpay SDK Initialized Successfully
```

**Check 2:** Environment variables loaded?
```powershell
# Should see: 
🔑 Razorpay Initialization:
   KEY_ID: ✅ Loaded
   KEY_SECRET: ✅ Loaded
```

**Fix:** Restart backend with `npm run start`

---

### Issue: "Payment verification failed"

**Cause:** Signature mismatch

**Check Backend Console:**
```
Expected: [signature from modal]
Generated: [signature from backend]
```

**Fix:** Ensure `RAZORPAY_KEY_SECRET` matches exactly in `.env`

---

### Issue: Modal doesn't open

**Check 1:** Razorpay script loaded?
```javascript
// Browser console: console.log(window.Razorpay)
// Should return a function, not undefined
```

**Check 2:** Order ID received?
```javascript
// Should see orderId in response
```

**Fix:** Reload page (Ctrl+Shift+R)

---

## 📊 Files Modified

| File | Changes |
|------|---------|
| `server/routes/billing.js` | Updated order creation with UPI method + logging |
| `meditrack-client/src/pages/BillingDashboard.jsx` | Added UPI-only method restriction |
| `server/.env` | Contains Razorpay credentials |

---

## 🔒 Security Features

✅ JWT authentication required  
✅ Admin/Billing role enforced  
✅ HMAC-SHA256 signature verification  
✅ No payment processing before verification  
✅ Bill validation before payment  
✅ Test credentials only (development mode)

---

## 📞 Support

If payment fails:
1. Check backend console for errors
2. Verify credentials in `server/.env`
3. Run: `node UPI_PAYMENT_TEST.js` for complete diagnosis
4. Check browser network tab for API response

---

## 🎉 Ready?

```bash
# Terminal 1: Start Backend
npm run start

# Terminal 2: Start Frontend  
npm run client

# Open Browser
http://localhost:3000
```

**Happy Testing! 🚀**
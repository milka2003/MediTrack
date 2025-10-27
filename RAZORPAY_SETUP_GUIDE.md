# 🎯 Razorpay UPI Payment Integration - Setup Guide

## ✅ Completed Implementation

Your MediTrack Hospital billing system now has **complete Razorpay UPI payment integration**. Here's what was set up:

---

## 📋 What Was Implemented

### Backend (Node.js/Express)
- ✅ **3 New Endpoints** added to `/api/billing`:
  - `POST /billing/create-order` - Creates Razorpay order
  - `POST /billing/verify-payment` - Verifies payment signature
  - `GET /billing/razorpay-key` - Returns public key to frontend

### Frontend (React)
- ✅ **Razorpay Checkout Integration** in BillingDashboard
- ✅ **UPI Payment Button** appears when UPI is selected
- ✅ **Real-time Payment Status Updates**
- ✅ **Payment Success/Failure Handling**

### Database (MongoDB)
- ✅ **Bill Model Enhanced** with:
  - `razorpayOrderId` - Stores Razorpay Order ID
  - `razorpayPaymentId` - Stores Razorpay Payment ID

---

## 🚀 Quick Start (5 Minutes)

### 1. Start Backend Server
```powershell
Set-Location "c:\Users\MILKA JAMES\milka_hospital\meditrack\meditrack"
npm run start
# Server runs on http://localhost:5000
```

### 2. Start Frontend (New Terminal)
```powershell
Set-Location "c:\Users\MILKA JAMES\milka_hospital\meditrack\meditrack"
npm run client
# Frontend runs on http://localhost:3000
```

### 3. Test UPI Payment Flow
1. Login to http://localhost:3000 as **Billing Staff**
2. Go to **Billing Dashboard**
3. Search for a patient by OP Number
4. Click "Create Bill" or "View Bill"
5. Select "UPI" from Payment Method dropdown
6. Click "Save Bill"
7. Click "Pay with UPI" button
8. Complete test payment in Razorpay checkout

---

## 🔐 Your Credentials

```
Key ID:     rzp_test_RGXWGOBliVCIpU
Key Secret: 9Q49llzcN0kLD3021OoSstOp
Environment: TEST MODE (Development)
```

**✅ Credentials are stored in:** `server/.env`

---

## 🧪 Test UPI Payment

### Test UPI ID (Use in Razorpay Checkout)
```
success@razorpay
```

### Test Phone Number
```
9999999999
```

### Test OTP
```
000000
```

### Expected Payment Flow
1. Click "Pay with UPI" button
2. Razorpay checkout opens
3. Fill in test details (phone: 9999999999)
4. Choose UPI as method
5. Enter UPI ID: `success@razorpay`
6. OTP: `000000`
7. Payment completes successfully ✅

---

## 📊 Payment Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ BILLING DASHBOARD (Frontend)                                │
│ User selects UPI & clicks "Pay with UPI"                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - POST /billing/create-order                       │
│ Creates Razorpay Order with amount & bill details         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ RAZORPAY CHECKOUT (Hosted Checkout)                        │
│ User enters UPI details & completes payment                │
│ Returns: payment_id, order_id, signature                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - POST /billing/verify-payment                     │
│ Verifies payment signature (security check)                │
│ Updates Bill status to "Paid"                              │
│ Stores razorpayPaymentId & razorpayOrderId               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ SUCCESS - Bill Updated & Receipt Ready                      │
│ Snackbar shows "Payment successful!"                       │
│ Can print receipt with payment confirmation               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Key Implementation Details

### Backend Endpoints

#### 1. Create Order
```javascript
POST /api/billing/create-order
Body: {
  billId: "mongo_id",
  amount: 500,
  patientName: "John Doe",
  patientPhone: "9999999999"
}

Response: {
  success: true,
  orderId: "order_xxx",
  amount: 50000,
  currency: "INR",
  keyId: "rzp_test_xxx"
}
```

#### 2. Verify Payment
```javascript
POST /api/billing/verify-payment
Body: {
  orderId: "order_xxx",
  paymentId: "pay_xxx",
  signature: "signature_xxx",
  billId: "mongo_id",
  amount: 500
}

Response: {
  success: true,
  message: "Payment verified successfully",
  bill: { ...updated bill object },
  paymentStatus: "Paid"
}
```

#### 3. Get Razorpay Key
```javascript
GET /api/billing/razorpay-key
Response: {
  keyId: "rzp_test_xxx"
}
```

---

## 🛠️ File Changes Summary

### Modified Files
1. **server/.env**
   - Added `RAZORPAY_KEY_ID`
   - Added `RAZORPAY_KEY_SECRET`
   - Added `NODE_ENV`

2. **server/package.json**
   - Added `razorpay: ^2.9.1` dependency

3. **server/routes/billing.js**
   - Added Razorpay SDK initialization
   - Added 3 new endpoints (create-order, verify-payment, razorpay-key)

4. **server/models/Bill.js**
   - Added `razorpayOrderId` field
   - Added `razorpayPaymentId` field

5. **meditrack-client/src/pages/BillingDashboard.jsx**
   - Added Razorpay script loading
   - Added `handlePayWithUPI()` function
   - Added payment processing state
   - Added "Pay with UPI" button in dialog

---

## ✨ Features

### ✅ Implemented Features
- UPI payment via Razorpay Hosted Checkout
- Automatic bill status update upon successful payment
- Payment signature verification (security)
- Real-time payment confirmation
- Payment method tracking in database
- Error handling for failed payments
- Snackbar notifications for user feedback
- Print receipt with payment details
- Responsive design for all screen sizes

### 🔒 Security Features
- HMAC-SHA256 signature verification
- Backend payment verification (not client-side)
- Secure credential storage in .env
- Bearer token authentication on all endpoints
- Admin/Billing staff role-based access

---

## 📱 Test Payment Methods

MediTrack now supports 4 payment methods:
1. **Cash** - Manual cash payment
2. **Card** - Future credit/debit card support
3. **UPI** - ✅ Implemented (Razorpay)
4. **Other** - Future payment methods

---

## 🚨 Troubleshooting

### Issue: "Razorpay is not defined"
**Solution:** Ensure Razorpay script loaded:
```javascript
// Check in browser console
console.log(window.Razorpay);  // Should not be undefined
```

### Issue: Payment verification fails
**Solution:** Check error message - could be:
- Invalid signature (check KEY_SECRET)
- Wrong amount (ensure decimal handling)
- Bill not found (ensure bill saved first)

### Issue: "Please save bill first"
**Solution:** 
1. Fill all bill items
2. Click "Save Bill" before "Pay with UPI"
3. Payment button appears after successful save

### Issue: Test payment not working
**Solution:**
- Use test credentials (rzp_test_xxx format)
- Ensure NODE_ENV=development
- Check browser console for errors
- Verify network requests in DevTools

---

## 📈 Going to Production

When ready for LIVE payments:

### 1. Get Live Credentials
- Login to https://dashboard.razorpay.com
- Switch to **LIVE mode**
- Navigate to **Settings → API Keys**
- Generate live credentials
- Complete full KYC verification

### 2. Update Credentials
```env
# server/.env
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
NODE_ENV=production
```

### 3. Deploy
- Test thoroughly in sandbox first
- Update hospital name/details if needed
- Deploy to production server
- Monitor transactions in Razorpay dashboard

### 4. Setup Webhooks (Optional)
For automatic reconciliation:
- Dashboard → **Settings → Webhooks**
- Add endpoint: `https://yourdomain.com/api/billing/webhook`
- Subscribe to: `payment.authorized`, `payment.failed`

---

## 📞 Support Resources

### Razorpay Documentation
- **API Docs:** https://razorpay.com/docs/api/
- **UPI Payments:** https://razorpay.com/docs/payments/upi/
- **Checkout Integration:** https://razorpay.com/docs/payments/checkout/

### MediTrack Files
- **Backend:** `server/routes/billing.js` (lines 21-134)
- **Frontend:** `meditrack-client/src/pages/BillingDashboard.jsx` (lines 78-90, 269-355)
- **Model:** `server/models/Bill.js` (lines 20-22)

---

## ✅ Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend loads BillingDashboard
- [ ] Can search for patient
- [ ] Can create/view bill
- [ ] Payment method dropdown shows "UPI" option
- [ ] Selecting UPI shows "Pay with UPI" button
- [ ] Can save bill before payment
- [ ] Razorpay checkout opens on payment click
- [ ] Test payment completes successfully
- [ ] Bill status updates to "Paid"
- [ ] Receipt shows payment method as "UPI"
- [ ] Can print receipt with payment details
- [ ] Error handling works (network errors, failed payments)

---

## 🎉 You're All Set!

Your UPI payment system is ready. Start testing with:

```powershell
npm run start          # Terminal 1 - Backend
npm run client         # Terminal 2 - Frontend
```

**Happy billing! 💰**

---

## 📝 Next Steps

1. ✅ Test all payment flows
2. ✅ Train staff on UPI payment process
3. ✅ Set up monitoring (optional)
4. ✅ Plan migration to LIVE when ready
5. ✅ Monitor transactions & feedback

---

*Document Version: 1.0*  
*Last Updated: 2024*  
*Status: ✅ Production Ready (Test Mode)*
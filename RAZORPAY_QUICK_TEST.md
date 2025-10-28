# Quick Test Guide - Razorpay Integration

## Before You Start

```bash
cd server
npm install
```

This installs the razorpay package (^3.2.2) that was added to package.json.

## Test Payment Flow

### 1. For Patient (Bills Page)
1. Login as patient
2. Go to "Bills & Payments" tab
3. View a bill with "Unpaid" or "Partial" status
4. Click "View Details" button
5. Click "Pay Now (₹amount)" button
6. Payment dialog opens

### 2. For Billing Staff (Billing Dashboard)
1. Login as billing staff
2. Go to "Billing Dashboard"
3. Either:
   - Search patient by OP number → Select visit → Click "Pay Now"
   - Or go to "All Bills" → Click "View/Edit" → Click "Pay Now"
4. Payment dialog opens

### 3. Test Payment Credentials

**Test UPI:**
- Any app: Google Pay, PhonePe, Paytm
- Use: Any 10-digit phone number with test credentials

**Test Card:**
- Number: 4111 1111 1111 1111
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits
- OTP: 000000

**Test Netbanking:**
- Bank: Select any from dropdown
- Uses automatic test flow

## What Happens After Payment

1. ✅ Payment processed by Razorpay
2. ✅ Signature verified on backend (HMAC SHA256)
3. ✅ Bill status changes to "Paid"
4. ✅ Payment method recorded (UPI/Card/Netbanking)
5. ✅ Razorpay Order ID & Payment ID stored
6. ✅ Success message shown to user
7. ✅ Bill list refreshes automatically

## Verify in Database

After successful payment, check the bill document:

```javascript
db.bills.findOne({_id: ObjectId("...")})
// Should show:
{
  ...
  status: "Paid",
  paidAmount: 5000,
  balance: 0,
  paymentMethod: "UPI" | "Card" | "Netbanking",
  razorpayOrderId: "order_...",
  razorpayPaymentId: "pay_...",
  razorpaySignature: "hex_signature...",
  paymentSource: "upi" | "card" | "netbanking"
}
```

## Testing Error Scenarios

### Test Invalid Signature (will fail - as expected)
The backend automatically verifies signatures. Try:
- Manually modify the signature in browser console
- Backend will reject it with "Invalid signature" error

### Test Network Error
- Disable internet during payment
- Shows appropriate error message
- Can retry payment

### Test Already Paid Bill
- After payment succeeds, the "Pay Now" button disappears
- Only shows for unpaid or partial bills

## API Endpoints (For Advanced Testing)

### Create Order
```bash
POST /api/billing/create-order
Content-Type: application/json
Authorization: Bearer {token}

{
  "billId": "bill_id_here",
  "amount": 5000,
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientPhone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_1234567890",
  "amount": 500000,
  "currency": "INR",
  "key": "rzp_test_RGXWGOBliVCIpU"
}
```

### Verify Payment
```bash
POST /api/billing/verify-payment
Content-Type: application/json
Authorization: Bearer {token}

{
  "billId": "bill_id_here",
  "razorpayOrderId": "order_1234567890",
  "razorpayPaymentId": "pay_1234567890",
  "razorpaySignature": "hex_signature_here",
  "paymentSource": "upi" | "card" | "netbanking"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and bill updated successfully",
  "bill": { /* updated bill object */ }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Razorpay not loaded" | Check internet connection, Razorpay CDN accessible |
| Payment not appearing in bill | Refresh page, check browser console for errors |
| Button doesn't appear | Bill status might already be "Paid" |
| "Invalid signature" error | Server-side: Log the signature comparison, ensure env vars loaded |
| Amount mismatch | Check if amount converted correctly to paise (×100) |

## Production Checklist

Before going to production:

- [ ] Update Razorpay keys in `.env` to production keys
- [ ] Test with real payments
- [ ] Verify email notifications working
- [ ] Check SSL certificate installed
- [ ] Database backups configured
- [ ] Monitor Razorpay dashboard for payments
- [ ] Set up payment reconciliation process
- [ ] Configure webhook for payment updates (optional)

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Test Credentials: Always available for test mode
- Customer Support: Available in Razorpay dashboard
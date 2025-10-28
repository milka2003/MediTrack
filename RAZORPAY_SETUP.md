# Razorpay Integration Setup

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Variables
Your `.env` file already has Razorpay credentials. Verify:
```
key_id=rzp_test_RGXWGOBliVCIpU
key_secret=9Q49llzcN0kLD3021OoSstOp
```

### 3. Start the Server
```bash
npm run start
```

## Features Implemented

✅ **Backend Endpoints:**
- `POST /api/billing/create-order` - Creates Razorpay order
- `POST /api/billing/verify-payment` - Verifies payment with HMAC SHA256 signature

✅ **Frontend Components:**
- `RazorpayCheckout.jsx` - Payment dialog component
- Integration in `BillingDashboard.jsx` - Pay Now button for staff
- Integration in `patient/Bills.jsx` - Pay Now button for patients

✅ **Payment Methods Enabled:**
- UPI (Google Pay, PhonePe, Paytm, etc.)
- Credit/Debit Card
- Net Banking

✅ **Security:**
- HMAC SHA256 signature verification
- Secure order creation
- Bill status automatically updated on successful payment

## How It Works

1. **Patient/Staff clicks "Pay Now"** - Opens payment dialog
2. **Dialog calls `/api/billing/create-order`** - Creates Razorpay order
3. **Razorpay checkout opens** - User selects payment method (UPI/Card/Netbanking)
4. **Payment processed** - Razorpay handles transaction
5. **Signature verified** - Backend validates HMAC SHA256
6. **Bill updated** - Status changed to "Paid", payment method recorded
7. **Confirmation shown** - User sees success message

## Testing with Test Credentials

The test Razorpay account is ready for testing.

**Test Card:**
- Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits

## Database Schema Updated

Bill model now includes:
- `razorpayOrderId` - Razorpay order reference
- `razorpayPaymentId` - Razorpay payment reference  
- `razorpaySignature` - HMAC signature for verification
- `paymentSource` - Payment method (upi, card, netbanking)
- Payment method enum expanded: UPI, Card, Netbanking, Online

## API Response Format

### Create Order Response:
```json
{
  "success": true,
  "orderId": "order_1234567890",
  "amount": 50000,
  "currency": "INR",
  "key": "rzp_test_RGXWGOBliVCIpU"
}
```

### Verify Payment Response:
```json
{
  "success": true,
  "message": "Payment verified and bill updated successfully",
  "bill": { /* updated bill object */ }
}
```

## Error Handling

- Invalid signature returns 400 error
- Missing required fields returns 400 error  
- Payment verification failures return appropriate error messages
- Failed Razorpay order creation caught and logged

## Security Notes

- Never expose `key_secret` in frontend code
- All payment verification happens on backend
- HMAC signature prevents tampering with payment data
- Bill status only updated after signature verification passes
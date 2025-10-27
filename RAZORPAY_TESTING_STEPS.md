# 🎮 Razorpay UPI Testing - Step-by-Step Guide

**Complete walkthrough for testing UPI payments in MediTrack**

---

## 🚀 Phase 1: Start the Servers

### Step 1.1: Start Backend Server
```powershell
# Open PowerShell Terminal 1
Set-Location "c:\Users\MILKA JAMES\milka_hospital\meditrack\meditrack"
npm run start

# You should see:
# ✅ MongoDB connected
# ✅ Server running on port 5000
```

### Step 1.2: Start Frontend Server
```powershell
# Open PowerShell Terminal 2 (NEW TERMINAL)
Set-Location "c:\Users\MILKA JAMES\milka_hospital\meditrack\meditrack"
npm run client

# You should see:
# ✅ webpack compiled successfully
# ✅ Compiled successfully
```

### Step 1.3: Open Browser
- URL: `http://localhost:3000`
- You should see the MediTrack login page

---

## 🔐 Phase 2: Login

### Step 2.1: Navigate to Login
- You're already on login page
- Click on **Staff Login** tab (if not already selected)

### Step 2.2: Enter Billing Staff Credentials
Look for a test Billing staff account. If none exists, you may need to create one via Admin dashboard first.

Common test credentials:
- **Username**: `billing@test` or similar
- **Password**: Check with admin or use admin to create

### Step 2.3: Click Login
- Click **Login** button
- Wait for redirect to dashboard
- You should see **Billing Dashboard**

---

## 🔍 Phase 3: Search for Patient

### Step 3.1: Navigate to Billing Dashboard
- You should be on the Billing Dashboard
- Left sidebar shows menu options
- Click **Search Patient** (if not already selected)

### Step 3.2: Search by OP Number
```
1. Find the search field: "Search by OP Number"
2. Enter an existing patient OP number
   (e.g., OP001, OP002 - depending on your data)
3. Click Search button (🔍 icon)
```

### Step 3.3: View Patient Results
You should see:
```
✅ Patient Details
   - Name
   - OP Number
   - Phone
   - Age/Gender

✅ Recent Visits
   - Table with visit history
   - Doctor name
   - Status
   - Bill Status
```

---

## 💳 Phase 4: Create/View Bill

### Step 4.1: Click Action Button
In the Recent Visits table:
- Find the patient's visit record
- Click **Create Bill** button (if no bill exists)
- OR click **View Bill** (if bill already exists)

### Step 4.2: Bill Dialog Opens
You should see:
```
✅ Bill Items section
   - Auto-populated items from:
     * Consultation fees
     * Lab tests
     * Pharmacy prescriptions

✅ Paid Amount field
✅ Payment Method dropdown
✅ Total & Balance display
✅ Payment status indicator
```

---

## 💰 Phase 5: Prepare Bill for UPI Payment

### Step 5.1: Review Bill Items
- [ ] Consultation fee shown
- [ ] Lab tests listed (if any)
- [ ] Medicines listed (if any)
- [ ] All amounts look correct

### Step 5.2: Add Items if Needed
If bill items are incomplete:
```
1. Click "Add Item" button
2. Fill in:
   - Description (e.g., "Service")
   - Amount (e.g., 500)
   - Type (e.g., "Manual")
3. Click Save
```

### Step 5.3: Set Payment Method to UPI
```
1. Find "Payment Method" dropdown
2. Current value: "Cash" (default)
3. Click dropdown
4. Select "UPI" ← IMPORTANT
```

### Step 5.4: Save Bill First
```
🔴 IMPORTANT: Must save before payment!

1. Click "Save Bill" button
2. Wait for success message
3. ✅ Button turns green: "Update Bill"
```

---

## 📱 Phase 6: Initiate UPI Payment

### Step 6.1: Check Payment Button
After saving bill with UPI method selected:
- **Green button appears**: "Pay ₹XXX with UPI"
  (XXX = balance due amount)

### Step 6.2: Click UPI Payment Button
```
1. Ensure:
   ✅ Payment method = "UPI"
   ✅ Bill is saved
   ✅ Balance > 0
   
2. Click "Pay ₹XXX with UPI" button
3. Wait for Razorpay checkout to load
```

---

## 💳 Phase 7: Complete Test Payment

### Step 7.1: Razorpay Checkout Appears
A modal window opens with:
```
✅ Hospital name: "Holy Cross Hospital"
✅ Patient name: Pre-filled
✅ Amount: Shows balance due
✅ Payment options: UPI, Card, etc.
```

### Step 7.2: Select UPI Option
```
1. In checkout modal, find payment options
2. Look for "UPI" option
3. Click on UPI
```

### Step 7.3: Enter Test UPI Details

**IMPORTANT - Use Test Credentials:**

```
Phone Number:    9999999999
UPI ID:          success@razorpay
```

### Step 7.4: Enter OTP
```
OTP displayed:   000000
Paste/Type:      000000
```

### Step 7.5: Complete Payment
```
1. Click "Pay" or "Submit" button
2. Wait for verification
3. You should see:
   ✅ "Payment Successful" message
   ✅ Or error if something wrong
```

---

## ✅ Phase 8: Verify Payment Success

### Step 8.1: Check Success Message
In the browser:
```
✅ Green snackbar appears at bottom
   "Payment successful! Bill marked as paid."
```

### Step 8.2: Check Bill Status
Bill dialog updates:
```
Before Payment:
  Status: "UNPAID" (red chip)
  Balance: ₹500 (example)

After Payment:
  Status: "PAID" (green chip)
  Balance: ₹0
  Paid Amount: ₹500
```

### Step 8.3: Check Payment Method
```
Payment Method field changes to: "UPI"
```

---

## 🖨️ Phase 9: Print Receipt

### Step 9.1: Click Print Button
```
1. In bill dialog, find "Print" button
2. Click "Print" button
```

### Step 9.2: Receipt Opens in New Window
You should see:
```
✅ Hospital header: "Holy Cross Hospital"
✅ Patient details
✅ Bill items with amounts
✅ Total, Paid, Balance
✅ Payment Status: "PAID"
✅ Payment Method: "UPI"
✅ Receipt number & date
```

### Step 9.3: Print or Save
```
Browser print dialog:
1. Choose printer or "Save as PDF"
2. Adjust settings if needed
3. Click "Print" or "Save"
```

---

## 🔄 Phase 10: Test Other Scenarios

### Scenario A: Partial Payment (Optional)

**Test making partial payment:**

```
1. Create new bill with ₹1000 total
2. Set Paid Amount to ₹600
3. Set Payment Method to "Cash"
4. Save bill (status shows "PARTIAL")
5. Change payment method to "UPI"
6. Pay remaining ₹400 via UPI
7. Verify bill status changes to "PAID"
```

### Scenario B: Multiple Bills (Optional)

**Test multiple patient bills:**

```
1. Search for different patient
2. Create/view another bill
3. Test UPI payment flow again
4. Verify each bill updated separately
```

---

## 📊 Verification Checklist

### ✅ Expected Outcomes

| Test | Expected Result | Status |
|------|-----------------|--------|
| Search patient | Patient found with visits | [ ] |
| Create bill | Bill created with auto-items | [ ] |
| Select UPI | Dropdown changes to "UPI" | [ ] |
| Save bill | Success message shown | [ ] |
| Payment button | Green "Pay ₹XXX with UPI" appears | [ ] |
| Checkout opens | Razorpay modal appears | [ ] |
| Enter UPI ID | success@razorpay accepted | [ ] |
| Enter OTP | 000000 accepted | [ ] |
| Payment success | Green success message | [ ] |
| Bill status | Changes to "PAID" (green) | [ ] |
| Receipt prints | HTML receipt opens | [ ] |
| Payment method | Shows "UPI" in bill | [ ] |
| Database | Bill marked as Paid | [ ] |

---

## 🐛 Troubleshooting

### Problem: "Pay with UPI" button not showing

**Solutions:**
```
1. ✅ Check Payment Method is set to "UPI"
2. ✅ Click "Save Bill" first
3. ✅ Ensure balance > 0
4. ✅ Refresh page (F5)
5. ✅ Check browser console for errors (F12)
```

### Problem: Razorpay checkout doesn't open

**Solutions:**
```
1. ✅ Check browser console (F12 → Console tab)
2. ✅ Verify backend is running (check Terminal 1)
3. ✅ Check network tab for failed requests
4. ✅ Verify internet connection
5. ✅ Check firewall/proxy settings
```

### Problem: "Payment verification failed"

**Solutions:**
```
1. ✅ Check backend is running
2. ✅ Check server.log for errors
3. ✅ Verify Razorpay credentials in .env
4. ✅ Ensure KEY_SECRET is correct (no spaces)
5. ✅ Check amount being sent matches
```

### Problem: Bill doesn't update after payment

**Solutions:**
```
1. ✅ Wait 2-3 seconds (verification takes time)
2. ✅ Check backend console for errors
3. ✅ Refresh page (F5)
4. ✅ Close and reopen bill dialog
5. ✅ Check MongoDB for payment fields
```

---

## 📝 Notes for Testing

### Test Mode Behavior
```
✅ No real money charged
✅ Payment always succeeds with "success@razorpay"
✅ Perfect for training and demonstration
✅ Use success@razorpay for testing
```

### Production vs Test
```
TEST MODE (Current):
  Key: rzp_test_xxx
  Money: ₹0 (fake)
  Ready: NOW

LIVE MODE (Later):
  Key: rzp_live_xxx
  Money: Real (₹)
  When: After KYC verification
```

---

## 🎯 Success Criteria

Your UPI payment system is working correctly when:

```
✅ Can search patients
✅ Can create/view bills
✅ Can select UPI as payment method
✅ UPI payment button appears
✅ Razorpay checkout opens
✅ Can complete test payment
✅ Bill status updates to "PAID"
✅ Payment method shows "UPI"
✅ Receipt shows all payment details
✅ No errors in browser console
✅ No errors in server console
```

---

## 🚀 Next Steps After Testing

1. **Staff Training**
   - Train billing staff on UPI flow
   - Practice with test payments
   - Review error handling

2. **Go Live**
   - When confident, get LIVE credentials
   - Update .env with live keys
   - Test with small amounts first
   - Monitor transactions

3. **Documentation**
   - Provide staff guide
   - Create troubleshooting doc
   - Set up support process

---

## 📞 Need Help?

### Common Questions

**Q: Can I test without internet?**  
A: No, Razorpay requires internet connection

**Q: Will payments work in test mode?**  
A: Yes, but with test credentials only

**Q: How do I switch to live mode?**  
A: Update .env with LIVE credentials from Razorpay

**Q: Is test payment real?**  
A: No, test payments are simulated. No money changes hands.

---

## ✨ Tips for Success

1. 📋 Follow steps exactly as written
2. 🔍 Check console for errors (F12)
3. ⏱️ Wait for pages to load completely
4. 💾 Save bill before payment
5. ✔️ Use exact test credentials
6. 📱 Test on different devices if possible
7. 🔄 Repeat flow 3-5 times to get comfortable

---

## 🎉 Congratulations!

If you've completed all phases, your UPI payment system is:

✅ **Installed**  
✅ **Configured**  
✅ **Tested**  
✅ **Working**  

**You're ready to accept UPI payments!** 💳

---

*Testing Guide Version: 1.0*  
*Last Updated: 2024*  
*Status: ✅ Complete*
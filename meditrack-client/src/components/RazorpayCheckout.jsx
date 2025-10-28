import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import api from '../api/client';

const RazorpayCheckout = ({ 
  open, 
  onClose, 
  billId, 
  amount, 
  patientName, 
  patientEmail, 
  patientPhone,
  onPaymentSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => {
      setError('Failed to load payment gateway');
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!billId || !amount) {
      setError('Invalid bill information');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Step 1: Create order on backend
      const orderResponse = await api.post('/billing/create-order', {
        billId,
        amount,
        patientName: patientName || 'Patient',
        patientEmail: patientEmail || '',
        patientPhone: patientPhone || ''
      });

      if (!orderResponse.data.success) {
        throw new Error('Failed to create payment order');
      }

      setOrderCreated(true);
      const { orderId, key } = orderResponse.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: key,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        order_id: orderId,
        description: `Bill Payment - ${billId}`,
        prefill: {
          name: patientName || '',
          email: patientEmail || '',
          contact: patientPhone || ''
        },
        notes: {
          billId,
          patientName
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: false,
          emandate: false
        },
        handler: async (response) => {
          try {
            setLoading(true);

            // Step 3: Verify payment on backend
            const verifyResponse = await api.post('/billing/verify-payment', {
              billId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentSource: response.razorpay_payment_id ? 'card' : 'upi'
            });

            if (verifyResponse.data.success) {
              // Payment successful
              onPaymentSuccess(verifyResponse.data.bill);
              handleClose();
            } else {
              setError(verifyResponse.data.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled by user');
          }
        },
        theme: {
          color: '#0d47a1'
        }
      };

      // Open Razorpay checkout
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setLoading(false);
          setError(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      } else {
        throw new Error('Razorpay not loaded');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || err.message || 'Payment process failed');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setOrderCreated(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#f5f7fb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon sx={{ color: '#0d47a1' }} />
        Payment Details
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Order Summary */}
          <Card sx={{ bgcolor: '#f9f9f9', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Bill ID:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{billId}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Amount:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d47a1', fontSize: '1.1rem' }}>
                    ₹{amount?.toFixed(2)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Currency:</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>INR</Typography>
                </Grid>

                {patientName && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Patient:</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body2">{patientName}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Payment Methods Info */}
          <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Available Payment Methods:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2">✓ UPI (Google Pay, PhonePe, Paytm, etc.)</Typography>
              <Typography variant="body2">✓ Credit/Debit Card</Typography>
              <Typography variant="body2">✓ Net Banking</Typography>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Info Message */}
          <Alert severity="info">
            You will be redirected to the secure Razorpay payment gateway. Your payment data is encrypted and secure.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f5f7fb', gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          sx={{ bgcolor: '#0d47a1' }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
        >
          {loading ? 'Processing...' : `Pay ₹${amount?.toFixed(2)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RazorpayCheckout;
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import axios from 'axios';
import { API_URL } from '../../api/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import RazorpayCheckout from '../../components/RazorpayCheckout';

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/patient-portal/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBills(response.data);
    } catch (err) {
      setError('Failed to load bills. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (billId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/patient-portal/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBill(response.data);
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setPaymentSuccess(false);
  };

  const handlePaymentClick = () => {
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = (updatedBill) => {
    setPaymentSuccess(true);
    // Refresh bills list
    fetchBills();
    // Update selected bill
    setSelectedBill(updatedBill);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
  };

  const getBalanceDue = () => {
    if (!selectedBill) return 0;
    return (selectedBill.totalAmount || 0) - (selectedBill.discount || 0) - (selectedBill.amountPaid || 0);
  };

  const getPaymentStatusChip = (status) => {
    let color = 'default';
    switch (status) {
      case 'paid':
        color = 'success';
        break;
      case 'partial':
        color = 'warning';
        break;
      case 'unpaid':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    return <Chip label={status} color={color} size="small" />;
  };

  const downloadPDF = () => {
    if (!selectedBill) return;
    
    const doc = new jsPDF();
    
    // Add hospital header
    doc.setFontSize(18);
    doc.setTextColor(13, 71, 161); // #0D47A1
    doc.text('Holy Cross Hospital', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Invoice', 105, 25, { align: 'center' });
    
    // Bill info
    doc.setFontSize(11);
    doc.text(`Invoice #: ${selectedBill.billNumber}`, 14, 40);
    doc.text(`Date: ${formatDate(selectedBill.billDate)}`, 14, 48);
    doc.text(`Visit #: ${selectedBill.visit?.visitNumber || 'N/A'}`, 14, 56);
    
    // Patient info
    doc.text(`Patient: ${selectedBill.patient?.firstName} ${selectedBill.patient?.lastName}`, 140, 40, { align: 'right' });
    doc.text(`OP Number: ${selectedBill.patient?.opNumber}`, 140, 48, { align: 'right' });
    
    // Bill items
    doc.setFontSize(12);
    doc.text('Bill Details:', 14, 70);
    
    const tableData = [];
    if (selectedBill.items && selectedBill.items.length > 0) {
      selectedBill.items.forEach(item => {
        tableData.push([
          item.service?.name || item.description || 'Service',
          item.quantity || 1,
          formatCurrency(item.unitPrice || 0),
          formatCurrency(item.amount || 0)
        ]);
      });
    }
    
    doc.autoTable({
      startY: 75,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 71, 161], textColor: [255, 255, 255] }
    });
    
    // Summary
    const finalY = doc.lastAutoTable.finalY || 120;
    
    doc.setFontSize(11);
    doc.text('Subtotal:', 140, finalY + 10, { align: 'right' });
    doc.text(formatCurrency(selectedBill.totalAmount || 0), 170, finalY + 10, { align: 'right' });
    
    if (selectedBill.discount) {
      doc.text('Discount:', 140, finalY + 18, { align: 'right' });
      doc.text(formatCurrency(selectedBill.discount || 0), 170, finalY + 18, { align: 'right' });
    }
    
    doc.text('Total:', 140, finalY + 26, { align: 'right' });
    doc.text(formatCurrency((selectedBill.totalAmount || 0) - (selectedBill.discount || 0)), 170, finalY + 26, { align: 'right' });
    
    doc.text('Amount Paid:', 140, finalY + 34, { align: 'right' });
    doc.text(formatCurrency(selectedBill.amountPaid || 0), 170, finalY + 34, { align: 'right' });
    
    doc.text('Balance Due:', 140, finalY + 42, { align: 'right' });
    doc.text(formatCurrency((selectedBill.totalAmount || 0) - (selectedBill.discount || 0) - (selectedBill.amountPaid || 0)), 170, finalY + 42, { align: 'right' });
    
    // Payment status
    doc.text('Payment Status:', 140, finalY + 50, { align: 'right' });
    doc.text(selectedBill.paymentStatus?.toUpperCase() || 'UNPAID', 170, finalY + 50, { align: 'right' });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text('This is a computer-generated invoice and does not require signature.', 105, 285, { align: 'center' });
    }
    
    doc.save(`Invoice_${selectedBill.billNumber}.pdf`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Bills & Payments</Typography>
      
      {bills.length === 0 ? (
        <Alert severity="info">You don't have any bills available yet.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Bill #</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Visit #</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Amount</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill._id} hover>
                  <TableCell>{bill.billNumber}</TableCell>
                  <TableCell>{formatDate(bill.billDate)}</TableCell>
                  <TableCell>{bill.visit?.visitNumber || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(bill.totalAmount)}</TableCell>
                  <TableCell>{getPaymentStatusChip(bill.paymentStatus)}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleViewDetails(bill._id)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Bill Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f7fb', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Bill Details</span>
          {selectedBill && (
            <Stack direction="row" gap={1}>
              <Button 
                variant="contained" 
                size="small"
                onClick={downloadPDF}
                sx={{ bgcolor: '#0D47A1' }}
              >
                Download PDF
              </Button>
            </Stack>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {paymentSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✓ Payment successful! Your bill has been marked as paid.
            </Alert>
          )}
          {selectedBill && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Bill Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedBill.billNumber}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedBill.billDate)}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedBill.visit?.visitNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                <Typography variant="body1" gutterBottom>{getPaymentStatusChip(selectedBill.paymentStatus)}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 1, mb: 2, color: '#0D47A1' }}>Bill Items</Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedBill.items && selectedBill.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.service?.name || item.description || 'Service'}</TableCell>
                          <TableCell align="right">{item.quantity || 1}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.amount || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f7fb', borderRadius: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Subtotal:</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body1">{formatCurrency(selectedBill.totalAmount || 0)}</Typography>
                    </Grid>
                    
                    {selectedBill.discount > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Discount:</Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                          <Typography variant="body1">{formatCurrency(selectedBill.discount || 0)}</Typography>
                        </Grid>
                      </>
                    )}
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Total:</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body1">{formatCurrency((selectedBill.totalAmount || 0) - (selectedBill.discount || 0))}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Amount Paid:</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body1">{formatCurrency(selectedBill.amountPaid || 0)}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Balance Due:</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {formatCurrency((selectedBill.totalAmount || 0) - (selectedBill.discount || 0) - (selectedBill.amountPaid || 0))}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {selectedBill.notes && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" paragraph>{selectedBill.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f7fb' }}>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedBill && getBalanceDue() > 0 && selectedBill.paymentStatus !== 'paid' && (
            <Button 
              variant="contained"
              startIcon={<PaymentIcon />}
              sx={{ bgcolor: '#0D47A1' }}
              onClick={handlePaymentClick}
            >
              Pay Now (₹{getBalanceDue().toFixed(2)})
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Razorpay Checkout Dialog */}
      {selectedBill && (
        <RazorpayCheckout
          open={paymentDialogOpen}
          onClose={handleClosePaymentDialog}
          billId={selectedBill._id}
          amount={getBalanceDue()}
          patientName={selectedBill.patient?.firstName}
          patientEmail={selectedBill.patient?.email}
          patientPhone={selectedBill.patient?.phone}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Box>
  );
}

export default Bills;
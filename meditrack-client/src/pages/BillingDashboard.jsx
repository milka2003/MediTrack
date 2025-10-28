// src/pages/BillingDashboard.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Paper,
  Typography,
  TextField,
  Stack,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Snackbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import RazorpayCheckout from "../components/RazorpayCheckout";

// Icons
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';

function BillingDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [searchOp, setSearchOp] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [allBills, setAllBills] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [billDialog, setBillDialog] = useState(false);
  const [billItems, setBillItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('search'); // 'search' or 'all'
  const [snack, setSnack] = useState({ open: false, severity: "info", text: "" });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const openSnack = (severity, text) => setSnack({ open: true, severity, text });
  const closeSnack = () => setSnack({ ...snack, open: false });

  // Sidebar menu items
  const menuItems = [
    { id: 'search', label: 'Search Patient', icon: <SearchIcon /> },
    { id: 'all', label: 'All Bills', icon: <HistoryIcon /> },
    { id: 'reports', label: 'Reports', icon: <AssessmentIcon /> },
    { id: 'payments', label: 'Payments', icon: <PaymentIcon /> },
  ];

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuClick = (itemId) => {
    if (itemId === 'search' || itemId === 'all') {
      setView(itemId);
    }
    // Add other menu item handlers as needed
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const loadAllBills = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/billing');
      setAllBills(data.bills || []);
    } catch (e) {
      console.error(e);
      openSnack("error", "Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      navigate("/login");
      return;
    }
    if (view === 'all') {
      loadAllBills();
    }
  }, [navigate, view, loadAllBills]);

  const handleSearch = async () => {
    if (!searchOp.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/billing/search?opNumber=${searchOp}`);
      setSearchResults(data);
      openSnack("success", "Patient found");
    } catch (e) {
      console.error(e);
      setSearchResults(null);
      openSnack("error", e.response?.data?.message || "Patient not found");
    } finally {
      setLoading(false);
    }
  };

  const selectVisit = async (visit) => {
    try {
      const { data } = await api.get(`/billing/visit/${visit._id}`);

      const bill = data.bill;
      const fullVisit = data.visit; // Use the fully populated visit from API response

      setBillItems(bill.items || []);
      setPaidAmount(bill.paidAmount || 0);
      setPaymentMethod(bill.paymentMethod || 'Cash');

      // Update selectedVisit with the fully populated visit data and bill information
      const updatedVisit = { ...fullVisit, bill };
      setSelectedVisit(updatedVisit);
      setBillDialog(true);
    } catch (e) {
      console.error(e);
      openSnack("error", "Failed to load bill details");
    }
  };

  const calculateTotals = () => {
    const total = billItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const balance = total - paidAmount;
    return { total, balance };
  };

  const handleSaveBill = async () => {
    if (!selectedVisit?._id) {
      openSnack("error", "No visit selected to save");
      return;
    }

    try {
      const billData = {
        visitId: selectedVisit._id,
        items: billItems,
        paidAmount,
        paymentMethod
      };

      if (selectedVisit?.bill?._id) {
        // Update existing bill
        await api.put(`/billing/${selectedVisit.bill._id}`, billData);
        openSnack("success", "Bill updated successfully");
      } else {
        // Create new bill
        await api.post('/billing', billData);
        openSnack("success", "Bill created successfully");
      }

      // Reload the visit to keep the latest bill data ready for printing
      const { data } = await api.get(`/billing/visit/${selectedVisit._id}`);
      const updatedBill = data.bill || {};
      const fullVisit = data.visit || selectedVisit;

      setBillItems(updatedBill.items || []);
      setPaidAmount(updatedBill.paidAmount || 0);
      setPaymentMethod(updatedBill.paymentMethod || 'Cash');
      setSelectedVisit({ ...fullVisit, bill: updatedBill });

      setSearchResults((prev) => {
        if (!prev?.visits) return prev;
        const updatedVisits = prev.visits.map((visit) =>
          visit._id === fullVisit._id ? { ...fullVisit, bill: updatedBill } : visit
        );
        return { ...prev, visits: updatedVisits };
      });

      if (view === 'all') {
        await loadAllBills();
      }
    } catch (e) {
      console.error(e);
      openSnack("error", e.response?.data?.message || "Failed to save bill");
    }
  };

  const addBillItem = () => {
    setBillItems([...billItems, { description: "", amount: 0, type: 'manual' }]);
  };

  const updateBillItem = (index, field, value) => {
    const updated = [...billItems];
    updated[index][field] = value;
    setBillItems(updated);
  };

  const removeBillItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'success';
      case 'Partial': return 'warning';
      case 'Unpaid': return 'error';
      default: return 'default';
    }
  };

  const userName = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").name || "Billing Staff"; }
    catch { return "Billing Staff"; }
  })();

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      navigate("/login");
    }
  };

  const handlePrint = () => {
    console.log('Generating receipt for selectedVisit:', selectedVisit);
    console.log('Patient data:', selectedVisit?.patientId);
    console.log('Doctor data:', selectedVisit?.doctorId);
    console.log('Doctor user:', selectedVisit?.doctorId?.user);
    console.log('Doctor user name:', selectedVisit?.doctorId?.user?.name);

    // Create a print-friendly receipt
    const printWindow = window.open('', '_blank');
    const receiptContent = generateReceiptHTML();
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generateReceiptHTML = () => {
    console.log('generateReceiptHTML - selectedVisit:', selectedVisit);
    console.log('generateReceiptHTML - patientId:', selectedVisit?.patientId);
    console.log('generateReceiptHTML - doctorId:', selectedVisit?.doctorId);
    console.log('generateReceiptHTML - doctor user:', selectedVisit?.doctorId?.user);
    console.log('generateReceiptHTML - doctor user name:', selectedVisit?.doctorId?.user?.name);

    const { total, balance } = calculateTotals();
    const billDate = new Date().toLocaleDateString();
    const billTime = new Date().toLocaleTimeString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MediTrack Bill Receipt</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              border: 1px solid #ccc;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #0d47a1;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .hospital-name {
              font-size: 24px;
              font-weight: bold;
              color: #0d47a1;
              margin: 0;
            }
            .hospital-details {
              font-size: 12px;
              color: #666;
              margin: 5px 0;
            }
            .bill-title {
              font-size: 18px;
              font-weight: bold;
              margin: 15px 0;
              text-align: center;
            }
            .patient-info, .bill-info {
              margin-bottom: 15px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 14px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .items-table th, .items-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            .items-table th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .amount-cell {
              text-align: right;
            }
            .totals {
              border-top: 2px solid #0d47a1;
              margin-top: 15px;
              padding-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 14px;
              margin: 5px 0;
            }
            .status {
              text-align: center;
              margin: 15px 0;
              padding: 10px;
              border: 1px solid #ccc;
              background-color: #f9f9f9;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .receipt { border: none; max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1 class="hospital-name">Holy Cross Hospital</h1>
              <div class="hospital-details">123 Medical Center, City - 123456</div>
              <div class="hospital-details">Phone: 7356988696 | Email: holycrosskvply@gmail.com</div>
            </div>

            <div class="bill-title">BILL RECEIPT</div>

            <div class="patient-info">
              <div class="info-row">
                <span><strong>Patient Name:</strong></span>
                <span>${selectedVisit?.patientId?.firstName || 'N/A'} ${selectedVisit?.patientId?.lastName || ''}</span>
              </div>
              <div class="info-row">
                <span><strong>OP Number:</strong></span>
                <span>${selectedVisit?.opNumber || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span><strong>Age/Gender:</strong></span>
                <span>${selectedVisit?.patientId?.age || 'N/A'} / ${selectedVisit?.patientId?.gender || 'N/A'}</span>
              </div>
            </div>

            <div class="bill-info">
              <div class="info-row">
                <span><strong>Bill Date:</strong></span>
                <span>${billDate}</span>
              </div>
              <div class="info-row">
                <span><strong>Bill Time:</strong></span>
                <span>${billTime}</span>
              </div>
              <div class="info-row">
                <span><strong>Token Number:</strong></span>
                <span>${selectedVisit?.tokenNumber || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span><strong>Doctor:</strong></span>
                <span>${selectedVisit?.doctorId?.user?.name || 'N/A'}</span>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount-cell">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${billItems.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="amount-cell">${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Total Amount:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Amount Paid:</span>
                <span>₹${paidAmount.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>${balance > 0 ? 'Balance Due:' : balance < 0 ? 'Credit:' : 'Balance:'}</span>
                <span>₹${Math.abs(balance).toFixed(2)}</span>
              </div>
            </div>

            <div class="status">
              <strong>Payment Status: ${balance <= 0 ? 'PAID' : balance === total ? 'UNPAID' : 'PARTIAL'}</strong><br>
              <span>Payment Method: ${paymentMethod}</span>
            </div>

            <div class="footer">
              <div>Thank you for choosing MediTrack Hospital</div>
              <div>Generated by: ${userName} | Date: ${billDate}</div>
              <div style="margin-top: 10px; font-size: 10px;">
                This is a computer generated receipt and does not require signature.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const { total, balance } = calculateTotals();

  return (
    <Box sx={{ display: 'flex', minHeight: "100vh", bgcolor: "#f6f9fc" }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid #eaeef4',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #eaeef4' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: '#0d47a1', width: 40, height: 40 }}>
              <AccountBalanceWalletIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: "#0d47a1", fontWeight: 700, fontSize: '1.1rem' }}>
                MediTrack
              </Typography>
              <Typography variant="caption" sx={{ color: "#455a64" }}>
                Billing System
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        <Box sx={{ flexGrow: 1, py: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ px: 1 }}>
                <ListItemButton
                  selected={view === item.id}
                  onClick={() => handleMenuClick(item.id)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    '&.Mui-selected': {
                      bgcolor: '#e3f2fd',
                      color: '#0d47a1',
                      '&:hover': {
                        bgcolor: '#e3f2fd',
                      },
                    },
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: view === item.id ? '#0d47a1' : '#455a64', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontSize: '0.9rem',
                        fontWeight: view === item.id ? 600 : 400,
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid #eaeef4' }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Avatar sx={{ bgcolor: '#0d47a1', width: 32, height: 32 }}>
              <PersonIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ color: "#0d47a1", fontWeight: 600 }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: "#455a64" }}>
                Billing Staff
              </Typography>
            </Box>
          </Stack>
          <Button 
            fullWidth 
            startIcon={<LogoutIcon />} 
            variant="outlined" 
            color="inherit" 
            onClick={handleLogout}
            sx={{ borderColor: '#e0e0e0', color: '#455a64' }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: "#ffffff", color: "#0d47a1", borderBottom: "1px solid #eaeef4" }}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between", flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              {isMobile && (
                <IconButton onClick={handleSidebarToggle} sx={{ color: '#0d47a1' }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ color: "#0d47a1", fontWeight: 700 }}>
                {menuItems.find(item => item.id === view)?.label || 'Billing Dashboard'}
              </Typography>
              {view === 'search' && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Search by OP Number"
                    value={searchOp}
                    onChange={(e) => setSearchOp(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    startIcon={<SearchIcon />}
                    variant="contained"
                    size="small"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    Search
                  </Button>
                  {searchResults && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSearchResults(null);
                        setSearchOp("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
            {!isMobile && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle2" sx={{ color: "#455a64" }}>{userName}</Typography>
                <Button startIcon={<LogoutIcon />} variant="outlined" color="inherit" onClick={handleLogout}>Logout</Button>
              </Stack>
            )}
          </Toolbar>
        </AppBar>

      <Box sx={{ p: 3 }}>
        {view === 'search' && (
          <>
            {searchResults && (
              <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: "#0d47a1", fontWeight: 600 }}>
                  Patient Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography><strong>Name:</strong> {searchResults.patient.firstName} {searchResults.patient.lastName}</Typography>
                    <Typography><strong>OP Number:</strong> {searchResults.patient.opNumber}</Typography>
                    <Typography><strong>Phone:</strong> {searchResults.patient.phone}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography><strong>Age:</strong> {searchResults.patient.age}</Typography>
                    <Typography><strong>Gender:</strong> {searchResults.patient.gender}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom sx={{ color: "#0d47a1", fontWeight: 600 }}>
                  Recent Visits
                </Typography>
                <Table size="small" sx={{ width: '100%' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Bill Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#0d47a1' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.visits.map((visit) => (
                      <TableRow key={visit._id} hover>
                        <TableCell>{new Date(visit.appointmentDate).toLocaleDateString()}</TableCell>
                        <TableCell>{visit.doctorId?.user?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={visit.status}
                            color={visit.status === 'closed' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {visit.bill ? (
                            <Chip
                              size="small"
                              label={visit.bill.status}
                              color={getStatusColor(visit.bill.status)}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">No Bill</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ReceiptIcon />}
                            onClick={() => selectVisit(visit)}
                          >
                            {visit.bill ? 'View Bill' : 'Create Bill'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            {!searchResults && (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h6" color="text.secondary">
                  Search for a patient by OP number to manage billing
                </Typography>
              </Paper>
            )}
          </>
        )}

        {view === 'all' && (
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ color: "#0d47a1", fontWeight: 600 }}>
                All Bills
              </Typography>
              <Button
                startIcon={<RefreshIcon />}
                variant="outlined"
                size="small"
                onClick={loadAllBills}
                disabled={loading}
              >
                Refresh
              </Button>
            </Stack>
            {loading && <Typography>Loading bills...</Typography>}
            {!loading && allBills.length === 0 && (
              <Typography color="text.secondary">No bills found</Typography>
            )}
            {!loading && allBills.length > 0 && (
              <Table size="small" sx={{ width: '100%' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>OP Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Paid</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Balance</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#0d47a1' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allBills.map((bill) => (
                    <TableRow key={bill._id} hover>
                      <TableCell>{new Date(bill.generatedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{bill.patientId?.firstName} {bill.patientId?.lastName}</TableCell>
                      <TableCell>{bill.patientId?.opNumber}</TableCell>
                      <TableCell>₹{bill.totalAmount?.toFixed(2)}</TableCell>
                      <TableCell>₹{bill.paidAmount?.toFixed(2)}</TableCell>
                      <TableCell>₹{bill.balance?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={bill.status}
                          color={getStatusColor(bill.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            // Load bill details for editing
                            setSelectedVisit({ _id: bill.visitId._id, bill, opNumber: bill.patientId?.opNumber });
                            setBillItems(bill.items || []);
                            setPaidAmount(bill.paidAmount || 0);
                            setPaymentMethod(bill.paymentMethod || 'Cash');
                            setBillDialog(true);
                          }}
                        >
                          View/Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        )}
      </Box>

      {/* Bill Dialog */}
      <Dialog open={billDialog} onClose={() => setBillDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedVisit?.bill ? 'Update Bill' : 'Create Bill'} - OP: {selectedVisit?.opNumber}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="h6">Bill Items</Typography>
            {billItems.map((item, index) => (
              <Card key={index} variant="outlined">
                <CardContent sx={{ pb: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <TextField
                        label="Description"
                        value={item.description}
                        onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Amount"
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateBillItem(index, 'amount', parseFloat(e.target.value) || 0)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        select
                        label="Type"
                        value={item.type}
                        onChange={(e) => updateBillItem(index, 'type', e.target.value)}
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="consultation">Consultation</MenuItem>
                        <MenuItem value="lab">Lab</MenuItem>
                        <MenuItem value="pharmacy">Pharmacy</MenuItem>
                        <MenuItem value="manual">Manual</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton
                        color="error"
                        onClick={() => removeBillItem(index)}
                        size="small"
                      >
                        ×
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button startIcon={<AddIcon />} onClick={addBillItem} variant="outlined" size="small">
              Add Item
            </Button>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Paid Amount"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" color="primary">
                  Total: ₹{total.toFixed(2)}
                </Typography>
                <Typography variant="h6" color={balance > 0 ? "error" : balance < 0 ? "info" : "success"}>
                  {balance > 0 ? `Balance Due: ₹${balance.toFixed(2)}` :
                   balance < 0 ? `Credit: ₹${Math.abs(balance).toFixed(2)}` :
                   `Balance: ₹${balance.toFixed(2)}`}
                </Typography>
                <Chip
                  label={balance <= 0 ? 'Paid' : balance === total ? 'Unpaid' : 'Partial'}
                  color={getStatusColor(balance <= 0 ? 'Paid' : balance === total ? 'Unpaid' : 'Partial')}
                  size="small"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBillDialog(false)}>Cancel</Button>
          <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="outlined">
            Print
          </Button>
          {balance > 0 && (
            <Button 
              onClick={() => setPaymentDialogOpen(true)} 
              startIcon={<PaymentIcon />} 
              variant="contained" 
              sx={{ bgcolor: '#ff6f00' }}
            >
              Pay Now (₹{balance.toFixed(2)})
            </Button>
          )}
          <Button onClick={handleSaveBill} variant="contained">
            {selectedVisit?.bill ? 'Update Bill' : 'Save Bill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Razorpay Checkout Dialog */}
      {selectedVisit?.bill && (
        <RazorpayCheckout
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          billId={selectedVisit.bill._id}
          amount={balance}
          patientName={selectedVisit.bill.patientId?.firstName}
          patientEmail={selectedVisit.bill.patientId?.email}
          patientPhone={selectedVisit.bill.patientId?.phone}
          onPaymentSuccess={(updatedBill) => {
            openSnack('success', 'Payment successful! Bill has been marked as paid.');
            setBillDialog(false);
            setPaymentDialogOpen(false);
            if (view === 'all') loadAllBills();
          }}
        />
      )}

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={closeSnack}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: '100%' }}>
            {snack.text}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default BillingDashboard;
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
  Chip
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../api/client';
import { jsPDF } from 'jspdf';

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

// Format date with time
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate age from DOB
const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
};

// Safe text conversion for jsPDF
const safeText = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value;
  return String(value);
};

function LabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/patient-portal/lab-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (err) {
      setError('Failed to load lab reports. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/patient-portal/lab-reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedReport(response.data);
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const downloadPDF = () => {
    if (!selectedReport) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 10;
    
    // ========== PROFESSIONAL HEADER ==========
    doc.setDrawColor(13, 71, 161);
    doc.setLineWidth(1);
    doc.line(10, yPos, pageWidth - 10, yPos);
    
    yPos += 6;
    
    // Hospital name and facility info
    doc.setFontSize(18);
    doc.setTextColor(13, 71, 161);
    doc.setFont(undefined, 'bold');
    doc.text('HOLY CROSS HOSPITAL', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 6;
    
    // Facility details
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont(undefined, 'normal');
    doc.text('Accredited Medical Laboratory • ISO 15189 Certified', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('Phone: (123) 456-7890 | Email: lab@holycross.hospital | Web: www.holycross.hospital', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 5;
    doc.setDrawColor(13, 71, 161);
    doc.setLineWidth(0.5);
    doc.line(10, yPos, pageWidth - 10, yPos);
    
    yPos += 6;
    
    // Report type
    doc.setFontSize(14);
    doc.setTextColor(13, 71, 161);
    doc.setFont(undefined, 'bold');
    doc.text('LABORATORY REPORT', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    
    // ========== PATIENT DEMOGRAPHICS SECTION ==========
    doc.setFontSize(10);
    doc.setTextColor(13, 71, 161);
    doc.setFont(undefined, 'bold');
    doc.text('PATIENT INFORMATION', 10, yPos);
    yPos += 5;
    
    // Two column layout for patient info
    const leftCol = 10;
    const rightCol = pageWidth / 2 + 5;
    const lineHeight = 4.5;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // Left column
    doc.text('Name:', leftCol, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(safeText((selectedReport.patient?.firstName || '') + ' ' + (selectedReport.patient?.lastName || '')), leftCol + 20, yPos);
    
    doc.setFont(undefined, 'normal');
    doc.text('OP Number:', leftCol, yPos + lineHeight);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(selectedReport.patient?.opNumber), leftCol + 20, yPos + lineHeight);
    
    doc.setFont(undefined, 'normal');
    doc.text('DOB:', leftCol, yPos + lineHeight * 2);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(formatDate(selectedReport.patient?.dob)), leftCol + 20, yPos + lineHeight * 2);
    
    doc.setFont(undefined, 'normal');
    doc.text('Gender:', leftCol, yPos + lineHeight * 3);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(selectedReport.patient?.gender), leftCol + 20, yPos + lineHeight * 3);
    
    // Right column
    doc.setFont(undefined, 'normal');
    doc.text('Age:', rightCol, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(calculateAge(selectedReport.patient?.dob)) + ' years', rightCol + 15, yPos);
    
    doc.setFont(undefined, 'normal');
    doc.text('Phone:', rightCol, yPos + lineHeight);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(selectedReport.patient?.phone), rightCol + 15, yPos + lineHeight);
    
    doc.setFont(undefined, 'normal');
    doc.text('Address:', rightCol, yPos + lineHeight * 2);
    doc.setFont(undefined, 'bold');
    const addressText = safeText(selectedReport.patient?.address).substring(0, 30);
    doc.text(addressText, rightCol + 15, yPos + lineHeight * 2);
    
    yPos += lineHeight * 4 + 2;
    
    // ========== TEST INFORMATION SECTION ==========
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(10, yPos, pageWidth - 10, yPos);
    yPos += 5;
    
    doc.setFontSize(10);
    doc.setTextColor(13, 71, 161);
    doc.setFont(undefined, 'bold');
    doc.text('TEST INFORMATION', 10, yPos);
    yPos += 5;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // Test details in grid
    doc.text('Test Name:', leftCol, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(selectedReport.testName), leftCol + 20, yPos);
    
    doc.setFont(undefined, 'normal');
    doc.text('Ordered By:', leftCol, yPos + lineHeight);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(selectedReport.orderedBy?.name), leftCol + 20, yPos + lineHeight);
    
    doc.setFont(undefined, 'normal');
    doc.text('Visit Number:', rightCol, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(selectedReport.visit?.visitNumber), rightCol + 15, yPos);
    
    doc.setFont(undefined, 'normal');
    doc.text('Visit Date:', rightCol, yPos + lineHeight);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(formatDate(selectedReport.visit?.visitDate)), rightCol + 15, yPos + lineHeight);
    
    yPos += lineHeight * 2 + 3;
    
    // ========== COLLECTION AND RESULT TIMING ==========
    doc.setDrawColor(220, 220, 220);
    doc.line(10, yPos, pageWidth - 10, yPos);
    yPos += 5;
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    doc.text('Sample Collected:', leftCol, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(formatDateTime(selectedReport.sampleCollectedAt)), leftCol + 28, yPos);
    
    doc.setFont(undefined, 'normal');
    doc.text('Report Generated:', rightCol, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(safeText(formatDateTime(selectedReport.completedAt)), rightCol + 28, yPos);
    
    yPos += 8;
    
    // ========== TEST RESULTS TABLE ==========
    doc.setDrawColor(220, 220, 220);
    doc.line(10, yPos, pageWidth - 10, yPos);
    yPos += 5;
    
    doc.setFontSize(10);
    doc.setTextColor(13, 71, 161);
    doc.setFont(undefined, 'bold');
    doc.text('LABORATORY TEST RESULTS', 10, yPos);
    
    yPos += 7;
    
    // Table setup
    const colWidths = [35, 25, 20, 40, 30]; // Total: 150
    const headers = ['Parameter', 'Value', 'Unit', 'Reference Range', 'Status'];
    const cellHeight = 7;
    const rowHeight = 6;
    
    // Table header background
    doc.setFillColor(13, 71, 161);
    doc.setDrawColor(13, 71, 161);
    let xPos = 10;
    for (let i = 0; i < colWidths.length; i++) {
      doc.rect(xPos, yPos - cellHeight + 1, colWidths[i], cellHeight, 'FD');
      xPos += colWidths[i];
    }
    
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    xPos = 10;
    headers.forEach((header, i) => {
      doc.text(header, xPos + 2, yPos - 1, { maxWidth: colWidths[i] - 4, align: 'left' });
      xPos += colWidths[i];
    });
    
    yPos += 3;
    
    // Table rows
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    let rowIndex = 0;
    if (selectedReport.results && selectedReport.results.length > 0) {
      selectedReport.results.forEach(result => {
        // Check if new page is needed
        if (yPos > pageHeight - 35) {
          doc.addPage();
          yPos = 10;
        }
        
        const rowY = yPos;
        
        // Alternate row background color
        if (rowIndex % 2 === 1) {
          doc.setFillColor(245, 248, 255);
          xPos = 10;
          for (let i = 0; i < colWidths.length; i++) {
            doc.rect(xPos, rowY - rowHeight + 1, colWidths[i], rowHeight, 'F');
            xPos += colWidths[i];
          }
        }
        
        // Add borders
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        xPos = 10;
        for (let i = 0; i < colWidths.length; i++) {
          doc.rect(xPos, rowY - rowHeight + 1, colWidths[i], rowHeight);
          xPos += colWidths[i];
        }
        
        // Cell data - ensure all values are strings
        const rowData = [
          safeText(result.parameter).substring(0, 30),
          safeText(result.value).substring(0, 20),
          safeText(result.unit).substring(0, 15),
          safeText(result.normalRange).substring(0, 30),
          safeText(result.interpretation).substring(0, 20)
        ];
        
        xPos = 10;
        doc.setTextColor(0, 0, 0);
        rowData.forEach((cell, i) => {
          // Color-code status column
          if (i === 4) {
            const status = safeText(result.interpretation).toLowerCase();
            if (status === 'normal') {
              doc.setTextColor(34, 139, 34); // Green
            } else if (status === 'high' || status === 'low') {
              doc.setTextColor(200, 0, 0); // Red
            } else if (status === 'abnormal') {
              doc.setTextColor(255, 140, 0); // Orange
            } else {
              doc.setTextColor(0, 0, 0);
            }
          } else {
            doc.setTextColor(0, 0, 0);
          }
          
          doc.text(safeText(cell), xPos + 2, rowY - 1, { maxWidth: colWidths[i] - 4, align: 'left' });
          xPos += colWidths[i];
        });
        
        yPos += rowHeight;
        rowIndex++;
      });
    } else {
      doc.text('No test results available', 10, yPos);
      yPos += 8;
    }
    
    yPos += 5;
    
    // ========== CLINICAL NOTES & INTERPRETATION ==========
    if (selectedReport.notes || selectedReport.overallRemarks || selectedReport.summaryResult) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 15;
      }
      
      doc.setDrawColor(220, 220, 220);
      doc.line(10, yPos, pageWidth - 10, yPos);
      yPos += 5;
      
      doc.setFontSize(10);
      doc.setTextColor(13, 71, 161);
      doc.setFont(undefined, 'bold');
      doc.text('CLINICAL NOTES & INTERPRETATION', 10, yPos);
      
      yPos += 6;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      
      if (selectedReport.summaryResult) {
        doc.setFont(undefined, 'bold');
        doc.text('Summary Result:', 10, yPos);
        doc.setFont(undefined, 'normal');
        const summaryLines = doc.splitTextToSize(safeText(selectedReport.summaryResult), pageWidth - 20);
        summaryLines.forEach((line, idx) => {
          doc.text(safeText(line), 10, yPos + (idx + 1) * 4);
        });
        yPos += summaryLines.length * 4 + 4;
      }
      
      if (selectedReport.notes) {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 15;
        }
        doc.setFont(undefined, 'bold');
        doc.text('Notes:', 10, yPos);
        doc.setFont(undefined, 'normal');
        const notesLines = doc.splitTextToSize(safeText(selectedReport.notes), pageWidth - 20);
        notesLines.forEach((line, idx) => {
          if (yPos + (idx + 1) * 4 > pageHeight - 20) {
            doc.addPage();
            yPos = 15;
          }
          doc.text(safeText(line), 10, yPos + (idx + 1) * 4);
        });
        yPos += notesLines.length * 4 + 2;
      }
      
      if (selectedReport.overallRemarks) {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 15;
        }
        doc.setFont(undefined, 'bold');
        doc.text('Lab Remarks:', 10, yPos);
        doc.setFont(undefined, 'normal');
        const remarkLines = doc.splitTextToSize(safeText(selectedReport.overallRemarks), pageWidth - 20);
        remarkLines.forEach((line, idx) => {
          if (yPos + (idx + 1) * 4 > pageHeight - 20) {
            doc.addPage();
            yPos = 15;
          }
          doc.text(safeText(line), 10, yPos + (idx + 1) * 4);
        });
      }
    }
    
    // ========== FOOTER ON ALL PAGES ==========
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(13, 71, 161);
      doc.setLineWidth(0.5);
      doc.line(10, pageHeight - 14, pageWidth - 10, pageHeight - 14);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('This is a computer-generated report. No signature required. Valid with hospital seal.', pageWidth / 2, pageHeight - 9, { align: 'center' });
      doc.text(safeText('Page ' + String(i) + ' of ' + String(pageCount)), pageWidth - 25, pageHeight - 9);
    }
    
    doc.save(`Lab_Report_${selectedReport.testName.replace(/\s+/g, '_')}_${formatDate(selectedReport.completedAt).replace(/\s+/g, '_')}.pdf`);
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
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Lab Reports</Typography>
      
      {reports.length === 0 ? (
        <Alert severity="info">You don't have any lab reports available yet.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Test Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Visit #</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Ordered By</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id} hover>
                  <TableCell>{report.testName}</TableCell>
                  <TableCell>{formatDate(report.updatedAt)}</TableCell>
                  <TableCell>{report.visit?.visitNumber || 'N/A'}</TableCell>
                  <TableCell>{report.orderedBy?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleViewDetails(report._id)}
                      sx={{ mr: 1 }}
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

      {/* Lab Report Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f7fb', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Lab Report Details</span>
          {selectedReport && (
            <Button 
              variant="contained" 
              size="small"
              onClick={downloadPDF}
              sx={{ bgcolor: '#0D47A1' }}
            >
              Download PDF
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Test Name</Typography>
                <Typography variant="body1" gutterBottom>{selectedReport.testName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedReport.updatedAt)}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedReport.visit?.visitNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Ordered By</Typography>
                <Typography variant="body1" gutterBottom>{selectedReport.orderedBy?.name || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 1, mb: 2, color: '#0D47A1' }}>Test Results</Typography>
                
                {selectedReport.results && selectedReport.results.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Parameter</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Unit</TableCell>
                          <TableCell>Normal Range</TableCell>
                          <TableCell>Interpretation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedReport.results.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.parameter}</TableCell>
                            <TableCell>{result.value}</TableCell>
                            <TableCell>{result.unit || '-'}</TableCell>
                            <TableCell>{result.normalRange || '-'}</TableCell>
                            <TableCell>
                              {result.interpretation ? (
                                <Chip 
                                  label={result.interpretation} 
                                  size="small"
                                  color={
                                    result.interpretation.toLowerCase() === 'normal' ? 'success' :
                                    result.interpretation.toLowerCase() === 'high' ? 'error' :
                                    result.interpretation.toLowerCase() === 'low' ? 'warning' :
                                    'default'
                                  }
                                />
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">No detailed results available</Typography>
                )}
              </Grid>
              
              {selectedReport.notes && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" paragraph>{selectedReport.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LabReports;
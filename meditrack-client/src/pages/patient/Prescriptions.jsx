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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { API_URL } from '../../api/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

function Prescriptions() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/patient-portal/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultations(response.data);
    } catch (err) {
      setError('Failed to load prescriptions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (consultation) => {
    setSelectedConsultation(consultation);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const downloadPDF = () => {
    if (!selectedConsultation) return;
    
    const doc = new jsPDF();
    
    // Add hospital header
    doc.setFontSize(18);
    doc.setTextColor(13, 71, 161); // #0D47A1
    doc.text('Holy Cross Hospital', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Prescription', 105, 25, { align: 'center' });
    
    // Patient and consultation info
    doc.setFontSize(11);
    doc.text(`Patient: ${selectedConsultation.patient?.firstName} ${selectedConsultation.patient?.lastName}`, 14, 40);
    doc.text(`OP Number: ${selectedConsultation.patient?.opNumber}`, 14, 48);
    doc.text(`Visit #: ${selectedConsultation.visit?.visitNumber}`, 14, 56);
    doc.text(`Date: ${formatDate(selectedConsultation.consultationDate)}`, 14, 64);
    doc.text(`Doctor: ${selectedConsultation.doctor?.name || 'N/A'}`, 14, 72);
    
    // Diagnosis
    if (selectedConsultation.diagnosis) {
      doc.setFontSize(12);
      doc.text('Diagnosis:', 14, 85);
      doc.setFontSize(10);
      doc.text(selectedConsultation.diagnosis, 14, 93);
    }
    
    // Medications
    doc.setFontSize(12);
    doc.text('Medications:', 14, 105);
    
    const tableData = [];
    if (selectedConsultation.prescriptions && selectedConsultation.prescriptions.length > 0) {
      selectedConsultation.prescriptions.forEach(prescription => {
        const medicineName = prescription.medicine?.name || 'N/A';
        const dosage = `${prescription.medicine?.dosageForm || ''} ${prescription.medicine?.strength || ''}`;
        tableData.push([
          medicineName,
          dosage,
          prescription.dosage || '',
          prescription.frequency || '',
          prescription.duration || '',
          prescription.instructions || ''
        ]);
      });
    }
    
    doc.autoTable({
      startY: 110,
      head: [['Medicine', 'Form/Strength', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 71, 161], textColor: [255, 255, 255] }
    });
    
    // Notes
    if (selectedConsultation.notes) {
      const finalY = doc.lastAutoTable.finalY || 120;
      doc.text('Notes:', 14, finalY + 10);
      doc.setFontSize(10);
      doc.text(selectedConsultation.notes, 14, finalY + 18);
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text('This is a computer-generated prescription.', 105, 285, { align: 'center' });
    }
    
    doc.save(`Prescription_${selectedConsultation.visit?.visitNumber || 'Consultation'}.pdf`);
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
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Prescriptions</Typography>
      
      {consultations.length === 0 ? (
        <Alert severity="info">You don't have any prescriptions available yet.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Visit #</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Doctor</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Diagnosis</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Medications</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consultations.map((consultation) => (
                <TableRow key={consultation._id} hover>
                  <TableCell>{formatDate(consultation.consultationDate)}</TableCell>
                  <TableCell>{consultation.visit?.visitNumber || 'N/A'}</TableCell>
                  <TableCell>{consultation.doctor?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {consultation.diagnosis ? 
                      (consultation.diagnosis.length > 30 ? 
                        `${consultation.diagnosis.substring(0, 30)}...` : 
                        consultation.diagnosis) : 
                      'Not specified'}
                  </TableCell>
                  <TableCell>{consultation.prescriptions?.length || 0} medications</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleViewDetails(consultation)}
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

      {/* Prescription Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f7fb', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Prescription Details</span>
          {selectedConsultation && (
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
          {selectedConsultation && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedConsultation.consultationDate)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedConsultation.visit?.visitNumber || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Doctor</Typography>
                <Typography variant="body1" gutterBottom>{selectedConsultation.doctor?.name || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Diagnosis</Typography>
                <Typography variant="body1" paragraph>{selectedConsultation.diagnosis || 'Not specified'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 1, mb: 2, color: '#0D47A1' }}>Prescribed Medications</Typography>
                
                {selectedConsultation.prescriptions && selectedConsultation.prescriptions.length > 0 ? (
                  selectedConsultation.prescriptions.map((prescription, index) => (
                    <Accordion key={index} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>
                          {prescription.medicine?.name || 'Medication'} 
                          {prescription.medicine?.dosageForm && prescription.medicine?.strength && 
                            ` (${prescription.medicine.dosageForm} ${prescription.medicine.strength})`}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Dosage</Typography>
                            <Typography variant="body2">{prescription.dosage || 'Not specified'}</Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Frequency</Typography>
                            <Typography variant="body2">{prescription.frequency || 'Not specified'}</Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                            <Typography variant="body2">{prescription.duration || 'Not specified'}</Typography>
                          </Grid>
                          {prescription.instructions && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary">Instructions</Typography>
                              <Typography variant="body2">{prescription.instructions}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No medications prescribed</Typography>
                )}
              </Grid>
              
              {selectedConsultation.notes && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" paragraph>{selectedConsultation.notes}</Typography>
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

export default Prescriptions;
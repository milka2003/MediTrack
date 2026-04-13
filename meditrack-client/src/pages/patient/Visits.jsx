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
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Stack
} from '@mui/material';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api/client';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

function Visits() {
  const { selectedVisitId, setSelectedVisitId } = useOutletContext();
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVisitDetails, setSelectedVisitDetails] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/patient-portal/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (err) {
      setError('Failed to load visits. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (visitId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/patient-portal/visits/${visitId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedVisitDetails(response.data);
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectVisit = (visitId) => {
    setSelectedVisitId(visitId);
    // Optionally redirect to prescriptions or lab reports
    // navigate('/patient-portal/prescriptions');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const getStatusChip = (status) => {
    let color = 'default';
    switch (status) {
      case 'Registered':
      case 'open':
      case 'waiting':
        color = 'primary';
        break;
      case 'VitalsCompleted':
      case 'ReadyForConsultation':
      case 'InConsultation':
      case 'in-progress':
        color = 'info';
        break;
      case 'ConsultationCompleted':
      case 'Completed':
      case 'completed':
        color = 'success';
        break;
      case 'cancelled':
      case 'no-show':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    return <Chip label={status} color={color} size="small" />;
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
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Visit History</Typography>
      
      {visits.length === 0 ? (
        <Alert severity="info">You don't have any visits recorded yet.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Visit #</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Consultation Time</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Department</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Doctor</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visits.map((visit) => (
                <TableRow 
                  key={visit._id} 
                  hover 
                  selected={selectedVisitId === visit._id}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{visit.visitNumber}</TableCell>
                  <TableCell>{formatDate(visit.visitDate)}</TableCell>
                  <TableCell>{formatTime(visit.expectedConsultationTime)}</TableCell>
                  <TableCell>{visit.department?.name || 'N/A'}</TableCell>
                  <TableCell>{visit.doctor?.name || 'Not assigned'}</TableCell>
                  <TableCell>{getStatusChip(visit.status)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleViewDetails(visit._id)}
                      >
                        Details
                      </Button>
                      <Button 
                        size="small" 
                        variant={selectedVisitId === visit._id ? "contained" : "outlined"}
                        color={selectedVisitId === visit._id ? "success" : "primary"}
                        onClick={() => handleSelectVisit(visit._id)}
                      >
                        {selectedVisitId === visit._id ? "Selected" : "Select"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Visit Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f7fb', fontWeight: 600 }}>
          Visit Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedVisitDetails && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisitDetails.visitNumber}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedVisitDetails.visitDate)}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Consultation Time</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }} gutterBottom>
                  {formatTime(selectedVisitDetails.expectedConsultationTime)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisitDetails.department?.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Doctor</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisitDetails.doctor?.name || 'Not assigned'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisitDetails.status}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Type</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisitDetails.visitType || 'Regular'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Chief Complaint</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisitDetails.chiefComplaint || 'Not recorded'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Diagnosis</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisitDetails.diagnosis || 'Not specified'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Treatment Plan / Notes</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisitDetails.treatmentPlan || 'Not specified'}</Typography>
              </Grid>
              
              {selectedVisitDetails.vitalSigns && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: '#0D47A1' }}>Vital Signs</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Temperature</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedVisitDetails.vitalSigns.temperature ? `${selectedVisitDetails.vitalSigns.temperature} °C` : 'Not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Blood Pressure</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedVisitDetails.vitalSigns.bloodPressure || 'Not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Weight</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedVisitDetails.vitalSigns.weight || 'Not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Oxygen (SpO2)</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedVisitDetails.vitalSigns.oxygen || 'Not recorded'}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedVisitDetails && (
             <Button 
                variant="contained" 
                onClick={() => {
                  handleSelectVisit(selectedVisitDetails._id);
                  handleCloseDialog();
                }}
                disabled={selectedVisitId === selectedVisitDetails._id}
              >
                {selectedVisitId === selectedVisitDetails._id ? "Already Selected" : "Select this Visit"}
              </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Visits;
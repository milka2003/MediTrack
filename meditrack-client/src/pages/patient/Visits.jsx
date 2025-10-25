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
  Divider
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../api/client';

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

function Visits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
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
      setSelectedVisit(response.data);
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const getStatusChip = (status) => {
    let color = 'default';
    switch (status) {
      case 'waiting':
        color = 'warning';
        break;
      case 'in-progress':
        color = 'info';
        break;
      case 'completed':
        color = 'success';
        break;
      case 'cancelled':
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
                <TableCell><Typography variant="subtitle2">Department</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Doctor</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visits.map((visit) => (
                <TableRow key={visit._id} hover>
                  <TableCell>{visit.visitNumber}</TableCell>
                  <TableCell>{formatDate(visit.visitDate)}</TableCell>
                  <TableCell>{visit.department?.name || 'N/A'}</TableCell>
                  <TableCell>{visit.doctor?.name || 'Not assigned'}</TableCell>
                  <TableCell>{getStatusChip(visit.status)}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleViewDetails(visit._id)}
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

      {/* Visit Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f7fb', fontWeight: 600 }}>
          Visit Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedVisit && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisit.visitNumber}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedVisit.visitDate)}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisit.department?.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Doctor</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisit.doctor?.name || 'Not assigned'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisit.status}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Visit Type</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisit.visitType || 'Regular'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Chief Complaint</Typography>
                <Typography variant="body1" gutterBottom>{selectedVisit.chiefComplaint || 'Not recorded'}</Typography>
              </Grid>
              
              {selectedVisit.vitalSigns && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: '#0D47A1' }}>Vital Signs</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Temperature</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedVisit.vitalSigns.temperature ? `${selectedVisit.vitalSigns.temperature} °C` : 'Not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Blood Pressure</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedVisit.vitalSigns.bloodPressure || 'Not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Pulse Rate</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedVisit.vitalSigns.pulseRate ? `${selectedVisit.vitalSigns.pulseRate} bpm` : 'Not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Respiratory Rate</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedVisit.vitalSigns.respiratoryRate ? `${selectedVisit.vitalSigns.respiratoryRate} breaths/min` : 'Not recorded'}
                    </Typography>
                  </Grid>
                </>
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

export default Visits;
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  MenuItem, 
  Button, 
  Stack, 
  Alert, 
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import api from '../../api/client';

function BookAppointment() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tokenInfo, setTokenInfo] = useState(null);
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const [form, setForm] = useState({
    departmentId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/patient-portal/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load departments.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (deptId) => {
    try {
      const response = await api.get(`/patient-portal/doctors?departmentId=${deptId}`);
      setDoctors(response.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load doctors.' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'departmentId') {
      setForm(prev => ({ ...prev, doctorId: '' }));
      fetchDoctors(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    setTokenInfo(null);

    try {
      const response = await api.post('/patient-portal/book-appointment', form);
      
      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
      setTokenInfo(response.data.visit);
      // Reset form partly
      setForm(prev => ({ ...prev, doctorId: '' }));
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to book appointment. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const getSelectedDoctorSchedule = () => {
    const doctor = doctors.find(d => d._id === form.doctorId);
    if (!doctor || !doctor.shiftMapping || !doctor.shiftMapping.shiftTemplateId) return null;
    
    const { name, startTime, endTime } = doctor.shiftMapping.shiftTemplateId;
    const availableDays = doctor.schedule?.map(s => s.day).join(', ');

    return (
      <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f0f7ff', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>
          Doctor Availability
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {name} Shift: {startTime} - {endTime}
        </Typography>
        {availableDays && (
          <Typography variant="body2" sx={{ mt: 0.5, color: '#2e7d32', fontWeight: 500 }}>
            Available on: {availableDays}
          </Typography>
        )}
        {doctor.shiftMapping.rotationType !== 'None' && (
          <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
            * This doctor follows a {doctor.shiftMapping.rotationType.toLowerCase()} rotation schedule.
          </Typography>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Book New Appointment</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  select
                  label="Select Department"
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  required
                  fullWidth
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Select Doctor"
                  name="doctorId"
                  value={form.doctorId}
                  onChange={handleChange}
                  required
                  fullWidth
                  disabled={!form.departmentId}
                >
                  {doctors.length === 0 ? (
                    <MenuItem disabled>No doctors available in this department</MenuItem>
                  ) : (
                    doctors.map((doc) => (
                      <MenuItem key={doc._id} value={doc._id}>
                        Dr. {doc.user?.name} ({doc.specialization})
                      </MenuItem>
                    ))
                  )}
                </TextField>

                {getSelectedDoctorSchedule()}

                <TextField
                  type="date"
                  label="Appointment Date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 
                    min: getMinDate(),
                    max: getMaxDate()
                  }}
                />

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  disabled={submitting}
                  sx={{ py: 1.5, fontWeight: 600 }}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Booking'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          {message.text && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          {tokenInfo && (
            <Card sx={{ border: '2px dashed #1976d2', bgcolor: '#f0f7ff' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                  Booking Confirmed
                </Typography>
                <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 800, my: 1 }}>
                  #{tokenInfo.tokenNumber}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Token Number
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" color="text.secondary">Date:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(tokenInfo.appointmentDate).toLocaleDateString('en-GB', { 
                      day: '2-digit', month: 'long', year: 'numeric' 
                    })}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Doctor:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {doctors.find(d => d._id === tokenInfo.doctorId)?.user?.name ? 
                      `Dr. ${doctors.find(d => d._id === tokenInfo.doctorId).user.name}` : 
                      'Assigned Doctor'}
                  </Typography>

                  {tokenInfo.expectedConsultationTime && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Expected Consultation Time:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatTime(tokenInfo.expectedConsultationTime)}
                      </Typography>
                    </>
                  )}
                </Box>
                
                <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                  Please arrive 30 minutes before your consultation {tokenInfo.expectedConsultationTime ? `at ${formatTime(tokenInfo.expectedConsultationTime)}` : 'time'}.
                </Alert>
              </CardContent>
            </Card>
          )}

          {!tokenInfo && !message.text && (
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
              <Typography variant="subtitle2" gutterBottom color="primary">Instructions:</Typography>
              <Typography variant="body2" component="div">
                <ul>
                  <li>Select a department and then choose a doctor.</li>
                  <li>Pick a date for your visit (today or later).</li>
                  <li>Your token number will be generated immediately after booking.</li>
                  <li>You can view your booking status in the <strong>Visit History</strong> section.</li>
                </ul>
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default BookAppointment;
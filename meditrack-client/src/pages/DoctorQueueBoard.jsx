import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Fade,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

export default function DoctorQueueBoard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/queue/doctor/me');
      setQueue(data);
      if (data.availability) {
        setAvailability(data.availability);
      }
      setMessageType('');
      setMessage('');
    } catch (e) {
      setQueue(null);
      setMessageType('error');
      setMessage(e.response?.data?.message || 'Failed to fetch queue');
    }
  }, []);

  const handleUpdateAvailability = async (status) => {
    try {
      setLoading(true);
      const { data } = await api.post('/doctor/me/availability', { status });
      setAvailability(data.availability);
      setMessageType('success');
      setMessage(`Status updated to ${status}`);
      setTimeout(() => setMessage(''), 3000);
      fetchQueue();
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setInitialized(true);
    setLoading(true);
    fetchQueue().finally(() => setLoading(false));
  }, [navigate, fetchQueue]);

  useEffect(() => {
    if (!initialized) return;

    if (autoRefreshEnabled) {
      const interval = setInterval(fetchQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [initialized, autoRefreshEnabled, fetchQueue]);

  const handleCallNext = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/queue/doctor/me/next');
      setQueue(data);
      setMessageType('success');
      setMessage('Next patient called');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || 'Failed to call next patient');
    } finally {
      setLoading(false);
    }
  };

  const isOffShift = !queue?.currentToken && queue?.nextTokens?.length === 0 && queue?.message === 'Doctor is not on active shift';

  if (loading && !queue) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e', mb: 0.5 }}>
              {queue?.doctor?.name ? `Dr. ${queue.doctor.name}` : 'Doctor Queue Board'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Managing your patient consultation flow
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', p: 1, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, ml: 1 }}>STATUS:</Typography>
              <Chip 
                label={availability?.status || queue?.availability?.status || 'Unknown'} 
                color={
                  (availability?.status || queue?.availability?.status) === 'Available' ? 'success' : 
                  (availability?.status || queue?.availability?.status) === 'Busy' ? 'warning' : 
                  (availability?.status || queue?.availability?.status) === 'OnBreak' ? 'secondary' : 'default'
                } 
                size="small" 
                sx={{ fontWeight: 'bold' }}
              />
              <Button 
                size="small" 
                variant="contained" 
                color="secondary" 
                disabled={(availability?.status || queue?.availability?.status) !== 'Available' || loading || !!queue?.currentToken}
                onClick={() => handleUpdateAvailability('OnBreak')}
              >
                Start Break
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                color="success" 
                disabled={(availability?.status || queue?.availability?.status) !== 'OnBreak' || loading}
                onClick={() => handleUpdateAvailability('Available')}
              >
                End Break
              </Button>
            </Box>
            <Chip 
              icon={<AccessTimeIcon />} 
              label={autoRefreshEnabled ? 'Live Sync Active' : 'Sync Paused'} 
              color={autoRefreshEnabled ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Stack>
        </Box>

        {message && (
          <Fade in={!!message}>
            <Alert 
              severity={messageType} 
              sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              onClose={() => setMessage('')}
            >
              {message}
            </Alert>
          </Fade>
        )}

        {isOffShift && (
          <Alert severity="warning" sx={{ mb: 4, py: 2, borderRadius: 2, fontSize: '1.1rem', fontWeight: 500 }}>
            🔴 You are not on active shift. Queue is unavailable.
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Current Patient Section */}
          <Grid item xs={12} lg={7}>
            <Paper
              elevation={0}
              sx={{
                p: 0,
                textAlign: 'center',
                bgcolor: '#fff',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ 
                py: 2, 
                px: 3, 
                bgcolor: '#1a237e', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <NotificationsActiveIcon fontSize="small" />
                <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                  Now Serving
                </Typography>
              </Box>
              
              <Box sx={{ p: 6, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {queue?.currentToken ? (
                  <Fade in={true}>
                    <Box>
                      <Typography
                        variant="h1"
                        sx={{
                          fontSize: { xs: '80px', md: '140px' },
                          fontWeight: 900,
                          color: '#1a237e',
                          lineHeight: 1,
                          mb: 2,
                          textShadow: '2px 2px 0px rgba(0,0,0,0.05)'
                        }}
                      >
                        {queue.currentToken.tokenNumber}
                      </Typography>
                      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
                        <PersonIcon color="action" />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
                          {queue.currentToken.patientName}
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary', fontWeight: 500 }}>
                        OP Number: <span style={{ color: '#1a237e' }}>{queue.currentToken.opNumber}</span>
                      </Typography>
                    </Box>
                  </Fade>
                ) : (
                  <Box sx={{ py: 4 }}>
                    <Box sx={{ opacity: 0.1, mb: 2 }}>
                      <PersonIcon sx={{ fontSize: 100 }} />
                    </Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: '1.25rem', fontWeight: 500 }}>
                      No patient in consultation
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                      Call the next patient from the waiting list
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Divider />
              
              <Box sx={{ p: 3, bgcolor: '#fafafa' }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PlayCircleOutlineIcon sx={{ fontSize: 28 }} />}
                  onClick={handleCallNext}
                  disabled={loading || isOffShift || !queue?.nextTokens?.length || (availability?.status || queue?.availability?.status) !== 'Available'}
                  sx={{
                    bgcolor: '#1a237e',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    py: 2,
                    borderRadius: 3,
                    boxShadow: '0 8px 20px rgba(26, 35, 126, 0.3)',
                    '&:hover': { 
                      bgcolor: '#0d47a1',
                      boxShadow: '0 12px 24px rgba(26, 35, 126, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:active': { transform: 'translateY(0)' },
                    transition: 'all 0.2s ease',
                    '&.Mui-disabled': {
                      bgcolor: '#e0e0e0'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'CALL NEXT PATIENT'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Waiting List Section */}
          <Grid item xs={12} lg={5}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: '#fff',
                borderRadius: 4,
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(26, 35, 126, 0.1)',
                  color: '#1a237e'
                }}>
                  <GroupsIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#333' }}>
                    Waiting Queue
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {queue?.waitingCount || 0} patients in line
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
                {queue?.nextTokens && queue.nextTokens.length > 0 ? (
                  <Stack spacing={2}>
                    {queue.nextTokens.map((token, idx) => (
                      <Card 
                        key={token.visitId} 
                        variant="outlined"
                        sx={{ 
                          borderRadius: 3,
                          borderColor: idx === 0 ? 'rgba(26, 35, 126, 0.3)' : '#f0f0f0',
                          bgcolor: idx === 0 ? 'rgba(26, 35, 126, 0.02)' : '#fff',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#1a237e',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Grid container alignItems="center">
                            <Grid item xs={3}>
                              <Typography variant="h5" sx={{ fontWeight: 900, color: idx === 0 ? '#1a237e' : '#666' }}>
                                #{token.tokenNumber}
                              </Typography>
                            </Grid>
                            <Grid item xs={9}>
                              <Typography sx={{ fontWeight: 700, color: '#333', fontSize: '1rem' }}>
                                {token.patientName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                OP: {token.opNumber}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    opacity: 0.5,
                    py: 4
                  }}>
                    <GroupsIcon sx={{ fontSize: 60, mb: 2, color: 'text.disabled' }} />
                    <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Queue is currently empty
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
            <Typography sx={{ color: 'text.disabled', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon fontSize="small" />
              Last updated: {new Date().toLocaleTimeString()}
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography sx={{ color: 'text.disabled', fontSize: '0.85rem' }}>
              MediTrack Queue Management System v2.0
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

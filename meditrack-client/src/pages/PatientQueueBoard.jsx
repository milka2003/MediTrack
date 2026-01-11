import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Grid,
  Divider,
  Fade,
  Stack,
  GlobalStyles,
  Chip,
} from '@mui/material';
import api from '../api/client';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function PatientQueueBoard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchQueueData = useCallback(async () => {
    try {
      const response = await api.get('/queue/patient-board');
      setData(response.data);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch patient board:', e);
      setError('Connection lost. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 12000); // Refresh every 12 seconds
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [fetchQueueData]);

  if (loading && !data) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#0a192f',
        color: '#fff'
      }}>
        <CircularProgress color="inherit" size={60} />
        <Typography sx={{ mt: 3, fontWeight: 500, fontSize: '1.5rem' }}>
          Initializing Patient Queue Board...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#0a192f', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <GlobalStyles styles={{
        body: { overflow: 'hidden' }
      }} />

      {/* Header */}
      <Box sx={{ 
        py: 3, 
        px: 6, 
        bgcolor: '#112240', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '4px solid #64ffda'
      }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#64ffda', letterSpacing: 1 }}>
            PATIENT QUEUE BOARD
          </Typography>
          <Typography variant="h6" sx={{ color: '#8892b0', fontWeight: 500 }}>
            Please wait for your token to be called
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff' }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
          <Typography variant="h6" sx={{ color: '#8892b0' }}>
            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Box sx={{ bgcolor: '#f44336', color: '#fff', textAlign: 'center', py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{error}</Typography>
        </Box>
      )}

      <Grid container sx={{ flex: 1, p: 4, spacing: 4, height: 'calc(100vh - 120px)' }}>
        {/* NOW CONSULTING SECTION */}
        <Grid item xs={12} lg={7} sx={{ pr: 2, height: '100%' }}>
          <Paper elevation={0} sx={{ 
            height: '100%', 
            bgcolor: '#112240', 
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid rgba(100, 255, 218, 0.1)'
          }}>
            <Box sx={{ 
              py: 2, 
              px: 4, 
              bgcolor: '#64ffda', 
              color: '#0a192f',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <NotificationsActiveIcon sx={{ fontSize: 40 }} />
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 2 }}>
                NOW CONSULTING
              </Typography>
            </Box>

            <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
              {data?.nowConsulting && data.nowConsulting.length > 0 ? (
                <Stack spacing={4}>
                  {data.nowConsulting.map((item, idx) => (
                    <Fade in={true} timeout={500} key={idx}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        bgcolor: 'rgba(100, 255, 218, 0.05)',
                        p: 4,
                        borderRadius: 4,
                        borderLeft: '10px solid #64ffda'
                      }}>
                        <Box>
                          <Typography variant="h1" sx={{ 
                            fontSize: '120px', 
                            fontWeight: 900, 
                            color: '#64ffda',
                            lineHeight: 1
                          }}>
                            {item.tokenNumber}
                          </Typography>
                          <Typography variant="h5" sx={{ color: '#8892b0', mt: 1, fontWeight: 500 }}>
                            TOKEN NUMBER
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h3" sx={{ fontWeight: 800, color: '#ccd6f6' }}>
                            Dr. {item.doctorName}
                          </Typography>
                          {item.onBreak ? (
                            <Chip 
                              label="ON BREAK" 
                              sx={{ 
                                mt: 1, 
                                bgcolor: '#ff4d4d', 
                                color: '#fff', 
                                fontWeight: 900, 
                                borderRadius: 1,
                                px: 2
                              }} 
                            />
                          ) : (
                            <Typography variant="h5" sx={{ color: '#8892b0', mt: 1 }}>
                              CONSULTATION ROOM
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Fade>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  opacity: 0.3
                }}>
                  <NotificationsActiveIcon sx={{ fontSize: 120, mb: 4 }} />
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    No consultations in progress
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 2 }}>
                    Please wait, the queue will update shortly
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* WAITING SECTION */}
        <Grid item xs={12} lg={5} sx={{ pl: 2, height: '100%' }}>
          <Paper elevation={0} sx={{ 
            height: '100%', 
            bgcolor: '#112240', 
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid rgba(100, 255, 218, 0.1)'
          }}>
            <Box sx={{ 
              py: 2, 
              px: 4, 
              bgcolor: '#ccd6f6', 
              color: '#0a192f',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <GroupsIcon sx={{ fontSize: 40 }} />
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 2 }}>
                WAITING
              </Typography>
            </Box>

            <Box sx={{ flex: 1, p: 3, overflowY: 'hidden' }}>
              {data?.waiting && data.waiting.length > 0 ? (
                <Grid container spacing={2}>
                  {data.waiting.map((item, idx) => (
                    <Grid item xs={12} key={idx}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(204, 214, 246, 0.05)',
                        borderLeft: '6px solid #ccd6f6'
                      }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#ccd6f6' }}>
                          #{item.tokenNumber}
                        </Typography>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: '#8892b0' }}>
                            Dr. {item.doctorName}
                          </Typography>
                          {item.onBreak && (
                            <Typography variant="caption" sx={{ color: '#ff4d4d', fontWeight: 700 }}>
                              ON BREAK
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  opacity: 0.3
                }}>
                  <GroupsIcon sx={{ fontSize: 80, mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Waiting queue is empty
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ 
              p: 3, 
              bgcolor: 'rgba(100, 255, 218, 0.05)', 
              textAlign: 'center',
              borderTop: '1px solid rgba(100, 255, 218, 0.1)'
            }}>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ color: '#64ffda', opacity: 0.8 }}>
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  AUTO-REFRESHING EVERY 12 SECONDS
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

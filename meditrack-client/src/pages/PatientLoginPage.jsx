import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Stack,
  Link as MuiLink,
  Divider
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api/client';
import { GoogleLogin } from '@react-oauth/google';

function PatientLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/patient-login`, {
        identifier,
        password
      });

      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to patient dashboard
      navigate('/patient-portal');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${API_URL}/auth/patient-google-login`, {
        token: credentialResponse.credential
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to patient dashboard
      navigate('/patient-portal');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed. Please ensure you are a registered patient.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundImage: `url(${require('../assets/login-bg.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#0D47A1', fontWeight: 700 }}>
            Patient Portal
          </Typography>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
            Access your medical records and appointments
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="identifier"
              label="OP Number or Phone"
              name="identifier"
              autoComplete="off"
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#0D47A1' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ width: '100%', my: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>OR</Typography>
          </Divider>

          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              New patient?{' '}
              <MuiLink component={Link} to="/patient-signup" sx={{ fontWeight: 600 }}>
                Register here
              </MuiLink>
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', my: 3 }} />
          
          <Stack direction="row" spacing={1} justifyContent="center">
            <MuiLink component={Link} to="/login" variant="body2">
              Staff Login
            </MuiLink>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>|</Typography>
            <MuiLink component={Link} to="/" variant="body2">
              Back to Home
            </MuiLink>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default PatientLoginPage;
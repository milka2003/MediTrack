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
  MenuItem,
  Divider
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api/client';
import { GoogleLogin } from '@react-oauth/google';

function PatientSignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: '',
    age: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/patient-signup`, formData);
      navigate('/patient-login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      navigate('/patient-portal');
    } catch (err) {
      setError(err.response?.data?.message || 'Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google registration failed. Please try again.');
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
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#0D47A1', fontWeight: 700, textAlign: 'center' }}>
            Patient Registration
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField label="First Name" name="firstName" required fullWidth onChange={handleChange} />
                <TextField label="Last Name" name="lastName" required fullWidth onChange={handleChange} />
              </Stack>
              <TextField label="Phone Number" name="phone" required fullWidth onChange={handleChange} />
              <TextField label="Email" name="email" type="email" required fullWidth onChange={handleChange} />
              <Stack direction="row" spacing={2}>
                <TextField select label="Gender" name="gender" required fullWidth value={formData.gender} onChange={handleChange}>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
                <TextField label="Age" name="age" type="number" required fullWidth onChange={handleChange} />
              </Stack>
              <TextField label="Password" name="password" type="password" required fullWidth onChange={handleChange} />
              
              <Button type="submit" variant="contained" fullWidth size="large" sx={{ bgcolor: '#0D47A1', mt: 2 }} disabled={loading}>
                {loading ? 'Registering...' : 'Sign Up'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>OR</Typography>
          </Divider>

          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              text="signup_with"
              shape="pill"
            />
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <MuiLink component={Link} to="/patient-login" sx={{ fontWeight: 600 }}>
                Login here
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default PatientSignupPage;
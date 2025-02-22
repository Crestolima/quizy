import React, { useState } from 'react';
import {
  Button,
  TextField,
  Link,
  Grid,
  Typography,
  Container,
  IconButton,
  InputAdornment,
  Box,
  Paper
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value });
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    if (!formData.email) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.password) {
      toast.error('Password is required');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const response = await api.post('/login', formData);
      
      if (response.data.firstName && response.data.email) {
        login(response.data);
        navigate('/home');
        toast.success('Login successful');
      }
    } catch (error) {
      console.error('Error during login request:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Unable to connect to the server. Please check your internet connection or try again later.');
      } else if (error.response) {
        // Server responded with error
        switch (error.response.status) {
          case 404:
            toast.error('User not found. Please check your email.');
            break;
          case 400:
            toast.error('Invalid password. Please try again.');
            break;
          case 500:
            toast.error('Server error. Please try again later.');
            break;
          default:
            toast.error('An unexpected error occurred. Please try again.');
        }
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect fill='%23a0c4ff' width='1200' height='800'/%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Ccircle cx='400' cy='200' r='50'/%3E%3Ccircle cx='800' cy='600' r='100'/%3E%3Crect x='100' y='300' width='150' height='100' rx='20'/%3E%3Crect x='900' y='100' width='200' height='200' rx='30'/%3E%3Cpath d='M 700,500 C 800,400 900,400 1000,500' stroke='%23ffffff' stroke-width='20' fill='none'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          <Typography 
            component="h1" 
            variant="h5" 
            align="center" 
            sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}
          >
            Login
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange('email')}
              variant="outlined"
              sx={{ mb: 2 }}
              error={formData.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
              helperText={
                formData.email !== '' && 
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 
                'Please enter a valid email' : ''
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange('password')}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isLoading}
              sx={{ 
                mt: 2, 
                mb: 2, 
                borderRadius: '20px', 
                padding: '10px',
                backgroundColor: isLoading ? 'grey.400' : 'primary.main',
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <Grid container spacing={2}>
              <Grid item xs>
                <Link 
                  href="#" 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link 
                  href="/SignUp" 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Box>
  );
}

export default Login;
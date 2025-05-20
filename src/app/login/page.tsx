'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, Suspense } from 'react';
import { Box, Button, Typography, CircularProgress, Link as MuiLink, Alert, Divider, Paper, TextField, InputAdornment, Fade } from '@mui/material';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, googleLogin, verifyOTP, resendOTP, ApiError } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

// Create a client component that uses useSearchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, setUser } = useAuth();
  const redirectTo = searchParams.get('from') || '/feed';

  // Add page loading state
  const [isPageLoading, setIsPageLoading] = useState(true);

  // OTP related states
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [otpStep, setOtpStep] = useState(false);
  const [userId, setUserId] = useState('');
  const [timer, setTimer] = useState(0);

  // Login form states
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  // Add password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Add new state to track verification reason
  const [verificationReason, setVerificationReason] = useState<'email' | 'mfa'>('email');

  // Initialize the component and set loading to false after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000); // 1 second loading screen for better UX

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    // Prevent the default paste behavior
    e.preventDefault();
    
    // Get the pasted data from the clipboard
    const pastedData = e.clipboardData.getData('text/plain');
    
    // Check if it's a 6-digit code
    if (/^\d{6}$/.test(pastedData)) {
      const newOtpValues = pastedData.split('').map(char => char);
      setOtpValues(newOtpValues);
      
      // Validate OTP immediately if all digits are filled
      if (newOtpValues.every(val => val !== '')) {
        validateOTP();
      }
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    // Take only the last character if more than one is somehow entered
    newOtpValues[index] = value.slice(-1);
    setOtpValues(newOtpValues);
    
    // Auto-focus next input if this one is filled
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Validate OTP immediately if all digits are filled
    if (newOtpValues.every(val => val !== '')) {
      validateOTP();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = () => {
    // Check if all OTP fields are filled
    if (otpValues.some(val => val === '')) {
      setErrors({
        ...errors,
        otp: 'Please enter the complete 6-digit OTP'
      });
      return false;
    }
    
    // If all fields are filled, submit the OTP
    handleSubmitOTP();
    return true;
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    
    try {
      await resendOTP({ userId });
      setTimer(30); // Reset countdown timer
      
      // Show success message
      setErrors({
        ...errors,
        otp: 'OTP sent successfully!',
        otpSuccess: 'true'
      });
    } catch (error: unknown) {
      console.error('Error resending OTP:', error);
      const apiError = error as ApiError;
      setErrors({
        ...errors,
        otp: apiError.message || 'Failed to resend OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await login(formData);
      
      // Handle MFA or email verification if required
      if (response.requireMFA || response.needsVerification) {
        setOtpStep(true);
        setUserId(response.userId || '');
        setTimer(30); // Start 30 second countdown for OTP resend
        
        // Set verification reason based on response
        setVerificationReason(response.needsVerification ? 'email' : 'mfa');
      } else {
        // Standard login
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        setUser(response.user);
        router.push(redirectTo);
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const apiError = error as ApiError;
      setErrors({
        ...errors,
        form: apiError.message || 'Invalid email or password. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOTP = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const otp = otpValues.join('');
      const response = await verifyOTP({ userId, otp });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      setUser(response.user);
      router.push(redirectTo);
    } catch (error: unknown) {
      console.error('OTP verification error:', error);
      const apiError = error as ApiError;
      setErrors({
        ...errors,
        otp: apiError.message || 'Invalid OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    googleLogin();
  };

  // Add password visibility toggle handler
  const togglePasswordVisibility = () => {
    setShowPassword((show) => !show);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      {isPageLoading ? (
        // Loading screen
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100vh'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
            <Box
              component="img"
              src="/t.png"
              alt="Logo"
              sx={{ height: 40, display: 'block' }}
            />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#000' }}>
              tourprism
            </Typography>
          </Box>
          <CircularProgress size={40} sx={{ color: 'black' }} />
        </Box>
      ) : (
        // Main content (wrap existing content with Fade for smooth transition)
        <Fade in={!isPageLoading} timeout={500}>
          <Box sx={{ display: 'flex', width: '100%' }}>
            
            <Box sx={{ 
              width: { xs: '100%', md: '100%' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: { xs: 0, sm: 0 }
            }}>
              <Paper elevation={0} sx={{ 
                width: '100%', 
                maxWidth: 480,
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
              }}>
               <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 8 }}>
                <Link href="/" passHref>
                  <Box
                    component="img"
                    src="/t.png"
                    alt="Logo"
                    sx={{ height: 28, cursor: 'pointer', display: 'block' }}
                  />
                </Link>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#000', fontSize: '20px' }}>
                  tourprism
                </Typography>
               </Box>
           
                
                {errors.form && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.form}
                  </Alert>
                )}
                
                {otpStep ? (
                  // OTP Form
                  <Box component="form">
                    <Typography variant="h6" sx={{ textAlign: 'center', mb: 3, fontWeight: 500 }}>
                      {verificationReason === 'email' 
                        ? 'Verify Your Email Address' 
                        : 'Two-Factor Authentication'}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
                      {verificationReason === 'email'
                        ? 'Please enter the 6-digit code sent to your email address to verify your account.'
                        : 'Please enter the 6-digit security code sent to your email for authentication.'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                      {otpValues.map((value, index) => (
                        <TextField
                          key={index}
                          id={`otp-input-${index}`}
                          value={value}
                          onChange={(e) => handleOTPChange(index, e.target.value)}
                          onPaste={index === 0 ? handleOTPPaste : undefined}
                          inputProps={{ 
                            maxLength: 1,
                            style: { textAlign: 'center', fontSize: '1.5rem', paddingTop: 8, paddingBottom: 8, fontWeight: 500 }
                          }}
                          sx={{ 
                            width: 45,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              height: 45
                            }
                          }}
                          autoFocus={index === 0}
                        />
                      ))}
                    </Box>
                    
                    {errors.otp && (
                      <Alert 
                        severity={errors.otpSuccess ? "success" : "error"} 
                        sx={{ mb: 3 }}
                      >
                        {errors.otp}
                      </Alert>
                    )}
                    
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      {timer > 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Resend OTP in {timer} seconds
                        </Typography>
                      ) : (
                        <Button 
                          onClick={handleResendOTP}
                          disabled={isLoading}
                          sx={{ textTransform: 'none', color: 'black' }}
                        >
                          Resend OTP
                        </Button>
                      )}
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={isLoading || otpValues.some(val => val === '')}
                      onClick={validateOTP}
                      sx={{
                        bgcolor: 'black',
                        color: 'white',
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#333'
                        }
                      }}
                    >
                      {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
                    </Button>
                  </Box>
                ) : (
                  // Login Form
                  <Box component="form" onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        name="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <i className="ri-mail-line"></i>
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2,
                            height: 45
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        error={!!errors.password}
                        helperText={errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <i className="ri-lock-line"></i>
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                onClick={togglePasswordVisibility}
                                tabIndex={-1}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                              >
                                <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                              </Button>
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2,
                            height: 45
                          }
                        }}
                      />
                      <Box sx={{display:'flex',justifyContent:'end',mt:2}}>
                      <Link href="/forgot-password" passHref>
                          <MuiLink 
                            underline="hover" 
                            sx={{ color: 'black', fontWeight: 500, fontSize: '0.875rem' }}
                          >
                            Forgot Password?
                          </MuiLink>
                        </Link>
                      </Box>
                    </Box>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isLoading}
                      sx={{
                        bgcolor: 'black',
                        color: 'white',
                        py: 1.5,
                        borderRadius: 2,
                        height: 45,
                        '&:hover': {
                          bgcolor: '#333'
                        }
                      }}
                    >
                      {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
                    </Button>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Link href="/signup" passHref>
                        <MuiLink 
                          underline="hover" 
                          sx={{ color: '#056CF2' }}
                        >
                          Sign Up
                        </MuiLink>
                      </Link>
                    </Box>
                    
                    <Divider sx={{ my: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        OR
                      </Typography>
                    </Divider>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleGoogleLogin}
                      startIcon={<Image src="/images/pngwing.png" alt="Google" width={20} height={20} />}
                      sx={{
                        borderColor: '#ddd',
                        color: '#333',
                        py: 1.5,
                        borderRadius: 10,
                        height: 45,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#ccc',
                          bgcolor: 'rgba(0,0,0,0.02)'
                        }
                      }}
                    >
                      Continue with Google
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
}

// This is the main component that Next.js will use
export default function Login() {
  return (
    <Suspense fallback={
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100vh'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
          <Box
            component="img"
            src="/t.png"
            alt="Logo"
            sx={{ height: 40, display: 'block' }}
          />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#000' }}>
            tourprism
          </Typography>
        </Box>
        <CircularProgress size={40} sx={{ color: 'black' }} />
      </Box>
    }>
      <LoginContent />
    </Suspense>
  );
} 
'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Box, Button, Typography, CircularProgress, Link as MuiLink, Alert, Divider, Paper, TextField, InputAdornment, Checkbox, Fade } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register, googleLogin, verifyOTP, resendOTP, ApiError } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
export default function SignUp() {
  const router = useRouter();
  const { isAuthenticated, setUser } = useAuth();

  // Add page loading state
  const [isPageLoading, setIsPageLoading] = useState(true);

  // OTP related states
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [otpStep, setOtpStep] = useState(false);
  const [userId, setUserId] = useState('');
  const [timer, setTimer] = useState(0);

  // Signup form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  // Add password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Initialize the component and set loading to false after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000); // 1 second loading screen for better UX

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, router]);

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
    e.preventDefault();
    
    const pastedData = e.clipboardData.getData('text/plain');
    
    if (/^\d{6}$/.test(pastedData)) {
      const newOtpValues = pastedData.split('').map(char => char);
      setOtpValues(newOtpValues);
      
      if (newOtpValues.every(val => val !== '')) {
        validateOTP();
      }
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value && !/^\d*$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.slice(-1);
    setOtpValues(newOtpValues);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    if (newOtpValues.every(val => val !== '')) {
      validateOTP();
    }
  };

  const handleOTPKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Move to previous input when backspace is pressed and input is empty
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      // Focus on previous input field
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
    
    // Move to next input when a digit is entered
    if (/^\d$/.test(e.key) && index < otpValues.length - 1) {
      // Focus on next input field after a slight delay to allow current input to update
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 10);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
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
    if (otpValues.some(val => val === '')) {
      setErrors({
        ...errors,
        otp: 'Please enter the complete 6-digit OTP'
      });
      return false;
    }
    
    handleSubmitOTP();
    return true;
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    
    try {
      await resendOTP({ userId });
      setTimer(30); // Reset countdown timer
      
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
      const response = await register({
        email: formData.email,
        password: formData.password
      });
      
      // Set userId for OTP verification and move to OTP step
      setUserId(response.userId || '');
      setOtpStep(true);
      setTimer(30); // Start 30 second countdown for OTP resend
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const apiError = error as ApiError;
      setErrors({
        ...errors,
        form: apiError.message || 'Registration failed. This email may already be registered.'
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
      router.push('/feed');
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

  const handleGoogleSignUp = () => {
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
              src="/tourprism.png"
              alt="Logo"
              sx={{ height: 40, display: 'block', borderRadius: 1 }}
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
                      src="/tourprism.png"
                      alt="Logo"
                      sx={{ height: 28, cursor: 'pointer', display: 'block', borderRadius: 1 }}
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
                  <>
                    <Box sx={{ display: 'flex', flexDirection: 'column',alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
                      <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold', fontSize: '20px' }}>
                        Verify Email
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1,textAlign: 'center', fontWeight: 500 ,fontSize: '16px'}}>
                        Please enter the 6-digit code sent to your email {formData.email}
                      </Typography>
                    </Box>
                    <Box component="form">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                        {otpValues.map((value, index) => (
                          <TextField
                            key={index}
                            id={`otp-input-${index}`}
                            value={value}
                            onChange={(e) => handleOTPChange(index, e.target.value)}
                            onKeyDown={(e) => handleOTPKeyDown(e, index)}
                            onPaste={index === 0 ? handleOTPPaste : undefined}
                            inputProps={{ 
                              maxLength: 1,
                              style: { textAlign: 'center', fontSize: '1.5rem', paddingTop: 8, paddingBottom: 8 }
                            }}
                            sx={{ 
                              width: 45,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
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
                        {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify Email'}
                      </Button>
                    </Box>
                  </>
                ) : (
                  // Signup Form
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
                    
                    <Box sx={{ mb: 1 }}>
                      <TextField
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a strong password"
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
                    </Box>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <Checkbox />
                      <Typography variant="body2" sx={{ fontWeight: 400,fontSize:'15px', mt:{xs:2,md:0} }}>
                        I agree to Tourprism&apos;s<Link href="/terms" passHref><MuiLink sx={{textDecoration:'underline'}}> terms of use </MuiLink></Link> and <Link href="/privacy" passHref><MuiLink sx={{textDecoration:'underline'}}>privacy policy</MuiLink></Link>.
                      </Typography>
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
                        '&:hover': {
                          bgcolor: '#333'
                        }
                      }}
                    >
                      {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
                    </Button>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Link href="/login" passHref>
                        <MuiLink 
                          underline="hover" 
                          sx={{ color: '#056CF2' }}
                        >
                          Sign In
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
                      onClick={handleGoogleSignUp}
                      startIcon={<Image src="/images/pngwing.png" alt="Google" width={20} height={20} />}
                      sx={{
                        borderColor: '#ddd',
                        color: '#333',
                        py: 1.5,
                        borderRadius: 10,
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
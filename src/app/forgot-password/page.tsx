'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Box, Button, Typography, CircularProgress, Link as MuiLink, Alert, Paper, TextField, InputAdornment, Fade } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword, verifyResetOTP, resetPassword, resendResetOTP, ApiError } from '@/services/api';

type ForgotPasswordStep = 'email' | 'otp' | 'password';

export default function ForgotPassword() {
  const router = useRouter();

  // Add page loading state
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Current step in the forgot password flow
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('email');

  // OTP related states
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [userId, setUserId] = useState('');
  const [timer, setTimer] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Add password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize the component and set loading to false after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 2000); // 1 second loading screen for better UX

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

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

  const validateEmail = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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

  const validatePassword = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Please enter a new password';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      await resendResetOTP({ userId });
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

  const handleSubmitEmail = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await forgotPassword({ email: formData.email });

      // Set userId for OTP verification and move to OTP step
      setUserId(response.userId);
      setCurrentStep('otp');
      setTimer(30); // Start 30 second countdown for OTP resend
    } catch (error: unknown) {
      console.error('Error requesting password reset:', error);
      const apiError = error as ApiError;
      setErrors({
        ...errors,
        form: apiError.message || 'Failed to request password reset. Please check your email and try again.'
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
      await verifyResetOTP({ userId, otp });

      // Move to password reset step
      setCurrentStep('password');
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

  const handleSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await resetPassword({
        userId,
        otp: otpValues.join(''),
        newPassword: formData.newPassword
      });

      setSuccess(true);

      // Redirect to login page after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      const apiError = error as ApiError;
      setErrors({
        ...errors,
        form: apiError.message || 'Failed to reset password. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add password visibility toggle handlers
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((show) => !show);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((show) => !show);
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
              sx={{ height: 32, display: 'block', borderRadius: 1 }}
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4 }}>
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
                {success ? (
                  // Success message
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      component="img"
                      src="/images/success-check.png"
                      alt="Success"
                      sx={{ width: 80, height: 80, mb: 3 }}
                    />

                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Password Reset Successful
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Your password has been reset successfully. You will be redirected to the login page shortly.
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={() => router.push('/login')}
                      sx={{
                        bgcolor: 'black',
                        color: 'white',
                        py: 1.5,
                        px: 4,
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#333' }
                      }}
                    >
                      Go to Login
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h4" component="h1" align="center" sx={{ mb: 2, fontWeight: 'bold', fontSize: '24px' }}>
                      {currentStep === 'email' ? 'Forgot Password' :
                        currentStep === 'otp' ? 'Verify Your Email' :
                          'Reset Password'}
                    </Typography>

                    <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4, fontSize: '14px' }}>
                      {currentStep === 'email' ? 'Enter your email to receive a verification code' :
                        currentStep === 'otp' ? 'Enter the 6-digit code sent to your email' :
                          'Create a new password for your account'}
                    </Typography>

                    {errors.form && (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        {errors.form}
                      </Alert>
                    )}

                    {currentStep === 'email' && (
                      <Box component="form" onSubmit={handleSubmitEmail}>
                        <Box sx={{ mb: 4 }}>
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
                              sx: {
                                borderRadius: 2,
                                height: 45
                              }
                            }}
                          />
                        </Box>

                        <Box sx={{ my: 4, textAlign: 'center' }}>
                          <Typography variant="body2" display="inline">
                            Remember your password?{' '}
                          </Typography>
                          <Link href="/login" passHref>
                            <MuiLink
                              underline="hover"
                              sx={{ color: '#056CF2' }}
                            >
                              Sign In
                            </MuiLink>
                          </Link>
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
                          {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send Verification Code'}
                        </Button>
                      </Box>
                    )}

                    {currentStep === 'otp' && (
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
                          {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
                        </Button>
                      </Box>
                    )}

                    {currentStep === 'password' && (
                      <Box component="form" onSubmit={handleSubmitPassword}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            New Password
                          </Typography>
                          <TextField
                            fullWidth
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            placeholder="Enter your new password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            error={!!errors.newPassword}
                            helperText={errors.newPassword}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <i className="ri-lock-line"></i>
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Button
                                    onClick={toggleNewPasswordVisibility}
                                    tabIndex={-1}
                                    sx={{ minWidth: 'auto', p: 0.5 }}
                                  >
                                    <i className={showNewPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                                  </Button>
                                </InputAdornment>
                              ),
                              sx: {
                                borderRadius: 2,
                                height: 45
                              }
                            }}
                          />
                        </Box>

                        <Box sx={{ mb: 4 }}>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            Confirm New Password
                          </Typography>
                          <TextField
                            fullWidth
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Confirm your new password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <i className="ri-lock-line"></i>
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Button
                                    onClick={toggleConfirmPasswordVisibility}
                                    tabIndex={-1}
                                    sx={{ minWidth: 'auto', p: 0.5 }}
                                  >
                                    <i className={showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                                  </Button>
                                </InputAdornment>
                              ),
                              sx: {
                                borderRadius: 2,
                                height: 45
                              }
                            }}
                          />
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
                          {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Reset Password'}
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
} 
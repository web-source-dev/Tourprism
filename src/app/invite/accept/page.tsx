'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { api } from '@/services/api';

interface InvitationData {
  valid: boolean;
  ownerName: string;
  ownerEmail: string;
  companyName: string;
  collaboratorEmail: string;
  collaboratorName?: string;
  role: 'viewer' | 'manager';
}

interface AcceptInvitationResponse {
  message: string;
  token: string;
  user: {
    _id: string;
    email: string;
    isCollaborator: boolean;
    collaborator: {
      email: string;
      role: 'viewer' | 'manager';
    }
  }
}

// Create a client component that uses the useSearchParams hook
function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: ''
  });

  // Verify the invitation token
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token || !email) {
        setError('Invalid invitation link. Missing token or email.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await api.get<InvitationData>(`/profile/collaborators/verify-invitation?token=${token}&email=${encodeURIComponent(email)}`);
        setInvitation(response.data);
        setError(null);
      } catch (error: unknown) {
        console.error('Error verifying invitation:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    verifyInvitation();
  }, [token, email]);
  
  const validateForm = () => {
    let valid = true;
    const errors = {
      password: '',
      confirmPassword: ''
    };
    
    if (!password) {
      errors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setVerifyLoading(true);
      setError(null);
      
      const response = await api.post<AcceptInvitationResponse>('/profile/collaborators/accept-invitation', {
        token,
        email,
        password
      });
      
      // Save token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isCollaborator', 'true');
        localStorage.setItem('collaboratorRole', response.data.user.collaborator.role);
        localStorage.setItem('collaboratorEmail', response.data.user.collaborator.email);
        
        // Redirect to dashboard after successful login
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      console.error('Error accepting invitation:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Verifying invitation...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom color="error">
            Invitation Error
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!invitation) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom color="error">
            Invalid Invitation
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            The invitation link is invalid or has expired.
          </Alert>
          <Button variant="contained" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Accept Invitation
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" paragraph>
            {invitation.collaboratorName ? `Hello ${invitation.collaboratorName},` : 'Hello,'}
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>{invitation.ownerName}</strong> has invited you to collaborate on their TourPrism account 
            {invitation.companyName && ` for ${invitation.companyName}`}.
          </Typography>
          <Typography variant="body1" paragraph>
            You&apos;ve been invited as a <strong>{invitation.role}</strong>, which gives you 
            {invitation.role === 'manager' ? ' the ability to view data and make changes to the account.' : ' the ability to view data in the account.'}
          </Typography>
          <Typography variant="body1">
            Please set a password to complete your account setup:
          </Typography>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!formErrors.password}
            helperText={formErrors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={verifyLoading}
          >
            {verifyLoading ? <CircularProgress size={24} /> : 'Accept & Set Password'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

// Main page component with Suspense boundary
const AcceptInvitationPage = () => {
  return (
    <Suspense fallback={
      <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading invitation...
        </Typography>
      </Container>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
};

export default AcceptInvitationPage; 
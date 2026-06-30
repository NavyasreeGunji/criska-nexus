import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, InputAdornment, IconButton, Alert,
  LinearProgress, Collapse, Dialog, DialogTitle, DialogContent, DialogActions,
  Stepper, Step, StepLabel,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useApp } from '../context/AppContext';
import { apiSendOtp, apiResetPassword } from '../api/api';

const STEPS = ['Enter Username', 'Verify OTP', 'Set New Password'];

export default function LoginPage() {
  const { login, backendWaking, backendOnline, backendChecked } = useApp();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!backendWaking) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [backendWaking]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot-password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [step, setStep] = useState(0);           // 0 = username, 1 = OTP, 2 = new password
  const [resetUsername, setResetUsername] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (e: any) {
      setError(e.message ?? 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const openReset = () => {
    setStep(0);
    setResetUsername('');
    setMaskedEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setShowNew(false);
    setShowConfirm(false);
    setResendCooldown(0);
    setResetOpen(true);
  };

  const handleSendOtp = async (isResend = false) => {
    if (!resetUsername.trim()) { setResetError('Username is required'); return; }
    setResetError('');
    setResetLoading(true);
    try {
      const { maskedEmail: me } = await apiSendOtp(resetUsername.trim().toLowerCase());
      setMaskedEmail(me);
      setResendCooldown(60);
      if (!isResend) setStep(1);
    } catch (e: any) {
      setResetError(e.message ?? 'Failed to send OTP. Check your username and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) { setResetError('Please enter the OTP'); return; }
    if (!/^\d{6}$/.test(otp.trim())) { setResetError('OTP must be 6 digits'); return; }
    setResetError('');
    setStep(2);
  };

  const handleResetPassword = async () => {
    setResetError('');
    if (!newPassword) { setResetError('New password is required'); return; }
    if (newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match'); return; }
    setResetLoading(true);
    try {
      await apiResetPassword(resetUsername.trim().toLowerCase(), otp.trim(), newPassword);
      setStep(3); // success
    } catch (e: any) {
      setResetError(e.message ?? 'Failed to reset password. Your OTP may have expired — please start again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
            }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900, color: 'white', letterSpacing: 0.5 }}>CN</Typography>
            </Box>
            <Typography variant="h5" sx={{
              fontWeight: 900,
              letterSpacing: 2.5,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              CRISKA NEXUS
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Project Management Portal
          </Typography>
        </Box>

        <Typography variant="subtitle1" fontWeight={600} color="#1e293b" sx={{ mb: 2.5 }}>
          Sign in to your account
        </Typography>

        <Collapse in={backendWaking}>
          <Box sx={{ mb: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid #bfdbfe', bgcolor: '#eff6ff' }}>
            <LinearProgress sx={{ height: 3 }} />
            <Box sx={{ px: 1.5, py: 1 }}>
              <Typography variant="caption" color="#1d4ed8" fontWeight={600}>
                Server is starting up… ({elapsed}s)
              </Typography>
              <Typography variant="caption" color="#3b82f6" display="block" sx={{ mt: 0.25 }}>
                This takes up to 60 seconds on first load. You can sign in once it's ready.
              </Typography>
            </Box>
          </Box>
        </Collapse>

        <Collapse in={backendChecked && !backendOnline}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Server unreachable — using offline mode. Your changes won't be saved.
          </Alert>
        </Collapse>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth size="small" sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlineIcon fontSize="small" sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />

        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth size="small" sx={{ mb: 1.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />

        <Box sx={{ textAlign: 'right', mb: 2.5 }}>
          <Typography
            variant="caption" color="primary"
            sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
            onClick={openReset}
          >
            Forgot password?
          </Typography>
        </Box>

        <Button
          variant="contained" fullWidth size="large"
          onClick={handleLogin}
          disabled={!username || !password || loading || backendWaking}
          sx={{ fontWeight: 700 }}
        >
          {backendWaking ? `Server starting… (${elapsed}s)` : loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </Paper>

      {/* Forgot Password Dialog */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {step < 3 && (
            <Stepper activeStep={step} sx={{ mb: 3, mt: 1 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}

          {/* Step 0 — enter username */}
          {step === 0 && (
            <TextField
              label="Username"
              value={resetUsername}
              onChange={(e) => setResetUsername(e.target.value)}
              fullWidth size="small" required
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* Step 1 — enter OTP */}
          {step === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                OTP sent to <strong>{maskedEmail}</strong>. Check your inbox — it expires in 10 minutes.
              </Alert>
              <TextField
                label="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                fullWidth size="small" required
                inputProps={{ maxLength: 6, inputMode: 'numeric', style: { letterSpacing: 8, fontWeight: 700, fontSize: 20 } }}
                placeholder="______"
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              />
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="caption"
                  color={resendCooldown > 0 ? 'text.disabled' : 'primary'}
                  sx={{ cursor: resendCooldown > 0 ? 'default' : 'pointer', fontWeight: 600,
                    '&:hover': resendCooldown === 0 ? { textDecoration: 'underline' } : {} }}
                  onClick={() => resendCooldown === 0 && handleSendOtp(true)}
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Step 2 — set new password */}
          {step === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth size="small" required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNew((v) => !v)} edge="end">
                        {showNew ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth size="small" required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirm((v) => !v)} edge="end">
                        {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
            </Box>
          )}

          {/* Step 3 — success */}
          {step === 3 && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Password updated successfully! You can now sign in with your new password.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>
            {step === 3 ? 'Close' : 'Cancel'}
          </Button>
          {step === 0 && (
            <Button variant="contained" onClick={() => handleSendOtp()} disabled={resetLoading || !resetUsername.trim()}>
              {resetLoading ? 'Sending…' : 'Send OTP'}
            </Button>
          )}
          {step === 1 && (
            <Button variant="contained" onClick={handleVerifyOtp} disabled={otp.length !== 6}>
              Verify OTP
            </Button>
          )}
          {step === 2 && (
            <Button
              variant="contained" onClick={handleResetPassword}
              disabled={resetLoading || !newPassword || !confirmPassword}
            >
              {resetLoading ? 'Updating…' : 'Update Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

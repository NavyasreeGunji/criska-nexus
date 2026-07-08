import { ReactNode, useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  AppBar,
  Toolbar,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  InputAdornment,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BugReportIcon from '@mui/icons-material/BugReport';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PRIVILEGED_ROLES } from '../AppRoutes';
import { apiChangePassword } from '../api/api';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'People', icon: <PeopleIcon />, path: '/people' },
  { label: 'Teams', icon: <GroupsIcon />, path: '/teams' },
  { label: 'Stories', icon: <AssignmentIcon />, path: '/stories' },
  { label: 'Timesheet', icon: <EventNoteIcon />, path: '/daily-log' },
  { label: 'Bugs & Issues', icon: <BugReportIcon />, path: '/bugs' },
  { label: 'Deployments', icon: <RocketLaunchIcon />, path: '/deployments' },
  { label: 'Reports', icon: <BarChartIcon />, path: '/reports' },
  { label: 'Login Activity', icon: <PersonSearchIcon />, path: '/login-activity', roles: PRIVILEGED_ROLES },
  { label: 'Help', icon: <HelpOutlineIcon />, path: '/help' },
];

function avatarColor(name: string) {
  const colors = ['#2563EB', '#7C3AED', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function DrawerContent({
  isOpen,
  onNavigate,
}: {
  isOpen: boolean;
  onNavigate: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();
  const visibleNavItems = navItems.filter((item) =>
    !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );
  const userInitials = currentUser
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });
  const [pwNextFocused, setPwNextFocused] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const validateNewPassword = (pw: string): string => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/.test(pw)) return 'Password must contain at least one special character (e.g. @, #, !)';
    return '';
  };

  const handleChangePw = async () => {
    setPwError('');
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwError('All fields are required'); return; }
    const validErr = validateNewPassword(pwForm.next);
    if (validErr) { setPwError(validErr); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await apiChangePassword(currentUser!.username, pwForm.current, pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      setPwError(e.message ?? 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const closePwDialog = () => {
    setPwOpen(false);
    setPwError('');
    setPwSuccess(false);
    setPwForm({ current: '', next: '', confirm: '' });
    setPwShow({ current: false, next: false, confirm: false });
    setPwNextFocused(false);
  };

  const eyeBtn = (field: 'current' | 'next' | 'confirm') => (
    <InputAdornment position="end">
      <IconButton size="small" onClick={() => setPwShow((s) => ({ ...s, [field]: !s[field] }))} edge="end">
        {pwShow[field] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <Box sx={{
        px: isOpen ? 2.5 : 1,
        pt: 2.5,
        pb: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: isOpen ? 1.25 : 0,
        justifyContent: isOpen ? 'flex-start' : 'center',
        transition: 'padding 0.25s ease',
        minHeight: 72,
      }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '8px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: 11, fontWeight: 900, color: 'white', letterSpacing: 0.5 }}>CN</Typography>
        </Box>

        {isOpen && (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, color: 'white', letterSpacing: 2, lineHeight: 1, fontSize: 15, whiteSpace: 'nowrap' }}>
              CRISKA NEXUS
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              Project Management Portal
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Nav items */}
      <List sx={{ px: isOpen ? 1.5 : 0.75, py: 1.5, flexGrow: 1 }}>
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={!isOpen ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => { navigate(item.path); onNavigate(); }}
                  sx={{
                    borderRadius: 2,
                    color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                    bgcolor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: 'white' },
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    px: isOpen ? 1.5 : 1,
                    minHeight: 42,
                  }}
                >
                  <ListItemIcon sx={{
                    color: 'inherit',
                    minWidth: isOpen ? 38 : 0,
                    justifyContent: 'center',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {isOpen && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, noWrap: true }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* User footer */}
      <Box sx={{
        px: isOpen ? 2 : 1,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        justifyContent: isOpen ? 'flex-start' : 'center',
        overflow: 'hidden',
      }}>
        <Tooltip title={!isOpen ? (currentUser?.name ?? '') : ''} placement="right">
          <Avatar sx={{
            width: 34, height: 34, fontSize: 13, flexShrink: 0,
            bgcolor: currentUser ? avatarColor(currentUser.name) : '#2563EB',
            fontWeight: 600,
          }}>
            {userInitials}
          </Avatar>
        </Tooltip>

        {isOpen && (
          <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} color="white" fontSize={13} noWrap>
              {currentUser?.name ?? ''}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }} noWrap>
              {currentUser?.role ?? ''}
            </Typography>
          </Box>
        )}

        {isOpen && (
          <Box sx={{ display: 'flex', flexShrink: 0 }}>
            <Tooltip title="Change password" placement="top">
              <IconButton size="small" onClick={() => setPwOpen(true)}
                sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' } }}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sign out" placement="top">
              <IconButton size="small" onClick={logout}
                sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' } }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Dialog open={pwOpen} onClose={closePwDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {pwSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>Password changed successfully!</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {pwError && <Alert severity="error">{pwError}</Alert>}
              <TextField
                label="Current Password"
                type={pwShow.current ? 'text' : 'password'}
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                size="small"
                fullWidth
                autoComplete="current-password"
                InputProps={{ endAdornment: eyeBtn('current') }}
              />
              <TextField
                label="New Password"
                type={pwShow.next ? 'text' : 'password'}
                value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                onFocus={() => setPwNextFocused(true)}
                onBlur={() => setPwNextFocused(false)}
                size="small"
                fullWidth
                autoComplete="new-password"
                helperText={pwNextFocused ? 'Min 8 chars, at least one number and one special character (@, #, ! …)' : ''}
                InputProps={{ endAdornment: eyeBtn('next') }}
              />
              <TextField
                label="Confirm New Password"
                type={pwShow.confirm ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                size="small"
                fullWidth
                autoComplete="new-password"
                InputProps={{ endAdornment: eyeBtn('confirm') }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePwDialog}>{pwSuccess ? 'Close' : 'Cancel'}</Button>
          {!pwSuccess && (
            <Button onClick={handleChangePw} variant="contained" disabled={pwSaving}>
              {pwSaving ? 'Saving…' : 'Change Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activePage = navItems.find((item) => item.path === location.pathname)?.label ?? 'Dashboard';

  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH;

  const paperSx = {
    width: drawerWidth,
    boxSizing: 'border-box',
    bgcolor: '#1e293b',
    color: 'white',
    borderRight: 'none',
    overflowX: 'hidden',
    transition: 'width 0.25s ease',
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F1F5F9' }}>

      {/* Desktop: collapsible permanent sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            transition: 'width 0.25s ease',
            '& .MuiDrawer-paper': paperSx,
          }}
        >
          <DrawerContent
            isOpen={sidebarOpen}
            onNavigate={() => {}}
          />
        </Drawer>
      )}

      {/* Mobile: temporary drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { ...paperSx, width: DRAWER_WIDTH } }}
        >
          <DrawerContent
            isOpen
            onNavigate={() => setMobileOpen(false)}
          />
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'white', borderBottom: '1px solid #E2E8F0', color: 'inherit' }}
        >
          <Toolbar>
            {isMobile ? (
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1.5, color: '#1e293b' }}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
                <IconButton
                  edge="start"
                  onClick={() => setSidebarOpen((v) => !v)}
                  sx={{ mr: 1.5, color: '#64748b', '&:hover': { color: '#1e293b' } }}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            )}
            <Typography variant="h6" fontWeight={600} sx={{ color: '#1e293b', fontSize: 17 }}>
              {activePage}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

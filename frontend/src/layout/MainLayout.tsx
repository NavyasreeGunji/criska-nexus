import { ReactNode, useState, useRef, useEffect } from 'react';
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
  Paper,
  Popper,
  ClickAwayListener,
  CircularProgress,
  InputBase,
  Chip,
  Tab,
  Tabs,
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
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ArticleIcon from '@mui/icons-material/Article';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useThemeMode } from '../context/ThemeContext';
import { PRIVILEGED_ROLES } from '../constants/roles';
import { apiChangePassword, apiSearch, SearchResults } from '../api/api';
import HelpPage from '../pages/HelpPage';
import styles, {
  getLogoBoxSx, getNavListSx, getNavButtonSx, getNavIconSx,
  getUserBoxSx, getUserAvatarSx, getProfileAvatarSx, getSearchBoxSx,
} from './MainLayout.styles';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'People', icon: <PeopleIcon />, path: '/people' },
  { label: 'Teams', icon: <GroupsIcon />, path: '/teams' },
  { label: 'Stories', icon: <AssignmentIcon />, path: '/stories' },
  { label: 'Timesheet', icon: <EventNoteIcon />, path: '/timesheet' },
  { label: 'Issue Tracker', icon: <BugReportIcon />, path: '/bugs' },
  { label: 'Deployments', icon: <RocketLaunchIcon />, path: '/deployments' },
  { label: 'Reports', icon: <BarChartIcon />, path: '/reports' },
  { label: 'Login Activity', icon: <PersonSearchIcon />, path: '/login-activity', roles: PRIVILEGED_ROLES },
  { label: 'Leave Management', icon: <BeachAccessIcon />, path: '/leave', roles: ['Admin', 'Managing Director', 'Manager', 'HR'] },
];

function avatarBg(name: string) {
  const gradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #30cfd0, #330867)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function DrawerContent({ isOpen, onNavigate }: { isOpen: boolean; onNavigate: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, teams } = useApp();
  const visibleNavItems = navItems.filter((item) =>
    !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );
  const userInitials = currentUser
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
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
    <Box sx={styles.drawerContainer}>
      <Box sx={getLogoBoxSx(isOpen)}>
        <Box sx={styles.iconBox}>
          <Typography sx={styles.logoText}>CN</Typography>
        </Box>
        {isOpen && (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={styles.companyName}>
              CRISKA NEXUS & SOLUTIONS
            </Typography>
            <Typography variant="caption" sx={styles.companyCaption}>
              Project Management Portal
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={styles.drawerDivider} />

      <List sx={getNavListSx(isOpen)}>
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={styles.navItemContainer}>
              <Tooltip title={!isOpen ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => { navigate(item.path); onNavigate(); }}
                  sx={getNavButtonSx(isActive, isOpen)}
                >
                  <ListItemIcon sx={getNavIconSx(isOpen)}>
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

      <Divider sx={styles.drawerDivider} />

      <Box sx={getUserBoxSx(isOpen)}>
        <Tooltip title={!isOpen ? `${currentUser?.name ?? ''} — click to view profile` : 'View profile'} placement="right">
          <Avatar
            onClick={() => { setProfileOpen(true); setProfileTab(0); }}
            sx={getUserAvatarSx(currentUser ? avatarBg(currentUser.name) : 'linear-gradient(135deg,#667eea,#764ba2)')}
          >
            {userInitials}
          </Avatar>
        </Tooltip>
        {isOpen && (
          <Box
            onClick={() => { setProfileOpen(true); setProfileTab(0); }}
            sx={styles.userClickBox}
          >
            <Typography variant="body2" fontWeight={600} color="white" fontSize={13} noWrap>
              {currentUser?.name ?? ''}
            </Typography>
            <Typography variant="caption" sx={styles.userCaption} noWrap>
              {currentUser?.role ?? ''}
            </Typography>
          </Box>
        )}
        {isOpen && (
          <Tooltip title="Sign out" placement="top">
            <IconButton size="small" onClick={logout}
              sx={styles.logoutBtn}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Profile Dialog with tabs */}
      <Dialog
        open={profileOpen}
        onClose={() => { setProfileOpen(false); closePwDialog(); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {/* Header */}
        <Box sx={styles.profileHeader}>
          <Avatar sx={getProfileAvatarSx(currentUser ? avatarBg(currentUser.name) : 'linear-gradient(135deg,#667eea,#764ba2)')}>
            {userInitials}
          </Avatar>
          <Box sx={styles.profileNameBox}>
            <Typography fontWeight={700} fontSize={17}>{currentUser?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{currentUser?.role}</Typography>
          </Box>
          <IconButton onClick={() => { setProfileOpen(false); closePwDialog(); }} sx={styles.profileCloseBtn}>
            <Typography sx={{ fontSize: 16, lineHeight: 1 }}>✕</Typography>
          </IconButton>
        </Box>

        <Tabs
          value={profileTab}
          onChange={(_, v) => { setProfileTab(v); setPwError(''); setPwSuccess(false); }}
          sx={styles.profileTabs}
        >
          <Tab icon={<PersonIcon sx={styles.profileTabIcon} />} iconPosition="start" label="Profile" sx={styles.profileTabItem} />
          <Tab icon={<LockResetIcon sx={styles.profileTabIcon} />} iconPosition="start" label="Change Password" sx={styles.profileTabItem} />
          <Tab icon={<HelpOutlineIcon sx={styles.profileTabIcon} />} iconPosition="start" label="Help" sx={styles.profileTabItem} />
        </Tabs>

        <DialogContent sx={styles.profileContent}>
          {/* Profile tab */}
          {profileTab === 0 && (
            <Box sx={styles.profileFields}>
              {[
                { label: 'Full Name', value: currentUser?.name },
                { label: 'Email', value: currentUser?.email },
                { label: 'Username', value: currentUser?.username },
                { label: 'Role', value: currentUser?.role },
                {
                  label: 'Teams',
                  value: currentUser?.teamIds
                    ?.map((id) => teams.find((t) => t.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || '—',
                },
              ].map(({ label, value }) => (
                <Box key={label} sx={styles.profileField}>
                  <Typography variant="body2" color="text.secondary" sx={styles.profileLabel}>
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Change Password tab */}
          {profileTab === 1 && (
            pwSuccess ? (
              <Alert severity="success">Password changed successfully!</Alert>
            ) : (
              <Box sx={styles.profileFields}>
                {pwError && <Alert severity="error">{pwError}</Alert>}
                <TextField label="Current Password" type={pwShow.current ? 'text' : 'password'} value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                  size="small" fullWidth autoComplete="current-password"
                  InputProps={{ endAdornment: eyeBtn('current') }} />
                <TextField label="New Password" type={pwShow.next ? 'text' : 'password'} value={pwForm.next}
                  onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                  onFocus={() => setPwNextFocused(true)} onBlur={() => setPwNextFocused(false)}
                  size="small" fullWidth autoComplete="new-password"
                  helperText={pwNextFocused ? 'Min 8 chars, at least one number and one special character (@, #, ! …)' : ''}
                  InputProps={{ endAdornment: eyeBtn('next') }} />
                <TextField label="Confirm New Password" type={pwShow.confirm ? 'text' : 'password'} value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  size="small" fullWidth autoComplete="new-password"
                  InputProps={{ endAdornment: eyeBtn('confirm') }} />
              </Box>
            )
          )}

          {/* Help tab */}
          {profileTab === 2 && (
            <Box sx={styles.helpBox}>
              <HelpPage />
            </Box>
          )}
        </DialogContent>

        {profileTab === 1 && !pwSuccess && (
          <DialogActions sx={styles.dialogActions}>
            <Button onClick={() => { setProfileOpen(false); closePwDialog(); }}>Cancel</Button>
            <Button onClick={handleChangePw} variant="contained" disabled={pwSaving}>
              {pwSaving ? 'Saving…' : 'Change Password'}
            </Button>
          </DialogActions>
        )}
        {pwSuccess && profileTab === 1 && (
          <DialogActions sx={styles.dialogActions}>
            <Button onClick={() => { setProfileOpen(false); closePwDialog(); }}>Close</Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();
  const { backendOnline } = useApp();
  const [value, setValue] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 2) { setResults(null); return; }
    const timer = setTimeout(async () => {
      if (!backendOnline) return;
      setLoading(true);
      try {
        const res = await apiSearch(value);
        setResults(res);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, backendOnline]);

  const total = results ? results.stories.length + results.bugs.length + results.developers.length : 0;

  const handleSelect = (type: string) => {
    if (type === 'story') navigate('/stories');
    else if (type === 'bug') navigate('/bugs');
    else if (type === 'developer') navigate('/people');
    setOpen(false);
    setValue('');
    setResults(null);
  };

  const theme = useTheme();

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box ref={anchorRef} sx={styles.searchWrapper}>
        <Box sx={getSearchBoxSx(theme.palette.mode === 'dark')}>
          <SearchIcon sx={styles.searchIcon} />
          <InputBase
            value={value}
            onChange={(e) => { setValue(e.target.value); if (e.target.value.length >= 2) setOpen(true); }}
            onFocus={() => { if (results && total > 0) setOpen(true); }}
            placeholder={backendOnline ? 'Search stories, bugs, people…' : 'Search (offline)'}
            sx={styles.searchInputBase}
            disabled={!backendOnline}
          />
          {loading && <CircularProgress size={14} sx={styles.searchProgress} />}
          {value && (
            <IconButton size="small" onClick={() => { setValue(''); setResults(null); setOpen(false); }}
              sx={styles.clearBtn}>
              <Typography sx={styles.clearBtnText}>✕</Typography>
            </IconButton>
          )}
        </Box>

        <Popper open={open && !!results && total > 0} anchorEl={anchorRef.current} placement="bottom-start"
          style={{ zIndex: 1400, width: anchorRef.current?.offsetWidth ?? 380 }}>
          <Paper elevation={6} sx={styles.resultPaper}>
            {results && (
              <Box>
                {results.stories.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} sx={styles.sectionLabel}>
                      STORIES
                    </Typography>
                    {results.stories.map((r) => (
                      <Box key={r.id} onClick={() => handleSelect(r.type)} sx={styles.resultItem}>
                        <ArticleIcon sx={styles.storyIcon} />
                        <Box sx={styles.resultInner}>
                          <Typography variant="body2" fontWeight={500} noWrap>{r.title}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{r.subtitle}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
                {results.bugs.length > 0 && (
                  <Box>
                    <Divider />
                    <Typography variant="caption" fontWeight={700} sx={styles.sectionLabel}>
                      BUGS
                    </Typography>
                    {results.bugs.map((r) => (
                      <Box key={r.id} onClick={() => handleSelect(r.type)} sx={styles.resultItem}>
                        <BugReportIcon sx={styles.bugIcon} />
                        <Box sx={styles.resultInner}>
                          <Typography variant="body2" fontWeight={500} noWrap>{r.title}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{r.subtitle}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
                {results.developers.length > 0 && (
                  <Box>
                    <Divider />
                    <Typography variant="caption" fontWeight={700} sx={styles.sectionLabel}>
                      PEOPLE
                    </Typography>
                    {results.developers.map((r) => (
                      <Box key={r.id} onClick={() => handleSelect(r.type)} sx={styles.resultItem}>
                        <Avatar sx={styles.searchDevAvatar}>
                          {r.title.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </Avatar>
                        <Box sx={styles.resultInner}>
                          <Typography variant="body2" fontWeight={500} noWrap>{r.title}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{r.subtitle}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activePage = navItems.find((item) => item.path === location.pathname)?.label ?? 'Dashboard';

  const pageSubtitles: Record<string, string> = {
    Dashboard: 'Overview of project health and team activity',
    People: 'Manage team members and their roles',
    Teams: 'Organise developers into project teams',
    Stories: 'Track user stories and sprint work',
    Timesheet: 'Log and review daily work hours',
    'Issue Tracker': 'Report and track bugs across projects',
    Deployments: 'Monitor production deployments',
    Reports: 'Story delivery and developer performance',
    'Login Activity': 'Monitor team login history',
    'Leave Management': 'Manage leave requests and balances',
  };
  const activeSubtitle = pageSubtitles[activePage];

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
    <Box sx={styles.mainBox}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{ width: drawerWidth, flexShrink: 0, transition: 'width 0.25s ease', '& .MuiDrawer-paper': paperSx }}
        >
          <DrawerContent isOpen={sidebarOpen} onNavigate={() => {}} />
        </Drawer>
      )}

      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { ...paperSx, width: DRAWER_WIDTH } }}
        >
          <DrawerContent isOpen onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}

      <Box sx={styles.contentBox}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={styles.appBar}
        >
          <Toolbar>
            {isMobile ? (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={styles.mobileMenuBtn}>
                <MenuIcon />
              </IconButton>
            ) : (
              <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
                <IconButton edge="start" onClick={() => setSidebarOpen((v) => !v)}
                  sx={styles.sidebarToggleBtn}>
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            )}
            <Box sx={styles.pageTitleBox}>
              <Typography variant="h6" fontWeight={600} sx={styles.pageTitleText}>
                {activePage}
              </Typography>
              {activeSubtitle && (
                <Typography variant="caption" color="text.disabled" sx={styles.pageCaption}>
                  {activeSubtitle}
                </Typography>
              )}
            </Box>

            <GlobalSearch />

            <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={toggleMode} sx={styles.themeToggleBtn}>
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={styles.mainContent}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

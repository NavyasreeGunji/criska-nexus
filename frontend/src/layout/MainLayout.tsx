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
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BugReportIcon from '@mui/icons-material/BugReport';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'People', icon: <PeopleIcon />, path: '/people' },
  { label: 'Teams', icon: <GroupsIcon />, path: '/teams' },
  { label: 'Stories', icon: <AssignmentIcon />, path: '/stories' },
  { label: 'Daily Log', icon: <EventNoteIcon />, path: '/daily-log' },
  { label: 'Bugs & Issues', icon: <BugReportIcon />, path: '/bugs' },
  { label: 'Deployments', icon: <RocketLaunchIcon />, path: '/deployments' },
  { label: 'Reports', icon: <BarChartIcon />, path: '/reports' },
];

function avatarColor(name: string) {
  const colors = ['#2563EB', '#7C3AED', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function DrawerContent({
  isOpen,
  onToggle,
  onNavigate,
  showToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  showToggle: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();
  const userInitials = currentUser
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

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

      {/* Collapse toggle (desktop only) */}
      {showToggle && (
        <Box sx={{ px: 1, pb: 1, display: 'flex', justifyContent: isOpen ? 'flex-end' : 'center' }}>
          <Tooltip title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'} placement="right">
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                bgcolor: 'rgba(255,255,255,0.06)',
                borderRadius: 1.5,
                '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.12)' },
                transition: 'transform 0.25s ease',
                transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Nav items */}
      <List sx={{ px: isOpen ? 1.5 : 0.75, py: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
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
        p: isOpen ? 2 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: isOpen ? 1.5 : 0,
        justifyContent: isOpen ? 'flex-start' : 'center',
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
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} color="white" fontSize={13} noWrap>
              {currentUser?.name ?? ''}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }} noWrap>
              {currentUser?.role ?? ''}
            </Typography>
          </Box>
        )}

        <Tooltip title="Sign out" placement={isOpen ? 'top' : 'right'}>
          <IconButton
            size="small"
            onClick={logout}
            sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' }, flexShrink: 0 }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
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
            onToggle={() => setSidebarOpen((v) => !v)}
            onNavigate={() => {}}
            showToggle
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
            onToggle={() => {}}
            onNavigate={() => setMobileOpen(false)}
            showToggle={false}
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

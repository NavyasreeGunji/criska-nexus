import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  Story, Bug, DailyLog, Deployment, StoryStatus, DeploymentStatus,
  initialStories, bugs as initialBugs, deployments as initialDeployments, dailyLogs as initialLogs,
} from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetStories, apiGetBugs, apiGetLogs, apiGetDeployments, apiGetActiveToday, ActiveUser } from '../api/api';

const storyStatusColor: Record<StoryStatus, 'default' | 'primary' | 'warning' | 'success' | 'info'> = {
  backlog: 'default',
  to_do: 'default',
  in_progress: 'primary',
  in_review: 'warning',
  for_qe_testing: 'info',
  done: 'success',
  on_hold: 'default',
};

const storyStatusLabel: Record<StoryStatus, string> = {
  backlog: 'Backlog',
  to_do: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  for_qe_testing: 'Review / Testing',
  done: 'Done',
  on_hold: 'On Hold',
};

const deployStatusColor: Record<DeploymentStatus, 'success' | 'error' | 'primary' | 'warning' | 'default'> = {
  planned: 'default',
  success: 'success',
  failed: 'error',
  in_progress: 'primary',
  rolled_back: 'warning',
};

const deployStatusLabel: Record<DeploymentStatus, string> = {
  planned: 'Planned',
  success: 'Success',
  failed: 'Failed',
  in_progress: 'In Progress',
  rolled_back: 'Rolled Back',
};

import { PRIVILEGED_ROLES } from '../constants/roles';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { backendOnline, backendChecked, sprints, currentUser } = useApp();
  const [stories, setStories] = useState<Story[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  const canSeeActiveUsers = currentUser ? PRIVILEGED_ROLES.includes(currentUser.role) : false;

  useEffect(() => {
    if (!backendChecked) return;
    if (backendOnline) {
      apiGetStories().then(setStories).catch(() => setStories(initialStories));
      apiGetBugs().then(setBugs).catch(() => setBugs(initialBugs));
      apiGetLogs().then(setDailyLogs).catch(() => setDailyLogs(initialLogs));
      apiGetDeployments().then(setDeployments).catch(() => setDeployments(initialDeployments));
      if (canSeeActiveUsers) {
        apiGetActiveToday().then(setActiveUsers).catch(() => setActiveUsers([]));
      }
    } else {
      setStories(initialStories);
      setBugs(initialBugs);
      setDailyLogs(initialLogs);
      setDeployments(initialDeployments);
    }
  }, [backendChecked, backendOnline, canSeeActiveUsers]);

  const today = new Date().toISOString().slice(0, 10);
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);
  const donePoints = stories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.points, 0);
  const successfulDeploys = deployments.filter((d) => d.status === 'success').length;
  const openBugs = bugs.filter((b) => b.status === 'open' || b.status === 'in_progress').length;
  const criticalBugs = bugs.filter((b) => b.severity === 'critical' && b.status !== 'closed' && b.status !== 'resolved').length;
  const todayLogs = dailyLogs.filter((l) => l.date === today);
  const todayHours = todayLogs.reduce((sum, l) => sum + l.hours, 0);
  const todayDevCount = new Set(todayLogs.map((l) => l.developer)).size;
  const doneStories = stories.filter((s) => s.status === 'done').length;

  const metrics: { label: string; value: number | string; sub: string; icon: JSX.Element; color: string; route: string; state?: object }[] = [
    {
      label: 'Total Story Points',
      value: totalPoints,
      sub: `${donePoints} pts delivered`,
      icon: <AssignmentIcon />,
      color: '#2563EB',
      route: '/reports',
    },
    {
      label: 'Deployments',
      value: deployments.length,
      sub: `${successfulDeploys} successful`,
      icon: <RocketLaunchIcon />,
      color: '#0891b2',
      route: '/deployments',
    },
    {
      label: 'Stories Completed',
      value: doneStories,
      sub: `of ${stories.length} total`,
      icon: <CheckCircleIcon />,
      color: '#16a34a',
      route: '/reports',
    },
    {
      label: 'Hours Logged Today',
      value: todayHours,
      sub: `by ${todayDevCount} developer${todayDevCount !== 1 ? 's' : ''}`,
      icon: <AccessTimeIcon />,
      color: '#7C3AED',
      route: '/daily-log',
      state: { developer: 'all', period: 'today' },
    },
  ];

  const activeStories = stories.filter((s) => s.status === 'in_progress').slice(0, 5);
  const openBugList = bugs.filter((b) => b.status === 'open' || b.status === 'in_progress');
  const recentDeployments = [...deployments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metrics.map((m) => {
          return (
            <Grid item xs={12} sm={6} md={3} key={m.label}>
              <Paper
                onClick={() => navigate(m.route, m.state ? { state: m.state } : undefined)}
                sx={{
                  p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
                  cursor: 'pointer', '&:hover': { boxShadow: 4, bgcolor: '#FAFBFF' },
                }}
              >
                <Avatar sx={{ bgcolor: m.color + '18', color: m.color, width: 50, height: 50 }}>
                  {m.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{m.value}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>{m.label}</Typography>
                  <Typography variant="caption" color="text.disabled">{m.sub}</Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Active Stories
            </Typography>
            <List dense disablePadding>
              {activeStories.map((story, i) => (
                <Box key={story.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters alignItems="center" sx={{ py: 0.75, gap: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {story.title}
                        </Typography>
                      }
                      secondary={`${story.assignee} · ${sprints.find((s) => s.id === story.sprintId)?.name ?? ''}`}
                    />
                    <Chip
                      label={storyStatusLabel[story.status]}
                      size="small"
                      color={storyStatusColor[story.status]}
                      sx={{ flexShrink: 0 }}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Open Bugs
            </Typography>
            <List dense disablePadding>
              {openBugList.map((bug, i) => (
                <Box key={bug.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters alignItems="center" sx={{ py: 0.75, gap: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {bug.title}
                        </Typography>
                      }
                      secondary={`${bug.assignee} · ${bug.environment}`}
                    />
                    <Chip
                      label={bug.severity}
                      size="small"
                      color={
                        bug.severity === 'critical'
                          ? 'error'
                          : bug.severity === 'high'
                          ? 'warning'
                          : 'default'
                      }
                      sx={{ flexShrink: 0 }}
                    />
                  </ListItem>
                </Box>
              ))}
              {openBugList.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No open bugs
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Today's Activity
            </Typography>
            <List dense disablePadding>
              {todayLogs.map((log, i) => (
                <Box key={log.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem
                    disableGutters
                    onClick={() => navigate('/daily-log', { state: { developer: log.developer } })}
                    sx={{ py: 0.75, cursor: 'pointer', borderRadius: 1, px: 0.5, '&:hover': { bgcolor: '#F1F5F9' } }}
                  >
                    <ListItemAvatar sx={{ minWidth: 42 }}>
                      <Avatar
                        sx={{
                          width: 30, height: 30, fontSize: 11, fontWeight: 700,
                          bgcolor: '#2563EB18', color: '#2563EB',
                        }}
                      >
                        {log.developer.split(' ').map((n) => n[0]).join('')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={500}>{log.developer}</Typography>}
                      secondary={log.description}
                    />
                    <Typography variant="body2" fontWeight={700} color="primary" sx={{ flexShrink: 0 }}>
                      {log.hours}h
                    </Typography>
                  </ListItem>
                </Box>
              ))}
              {todayLogs.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No logs yet today
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {canSeeActiveUsers && (
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ p: 2.5, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Active Today
              </Typography>
              <List dense disablePadding>
                {activeUsers.map((user, i) => (
                  <Box key={user.id}>
                    {i > 0 && <Divider sx={{ my: 0.5 }} />}
                    <ListItem disableGutters sx={{ py: 0.75 }}>
                      <ListItemAvatar sx={{ minWidth: 42 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, bgcolor: '#16a34a18', color: '#16a34a' }}>
                          {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={500}>{user.name}</Typography>}
                        secondary={user.role}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Typography>
                    </ListItem>
                  </Box>
                ))}
                {activeUsers.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No logins recorded today</Typography>
                )}
              </List>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Recent Deployments
            </Typography>
            <List dense disablePadding>
              {recentDeployments.map((dep, i) => (
                <Box key={dep.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters alignItems="center" sx={{ py: 0.75, gap: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {dep.deployedBy}{' '}
                          <Typography component="span" variant="caption" color="text.secondary">
                            → {dep.environment}
                          </Typography>
                        </Typography>
                      }
                      secondary={`${dep.date} at ${dep.time}`}
                    />
                    <Chip
                      label={deployStatusLabel[dep.status]}
                      size="small"
                      color={deployStatusColor[dep.status]}
                      sx={{ flexShrink: 0 }}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

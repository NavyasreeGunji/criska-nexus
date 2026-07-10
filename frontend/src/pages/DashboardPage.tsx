import { useState, useEffect, useMemo } from 'react';
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
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  Story, Bug, DailyLog, Deployment, StoryStatus, DeploymentStatus, Sprint,
  initialStories, bugs as initialBugs, deployments as initialDeployments, dailyLogs as initialLogs,
} from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetStories, apiGetBugs, apiGetLogs, apiGetDeployments, apiGetActiveToday, ActiveUser } from '../api/api';
import { PRIVILEGED_ROLES } from '../constants/roles';

const storyStatusColor: Record<StoryStatus, 'default' | 'primary' | 'warning' | 'success' | 'info'> = {
  backlog: 'default', to_do: 'default', in_progress: 'primary',
  in_review: 'warning', for_qe_testing: 'info', done: 'success', on_hold: 'default',
};

const storyStatusLabel: Record<StoryStatus, string> = {
  backlog: 'Backlog', to_do: 'To Do', in_progress: 'In Progress',
  in_review: 'In Review', for_qe_testing: 'Review / Testing', done: 'Done', on_hold: 'On Hold',
};

const deployStatusColor: Record<DeploymentStatus, 'success' | 'error' | 'primary' | 'warning' | 'default'> = {
  planned: 'default', success: 'success', failed: 'error', in_progress: 'primary', rolled_back: 'warning',
};

const deployStatusLabel: Record<DeploymentStatus, string> = {
  planned: 'Planned', success: 'Success', failed: 'Failed', in_progress: 'In Progress', rolled_back: 'Rolled Back',
};

// ─── Chart helpers ────────────────────────────────────────────────────────────

function computeBurndown(sprint: Sprint, stories: Story[]) {
  const sprintStories = stories.filter((s) => s.sprintId === sprint.id);
  const total = sprintStories.reduce((sum, s) => sum + (s.points || 0), 0);
  if (total === 0) return [];

  const start = new Date(sprint.startDate + 'T00:00:00');
  const end = new Date(sprint.endDate + 'T00:00:00');
  const now = new Date();
  const chartEnd = now < end ? now : end;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

  const data: { day: string; remaining: number; ideal: number }[] = [];
  const cursor = new Date(start);
  let dayIndex = 0;

  while (cursor <= chartEnd) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const completedPts = sprintStories
      .filter((s) => s.completedDate && s.completedDate <= dateStr)
      .reduce((sum, s) => sum + (s.points || 0), 0);
    const ideal = Math.round(total * (1 - dayIndex / totalDays));
    data.push({ day: dateStr.slice(5), remaining: total - completedPts, ideal });
    cursor.setDate(cursor.getDate() + 1);
    dayIndex++;
  }
  return data;
}

function computeVelocity(sprints: Sprint[], stories: Story[]) {
  return sprints
    .map((sp) => {
      const spStories = stories.filter((s) => s.sprintId === sp.id);
      const committed = spStories.reduce((sum, s) => sum + (s.points || 0), 0);
      const completed = spStories.filter((s) => s.status === 'done').reduce((sum, s) => sum + (s.points || 0), 0);
      return { sprint: sp.name, committed, completed };
    })
    .filter((v) => v.committed > 0);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // Chart data
  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === 'active'),
    [sprints]
  );
  const burndownData = useMemo(
    () => (activeSprint ? computeBurndown(activeSprint, stories) : []),
    [activeSprint, stories]
  );
  const velocityData = useMemo(
    () => computeVelocity(sprints.filter((s) => s.status === 'completed' || s.status === 'active'), stories),
    [sprints, stories]
  );

  const metrics = [
    { label: 'Total Story Points', value: totalPoints, sub: `${donePoints} pts delivered`, icon: <AssignmentIcon />, color: '#2563EB', route: '/reports' },
    { label: 'Deployments', value: deployments.length, sub: `${successfulDeploys} successful`, icon: <RocketLaunchIcon />, color: '#0891b2', route: '/deployments' },
    { label: 'Stories Completed', value: doneStories, sub: `of ${stories.length} total`, icon: <CheckCircleIcon />, color: '#16a34a', route: '/reports' },
    { label: 'Hours Logged Today', value: todayHours, sub: `by ${todayDevCount} developer${todayDevCount !== 1 ? 's' : ''}`, icon: <AccessTimeIcon />, color: '#7C3AED', route: '/daily-log', state: { developer: 'all', period: 'today' } },
  ];

  const activeStories = stories.filter((s) => s.status === 'in_progress').slice(0, 5);
  const openBugList = bugs.filter((b) => b.status === 'open' || b.status === 'in_progress');
  const recentDeployments = [...deployments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <Box>
      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metrics.map((m) => (
          <Grid item xs={12} sm={6} md={3} key={m.label}>
            <Paper
              onClick={() => navigate(m.route, (m as any).state ? { state: (m as any).state } : undefined)}
              sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            >
              <Avatar sx={{ bgcolor: m.color + '18', color: m.color, width: 50, height: 50 }}>{m.icon}</Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{m.value}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{m.label}</Typography>
                <Typography variant="caption" color="text.disabled">{m.sub}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {/* Active Stories */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Active Stories</Typography>
            <List dense disablePadding>
              {activeStories.map((story, i) => (
                <Box key={story.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters alignItems="center" sx={{ py: 0.75, gap: 1 }}>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={500}>{story.title}</Typography>}
                      secondary={`${story.assignee} · ${sprints.find((s) => s.id === story.sprintId)?.name ?? ''}`}
                    />
                    <Chip label={storyStatusLabel[story.status]} size="small" color={storyStatusColor[story.status]} sx={{ flexShrink: 0 }} />
                  </ListItem>
                </Box>
              ))}
              {activeStories.length === 0 && <Typography variant="body2" color="text.secondary">No in-progress stories</Typography>}
            </List>
          </Paper>
        </Grid>

        {/* Open Bugs */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Open Bugs {criticalBugs > 0 && <Chip label={`${criticalBugs} critical`} size="small" color="error" sx={{ ml: 1 }} />}
            </Typography>
            <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {openBugList.map((bug) => (
                <ListItem key={bug.id} disableGutters alignItems="center"
                  sx={{ py: 1, px: 1.5, gap: 1, borderRadius: 1, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.selected' } }}>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={500}>{bug.title}</Typography>}
                    secondary={`${bug.assignee} · ${bug.environment}`}
                  />
                  <Chip label={bug.severity} size="small"
                    color={bug.severity === 'critical' ? 'error' : bug.severity === 'high' ? 'warning' : 'default'}
                    sx={{ flexShrink: 0 }} />
                </ListItem>
              ))}
              {openBugList.length === 0 && <Typography variant="body2" color="text.secondary">No open bugs</Typography>}
            </List>
          </Paper>
        </Grid>

        {/* Today's Activity */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Today's Activity</Typography>
            <List dense disablePadding>
              {todayLogs.map((log, i) => (
                <Box key={log.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters onClick={() => navigate('/daily-log', { state: { developer: log.developer } })}
                    sx={{ py: 0.75, cursor: 'pointer', borderRadius: 1, px: 0.5, '&:hover': { bgcolor: 'action.hover' } }}>
                    <ListItemAvatar sx={{ minWidth: 42 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, bgcolor: '#2563EB18', color: '#2563EB' }}>
                        {log.developer.split(' ').map((n) => n[0]).join('')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={500}>{log.developer}</Typography>}
                      secondary={log.description}
                    />
                    <Typography variant="body2" fontWeight={700} color="primary" sx={{ flexShrink: 0 }}>{log.hours}h</Typography>
                  </ListItem>
                </Box>
              ))}
              {todayLogs.length === 0 && <Typography variant="body2" color="text.secondary">No logs yet today</Typography>}
            </List>
          </Paper>
        </Grid>

        {/* Recent Deployments */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Recent Deployments</Typography>
            <List dense disablePadding>
              {recentDeployments.map((dep, i) => (
                <Box key={dep.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters alignItems="center" sx={{ py: 0.75, gap: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {dep.deployedBy}{' '}
                          <Typography component="span" variant="caption" color="text.secondary">→ {dep.environment}</Typography>
                        </Typography>
                      }
                      secondary={`${dep.date} at ${dep.time}`}
                    />
                    <Chip label={deployStatusLabel[dep.status]} size="small" color={deployStatusColor[dep.status]} sx={{ flexShrink: 0 }} />
                  </ListItem>
                </Box>
              ))}
              {recentDeployments.length === 0 && <Typography variant="body2" color="text.secondary">No deployments yet</Typography>}
            </List>
          </Paper>
        </Grid>

        {/* Sprint Burndown Chart */}
        {burndownData.length > 0 && activeSprint && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Sprint Burndown — {activeSprint.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                {activeSprint.startDate} → {activeSprint.endDate}
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={burndownData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: any, name: any) => [v + ' pts', name === 'remaining' ? 'Actual' : 'Ideal']}
                  />
                  <Legend formatter={(v) => (v === 'remaining' ? 'Actual' : 'Ideal')} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="remaining" stroke="#2563EB" dot={false} strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Team Velocity Chart */}
        {velocityData.length > 0 && (
          <Grid item xs={12} md={burndownData.length > 0 ? 6 : 12}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Team Velocity</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Story points committed vs. completed per sprint
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={velocityData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: any, name: any) => [v + ' pts', name === 'committed' ? 'Committed' : 'Completed']} />
                  <Legend formatter={(v) => (v === 'committed' ? 'Committed' : 'Completed')} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="committed" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Active Today (admin only) */}
        {canSeeActiveUsers && (
          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ p: 2.5, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Active Today</Typography>
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
                {activeUsers.length === 0 && <Typography variant="body2" color="text.secondary">No logins recorded today</Typography>}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

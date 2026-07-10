import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Stack,
  TextField,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import BugReportIcon from '@mui/icons-material/BugReport';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useApp } from '../context/AppContext';
import {
  apiGetLoginEvents, LoginEvent, apiGetStatusSubmittedOn,
  apiGetStoriesCreatedOn, apiGetBugs, apiGetDeployments,
} from '../api/api';

const today = new Date().toISOString().slice(0, 10);

function avatarColor(name: string) {
  const colors = ['#2563EB', '#7C3AED', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function fmtTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDisplayDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

interface UserActivity {
  name: string;
  role: string;
  loginTimes: string[];
  timesheetCount: number;
  storiesCreated: number;
  bugsReported: number;
  deploymentCount: number;
}

function inc(m: Map<string, number>, key: string) {
  m.set(key, (m.get(key) ?? 0) + 1);
}

export default function LoginActivityPage() {
  const { backendOnline, backendChecked, developerProfiles } = useApp();
  const [selectedDate, setSelectedDate] = useState(today);
  const [totalLoginEvents, setTotalLoginEvents] = useState(0);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backendChecked || !backendOnline) return;
    setLoading(true);
    Promise.all([
      apiGetLoginEvents(selectedDate).catch(() => [] as any[]),
      apiGetStatusSubmittedOn(selectedDate).catch(() => [] as any[]),
      apiGetStoriesCreatedOn(selectedDate).catch(() => [] as any[]),
      apiGetBugs().catch(() => [] as any[]),
      apiGetDeployments().catch(() => [] as any[]),
    ])
      .then(([evts, logs, stories, bugs, deployments]) => {
        setTotalLoginEvents(evts.length);

        // Only attribute activity to known developers (exact full-name match in people portal)
        const profileNames = new Set(developerProfiles.map((p) => p.name));
        const resolveKnown = (name: string): string | null =>
          profileNames.has(name) ? name : null;

        // Timesheets: count entries SUBMITTED on selectedDate (not work date)
        const logMap = new Map<string, number>();
        for (const l of logs) {
          const resolved = resolveKnown(l.developer);
          if (resolved) inc(logMap, resolved);
        }

        // Stories: backend returns only stories created on selectedDate (with Instant fallback).
        // Attribute to createdBy, falling back to reporter for older stories.
        const storyMap = new Map<string, number>();
        for (const s of stories) {
          const resolved = resolveKnown(s.createdBy ?? '') ?? resolveKnown(s.reporter ?? '');
          if (resolved) inc(storyMap, resolved);
        }

        const bugMap = new Map<string, number>();
        for (const b of bugs) {
          const resolved = resolveKnown(b.createdBy ?? '') ?? resolveKnown(b.reporter ?? '');
          if (b.createdDate === selectedDate && resolved) inc(bugMap, resolved);
        }

        const deployMap = new Map<string, number>();
        for (const d of deployments) {
          const resolved = resolveKnown(d.deployedBy);
          if (d.date === selectedDate && resolved) inc(deployMap, resolved);
        }

        const roleOf = (name: string) =>
          developerProfiles.find((p) => p.name === name)?.role ?? 'Developer';

        const map = new Map<string, UserActivity>();
        const ensure = (name: string, role?: string): UserActivity => {
          if (!map.has(name)) {
            map.set(name, {
              name, role: role ?? roleOf(name),
              loginTimes: [], timesheetCount: 0,
              storiesCreated: 0, bugsReported: 0, deploymentCount: 0,
            });
          }
          return map.get(name)!;
        };

        for (const e of evts) { ensure(e.developerName, e.role).loginTimes.push(e.loginAt); }
        for (const [n, c] of logMap)    { ensure(n).timesheetCount  = c; }
        for (const [n, c] of storyMap)  { ensure(n).storiesCreated  = c; }
        for (const [n, c] of bugMap)    { ensure(n).bugsReported    = c; }
        for (const [n, c] of deployMap) { ensure(n).deploymentCount = c; }

        setActivities(Array.from(map.values()));
      })
      .finally(() => setLoading(false));
  }, [selectedDate, backendChecked, backendOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const isToday = selectedDate === today;
  // Login events and story-creation tracking started July 10, 2026.
  // Before that the backend was unavailable due to a startup issue, so no real-time events exist.
  const TRACKING_START = '2026-07-10';
  const isBeforeTracking = selectedDate < TRACKING_START;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <PersonSearchIcon sx={{ color: '#2563EB', fontSize: 26 }} />
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Login Activity</Typography>
          <Typography variant="caption" color="text.secondary">
            Logins · timesheets · stories · bugs · deployments per user
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Select Date"
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          inputProps={{}}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
        />
        {isToday && (
          <Chip label="Today" size="small" sx={{ bgcolor: '#dbeafe', color: '#2563EB', fontWeight: 600 }} />
        )}
        <Typography variant="body2" color="text.secondary">
          {fmtDisplayDate(selectedDate)}
        </Typography>
      </Stack>

      {!backendOnline ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Backend offline — activity tracking requires a live connection.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {isBeforeTracking && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Login event and story creation tracking started on <strong>July 10, 2026</strong>.
              For earlier dates only timesheet entries (by work date) are available.
            </Alert>
          )}

          {loading && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Loading…</Typography>
          )}

          {!loading && activities.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No activity recorded for this date.
              </Typography>
            </Paper>
          )}

          {!loading && activities.map((user) => {
            const color = avatarColor(user.name);
            const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
            const total =
              user.loginTimes.length + user.timesheetCount +
              user.storiesCreated + user.bugsReported + user.deploymentCount;

            return (
              <Paper key={user.name} sx={{ overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: color + '22', color, fontWeight: 700, fontSize: 13, width: 38, height: 38 }}>
                    {initials}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.role}</Typography>
                  </Box>
                  <Chip
                    label={`${total} activit${total !== 1 ? 'ies' : 'y'}`}
                    size="small"
                    sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, fontSize: 11 }}
                  />
                </Box>

                <Divider />

                <Box sx={{ px: 2.5, py: 1.5 }}>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {user.loginTimes.map((t, i) => (
                      <Stack key={i} direction="row" alignItems="center" spacing={0.5}
                        sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 1.5, px: 1.25, py: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 13, color: '#2563EB' }} />
                        <Typography variant="caption" fontWeight={600} color="#2563EB">
                          {fmtTime(t)}
                        </Typography>
                      </Stack>
                    ))}

                    {user.timesheetCount > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5}
                        sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1.5, px: 1.25, py: 0.5 }}>
                        <AssignmentTurnedInIcon sx={{ fontSize: 13, color: '#16a34a' }} />
                        <Typography variant="caption" fontWeight={600} color="#16a34a">
                          {user.timesheetCount} timesheet {user.timesheetCount !== 1 ? 'entries' : 'entry'}
                        </Typography>
                      </Stack>
                    )}

                    {user.storiesCreated > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5}
                        sx={{ bgcolor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 1.5, px: 1.25, py: 0.5 }}>
                        <AutoStoriesIcon sx={{ fontSize: 13, color: '#7C3AED' }} />
                        <Typography variant="caption" fontWeight={600} color="#7C3AED">
                          {user.storiesCreated} {user.storiesCreated !== 1 ? 'stories' : 'story'} created
                        </Typography>
                      </Stack>
                    )}

                    {user.bugsReported > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5}
                        sx={{ bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 1.5, px: 1.25, py: 0.5 }}>
                        <BugReportIcon sx={{ fontSize: 13, color: '#ea580c' }} />
                        <Typography variant="caption" fontWeight={600} color="#ea580c">
                          {user.bugsReported} {user.bugsReported !== 1 ? 'bugs' : 'bug'} reported
                        </Typography>
                      </Stack>
                    )}

                    {user.deploymentCount > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5}
                        sx={{ bgcolor: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 1.5, px: 1.25, py: 0.5 }}>
                        <RocketLaunchIcon sx={{ fontSize: 13, color: '#0891b2' }} />
                        <Typography variant="caption" fontWeight={600} color="#0891b2">
                          {user.deploymentCount} {user.deploymentCount !== 1 ? 'deployments' : 'deployment'}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Paper>
            );
          })}

          {!loading && activities.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              {activities.length} active member{activities.length !== 1 ? 's' : ''} · {totalLoginEvents} login session{totalLoginEvents !== 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}

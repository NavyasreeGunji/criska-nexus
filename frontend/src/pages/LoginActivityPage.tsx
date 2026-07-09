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
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useApp } from '../context/AppContext';
import { apiGetLoginEvents, LoginEvent, apiGetStatusByDate } from '../api/api';

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

interface UserSessions {
  name: string;
  role: string;
  times: string[];
  timesheetOnly: boolean;
}

function buildUserList(
  events: LoginEvent[],
  logDevNames: Set<string>,
  getRoleByName: (name: string) => string,
): UserSessions[] {
  const map = new Map<string, UserSessions>();

  for (const e of events) {
    if (!map.has(e.developerName)) {
      map.set(e.developerName, { name: e.developerName, role: e.role, times: [], timesheetOnly: false });
    }
    map.get(e.developerName)!.times.push(e.loginAt);
  }

  for (const devName of logDevNames) {
    if (!map.has(devName)) {
      map.set(devName, { name: devName, role: getRoleByName(devName), times: [], timesheetOnly: true });
    }
  }

  return Array.from(map.values());
}

export default function LoginActivityPage() {
  const { backendOnline, backendChecked, developerProfiles } = useApp();
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [logDevNames, setLogDevNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backendChecked || !backendOnline) return;
    setLoading(true);
    Promise.all([
      apiGetLoginEvents(selectedDate),
      apiGetStatusByDate(selectedDate),
    ])
      .then(([evts, logs]) => {
        setEvents(evts);
        setLogDevNames(new Set(logs.map((l) => l.developer).filter(Boolean)));
      })
      .catch(() => { setEvents([]); setLogDevNames(new Set()); })
      .finally(() => setLoading(false));
  }, [selectedDate, backendChecked, backendOnline]);

  const getRoleByName = (name: string) =>
    developerProfiles.find((p) => p.name === name)?.role ?? 'Developer';

  const userSessions = buildUserList(events, logDevNames, getRoleByName);
  const loginCount = userSessions.filter((u) => !u.timesheetOnly).length;
  const timesheetOnlyCount = userSessions.filter((u) => u.timesheetOnly).length;
  const isToday = selectedDate === today;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <PersonSearchIcon sx={{ color: '#2563EB', fontSize: 26 }} />
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Login Activity</Typography>
          <Typography variant="caption" color="text.secondary">
            All login sessions and timesheet activity per user
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
            Backend offline — login tracking requires a live connection.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {loading && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Loading…</Typography>
          )}

          {!loading && userSessions.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No activity recorded for this date.
              </Typography>
            </Paper>
          )}

          {!loading && userSessions.map((user) => {
            const color = avatarColor(user.name);
            const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
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
                  {user.timesheetOnly ? (
                    <Chip
                      label="Work logged"
                      size="small"
                      sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: 11 }}
                    />
                  ) : (
                    <Chip
                      label={`${user.times.length} session${user.times.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ bgcolor: '#dbeafe', color: '#2563EB', fontWeight: 600, fontSize: 11 }}
                    />
                  )}
                </Box>

                <Divider />

                <Box sx={{ px: 2.5, py: 1.25 }}>
                  {user.timesheetOnly ? (
                    <Stack direction="row" alignItems="center" spacing={0.75}
                      sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1.5, px: 1.25, py: 0.5, width: 'fit-content' }}>
                      <AssignmentTurnedInIcon sx={{ fontSize: 13, color: '#16a34a' }} />
                      <Typography variant="caption" fontWeight={600} color="#16a34a">
                        Submitted timesheet (no app login)
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {user.times.map((t, i) => (
                        <Stack key={i} direction="row" alignItems="center" spacing={0.5}
                          sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 1.25, py: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 13, color: '#64748b' }} />
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            {fmtTime(t)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Paper>
            );
          })}

          {!loading && userSessions.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              {events.length} total session{events.length !== 1 ? 's' : ''} · {loginCount} logged in · {timesheetOnlyCount} timesheet only
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Stack,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { useApp } from '../context/AppContext';
import { apiGetActiveOn, ActiveUser } from '../api/api';

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
  const dt = new Date(dateStr + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function LoginActivityPage() {
  const { backendOnline, backendChecked } = useApp();
  const [selectedDate, setSelectedDate] = useState(today);
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backendChecked || !backendOnline) return;
    setLoading(true);
    apiGetActiveOn(selectedDate)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [selectedDate, backendChecked, backendOnline]);

  const isToday = selectedDate === today;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <PersonSearchIcon sx={{ color: '#2563EB', fontSize: 26 }} />
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Login Activity</Typography>
          <Typography variant="caption" color="text.secondary">
            Users who logged into the application
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
          inputProps={{ max: today }}
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

      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
              {loading ? 'Loading…' : `${users.length} user${users.length !== 1 ? 's' : ''} logged in`}
            </Typography>
            <Typography variant="caption" color="text.secondary">Login Time</Typography>
          </Stack>
        </Box>

        {!backendOnline && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Backend offline — login tracking requires a live connection.
            </Typography>
          </Box>
        )}

        {backendOnline && !loading && (
          <List disablePadding>
            {users.map((user, i) => (
              <Box key={user.id}>
                {i > 0 && <Divider />}
                <ListItem sx={{ py: 1.5, px: 2.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{
                      bgcolor: avatarColor(user.name) + '22',
                      color: avatarColor(user.name),
                      fontWeight: 700,
                      fontSize: 13,
                      width: 38,
                      height: 38,
                    }}>
                      {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{user.name}</Typography>}
                    secondary={user.role}
                  />
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {fmtTime(user.lastLoginAt)}
                  </Typography>
                </ListItem>
              </Box>
            ))}
            {users.length === 0 && (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No logins recorded for this date.
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Paper>
    </Box>
  );
}

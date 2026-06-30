import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import {
  DailyLog,
  Story,
  dailyLogs as initialLogs,
  initialStories,
} from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetLogs, apiCreateLog, apiGetStories } from '../api/api';

type FilterPeriod = 'today' | 'week' | 'custom';

const today = new Date().toISOString().slice(0, 10);

function getWeekRange(): [string, string] {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return [mon.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
}

const emptyForm = (): Omit<DailyLog, 'id'> => ({
  developer: '',
  date: today,
  title: '',
  description: '',
  hours: 4,
});

export default function DailyLogPage() {
  const location = useLocation();
  const { currentUser, developerProfiles, backendOnline, backendChecked } = useApp();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);

  useEffect(() => {
    if (!backendChecked) return;
    if (backendOnline) {
      apiGetLogs().then(setLogs).catch(() => setLogs(initialLogs));
      apiGetStories().then(setAllStories).catch(() => setAllStories(initialStories));
    } else {
      setLogs(initialLogs);
      setAllStories(initialStories);
    }
  }, [backendChecked, backendOnline]);

  const navDeveloper = (location.state as any)?.developer ?? null;
  const navPeriod: FilterPeriod = (location.state as any)?.period ?? 'today';
  const [filterDev, setFilterDev] = useState(navDeveloper ?? currentUser?.name ?? 'all');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>(navPeriod);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Omit<DailyLog, 'id'>>({
    ...emptyForm(),
    developer: currentUser?.name ?? '',
  });

  useEffect(() => {
    if (navDeveloper) return;
    if (currentUser) setFilterDev(currentUser.name);
  }, [currentUser]);

  const devStories = allStories.filter((s) => s.assignee === form.developer);

  const filtered = logs
    .filter((l) => filterDev === 'all' || l.developer === filterDev)
    .filter((l) => {
      if (filterPeriod === 'today') return l.date === today;
      if (filterPeriod === 'week') {
        const [mon, sun] = getWeekRange();
        return l.date >= mon && l.date <= sun;
      }
      // custom range
      if (fromDate && toDate) return l.date >= fromDate && l.date <= toDate;
      if (fromDate) return l.date >= fromDate;
      if (toDate) return l.date <= toDate;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.developer.localeCompare(b.developer));

  const totalHours = filtered.reduce((sum, l) => sum + l.hours, 0);

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      if (backendOnline) {
        const created = await apiCreateLog(form);
        setLogs((prev) => [...prev, created]);
      } else {
        const newId = `L-${String(logs.length + 1).padStart(3, '0')}`;
        setLogs((prev) => [...prev, { ...form, id: newId }]);
      }
      setDialogOpen(false);
      setForm({ ...emptyForm(), developer: currentUser?.name ?? '' });
    } catch (err: any) {
      setSaveError(err?.message ?? 'Save failed. Check the backend is running and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const showDevColumn = filterDev === 'all';

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Developer</InputLabel>
          <Select
            value={filterDev}
            label="Developer"
            onChange={(e) => setFilterDev(e.target.value)}
          >
            <MenuItem value="all">All Developers</MenuItem>
            {developerProfiles.map((d) => (
              <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={filterPeriod === 'custom' ? null : filterPeriod}
          exclusive
          onChange={(_, val) => {
            if (val) { setFilterPeriod(val); setFromDate(''); setToDate(''); }
          }}
          size="small"
        >
          <ToggleButton value="today">Today</ToggleButton>
          <ToggleButton value="week">This Week</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>From</Typography>
          <TextField
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setFilterPeriod('custom'); }}
            sx={{ width: 140 }}
          />
          <Typography variant="caption" color="text.secondary">To</Typography>
          <TextField
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setFilterPeriod('custom'); }}
            sx={{ width: 140 }}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {filtered.length} entries · {totalHours}h total
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSaveError('');
            setForm({ ...emptyForm(), developer: currentUser?.name ?? '' });
            setDialogOpen(true);
          }}
        >
          Log Work
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b', textAlign: 'center', width: '12%' }}>Date</TableCell>
              {showDevColumn && (
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b', textAlign: 'center', width: '16%' }}>Developer</TableCell>
              )}
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b', textAlign: 'center', width: showDevColumn ? '24%' : '28%' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b', textAlign: 'center' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b', textAlign: 'center', width: '10%' }}>Hours</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Typography variant="body2">{log.date}</Typography>
                </TableCell>
                {showDevColumn && (
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight={500}>{log.developer}</Typography>
                  </TableCell>
                )}
                <TableCell sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight={600}>{log.title}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{log.description}</Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight={700}>{log.hours}h</Typography>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={showDevColumn ? 5 : 4} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                  No logs found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Daily Work</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth required>
                <InputLabel required>Developer</InputLabel>
                <Select
                  value={form.developer}
                  label="Developer"
                  onChange={(e) => setForm((f) => ({ ...f, developer: e.target.value, title: '' }))}
                >
                  {developerProfiles.map((d) => (
                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: today }}
                fullWidth
                required
              />
            </Stack>

            <Autocomplete
              options={devStories}
              getOptionLabel={(s) => s.title}
              value={devStories.find((s) => s.title === form.title) ?? null}
              onChange={(_, story) => setForm((f) => ({ ...f, title: story?.title ?? '' }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Story / Task"
                  size="small"
                  placeholder={devStories.length === 0 ? 'No stories assigned to this developer' : 'Select a story…'}
                  required
                />
              )}
              noOptionsText="No stories assigned to this developer"
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={3}
              required
              placeholder="What did you work on today?"
            />
            <TextField
              label="Hours"
              type="number"
              value={form.hours}
              onChange={(e) => setForm((f) => ({ ...f, hours: Number(e.target.value) }))}
              size="small"
              sx={{ width: 120 }}
              inputProps={{ min: 0.5, max: 12, step: 0.5 }}
              required
            />
          </Stack>
        </DialogContent>
        {saveError && <Alert severity="error" sx={{ mx: 3, mb: 1 }}>{saveError}</Alert>}
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !form.developer || !form.title || !form.description || form.hours <= 0}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

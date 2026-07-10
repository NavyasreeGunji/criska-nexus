import { useState, useEffect } from 'react';
import { exportExcel } from '../utils/exportExcel';
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
  TablePagination,
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
  IconButton,
  Tooltip,
  Snackbar,
  Divider,
} from '@mui/material';
import TablePaginationActions, { paginationSx } from '../components/TablePaginationActions';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import {
  DailyLog,
  Story,
  dailyLogs as initialLogs,
  initialStories,
} from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetLogs, apiCreateLog, apiUpdateLog, apiGetStories } from '../api/api';
import { PRIVILEGED_ROLES } from '../constants/roles';

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

const fmtDate = (d: string) => {
  if (!d) return d;
  const [y, m, day] = d.split('-');
  return `${day}-${m}-${y.slice(2)}`;
};

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
  const isPrivileged = currentUser ? PRIVILEGED_ROLES.includes(currentUser.role) : false;
  const canEditLog = (log: DailyLog) => isPrivileged || log.developer === currentUser?.name;
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewLog, setViewLog] = useState<DailyLog | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<Omit<DailyLog, 'id'>>({
    ...emptyForm(),
    developer: currentUser?.name ?? '',
  });

  useEffect(() => {
    if (navDeveloper) return;
    if (currentUser) setFilterDev(currentUser.name);
  }, [currentUser]);

  const devStories = allStories.filter((s) => s.assignee === form.developer && s.status !== 'done');

  const filtered = logs
    .filter((l) => filterDev === 'all' || l.developer === filterDev)
    .filter((l) => {
      if (filterPeriod === 'today') return l.date === today;
      if (filterPeriod === 'week') {
        const [mon, sun] = getWeekRange();
        return l.date >= mon && l.date <= sun;
      }
      if (fromDate && toDate) return l.date >= fromDate && l.date <= toDate;
      if (fromDate) return l.date >= fromDate;
      if (toDate) return l.date <= toDate;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.developer.localeCompare(b.developer));

  const totalHours = filtered.reduce((sum, l) => sum + l.hours, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => setCopied(true));
  };

  const handleExportXLS = () => {
    const columns = [
      { key: 'developer',   label: 'Developer',    width: 24 },
      { key: 'date',        label: 'Date',          width: 14, align: 'center' as const },
      { key: 'task',        label: 'Task / Story',  width: 38 },
      { key: 'description', label: 'Description',   width: 50 },
      { key: 'hours',       label: 'Hours',         width: 8,  align: 'center' as const, numFmt: '0.0' },
    ];
    const rows = filtered.map((l) => ({
      developer:   l.developer,
      date:        fmtDate(l.date),
      task:        l.title,
      description: l.description,
      hours:       l.hours,
    }));
    exportExcel(columns, rows, 'Daily Log', `daily-log-${today}.xlsx`);
  };

  const openEdit = (log: DailyLog) => {
    setEditingLog(log);
    setSaveError('');
    setForm({ developer: log.developer, date: log.date, title: log.title, description: log.description, hours: log.hours });
    setDialogOpen(true);
  };

  const alreadyLoggedHours = logs
    .filter((l) => l.developer === form.developer && l.date === form.date && l.id !== editingLog?.id)
    .reduce((sum, l) => sum + l.hours, 0);
  const remainingHours = Math.max(0, 8 - alreadyLoggedHours);

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      if (editingLog) {
        if (backendOnline) {
          const updated = await apiUpdateLog(editingLog.id, form);
          setLogs((prev) => prev.map((l) => l.id === editingLog.id ? updated : l));
        } else {
          setLogs((prev) => prev.map((l) => l.id === editingLog.id ? { ...form, id: l.id } : l));
        }
      } else {
        if (backendOnline) {
          const created = await apiCreateLog(form);
          setLogs((prev) => [...prev, created]);
        } else {
          const newId = `L-${String(logs.length + 1).padStart(3, '0')}`;
          setLogs((prev) => [...prev, { ...form, id: newId }]);
        }
      }
      setDialogOpen(false);
      setEditingLog(null);
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
          <Select value={filterDev} label="Developer" onChange={(e) => { setFilterDev(e.target.value); setPage(0); }}>
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
            if (val) { setFilterPeriod(val); setFromDate(''); setToDate(''); setPage(0); }
          }}
          size="small"
        >
          <ToggleButton value="today">Today</ToggleButton>
          <ToggleButton value="week">This Week</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>From</Typography>
          <TextField type="date" size="small" value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setFilterPeriod('custom'); setPage(0); }}
            sx={{ width: 140 }} />
          <Typography variant="caption" color="text.secondary">To</Typography>
          <TextField type="date" size="small" value={toDate}
            onChange={(e) => { setToDate(e.target.value); setFilterPeriod('custom'); setPage(0); }}
            sx={{ width: 140 }} />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {filtered.length} entries · {totalHours}h total
        </Typography>
        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Export Excel">
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportXLS}>
            Export Excel
          </Button>
        </Tooltip>

        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => { setSaveError(''); setEditingLog(null); setForm({ ...emptyForm(), developer: currentUser?.name ?? '' }); setDialogOpen(true); }}>
          Log Work
        </Button>
      </Stack>

      <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', width: '10%' }}>Date</TableCell>
              {showDevColumn && (
                <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', width: '16%' }}>Developer</TableCell>
              )}
              <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', width: '22%' }}>Task / Story</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', width: '8%', textAlign: 'center' }}>Hours</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', width: '8%', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2">{fmtDate(log.date)}</Typography>
                </TableCell>
                {showDevColumn && (
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{log.developer}</Typography>
                  </TableCell>
                )}
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{log.title}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography variant="body2" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    color: 'text.secondary',
                  }}>
                    {log.description}
                  </Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight={700}>{log.hours}h</Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="View full description">
                      <IconButton size="small" onClick={() => setViewLog(log)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canEditLog(log) && (
                      <Tooltip title="Edit entry">
                        <IconButton size="small" onClick={() => openEdit(log)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={showDevColumn ? 6 : 5} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                  No logs found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {filtered.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 20, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          ActionsComponent={TablePaginationActions}
          sx={paginationSx}
        />
      )}
      </Paper>

      {/* View Log Dialog */}
      {viewLog && (
        <Dialog open={!!viewLog} onClose={() => setViewLog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={700}>{viewLog.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {viewLog.developer} · {fmtDate(viewLog.date)} · {viewLog.hours}h
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.75 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.8 }}>
              {viewLog.description}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button startIcon={<ContentCopyIcon />} onClick={() => copyToClipboard(viewLog.description)}>
              Copy Description
            </Button>
            <Button variant="contained" onClick={() => setViewLog(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Add Log Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingLog(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLog ? 'Edit Log Entry' : 'Log Daily Work'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth required>
                <InputLabel required>Developer</InputLabel>
                <Select value={form.developer} label="Developer"
                  onChange={(e) => setForm((f) => ({ ...f, developer: e.target.value, title: '' }))}>
                  {developerProfiles.map((d) => (
                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Date" type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                size="small" InputLabelProps={{ shrink: true }}
                inputProps={{ min: getWeekRange()[0], max: getWeekRange()[1] }}
                helperText="Current week only"
                fullWidth required />
            </Stack>

            <Autocomplete
              options={devStories}
              getOptionLabel={(s) => s.title}
              value={devStories.find((s) => s.title === form.title) ?? null}
              onChange={(_, story) => setForm((f) => ({ ...f, title: story?.title ?? '' }))}
              renderInput={(params) => (
                <TextField {...params} label="Story / Task" size="small"
                  placeholder={devStories.length === 0 ? 'No stories assigned to this developer' : 'Select a story…'}
                  required />
              )}
              noOptionsText="No stories assigned to this developer"
            />

            <TextField label="Description" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth size="small" multiline rows={3} required
              placeholder="What did you work on today?" />
            <TextField label="Hours" type="number" value={form.hours}
              onChange={(e) => setForm((f) => ({ ...f, hours: Number(e.target.value) }))}
              size="small" sx={{ width: 160 }} inputProps={{ min: 0.5, max: remainingHours, step: 0.5 }} required
              helperText={alreadyLoggedHours > 0 ? `${alreadyLoggedHours}h logged · ${remainingHours}h remaining` : 'Max 8h per day'}
              error={form.hours > remainingHours} />
          </Stack>
        </DialogContent>
        {saveError && <Alert severity="error" sx={{ mx: 3, mb: 1 }}>{saveError}</Alert>}
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setEditingLog(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={isSaving || !form.developer || !form.title || !form.description || form.hours <= 0 || form.hours > remainingHours}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}
        message="Copied to clipboard" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}

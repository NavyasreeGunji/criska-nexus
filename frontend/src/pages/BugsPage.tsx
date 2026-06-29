import { useState, useEffect } from 'react';
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
  Chip,
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
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import { Bug, bugs as initialBugs, BugSeverity, BugStatus } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetBugs, apiCreateBug, apiUpdateBug } from '../api/api';

const severityConfig: Record<BugSeverity, { color: 'error' | 'warning' | 'default'; label: string }> = {
  critical: { color: 'error', label: 'Critical' },
  high: { color: 'warning', label: 'High' },
  medium: { color: 'default', label: 'Medium' },
  low: { color: 'default', label: 'Low' },
};

const statusConfig: Record<BugStatus, { color: 'error' | 'primary' | 'success' | 'default'; label: string }> = {
  open: { color: 'error', label: 'Open' },
  in_progress: { color: 'primary', label: 'In Progress' },
  resolved: { color: 'success', label: 'Resolved' },
  closed: { color: 'default', label: 'Closed' },
};

const emptyForm = (): Omit<Bug, 'id'> => ({
  title: '',
  description: '',
  severity: 'medium',
  status: 'open',
  environment: 'production',
  reporter: '',
  assignee: '',
  createdDate: new Date().toISOString().slice(0, 10),
  resolvedDate: '',
});

export default function BugsPage() {
  const { developerProfiles, backendOnline, backendChecked } = useApp();
  const [bugs, setBugs] = useState<Bug[]>([]);

  useEffect(() => {
    if (!backendChecked) return;
    if (backendOnline) {
      apiGetBugs().then(setBugs).catch(() => setBugs(initialBugs));
    } else {
      setBugs(initialBugs);
    }
  }, [backendChecked, backendOnline]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterEnv, setFilterEnv] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Bug | null>(null);
  const [form, setForm] = useState<Omit<Bug, 'id'>>(emptyForm());
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filtered = bugs
    .filter((b) => filterStatus === 'all' || b.status === filterStatus)
    .filter((b) => filterSeverity === 'all' || b.severity === filterSeverity)
    .filter((b) => filterEnv === 'all' || b.environment === filterEnv);

  const openAdd = () => {
    setForm(emptyForm());
    setEditTarget(null);
    setSaveError('');
    setDialogOpen(true);
  };

  const openEdit = (b: Bug) => {
    setForm({ ...b });
    setEditTarget(b);
    setSaveError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaveError('');
    const trimmedForm = { ...form, title: form.title.trim(), reporter: form.reporter.trim() };
    setForm(trimmedForm);
    setIsSaving(true);
    try {
      if (backendOnline) {
        if (editTarget) {
          const updated = await apiUpdateBug(editTarget.id, trimmedForm);
          setBugs((prev) => prev.map((b) => (b.id === editTarget.id ? updated : b)));
        } else {
          const created = await apiCreateBug(trimmedForm);
          setBugs((prev) => [...prev, created]);
        }
      } else {
        if (editTarget) {
          setBugs((prev) => prev.map((b) => (b.id === editTarget.id ? { ...trimmedForm, id: editTarget.id } : b)));
        } else {
          const newId = `B-${String(bugs.length + 1).padStart(3, '0')}`;
          setBugs((prev) => [...prev, { ...trimmedForm, id: newId }]);
        }
      }
      setDialogOpen(false);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Save failed. Check the backend is running and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Severity</InputLabel>
          <Select value={filterSeverity} label="Severity" onChange={(e) => setFilterSeverity(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {Object.entries(severityConfig).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Environment</InputLabel>
          <Select value={filterEnv} label="Environment" onChange={(e) => setFilterEnv(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="production">Production</MenuItem>
            <MenuItem value="staging">Staging</MenuItem>
            <MenuItem value="development">Development</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={openAdd}>
          Report Bug
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              {['ID', 'Title', 'Severity', 'Status', 'Environment', 'Reporter', 'Assignee', 'Created', 'Resolved', ''].map(
                (h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((bug) => (
              <TableRow key={bug.id} hover>
                <TableCell>
                  <Typography variant="caption" color="text.disabled" fontWeight={600}>
                    {bug.id}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden' }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {bug.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {bug.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={severityConfig[bug.severity].label}
                    size="small"
                    color={severityConfig[bug.severity].color}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusConfig[bug.status].label}
                    size="small"
                    color={statusConfig[bug.status].color}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={bug.environment}
                    size="small"
                    variant="outlined"
                    color={bug.environment === 'production' ? 'error' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{bug.reporter}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{bug.assignee}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{bug.createdDate}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{bug.resolvedDate || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(bug)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Bug' : 'Report Bug'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
              size="small"
              required
              error={form.title.length > 0 && !form.title.trim()}
              helperText={form.title.length > 0 && !form.title.trim() ? 'Title cannot be only spaces' : ''}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={3}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={form.severity}
                  label="Severity"
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as BugSeverity }))}
                >
                  {Object.entries(severityConfig).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => {
                    const newStatus = e.target.value as BugStatus;
                    setForm((f) => ({
                      ...f,
                      status: newStatus,
                      resolvedDate: (newStatus === 'resolved' || newStatus === 'closed')
                        ? (f.resolvedDate || new Date().toISOString().slice(0, 10))
                        : f.resolvedDate,
                    }));
                  }}
                >
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select
                value={form.environment}
                label="Environment"
                onChange={(e) =>
                  setForm((f) => ({ ...f, environment: e.target.value as Bug['environment'] }))
                }
              >
                <MenuItem value="production">Production</MenuItem>
                <MenuItem value="staging">Staging</MenuItem>
                <MenuItem value="development">Development</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Reporter"
                value={form.reporter}
                onChange={(e) => setForm((f) => ({ ...f, reporter: e.target.value }))}
                size="small"
                fullWidth
                placeholder="Client or team member name"
                required
                error={form.reporter.length > 0 && !form.reporter.trim()}
                helperText={form.reporter.length > 0 && !form.reporter.trim() ? 'Reporter cannot be only spaces' : ''}
              />
              <FormControl size="small" fullWidth required>
                <InputLabel required>Assignee</InputLabel>
                <Select
                  value={form.assignee}
                  label="Assignee"
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                >
                  {developerProfiles.map((d) => (
                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Created Date"
                type="date"
                value={form.createdDate}
                onChange={(e) => setForm((f) => ({ ...f, createdDate: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Resolved Date"
                type="date"
                value={form.resolvedDate}
                onChange={(e) => setForm((f) => ({ ...f, resolvedDate: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        {saveError && <Alert severity="error" sx={{ mx: 3, mb: 1 }}>{saveError}</Alert>}
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSave}
            disabled={isSaving || !form.title.trim() || !form.reporter.trim() || !form.assignee}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

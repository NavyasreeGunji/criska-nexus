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
  Stack,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Deployment, deployments as initialDeployments, DeploymentStatus } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetDeployments, apiCreateDeployment, apiUpdateDeployment } from '../api/api';

const statusConfig: Record<DeploymentStatus, { color: 'default' | 'primary' | 'success' | 'error' | 'warning'; label: string; bg: string; text: string }> = {
  planned: { color: 'default', label: 'Planned', bg: '#f1f5f9', text: '#64748b' },
  in_progress: { color: 'primary', label: 'In Progress', bg: '#dbeafe', text: '#2563EB' },
  success: { color: 'success', label: 'Success', bg: '#dcfce7', text: '#16a34a' },
  failed: { color: 'error', label: 'Failed', bg: '#fee2e2', text: '#dc2626' },
  rolled_back: { color: 'warning', label: 'Rolled Back', bg: '#fef3c7', text: '#d97706' },
};

const UPCOMING_STATUSES: DeploymentStatus[] = ['planned', 'in_progress'];
const COMPLETED_STATUSES: DeploymentStatus[] = ['success', 'failed', 'rolled_back'];

const emptyForm = (): Omit<Deployment, 'id'> => ({
  environment: 'stage/UAT',
  status: 'planned',
  deployedBy: '',
  date: new Date().toISOString().slice(0, 10),
  time: '18:00',
  description: '',
  notes: '',
  hours: undefined,
});

const PRIVILEGED_ROLES = ['Admin', 'Manager', 'Associate Manager', 'Delivery Manager', 'Technical Manager', 'HR'];

export default function DeploymentsPage() {
  const { developerProfiles, backendOnline, backendChecked, currentUser } = useApp();

  const canEditDeployment = (dep: Deployment) =>
    !!currentUser && (PRIVILEGED_ROLES.includes(currentUser.role) || currentUser.name === dep.deployedBy);
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  useEffect(() => {
    if (!backendChecked) return;
    if (backendOnline) {
      apiGetDeployments().then(setDeployments).catch(() => setDeployments(initialDeployments));
    } else {
      setDeployments(initialDeployments);
    }
  }, [backendChecked, backendOnline]);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Deployment | null>(null);
  const [form, setForm] = useState<Omit<Deployment, 'id'>>(emptyForm());
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = deployments
    .filter((d) => UPCOMING_STATUSES.includes(d.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const completed = deployments
    .filter((d) => COMPLETED_STATUSES.includes(d.status))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const openAdd = () => {
    setForm({ ...emptyForm(), status: tab === 0 ? 'planned' : 'success' });
    setEditTarget(null);
    setSaveError('');
    setDialogOpen(true);
  };

  const openEdit = (d: Deployment) => {
    setForm({ ...d });
    setEditTarget(d);
    setSaveError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaveError('');
    const trimmedForm = { ...form, description: form.description.trim() };
    setForm(trimmedForm);
    setIsSaving(true);
    try {
      if (backendOnline) {
        if (editTarget) {
          const updated = await apiUpdateDeployment(editTarget.id, trimmedForm);
          setDeployments((prev) => prev.map((d) => (d.id === editTarget.id ? updated : d)));
        } else {
          const created = await apiCreateDeployment(trimmedForm);
          setDeployments((prev) => [...prev, created]);
        }
      } else {
        if (editTarget) {
          setDeployments((prev) => prev.map((d) => (d.id === editTarget.id ? { ...trimmedForm, id: editTarget.id } : d)));
        } else {
          const newId = `D-${String(deployments.length + 1).padStart(3, '0')}`;
          setDeployments((prev) => [...prev, { ...trimmedForm, id: newId }]);
        }
      }
      setDialogOpen(false);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Save failed. Check the backend is running and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('');

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }} gap={1}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flexGrow: 1 }}>
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <ScheduleIcon fontSize="small" />
                <span>Upcoming ({upcoming.length})</span>
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleIcon fontSize="small" />
                <span>Completed ({completed.length})</span>
              </Stack>
            }
          />
        </Tabs>
        <Button variant="contained" startIcon={<RocketLaunchIcon />} onClick={openAdd} sx={{ flexShrink: 0 }}>
          {tab === 0 ? 'Schedule Deployment' : 'Log Deployment'}
        </Button>
      </Stack>

      {tab === 0 && (
        <Box>
          {upcoming.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No upcoming deployments scheduled</Typography>
            </Paper>
          )}
          <Stack spacing={2}>
            {upcoming.map((dep) => {
              const cfg = statusConfig[dep.status];
              return (
                <Paper key={dep.id} sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Avatar
                      sx={{
                        bgcolor: cfg.bg,
                        color: cfg.text,
                        width: 44,
                        height: 44,
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {initials(dep.deployedBy)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {dep.deployedBy}
                        </Typography>
                        <Chip
                          label={dep.environment}
                          size="small"
                          variant="outlined"
                          color={dep.environment === 'production' ? 'error' : 'default'}
                        />
                        <Chip
                          label={cfg.label}
                          size="small"
                          sx={{ bgcolor: cfg.bg, color: cfg.text, fontWeight: 600 }}
                        />
                      </Stack>
                      <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Assigned to:</strong> {dep.deployedBy}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Scheduled:</strong> {dep.date} at {dep.time}
                        </Typography>
                        {dep.hours != null && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Effort:</strong> {dep.hours}h
                          </Typography>
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {dep.description}
                      </Typography>
                      {dep.notes && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                          Note: {dep.notes}
                        </Typography>
                      )}
                    </Box>
                    {canEditDeployment(dep) && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(dep)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {/* Group completed deployments by employee */}
          {(() => {
            const byEmployee: Record<string, Deployment[]> = {};
            completed.forEach((dep) => {
              if (!byEmployee[dep.deployedBy]) byEmployee[dep.deployedBy] = [];
              byEmployee[dep.deployedBy].push(dep);
            });
            return Object.entries(byEmployee).map(([employee, deps]) => (
              <Paper key={employee} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      fontSize: 11,
                      fontWeight: 700,
                      bgcolor: '#2563EB18',
                      color: '#2563EB',
                    }}
                  >
                    {initials(employee)}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {employee}
                  </Typography>
                  <Chip
                    label={`${deps.length} deployment${deps.length > 1 ? 's' : ''}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Environment', 'Status', 'Date', 'Time', 'Effort', 'Description'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>
                            {h}
                          </TableCell>
                        ))}
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deps.map((dep) => {
                        const cfg = statusConfig[dep.status];
                        return (
                          <TableRow key={dep.id} hover>
                            <TableCell>
                              <Chip
                                label={dep.environment}
                                size="small"
                                variant="outlined"
                                color={dep.environment === 'production' ? 'error' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={cfg.label}
                                size="small"
                                sx={{ bgcolor: cfg.bg, color: cfg.text, fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{dep.date}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {dep.time}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dep.hours != null ? `${dep.hours}h` : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 300 }}>
                              <Typography variant="caption" color="text.secondary">
                                {dep.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {canEditDeployment(dep) && (
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => openEdit(dep)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ));
          })()}
          {completed.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No completed deployments yet</Typography>
            </Paper>
          )}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Deployment' : tab === 0 ? 'Schedule Deployment' : 'Log Deployment'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select
                value={form.environment}
                label="Environment"
                onChange={(e) =>
                  setForm((f) => ({ ...f, environment: e.target.value as Deployment['environment'] }))
                }
              >
                <MenuItem value="production">Production</MenuItem>
                <MenuItem value="stage/UAT">Stage/UAT</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: today }}
                fullWidth
              />
              <TextField
                label="Time"
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth required>
                <InputLabel required>Deployed By</InputLabel>
                <Select
                  value={form.deployedBy}
                  label="Deployed By"
                  onChange={(e) => setForm((f) => ({ ...f, deployedBy: e.target.value }))}
                >
                  {developerProfiles.map((d) => (
                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DeploymentStatus }))}
                >
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="What is being deployed? Any risks, steps, or notes for the team?"
              required
              error={form.description.length > 0 && !form.description.trim()}
              helperText={form.description.length > 0 && !form.description.trim() ? 'Description cannot be only spaces' : ''}
            />
            <TextField
              label="Short Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              fullWidth
              size="small"
              placeholder="e.g. Sprint 12 release"
            />
            <TextField
              label="Effort (hours, optional)"
              type="number"
              value={form.hours ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value ? Number(e.target.value) : undefined }))}
              size="small"
              inputProps={{ min: 0, step: 0.5 }}
              helperText="Include monitoring, fixes, pipeline issues — leave blank if not tracked"
              fullWidth
            />
          </Stack>
        </DialogContent>
        {saveError && <Alert severity="error" sx={{ mx: 3, mb: 1 }}>{saveError}</Alert>}
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !form.deployedBy || !form.description.trim()}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

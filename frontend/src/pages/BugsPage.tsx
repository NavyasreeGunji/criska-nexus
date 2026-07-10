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
  TablePagination,
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
  Avatar,
  CircularProgress,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import Alert from '@mui/material/Alert';
import { Bug, Comment, bugs as initialBugs, BugSeverity, BugStatus } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetBugs, apiCreateBug, apiUpdateBug, apiGetComments, apiCreateComment } from '../api/api';
import TablePaginationActions, { paginationSx } from '../components/TablePaginationActions';

const severityConfig: Record<BugSeverity, { color: 'error' | 'warning' | 'default'; label: string }> = {
  critical: { color: 'error',   label: 'Critical' },
  high:     { color: 'warning', label: 'High' },
  medium:   { color: 'default', label: 'Medium' },
  low:      { color: 'default', label: 'Low' },
};

const statusConfig: Record<BugStatus, { color: 'error' | 'primary' | 'success' | 'default'; label: string }> = {
  open:        { color: 'error',   label: 'Open' },
  in_progress: { color: 'primary', label: 'In Progress' },
  resolved:    { color: 'success', label: 'Resolved' },
  closed:      { color: 'default', label: 'Closed' },
};

const emptyForm = (): Omit<Bug, 'id'> => ({
  title: '', description: '', severity: 'medium', status: 'open',
  environment: 'production', reporter: '', assignee: '',
  createdDate: new Date().toISOString().slice(0, 10), resolvedDate: '',
});

const PRIVILEGED_ROLES = ['Admin', 'Manager', 'Associate Manager', 'Delivery Manager', 'Technical Manager', 'HR'];

// ─── Comments section ─────────────────────────────────────────────────────────

function CommentsSection({ entityId, currentUserName, backendOnline }: {
  entityId: string;
  currentUserName: string;
  backendOnline: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!backendOnline || !entityId) return;
    setLoading(true);
    apiGetComments('bug', entityId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [entityId, backendOnline]);

  const handlePost = async () => {
    if (!newComment.trim() || !backendOnline) return;
    setPosting(true);
    try {
      const created = await apiCreateComment('bug', entityId, currentUserName, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch {
    } finally {
      setPosting(false);
    }
  };

  if (!backendOnline) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Comments {comments.length > 0 && `(${comments.length})`}
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {comments.length === 0 && (
            <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
          )}
          {comments.map((c) => (
            <Box key={c.id} sx={{ display: 'flex', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: 'error.main', flexShrink: 0 }}>
                {c.author.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                  <Typography variant="caption" fontWeight={700}>{c.author}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{c.content}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField value={newComment} onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment…" multiline maxRows={4} size="small" fullWidth
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(); }} />
        <IconButton color="error" onClick={handlePost} disabled={!newComment.trim() || posting}
          size="small" sx={{ alignSelf: 'flex-end', mb: 0.25 }}>
          {posting ? <CircularProgress size={18} /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Stack>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BugsPage() {
  const { developerProfiles, backendOnline, backendChecked, currentUser } = useApp();

  const canEditBug = (bug: Bug) =>
    !!currentUser && (PRIVILEGED_ROLES.includes(currentUser.role) || currentUser.name === bug.reporter);

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
  const [viewBug, setViewBug] = useState<Bug | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = bugs
    .filter((b) => filterStatus === 'all' || b.status === filterStatus)
    .filter((b) => filterSeverity === 'all' || b.severity === filterSeverity)
    .filter((b) => filterEnv === 'all' || b.environment === filterEnv);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const openAdd = () => { setForm(emptyForm()); setEditTarget(null); setSaveError(''); setDialogOpen(true); };

  const openEdit = (b: Bug) => { setForm({ ...b }); setEditTarget(b); setSaveError(''); setDialogOpen(true); };

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
          const created = await apiCreateBug({ ...trimmedForm, createdBy: currentUser?.name ?? '' });
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
          <Select value={filterStatus} label="Status" onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
            <MenuItem value="all">All</MenuItem>
            {Object.entries(statusConfig).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Severity</InputLabel>
          <Select value={filterSeverity} label="Severity" onChange={(e) => { setFilterSeverity(e.target.value); setPage(0); }}>
            <MenuItem value="all">All</MenuItem>
            {Object.entries(severityConfig).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Environment</InputLabel>
          <Select value={filterEnv} label="Environment" onChange={(e) => { setFilterEnv(e.target.value); setPage(0); }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="production">Production</MenuItem>
            <MenuItem value="stage/UAT">Stage/UAT</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} {filtered.length === 1 ? 'bug' : 'bugs'}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={openAdd}>
          Report Bug
        </Button>
      </Stack>

      <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              {['ID', 'Title', 'Severity', 'Status', 'Environment', 'Reporter', 'Assignee', 'Created', 'Resolved', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 14, color: 'text.secondary' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No bugs found</Typography>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((bug) => (
              <TableRow key={bug.id} hover>
                <TableCell>
                  <Typography variant="caption" color="text.disabled" fontWeight={600}>{bug.id}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 220, overflow: 'hidden' }}>
                  <Typography variant="body2" fontWeight={500} noWrap
                    sx={{ cursor: 'pointer', '&:hover': { color: 'error.main', textDecoration: 'underline' } }}
                    onClick={() => setViewBug(bug)}>
                    {bug.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={severityConfig[bug.severity].label} size="small" color={severityConfig[bug.severity].color} />
                </TableCell>
                <TableCell>
                  <Chip label={statusConfig[bug.status].label} size="small" color={statusConfig[bug.status].color} />
                </TableCell>
                <TableCell>
                  <Chip label={bug.environment} size="small" variant="outlined" color={bug.environment === 'production' ? 'error' : 'default'} />
                </TableCell>
                <TableCell><Typography variant="body2">{bug.reporter}</Typography></TableCell>
                <TableCell><Typography variant="body2">{bug.assignee}</Typography></TableCell>
                <TableCell><Typography variant="caption">{bug.createdDate}</Typography></TableCell>
                <TableCell><Typography variant="caption">{bug.resolvedDate || '—'}</Typography></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => setViewBug(bug)}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {canEditBug(bug) && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(bug)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
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

      {/* Report/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Bug' : 'Report Bug'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth size="small" required
              error={form.title.length > 0 && !form.title.trim()}
              helperText={form.title.length > 0 && !form.title.trim() ? 'Title cannot be only spaces' : ''} />
            <TextField label="Description" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth size="small" multiline rows={3} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select value={form.severity} label="Severity"
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as BugSeverity }))}>
                  {Object.entries(severityConfig).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status"
                  onChange={(e) => {
                    const newStatus = e.target.value as BugStatus;
                    setForm((f) => ({
                      ...f, status: newStatus,
                      resolvedDate: (newStatus === 'resolved' || newStatus === 'closed')
                        ? (f.resolvedDate || new Date().toISOString().slice(0, 10))
                        : f.resolvedDate,
                    }));
                  }}>
                  {Object.entries(statusConfig).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select value={form.environment} label="Environment"
                onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value as Bug['environment'] }))}>
                <MenuItem value="production">Production</MenuItem>
                <MenuItem value="stage/UAT">Stage/UAT</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField label="Reporter" value={form.reporter}
                onChange={(e) => setForm((f) => ({ ...f, reporter: e.target.value }))}
                size="small" fullWidth placeholder="Client or team member name" required
                error={form.reporter.length > 0 && !form.reporter.trim()}
                helperText={form.reporter.length > 0 && !form.reporter.trim() ? 'Reporter cannot be only spaces' : ''} />
              <FormControl size="small" fullWidth required>
                <InputLabel required>Assignee</InputLabel>
                <Select value={form.assignee} label="Assignee"
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}>
                  {developerProfiles.map((d) => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Created Date" type="date" value={form.createdDate}
                onChange={(e) => setForm((f) => ({ ...f, createdDate: e.target.value }))}
                size="small" InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Resolved Date" type="date" value={form.resolvedDate}
                onChange={(e) => setForm((f) => ({ ...f, resolvedDate: e.target.value }))}
                size="small" InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
          </Stack>
        </DialogContent>
        {saveError && <Alert severity="error" sx={{ mx: 3, mb: 1 }}>{saveError}</Alert>}
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSave}
            disabled={isSaving || !form.title.trim() || !form.reporter.trim() || !form.assignee}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Bug dialog with comments */}
      {viewBug && (
        <Dialog open={!!viewBug} onClose={() => setViewBug(null)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={600} display="block">{viewBug.id}</Typography>
                <Typography variant="h6" fontWeight={700}>{viewBug.title}</Typography>
              </Box>
              <Stack direction="row" spacing={0.75} flexShrink={0}>
                <Chip label={severityConfig[viewBug.severity].label} size="small" color={severityConfig[viewBug.severity].color} />
                <Chip label={statusConfig[viewBug.status].label} size="small" color={statusConfig[viewBug.status].color} />
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              {viewBug.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>Description</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }}>{viewBug.description}</Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Environment</Typography>
                  <Chip label={viewBug.environment} size="small" variant="outlined"
                    color={viewBug.environment === 'production' ? 'error' : 'default'} sx={{ mt: 0.5 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Reporter</Typography>
                  <Typography variant="body2">{viewBug.reporter || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Assignee</Typography>
                  <Typography variant="body2">{viewBug.assignee || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Created</Typography>
                  <Typography variant="body2">{viewBug.createdDate || '—'}</Typography>
                </Box>
                {viewBug.resolvedDate && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Resolved</Typography>
                    <Typography variant="body2">{viewBug.resolvedDate}</Typography>
                  </Box>
                )}
              </Box>

              <CommentsSection
                entityId={viewBug.id}
                currentUserName={currentUser?.name ?? 'Unknown'}
                backendOnline={backendOnline}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewBug(null)}>Close</Button>
            {canEditBug(viewBug) && (
              <Button variant="contained" color="error" onClick={() => { setViewBug(null); openEdit(viewBug); }}>Edit</Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

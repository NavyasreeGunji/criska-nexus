import { useState, useMemo, useEffect } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Story, initialStories, StoryStatus } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetStories, apiCreateStory, apiUpdateStory } from '../api/api';

const statusOptions: { value: StoryStatus; label: string; color: 'default' | 'primary' | 'warning' | 'success' | 'secondary' }[] = [
  { value: 'backlog',        label: 'Backlog',           color: 'default' },
  { value: 'to_do',         label: 'To Do',             color: 'default' },
  { value: 'in_progress',   label: 'In Progress',       color: 'primary' },
  { value: 'in_review',     label: 'In Review',         color: 'warning' },
  { value: 'for_qe_testing',label: 'Review / Testing',  color: 'secondary' },
  { value: 'done',          label: 'Done',              color: 'success' },
  { value: 'on_hold',       label: 'On Hold',           color: 'secondary' },
];

const statusColor = (s: StoryStatus) => statusOptions.find((o) => o.value === s)?.color ?? 'default';
const statusLabel = (s: StoryStatus) => statusOptions.find((o) => o.value === s)?.label ?? s;
const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}-${m}-${y.slice(2)}`;
};

const fmtDateFull = (d?: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}-${m}-${y}`;
};

function getMonthKey(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[0]}-${parts[1]}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonth(key: string) {
  if (!key) return '';
  const parts = key.split('-');
  return `${MONTH_NAMES[Number(parts[1]) - 1]} ${parts[0]}`;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (teamId = '', sprintId = ''): Omit<Story, 'id'> => ({
  storyNumber: '',
  title: '',
  description: '',
  points: 3,
  status: 'backlog',
  reporter: '',
  assignee: '',
  createdDate: today(),
  dueDate: '',
  startedDate: '',
  completedDate: '',
  teamId,
  sprintId,
});

const PRIVILEGED_ROLES = ['Admin', 'Manager', 'Associate Manager', 'Delivery Manager', 'Technical Manager', 'HR'];

export default function StoriesPage() {
  const { teams, sprints, developerProfiles, backendOnline, backendChecked, currentUser } = useApp();

  const canEditStory = (story: Story) =>
    !!currentUser && (
      PRIVILEGED_ROLES.includes(currentUser.role) ||
      currentUser.name === story.reporter ||
      currentUser.name === story.assignee
    );
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    if (!backendChecked) return;
    if (backendOnline) {
      apiGetStories().then(setStories).catch(() => setStories(initialStories));
    } else {
      setStories(initialStories);
    }
  }, [backendChecked, backendOnline]);
  const [viewBy, setViewBy] = useState<'sprint' | 'month'>('sprint');

  // Sprint view state
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState('');

  // Auto-select first team once teams load (keep 'all' if user already chose it)
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId('all');
    }
  }, [teams]);

  // Month view state — default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Story | null>(null);
  const [form, setForm] = useState<Omit<Story, 'id'>>(emptyForm());
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewStory, setViewStory] = useState<Story | null>(null);

  const teamSprints = useMemo(
    () => selectedTeamId === 'all'
      ? []
      : sprints
          .filter((s) => s.teamId === selectedTeamId)
          .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [sprints, selectedTeamId]
  );

  // Auto-select active sprint when team changes (prefer active → planned → most recent)
  const resolvedSprintId = useMemo(() => {
    if (selectedTeamId === 'all') return '';
    if (selectedSprintId && teamSprints.find((s) => s.id === selectedSprintId)) return selectedSprintId;
    const active = teamSprints.find((s) => s.status === 'active');
    if (active) return active.id;
    const planned = teamSprints.find((s) => s.status === 'planned');
    if (planned) return planned.id;
    return teamSprints[teamSprints.length - 1]?.id ?? '';
  }, [selectedSprintId, teamSprints, selectedTeamId]);

  // Always generate 12 months (last 12 from today)
  const yearMonths = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }, []);

  const baseFiltered = useMemo(() => {
    if (viewBy === 'sprint') {
      if (selectedTeamId === 'all') return stories;
      return stories.filter((s) => s.teamId === selectedTeamId && s.sprintId === resolvedSprintId);
    }
    return stories.filter((s) => getMonthKey(s.createdDate) === selectedMonth);
  }, [stories, viewBy, selectedTeamId, resolvedSprintId, selectedMonth]);

  const filtered = useMemo(
    () =>
      baseFiltered
        .filter((s) => filterStatus === 'all' || s.status === filterStatus)
        .filter((s) => filterAssignee === 'all' || s.assignee === filterAssignee)
        .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? '')),
    [baseFiltered, filterStatus, filterAssignee]
  );

  const summary = useMemo(() => {
    const pts = (status: StoryStatus) =>
      baseFiltered.filter((s) => s.status === status).reduce((sum, s) => sum + s.points, 0);
    const cnt = (status: StoryStatus) => baseFiltered.filter((s) => s.status === status).length;
    const total = baseFiltered.reduce((sum, s) => sum + s.points, 0);
    return {
      total,
      done: pts('done'), doneCount: cnt('done'),
      inReview: pts('in_review'), inReviewCount: cnt('in_review'),
      inProgress: pts('in_progress'), inProgressCount: cnt('in_progress'),
      forQE: pts('for_qe_testing'), forQECount: cnt('for_qe_testing'),
      toDo: pts('to_do'), toDoCount: cnt('to_do'),
      backlog: pts('backlog'), backlogCount: cnt('backlog'),
      onHold: pts('on_hold'), onHoldCount: cnt('on_hold'),
    };
  }, [baseFiltered]);

  const completionPct = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  const selectedSprint = sprints.find((s) => s.id === resolvedSprintId);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const openAdd = () => {
    const teamId = viewBy === 'sprint' && selectedTeamId !== 'all' ? selectedTeamId : '';
    const sprintId = viewBy === 'sprint' && selectedTeamId !== 'all' ? resolvedSprintId : '';
    setForm(emptyForm(teamId, sprintId));
    setEditTarget(null);
    setSaveError('');
    setDialogOpen(true);
  };

  const openEdit = (s: Story) => { setForm({ ...s }); setEditTarget(s); setSaveError(''); setDialogOpen(true); };

  const handleSave = async () => {
    setSaveError('');
    const trimmedForm = { ...form, title: form.title.trim(), reporter: form.reporter.trim() };
    setForm(trimmedForm);
    setIsSaving(true);
    try {
      if (backendOnline) {
        if (editTarget) {
          const updated = await apiUpdateStory(editTarget.id, trimmedForm);
          setStories((prev) => prev.map((s) => (s.id === editTarget.id ? updated : s)));
        } else {
          const created = await apiCreateStory(trimmedForm);
          setStories((prev) => [...prev, created]);
        }
      } else {
        if (editTarget) {
          setStories((prev) => prev.map((s) => (s.id === editTarget.id ? { ...trimmedForm, id: editTarget.id } : s)));
        } else {
          const newId = `S-${String(stories.length + 1).padStart(3, '0')}`;
          setStories((prev) => [...prev, { ...trimmedForm, id: newId }]);
        }
      }
      setDialogOpen(false);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Save failed. Check the backend is running and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const viewLabel = viewBy === 'sprint'
    ? `${selectedTeam?.name ?? ''} · ${selectedSprint?.name ?? ''}`
    : formatMonth(selectedMonth);

  return (
    <Box>
      {/* View toggle */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={viewBy}
          exclusive
          onChange={(_, v) => v && setViewBy(v)}
          size="small"
        >
          <ToggleButton value="sprint" sx={{ gap: 0.75, px: 2 }}>
            <SpeedIcon fontSize="small" /> Sprint
          </ToggleButton>
          <ToggleButton value="month" sx={{ gap: 0.75, px: 2 }}>
            <CalendarMonthIcon fontSize="small" /> Monthly
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          disabled={teams.length === 0 || viewBy === 'month' || selectedSprint?.status === 'completed'}>
          Add Story
        </Button>
      </Stack>

      {teams.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No teams found. Go to <strong>Teams</strong> to create a team and add sprints first.
        </Alert>
      )}

      {/* Sprint goal banner */}
      {viewBy === 'sprint' && selectedSprint?.goal && (
        <Paper variant="outlined" sx={{ px: 2, py: 1.25, mb: 2, bgcolor: '#F8FAFC' }}>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <strong>Sprint Goal:</strong> {selectedSprint.goal}
            <Chip
              label={`${selectedSprint.startDate} → ${selectedSprint.endDate}`}
              size="small"
              variant="outlined"
              sx={{ ml: 1.5 }}
            />
          </Typography>
        </Paper>
      )}

      {/* Summary bar */}
      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>{viewLabel}</Typography>
          <Typography variant="body2" color="text.secondary">
            {baseFiltered.length} stories · {summary.total} pts
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Completion</Typography>
          <Typography variant="caption" fontWeight={700} color="success.main">{completionPct}%</Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={completionPct}
          sx={{ height: 8, borderRadius: 4, bgcolor: '#E2E8F0', mb: 2, '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#16a34a' } }}
        />

        <Grid container spacing={1.5}>
          {[
            { label: 'Done',           pts: summary.done,      count: summary.doneCount,    color: '#16a34a', bg: '#dcfce7', key: 'done'           as StoryStatus },
            { label: 'Review / Testing', pts: summary.forQE,    count: summary.forQECount,   color: '#0891b2', bg: '#e0f2fe', key: 'for_qe_testing' as StoryStatus },
            { label: 'In Progress',    pts: summary.inProgress, count: summary.inProgressCount, color: '#2563EB', bg: '#dbeafe', key: 'in_progress' as StoryStatus },
            { label: 'On Hold',        pts: summary.onHold,    count: summary.onHoldCount,  color: '#ea580c', bg: '#ffedd5', key: 'on_hold'        as StoryStatus },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Box
                sx={{
                  p: 1.5, borderRadius: 2, bgcolor: stat.bg, textAlign: 'center', cursor: 'pointer',
                  border: filterStatus === stat.key ? `2px solid ${stat.color}` : '2px solid transparent',
                }}
                onClick={() => setFilterStatus(filterStatus === stat.key ? 'all' : stat.key)}
              >
                <Typography variant="h6" fontWeight={800} sx={{ color: stat.color }}>{stat.pts}</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ color: stat.color }}>{stat.label}</Typography>
                <Typography variant="caption" display="block" sx={{ color: stat.color, opacity: 0.75 }}>
                  {stat.count} {stat.count === 1 ? 'story' : 'stories'}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        {/* Sprint view: team + sprint chips */}
        {viewBy === 'sprint' && (
          <>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Team</InputLabel>
              <Select
                value={selectedTeamId}
                label="Team"
                onChange={(e) => { setSelectedTeamId(e.target.value); setSelectedSprintId(''); }}
              >
                <MenuItem value="all">All Teams</MenuItem>
                {teams.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Select>
            </FormControl>
            {selectedTeamId !== 'all' && (
              teamSprints.length === 0
                ? <Typography variant="body2" color="text.secondary">No sprints — add one in Teams</Typography>
                : <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {teamSprints.map((sp) => {
                      const isActive = sp.id === resolvedSprintId;
                      const isCompleted = sp.status === 'completed';
                      return (
                        <Chip
                          key={sp.id}
                          label={`${sp.name}${sp.status === 'active' ? ' 🟢' : isCompleted ? ' ✓' : ''}`}
                          onClick={() => setSelectedSprintId(sp.id)}
                          color={isActive ? 'primary' : 'default'}
                          variant={isActive ? 'filled' : 'outlined'}
                          sx={{ fontWeight: isActive ? 700 : 400, cursor: 'pointer', opacity: isCompleted ? 0.65 : 1 }}
                        />
                      );
                    })}
                  </Stack>
            )}
          </>
        )}

        {/* Month view: full 12-month selector */}
        {viewBy === 'month' && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Select Month</InputLabel>
            <Select value={selectedMonth} label="Select Month" onChange={(e) => setSelectedMonth(e.target.value)}>
              {yearMonths.map((m) => <MenuItem key={m} value={m}>{formatMonth(m)}</MenuItem>)}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All Statuses</MenuItem>
            {statusOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Assignee</InputLabel>
          <Select value={filterAssignee} label="Assignee" onChange={(e) => setFilterAssignee(e.target.value)}>
            <MenuItem value="all">All Assignees</MenuItem>
            {developerProfiles.map((d) => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary">
          Showing {filtered.length} of {baseFiltered.length} stories
        </Typography>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              {['Story No.', 'Title', 'Points', 'Status', 'Reporter', 'Assignee', 'Due Date', 'Started', 'Completed', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No stories found</Typography>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((story) => (
              <TableRow key={story.id} hover>
                <TableCell>
                  <Typography variant="caption" color="primary" fontWeight={700}>{story.storyNumber || '—'}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 220, overflow: 'hidden' }}>
                  <Typography
                    variant="body2" fontWeight={500}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    onClick={() => setViewStory(story)}
                  >
                    {story.title}
                  </Typography>
                </TableCell>
                <TableCell><Chip label={story.points} size="small" color="primary" variant="outlined" /></TableCell>
                <TableCell><Chip label={statusLabel(story.status)} size="small" color={statusColor(story.status)} /></TableCell>
                <TableCell><Typography variant="body2">{story.reporter}</Typography></TableCell>
                <TableCell><Typography variant="body2">{story.assignee}</Typography></TableCell>
                <TableCell>
                  {story.dueDate ? (() => {
                    const today = new Date().toISOString().slice(0, 10);
                    const overdue = story.dueDate < today && !story.completedDate;
                    return (
                      <Typography variant="caption" sx={{ fontWeight: overdue ? 700 : 400, color: overdue ? '#dc2626' : 'text.secondary' }}>
                        {fmtDate(story.dueDate)}
                      </Typography>
                    );
                  })() : <Typography variant="caption" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell><Typography variant="caption">{fmtDate(story.startedDate)}</Typography></TableCell>
                <TableCell><Typography variant="caption">{fmtDate(story.completedDate)}</Typography></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => setViewStory(story)}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {canEditStory(story) && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(story)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Story' : 'Add Story'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Story Number" value={form.storyNumber}
              onChange={(e) => setForm((f) => ({ ...f, storyNumber: e.target.value }))}
              fullWidth size="small" required
              placeholder="e.g. US-101"
              error={
                (form.storyNumber.length > 0 && !form.storyNumber.trim()) ||
                (!!form.storyNumber.trim() && stories.some(
                  (s) => s.storyNumber === form.storyNumber.trim() && s.id !== editTarget?.id
                ))
              }
              helperText={
                form.storyNumber.length > 0 && !form.storyNumber.trim()
                  ? 'Story number cannot be only spaces'
                  : !!form.storyNumber.trim() && stories.some(
                      (s) => s.storyNumber === form.storyNumber.trim() && s.id !== editTarget?.id
                    )
                  ? 'This story number already exists'
                  : ''
              }
            />
            <TextField
              label="Title" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth size="small" required
              error={form.title.length > 0 && !form.title.trim()}
              helperText={form.title.length > 0 && !form.title.trim() ? 'Title cannot be only spaces' : ''}
            />
            <TextField label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} fullWidth size="small" multiline rows={2} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Story Points" type="number" value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                size="small" sx={{ width: 130 }} inputProps={{ min: 1, max: 100 }} />
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={(e) => {
                  const newStatus = e.target.value as StoryStatus;
                  setForm((f) => ({
                    ...f,
                    status: newStatus,
                    startedDate: newStatus === 'in_progress'
                      ? (f.startedDate || today())
                      : f.startedDate,
                    completedDate: newStatus === 'done'
                      ? (f.completedDate || today())
                      : f.completedDate,
                  }));
                }}>
                  {statusOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth required>
                <InputLabel required>Team</InputLabel>
                <Select value={form.teamId} label="Team" onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value, sprintId: '' }))}>
                  {teams.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth required>
                <InputLabel required>Sprint</InputLabel>
                <Select value={form.sprintId} label="Sprint" onChange={(e) => setForm((f) => ({ ...f, sprintId: e.target.value }))}>
                  {sprints.filter((s) => s.teamId === form.teamId && s.status !== 'completed').map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                <Select value={form.assignee} label="Assignee" onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}>
                  {developerProfiles.map((d) => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Created Date" type="date" value={form.createdDate} size="small" InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} fullWidth />
              <TextField label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Started Date" type="date" value={form.startedDate} onChange={(e) => setForm((f) => ({ ...f, startedDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Completed Date" type="date" value={form.completedDate} onChange={(e) => setForm((f) => ({ ...f, completedDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
          </Stack>
        </DialogContent>
        {saveError && (
          <Alert severity="error" sx={{ mx: 3, mb: 1 }}>{saveError}</Alert>
        )}
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={
            isSaving ||
            !form.storyNumber.trim() ||
            !form.title.trim() ||
            !form.reporter.trim() ||
            !form.assignee ||
            !form.teamId ||
            !form.sprintId ||
            stories.some((s) => s.storyNumber === form.storyNumber.trim() && s.id !== editTarget?.id)
          }>{isSaving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Story Dialog */}
      {viewStory && (() => {
        const vs = viewStory;
        const sprint = sprints.find((s) => s.id === vs.sprintId);
        const team = teams.find((t) => t.id === vs.teamId);
        const today = new Date().toISOString().slice(0, 10);
        const overdue = vs.dueDate && vs.dueDate < today && !vs.completedDate;
        return (
          <Dialog open={!!viewStory} onClose={() => setViewStory(null)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Box>
                  {vs.storyNumber && (
                    <Typography variant="caption" color="primary" fontWeight={700} display="block">{vs.storyNumber}</Typography>
                  )}
                  <Typography variant="h6" fontWeight={700}>{vs.title}</Typography>
                </Box>
                <Chip label={statusLabel(vs.status)} size="small" color={statusColor(vs.status)} />
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 0.5 }}>
                {vs.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>Description</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }}>{vs.description}</Typography>
                  </Box>
                )}

                <Divider />

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Points</Typography>
                    <Typography variant="body2" fontWeight={600}>{vs.points}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Team</Typography>
                    <Typography variant="body2">{team?.name ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Sprint</Typography>
                    <Typography variant="body2">{sprint?.name ?? '—'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Reporter</Typography>
                    <Typography variant="body2">{vs.reporter || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Assignee</Typography>
                    <Typography variant="body2">{vs.assignee || '—'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Created</Typography>
                    <Typography variant="body2">{fmtDateFull(vs.createdDate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Due Date</Typography>
                    <Typography variant="body2" sx={{ color: overdue ? '#dc2626' : 'inherit', fontWeight: overdue ? 700 : 400 }}>
                      {fmtDateFull(vs.dueDate)}{overdue ? ' ⚠' : ''}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Started</Typography>
                    <Typography variant="body2">{fmtDateFull(vs.startedDate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Completed</Typography>
                    <Typography variant="body2">{fmtDateFull(vs.completedDate)}</Typography>
                  </Box>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewStory(null)}>Close</Button>
              {canEditStory(vs) && (
                <Button variant="contained" onClick={() => { setViewStory(null); openEdit(vs); }}>Edit</Button>
              )}
            </DialogActions>
          </Dialog>
        );
      })()}
    </Box>
  );
}

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
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  LinearProgress,
  Alert,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import SendIcon from '@mui/icons-material/Send';
import { Story, Comment, initialStories, StoryStatus, StoryPriority } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetStories, apiCreateStory, apiUpdateStory, apiGetComments, apiCreateComment } from '../api/api';
import TablePaginationActions, { paginationSx } from '../components/TablePaginationActions';

const statusOptions: { value: StoryStatus; label: string; color: 'default' | 'primary' | 'warning' | 'success' | 'secondary' }[] = [
  { value: 'backlog',         label: 'Backlog',          color: 'default' },
  { value: 'to_do',          label: 'To Do',            color: 'default' },
  { value: 'in_progress',    label: 'In Progress',      color: 'primary' },
  { value: 'in_review',      label: 'In Review',        color: 'warning' },
  { value: 'for_qe_testing', label: 'Review / Testing', color: 'secondary' },
  { value: 'done',           label: 'Done',             color: 'success' },
  { value: 'on_hold',        label: 'On Hold',          color: 'secondary' },
];

const priorityConfig: Record<StoryPriority, { label: string; color: 'error' | 'warning' | 'info' | 'default' }> = {
  critical: { label: 'Critical', color: 'error' },
  high:     { label: 'High',     color: 'warning' },
  medium:   { label: 'Medium',   color: 'info' },
  low:      { label: 'Low',      color: 'default' },
};

const priorityOrder: StoryPriority[] = ['critical', 'high', 'medium', 'low'];

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
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function formatMonth(key: string) {
  if (!key) return '';
  const parts = key.split('-');
  return `${MONTH_NAMES[Number(parts[1]) - 1]} ${parts[0]}`;
}
const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (teamId = '', sprintId = ''): Omit<Story, 'id'> => ({
  storyNumber: '', title: '', description: '', points: 3,
  status: 'backlog', priority: 'medium',
  reporter: '', assignee: '',
  createdDate: today(), dueDate: '', startedDate: '', completedDate: '',
  teamId, sprintId,
});

const PRIVILEGED_ROLES = ['Admin', 'Manager', 'Associate Manager', 'Delivery Manager', 'Technical Manager', 'HR'];

// ─── Kanban board ─────────────────────────────────────────────────────────────

const KANBAN_COLUMNS: { status: StoryStatus; label: string; color: string }[] = [
  { status: 'backlog',         label: 'Backlog',     color: '#94a3b8' },
  { status: 'to_do',          label: 'To Do',       color: '#64748b' },
  { status: 'in_progress',    label: 'In Progress', color: '#2563EB' },
  { status: 'in_review',      label: 'In Review',   color: '#d97706' },
  { status: 'for_qe_testing', label: 'QA Testing',  color: '#7C3AED' },
  { status: 'done',           label: 'Done',        color: '#16a34a' },
  { status: 'on_hold',        label: 'On Hold',     color: '#ea580c' },
];

function KanbanBoard({
  stories,
  onStatusChange,
  canEdit,
  onView,
}: {
  stories: Story[];
  onStatusChange: (story: Story, newStatus: StoryStatus) => void;
  canEdit: (s: Story) => boolean;
  onView: (s: Story) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<StoryStatus | null>(null);
  const draggingStory = stories.find((s) => s.id === draggingId);

  return (
    <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, pt: 0.5, minHeight: 420 }}>
      {KANBAN_COLUMNS.map((col) => {
        const colStories = stories.filter((s) => s.status === col.status);
        const isOver = overColumn === col.status;
        return (
          <Box
            key={col.status}
            sx={{ minWidth: 200, flex: '0 0 200px' }}
            onDragOver={(e) => { e.preventDefault(); setOverColumn(col.status); }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={() => {
              if (draggingStory && draggingStory.status !== col.status && canEdit(draggingStory)) {
                onStatusChange(draggingStory, col.status);
              }
              setDraggingId(null);
              setOverColumn(null);
            }}
          >
            <Box sx={{
              px: 1.5, py: 1, mb: 1.5, borderRadius: 2,
              bgcolor: isOver ? col.color + '22' : col.color + '14',
              borderTop: `3px solid ${col.color}`,
              transition: 'background 0.15s',
            }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: col.color }}>
                {col.label}
              </Typography>
              <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                {colStories.length}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {colStories.map((story) => (
                <Paper
                  key={story.id}
                  elevation={draggingId === story.id ? 6 : 1}
                  draggable={canEdit(story)}
                  onDragStart={() => setDraggingId(story.id)}
                  onDragEnd={() => { setDraggingId(null); setOverColumn(null); }}
                  sx={{
                    p: 1.5,
                    cursor: canEdit(story) ? 'grab' : 'default',
                    opacity: draggingId === story.id ? 0.45 : 1,
                    '&:hover': { boxShadow: 3 },
                    transition: 'box-shadow 0.15s, opacity 0.15s',
                    borderLeft: story.priority
                      ? `3px solid ${story.priority === 'critical' ? '#dc2626' : story.priority === 'high' ? '#d97706' : story.priority === 'medium' ? '#2563EB' : '#94a3b8'}`
                      : undefined,
                  }}
                >
                  <Typography variant="caption" color="primary" fontWeight={700}>{story.storyNumber}</Typography>
                  <Typography
                    variant="body2" fontWeight={500}
                    sx={{ mb: 1, mt: 0.25, lineHeight: 1.4, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={() => onView(story)}
                  >
                    {story.title}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                    <Chip label={story.points + ' pts'} size="small" color="primary" variant="outlined"
                      sx={{ height: 18, fontSize: 10, '& .MuiChip-label': { px: 0.75 } }} />
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                      {story.assignee.split(' ')[0]}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
              {isOver && draggingStory && draggingStory.status !== col.status && (
                <Box sx={{
                  height: 60, border: `2px dashed ${col.color}`,
                  borderRadius: 2, opacity: 0.5,
                }} />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Comments section ─────────────────────────────────────────────────────────

function CommentsSection({ entityType, entityId, currentUserName, backendOnline }: {
  entityType: 'story' | 'bug';
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
    apiGetComments(entityType, entityId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [entityType, entityId, backendOnline]);

  const handlePost = async () => {
    if (!newComment.trim() || !backendOnline) return;
    setPosting(true);
    try {
      const created = await apiCreateComment(entityType, entityId, currentUserName, newComment.trim());
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
              <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: 'primary.main', flexShrink: 0 }}>
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
        <TextField
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          multiline
          maxRows={4}
          size="small"
          fullWidth
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(); }}
        />
        <IconButton color="primary" onClick={handlePost} disabled={!newComment.trim() || posting} size="small"
          sx={{ alignSelf: 'flex-end', mb: 0.25 }}>
          {posting ? <CircularProgress size={18} /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Stack>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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

  const [viewBy, setViewBy] = useState<'sprint' | 'kanban' | 'month'>('sprint');

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState('');

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) setSelectedTeamId('all');
  }, [teams]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Story | null>(null);
  const [form, setForm] = useState<Omit<Story, 'id'>>(emptyForm());
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewStory, setViewStory] = useState<Story | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const teamSprints = useMemo(
    () => selectedTeamId === 'all'
      ? []
      : sprints.filter((s) => s.teamId === selectedTeamId).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [sprints, selectedTeamId]
  );

  const activeTeamSprints = useMemo(() => teamSprints.filter((s) => s.status !== 'completed'), [teamSprints]);

  const resolvedSprintId = useMemo(() => {
    if (selectedTeamId === 'all') return '';
    if (selectedSprintId && teamSprints.find((s) => s.id === selectedSprintId)) return selectedSprintId;
    const active = teamSprints.find((s) => s.status === 'active');
    if (active) return active.id;
    const planned = teamSprints.find((s) => s.status === 'planned');
    if (planned) return planned.id;
    return '';
  }, [selectedSprintId, teamSprints, selectedTeamId]);

  const yearMonths = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }, []);

  const effectiveViewBy = viewBy === 'kanban' ? 'sprint' : viewBy;

  const baseFiltered = useMemo(() => {
    if (effectiveViewBy === 'sprint') {
      if (selectedTeamId === 'all') return stories;
      return stories.filter((s) => s.teamId === selectedTeamId && s.sprintId === resolvedSprintId);
    }
    return stories.filter((s) => getMonthKey(s.createdDate) === selectedMonth);
  }, [stories, effectiveViewBy, selectedTeamId, resolvedSprintId, selectedMonth]);

  const filtered = useMemo(
    () => baseFiltered
      .filter((s) => filterStatus === 'all' || s.status === filterStatus)
      .filter((s) => filterAssignee === 'all' || s.assignee === filterAssignee)
      .filter((s) => filterPriority === 'all' || (s.priority ?? 'medium') === filterPriority)
      .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? '')),
    [baseFiltered, filterStatus, filterAssignee, filterPriority]
  );

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [filterStatus, filterAssignee, filterPriority, selectedTeamId, selectedSprintId, viewBy, selectedMonth]);

  const summary = useMemo(() => {
    const pts = (status: StoryStatus) => baseFiltered.filter((s) => s.status === status).reduce((sum, s) => sum + s.points, 0);
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
    const teamId = viewBy !== 'month' && selectedTeamId !== 'all' ? selectedTeamId : '';
    const sprintId = viewBy !== 'month' && selectedTeamId !== 'all' ? resolvedSprintId : '';
    setForm({ ...emptyForm(teamId, sprintId), assignee: currentUser?.name ?? '' });
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
          const created = await apiCreateStory({ ...trimmedForm, createdBy: currentUser?.name ?? '' });
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

  const handleKanbanStatusChange = async (story: Story, newStatus: StoryStatus) => {
    const updated = { ...story, status: newStatus };
    setStories((prev) => prev.map((s) => (s.id === story.id ? updated : s)));
    if (backendOnline) {
      try {
        await apiUpdateStory(story.id, updated);
      } catch {
        setStories((prev) => prev.map((s) => (s.id === story.id ? story : s)));
      }
    }
  };

  const viewLabel = effectiveViewBy === 'sprint'
    ? `${selectedTeam?.name ?? ''} · ${selectedSprint?.name ?? ''}`
    : formatMonth(selectedMonth);

  const isSprintLike = viewBy === 'sprint' || viewBy === 'kanban';

  return (
    <Box>
      {/* View toggle */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup value={viewBy} exclusive onChange={(_, v) => v && setViewBy(v)} size="small">
          <ToggleButton value="sprint" sx={{ gap: 0.75, px: 2 }}>
            <SpeedIcon fontSize="small" /> Sprint
          </ToggleButton>
          <ToggleButton value="kanban" sx={{ gap: 0.75, px: 2 }}>
            <ViewKanbanIcon fontSize="small" /> Kanban
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
      {isSprintLike && selectedSprint?.goal && (
        <Paper variant="outlined" sx={{ px: 2, py: 1.25, mb: 2, bgcolor: 'action.hover' }}>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            <strong>Sprint Goal:</strong> {selectedSprint.goal}
            <Chip label={`${selectedSprint.startDate} → ${selectedSprint.endDate}`} size="small" variant="outlined" sx={{ ml: 1.5 }} />
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
        <LinearProgress variant="determinate" value={completionPct}
          sx={{ height: 8, borderRadius: 4, bgcolor: '#E2E8F0', mb: 2, '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#16a34a' } }} />
        <Grid container spacing={1.5}>
          {[
            { label: 'Done',             pts: summary.done,       count: summary.doneCount,       color: '#16a34a', bg: '#dcfce7', key: 'done'           as StoryStatus },
            { label: 'Review / Testing', pts: summary.forQE,      count: summary.forQECount,      color: '#0891b2', bg: '#e0f2fe', key: 'for_qe_testing' as StoryStatus },
            { label: 'In Progress',      pts: summary.inProgress, count: summary.inProgressCount, color: '#2563EB', bg: '#dbeafe', key: 'in_progress'    as StoryStatus },
            { label: 'On Hold',          pts: summary.onHold,     count: summary.onHoldCount,     color: '#ea580c', bg: '#ffedd5', key: 'on_hold'        as StoryStatus },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Box
                onClick={() => setFilterStatus(filterStatus === stat.key ? 'all' : stat.key)}
                sx={{
                  p: 1.5, borderRadius: 2, bgcolor: stat.bg, textAlign: 'center', cursor: 'pointer',
                  border: filterStatus === stat.key ? `2px solid ${stat.color}` : '2px solid transparent',
                }}
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

      {/* Filter row */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        {isSprintLike && (
          <>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Team</InputLabel>
              <Select value={selectedTeamId} label="Team"
                onChange={(e) => { setSelectedTeamId(e.target.value); setSelectedSprintId(''); }}>
                <MenuItem value="all">All Teams</MenuItem>
                {teams.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Select>
            </FormControl>
            {selectedTeamId !== 'all' && activeTeamSprints.length === 0 && (
              <Typography variant="body2" color="text.secondary">No active sprints</Typography>
            )}
            {selectedTeamId !== 'all' && activeTeamSprints.map((sp) => {
              const isSel = sp.id === resolvedSprintId && selectedSprint?.status !== 'completed';
              return (
                <Chip key={sp.id} label={`${sp.name}${sp.status === 'active' ? ' 🟢' : ''}`}
                  onClick={() => setSelectedSprintId(sp.id)}
                  color={isSel ? 'primary' : 'default'} variant={isSel ? 'filled' : 'outlined'}
                  sx={{ fontWeight: isSel ? 700 : 400, cursor: 'pointer' }} />
              );
            })}
          </>
        )}
        {viewBy === 'month' && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Select Month</InputLabel>
            <Select value={selectedMonth} label="Select Month" onChange={(e) => setSelectedMonth(e.target.value)}>
              {yearMonths.map((m) => <MenuItem key={m} value={m}>{formatMonth(m)}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        {selectedSprint?.status !== 'completed' && viewBy !== 'kanban' && (
          <>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="all">All Statuses</MenuItem>
                {statusOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Priority</InputLabel>
              <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value)}>
                <MenuItem value="all">All Priorities</MenuItem>
                {priorityOrder.map((p) => <MenuItem key={p} value={p}>{priorityConfig[p].label}</MenuItem>)}
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
          </>
        )}
      </Stack>

      {/* Kanban board */}
      {viewBy === 'kanban' && selectedTeamId !== 'all' && (
        <KanbanBoard
          stories={baseFiltered}
          onStatusChange={handleKanbanStatusChange}
          canEdit={canEditStory}
          onView={setViewStory}
        />
      )}
      {viewBy === 'kanban' && selectedTeamId === 'all' && (
        <Alert severity="info">Select a team to view the Kanban board.</Alert>
      )}

      {/* Table view */}
      {viewBy !== 'kanban' && (
        <>
          <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Story No.', 'Title', 'Priority', 'Points', 'Status', 'Reporter', 'Assignee', 'Due Date', 'Started', 'Completed', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 14, color: 'text.secondary' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No stories found</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {paginated.map((story) => {
                  const pri = story.priority ?? 'medium';
                  return (
                    <TableRow key={story.id} hover>
                      <TableCell>
                        <Typography variant="caption" color="primary" fontWeight={700}>{story.storyNumber || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight={500}
                          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                          onClick={() => setViewStory(story)}>
                          {story.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={priorityConfig[pri].label} size="small" color={priorityConfig[pri].color}
                          variant="outlined" sx={{ fontSize: 11 }} />
                      </TableCell>
                      <TableCell><Chip label={story.points} size="small" color="primary" variant="outlined" /></TableCell>
                      <TableCell><Chip label={statusLabel(story.status)} size="small" color={statusColor(story.status)} /></TableCell>
                      <TableCell><Typography variant="body2">{story.reporter}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{story.assignee}</Typography></TableCell>
                      <TableCell>
                        {story.dueDate ? (() => {
                          const td = new Date().toISOString().slice(0, 10);
                          const overdue = story.dueDate < td && !story.completedDate;
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
                  );
                })}
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
        </>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Story' : 'Add Story'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Story Number" value={form.storyNumber}
              onChange={(e) => setForm((f) => ({ ...f, storyNumber: e.target.value }))}
              fullWidth size="small" required placeholder="e.g. US-101"
              error={(form.storyNumber.length > 0 && !form.storyNumber.trim()) ||
                (!!form.storyNumber.trim() && stories.some((s) => s.storyNumber === form.storyNumber.trim() && s.id !== editTarget?.id))}
              helperText={
                form.storyNumber.length > 0 && !form.storyNumber.trim() ? 'Story number cannot be only spaces'
                  : !!form.storyNumber.trim() && stories.some((s) => s.storyNumber === form.storyNumber.trim() && s.id !== editTarget?.id) ? 'This story number already exists'
                  : ''
              } />
            <TextField label="Title" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth size="small" required
              error={form.title.length > 0 && !form.title.trim()}
              helperText={form.title.length > 0 && !form.title.trim() ? 'Title cannot be only spaces' : ''} />
            <TextField label="Description" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth size="small" multiline rows={2} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Story Points" type="number" value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                size="small" sx={{ width: 130 }} inputProps={{ min: 1, max: 100 }} />
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={(e) => {
                  const newStatus = e.target.value as StoryStatus;
                  setForm((f) => ({
                    ...f, status: newStatus,
                    startedDate: newStatus === 'in_progress' ? (f.startedDate || today()) : f.startedDate,
                    completedDate: newStatus === 'done' ? (f.completedDate || today()) : f.completedDate,
                  }));
                }}>
                  {statusOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={form.priority ?? 'medium'} label="Priority"
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as StoryPriority }))}>
                  {priorityOrder.map((p) => <MenuItem key={p} value={p}>{priorityConfig[p].label}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth required>
                <InputLabel required>Team</InputLabel>
                <Select value={form.teamId} label="Team"
                  onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value, sprintId: '' }))}>
                  {teams.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth required>
                <InputLabel required>Sprint</InputLabel>
                <Select value={form.sprintId} label="Sprint"
                  onChange={(e) => setForm((f) => ({ ...f, sprintId: e.target.value }))}>
                  {sprints.filter((s) => s.teamId === form.teamId && s.status !== 'completed').map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Created Date" type="date" value={form.createdDate} size="small"
                InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} fullWidth />
              <TextField label="Due Date" type="date" value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                size="small" InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Started Date" type="date" value={form.startedDate}
                onChange={(e) => setForm((f) => ({ ...f, startedDate: e.target.value }))}
                size="small" InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Completed Date" type="date" value={form.completedDate}
                onChange={(e) => setForm((f) => ({ ...f, completedDate: e.target.value }))}
                size="small" InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
          </Stack>
        </DialogContent>
        {saveError && <Alert severity="error" sx={{ mx: 3, mb: 1 }}>{saveError}</Alert>}
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={
            isSaving || !form.storyNumber.trim() || !form.title.trim() || !form.reporter.trim() ||
            !form.assignee || !form.teamId || !form.sprintId ||
            stories.some((s) => s.storyNumber === form.storyNumber.trim() && s.id !== editTarget?.id)
          }>{isSaving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Story dialog with comments */}
      {viewStory && (() => {
        const vs = viewStory;
        const sprint = sprints.find((s) => s.id === vs.sprintId);
        const team = teams.find((t) => t.id === vs.teamId);
        const td = new Date().toISOString().slice(0, 10);
        const overdue = vs.dueDate && vs.dueDate < td && !vs.completedDate;
        const pri = vs.priority ?? 'medium';
        return (
          <Dialog open={!!viewStory} onClose={() => setViewStory(null)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Box>
                  {vs.storyNumber && <Typography variant="caption" color="primary" fontWeight={700} display="block">{vs.storyNumber}</Typography>}
                  <Typography variant="h6" fontWeight={700}>{vs.title}</Typography>
                </Box>
                <Stack direction="row" spacing={0.75}>
                  <Chip label={priorityConfig[pri].label} size="small" color={priorityConfig[pri].color} variant="outlined" />
                  <Chip label={statusLabel(vs.status)} size="small" color={statusColor(vs.status)} />
                </Stack>
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

                <CommentsSection
                  entityType="story"
                  entityId={vs.id}
                  currentUserName={currentUser?.name ?? 'Unknown'}
                  backendOnline={backendOnline}
                />
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

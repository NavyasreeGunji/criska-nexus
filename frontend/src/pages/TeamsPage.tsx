import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Chip,
  Avatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupsIcon from '@mui/icons-material/Groups';
import EditIcon from '@mui/icons-material/Edit';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useApp } from '../context/AppContext';
import { Team, Sprint, SprintStatus, Story, StoryStatus, initialStories, initialDeveloperProfiles, DeveloperProfile } from '../data/mockData';
import { apiGetDevelopers, apiGetStories } from '../api/api';

const statusColors: Record<StoryStatus, 'default' | 'primary' | 'warning' | 'success' | 'secondary'> = {
  backlog: 'default', to_do: 'default', in_progress: 'primary',
  in_review: 'warning', for_qe_testing: 'secondary', done: 'success', on_hold: 'default',
};
const statusLabels: Record<StoryStatus, string> = {
  backlog: 'Backlog', to_do: 'To Do', in_progress: 'In Progress',
  in_review: 'In Review', for_qe_testing: 'Review/Testing', done: 'Done', on_hold: 'On Hold',
};

const sprintStatusConfig: Record<SprintStatus, { color: 'default' | 'primary' | 'success'; label: string; bg: string; text: string }> = {
  planned: { color: 'default', label: 'Planned', bg: '#F1F5F9', text: '#64748b' },
  active: { color: 'primary', label: 'Active', bg: '#dbeafe', text: '#2563EB' },
  completed: { color: 'success', label: 'Completed', bg: '#dcfce7', text: '#16a34a' },
};

function SprintCard({ sprint, onEdit, storyCount, points }: {
  sprint: Sprint;
  onEdit: (s: Sprint) => void;
  storyCount: number;
  points: number;
}) {
  const cfg = sprintStatusConfig[sprint.status];
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="flex-start">
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body1" fontWeight={700}>{sprint.name}</Typography>
            <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.text, fontWeight: 600, fontSize: 11 }} />
            {storyCount > 0 && (
              <Chip label={`${storyCount} stories · ${points} pts`} size="small" variant="outlined" color="primary" />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {sprint.startDate} → {sprint.endDate}
          </Typography>
          {sprint.goal && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              Goal: {sprint.goal}
            </Typography>
          )}
        </Box>
        <Tooltip title="Edit sprint">
          <IconButton size="small" onClick={() => onEdit(sprint)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

const avatarColors = ['#2563EB', '#7C3AED', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d'];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return avatarColors[hash % avatarColors.length];
}

const emptyTeamForm = { name: '', description: '', members: [] as string[] };
const emptySprintForm = { name: '', startDate: '', endDate: '', status: 'planned' as SprintStatus, goal: '' };

export default function TeamsPage() {
  const { teams, sprints, developerProfiles, backendOnline, backendChecked, addTeam, updateTeam, addSprint, updateSprint } = useApp();
  const [allDevelopers, setAllDevelopers] = useState<DeveloperProfile[]>(developerProfiles);
  const [stories, setStories] = useState<Story[]>([]);
  const [reportSprintId, setReportSprintId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!backendChecked) return;
    if (backendOnline) {
      apiGetStories().then(setStories).catch(() => setStories(initialStories));
    } else {
      setStories(initialStories);
    }
  }, [backendChecked, backendOnline]);

  const [teamDialog, setTeamDialog] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  const [sprintDialog, setSprintDialog] = useState(false);
  const [sprintTeamId, setSprintTeamId] = useState('');
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [sprintForm, setSprintForm] = useState(emptySprintForm);
  const [isSavingSprint, setIsSavingSprint] = useState(false);
  const [sprintDateError, setSprintDateError] = useState('');
  // Always fetch fresh developer list when dialog opens so new/teamless devs appear
  useEffect(() => {
    if (!teamDialog) return;
    if (backendOnline) {
      apiGetDevelopers()
        .then(setAllDevelopers)
        .catch(() => setAllDevelopers(developerProfiles.length > 0 ? developerProfiles : initialDeveloperProfiles));
    } else {
      setAllDevelopers(developerProfiles.length > 0 ? developerProfiles : initialDeveloperProfiles);
    }
  }, [teamDialog]);

  const openAddTeam = () => {
    setTeamForm(emptyTeamForm);
    setEditTeam(null);
    setTeamDialog(true);
  };

  const openEditTeam = (t: Team) => {
    setTeamForm({ name: t.name, description: t.description, members: [...t.members] });
    setEditTeam(t);
    setTeamDialog(true);
  };

  const saveTeam = async () => {
    const trimmedTeamForm = { ...teamForm, name: teamForm.name.trim() };
    setTeamForm(trimmedTeamForm);
    setIsSavingTeam(true);
    try {
      if (editTeam) {
        await updateTeam({ ...editTeam, ...trimmedTeamForm });
      } else {
        await addTeam(trimmedTeamForm);
      }
      setTeamDialog(false);
    } finally {
      setIsSavingTeam(false);
    }
  };

  const openAddSprint = (teamId: string) => {
    setSprintForm(emptySprintForm);
    setSprintTeamId(teamId);
    setEditSprint(null);
    setSprintDateError('');
    setSprintDialog(true);
  };

  const openEditSprint = (s: Sprint) => {
    setSprintForm({ name: s.name, startDate: s.startDate, endDate: s.endDate, status: s.status, goal: s.goal });
    setSprintTeamId(s.teamId);
    setEditSprint(s);
    setSprintDateError('');
    setSprintDialog(true);
  };

  const saveSprint = async () => {
    const trimmedSprintForm = { ...sprintForm, name: sprintForm.name.trim() };
    setSprintForm(trimmedSprintForm);
    if (trimmedSprintForm.startDate && trimmedSprintForm.endDate && trimmedSprintForm.endDate <= trimmedSprintForm.startDate) {
      setSprintDateError('End date must be after start date');
      return;
    }
    setSprintDateError('');
    setIsSavingSprint(true);
    try {
      if (editSprint) {
        await updateSprint({ ...editSprint, ...trimmedSprintForm });
      } else {
        await addSprint({ teamId: sprintTeamId, ...trimmedSprintForm });
      }
      setSprintDialog(false);
    } finally {
      setIsSavingSprint(false);
    }
  };

  const toggleMember = (member: string) => {
    setTeamForm((f) => ({
      ...f,
      members: f.members.includes(member)
        ? f.members.filter((m) => m !== member)
        : [...f.members, member],
    }));
  };

  const getTeamSprints = (teamId: string) =>
    sprints.filter((s) => s.teamId === teamId).sort((a, b) => a.startDate.localeCompare(b.startDate));

  const getStoryCount = (sprintId: string) =>
    stories.filter((s) => s.sprintId === sprintId).length;

  const getPoints = (sprintId: string) =>
    stories.filter((s) => s.sprintId === sprintId).reduce((sum, s) => sum + s.points, 0);

  const initials = (name: string) => {
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddTeam}>
          Create Team
        </Button>
      </Stack>

      {teams.length === 0 && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <GroupsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No teams yet. Create your first team to get started.</Typography>
        </Paper>
      )}

      {teams.map((team) => {
        const teamSprints = getTeamSprints(team.id);
        const activeSprint = teamSprints.find((s) => s.status === 'active');
        const activePlannedSprints = teamSprints.filter((s) => s.status !== 'completed');
        const completedSprints = teamSprints.filter((s) => s.status === 'completed');
        return (
          <Accordion key={team.id} defaultExpanded sx={{ mb: 1.5, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1, mr: 2, minWidth: 0, overflow: 'hidden' }}>
                <Avatar sx={{ bgcolor: '#2563EB18', color: '#2563EB', width: 40, height: 40, flexShrink: 0 }}>
                  <GroupsIcon fontSize="small" />
                </Avatar>
                <Box sx={{ minWidth: 80, flexShrink: 1, overflow: 'hidden' }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {team.name}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ ml: 2, display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>
                  {activeSprint && (
                    <Chip
                      icon={<SpeedIcon />}
                      label={`Active: ${activeSprint.name}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ maxWidth: 200 }}
                    />
                  )}
                  <Chip label={`${teamSprints.length} sprints`} size="small" variant="outlined" />
                  <Chip label={`${team.members.length} members`} size="small" variant="outlined" />
                </Stack>
              </Stack>
              <Tooltip title="Edit team">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); openEditTeam(team); }}
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </AccordionSummary>

            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              {/* Members */}
              <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>
                  Members:
                </Typography>
                {team.members.map((m) => {
                  const color = getAvatarColor(m);
                  return (
                    <Box
                      key={m}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        border: '1px solid',
                        borderColor: `${color}50`,
                        borderRadius: 99,
                        pl: 0.5,
                        pr: 1.5,
                        py: 0.4,
                        bgcolor: `${color}12`,
                      }}
                    >
                      <Avatar sx={{ width: 22, height: 22, fontSize: 10, fontWeight: 700, bgcolor: color, color: '#fff' }}>
                        {initials(m)}
                      </Avatar>
                      <Typography variant="caption" fontWeight={600} sx={{ color, lineHeight: 1 }}>
                        {m}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Sprints */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  SPRINTS
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => openAddSprint(team.id)}>
                  Add Sprint
                </Button>
              </Stack>

              {teamSprints.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                  No sprints yet. Add your first sprint.
                </Typography>
              )}

              <Stack spacing={1.5}>
                {activePlannedSprints.map((sprint) => (
                  <SprintCard key={sprint.id} sprint={sprint} onEdit={openEditSprint}
                    storyCount={getStoryCount(sprint.id)} points={getPoints(sprint.id)} />
                ))}
              </Stack>

              {/* Sprint Report for completed sprints */}
              {completedSprints.length > 0 && (() => {
                const selectedId = reportSprintId[team.id] ?? '';
                const selectedSprint = completedSprints.find((s) => s.id === selectedId);
                const completedIssues = selectedSprint
                  ? stories.filter((s) => s.sprintId === selectedId && (s.status === 'done' || s.status === 'for_qe_testing'))
                  : [];
                const notCompletedIssues = selectedSprint
                  ? stories.filter((s) => s.spilledFromSprintId === selectedId)
                  : [];
                const completedPts = completedIssues.reduce((sum, s) => sum + s.points, 0);
                const notCompletedPts = notCompletedIssues.reduce((sum, s) => sum + s.points, 0);

                return (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: selectedSprint ? 2 : 0 }}>
                      <AssessmentIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                        SPRINT REPORT
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Select Completed Sprint</InputLabel>
                        <Select
                          value={selectedId}
                          label="Select Completed Sprint"
                          onChange={(e) => setReportSprintId((prev) => ({ ...prev, [team.id]: e.target.value }))}
                        >
                          <MenuItem value=""><em>— Select a sprint —</em></MenuItem>
                          {completedSprints.map((s) => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>

                    {selectedSprint && (
                      <Stack spacing={2}>
                        {/* Completed Issues */}
                        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                          <Box sx={{ px: 2, py: 1.25, bgcolor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 18 }} />
                            <Typography variant="body2" fontWeight={700} color="#16a34a" sx={{ flexGrow: 1 }}>
                              Completed Issues
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="#16a34a">
                              {completedPts} pts · {completedIssues.length} stories
                            </Typography>
                          </Box>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                  {['Story No.', 'Title', 'Assignee', 'Status', 'Points'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, color: '#64748b' }}>{h}</TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {completedIssues.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2 }}>
                                      <Typography variant="caption" color="text.secondary">No completed issues</Typography>
                                    </TableCell>
                                  </TableRow>
                                ) : completedIssues.map((story) => (
                                  <TableRow key={story.id} hover>
                                    <TableCell><Typography variant="caption" color="primary" fontWeight={700}>{story.storyNumber || '—'}</Typography></TableCell>
                                    <TableCell sx={{ maxWidth: 260 }}><Typography variant="body2">{story.title}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{story.assignee || '—'}</Typography></TableCell>
                                    <TableCell><Chip label={statusLabels[story.status]} size="small" color={statusColors[story.status]} /></TableCell>
                                    <TableCell align="right"><Typography variant="body2" fontWeight={700}>{story.points}</Typography></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>

                        {/* Issues Not Completed */}
                        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                          <Box sx={{ px: 2, py: 1.25, bgcolor: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ArrowForwardIcon sx={{ color: '#ea580c', fontSize: 18 }} />
                            <Typography variant="body2" fontWeight={700} color="#ea580c" sx={{ flexGrow: 1 }}>
                              Issues Not Completed
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="#ea580c">
                              {notCompletedPts} pts · {notCompletedIssues.length} stories moved to next sprint
                            </Typography>
                          </Box>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                  {['Story No.', 'Title', 'Assignee', 'Status', 'Points', 'Moved To'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, color: '#64748b' }}>{h}</TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {notCompletedIssues.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 2 }}>
                                      <Typography variant="caption" color="text.secondary">All issues were completed in this sprint</Typography>
                                    </TableCell>
                                  </TableRow>
                                ) : notCompletedIssues.map((story) => {
                                  const movedTo = sprints.find((sp) => sp.id === story.sprintId);
                                  return (
                                    <TableRow key={story.id} hover>
                                      <TableCell><Typography variant="caption" color="primary" fontWeight={700}>{story.storyNumber || '—'}</Typography></TableCell>
                                      <TableCell sx={{ maxWidth: 260 }}><Typography variant="body2">{story.title}</Typography></TableCell>
                                      <TableCell><Typography variant="body2">{story.assignee || '—'}</Typography></TableCell>
                                      <TableCell><Chip label={statusLabels[story.status]} size="small" color={statusColors[story.status]} /></TableCell>
                                      <TableCell align="right"><Typography variant="body2" fontWeight={700}>{story.points}</Typography></TableCell>
                                      <TableCell>
                                        {movedTo && (
                                          <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                            <Typography variant="caption" color="text.secondary">{movedTo.name}</Typography>
                                          </Stack>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      </Stack>
                    )}
                  </Box>
                );
              })()}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Create / Edit Team Dialog */}
      <Dialog open={teamDialog} onClose={() => setTeamDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Team Name"
              value={teamForm.name}
              onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
              placeholder="e.g. Frontend Team"
              required
            />
            <TextField
              label="Description"
              value={teamForm.description}
              onChange={(e) => setTeamForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Members
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {allDevelopers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((dev) => (
                    <Chip
                      key={dev.id}
                      label={dev.name}
                      onClick={() => toggleMember(dev.name)}
                      color={teamForm.members.includes(dev.name) ? 'primary' : 'default'}
                      variant={teamForm.members.includes(dev.name) ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveTeam} disabled={isSavingTeam || !teamForm.name.trim()}>
            {isSavingTeam ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit Sprint Dialog */}
      <Dialog open={sprintDialog} onClose={() => setSprintDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editSprint ? 'Edit Sprint' : 'Add Sprint'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Sprint Name"
                value={sprintForm.name}
                onChange={(e) => setSprintForm((f) => ({ ...f, name: e.target.value }))}
                size="small"
                fullWidth
                placeholder="e.g. Sprint 4"
                required
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={sprintForm.status}
                  label="Status"
                  onChange={(e) => setSprintForm((f) => ({ ...f, status: e.target.value as SprintStatus }))}
                >
                  <MenuItem value="planned">Planned</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                value={sprintForm.startDate}
                onChange={(e) => { setSprintForm((f) => ({ ...f, startDate: e.target.value })); setSprintDateError(''); }}
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{  }}
                sx={{ minWidth: 160 }}
                fullWidth
                required
              />
              <TextField
                label="End Date"
                type="date"
                value={sprintForm.endDate}
                onChange={(e) => { setSprintForm((f) => ({ ...f, endDate: e.target.value })); setSprintDateError(''); }}
                error={!!sprintDateError}
                helperText={sprintDateError}
                required
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Sprint Goal"
              value={sprintForm.goal}
              onChange={(e) => setSprintForm((f) => ({ ...f, goal: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="What should this sprint achieve?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSprintDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveSprint}
            disabled={isSavingSprint || !sprintForm.name.trim() || !sprintForm.startDate || !sprintForm.endDate}
          >
            {isSavingSprint ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

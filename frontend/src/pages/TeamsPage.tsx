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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupsIcon from '@mui/icons-material/Groups';
import EditIcon from '@mui/icons-material/Edit';
import SpeedIcon from '@mui/icons-material/Speed';
import { useApp } from '../context/AppContext';
import { Team, Sprint, SprintStatus, initialStories, initialDeveloperProfiles, DeveloperProfile } from '../data/mockData';
import { apiGetDevelopers } from '../api/api';

const sprintStatusConfig: Record<SprintStatus, { color: 'default' | 'primary' | 'success'; label: string; bg: string; text: string }> = {
  planned: { color: 'default', label: 'Planned', bg: '#F1F5F9', text: '#64748b' },
  active: { color: 'primary', label: 'Active', bg: '#dbeafe', text: '#2563EB' },
  completed: { color: 'success', label: 'Completed', bg: '#dcfce7', text: '#16a34a' },
};

const emptyTeamForm = { name: '', description: '', members: [] as string[] };
const emptySprintForm = { name: '', startDate: '', endDate: '', status: 'planned' as SprintStatus, goal: '' };

export default function TeamsPage() {
  const { teams, sprints, developerProfiles, backendOnline, addTeam, updateTeam, addSprint, updateSprint } = useApp();
  const [allDevelopers, setAllDevelopers] = useState<DeveloperProfile[]>(developerProfiles);

  const [teamDialog, setTeamDialog] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);

  const [sprintDialog, setSprintDialog] = useState(false);
  const [sprintTeamId, setSprintTeamId] = useState('');
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [sprintForm, setSprintForm] = useState(emptySprintForm);

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
    if (editTeam) {
      await updateTeam({ ...editTeam, ...teamForm });
    } else {
      await addTeam(teamForm);
    }
    setTeamDialog(false);
  };

  const openAddSprint = (teamId: string) => {
    setSprintForm(emptySprintForm);
    setSprintTeamId(teamId);
    setEditSprint(null);
    setSprintDialog(true);
  };

  const openEditSprint = (s: Sprint) => {
    setSprintForm({ name: s.name, startDate: s.startDate, endDate: s.endDate, status: s.status, goal: s.goal });
    setSprintTeamId(s.teamId);
    setEditSprint(s);
    setSprintDialog(true);
  };

  const saveSprint = async () => {
    if (editSprint) {
      await updateSprint({ ...editSprint, ...sprintForm });
    } else {
      await addSprint({ teamId: sprintTeamId, ...sprintForm });
    }
    setSprintDialog(false);
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
    initialStories.filter((s) => s.sprintId === sprintId).length;

  const getPoints = (sprintId: string) =>
    initialStories.filter((s) => s.sprintId === sprintId).reduce((sum, s) => sum + s.points, 0);

  const initials = (name: string) => name.split(' ').map((n) => n[0]).join('');

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
        return (
          <Accordion key={team.id} defaultExpanded sx={{ mb: 1.5, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1, mr: 2, minWidth: 0 }}>
                <Avatar sx={{ bgcolor: '#2563EB18', color: '#2563EB', width: 40, height: 40, flexShrink: 0 }}>
                  <GroupsIcon fontSize="small" />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {team.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {team.description}
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
              <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>
                  Members:
                </Typography>
                {team.members.map((m) => (
                  <Chip
                    key={m}
                    avatar={<Avatar sx={{ fontSize: 10, fontWeight: 700 }}>{initials(m)}</Avatar>}
                    label={m}
                    size="small"
                    variant="outlined"
                  />
                ))}
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
                {teamSprints.map((sprint) => {
                  const cfg = sprintStatusConfig[sprint.status];
                  const storyCount = getStoryCount(sprint.id);
                  const points = getPoints(sprint.id);
                  return (
                    <Paper
                      key={sprint.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2 }}
                    >
                      <Stack direction="row" alignItems="flex-start">
                        <Box sx={{ flexGrow: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="body1" fontWeight={700}>
                              {sprint.name}
                            </Typography>
                            <Chip
                              label={cfg.label}
                              size="small"
                              sx={{ bgcolor: cfg.bg, color: cfg.text, fontWeight: 600, fontSize: 11 }}
                            />
                            {storyCount > 0 && (
                              <Chip
                                label={`${storyCount} stories · ${points} pts`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {sprint.startDate} → {sprint.endDate}
                          </Typography>
                          {sprint.goal && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Goal: {sprint.goal}
                            </Typography>
                          )}
                        </Box>
                        <Tooltip title="Edit sprint">
                          <IconButton size="small" onClick={() => openEditSprint(sprint)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
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
          <Button variant="contained" onClick={saveTeam} disabled={!teamForm.name}>
            Save
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
                onChange={(e) => setSprintForm((f) => ({ ...f, startDate: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End Date"
                type="date"
                value={sprintForm.endDate}
                onChange={(e) => setSprintForm((f) => ({ ...f, endDate: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
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
            disabled={!sprintForm.name || !sprintForm.startDate || !sprintForm.endDate}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

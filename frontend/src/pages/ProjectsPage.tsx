import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  Stack, Chip, IconButton, Tooltip, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import { Project, ProjectType } from '../data/mockData';
import { useApp } from '../context/AppContext';

const typeColor: Record<ProjectType, { color: string; bg: string }> = {
  Client:   { color: '#0891b2', bg: '#e0f2fe' },
  Internal: { color: '#7C3AED', bg: '#ede9fe' },
};

const emptyForm = { name: '', type: 'Internal' as ProjectType, description: '' };

export default function ProjectsPage() {
  const { projects, developerProfiles, currentUser, addProject, updateProject, deleteProject } = useApp();

  const PRIVILEGED_ROLES = ['Manager', 'Associate Manager', 'Delivery Manager', 'Technical Manager', 'Tech Lead'];
  const canManage = currentUser ? PRIVILEGED_ROLES.includes(currentUser.role) : false;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nameError, setNameError] = useState('');

  const openAdd = () => { setForm(emptyForm); setEditTarget(null); setNameError(''); setDialogOpen(true); };
  const openEdit = (p: Project) => {
    setForm({ name: p.name, type: p.type, description: p.description });
    setEditTarget(p);
    setNameError('');
    setDialogOpen(true);
  };

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Project name is required';
    const dup = projects.find((p) => p.name.toLowerCase() === name.trim().toLowerCase() && p.id !== editTarget?.id);
    if (dup) return 'A project with this name already exists';
    return '';
  };

  const handleSave = async () => {
    const err = validateName(form.name);
    if (err) { setNameError(err); return; }
    setIsSaving(true);
    try {
      if (editTarget) {
        await updateProject({ ...editTarget, ...form, name: form.name.trim() });
      } else {
        await addProject({ ...form, name: form.name.trim() });
      }
      setDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add Project
          </Button>
        )}
      </Stack>

      <Grid container spacing={2}>
        {projects.map((proj) => {
          const c = typeColor[proj.type];
          const memberCount = developerProfiles.filter((d) => (d.projectIds ?? []).includes(proj.id)).length;
          return (
            <Grid item xs={12} sm={6} md={4} key={proj.id}>
              <Paper
                sx={{
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  position: 'relative',
                  '&:hover .proj-actions': { opacity: 1 },
                }}
              >
                {canManage && (
                  <Stack
                    className="proj-actions"
                    direction="row"
                    spacing={0.5}
                    sx={{ position: 'absolute', top: 10, right: 10, opacity: 0, transition: 'opacity 0.15s' }}
                  >
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(proj)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteTarget(proj)} sx={{ color: '#dc2626' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FolderIcon sx={{ color: c.color, fontSize: 22 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {proj.name}
                    </Typography>
                    <Chip
                      label={proj.type}
                      size="small"
                      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: 11, height: 20 }}
                    />
                  </Box>
                </Stack>

                {proj.description && (
                  <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {proj.description}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </Typography>
              </Paper>
            </Grid>
          );
        })}

        {projects.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center" py={6}>
              No projects yet.{canManage ? ' Click "Add Project" to create one.' : ''}
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            Employees assigned to this project will lose that assignment.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Project' : 'Add Project'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Project Name"
              value={form.name}
              onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setNameError(validateName(e.target.value)); }}
              fullWidth size="small"
              required
              error={!!nameError}
              helperText={nameError}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={form.type}
                label="Type"
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProjectType }))}
              >
                <MenuItem value="Client">Client</MenuItem>
                <MenuItem value="Internal">Internal</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth size="small" multiline rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !form.name.trim() || !!nameError}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

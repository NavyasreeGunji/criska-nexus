import { useState, useEffect, useMemo } from 'react';
import { exportExcel } from '../utils/exportExcel';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Grid,
  TextField,
  Button,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { Story, initialStories, developers, StoryStatus } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetStories } from '../api/api';
import TablePaginationActions, { paginationSx } from '../components/TablePaginationActions';

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}-${m}-${y.slice(2)}`;
};

const statusConfig: Record<StoryStatus, { color: 'default' | 'primary' | 'warning' | 'success' | 'info'; label: string }> = {
  backlog:         { color: 'default',  label: 'Backlog' },
  to_do:           { color: 'default',  label: 'To Do' },
  in_progress:     { color: 'primary',  label: 'In Progress' },
  in_review:       { color: 'warning',  label: 'In Review' },
  for_qe_testing:  { color: 'info',     label: 'Review / Testing' },
  done:            { color: 'success',  label: 'Done' },
  on_hold:         { color: 'default',  label: 'On Hold' },
};

export default function ReportsPage() {
  const { teams, sprints, backendOnline, backendChecked } = useApp();
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    if (!backendChecked) return;
    if (backendOnline) {
      apiGetStories().then(setStories).catch(() => setStories(initialStories));
    } else {
      setStories(initialStories);
    }
  }, [backendChecked, backendOnline]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterTeamId, setFilterTeamId] = useState('all');
  const [filterSprintId, setFilterSprintId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const teamSprints = useMemo(
    () => sprints.filter((s) => filterTeamId === 'all' || s.teamId === filterTeamId),
    [sprints, filterTeamId]
  );

  const filtered = useMemo(
    () =>
      stories
        .filter((s) => filterStatus === 'all' || s.status === filterStatus)
        .filter((s) => filterAssignee === 'all' || s.assignee === filterAssignee)
        .filter((s) => filterTeamId === 'all' || s.teamId === filterTeamId)
        .filter((s) => filterSprintId === 'all' || s.sprintId === filterSprintId)
        .filter((s) => !dateFrom || (s.createdDate && s.createdDate >= dateFrom))
        .filter((s) => !dateTo || (s.createdDate && s.createdDate <= dateTo))
        .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? '')),
    [stories, filterStatus, filterAssignee, filterTeamId, filterSprintId, dateFrom, dateTo]
  );

  const totalPoints = filtered.reduce((sum, s) => sum + s.points, 0);
  const donePoints = filtered.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.points, 0);
  const onHoldPoints = filtered.filter((s) => s.status === 'on_hold').reduce((sum, s) => sum + s.points, 0);
  const inProgressPoints = filtered.filter((s) => s.status === 'in_progress').reduce((sum, s) => sum + s.points, 0);

  const byAssignee = useMemo(
    () =>
      developers
        .map((dev) => {
          const devStories = filtered.filter((s) => s.assignee === dev);
          return {
            dev,
            count: devStories.length,
            total: devStories.reduce((sum, s) => sum + s.points, 0),
            done: devStories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.points, 0),
            onHold: devStories.filter((s) => s.status === 'on_hold').reduce((sum, s) => sum + s.points, 0),
            inProgress: devStories.filter((s) => s.status === 'in_progress').reduce((sum, s) => sum + s.points, 0),
          };
        })
        .filter((r) => r.count > 0),
    [filtered]
  );

  const handleExportXLS = () => {
    const columns = [
      { key: 'storyNo',   label: 'Story No.',  width: 12, align: 'center' as const },
      { key: 'title',     label: 'Title',       width: 45 },
      { key: 'points',    label: 'Points',      width: 8,  align: 'center' as const, numFmt: '0' },
      { key: 'status',    label: 'Status',      width: 16, align: 'center' as const },
      { key: 'reporter',  label: 'Reporter',    width: 22 },
      { key: 'assignee',  label: 'Assignee',    width: 22 },
      { key: 'team',      label: 'Team',        width: 18 },
      { key: 'dueDate',   label: 'Due Date',    width: 13, align: 'center' as const },
      { key: 'started',   label: 'Started',     width: 13, align: 'center' as const },
      { key: 'completed', label: 'Completed',   width: 13, align: 'center' as const },
    ];
    const rows = filtered.map((s) => ({
      storyNo:   s.storyNumber || '',
      title:     s.title,
      points:    s.points ?? '',
      status:    statusConfig[s.status].label,
      reporter:  s.reporter,
      assignee:  s.assignee,
      team:      teams.find((t) => t.id === s.teamId)?.name ?? '',
      dueDate:   fmtDate(s.dueDate),
      started:   fmtDate(s.startedDate),
      completed: fmtDate(s.completedDate),
    }));
    exportExcel(columns, rows, 'Stories', `story-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Box>
      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Points', value: totalPoints, sub: `${filtered.length} stories`, color: 'primary.main' },
          { label: 'Points Delivered', value: donePoints, sub: `${totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}% completion`, color: 'success.main' },
          { label: 'On Hold', value: onHoldPoints, sub: `${filtered.filter((s) => s.status === 'on_hold').length} stories`, color: '#ea580c' },
          { label: 'In Progress', value: inProgressPoints, sub: `${filtered.filter((s) => s.status === 'in_progress').length} stories`, color: 'warning.main' },
        ].map((m) => (
          <Grid item xs={12} sm={6} md={3} key={m.label}>
            <Paper sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: m.color }}>
                {m.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {m.label}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {m.sub}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
        <TextField
          label="From Date"
          type="date"
          size="small"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="To Date"
          type="date"
          size="small"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All Statuses</MenuItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Assignee</InputLabel>
          <Select value={filterAssignee} label="Assignee" onChange={(e) => setFilterAssignee(e.target.value)}>
            <MenuItem value="all">All Assignees</MenuItem>
            {developers.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Team</InputLabel>
          <Select value={filterTeamId} label="Team" onChange={(e) => { setFilterTeamId(e.target.value); setFilterSprintId('all'); }}>
            <MenuItem value="all">All Teams</MenuItem>
            {teams.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Sprint</InputLabel>
          <Select value={filterSprintId} label="Sprint" onChange={(e) => setFilterSprintId(e.target.value)}>
            <MenuItem value="all">All Sprints</MenuItem>
            {teamSprints.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        {(dateFrom || dateTo || filterStatus !== 'all' || filterAssignee !== 'all' || filterTeamId !== 'all' || filterSprintId !== 'all') && (
          <Button size="small" onClick={() => { setDateFrom(''); setDateTo(''); setFilterStatus('all'); setFilterAssignee('all'); setFilterTeamId('all'); setFilterSprintId('all'); setPage(0); }}>
            Clear Filters
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Export to CSV">
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportXLS}>
            Export Excel
          </Button>
        </Tooltip>
      </Stack>

      {/* Story Report Table */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>Story Report</Typography>
        <Typography variant="body2" color="text.secondary">{filtered.length} stories · {totalPoints} pts</Typography>
      </Stack>
      <Paper sx={{ mb: 3 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              {['Story No.', 'Title', 'Pts', 'Status', 'Reporter', 'Assignee', 'Due Date', 'Started', 'Completed'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((story) => {
              const team = teams.find((t) => t.id === story.teamId);
              const today = new Date().toISOString().slice(0, 10);
              const dueDate = story.dueDate ?? '';
              const isOverdue = dueDate && dueDate < today && !story.completedDate;
              return (
                <TableRow
                  key={story.id}
                  hover
                  sx={isOverdue ? { bgcolor: '#fff5f5' } : undefined}
                >
                  <TableCell>
                    <Typography variant="caption" color="primary" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
                      {story.storyNumber || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Typography variant="body2" fontWeight={500} sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {story.title}
                      </Typography>
                      {isOverdue && (
                        <Chip label="Overdue" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 10, height: 18 }} />
                      )}
                    </Stack>
                    {team && (
                      <Typography variant="caption" color="text.disabled" display="block">
                        {team.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid', borderColor: 'primary.main', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{story.points}</Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusConfig[story.status].label}
                      size="small"
                      color={statusConfig[story.status].color}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{story.reporter || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{story.assignee || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    {dueDate ? (
                      <Box sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.5,
                        px: 1, py: 0.25, borderRadius: 1,
                        bgcolor: isOverdue ? '#fee2e2' : 'transparent',
                      }}>
                        <Typography
                          variant="caption"
                          sx={{
                            whiteSpace: 'nowrap',
                            fontWeight: isOverdue ? 700 : 400,
                            color: isOverdue ? '#dc2626' : 'text.secondary',
                          }}
                        >
                          {fmtDate(dueDate)}
                        </Typography>
                        {isOverdue && (
                          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800 }}>!</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{fmtDate(story.startedDate)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{fmtDate(story.completedDate)}</Typography>
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

      {/* Points by Developer */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        Points by Developer
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              {['Developer', 'Stories', 'Total Pts', 'Delivered', 'On Hold', 'In Progress', 'Delivery Rate'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {byAssignee.map((row) => {
              const rate = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0;
              return (
                <TableRow key={row.dev} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{row.dev}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{row.count}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700}>{row.total}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} color="success.main">{row.done}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} sx={{ color: '#ea580c' }}>{row.onHold}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} color="warning.main">{row.inProgress}</Typography></TableCell>
                  <TableCell>
                    <Chip label={`${rate}%`} size="small" color={rate >= 50 ? 'success' : rate >= 25 ? 'warning' : 'default'} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

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
import SearchOffIcon from '@mui/icons-material/SearchOff';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { Story, initialStories, developers, StoryStatus } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { apiGetStories } from '../api/api';
import TablePaginationActions, { paginationSx } from '../components/TablePaginationActions';
import FilterBar from '../components/FilterBar';
import styles, { getOverdueRowSx, getOverdueDateBoxSx, getOverdueDateTextSx } from './ReportsPage.styles';


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
  const { teams, sprints, backendOnline, backendChecked, currentUser } = useApp();
  const isAdmin = currentUser != null && ['Manager', 'Admin', 'Managing Director'].includes(currentUser.role);
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

  const byAssignee = useMemo(() => {
    const uniqueAssignees = Array.from(
      new Set(filtered.map((s) => s.assignee).filter(Boolean))
    ).sort();
    return uniqueAssignees.map((dev) => {
      const devStories = filtered.filter((s) => s.assignee === dev);
      return {
        dev,
        count: devStories.length,
        total: devStories.reduce((sum, s) => sum + s.points, 0),
        done: devStories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.points, 0),
        onHold: devStories.filter((s) => s.status === 'on_hold').reduce((sum, s) => sum + s.points, 0),
        inProgress: devStories.filter((s) => s.status === 'in_progress').reduce((sum, s) => sum + s.points, 0),
      };
    });
  }, [filtered]);

  const devPointsData = useMemo(
    () =>
      byAssignee
        .map((row) => ({ name: row.dev, points: row.total }))
        .filter((r) => r.points > 0)
        .sort((a, b) => a.points - b.points),
    [byAssignee]
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
      { key: 'sprint',    label: 'Sprint',      width: 18 },
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
      sprint:    sprints.find((sp) => sp.id === s.sprintId)?.name ?? '',
      dueDate:   fmtDate(s.dueDate),
      started:   fmtDate(s.startedDate),
      completed: fmtDate(s.completedDate),
    }));
    exportExcel(columns, rows, 'Stories', `story-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Box>
      {/* Summary cards */}
      <Grid container spacing={2} sx={styles.metricsRow}>
        {[
          { label: 'Total Points', value: totalPoints, sub: `${filtered.length} stories`, color: 'primary.main' },
          { label: 'Points Delivered', value: donePoints, sub: `${totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}% completion`, color: 'success.main' },
          { label: 'On Hold', value: onHoldPoints, sub: `${filtered.filter((s) => s.status === 'on_hold').length} stories`, color: '#ea580c' },
          { label: 'In Progress', value: inProgressPoints, sub: `${filtered.filter((s) => s.status === 'in_progress').length} stories`, color: 'warning.main' },
        ].map((m) => (
          <Grid item xs={12} sm={6} md={3} key={m.label}>
            <Paper sx={styles.summaryCard}>
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

      <FilterBar
        activeCount={[dateFrom, dateTo, filterStatus !== 'all', filterAssignee !== 'all', filterTeamId !== 'all', filterSprintId !== 'all'].filter(Boolean).length}
        onClearAll={() => { setDateFrom(''); setDateTo(''); setFilterStatus('all'); setFilterAssignee('all'); setFilterTeamId('all'); setFilterSprintId('all'); setPage(0); }}
        extra={
          <Tooltip title="Export to Excel">
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportXLS}>
              Export Excel
            </Button>
          </Tooltip>
        }
      >
        <TextField label="From Date" type="date" size="small" value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
        <TextField label="To Date" type="date" size="small" value={dateTo}
          onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All Statuses</MenuItem>
            {Object.entries(statusConfig).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
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
      </FilterBar>

      {/* Story Report Table */}
      <Stack direction="row" alignItems="center" spacing={1} sx={styles.reportHeader}>
        <Typography variant="subtitle1" fontWeight={700}>Story Report</Typography>
        <Typography variant="body2" color="text.secondary">{filtered.length} stories · {totalPoints} pts</Typography>
      </Stack>
      <Paper sx={styles.reportPaper}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={styles.tableHeaderRow}>
              {['Story No.', 'Title', 'Pts', 'Status', 'Reporter', 'Assignee', 'Due Date', 'Started', 'Completed'].map((h) => (
                <TableCell key={h} sx={styles.tableHeaderCell}>
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
              const isOverdue = !!(dueDate && dueDate < today && !story.completedDate);
              return (
                <TableRow
                  key={story.id}
                  hover
                  sx={getOverdueRowSx(isOverdue)}
                >
                  <TableCell>
                    <Typography variant="caption" color="primary" fontWeight={700} sx={styles.storyNoText}>
                      {story.storyNumber || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={styles.titleCell}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Typography variant="body2" fontWeight={500} sx={styles.titleText}>
                        {story.title}
                      </Typography>
                      {isOverdue && (
                        <Chip label="Overdue" size="small" sx={styles.overdueChip} />
                      )}
                    </Stack>
                    {team && (
                      <Typography variant="caption" color="text.disabled" display="block">
                        {team.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={styles.pointsBadge}>{story.points}</Box>
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
                      <Box sx={getOverdueDateBoxSx(!!isOverdue)}>
                        <Typography
                          variant="caption"
                          sx={getOverdueDateTextSx(!!isOverdue)}
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={styles.emptyStateBox}>
                    <SearchOffIcon sx={styles.emptyStateIcon} />
                    <Typography variant="body1" fontWeight={600} color="text.secondary">No stories match your filters</Typography>
                    <Typography variant="caption" color="text.disabled" display="block" sx={styles.emptyStateCaption}>
                      Try adjusting or clearing the filters above
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => {
                      setDateFrom(''); setDateTo(''); setFilterStatus('all');
                      setFilterAssignee('all'); setFilterTeamId('all'); setFilterSprintId('all'); setPage(0);
                    }}>
                      Clear Filters
                    </Button>
                  </Box>
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

      {/* Story Points by Developer — admin only */}
      {isAdmin && devPointsData.length > 0 && (
        <Paper sx={styles.chartPaper}>
          <Typography variant="subtitle1" fontWeight={700} sx={styles.chartTitle}>
            Story Points by Developer
          </Typography>
          <ResponsiveContainer width="100%" height={Math.max(260, devPointsData.length * 42)}>
            <BarChart
              data={devPointsData}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis type="category" dataKey="name" hide />
              <RechartsTooltip
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                formatter={(value) => [`${value} pts`, 'Story Points']}
              />
              <Bar dataKey="points" fill="#6366f1" radius={[0, 4, 4, 0]} minPointSize={2}>
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  style={{ fill: '#fff', fontSize: 12, fontWeight: 600 }}
                />
                <LabelList
                  dataKey="points"
                  position="right"
                  style={{ fill: '#6366f1', fontSize: 12, fontWeight: 700 }}
                  formatter={(v) => `${v} pts`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Points by Developer */}
      <Typography variant="subtitle1" fontWeight={700} sx={styles.devListTitle}>
        Points by Developer
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={styles.tableHeaderRow}>
              {['Developer', 'Stories', 'Total Pts', 'Delivered', 'On Hold', 'In Progress', 'Delivery Rate'].map((h) => (
                <TableCell key={h} sx={styles.devTableHeaderCell}>
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
                  <TableCell><Typography variant="body2" fontWeight={700} sx={styles.onHoldText}>{row.onHold}</Typography></TableCell>
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

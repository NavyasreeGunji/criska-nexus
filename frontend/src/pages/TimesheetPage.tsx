import { useState } from 'react';
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
  IconButton,
  Stack,
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { dailyLogs, developers } from '../data/mockData';
import TablePaginationActions, { paginationSx } from '../components/TablePaginationActions';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// JH Client (United States) Holiday Schedule
const JH_HOLIDAYS: { name: string; date: string }[] = [
  { name: "New Year's Day",          date: '2026-01-01' },
  { name: 'Martin Luther King Day',  date: '2026-01-19' },
  { name: "President's Day",         date: '2026-02-16' },
  { name: 'Good Friday',             date: '2026-04-03' },
  { name: 'Memorial Day',            date: '2026-05-25' },
  { name: 'Juneteenth',              date: '2026-06-19' },
  { name: 'Independence Day',        date: '2026-07-03' },
  { name: 'Labor Day',               date: '2026-09-07' },
  { name: 'Thanksgiving Day',        date: '2026-11-26' },
  { name: 'Christmas Day',           date: '2026-12-25' },
  { name: "New Year's Day",          date: '2027-01-01' },
];

const holidayMap = Object.fromEntries(JH_HOLIDAYS.map((h) => [h.date, h.name]));

const fmtHolidayDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

function getMonday(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getWeekDays(mondayStr: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i));
}

export default function TimesheetPage() {
  const [weekMonday, setWeekMonday] = useState(() => getMonday('2026-06-14'));
  const weekDays = getWeekDays(weekMonday);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const prevWeek = () => setWeekMonday((m) => addDays(m, -7));
  const nextWeek = () => setWeekMonday((m) => addDays(m, 7));

  const getHours = (dev: string, date: string) =>
    dailyLogs
      .filter((l) => l.developer === dev && l.date === date)
      .reduce((sum, l) => sum + l.hours, 0);

  const getWeekTotal = (dev: string) =>
    weekDays.reduce((sum, d) => sum + getHours(dev, d), 0);

  const getDayTotal = (date: string) =>
    developers.reduce((sum, dev) => sum + getHours(dev, date), 0);

  const grandTotal = weekDays.reduce((sum, d) => sum + getDayTotal(d), 0);

  // Holidays that fall in the current week
  const weekHolidays = weekDays.filter((d) => holidayMap[d]);

  return (
    <Box>
      {/* Week holiday banner */}
      {weekHolidays.length > 0 && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#fef9c3', border: '1px solid #fde047', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <CelebrationIcon sx={{ color: '#ca8a04', fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600} color="#92400e">
            JH Holiday this week:
          </Typography>
          {weekHolidays.map((d) => (
            <Chip key={d} label={`${holidayMap[d]} (${d.slice(5)})`} size="small"
              sx={{ bgcolor: '#fde047', color: '#78350f', fontWeight: 600, fontSize: 11 }} />
          ))}
        </Box>
      )}

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={prevWeek} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 210, textAlign: 'center' }}>
          {weekDays[0]} – {weekDays[6]}
        </Typography>
        <IconButton onClick={nextWeek} size="small">
          <ChevronRightIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Total: <strong>{grandTotal}h</strong>
        </Typography>
      </Stack>

      <Paper sx={{ mb: 3 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 600, minWidth: 160, fontSize: 12, color: '#64748b' }}>
                Developer
              </TableCell>
              {weekDays.map((date, i) => {
                const holiday = holidayMap[date];
                return (
                  <TableCell
                    key={date}
                    align="center"
                    sx={{
                      fontWeight: 600, minWidth: 70, fontSize: 12, color: '#64748b',
                      bgcolor: holiday ? '#fef9c3' : undefined,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {DAY_LABELS[i]}
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {date.slice(5)}
                      </Typography>
                      {holiday && (
                        <Tooltip title={holiday}>
                          <CelebrationIcon sx={{ fontSize: 11, color: '#ca8a04', display: 'block', mx: 'auto', mt: 0.25 }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                );
              })}
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {developers.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((dev) => {
              const weekTotal = getWeekTotal(dev);
              return (
                <TableRow key={dev} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: '#2563EB18',
                          color: '#2563EB',
                        }}
                      >
                        {dev.split(' ').map((n) => n[0]).join('')}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {dev}
                      </Typography>
                    </Box>
                  </TableCell>
                  {weekDays.map((date) => {
                    const h = getHours(dev, date);
                    const holiday = holidayMap[date];
                    return (
                      <TableCell key={date} align="center" sx={{ bgcolor: holiday ? '#fef9c326' : undefined }}>
                        {h > 0 ? (
                          <Chip
                            label={`${h}h`}
                            size="small"
                            sx={{
                              bgcolor:
                                h > 8
                                  ? '#fee2e2'
                                  : h === 8
                                  ? '#dcfce7'
                                  : h >= 4
                                  ? '#dbeafe'
                                  : '#fef3c7',
                              color:
                                h > 8
                                  ? '#dc2626'
                                  : h === 8
                                  ? '#16a34a'
                                  : h >= 4
                                  ? '#2563EB'
                                  : '#d97706',
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          />
                        ) : holiday ? (
                          <Tooltip title={holiday}>
                            <Typography variant="caption" color="#ca8a04" fontWeight={600}>Off</Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      color={weekTotal > 40 ? 'error.main' : weekTotal === 40 ? 'success.main' : weekTotal > 0 ? 'text.primary' : 'text.disabled'}
                    >
                      {weekTotal > 0 ? `${weekTotal}h` : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell>
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  Daily Total
                </Typography>
              </TableCell>
              {weekDays.map((date) => {
                const total = getDayTotal(date);
                return (
                  <TableCell key={date} align="center" sx={{ bgcolor: holidayMap[date] ? '#fef9c326' : undefined }}>
                    <Typography variant="body2" fontWeight={700}>
                      {total > 0 ? `${total}h` : '—'}
                    </Typography>
                  </TableCell>
                );
              })}
              <TableCell align="center">
                <Typography variant="body2" fontWeight={800} color="primary">
                  {grandTotal}h
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 20, 50]}
        component="div"
        count={developers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        ActionsComponent={TablePaginationActions}
        sx={paginationSx}
      />
      </Paper>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Activity Breakdown (This Week)
      </Typography>
      <Paper sx={{ p: 2.5, mb: 3 }}>
        {developers.map((dev) => {
          const devLogs = dailyLogs.filter((l) => l.developer === dev && weekDays.includes(l.date));
          if (devLogs.length === 0) return null;
          const total = devLogs.reduce((sum, l) => sum + l.hours, 0);
          return (
            <Box key={dev} sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                <Typography variant="body2" fontWeight={700}>
                  {dev}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {total}h this week
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {devLogs.map((l) => (
                  <Chip
                    key={l.id}
                    label={`${l.title}: ${l.hours}h`}
                    size="small"
                    sx={{
                      bgcolor: '#2563EB18',
                      color: '#2563EB',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                ))}
              </Stack>
              <Divider sx={{ mt: 1.5 }} />
            </Box>
          );
        })}
      </Paper>

      {/* JH Client Holiday Schedule */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CelebrationIcon sx={{ color: '#ca8a04', fontSize: 20 }} />
        JH Client Holiday Schedule (United States)
      </Typography>
      <Paper sx={{ overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f0fdf4' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#16a34a' }}>Holiday</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#16a34a' }}>Observed Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {JH_HOLIDAYS.map((h, i) => {
              const isPast = h.date < new Date().toISOString().slice(0, 10);
              const isUpcoming = !isPast && h.date <= addDays(new Date().toISOString().slice(0, 10), 30);
              return (
                <TableRow key={i} sx={{ opacity: isPast ? 0.45 : 1, bgcolor: isUpcoming ? '#fef9c3' : undefined }}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={isUpcoming ? 700 : 500}>{h.name}</Typography>
                      {isUpcoming && <Chip label="Upcoming" size="small" sx={{ bgcolor: '#fde047', color: '#78350f', fontWeight: 600, fontSize: 10 }} />}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={isPast ? 'text.disabled' : 'text.primary'}>
                      {fmtHolidayDate(h.date)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

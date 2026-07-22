import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Stack, Button, Chip, Tab, Tabs,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, Tooltip, Alert, LinearProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useApp } from '../context/AppContext';
import {
  apiGetAllLeaves, apiGetMyLeaves, apiGetLeaveBalance, apiGetAllBalances,
  apiApplyLeave, apiApproveLeave, apiRejectLeave, apiCancelLeave,
  apiDeleteLeave, apiDeleteLeaveBalance, apiUpdateCarryForward,
  LeaveRequest, LeaveBalance,
} from '../api/api';

// Demo mode: only HR can apply; Admin/Manager can view all; Admin can approve/reject/delete

const leaveTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  casual: { label: 'Casual Leave', color: '#0891b2', bg: '#ecfeff' },
  sick:   { label: 'Sick Leave',   color: '#7C3AED', bg: '#faf5ff' },
  lop:    { label: 'Loss of Pay',  color: '#dc2626', bg: '#fef2f2' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#d97706', bg: '#fffbeb' },
  approved:  { label: 'Approved',  color: '#16a34a', bg: '#f0fdf4' },
  rejected:  { label: 'Rejected',  color: '#dc2626', bg: '#fef2f2' },
  cancelled: { label: 'Cancelled', color: '#64748b', bg: '#f1f5f9' },
};

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function countWorkingDays(from: string, to: string): number {
  if (!from || !to) return 0;
  let count = 0;
  const d = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

interface BalanceCardProps { label: string; total: number; used: number; color: string; }
function BalanceCard({ label, total, used, color }: BalanceCardProps) {
  const remaining = Math.max(total - used, 0);
  const pct = total > 0 ? (used / total) * 100 : 0;
  return (
    <Paper sx={{ p: 2, flex: 1, minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Typography variant="h5" fontWeight={800} color={color} sx={{ my: 0.5 }}>
        {remaining}<Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>/ {total}</Typography>
      </Typography>
      <LinearProgress variant="determinate" value={Math.min(pct, 100)}
        sx={{ height: 4, borderRadius: 2, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
      <Typography variant="caption" color="text.secondary">{used} used</Typography>
    </Paper>
  );
}

export default function LeavePage() {
  const { currentUser, developerProfiles } = useApp();
  const role = currentUser?.role ?? '';
  const canViewAll       = role === 'Admin' || role === 'Manager';
  const canApply         = role === 'HR';
  const canApproveReject = role === 'Admin';
  const canDelete        = role === 'Admin';
  const currentYear = new Date().getFullYear();

  const [tab, setTab] = useState(0);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [myBalance, setMyBalance] = useState<LeaveBalance | null>(null);
  const [allBalances, setAllBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);

  // Apply dialog
  const [applyOpen, setApplyOpen] = useState(false);
  const today = dayjs().format('YYYY-MM-DD');
  const [applyForm, setApplyForm] = useState({ leaveType: 'casual', fromDate: today, toDate: today, reason: '' });
  const [applyError, setApplyError] = useState('');
  const [applying, setSaving] = useState(false);

  // Action dialog (approve/reject)
  const [actionLeave, setActionLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view'>('view');
  const [actionComments, setActionComments] = useState('');
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState('');

  const workingDays = countWorkingDays(applyForm.fromDate, applyForm.toDate);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (canViewAll) {
        const [all, bals] = await Promise.all([
          apiGetAllLeaves().catch(() => []),
          apiGetAllBalances(currentYear).catch(() => []),
        ]);
        setAllLeaves(all);
        setAllBalances(bals);
      }
      if (currentUser?.name) {
        const [mine, bal] = await Promise.all([
          apiGetMyLeaves(currentUser.name).catch(() => []),
          apiGetLeaveBalance(currentUser.name, currentYear).catch(() => null),
        ]);
        setMyLeaves(mine);
        setMyBalance(bal);
      }
    } finally {
      setLoading(false);
    }
  }, [canViewAll, currentUser, currentYear]);

  useEffect(() => { reload(); }, [reload]);

  const handleApply = async () => {
    if (!applyForm.fromDate || !applyForm.toDate) { setApplyError('Please select both dates'); return; }
    if (applyForm.fromDate > applyForm.toDate) { setApplyError('From date must be before To date'); return; }
    if (!applyForm.reason.trim()) { setApplyError('Reason is required'); return; }
    setSaving(true);
    setApplyError('');
    try {
      await apiApplyLeave({ employeeName: currentUser!.name, ...applyForm });
      setApplyOpen(false);
      setApplyForm({ leaveType: 'casual', fromDate: today, toDate: today, reason: '' });
      reload();
    } catch (e: any) { setApplyError(e.message); }
    finally { setSaving(false); }
  };

  const handleAction = async () => {
    if (!actionLeave) return;
    setActioning(true);
    setActionError('');
    try {
      if (actionType === 'approve') await apiApproveLeave(actionLeave.id, currentUser!.name, actionComments);
      else if (actionType === 'reject') await apiRejectLeave(actionLeave.id, currentUser!.name, actionComments);
      setActionLeave(null);
      setActionComments('');
      setActionError('');
      await reload();
    } catch (e: any) {
      setActionError(e.message ?? 'Operation failed. Please try again.');
    } finally { setActioning(false); }
  };

  const handleCancel = async (leave: LeaveRequest) => {
    await apiCancelLeave(leave.id);
    reload();
  };

  const handleDeleteRequest = async (leave: LeaveRequest) => {
    if (!window.confirm(`Delete this leave request for ${leave.employeeName}?`)) return;
    await apiDeleteLeave(leave.id);
    reload();
  };

  const handleDeleteBalance = async (balance: LeaveBalance) => {
    if (!window.confirm(`Delete balance record for ${balance.employeeName} (${balance.year})?`)) return;
    await apiDeleteLeaveBalance(balance.id);
    reload();
  };

  const [cfEdit, setCfEdit] = useState<{ id: string; value: string } | null>(null);

  const handleSaveCf = async () => {
    if (!cfEdit) return;
    await apiUpdateCarryForward(cfEdit.id, parseFloat(cfEdit.value) || 0);
    setCfEdit(null);
    reload();
  };

  const leavesToShow = tab === 0 ? myLeaves : allLeaves;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <BeachAccessIcon sx={{ color: '#16a34a', fontSize: 26 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Leave Management</Typography>
            <Typography variant="caption" color="text.secondary">
              Apply · Track · Approve · Policy: 6 CL · 6 SL per year
            </Typography>
          </Box>
        </Stack>
        {canApply && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setApplyForm({ leaveType: 'casual', fromDate: today, toDate: today, reason: '' }); setApplyError(''); setApplyOpen(true); }}>
            Apply Leave
          </Button>
        )}
      </Stack>

      {/* My Balance Cards */}
      {myBalance && (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          <BalanceCard label="Casual Leave" total={myBalance.casualTotal} used={myBalance.casualUsed} color="#0891b2" />
          <BalanceCard label="Sick Leave" total={myBalance.sickTotal} used={myBalance.sickUsed} color="#7C3AED" />
          <Paper sx={{ p: 2, flex: 1, minWidth: 140, border: '1.5px solid #bbf7d0' }}>
            <Typography variant="caption" color="#16a34a" fontWeight={600}>Carry Forward</Typography>
            <Typography variant="h5" fontWeight={800} color={myBalance.carryForward > 0 ? '#16a34a' : 'text.secondary'} sx={{ my: 0.5 }}>
              {myBalance.carryForward > 0 ? `+${myBalance.carryForward}` : '0'}
            </Typography>
            <Typography variant="caption" color="text.secondary">days from prev year</Typography>
          </Paper>
          {myBalance.lopDays > 0 && (
            <Paper sx={{ p: 2, flex: 1, minWidth: 140, border: '1.5px solid #fca5a5' }}>
              <Typography variant="caption" color="error.main" fontWeight={600}>Loss of Pay</Typography>
              <Typography variant="h5" fontWeight={800} color="error.main" sx={{ my: 0.5 }}>{myBalance.lopDays}</Typography>
              <Typography variant="caption" color="text.secondary">days deducted</Typography>
            </Paper>
          )}
        </Stack>
      )}

      {/* Tabs */}
      {canViewAll && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="My Leaves" />
          <Tab label={`All Requests${allLeaves.filter(l => l.status === 'pending').length > 0 ? ` (${allLeaves.filter(l => l.status === 'pending').length} pending)` : ''}`} />
          <Tab label="Team Balances" />
        </Tabs>
      )}

      {loading && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Loading…</Typography>}

      {/* Leave Table */}
      {tab !== 2 && (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  {canViewAll && tab === 1 && <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>Employee</TableCell>}
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>From</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>To</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', textAlign: 'center' }}>Days</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>Applied On</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>Reviewed By</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leavesToShow.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No leave requests found
                    </TableCell>
                  </TableRow>
                )}
                {leavesToShow.map((leave) => {
                  const lt = leaveTypeConfig[leave.leaveType] ?? leaveTypeConfig.casual;
                  const st = statusConfig[leave.status] ?? statusConfig.pending;
                  return (
                    <TableRow key={leave.id} hover>
                      {canViewAll && tab === 1 && (
                        <TableCell><Typography variant="body2" fontWeight={500}>{leave.employeeName}</Typography></TableCell>
                      )}
                      <TableCell>
                        <Chip label={lt.label} size="small"
                          sx={{ bgcolor: lt.bg, color: lt.color, fontWeight: 600, fontSize: 11 }} />
                      </TableCell>
                      <TableCell><Typography variant="body2">{fmtDate(leave.fromDate)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{fmtDate(leave.toDate)}</Typography></TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" fontWeight={700}>{leave.days}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {leave.reason}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{fmtDate(leave.appliedOn)}</Typography></TableCell>
                      <TableCell>
                        <Chip label={st.label} size="small"
                          sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={leave.approvedBy ? 'text.primary' : 'text.disabled'}>
                          {leave.approvedBy || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={() => { setActionLeave(leave); setActionType('view'); setActionComments(leave.approverComments); }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canApproveReject && leave.status === 'pending' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton size="small" color="success"
                                  onClick={() => { setActionLeave(leave); setActionType('approve'); setActionComments(''); setActionError(''); }}>
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton size="small" color="error"
                                  onClick={() => { setActionLeave(leave); setActionType('reject'); setActionComments(''); setActionError(''); }}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {leave.status === 'pending' && leave.employeeName === currentUser?.name && (
                            <Tooltip title="Cancel request">
                              <IconButton size="small" onClick={() => handleCancel(leave)}>
                                <EventBusyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteRequest(leave)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
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
        </Paper>
      )}

      {/* Team Balances Tab */}
      {tab === 2 && canViewAll && (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', textAlign: 'center' }}>CL Used / Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', textAlign: 'center' }}>SL Used / Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#16a34a', textAlign: 'center' }}>Carry Fwd</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#dc2626', textAlign: 'center' }}>LOP Days</TableCell>
                  {canDelete && <TableCell sx={{ fontWeight: 700, fontSize: 14, color: '#64748b', textAlign: 'center' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {allBalances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canDelete ? 6 : 5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No balance records yet
                    </TableCell>
                  </TableRow>
                )}
                {allBalances.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={500}>{b.employeeName}</Typography></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2">{b.casualUsed} / {b.casualTotal}</Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2">{b.sickUsed} / {b.sickTotal}</Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {canDelete && cfEdit?.id === b.id ? (
                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                          <TextField
                            size="small"
                            type="number"
                            value={cfEdit.value}
                            onChange={(e) => setCfEdit({ id: b.id, value: e.target.value })}
                            sx={{ width: 70 }}
                            inputProps={{ min: 0, step: 0.5 }}
                            autoFocus
                          />
                          <Tooltip title="Save">
                            <IconButton size="small" color="success" onClick={handleSaveCf}>
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                          <Typography variant="body2" color={b.carryForward > 0 ? '#16a34a' : 'text.secondary'}>
                            {b.carryForward > 0 ? `+${b.carryForward}` : '0'}
                          </Typography>
                          {canDelete && (
                            <Tooltip title="Edit carry forward">
                              <IconButton size="small" onClick={() => setCfEdit({ id: b.id, value: String(b.carryForward) })}>
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" fontWeight={b.lopDays > 0 ? 700 : 400}
                        color={b.lopDays > 0 ? 'error.main' : 'text.secondary'}>
                        {b.lopDays > 0 ? b.lopDays : '—'}
                      </Typography>
                    </TableCell>
                    {canDelete && (
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Tooltip title="Delete balance record">
                          <IconButton size="small" color="error" onClick={() => handleDeleteBalance(b)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Apply Leave Dialog */}
      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Apply for Leave</DialogTitle>
        <DialogContent sx={{ px: 3, pt: '12px !important', pb: 1 }}>
          <Stack spacing={2}>
            {applyError && <Alert severity="error">{applyError}</Alert>}
            <FormControl fullWidth size="small">
              <InputLabel>Leave Type</InputLabel>
              <Select value={applyForm.leaveType} label="Leave Type"
                onChange={(e) => setApplyForm(f => ({ ...f, leaveType: e.target.value }))}>
                <MenuItem value="casual">Casual Leave (CL)</MenuItem>
                <MenuItem value="sick">Sick Leave (SL)</MenuItem>
                <MenuItem value="lop">Loss of Pay (LOP)</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1.5}>
              <DatePicker
                label="From Date"
                value={applyForm.fromDate ? dayjs(applyForm.fromDate) : null}
                onChange={(d: Dayjs | null) => {
                  if (d && d.isValid()) setApplyForm(f => ({ ...f, fromDate: d.format('YYYY-MM-DD') }));
                }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <DatePicker
                label="To Date"
                value={applyForm.toDate ? dayjs(applyForm.toDate) : null}
                minDate={applyForm.fromDate ? dayjs(applyForm.fromDate) : undefined}
                onChange={(d: Dayjs | null) => {
                  if (d && d.isValid()) setApplyForm(f => ({ ...f, toDate: d.format('YYYY-MM-DD') }));
                }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Stack>
            {workingDays > 0 && (
              <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
                <strong>{workingDays} working day{workingDays !== 1 ? 's' : ''}</strong> (weekends excluded)
              </Alert>
            )}
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                Reason <Typography component="span" color="error">*</Typography>
              </Typography>
              <TextField fullWidth multiline rows={3}
                placeholder="Enter reason for leave"
                value={applyForm.reason}
                onChange={(e) => setApplyForm(f => ({ ...f, reason: e.target.value }))} />
            </Box>
            {myBalance && (
              <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1, p: 1.5, border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.5 }}>YOUR BALANCE</Typography>
                <Stack direction="row" spacing={4} sx={{ mt: 0.5 }}>
                  <Typography variant="body2">CL: <b>{myBalance.casualTotal - myBalance.casualUsed}</b> left</Typography>
                  <Typography variant="body2">SL: <b>{myBalance.sickTotal - myBalance.sickUsed}</b> left</Typography>
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setApplyOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApply} disabled={applying}>
            {applying ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View / Approve / Reject Dialog */}
      {actionLeave && (
        <Dialog open onClose={() => { setActionLeave(null); setActionError(''); }} maxWidth="sm" fullWidth>
          <DialogTitle fontWeight={700}>
            {actionType === 'view' ? 'Leave Details' : actionType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {actionError && <Alert severity="error">{actionError}</Alert>}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Box><Typography variant="caption" color="text.secondary">Employee</Typography>
                  <Typography variant="body2" fontWeight={600}>{actionLeave.employeeName}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" fontWeight={600}>{leaveTypeConfig[actionLeave.leaveType]?.label}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Days</Typography>
                  <Typography variant="body2" fontWeight={600}>{actionLeave.days}</Typography></Box>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Box><Typography variant="caption" color="text.secondary">From</Typography>
                  <Typography variant="body2">{fmtDate(actionLeave.fromDate)}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">To</Typography>
                  <Typography variant="body2">{fmtDate(actionLeave.toDate)}</Typography></Box>
              </Stack>
              <Box><Typography variant="caption" color="text.secondary">Reason</Typography>
                <Typography variant="body2">{actionLeave.reason}</Typography></Box>
              {actionType !== 'view' && (
                <TextField fullWidth multiline rows={2} size="small"
                  label={actionType === 'approve' ? 'Approval Comments (optional)' : 'Rejection Reason *'}
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)} />
              )}
              {actionType === 'view' && actionLeave.approverComments && (
                <Box><Typography variant="caption" color="text.secondary">Comments</Typography>
                  <Typography variant="body2">{actionLeave.approverComments}</Typography></Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => { setActionLeave(null); setActionError(''); }}>Close</Button>
            {actionType === 'approve' && (
              <Button variant="contained" color="success" onClick={handleAction} disabled={actioning}>
                {actioning ? 'Approving…' : 'Approve'}
              </Button>
            )}
            {actionType === 'reject' && (
              <Button variant="contained" color="error" onClick={handleAction} disabled={actioning}>
                {actioning ? 'Rejecting…' : 'Reject'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

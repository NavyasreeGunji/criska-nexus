import type { SxProps, Theme } from '@mui/material';

const styles: Record<string, SxProps<Theme>> = {
  holidayBtn: {
    borderColor: '#ca8a04', color: '#92400e',
    '&:hover': { bgcolor: '#fef9c3', borderColor: '#ca8a04' },
  },
  tableHeaderRow: { bgcolor: '#F8FAFC' },
  tableHeaderCellDate: { fontWeight: 700, fontSize: 14, color: '#64748b', width: '10%' },
  tableHeaderCellDev: { fontWeight: 700, fontSize: 14, color: '#64748b', width: '16%' },
  tableHeaderCellTask: { fontWeight: 700, fontSize: 14, color: '#64748b', width: '22%' },
  tableHeaderCellDesc: { fontWeight: 700, fontSize: 14, color: '#64748b' },
  tableHeaderCellHours: { fontWeight: 700, fontSize: 14, color: '#64748b', width: '8%', textAlign: 'center' },
  tableHeaderCellActions: { fontWeight: 700, fontSize: 14, color: '#64748b', width: '8%', textAlign: 'center' },
  taskCell: { maxWidth: 240 },
  taskText: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  descCell: { maxWidth: 300 },
  descText: {
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    color: 'text.secondary',
  },
  hoursCell: { textAlign: 'center' },
  actionsCell: { textAlign: 'center' },
  emptyCell: { textAlign: 'center', py: 4, color: '#94a3b8' },
  holidayIcon: { color: '#ca8a04' },
  holidayDialogTitle: { display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 },
  holidayDialogContent: { p: 0 },
  holidayHeader: { bgcolor: '#f0fdf4' },
  holidayNameHeaderCell: { fontWeight: 700, color: '#16a34a', pl: 3 },
  holidayDateHeaderCell: { fontWeight: 700, color: '#16a34a' },
  holidayNameBodyCell: { pl: 3 },
  upcomingChip: { bgcolor: '#fde047', color: '#78350f', fontWeight: 600, fontSize: 10 },
  viewDescLabel: { mb: 0.75 },
  viewDescText: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.8 },
  hoursInput: { width: 160 },
  alertBox: { mx: 3, mb: 1 },
  dateLabel: { whiteSpace: 'nowrap' },
  dateInput: { width: 140 },
};

export default styles;

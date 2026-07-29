import type { SxProps, Theme } from '@mui/material';

const styles: Record<string, SxProps<Theme>> = {
  metricsRow: { mb: 3 },
  summaryCard: { p: 2.5, textAlign: 'center' },
  tableHeaderRow: { bgcolor: '#F8FAFC' },
  tableHeaderCell: { fontWeight: 700, fontSize: 14, color: '#64748b', whiteSpace: 'nowrap' },
  devTableHeaderCell: { fontWeight: 700, fontSize: 14, color: '#64748b' },
  titleCell: { maxWidth: 220 },
  titleText: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  pointsBadge: {
    width: 28, height: 28, borderRadius: '50%',
    border: '1.5px solid', borderColor: 'primary.main', color: 'primary.main',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
  },
  overdueChip: { bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 10, height: 18 },
  emptyStateBox: { py: 6, textAlign: 'center' },
  emptyStateIcon: { fontSize: 48, color: 'text.disabled', mb: 1 },
  emptyStateCaption: { mb: 2 },
  reportPaper: { mb: 3 },
  chartPaper: { p: 2.5, mb: 3 },
  chartTitle: { mb: 2 },
  reportHeader: { mb: 1 },
  onHoldText: { color: '#ea580c' },
  devListTitle: { mb: 1 },
  storyNoText: { whiteSpace: 'nowrap' },
  dateText: { whiteSpace: 'nowrap' },
};

export const getOverdueRowSx = (isOverdue: boolean): SxProps<Theme> => ({
  ...(isOverdue ? { bgcolor: '#fff5f5' } : {}),
  '& td:first-of-type': { boxShadow: 'inset 3px 0 0 transparent', transition: 'box-shadow 0.15s' },
  '&:hover td:first-of-type': { boxShadow: 'inset 3px 0 0 #2563EB' },
});

export const getOverdueDateBoxSx = (isOverdue: boolean): SxProps<Theme> => ({
  display: 'inline-flex', alignItems: 'center', gap: 0.5,
  px: 1, py: 0.25, borderRadius: 1,
  bgcolor: isOverdue ? '#fee2e2' : 'transparent',
});

export const getOverdueDateTextSx = (isOverdue: boolean): SxProps<Theme> => ({
  whiteSpace: 'nowrap',
  fontWeight: isOverdue ? 700 : 400,
  color: isOverdue ? '#dc2626' : 'text.secondary',
});

export default styles;

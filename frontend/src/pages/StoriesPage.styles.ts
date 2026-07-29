import type { SxProps, Theme } from '@mui/material';

const styles: Record<string, SxProps<Theme>> = {
  loadingCenter: { display: 'flex', justifyContent: 'center', py: 2 },
  commentAvatar: {
    width: 28, height: 28, fontSize: 11, fontWeight: 700,
    bgcolor: 'primary.main', flexShrink: 0,
  },
  commentText: { whiteSpace: 'pre-wrap', lineHeight: 1.5 },
  sendButton: { alignSelf: 'flex-end', mb: 0.25 },
  toggleBtn: { gap: 0.75, px: 2 },
  flexGrow: { flexGrow: 1 },
  sprintGoal: { px: 2, py: 1.25, mb: 2, bgcolor: 'action.hover' },
  sprintGoalText: { wordBreak: 'break-word' },
  summaryHeaderStack: { mb: 1.5 },
  completionRow: { mb: 0.5 },
  progressBar: {
    height: 8, borderRadius: 4, bgcolor: '#E2E8F0', mb: 2,
    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#16a34a' },
  },
  tableHeaderRow: { bgcolor: 'action.hover' },
  tableHeaderCell: { fontWeight: 700, fontSize: 14, color: 'text.secondary' },
  emptyTableCell: { textAlign: 'center', py: 4 },
  titleCell: { maxWidth: 200, overflow: 'hidden' },
  titleLink: {
    cursor: 'pointer',
    '&:hover': { color: 'primary.main', textDecoration: 'underline' },
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  pointsBadge: {
    width: 28, height: 28, borderRadius: '50%', border: '1.5px solid',
    borderColor: 'primary.main', color: 'primary.main',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
  },
  alertBox: { mx: 3, mb: 1 },
  descLabel: { mb: 0.5 },
  descText: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 },
};

export const getStatBoxSx = (bg: string, color: string, isSelected: boolean): SxProps<Theme> => ({
  p: 1.5, borderRadius: 2, bgcolor: bg, textAlign: 'center', cursor: 'pointer',
  border: isSelected ? `2px solid ${color}` : '2px solid transparent',
});

export const getDueDateTextSx = (overdue: boolean): SxProps<Theme> => ({
  fontWeight: overdue ? 700 : 400,
  color: overdue ? '#dc2626' : 'text.secondary',
});

export const getViewDueDateTextSx = (overdue: boolean | null | undefined): SxProps<Theme> => ({
  color: overdue ? '#dc2626' : 'inherit',
  fontWeight: overdue ? 700 : 400,
});

export default styles;

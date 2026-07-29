import type { SxProps, Theme } from '@mui/material';

const styles: Record<string, SxProps<Theme>> = {
  metricsRow: { mb: 3 },
  metricCard: {
    p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
    cursor: 'pointer', '&:hover': { boxShadow: 4 },
  },
  panel: { p: 2.5, flex: 1 },
  flexColumn: { display: 'flex', flexDirection: 'column' },
  openBugsList: { display: 'flex', flexDirection: 'column', gap: 1 },
  bugItem: {
    py: 1, px: 1.5, gap: 1, borderRadius: 1,
    bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider',
    '&:hover': { bgcolor: 'action.selected' },
  },
  activityAvatarMinWidth: { minWidth: 42 },
  activityAvatar: {
    width: 30, height: 30, fontSize: 11, fontWeight: 700,
    bgcolor: '#2563EB18', color: '#2563EB',
  },
  activityItem: {
    py: 0.75, cursor: 'pointer', borderRadius: 1, px: 0.5,
    '&:hover': { bgcolor: 'action.hover' },
  },
  hoursText: { flexShrink: 0 },
  burndownCaption: { mb: 2 },
  activeUserAvatarMinWidth: { minWidth: 42 },
  activeUserAvatar: {
    width: 30, height: 30, fontSize: 11, fontWeight: 700,
    bgcolor: '#16a34a18', color: '#16a34a',
  },
  activeUserItem: { py: 0.75 },
  activeUserTime: { flexShrink: 0 },
  chipShrink: { flexShrink: 0 },
};

export const getMetricAvatarSx = (color: string): SxProps<Theme> => ({
  bgcolor: `${color}18`, color, width: 50, height: 50,
});

export default styles;

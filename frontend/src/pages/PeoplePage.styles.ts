import type { SxProps, Theme } from '@mui/material';

const styles: Record<string, SxProps<Theme>> = {
  gridItem: { display: 'flex' },
  devCard: {
    p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5,
    position: 'relative', width: '100%', height: 260, overflow: 'hidden',
    '&:hover .edit-btn': { opacity: 1 },
  },
  emailIcon: { fontSize: 14, color: 'text.disabled', flexShrink: 0 },
  emailStack: { minWidth: 0 },
  teamsBox: { overflow: 'hidden', maxHeight: 60 },
  teamsStack: { width: '100%' },
  roleDot: { width: 10, height: 10, borderRadius: '50%' },
  projectTypeLabel: { mb: 1 },
  teamsLabel: { mb: 1 },
  dialogStack: { mt: 1 },
};

export const getDevAvatarSx = (color: string): SxProps<Theme> => ({
  width: 52, height: 52, bgcolor: color, fontSize: 18, fontWeight: 700,
});

export const getRoleChipSx = (color: string, bg: string): SxProps<Theme> => ({
  bgcolor: bg, color, fontWeight: 700, alignSelf: 'flex-start',
});

export const getEditBtnSx = (isOwn: boolean, canDelete: boolean, isOwnId: boolean): SxProps<Theme> => ({
  position: 'absolute',
  top: 12,
  right: canDelete && !isOwnId ? 40 : 8,
  opacity: isOwn ? 0.6 : 0,
  transition: 'opacity 0.15s',
});

export const getDeleteBtnSx = (): SxProps<Theme> => ({
  position: 'absolute', top: 12, right: 8,
  opacity: 0, transition: 'opacity 0.15s', color: '#dc2626',
});

export const getProjectChipSx = (selected: boolean, color: string, bg: string): SxProps<Theme> => ({
  cursor: 'pointer', fontWeight: 600,
  bgcolor: selected ? bg : undefined,
  color: selected ? color : undefined,
  borderColor: selected ? color : undefined,
});

export default styles;

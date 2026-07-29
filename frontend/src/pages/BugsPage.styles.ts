import type { SxProps, Theme } from '@mui/material';

const styles: Record<string, SxProps<Theme>> = {
  loadingCenter: { display: 'flex', justifyContent: 'center', py: 2 },
  commentAvatar: {
    width: 28, height: 28, fontSize: 11, fontWeight: 700,
    bgcolor: 'error.main', flexShrink: 0,
  },
  commentText: { whiteSpace: 'pre-wrap', lineHeight: 1.5 },
  sendButton: { alignSelf: 'flex-end', mb: 0.25 },
  tableHeaderRow: { bgcolor: 'action.hover' },
  tableHeaderCell: { fontWeight: 700, fontSize: 14, color: 'text.secondary' },
  emptyTableCell: { textAlign: 'center', py: 4 },
  titleCell: { maxWidth: 220, overflow: 'hidden' },
  titleLink: {
    cursor: 'pointer',
    '&:hover': { color: 'error.main', textDecoration: 'underline' },
  },
  alertBox: { mx: 3, mb: 1 },
  descText: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 },
};

export default styles;

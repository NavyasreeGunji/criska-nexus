import { Box, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Props {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

const btnSx = {
  width: 34,
  height: 34,
  border: '1.5px solid',
  borderColor: 'divider',
  borderRadius: 1.5,
  bgcolor: 'background.paper',
  color: 'text.secondary',
  transition: 'all 0.15s',
  '&:hover': {
    bgcolor: 'primary.main',
    borderColor: 'primary.main',
    color: 'white',
  },
  '&.Mui-disabled': {
    opacity: 0.35,
    bgcolor: 'action.disabledBackground',
    borderColor: 'divider',
  },
  '& .MuiSvgIcon-root': { fontSize: '1.3rem' },
};

export default function TablePaginationActions({ count, page, rowsPerPage, onPageChange }: Props) {
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);
  return (
    <Box sx={{ display: 'flex', gap: 0.75, ml: 1.5 }}>
      <IconButton
        onClick={(e) => onPageChange(e, page - 1)}
        disabled={page === 0}
        size="small"
        sx={btnSx}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, page + 1)}
        disabled={page >= lastPage}
        size="small"
        sx={btnSx}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}

export const paginationSx = {
  '.MuiTablePagination-toolbar': { justifyContent: 'center', minHeight: 52 },
  '.MuiTablePagination-spacer': { display: 'none' },
};

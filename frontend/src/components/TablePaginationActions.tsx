import { Box, Button } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface Props {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

const btnSx = {
  minWidth: 0,
  width: 36,
  height: 36,
  p: 0,
  borderRadius: '6px',
  border: '1.5px solid',
  borderColor: 'divider',
  color: 'text.secondary',
  bgcolor: 'background.paper',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  '&:hover': {
    bgcolor: 'primary.main',
    borderColor: 'primary.main',
    color: 'white',
    boxShadow: '0 2px 6px rgba(37,99,235,0.35)',
  },
  '&:disabled': {
    opacity: 0.35,
    borderColor: 'divider',
    bgcolor: 'action.disabledBackground',
    boxShadow: 'none',
  },
  '& .MuiSvgIcon-root': { fontSize: '1.5rem' },
};

export default function TablePaginationActions({ count, page, rowsPerPage, onPageChange }: Props) {
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);
  return (
    <Box sx={{ display: 'flex', gap: 0.75, ml: 1.5 }}>
      <Button
        onClick={(e) => onPageChange(e, page - 1)}
        disabled={page === 0}
        variant="outlined"
        sx={btnSx}
      >
        <NavigateBeforeIcon />
      </Button>
      <Button
        onClick={(e) => onPageChange(e, page + 1)}
        disabled={page >= lastPage}
        variant="outlined"
        sx={btnSx}
      >
        <NavigateNextIcon />
      </Button>
    </Box>
  );
}

export const paginationSx = {
  '.MuiTablePagination-toolbar': { justifyContent: 'center', minHeight: 52 },
  '.MuiTablePagination-spacer': { display: 'none' },
};

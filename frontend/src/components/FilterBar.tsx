import { useState, type ReactNode } from 'react';
import { Box, Button, Stack, Collapse, Badge } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

interface FilterBarProps {
  activeCount: number;
  onClearAll: () => void;
  children: ReactNode;
  extra?: ReactNode;
}

export default function FilterBar({ activeCount, onClearAll, children, extra }: FilterBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Badge badgeContent={activeCount || undefined} color="primary">
          <Button
            size="small"
            variant={open ? 'contained' : 'outlined'}
            startIcon={<FilterListIcon />}
            onClick={() => setOpen((v) => !v)}
            sx={{ borderRadius: 2 }}
          >
            Filters
          </Button>
        </Badge>
        {activeCount > 0 && (
          <Button size="small" onClick={onClearAll} sx={{ color: 'text.secondary' }}>
            Clear all
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {extra}
      </Stack>
      <Collapse in={open}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 2, pt: 1 }} flexWrap="wrap" useFlexGap alignItems="center">
          {children}
        </Stack>
      </Collapse>
    </>
  );
}

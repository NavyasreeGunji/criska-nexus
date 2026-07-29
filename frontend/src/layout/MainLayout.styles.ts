import type { SxProps, Theme } from '@mui/material';

const styles: Record<string, SxProps<Theme>> = {
  // DrawerContent
  drawerContainer: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  iconBox: {
    width: 44, height: 44, borderRadius: '10px',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { fontSize: 14, fontWeight: 900, color: 'white', letterSpacing: 0.5 },
  companyName: { fontWeight: 900, color: 'white', letterSpacing: 1, lineHeight: 1.2, fontSize: 15 },
  companyCaption: { color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' },
  drawerDivider: { borderColor: 'rgba(255,255,255,0.08)' },
  navItemContainer: { mb: 0.5 },
  logoutBtn: { color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' }, flexShrink: 0 },
  userClickBox: { flexGrow: 1, minWidth: 0, overflow: 'hidden', cursor: 'pointer' },
  userCaption: { color: 'rgba(255,255,255,0.4)', display: 'block' },
  // Profile dialog
  profileHeader: { px: 3, pt: 3, pb: 1.5, display: 'flex', alignItems: 'center', gap: 2 },
  profileNameBox: { minWidth: 0 },
  profileCloseBtn: { ml: 'auto' },
  profileCloseBtnText: { fontSize: 16, lineHeight: 1 },
  profileTabs: { px: 2, borderBottom: 1, borderColor: 'divider' },
  profileTabItem: { fontSize: 13, minHeight: 44 },
  profileTabIcon: { fontSize: 16 },
  profileContent: { px: 3, py: 2.5 },
  profileFields: { display: 'flex', flexDirection: 'column', gap: 2 },
  profileField: { display: 'flex', gap: 2, alignItems: 'flex-start' },
  profileLabel: { width: 110, flexShrink: 0, pt: 0.25 },
  helpBox: { maxHeight: 480, overflowY: 'auto' },
  dialogActions: { px: 3, pb: 2 },
  // GlobalSearch
  searchWrapper: { position: 'relative', flexGrow: 1, maxWidth: 380, mx: 2 },
  searchIcon: { color: 'text.disabled', fontSize: 18, flexShrink: 0 },
  searchInputBase: { fontSize: 13.5, flexGrow: 1 },
  searchProgress: { flexShrink: 0 },
  clearBtn: { p: 0.25 },
  clearBtnText: { fontSize: 12, color: 'text.disabled', lineHeight: 1 },
  resultPaper: { mt: 0.5, maxHeight: 400, overflow: 'auto', borderRadius: 2 },
  sectionLabel: { px: 2, pt: 1.5, pb: 0.5, display: 'block', color: 'text.secondary' },
  resultItem: {
    px: 2, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
    '&:hover': { bgcolor: 'action.hover' },
  },
  resultInner: { minWidth: 0 },
  storyIcon: { fontSize: 16, color: 'primary.main', flexShrink: 0 },
  bugIcon: { fontSize: 16, color: 'error.main', flexShrink: 0 },
  searchDevAvatar: {
    width: 22, height: 22, fontSize: 10, fontWeight: 700,
    bgcolor: 'primary.main', flexShrink: 0,
  },
  // Main layout
  mainBox: { display: 'flex', minHeight: '100vh', bgcolor: 'background.default' },
  contentBox: { flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  appBar: { bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', color: 'inherit' },
  mobileMenuBtn: { mr: 1.5, color: 'text.primary' },
  sidebarToggleBtn: { mr: 1.5, color: 'text.secondary', '&:hover': { color: 'text.primary' } },
  pageTitleBox: { flexShrink: 0 },
  pageTitleText: { color: 'text.primary', fontSize: 17, lineHeight: 1.2 },
  pageCaption: { display: { xs: 'none', sm: 'block' } },
  themeToggleBtn: { color: 'text.secondary', '&:hover': { color: 'text.primary' } },
  mainContent: { flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 } },
};

export const getLogoBoxSx = (isOpen: boolean): SxProps<Theme> => ({
  px: isOpen ? 2.5 : 1, pt: 2.5, pb: 1.5,
  display: 'flex', alignItems: 'center',
  gap: isOpen ? 1.25 : 0,
  justifyContent: isOpen ? 'flex-start' : 'center',
  transition: 'padding 0.25s ease', minHeight: 72,
});

export const getNavListSx = (isOpen: boolean): SxProps<Theme> => ({
  px: isOpen ? 1.5 : 0.75, py: 1.5, flexGrow: 1,
});

export const getNavButtonSx = (isActive: boolean, isOpen: boolean): SxProps<Theme> => ({
  borderRadius: 2,
  color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
  bgcolor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
  '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: 'white' },
  justifyContent: isOpen ? 'flex-start' : 'center',
  px: isOpen ? 1.5 : 1, minHeight: 42,
});

export const getNavIconSx = (isOpen: boolean): SxProps<Theme> => ({
  color: 'inherit', minWidth: isOpen ? 38 : 0, justifyContent: 'center',
});

export const getUserBoxSx = (isOpen: boolean): SxProps<Theme> => ({
  px: isOpen ? 2 : 1, py: 1.5,
  display: 'flex', alignItems: 'center', gap: 1,
  justifyContent: isOpen ? 'flex-start' : 'center',
  overflow: 'hidden',
});

export const getUserAvatarSx = (bg: string): SxProps<Theme> => ({
  width: 34, height: 34, fontSize: 13, flexShrink: 0, cursor: 'pointer',
  background: bg, bgcolor: 'transparent', fontWeight: 600,
  '&:hover': { opacity: 0.85 },
});

export const getProfileAvatarSx = (bg: string): SxProps<Theme> => ({
  width: 52, height: 52, fontSize: 18, fontWeight: 700,
  background: bg, bgcolor: 'transparent',
});

export const getSearchBoxSx = (isDark: boolean): SxProps<Theme> => ({
  display: 'flex', alignItems: 'center', gap: 1,
  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0'}`,
  borderRadius: 2, px: 1.5, py: 0.5,
  '&:focus-within': { borderColor: 'primary.main', bgcolor: 'background.paper' },
  transition: 'all 0.15s',
});

export default styles;

// @hyliren/ui — Design System (Tailwind v4 + CSS Variables)

// Primitives
export { Button } from './primitives/Button';
export type { ButtonProps } from './primitives/Button';

export { Input } from './primitives/Input';
export type { InputProps } from './primitives/Input';

export { Textarea } from './primitives/Textarea';
export type { TextareaProps } from './primitives/Textarea';

export { Select } from './primitives/Select';
export type { SelectProps, SelectOption } from './primitives/Select';

export { Card } from './primitives/Card';
export type { CardProps } from './primitives/Card';

export { Badge } from './primitives/Badge';
export type { BadgeProps } from './primitives/Badge';

export { Avatar } from './primitives/Avatar';
export type { AvatarProps } from './primitives/Avatar';

// MIMYO Brand — wordmark · symbol · lockup (brand book port)
export {
  Wordmark,
  MimyoSymbol,
  MimyoLogo,
  pickWordmarkLocale,
  MIMYO_ACCENT,
  MIMYO_INK_LIGHT,
  MIMYO_INK_DARK,
  MIMYO_CURL_PATH,
  MIMYO_CURL_STROKE,
  ink,
  paper,
} from './primitives/MimyoBrand';
export type {
  WordmarkProps,
  WordmarkTone,
  WordmarkLocale,
  SymbolProps,
  SymbolVariant,
  MimyoLogoProps,
  ThemeMode,
  MimyoState,
} from './primitives/MimyoBrand';

export { SectionHeader } from './primitives/SectionHeader';
export type { SectionHeaderProps } from './primitives/SectionHeader';

export { Divider } from './primitives/Divider';
export { Spinner } from './primitives/Spinner';
export { ListPageSkeleton, DashboardSkeleton, DetailPageSkeleton, MobileCardListSkeleton } from './primitives/Skeleton';
export { Modal } from './primitives/Modal';
export type { ModalProps } from './primitives/Modal';

export { DropdownMenu } from './primitives/DropdownMenu';
export type { DropdownMenuItem } from './primitives/DropdownMenu';

export { BottomSheet } from './primitives/BottomSheet';
export type { BottomSheetProps } from './primitives/BottomSheet';

export { SideSheet } from './primitives/SideSheet';
export type { SideSheetProps } from './primitives/SideSheet';

export { ToastContainer } from './primitives/Toast';
export type { ToastItem, ToastType, ToastContainerProps } from './primitives/Toast';

export { DateFilter } from './primitives/DateFilter';
export type { DateFilterProps, DateFilterLabels, DateRange } from './primitives/DateFilter';

// DataGrid + grid-renderers 는 ag-grid 의존이라 별도 sub-entry `@hyliren/ui/datagrid` 로 분리.
// FO 처럼 DataGrid 안 쓰는 앱이 barrel 통해 ag-grid 를 transitively 끌고 가지 않도록.
// BO/PO 등 사용 앱은 `import { DataGrid } from '@hyliren/ui/datagrid'` 로 import.

// Layout
export { PageContainer } from './layout/PageContainer';
export type { PageContainerProps } from './layout/PageContainer';

export { MobileBottomCTA } from './layout/MobileBottomCTA';
export type { MobileBottomCTAProps } from './layout/MobileBottomCTA';

export { AppHeader } from './layout/AppHeader';
export type { AppHeaderProps } from './layout/AppHeader';

export { AdminPage } from './layout/AdminPage';
export type { AdminPageProps } from './layout/AdminPage';

// Article (FO/BO 공통 — 미리보기 / 본문 표시)
export { ArticleView } from './article';
export type { ArticleViewProps, ArticleTagColor } from './article';

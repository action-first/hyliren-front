// @hyliren/ui/datagrid — ag-grid 의존 컴포넌트 별도 sub-entry.
//
// 사유:
//   기존 src/index.ts (main barrel) 에 DataGrid + grid-renderers 가 포함되어 있으면,
//   FO 처럼 DataGrid 를 안 쓰는 앱도 barrel 통해 ag-grid 를 transitively transpile
//   → dev mode 에서 .next/server/vendor-chunks/ag-grid-community.js chunk 가 stale
//   되면 모든 페이지 (홈/마이페이지 등) 가 chunk 못 찾아 런타임 에러.
//
// 분리 후:
//   - FO main barrel @hyliren/ui 는 ag-grid 의존 0 (chunk 무관)
//   - BO/PO 는 @hyliren/ui/datagrid 로 명시 import → ag-grid 그쪽으로만 묶임

export { DataGrid } from './primitives/DataGrid';
export type { DataGridProps, DataGridLabels, SearchField } from './primitives/DataGrid';

export {
  badgeCellRenderer,
  dotTextRenderer,
  countBadgeCellRenderer,
  actionCellRenderer,
  detailLinkRenderer,
} from './primitives/grid-renderers';

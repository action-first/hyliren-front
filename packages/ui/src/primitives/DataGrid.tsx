'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Search, Download, RotateCcw, Calendar, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface SearchField {
  key: string;
  label: string;
  type?: 'text' | 'select' | 'dateRange';
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** 검색 행 번호 (1 또는 2, 기본 1) */
  row?: 1 | 2;
}

export interface DataGridProps<T> {
  columnDefs: ColDef<T>[];
  rowData: T[];
  searchFields?: SearchField[];
  height?: number;
  exportFileName?: string;
  onRowClick?: (data: T) => void;
  defaultColDef?: ColDef<T>;
  title?: string;
  actions?: React.ReactNode;
  /**
   * 검색 버튼 클릭 또는 Enter / 초기화 시 호출. 지정하면 server-side fetch 트리거 의도.
   * 미지정 시 클라이언트 필터링(rowData on appliedFilters)만 동작.
   */
  onSearch?: (filters: Record<string, string>) => void;
}

// ── dateRange 디폴트: 최근 30일 ──
function getDefaultDateRange() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(today.getMonth() - 1);
  return { from: monthAgo, to: today };
}

function fmtISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// row cell 의 다양한 날짜 포맷(ISO / "2026. 4. 26." / "2026.04.26" 등)을 Date 로 정규화
function parseDate(s: string): Date | null {
  if (!s) return null;
  const m = s.match(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    return new Date(+y, +mo - 1, +d);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function DataGrid<T>({
  columnDefs, rowData, searchFields, height,
  exportFileName = 'export', onRowClick, defaultColDef: userDefaultColDef,
  title, actions, onSearch,
}: DataGridProps<T>) {
  const gridRef = useRef<AgGridReact<T>>(null);
  const [gridApi, setGridApi] = useState<GridApi<T> | null>(null);

  const dateRangeField = useMemo(
    () => searchFields?.find(f => f.type === 'dateRange'),
    [searchFields],
  );

  // 디폴트 필터값(최근 한달) — 페이지 진입 즉시 적용된 상태
  const buildDefaultFilters = useCallback((): Record<string, string> => {
    if (!dateRangeField) return {};
    const { from, to } = getDefaultDateRange();
    return {
      [`${dateRangeField.key}_from`]: fmtISO(from),
      [`${dateRangeField.key}_to`]: fmtISO(to),
    };
  }, [dateRangeField]);

  // formValues = 폼 입력 중 (검색 버튼 누르기 전)
  // appliedFilters = 실제 필터링에 사용되는 적용된 값
  const [formValues, setFormValues] = useState<Record<string, string>>(buildDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(buildDefaultFilters);
  const [dateFrom, setDateFrom] = useState<Date | null>(() => dateRangeField ? getDefaultDateRange().from : null);
  const [dateTo, setDateTo] = useState<Date | null>(() => dateRangeField ? getDefaultDateRange().to : null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'all' | 'filtered' | 'selected'>('all');

  const autoHeight = useMemo(() => {
    if (height) return height;
    const rows = rowData.length;
    const calculated = 36 + (rows * 36) + 40 + 20;
    return Math.max(300, Math.min(700, calculated));
  }, [height, rowData.length]);

  const defaultColDef = useMemo<ColDef<T>>(() => ({
    sortable: true, resizable: true, suppressMovable: true,
    filter: true,
    filterParams: { buttons: ['reset', 'apply'], closeOnApply: true },
    menuTabs: ['filterMenuTab'],
    ...userDefaultColDef,
  }), [userDefaultColDef]);

  const onGridReady = useCallback((params: GridReadyEvent<T>) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  useEffect(() => {
    if (!gridApi) return;
    const handleResize = () => gridApi.sizeColumnsToFit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridApi]);

  const filteredData = useMemo(() => {
    const hasFilter = Object.values(appliedFilters).some(v => v.trim());
    if (!hasFilter) return rowData;
    return rowData.filter(row => {
      const rec = row as Record<string, unknown>;
      return Object.entries(appliedFilters).every(([key, value]) => {
        if (!value.trim()) return true;
        // 기간 필터 (dateFrom / dateTo) — Date 정규화 비교
        if (key.endsWith('_from') || key.endsWith('_to')) {
          const baseKey = key.replace(/_from$|_to$/, '');
          const raw = rec[baseKey];
          if (raw == null || raw === '') return true;
          const cellDate = parseDate(String(raw));
          const filterDate = parseDate(value);
          if (!cellDate || !filterDate) return true;
          if (key.endsWith('_from')) return cellDate.getTime() >= filterDate.getTime();
          // _to 는 해당 일 23:59:59.999 까지 포함
          const endOfDay = new Date(filterDate);
          endOfDay.setHours(23, 59, 59, 999);
          return cellDate.getTime() <= endOfDay.getTime();
        }
        // 키워드 통합 검색
        if (key === '_keyword') {
          const q = value.toLowerCase();
          return Object.values(rec).some(v => String(v ?? '').toLowerCase().includes(q));
        }
        return String(rec[key] ?? '').toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [rowData, appliedFilters]);

  function handleFieldChange(key: string, value: string) {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }

  function handleSearchClick() {
    const next = { ...formValues };
    setAppliedFilters(next);
    // 시각적 새로고침 — 그리드 셀 다시 그리기
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
    // server-side fetch 트리거 (onSearch 지정된 페이지)
    if (onSearch) {
      onSearch(next);
    }
  }

  function handleReset() {
    const defaults = buildDefaultFilters();
    setFormValues(defaults);
    setAppliedFilters(defaults);
    if (dateRangeField) {
      const { from, to } = getDefaultDateRange();
      setDateFrom(from);
      setDateTo(to);
    } else {
      setDateFrom(null);
      setDateTo(null);
    }
    if (onSearch) {
      onSearch(defaults);
    }
  }

  function handleExportClick() {
    setShowExportModal(true);
  }
  function handleExportConfirm() {
    if (!gridApi) return;
    if (exportMode === 'selected') {
      gridApi.exportDataAsCsv({ fileName: exportFileName, onlySelected: true, processCellCallback: p => p.value ?? '' });
    } else if (exportMode === 'filtered') {
      gridApi.exportDataAsCsv({ fileName: exportFileName, processCellCallback: p => p.value ?? '' });
    } else {
      gridApi.exportDataAsCsv({ fileName: exportFileName, allColumns: true, processCellCallback: p => p.value ?? '' });
    }
    setShowExportModal(false);
  }
  function handleRowClick(event: { data: T | undefined }) {
    if (event.data && onRowClick) onRowClick(event.data);
  }

  // 행별로 검색 필드 분리
  const row1Fields = searchFields?.filter(f => (f.row || 1) === 1) || [];
  const row2Fields = searchFields?.filter(f => f.row === 2) || [];

  function handleDateChange(key: string, type: 'from' | 'to', date: Date | null) {
    if (type === 'from') setDateFrom(date);
    else setDateTo(date);
    handleFieldChange(`${key}_${type}`, date ? fmtISO(date) : '');
  }

  function renderField(field: SearchField) {
    if (field.type === 'dateRange') {
      return (
        <div key={field.key} className="datagrid-search-group" style={{ flex: 1.5 }}>
          <label>{field.label}</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div className="datepicker-wrapper">
              <Calendar size={14} className="datepicker-icon" />
              <DatePicker
                selected={dateFrom}
                onChange={(date: Date | null) => handleDateChange(field.key, 'from', date)}
                dateFormat="yyyy.MM.dd"
                placeholderText="시작일"
                locale={ko}
                className="datepicker-input"
              />
            </div>
            <span style={{ color: '#9ca3af', fontSize: 13, flexShrink: 0 }}>~</span>
            <div className="datepicker-wrapper">
              <Calendar size={14} className="datepicker-icon" />
              <DatePicker
                selected={dateTo}
                onChange={(date: Date | null) => handleDateChange(field.key, 'to', date)}
                dateFormat="yyyy.MM.dd"
                placeholderText="종료일"
                locale={ko}
                className="datepicker-input"
                minDate={dateFrom || undefined}
              />
            </div>
          </div>
        </div>
      );
    }
    if (field.type === 'select') {
      return (
        <div key={field.key} className="datagrid-search-group datagrid-search-group--fixed">
          <label>{field.label}</label>
          <select value={formValues[field.key] || ''} onChange={e => handleFieldChange(field.key, e.target.value)}>
            <option value="">전체</option>
            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div key={field.key} className="datagrid-search-group">
        <label>{field.label}</label>
        <div className="search-input-with-icon">
          <Search size={14} />
          <input
            type="text"
            placeholder={field.placeholder || '검색'}
            value={formValues[field.key] || ''}
            onChange={e => handleFieldChange(field.key, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearchClick(); } }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ═══ 1. 검색 카드 ═══ */}
      {searchFields && searchFields.length > 0 && (
        <div className="datagrid-search-card">
          <div className="datagrid-search-grid">
            {/* 필드 영역 (1줄 + 2줄) — 버튼과 분리 */}
            <div className="datagrid-search-fields">
              {row1Fields.length > 0 && (
                <div className="datagrid-search-row">
                  {row1Fields.map(renderField)}
                </div>
              )}
              <div className="datagrid-search-row">
                {row2Fields.map(renderField)}
              </div>
            </div>
            {/* 버튼 영역 — 우측 하단 정렬 */}
            <div className="datagrid-search-actions">
              <button type="button" className="datagrid-btn datagrid-btn--primary" onClick={handleSearchClick}>
                <Search size={14} /> 검색
              </button>
              <button type="button" className="datagrid-btn" onClick={handleReset}>
                <RotateCcw size={14} /> 초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 2. 결과 바 ═══ */}
      <div className="datagrid-result-bar">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <h3>{title || '목록'}</h3>
          <span className="result-count">총 {filteredData.length.toLocaleString()}건</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {actions}
          <button type="button" className="datagrid-btn" onClick={handleExportClick}>
            <Download size={13} /> 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* ═══ 3. AG Grid ═══ */}
      <div className="datagrid-grid-wrapper">
        <div className="ag-theme-alpine" style={{ height: autoHeight, width: '100%' }}>
          <AgGridReact<T>
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={handleRowClick}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            suppressCellFocus={true}
            theme="legacy"
            rowHeight={36}
            headerHeight={36}
            overlayNoRowsTemplate="<span style='font-size:14px;color:#9ca3af;padding:40px 0;display:block;text-align:center'>데이터가 없습니다</span>"
          />
        </div>
      </div>

      {/* ═══ 엑셀 다운로드 모달 ═══ */}
      {showExportModal && (
        <>
          <div className="export-modal-backdrop" onClick={() => setShowExportModal(false)} />
          <div className="export-modal">
            <div className="export-modal-header">
              <h2>엑셀 다운로드</h2>
              <button type="button" onClick={() => setShowExportModal(false)} className="export-modal-close">
                <X size={15} />
              </button>
            </div>
            <p className="export-modal-desc">다운로드할 데이터 범위를 선택하세요</p>

            <div className="export-modal-options">
              <label className={`export-modal-option ${exportMode === 'all' ? 'export-modal-option--active' : ''}`}>
                <input type="radio" name="exportMode" checked={exportMode === 'all'} onChange={() => setExportMode('all')} />
                <div>
                  <span className="export-modal-option-title">전체 데이터 다운로드</span>
                  <span className="export-modal-option-desc">시스템에 등록된 모든 데이터를 다운로드합니다 ({rowData.length}개)</span>
                </div>
              </label>
              <label className={`export-modal-option ${exportMode === 'filtered' ? 'export-modal-option--active' : ''}`}>
                <input type="radio" name="exportMode" checked={exportMode === 'filtered'} onChange={() => setExportMode('filtered')} />
                <div>
                  <span className="export-modal-option-title">현재 조회된 데이터 다운로드</span>
                  <span className="export-modal-option-desc">현재 적용된 필터와 검색 조건에 맞는 데이터만 다운로드합니다</span>
                </div>
              </label>
              <label className={`export-modal-option ${exportMode === 'selected' ? 'export-modal-option--active' : ''}`} style={{ opacity: 0.4, pointerEvents: 'none' }}>
                <input type="radio" name="exportMode" disabled />
                <div>
                  <span className="export-modal-option-title">선택한 데이터 다운로드</span>
                  <span className="export-modal-option-desc">데이터를 먼저 선택해주세요</span>
                </div>
              </label>
            </div>

            <div className="export-modal-footer">
              <button type="button" className="datagrid-btn" onClick={() => setShowExportModal(false)}>취소</button>
              <button type="button" className="export-modal-confirm" onClick={handleExportConfirm}>
                <Download size={14} /> 다운로드
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

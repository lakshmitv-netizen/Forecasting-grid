import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { MeasureData, GridRow as GridRowType } from '../types';
import GridRowComponent from './GridRow';
import GridFooter from './GridFooter';
import CellNotePopover from './CellNotePopover';
import {
  propagateUpward,
  propagateDownward,
  updateCrossMeasureDependencies,
  findRowById,
  distributeProportionally,
} from '../utils/valuePropagation';
import {
  extractSearchTerms,
  rowMatchesSearch,
  getMatchingTimePeriodKeys,
  separateSearchTerms,
} from '../utils/searchUtils';
import { SearchHighlight } from './SearchHighlight';
import '../styles/components/Grid.css';

interface HierarchicalGridProps {
  data: MeasureData[];
  onDataChange?: (newData: MeasureData[]) => void;
  selectedDimensionLevels?: Set<string>;
  selectedTimeGranularities?: Set<string>;
  columnWidth?: number; // Column width in pixels for time period columns
  onExpandAllRows?: (handler: () => void) => void; // Callback to register expand handler
  onCollapseAllRows?: (handler: () => void) => void; // Callback to register collapse handler
  onSettingsClick?: () => void; // Callback to open settings panel
  initialFocusedCell?: { rowId: string; monthKey: string } | null; // Initial focused cell when switching layouts
  onFocusedCellChange?: (focus: { rowId: string; monthKey: string } | null) => void; // Callback when focused cell changes
  searchTerm?: string; // Search term for filtering rows and columns
  onEditHistory?: (entry: { cellKey: string; rowId: string; timeKey?: string; oldValue: number; newValue: number; note?: string }) => void; // Callback to track edit history
  onAddAdjustmentNote?: (note: Omit<import('../types/adjustmentNote').AdjustmentNote, 'id' | 'timestamp' | 'userId' | 'userName'>) => void; // Callback to add adjustment note
  cellEditHistory?: import('../types/editHistory').CellEditHistoryEntry[]; // Edit history to check for notes
  onCellFocusWithHistory?: (cellKey: string, cellRect: DOMRect | null, cellValue?: number, isLocked?: boolean) => void; // Callback when a cell is focused
  lockedCells?: Set<string>; // Set of locked cell keys that cannot be edited or impacted
  onCellContextMenu?: (e: React.MouseEvent, cellKey: string, cellValue: number, isLocked: boolean, isEditable: boolean) => void; // Callback for right-click context menu
  onUndoHandler?: (handler: () => void) => void; // Callback to register undo handler
  onRedoHandler?: (handler: () => void) => void; // Callback to register redo handler
  onCanUndoChange?: (canUndo: boolean) => void; // Callback when undo availability changes
  onCanRedoChange?: (canRedo: boolean) => void; // Callback when redo availability changes
  onCommitDrafts?: () => void; // Callback to commit draft edits to saved history (called on Save)
  onClearDrafts?: () => void; // Callback to clear draft edits (called on Cancel)
}

const HierarchicalGrid: React.FC<HierarchicalGridProps> = ({ 
  data, 
  onDataChange, 
  selectedDimensionLevels, 
  selectedTimeGranularities,
  onAddAdjustmentNote, 
  columnWidth = 100, 
  onExpandAllRows, 
  onCollapseAllRows,
  onCellFocusWithHistory, 
  onSettingsClick,
  initialFocusedCell,
  onFocusedCellChange,
  searchTerm = '',
  onEditHistory,
  cellEditHistory = [],
  lockedCells = new Set<string>(),
  onUndoHandler,
  onRedoHandler,
  onCanUndoChange,
  onCanRedoChange,
  onCellContextMenu,
  onCommitDrafts,
  onClearDrafts
}) => {
  // Store onEditHistory in a ref so it's always available in callbacks
  const onEditHistoryRef = useRef(onEditHistory);
  useEffect(() => {
    onEditHistoryRef.current = onEditHistory;
  }, [onEditHistory]);
  
  // Debug: Log when onEditHistory prop changes
  useEffect(() => {
    const logMessage = `[HierarchicalGrid] Component mounted/updated, onEditHistory exists: ${!!onEditHistory}`;
    console.error('========================================');
    console.error(logMessage);
    console.error('onEditHistory type:', typeof onEditHistory);
    console.error('========================================');
    console.log(logMessage);
    console.warn(logMessage);
    // Store on window for debugging
    if (typeof window !== 'undefined') {
      (window as any).hierarchicalGridOnEditHistory = onEditHistory;
    }
    if (onEditHistory) {
      console.error('[HierarchicalGrid] Testing onEditHistory callback...');
      try {
        onEditHistory({
          cellKey: 'test-cell-key',
          rowId: 'test-row-id',
          timeKey: 'jan2026',
          oldValue: 100,
          newValue: 200,
        });
        console.error('[HierarchicalGrid] ✓ Test callback succeeded');
      } catch (error) {
        console.error('[HierarchicalGrid] ✗ Test callback failed:', error);
      }
    } else {
      console.error('[HierarchicalGrid] ⚠⚠⚠ onEditHistory is NOT available! ⚠⚠⚠');
    }
  }, [onEditHistory]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [gridData, setGridData] = useState<MeasureData[]>(data);
  // Track preserved values for year/quarter edits at account/category levels
  const preservedValuesRef = useRef<Map<string, { monthKey: keyof GridRowType['values']; value: number }>>(new Map());
  // Track focused cell for keyboard navigation
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; monthKey: keyof GridRowType['values'] } | null>(
    initialFocusedCell ? { rowId: initialFocusedCell.rowId, monthKey: initialFocusedCell.monthKey as keyof GridRowType['values'] } : null
  );
  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  // Track editing cell for note popover - use a ref to track active input
  const [editingCell, setEditingCell] = useState<{ rowId: string; monthKey: keyof GridRowType['values'] } | null>(null);
  const editingInputRef = useRef<HTMLInputElement | null>(null);
  
  // Track column widths per column for auto-expansion
  const [columnWidths, setColumnWidths] = useState<Map<string, number>>(new Map());
  const columnWidthsRef = useRef<Map<string, number>>(new Map());
  const previousColumnWidthRef = useRef<number>(columnWidth);
  const isSliderAdjustingRef = useRef<boolean>(false);
  const previousExpandedRowsRef = useRef<Set<string>>(new Set());
  
  // Reset auto-expanded widths when user manually changes column width via slider
  useEffect(() => {
    if (previousColumnWidthRef.current !== columnWidth) {
      // User changed slider - reset auto-expanded widths and mark as adjusting
      isSliderAdjustingRef.current = true;
      columnWidthsRef.current.clear();
      setColumnWidths(new Map());
      previousColumnWidthRef.current = columnWidth;
      
      // Clear the flag after a delay to allow slider to settle
      setTimeout(() => {
        isSliderAdjustingRef.current = false;
      }, 300);
    }
  }, [columnWidth]);
  
  // Listen for input focus events globally
  useEffect(() => {
    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && target.classList.contains('cell-input')) {
        const cellKey = target.getAttribute('data-cell-key');
        if (cellKey) {
          const [rowId, monthKey] = cellKey.split('-');
          editingInputRef.current = target;
          setEditingCell({ rowId, monthKey: monthKey as keyof GridRowType['values'] });
        }
      }
    };
    
    const handleInputBlur = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && target.classList.contains('cell-input')) {
        // Delay clearing to allow save to complete
        setTimeout(() => {
          if (document.activeElement !== target) {
            editingInputRef.current = null;
            setEditingCell(null);
          }
        }, 100);
      }
    };
    
    document.addEventListener('focusin', handleInputFocus);
    document.addEventListener('focusout', handleInputBlur);
    
    return () => {
      document.removeEventListener('focusin', handleInputFocus);
      document.removeEventListener('focusout', handleInputBlur);
    };
  }, []);

  // Restore focus when initialFocusedCell changes (layout switch)
  useEffect(() => {
    if (initialFocusedCell) {
      const cellKey = `${initialFocusedCell.rowId}-${initialFocusedCell.monthKey}`;
      setTimeout(() => {
        const cellElement = cellRefs.current.get(cellKey);
        if (cellElement) {
          cellElement.focus();
          setFocusedCell({ 
            rowId: initialFocusedCell.rowId, 
            monthKey: initialFocusedCell.monthKey as keyof GridRowType['values'] 
          });
        }
      }, 100);
    }
  }, [initialFocusedCell]);

  // Notify parent when focus changes
  const handleFocusChange = useCallback((focus: { rowId: string; monthKey: keyof GridRowType['values'] } | null) => {
    setFocusedCell(focus);
    if (onFocusedCellChange) {
      onFocusedCellChange(focus ? { rowId: focus.rowId, monthKey: focus.monthKey as string } : null);
    }
  }, [onFocusedCellChange]);
  
  // Memoized callback for cell edit state changes to prevent re-renders
  const handleCellEditStateChange = useCallback((isEditing: boolean, rowId: string, monthKey: string) => {
    if (isEditing) {
      setEditingCell({ rowId, monthKey: monthKey as keyof GridRowType['values'] });
    } else {
      setEditingCell(null);
    }
  }, []);
  
  // Track edited cells and their original values to show delta
  const [editedCells, setEditedCells] = useState<Map<string, number>>(new Map()); // key: `${rowId}-${monthKey}`, value: originalValue
  // Track impacted cells (cells that changed due to editing another cell) and their original values
  const [impactedCells, setImpactedCells] = useState<Map<string, number>>(new Map()); // key: `${rowId}-${monthKey}`, value: originalValue
  // Track saved edited cells (cells that were edited and saved - these keep the icon but no badge)
  // Map key: `${rowId}-${monthKey}`, value: icon color ('#ff5d2d' for increment, '#2E76E1' for decrement)
  const [savedEditedCells, setSavedEditedCells] = useState<Map<string, string>>(new Map());
  // Track unsaved notes for dirty cells (cells that are edited but not saved)
  // Map key: `${rowId}-${monthKey}`, value: note text
  const [unsavedNotes, setUnsavedNotes] = useState<Map<string, string>>(new Map());
  // Operation-based undo/redo history
  interface UndoRedoOperation {
    id: string;
    cellKey: string;
    rowId: string;
    monthKey: keyof GridRowType['values'];
    operationType: 'value' | 'note' | 'both'; // What was changed
    oldValue?: number; // Value before this operation
    newValue?: number; // Value after this operation
    oldNote?: string; // Note before this operation
    newNote?: string; // Note after this operation
    timestamp: Date;
    // Store the state of impacted cells before this operation
    impactedCellsBefore: Map<string, number>;
    // Store the state of edited cells before this operation
    editedCellsBefore: Map<string, number>;
  }
  
  const [undoRedoHistory, setUndoRedoHistory] = useState<UndoRedoOperation[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyIndexRef = useRef<number>(-1); // Keep ref in sync for use in callbacks
  const [showOnlyImpactedKPI, setShowOnlyImpactedKPI] = useState<boolean>(false);
  const originalDataRef = useRef<MeasureData[]>(JSON.parse(JSON.stringify(data)));
  
  // Keep ref in sync with state
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  // Calculate measure values from children and aggregate time periods
  // Excludes locked cells from sums and aggregations
  const calculateMeasureValues = useCallback((dataToCalculate: MeasureData[], skipTimeAggregationForRows?: Set<string>, lockedCellsSet?: Set<string>): MeasureData[] => {
    const updated = JSON.parse(JSON.stringify(dataToCalculate));
    const skipSet = skipTimeAggregationForRows || new Set<string>();
    const lockedSet = lockedCellsSet || new Set<string>();
    
    // Helper to check if a cell is locked
    const isCellLocked = (rowId: string, monthKey: keyof GridRowType['values']) => {
      return lockedSet.has(`${rowId}-${monthKey}`);
    };
    
    // Helper to calculate time aggregations for a row
    // Locked cells contribute their current value to aggregations, but locked aggregations themselves are not recalculated
    const calculateTimeAggregations = (row: GridRowType | MeasureData) => {
      // Only recalculate if this row is not in the skip set
      if (!skipSet.has(row.id)) {
        const rowId = row.id;
        // Calculate quarters from months - include locked months (they contribute their current value)
        // But don't recalculate if the quarter itself is locked
        if (!isCellLocked(rowId, 'q1')) {
          row.values.q1 = row.values.jan2026 + row.values.feb2026 + row.values.mar2026;
        }
        if (!isCellLocked(rowId, 'q2')) {
          row.values.q2 = row.values.apr2026 + row.values.may2026 + row.values.jun2026;
        }
        if (!isCellLocked(rowId, 'q3')) {
          row.values.q3 = row.values.jul2026 + row.values.aug2026 + row.values.sep2026;
        }
        if (!isCellLocked(rowId, 'q4')) {
          row.values.q4 = row.values.oct2026 + row.values.nov2026 + row.values.dec2026;
        }
        
        // Calculate year from quarters - include locked quarters (they contribute their current value)
        // But don't recalculate if the year itself is locked
        if (!isCellLocked(rowId, 'year')) {
          row.values.year = row.values.q1 + row.values.q2 + row.values.q3 + row.values.q4;
        }
      }
    };
    
    // Recursively calculate aggregations for all rows
    const calculateRowAggregations = (row: GridRowType | MeasureData) => {
      if (row.children && row.children.length > 0) {
        // First calculate children aggregations
        row.children.forEach(calculateRowAggregations);
        
        // For parent rows, sum children values for MONTHS only
        // Year and quarters are calculated from months, not summed from children
        const monthKeys: (keyof GridRowType['values'])[] = [
          'jan2026', 'feb2026', 'mar2026', 'apr2026', 'may2026', 'jun2026',
          'jul2026', 'aug2026', 'sep2026', 'oct2026', 'nov2026', 'dec2026',
        ];
        
        // Sum months from children ONLY if this row is not in the skip set
        // (If year/quarter was edited, we've already distributed to months, so don't recalculate)
        // Locked children contribute their current value to parent sums, but don't receive propagation
        if (!skipSet.has(row.id)) {
          for (const monthKey of monthKeys) {
            const rowId = row.id;
            // Skip if this parent cell itself is locked (don't recalculate locked parent cells)
            if (isCellLocked(rowId, monthKey)) {
              continue;
            }
            // Sum all children (including locked ones - they contribute their current value)
            row.values[monthKey] = row.children.reduce(
              (sum: number, child: GridRowType) => {
                return sum + child.values[monthKey];
              },
              0
            );
          }
          // After summing months, calculate quarters and year from months
          calculateTimeAggregations(row);
        }
        // If row is in skip set, don't recalculate anything - preserve the edited values
      } else {
        // Leaf node - calculate time aggregations from months (unless skipped)
        calculateTimeAggregations(row);
      }
    };
    
    // Calculate for all measures
    for (const measure of updated) {
      // If measure is in skip set, don't recalculate its time aggregations
      // But still need to calculate children (they might not be skipped)
      if (!skipSet.has(measure.id)) {
        calculateRowAggregations(measure);
      } else {
        // Measure is skipped - still calculate children, but don't sum months or recalculate time aggregations
        if (measure.children && measure.children.length > 0) {
          measure.children.forEach(calculateRowAggregations);
          // Don't sum months from children or recalculate time aggregations - preserve the edited values
        }
      }
    }
    
    return updated;
  }, [lockedCells]);

  // Update local state when prop changes and recalculate measure values
  React.useEffect(() => {
    // Build skip set from preserved values (only the currently edited cell, if any)
    const skipSet = new Set<string>();
    preservedValuesRef.current.forEach((_, rowId) => {
      skipSet.add(rowId);
    });
    
    const calculatedData = calculateMeasureValues(data, skipSet, lockedCells);
    
    // After recalculation, restore preserved values ONLY for the currently edited cell
    // This ensures that when data prop changes (e.g., from external source),
    // the currently edited cell's value is preserved
    if (preservedValuesRef.current.size > 0) {
      preservedValuesRef.current.forEach((preserved, rowId) => {
        // Check if it's a measure row
        const measure = calculatedData.find(m => m.id === rowId);
        if (measure) {
          // Restore measure row value
          measure.values[preserved.monthKey] = preserved.value;
        } else {
          // It's a child row, find and restore it
          const updateRowValue = (rows: GridRowType[]) => {
            for (const row of rows) {
              if (row.id === rowId) {
                row.values[preserved.monthKey] = preserved.value;
                return true;
              }
              if (row.children && updateRowValue(row.children)) {
                return true;
              }
            }
            return false;
          };
          
          for (const measureData of calculatedData) {
            if (measureData.children && updateRowValue(measureData.children)) {
              break;
            }
          }
        }
      });
    }
    
    setGridData(calculatedData);
  }, [data, calculateMeasureValues]);

  // Expand all rows by default
  useEffect(() => {
    const allRowIds = new Set<string>();
    const collectRowIds = (rows: GridRowType[]) => {
      for (const row of rows) {
        if (row.children && row.children.length > 0) {
          allRowIds.add(row.id);
          collectRowIds(row.children);
        }
      }
    };
    
    // Collect from all measures
    for (const measure of gridData) {
      if (measure.children && measure.children.length > 0) {
        allRowIds.add(measure.id);
        collectRowIds(measure.children);
      }
    }
    
    setExpandedRows(allRowIds);
  }, [gridData]);

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Expand all rows that have children
  const handleExpandAll = useCallback(() => {
    const allExpandableIds = new Set<string>();
    
    // Recursive function to collect all row IDs that have children
    const collectExpandableIds = (rows: GridRowType[]) => {
      for (const row of rows) {
        if (row.children && row.children.length > 0) {
          allExpandableIds.add(row.id);
          collectExpandableIds(row.children);
        }
      }
    };
    
    // Collect from all measures
    for (const measure of gridData) {
      if (measure.children && measure.children.length > 0) {
        allExpandableIds.add(measure.id);
        collectExpandableIds(measure.children);
      }
    }
    
    setExpandedRows(allExpandableIds);
  }, [gridData]);

  // Collapse all rows
  const handleCollapseAll = useCallback(() => {
    setExpandedRows(new Set());
  }, []);

  // Handle toggle for "Show Only Impacted KPI" - collapse all when checked
  const handleToggleShowOnlyImpactedKPI = useCallback((checked: boolean) => {
    setShowOnlyImpactedKPI(checked);
    if (checked) {
      // Collapse all rows when showing only impacted measures
      setExpandedRows(new Set());
    }
  }, []);
  
  // Register handlers with parent component
  useEffect(() => {
    if (onExpandAllRows) {
      onExpandAllRows(handleExpandAll);
    }
    if (onCollapseAllRows) {
      onCollapseAllRows(handleCollapseAll);
    }
  }, [handleExpandAll, handleCollapseAll, onExpandAllRows, onCollapseAllRows]);


  const formatValue = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, // No decimals in cell values
    });
  };

  // Get visible time headers with labels (filtered by granularity and search) - memoized
  const visibleTimeHeaders = useMemo(() => {
    const allTimeKeys: { key: keyof GridRowType['values']; granularity: string; label: string }[] = [
      { key: 'year', granularity: 'year', label: 'FY26' },
      { key: 'q1', granularity: 'quarter', label: 'Q1' },
      { key: 'q2', granularity: 'quarter', label: 'Q2' },
      { key: 'q3', granularity: 'quarter', label: 'Q3' },
      { key: 'q4', granularity: 'quarter', label: 'Q4' },
      { key: 'jan2026', granularity: 'month', label: 'Jan' },
      { key: 'feb2026', granularity: 'month', label: 'Feb' },
      { key: 'mar2026', granularity: 'month', label: 'Mar' },
      { key: 'apr2026', granularity: 'month', label: 'Apr' },
      { key: 'may2026', granularity: 'month', label: 'May' },
      { key: 'jun2026', granularity: 'month', label: 'Jun' },
      { key: 'jul2026', granularity: 'month', label: 'Jul' },
      { key: 'aug2026', granularity: 'month', label: 'Aug' },
      { key: 'sep2026', granularity: 'month', label: 'Sep' },
      { key: 'oct2026', granularity: 'month', label: 'Oct' },
      { key: 'nov2026', granularity: 'month', label: 'Nov' },
      { key: 'dec2026', granularity: 'month', label: 'Dec' },
    ];

    // Filter by granularity first
    let filteredKeys = allTimeKeys;
    if (selectedTimeGranularities && selectedTimeGranularities.size > 0) {
      filteredKeys = allTimeKeys.filter(tk => selectedTimeGranularities.has(tk.granularity));
    }

    // Apply search filter if search term exists
    if (searchTerm && searchTerm.trim()) {
      const searchTerms = extractSearchTerms(searchTerm);
      if (searchTerms.length > 0) {
        const { timeTerms, otherTerms } = separateSearchTerms(searchTerms);
        console.log('[GRID] getVisibleTimeHeaders - Search terms:', { searchTerm, searchTerms, timeTerms, otherTerms });
        if (timeTerms.length > 0) {
          // Filter columns based on time period search
          const matchingKeys = getMatchingTimePeriodKeys(timeTerms);
          console.log('[GRID] getVisibleTimeHeaders - Matching time period keys:', Array.from(matchingKeys));
          // Only show columns that match or are parents/children of matches
          filteredKeys = filteredKeys.filter(tk => matchingKeys.has(tk.key));
          console.log('[GRID] getVisibleTimeHeaders - Filtered keys after search:', filteredKeys.map(tk => tk.key));
        }
        // If there are other terms (non-time), don't filter columns - show all
        // This allows searching for row names without filtering columns
      }
    }

    return filteredKeys.map(tk => ({
      key: tk.key,
      label: tk.label,
    }));
  }, [selectedTimeGranularities, searchTerm]);

  // Track previous visible headers to detect structural changes
  const previousVisibleHeadersRef = useRef<string>('');
  
  // Measure cell content and auto-expand columns when content overflows
  useEffect(() => {
    // Don't auto-expand while user is adjusting slider
    if (isSliderAdjustingRef.current) {
      return;
    }
    
    // Only run auto-expansion on structural changes (header changes, expanded rows), not on value changes
    const currentHeadersKey = visibleTimeHeaders.map(h => h.key).join(',');
    const headersChanged = previousVisibleHeadersRef.current !== currentHeadersKey;
    const expandedRowsChanged = expandedRows.size !== previousExpandedRowsRef.current?.size;
    
    // Update refs
    previousVisibleHeadersRef.current = currentHeadersKey;
    previousExpandedRowsRef.current = expandedRows;
    
    // Skip auto-expansion if only values changed (not structure)
    if (!headersChanged && !expandedRowsChanged) {
      return;
    }
    
    const measureAndExpandColumns = () => {
      const newColumnWidths = new Map<string, number>();
      const padding = 20; // Account for cell padding (left + right)
      const minColumnWidth = columnWidth;
      
      // Measure all visible cells for each column
      visibleTimeHeaders.forEach((header) => {
        let maxWidth = minColumnWidth;
        
        // Check header width
        const headerElement = document.querySelector(`th[data-column-key="${header.key}"]`) as HTMLElement;
        if (headerElement) {
          // Temporarily set width to auto to measure natural width
          const originalWidth = headerElement.style.width;
          headerElement.style.width = 'auto';
          const headerWidth = headerElement.scrollWidth;
          headerElement.style.width = originalWidth;
          maxWidth = Math.max(maxWidth, headerWidth + padding);
        }
        
        // Check all cells in this column
        cellRefs.current.forEach((cellElement, cellKey) => {
          const [_rowId, monthKey] = cellKey.split('-');
          if (monthKey === header.key) {
            // Temporarily set width to auto to measure natural content width
            const originalWidth = cellElement.style.width;
            const originalMinWidth = cellElement.style.minWidth;
            cellElement.style.width = 'auto';
            cellElement.style.minWidth = 'auto';
            
            // Measure the actual content width
            const contentWidth = cellElement.scrollWidth;
            
            // Restore original styles
            cellElement.style.width = originalWidth;
            cellElement.style.minWidth = originalMinWidth;
            
            const requiredWidth = contentWidth + padding;
            maxWidth = Math.max(maxWidth, requiredWidth);
          }
        });
        
        // Set column width - use slider value as base, only expand if content needs more
        // Only set custom width if content requires more than slider value
        if (maxWidth > minColumnWidth) {
          newColumnWidths.set(header.key, Math.ceil(maxWidth) + 12);
        } else {
          // Content fits in slider width - don't override slider value
          // Don't add to map, will use columnWidth as fallback
        }
      });
      
      // Only update if widths changed significantly (avoid infinite loops)
      const currentWidths = columnWidthsRef.current;
      let hasChanges = false;
      
      // Check if any column widths changed
      if (currentWidths.size !== newColumnWidths.size) {
        hasChanges = true;
      } else {
        // Check existing columns
        currentWidths.forEach((width, key) => {
          const newWidth = newColumnWidths.get(key);
          if (newWidth === undefined) {
            // Column no longer needs expansion - remove it
            hasChanges = true;
          } else if (Math.abs(width - newWidth) > 2) {
            // Width changed significantly
            hasChanges = true;
          }
        });
        // Check for new columns that need expansion
        newColumnWidths.forEach((_width, key) => {
          if (!currentWidths.has(key)) {
            hasChanges = true;
          }
        });
      }
      
      if (hasChanges) {
        columnWidthsRef.current = newColumnWidths;
        setColumnWidths(newColumnWidths);
      }
    };
    
    // Measure after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(measureAndExpandColumns, 150);
    
    // Also measure on window resize
    window.addEventListener('resize', measureAndExpandColumns);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureAndExpandColumns);
    };
  }, [visibleTimeHeaders, columnWidth, expandedRows]);

  // Get visible time keys based on selected granularities and search - use visibleTimeHeaders
  const getVisibleTimeKeys = useCallback((): (keyof GridRowType['values'])[] => {
    return visibleTimeHeaders.map(h => h.key);
  }, [visibleTimeHeaders]);

  // Helper function to deep copy a row and all its children recursively
  const deepCopyRow = useCallback((row: GridRowType): GridRowType => {
    return {
      ...row,
      values: { ...row.values },
      children: row.children ? row.children.map(child => deepCopyRow(child)) : undefined
    };
  }, []);

  // Filter rows by selected dimension types
  // If a parent is deselected but child is selected, show child directly under grandparent
  const filterRowsByType = (
    row: GridRowType,
    selectedTypes: Set<string>
  ): GridRowType | GridRowType[] | null => {
    // Always show measure rows (they are not dimension levels)
    if (row.type === 'measure') {
      // Recursively filter children and flatten promoted children
      if (row.children && row.children.length > 0) {
        const filteredChildren: GridRowType[] = [];
        
        for (const child of row.children) {
          const result = filterRowsByType(child, selectedTypes);
          if (result !== null) {
            if (Array.isArray(result)) {
              // Promoted children (array) - add them directly
              filteredChildren.push(...result);
            } else {
              // Single child - add it
              filteredChildren.push(result);
            }
          }
        }
        
        return {
          ...row,
          values: { ...row.values }, // Deep copy values to avoid stale references
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        };
      }
      return { ...row, values: { ...row.values } }; // Copy to avoid stale references
    }
    
    // If row type is selected, show it and filter children normally
    if (selectedTypes.has(row.type)) {
      if (row.children && row.children.length > 0) {
        const filteredChildren: GridRowType[] = [];
        
        for (const child of row.children) {
          const result = filterRowsByType(child, selectedTypes);
          if (result !== null) {
            if (Array.isArray(result)) {
              filteredChildren.push(...result);
            } else {
              filteredChildren.push(result);
            }
          }
        }
        
        return {
          ...row,
          values: { ...row.values }, // Deep copy values to avoid stale references
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        };
      }
      return { ...row, values: { ...row.values } }; // Copy to avoid stale references
    }
    
    // If row type is not selected, check if any descendants match selected types
    // If so, promote those descendants to this level (skip this parent)
    if (row.children && row.children.length > 0) {
      const promotedChildren: GridRowType[] = [];
      
      for (const child of row.children) {
        const result = filterRowsByType(child, selectedTypes);
        if (result !== null) {
          if (Array.isArray(result)) {
            // Already promoted children - add them directly
            promotedChildren.push(...result);
          } else {
            // Single child result
            if (selectedTypes.has(child.type)) {
              // Child matches selected types - add it directly
              promotedChildren.push(result);
            } else if (result.children && result.children.length > 0) {
              // Child doesn't match but has matching descendants - promote those descendants
              promotedChildren.push(...result.children);
            }
          }
        }
      }
      
      // If we have promoted children, return them as an array (to be flattened by parent)
      if (promotedChildren.length > 0) {
        return promotedChildren;
      }
    }
    
    // No matching descendants, filter out this row
    return null;
  };

  // Update a single value in the data structure
  const updateValue = useCallback((
    rowId: string,
    monthKey: keyof GridRowType['values'],
    newValue: number,
    dataToUpdate: MeasureData[]
  ): MeasureData[] => {
    const newData = JSON.parse(JSON.stringify(dataToUpdate)); // Deep clone
    
    const updateRowValue = (rows: GridRowType[], id: string): boolean => {
      for (const row of rows) {
        if (row.id === id) {
          row.values[monthKey] = newValue;
          return true;
        }
        if (row.children && updateRowValue(row.children, id)) {
          return true;
        }
      }
      return false;
    };

    const updateMeasureValue = (measures: MeasureData[], id: string): boolean => {
      for (const measure of measures) {
        if (measure.id === id) {
          measure.values[monthKey] = newValue;
          return true;
        }
        if (updateRowValue(measure.children, id)) {
          return true;
        }
      }
      return false;
    };

    // Check if it's a measure row
    const isMeasure = newData.some((m: MeasureData) => m.id === rowId);
    if (isMeasure) {
      updateMeasureValue(newData, rowId);
    } else {
      updateRowValue(newData.flatMap((m: MeasureData) => m.children), rowId);
    }

    return newData;
  }, []);

  // Helper function to recalculate time aggregations for a row
  const recalculateTimeAggregations = useCallback((
    rowId: string,
    data: MeasureData[]
  ): { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] => {
    const updates: { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] = [];
    const row = findRowById(rowId, data);
    const measure = data.find(m => m.id === rowId);
    const targetRow = row || measure;
    
    if (!targetRow) return updates;

    // Recalculate quarters from months
    const q1 = targetRow.values.jan2026 + targetRow.values.feb2026 + targetRow.values.mar2026;
    const q2 = targetRow.values.apr2026 + targetRow.values.may2026 + targetRow.values.jun2026;
    const q3 = targetRow.values.jul2026 + targetRow.values.aug2026 + targetRow.values.sep2026;
    const q4 = targetRow.values.oct2026 + targetRow.values.nov2026 + targetRow.values.dec2026;
    
    // Recalculate year from quarters
    const year = q1 + q2 + q3 + q4;

    updates.push(
      { rowId, monthKey: 'q1', newValue: q1 },
      { rowId, monthKey: 'q2', newValue: q2 },
      { rowId, monthKey: 'q3', newValue: q3 },
      { rowId, monthKey: 'q4', newValue: q4 },
      { rowId, monthKey: 'year', newValue: year }
    );

    return updates;
  }, []);

  // Helper to distribute quarter to months proportionally
  const distributeQuarterToMonths = useCallback((
    rowId: string,
    quarter: 'q1' | 'q2' | 'q3' | 'q4',
    newQuarterValue: number,
    data: MeasureData[]
  ): { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] => {
    const updates: { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] = [];
    const row = findRowById(rowId, data);
    const measure = data.find(m => m.id === rowId);
    const targetRow = row || measure;
    
    if (!targetRow) return updates;

    const monthMap = {
      q1: ['jan2026', 'feb2026', 'mar2026'] as const,
      q2: ['apr2026', 'may2026', 'jun2026'] as const,
      q3: ['jul2026', 'aug2026', 'sep2026'] as const,
      q4: ['oct2026', 'nov2026', 'dec2026'] as const,
    };

    const months = monthMap[quarter];
    const currentTotal = months.reduce((sum, month) => sum + targetRow.values[month], 0);

    if (currentTotal === 0) {
      // Equal distribution
      const monthValue = newQuarterValue / 3;
      months.forEach(month => {
        updates.push({ rowId, monthKey: month, newValue: monthValue });
      });
    } else {
      // Proportional distribution
      months.forEach(month => {
        const proportion = targetRow.values[month] / currentTotal;
        const monthValue = newQuarterValue * proportion;
        updates.push({ rowId, monthKey: month, newValue: monthValue });
      });
    }

    return updates;
  }, []);

  // Helper to distribute year to quarters proportionally
  const distributeYearToQuarters = useCallback((
    rowId: string,
    newYearValue: number,
    data: MeasureData[]
  ): { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] => {
    const updates: { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] = [];
    const row = findRowById(rowId, data);
    const measure = data.find(m => m.id === rowId);
    const targetRow = row || measure;
    
    if (!targetRow) return updates;

    const currentTotal = targetRow.values.q1 + targetRow.values.q2 + targetRow.values.q3 + targetRow.values.q4;

    if (currentTotal === 0) {
      // Equal distribution
      const quarterValue = newYearValue / 4;
      updates.push(
        { rowId, monthKey: 'q1', newValue: quarterValue },
        { rowId, monthKey: 'q2', newValue: quarterValue },
        { rowId, monthKey: 'q3', newValue: quarterValue },
        { rowId, monthKey: 'q4', newValue: quarterValue }
      );
    } else {
      // Proportional distribution
      ['q1', 'q2', 'q3', 'q4'].forEach(quarter => {
        const q = quarter as 'q1' | 'q2' | 'q3' | 'q4';
        const proportion = targetRow.values[q] / currentTotal;
        const quarterValue = newYearValue * proportion;
        updates.push({ rowId, monthKey: q, newValue: quarterValue });
      });
    }

    return updates;
  }, []);

  // Flag to prevent creating undo operations when undoing/redoing
  const isUndoRedoOperationRef = useRef<boolean>(false);
  
  // Handle cell value change
  const handleCellChange = useCallback((
    rowId: string,
    monthKey: keyof GridRowType['values'],
    newValue: number,
    note?: string,
    skipUndoOperation?: boolean // Skip creating undo operation (for undo/redo)
  ) => {
    // CRITICAL: Clear all preserved values from previous edits
    preservedValuesRef.current.clear();
    
    // Check if it's a measure row
    const measure = gridData.find(m => m.id === rowId);
    const isMeasureRow = !!measure;
    
    let oldValue: number;
    if (isMeasureRow) {
      oldValue = measure.values[monthKey];
    } else {
      const row = findRowById(rowId, gridData);
      if (!row) {
        return;
      }
      oldValue = row.values[monthKey];
    }

    const delta = newValue - oldValue;
    const cellKey = `${rowId}-${monthKey}`;
    
    // Check if note exists and is not empty
    const hasNote = note && note.trim() !== '';

    if (delta === 0 && !hasNote) {
      // If delta is 0 and no note, remove from edited cells
      setEditedCells(prev => {
        const newMap = new Map(prev);
        newMap.delete(cellKey);
        return newMap;
      });
      return;
    }
    
    // Track edit history - track EVERY edit, not just the first one
    // Also track note-only entries (when delta is 0 but note exists)
    // CRITICAL: Call onEditHistory if available - try ref first, then direct prop
    try {
      const callbackToCall = onEditHistoryRef.current || onEditHistory;
      
      if (callbackToCall && typeof callbackToCall === 'function') {
        // Always call callback if we have a note OR a delta change
        if (delta === 0 && hasNote) {
          // Note-only entry (no value change) - ensure note is passed
          callbackToCall({
            cellKey,
            rowId,
            timeKey: monthKey,
            oldValue: oldValue,
            newValue: newValue,
            note: note.trim(),
          });
        } else if (delta !== 0) {
          // Edit with optional note - always include note if present
          callbackToCall({
            cellKey,
            rowId,
            timeKey: monthKey,
            oldValue,
            newValue,
            note: hasNote ? note.trim() : undefined,
          });
        }
      }
    } catch (error) {
      console.error('[HierarchicalGrid] Error calling onEditHistory:', error);
    }
    
    // Add to editedCells if there's a value change OR if there's a note (to show orange background)
    // Note-only entries (delta === 0 && hasNote) should show edited background
    if (delta !== 0 || hasNote) {
      setEditedCells(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(cellKey)) {
          // Only store original value on first edit
          newMap.set(cellKey, oldValue);
        }
        return newMap;
      });
    } else {
      // If delta is 0 and no note, ensure cell is not in editedCells
      setEditedCells(prev => {
        const newMap = new Map(prev);
        newMap.delete(cellKey);
        return newMap;
      });
    }
    
    // Store unsaved note if provided (for dirty cells)
    if (hasNote) {
      setUnsavedNotes(prev => {
        const newMap = new Map(prev);
        newMap.set(cellKey, note.trim());
        return newMap;
      });
    } else {
      // Clear unsaved note if note is empty
      setUnsavedNotes(prev => {
        const newMap = new Map(prev);
        newMap.delete(cellKey);
        return newMap;
      });
    }
    
    // Remove from impactedCells if it was previously impacted (edited cells take precedence)
    setImpactedCells(prev => {
      const newMap = new Map(prev);
      if (newMap.has(cellKey)) {
        newMap.delete(cellKey);
        console.log('[GRID] Removed cell from impactedCells (now edited):', cellKey);
      }
      return newMap;
    });

    // Store original values for impacted cells (all cells that will change except the directly edited one)
    const originalValuesForImpacted = new Map<string, number>();
    
    // Helper function to store original value for impacted cells
    const storeOriginalValueIfImpacted = (updateRowId: string, updateMonthKey: keyof GridRowType['values']) => {
      if (updateRowId === rowId && updateMonthKey === monthKey) {
        return; // Skip the directly edited cell
      }
      const impactedCellKey = `${updateRowId}-${updateMonthKey}`;
      // Skip locked cells - they are protected from propagation
      if (lockedCells.has(impactedCellKey)) {
        console.log('[GRID] Skipping locked cell from propagation:', impactedCellKey);
        return;
      }
      if (!originalValuesForImpacted.has(impactedCellKey)) {
        const impactedRow = findRowById(updateRowId, gridData) || gridData.find(m => m.id === updateRowId);
        if (impactedRow) {
          originalValuesForImpacted.set(impactedCellKey, impactedRow.values[updateMonthKey]);
        }
      }
    };

    // Collect all updates
    const allUpdates: { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] = [];

    // 1. Update the edited cell
    allUpdates.push({ rowId, monthKey, newValue });

    // Only propagate value changes if delta !== 0 (skip propagation for note-only edits)
    // When delta === 0, there's no value change to propagate, so no cells should be marked as impacted
    if (delta === 0) {
      // No value change - just apply the cell update (value is same, but triggers re-render for note)
      // No propagation needed since there's no value change
      let updatedData = JSON.parse(JSON.stringify(gridData));
      updatedData = updateValue(rowId, monthKey, newValue, updatedData);
      setGridData(updatedData);
      // Note is already saved to editHistory via callback above
      // Don't mark any cells as impacted since there's no value change
      return;
    }

    // 2. Handle time aggregation based on what was edited
    // Track distributed time periods for downward propagation
    const timeDistributionUpdates: { rowId: string; monthKey: keyof GridRowType['values']; newValue: number; oldValue: number }[] = [];
    const row = findRowById(rowId, gridData) || gridData.find(m => m.id === rowId);
    
    if (monthKey === 'year') {
      // Year edited → distribute to quarters → quarters distribute to months
      const quarterUpdates = distributeYearToQuarters(rowId, newValue, gridData);
      quarterUpdates.forEach(q => storeOriginalValueIfImpacted(q.rowId, q.monthKey));
      allUpdates.push(...quarterUpdates);
      
      // Track quarter updates for downward propagation
      if (row) {
        quarterUpdates.forEach(qUpdate => {
          const oldQValue = row.values[qUpdate.monthKey];
          timeDistributionUpdates.push({ rowId, monthKey: qUpdate.monthKey, newValue: qUpdate.newValue, oldValue: oldQValue });
        });
      }
      
      // For each quarter update, distribute to its months
      for (const quarterUpdate of quarterUpdates) {
        const quarter = quarterUpdate.monthKey as 'q1' | 'q2' | 'q3' | 'q4';
        const monthUpdates = distributeQuarterToMonths(rowId, quarter, quarterUpdate.newValue, gridData);
        monthUpdates.forEach(m => storeOriginalValueIfImpacted(m.rowId, m.monthKey));
        allUpdates.push(...monthUpdates);
        
        // Track month updates for downward propagation
        if (row) {
          monthUpdates.forEach(mUpdate => {
            const oldMValue = row.values[mUpdate.monthKey];
            timeDistributionUpdates.push({ rowId, monthKey: mUpdate.monthKey, newValue: mUpdate.newValue, oldValue: oldMValue });
          });
        }
      }
    } else if (monthKey === 'q1' || monthKey === 'q2' || monthKey === 'q3' || monthKey === 'q4') {
      // Quarter edited → distribute to its months → recalculate year
      const quarter = monthKey as 'q1' | 'q2' | 'q3' | 'q4';
      const monthUpdates = distributeQuarterToMonths(rowId, quarter, newValue, gridData);
      monthUpdates.forEach(m => storeOriginalValueIfImpacted(m.rowId, m.monthKey));
      allUpdates.push(...monthUpdates);
      
      // Track month updates for downward propagation
      if (row) {
        monthUpdates.forEach(mUpdate => {
          const oldMValue = row.values[mUpdate.monthKey];
          timeDistributionUpdates.push({ rowId, monthKey: mUpdate.monthKey, newValue: mUpdate.newValue, oldValue: oldMValue });
        });
      }
      
      // Recalculate year from all quarters (will be updated after applying month updates)
      if (row) {
        // Calculate new year value after quarter change
        const updatedQ1 = monthKey === 'q1' ? newValue : row.values.q1;
        const updatedQ2 = monthKey === 'q2' ? newValue : row.values.q2;
        const updatedQ3 = monthKey === 'q3' ? newValue : row.values.q3;
        const updatedQ4 = monthKey === 'q4' ? newValue : row.values.q4;
        const yearValue = updatedQ1 + updatedQ2 + updatedQ3 + updatedQ4;
        storeOriginalValueIfImpacted(rowId, 'year');
        allUpdates.push({ rowId, monthKey: 'year', newValue: yearValue });
      }
    } else {
      // Month edited → recalculate its quarter → recalculate year
      const timeAggUpdates = recalculateTimeAggregations(rowId, gridData);
      timeAggUpdates.forEach(u => storeOriginalValueIfImpacted(u.rowId, u.monthKey));
      allUpdates.push(...timeAggUpdates);
    }

    // 3. Propagate upward (to ancestors) - for the edited time period
    // BUT: Skip upward propagation for the edited row itself if it's a year/quarter edit at account/category level
    // (because we're distributing downward, not summing upward)
    const editedRowForPropagation = findRowById(rowId, gridData);
    const isAccountOrCategoryYearQuarterEditForPropagation = editedRowForPropagation &&
      (editedRowForPropagation.type === 'account' || editedRowForPropagation.type === 'category') &&
      (monthKey === 'year' || monthKey === 'q1' || monthKey === 'q2' || monthKey === 'q3' || monthKey === 'q4');
    
    if (!isAccountOrCategoryYearQuarterEditForPropagation) {
      // Normal case: propagate upward (sum children to parent)
      const upwardUpdates = propagateUpward(rowId, monthKey, delta, gridData, lockedCells);
      upwardUpdates.forEach(u => storeOriginalValueIfImpacted(u.rowId, u.monthKey));
      allUpdates.push(...upwardUpdates);
    } else {
      // Special case: year/quarter edited at account/category level
      // We need to update the parent by summing all children (including the edited one)
      // Then propagate upward from the parent
      console.log('[GRID] Skipping upward propagation for edited row:', rowId, 'type:', editedRowForPropagation.type);
      
      // Find parent and update it by summing all its children
      if (editedRowForPropagation.parentId) {
        const parentRow = findRowById(editedRowForPropagation.parentId, gridData) || gridData.find(m => m.id === editedRowForPropagation.parentId);
        if (parentRow && parentRow.children) {
          // Calculate new parent value by summing all children (including the edited one)
          const childrenSum = parentRow.children.reduce((sum, child) => {
            // Use the new value for the edited child, current value for others
            const childValue = child.id === rowId ? newValue : child.values[monthKey];
            return sum + childValue;
          }, 0);
          
          const parentOldValue = parentRow.values[monthKey];
          const parentDelta = childrenSum - parentOldValue;
          
          if (parentDelta !== 0) {
            // Update parent value
            storeOriginalValueIfImpacted(parentRow.id, monthKey);
            allUpdates.push({ rowId: parentRow.id, monthKey, newValue: childrenSum });
            
            // Propagate upward from parent
            const upwardUpdates = propagateUpward(parentRow.id, monthKey, parentDelta, gridData, lockedCells);
            upwardUpdates.forEach(u => storeOriginalValueIfImpacted(u.rowId, u.monthKey));
            allUpdates.push(...upwardUpdates);
          }
        }
      }
    }

    // 4. Propagate downward (to descendants) - for the edited time period
    // For measure rows, propagate to account level proportionally
    if (isMeasureRow) {
      const measureData = gridData.find(m => m.id === rowId);
      if (measureData && measureData.children.length > 0) {
        const accountDistribution = distributeProportionally(delta, measureData.children, monthKey, lockedCells);
        for (const [accountId, accountDelta] of accountDistribution.entries()) {
          const account = measureData.children.find(c => c.id === accountId);
          if (account) {
            const accountNewValue = account.values[monthKey] + accountDelta;
            storeOriginalValueIfImpacted(accountId, monthKey);
            allUpdates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
            const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, gridData, lockedCells);
            accountUpdates.forEach(u => storeOriginalValueIfImpacted(u.rowId, u.monthKey));
            allUpdates.push(...accountUpdates);
          }
        }
      }
    } else {
      // Propagate downward for the edited cell
      const downwardUpdates = propagateDownward(rowId, monthKey, delta, gridData, lockedCells);
      downwardUpdates.forEach(u => storeOriginalValueIfImpacted(u.rowId, u.monthKey));
      allUpdates.push(...downwardUpdates);
      
      // Also propagate downward for all distributed time periods (quarters, months) to child dimensions
      for (const timeUpdate of timeDistributionUpdates) {
        const timeDelta = timeUpdate.newValue - timeUpdate.oldValue;
        if (timeDelta !== 0) {
          const timeDownwardUpdates = propagateDownward(rowId, timeUpdate.monthKey, timeDelta, gridData, lockedCells);
          timeDownwardUpdates.forEach(u => storeOriginalValueIfImpacted(u.rowId, u.monthKey));
          allUpdates.push(...timeDownwardUpdates);
        }
      }
    }

    // 5. Propagate time aggregations upward and downward
    // After time aggregation updates, propagate them through hierarchy
    const timeAggRow = findRowById(rowId, gridData) || gridData.find(m => m.id === rowId);
    if (timeAggRow) {
      // For each time aggregation update, propagate through hierarchy
      const timeAggKeys: (keyof GridRowType['values'])[] = ['year', 'q1', 'q2', 'q3', 'q4'];
      for (const aggKey of timeAggKeys) {
        if (monthKey !== aggKey) {
          const currentValue = timeAggRow.values[aggKey];
          // Find the update for this aggregation key
          const aggUpdate = allUpdates.find(u => u.rowId === rowId && u.monthKey === aggKey);
          if (aggUpdate && aggUpdate.newValue !== currentValue) {
            const aggDelta = aggUpdate.newValue - currentValue;
            const aggUpwardUpdates = propagateUpward(rowId, aggKey, aggDelta, gridData, lockedCells);
            allUpdates.push(...aggUpwardUpdates);
            
            if (isMeasureRow) {
              const measureData = gridData.find(m => m.id === rowId);
              if (measureData && measureData.children.length > 0) {
                const accountDistribution = distributeProportionally(aggDelta, measureData.children, aggKey, lockedCells);
                for (const [accountId, accountDelta] of accountDistribution.entries()) {
                  const account = measureData.children.find(c => c.id === accountId);
                  if (account) {
                    const accountNewValue = account.values[aggKey] + accountDelta;
                    allUpdates.push({ rowId: accountId, monthKey: aggKey, newValue: accountNewValue });
                    const accountUpdates = propagateDownward(accountId, aggKey, accountDelta, gridData, lockedCells);
                    allUpdates.push(...accountUpdates);
                  }
                }
              }
            } else {
              const aggDownwardUpdates = propagateDownward(rowId, aggKey, aggDelta, gridData, lockedCells);
              allUpdates.push(...aggDownwardUpdates);
            }
          }
        }
      }
    }

    // 6. Update cross-measure dependencies (Orders = Sales Agreement)
    // Apply all updates first to get the correct state, then calculate cross-measure dependencies
    let tempData = gridData;
    for (const update of allUpdates) {
      // Skip locked cells - they are protected from propagation
      const updateCellKey = `${update.rowId}-${update.monthKey}`;
      if (lockedCells.has(updateCellKey) && !(update.rowId === rowId && update.monthKey === monthKey)) {
        console.log('[GRID] Skipping locked cell update:', updateCellKey);
        continue;
      }
      tempData = updateValue(update.rowId, update.monthKey, update.newValue, tempData);
    }
    
    // Now calculate cross-measure dependencies with the updated data
    // But we need to pass the original data for unit price calculations
    // So we'll pass both: tempData (for finding rows) and gridData (for original values)
    console.log('[GRID] Calling updateCrossMeasureDependencies:', { rowId, monthKey, newValue });
    
    // For quarter/year edits, we need to trigger cross-measure dependencies at BOTH levels:
    // 1. At the quarter/year level (for direct updates)
    // 2. At the month level (for distributed months)
    const isYearQuarterEdit = monthKey === 'year' || monthKey === 'q1' || monthKey === 'q2' || monthKey === 'q3' || monthKey === 'q4';
    
    let crossMeasureUpdates: { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] = [];
    
    if (isYearQuarterEdit) {
      // First, calculate cross-measure dependencies for the quarter/year level
      const quarterYearCrossMeasureUpdates = updateCrossMeasureDependencies(rowId, monthKey, newValue, tempData, gridData, lockedCells);
      console.log('[GRID] Quarter/Year cross-measure updates returned:', quarterYearCrossMeasureUpdates.length, 'updates');
      crossMeasureUpdates.push(...quarterYearCrossMeasureUpdates);
      
      // Apply quarter/year cross-measure updates to tempData
      for (const update of quarterYearCrossMeasureUpdates) {
        tempData = updateValue(update.rowId, update.monthKey, update.newValue, tempData);
      }
      
      // Then, for each month that was distributed from this quarter/year edit, trigger cross-measure dependencies
      const monthKeys: (keyof GridRowType['values'])[] = [
        'jan2026', 'feb2026', 'mar2026', 'apr2026', 'may2026', 'jun2026',
        'jul2026', 'aug2026', 'sep2026', 'oct2026', 'nov2026', 'dec2026',
      ];
      
      // Determine which months belong to the edited quarter/year
      let relevantMonths: (keyof GridRowType['values'])[] = [];
      if (monthKey === 'year') {
        relevantMonths = monthKeys; // All months for year
      } else if (monthKey === 'q1') {
        relevantMonths = ['jan2026', 'feb2026', 'mar2026'];
      } else if (monthKey === 'q2') {
        relevantMonths = ['apr2026', 'may2026', 'jun2026'];
      } else if (monthKey === 'q3') {
        relevantMonths = ['jul2026', 'aug2026', 'sep2026'];
      } else if (monthKey === 'q4') {
        relevantMonths = ['oct2026', 'nov2026', 'dec2026'];
      }
      
      // For each relevant month, trigger cross-measure dependencies
      for (const monthKeyToProcess of relevantMonths) {
        const monthUpdate = allUpdates.find(u => u.rowId === rowId && u.monthKey === monthKeyToProcess);
        if (monthUpdate) {
          // Get the updated row from tempData to get the new month value
          const updatedRow = findRowById(rowId, tempData) || tempData.find(m => m.id === rowId);
          if (updatedRow) {
            const monthNewValue = updatedRow.values[monthKeyToProcess];
            console.log('[GRID] Triggering cross-measure for distributed month:', { rowId, monthKey: monthKeyToProcess, newValue: monthNewValue });
            const monthCrossMeasureUpdates = updateCrossMeasureDependencies(rowId, monthKeyToProcess, monthNewValue, tempData, gridData, lockedCells);
            console.log('[GRID] Month cross-measure updates returned:', monthCrossMeasureUpdates.length, 'updates');
            
            // Add month cross-measure updates
            crossMeasureUpdates.push(...monthCrossMeasureUpdates);
            
            // Apply these updates to tempData for next iteration
            for (const update of monthCrossMeasureUpdates) {
              tempData = updateValue(update.rowId, update.monthKey, update.newValue, tempData);
            }
          }
        }
      }
    } else {
      // For month edits, just calculate cross-measure dependencies normally
      crossMeasureUpdates = updateCrossMeasureDependencies(rowId, monthKey, newValue, tempData, gridData, lockedCells);
      console.log('[GRID] Cross-measure updates returned:', crossMeasureUpdates.length, 'updates');
    }
    
    allUpdates.push(...crossMeasureUpdates);
    
    // Store original values for cross-measure impacted cells
    crossMeasureUpdates.forEach(update => storeOriginalValueIfImpacted(update.rowId, update.monthKey));

    // Apply all updates
    // Start with a deep copy to ensure we always have a new array reference
    let updatedData = JSON.parse(JSON.stringify(gridData));
    
    // Check if this is a year/quarter edit that needs preservation
    // For measure rows: preserve year/quarter edits
    // For account/category rows: preserve year/quarter edits
    // Note: isYearQuarterEdit is already declared above (line 692)
    const editedRow = findRowById(rowId, gridData);
    const editedMeasure = gridData.find(m => m.id === rowId);
    const isAccountOrCategoryYearQuarterEdit = editedRow &&
      (editedRow.type === 'account' || editedRow.type === 'category') &&
      isYearQuarterEdit;
    const isMeasureYearQuarterEdit = !!editedMeasure && isYearQuarterEdit;
    
    // Store the edited value to preserve it (for both measure and account/category year/quarter edits)
    // ONLY preserve the currently edited cell - all other cells will be recalculated
    const preservedValue = (isAccountOrCategoryYearQuarterEdit || isMeasureYearQuarterEdit) ? newValue : null;
    
    // Apply all updates
    console.log('[GRID] Applying', allUpdates.length, 'updates');
    for (const update of allUpdates) {
      // Skip locked cells - they are protected from propagation
      const updateCellKey = `${update.rowId}-${update.monthKey}`;
      if (lockedCells.has(updateCellKey) && !(update.rowId === rowId && update.monthKey === monthKey)) {
        console.log('[GRID] Skipping locked cell update (final):', updateCellKey);
        continue;
      }
      // Check if this update is for a previously edited cell
      const isPreviouslyEdited = editedCells.has(updateCellKey);
      if (isPreviouslyEdited && updateCellKey !== `${rowId}-${monthKey}`) {
        console.log('[GRID] Updating previously edited cell:', updateCellKey, 'from', 
          editedCells.get(updateCellKey), 'to', update.newValue);
      }
      updatedData = updateValue(update.rowId, update.monthKey, update.newValue, updatedData);
    }

    // Store original measure row values BEFORE recalculation
    // This allows us to track measure rows as impacted when their children change
    const originalMeasureValues = new Map<string, Map<keyof GridRowType['values'], number>>();
    for (const measure of updatedData) {
      const measureValues = new Map<keyof GridRowType['values'], number>();
      const timeKeys: (keyof GridRowType['values'])[] = [
        'year', 'q1', 'q2', 'q3', 'q4',
        'jan2026', 'feb2026', 'mar2026', 'apr2026', 'may2026', 'jun2026',
        'jul2026', 'aug2026', 'sep2026', 'oct2026', 'nov2026', 'dec2026',
      ];
      for (const key of timeKeys) {
        measureValues.set(key, measure.values[key]);
      }
      originalMeasureValues.set(measure.id, measureValues);
    }
    
    // Recalculate measure values from children after all updates
    // Skip recalculating ONLY for the currently edited cell (if it's a year/quarter edit)
    // Do NOT skip for cross-measure updates - they should be recalculated
    const skipTimeAggregation = new Set<string>();
    if (isAccountOrCategoryYearQuarterEdit) {
      skipTimeAggregation.add(rowId);
      console.log('[GRID] Skipping recalculation for currently edited row:', rowId, 'type:', editedRow.type);
    } else if (isMeasureYearQuarterEdit) {
      skipTimeAggregation.add(rowId);
      console.log('[GRID] Skipping recalculation for currently edited measure row:', rowId);
    }
    
    updatedData = calculateMeasureValues(updatedData, skipTimeAggregation, lockedCells);
    
    // Track measure row cells as impacted if their values changed due to children being impacted
    for (const measure of updatedData) {
      const originalValues = originalMeasureValues.get(measure.id);
      if (originalValues) {
        for (const [key, originalValue] of originalValues.entries()) {
          const newValue = measure.values[key];
          // Skip if this is the directly edited cell
          if (measure.id === rowId && key === monthKey) {
            continue;
          }
          // If value changed, track as impacted
          if (Math.abs(newValue - originalValue) > 0.01) { // Use small epsilon for floating point comparison
            const measureCellKey = `${measure.id}-${key}`;
            // Skip locked cells - they shouldn't be tracked as impacted
            if (lockedCells.has(measureCellKey)) {
              continue;
            }
            // Only add if not already tracked as edited
            if (!editedCells.has(measureCellKey)) {
              if (!originalValuesForImpacted.has(measureCellKey)) {
                originalValuesForImpacted.set(measureCellKey, originalValue);
                console.log('[GRID] Tracking measure row cell as impacted:', measureCellKey, 'original:', originalValue, 'new:', newValue);
              }
            }
          }
        }
      }
    }
    
    // CRITICAL: After recalculation, restore ONLY the currently edited cell's value (if it's a year/quarter edit)
    // Do NOT restore cross-measure updated values - they should be recalculated
    if (preservedValue !== null) {
      console.log('[GRID] Restoring preserved value for currently edited cell:', preservedValue, 'for row:', rowId, 'monthKey:', monthKey);
      updatedData = updateValue(rowId, monthKey, preservedValue, updatedData);
      // Store in ref so it persists across recalculations triggered by useEffect
      preservedValuesRef.current.set(rowId, { monthKey, value: preservedValue });
    } else {
      // Clear preserved value if this edit doesn't need preservation
      preservedValuesRef.current.delete(rowId);
    }

    // Update impacted cells state with original values
    // ACCUMULATE impacted cells across all edits (don't clear previous ones)
    setImpactedCells(prev => {
      const newMap = new Map(prev);
      // Add new impacted cells to existing ones (don't clear)
      originalValuesForImpacted.forEach((value, key) => {
        // Skip locked cells - they shouldn't be tracked as impacted
        if (lockedCells.has(key)) {
          return;
        }
        // Only add if not already tracked as edited (edited cells take precedence)
        if (!editedCells.has(key)) {
          // If already exists, keep the original value (first edit's original)
          if (!newMap.has(key)) {
            newMap.set(key, value);
            console.log('[GRID] Adding impacted cell:', key, 'original value:', value);
          } else {
            console.log('[GRID] Impacted cell already exists, keeping original:', key);
          }
        }
      });
      console.log('[GRID] Total impacted cells after update:', newMap.size);
      return newMap;
    });

    // Ensure we have a fresh deep copy to trigger React re-render
    const finalData = JSON.parse(JSON.stringify(updatedData));
    setGridData(finalData);
    
    // Create undo/redo operation BEFORE updating state (unless this is an undo/redo operation)
    if (!skipUndoOperation && !isUndoRedoOperationRef.current) {
      // Determine operation type: 'value', 'note', or 'both'
      const previousNote = unsavedNotes.get(cellKey) || undefined;
      const operationType: 'value' | 'note' | 'both' = 
        delta !== 0 && hasNote ? 'both' :
        delta !== 0 ? 'value' :
        hasNote ? 'note' : 'value'; // Default to value if somehow both are 0
      
      // Store state before this operation for undo
      const operation: UndoRedoOperation = {
        id: `op-${Date.now()}-${Math.random()}`,
        cellKey,
        rowId,
        monthKey,
        operationType,
        oldValue: delta !== 0 ? oldValue : undefined,
        newValue: delta !== 0 ? newValue : undefined,
        oldNote: hasNote ? previousNote : undefined,
        newNote: hasNote ? note.trim() : undefined,
        timestamp: new Date(),
        impactedCellsBefore: new Map(impactedCells),
        editedCellsBefore: new Map(editedCells),
      };
      
      // Add operation to undo/redo history
      setUndoRedoHistory(prev => {
        const currentIndex = historyIndexRef.current;
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(operation);
        console.log('[UNDO/REDO] Adding operation:', operation.id, 'type:', operationType, 'index:', currentIndex + 1);
        return newHistory;
      });
      setHistoryIndex(prev => {
        const newIndex = prev + 1;
        console.log('[UNDO/REDO] Incrementing historyIndex from', prev, 'to', newIndex);
        return newIndex;
      });
    }
    
    if (onDataChange) {
      onDataChange(finalData);
    }
  }, [gridData, updateValue, onDataChange, calculateMeasureValues, recalculateTimeAggregations, distributeQuarterToMonths, distributeYearToQuarters, historyIndex, editedCells]);

  // Collect all visible rows in order for keyboard navigation
  const getAllVisibleRows = useCallback((): GridRowType[] => {
    const visibleRows: GridRowType[] = [];
    
    const collectRows = (row: GridRowType) => {
      visibleRows.push(row);
      if (row.children && expandedRows.has(row.id)) {
        row.children.forEach(collectRows);
      }
    };
    
    gridData.forEach((measure) => {
      // Deep copy the measure row to ensure all children have fresh values
      const measureRow: GridRowType = deepCopyRow({
        id: measure.id,
        name: measure.name,
        parentId: null,
        level: 0,
        type: 'measure',
        children: measure.children,
        values: measure.values,
      });
      
      if (selectedDimensionLevels) {
        const filteredResult = filterRowsByType(measureRow, selectedDimensionLevels);
        if (filteredResult) {
          const filteredRow = Array.isArray(filteredResult) ? measureRow : filteredResult;
          collectRows(filteredRow);
        }
      } else {
        collectRows(measureRow);
      }
    });
    
    return visibleRows;
  }, [gridData, expandedRows, selectedDimensionLevels, filterRowsByType, deepCopyRow]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Don't handle navigation if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (
      (activeElement.tagName === 'INPUT' && activeElement.classList.contains('cell-input'))
    )) {
      return;
    }
    
    const visibleRows = getAllVisibleRows();
    const visibleTimeKeys = getVisibleTimeKeys();
    
    if (visibleRows.length === 0 || visibleTimeKeys.length === 0) return;
    
    if (!focusedCell) {
      // If no cell is focused, focus the first editable cell
      for (const row of visibleRows) {
        if (row.type !== 'measure') {
          setFocusedCell({ rowId: row.id, monthKey: visibleTimeKeys[0] });
          return;
        }
      }
      return;
    }
    
    const currentRowIndex = visibleRows.findIndex(r => r.id === focusedCell.rowId);
    const currentColIndex = visibleTimeKeys.findIndex(k => k === focusedCell.monthKey);
    
    if (currentRowIndex === -1 || currentColIndex === -1) return;
    
    let newRowIndex = currentRowIndex;
    let newColIndex = currentColIndex;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRowIndex = Math.min(visibleRows.length - 1, currentRowIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newColIndex = Math.min(visibleTimeKeys.length - 1, currentColIndex + 1);
        break;
      case 'Tab':
        // Tab navigation handled by browser, but we can enhance it
        if (e.shiftKey) {
          e.preventDefault();
          if (currentColIndex > 0) {
            newColIndex = currentColIndex - 1;
          } else if (currentRowIndex > 0) {
            newRowIndex = currentRowIndex - 1;
            newColIndex = visibleTimeKeys.length - 1;
          }
        } else {
          e.preventDefault();
          if (currentColIndex < visibleTimeKeys.length - 1) {
            newColIndex = currentColIndex + 1;
          } else if (currentRowIndex < visibleRows.length - 1) {
            newRowIndex = currentRowIndex + 1;
            newColIndex = 0;
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        // Enter edit mode - GridRow's onKeyDown will handle this
        if (visibleRows[currentRowIndex] && visibleRows[currentRowIndex].type !== 'measure') {
          const cellKey = `${visibleRows[currentRowIndex].id}-${visibleTimeKeys[currentColIndex]}`;
          const cellElement = cellRefs.current.get(cellKey);
          if (cellElement) {
            // Create and dispatch a keyboard event to trigger the cell's onKeyDown handler
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              bubbles: true,
              cancelable: true,
            });
            cellElement.dispatchEvent(enterEvent);
          }
        }
        return;
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Home: Go to first cell
          newRowIndex = 0;
          newColIndex = 0;
        } else {
          // Home: Go to first column of current row
          newColIndex = 0;
        }
        break;
      case 'End':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+End: Go to last cell
          newRowIndex = visibleRows.length - 1;
          newColIndex = visibleTimeKeys.length - 1;
        } else {
          // End: Go to last column of current row
          newColIndex = visibleTimeKeys.length - 1;
        }
        break;
      default:
        return; // Don't prevent default for other keys
    }
    
    // Skip measure rows when navigating
    while (newRowIndex < visibleRows.length && visibleRows[newRowIndex].type === 'measure') {
      if (e.key === 'ArrowDown' || (!e.shiftKey && e.key === 'Tab')) {
        newRowIndex++;
      } else {
        break;
      }
    }
    
    if (newRowIndex >= 0 && newRowIndex < visibleRows.length && 
        newColIndex >= 0 && newColIndex < visibleTimeKeys.length) {
      setFocusedCell({ 
        rowId: visibleRows[newRowIndex].id, 
        monthKey: visibleTimeKeys[newColIndex] 
      });
      
      // Scroll into view
      const cellKey = `${visibleRows[newRowIndex].id}-${visibleTimeKeys[newColIndex]}`;
      const cellElement = cellRefs.current.get(cellKey);
      if (cellElement) {
        cellElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        cellElement.focus();
      }
    }
  }, [focusedCell, getAllVisibleRows, getVisibleTimeKeys, handleCellChange]);

  // Auto-expand rows that match search (only when searchTerm changes, not gridData)
  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return;
    }

    try {
      const searchTerms = extractSearchTerms(searchTerm);
      if (searchTerms.length === 0) {
        return;
      }

      const rowsToExpand = new Set<string>();
      
      const checkRow = (row: GridRowType, measureName: string) => {
        try {
          const matchResult = rowMatchesSearch(row, searchTerms, measureName);
          if (matchResult.matches) {
            // Add this row and all its parents to expanded set
            let currentRow: GridRowType | null = row;
            while (currentRow && currentRow.parentId) {
              rowsToExpand.add(currentRow.parentId);
              // Find parent in current gridData
              let foundParent: GridRowType | null = null;
              for (const m of gridData) {
                if (m.id === currentRow!.parentId) {
                  foundParent = {
                    id: m.id,
                    name: m.name,
                    parentId: null,
                    level: 0,
                    type: 'measure',
                    children: m.children,
                    values: m.values,
                  };
                  break;
                }
                if (m.children) {
                  const findParentInChildren = (rows: GridRowType[]): GridRowType | null => {
                    for (const r of rows) {
                      if (r.id === currentRow!.parentId) return r;
                      if (r.children) {
                        const found = findParentInChildren(r.children);
                        if (found) return found;
                      }
                    }
                    return null;
                  };
                  foundParent = findParentInChildren(m.children);
                  if (foundParent) break;
                }
              }
              currentRow = foundParent;
            }
            rowsToExpand.add(row.id);
          }
          
          if (row.children) {
            row.children.forEach(child => checkRow(child, measureName));
          }
        } catch (e) {
          console.error('[GRID] Error in checkRow:', e);
        }
      };

      gridData.forEach(measure => {
        try {
          checkRow({
            id: measure.id,
            name: measure.name,
            parentId: null,
            level: 0,
            type: 'measure',
            children: measure.children,
            values: measure.values,
          }, measure.name);
        } catch (e) {
          console.error('[GRID] Error checking measure:', e);
        }
      });

      setExpandedRows(prev => {
        const newSet = new Set(prev);
        rowsToExpand.forEach(id => newSet.add(id));
        return newSet;
      });
    } catch (error) {
      console.error('[GRID] Error in auto-expand useEffect:', error);
    }
  }, [searchTerm]); // Removed gridData dependency to prevent infinite loops

  // Memoize the deep-copied measure rows with search filtering
  const memoizedMeasureRows = useMemo(() => {
    try {
      if (!gridData || gridData.length === 0) {
        return [];
      }

      // If no search term, return all rows
      if (!searchTerm || !searchTerm.trim()) {
        return gridData.map((measure) => {
          return deepCopyRow({
            id: measure.id,
            name: measure.name,
            parentId: null,
            level: 0,
            type: 'measure',
            children: measure.children,
            values: measure.values,
          });
        });
      }

      const searchTerms = extractSearchTerms(searchTerm);
      if (searchTerms.length === 0) {
        // No valid search terms, return all rows
        return gridData.map((measure) => {
          return deepCopyRow({
            id: measure.id,
            name: measure.name,
            parentId: null,
            level: 0,
            type: 'measure',
            children: measure.children,
            values: measure.values,
          });
        });
      }
      
      const filteredRows: GridRowType[] = [];
      
      for (const measure of gridData) {
        try {
          let measureRow: GridRowType = deepCopyRow({
            id: measure.id,
            name: measure.name,
            parentId: null,
            level: 0,
            type: 'measure',
            children: measure.children,
            values: measure.values,
          });

          // Apply search filtering
          const { otherTerms } = separateSearchTerms(searchTerms);
          if (otherTerms.length > 0) {
            // Filter rows based on search (excluding time terms)
            const filterRow = (row: GridRowType): GridRowType | null => {
              try {
                const matchResult = rowMatchesSearch(row, otherTerms, measure.name);
                
                // Process children
                let filteredChildren: GridRowType[] = [];
                if (row.children && row.children.length > 0) {
                  for (const child of row.children) {
                    try {
                      const filteredChild = filterRow(child);
                      if (filteredChild) {
                        filteredChildren.push(filteredChild);
                      }
                    } catch (e) {
                      console.error('[GRID] Error filtering child:', e);
                      // Skip child if filtering fails
                    }
                  }
                }

                // Show row if it matches or has matching children
                if (matchResult.matches || filteredChildren.length > 0) {
                  return {
                    ...row,
                    children: filteredChildren.length > 0 ? filteredChildren : row.children,
                  };
                }

                return null;
              } catch (e) {
                console.error('[GRID] Error in filterRow:', e);
                return null;
              }
            };

            const filteredRow = filterRow(measureRow);
            if (filteredRow) {
              filteredRows.push(filteredRow);
            }
          } else {
            // Only time terms, show all rows
            filteredRows.push(measureRow);
          }
        } catch (e) {
          console.error('[GRID] Error processing measure:', e);
          // Include measure even if filtering fails to prevent data loss
          filteredRows.push(deepCopyRow({
            id: measure.id,
            name: measure.name,
            parentId: null,
            level: 0,
            type: 'measure',
            children: measure.children,
            values: measure.values,
          }));
        }
      }
      
      return filteredRows;
    } catch (error) {
      console.error('[GRID] Error in memoizedMeasureRows:', error);
      // Return all rows on error to prevent blank page
      try {
        return gridData.map((measure) => {
          return deepCopyRow({
            id: measure.id,
            name: measure.name,
            parentId: null,
            level: 0,
            type: 'measure',
            children: measure.children,
            values: measure.values,
          });
        });
      } catch (e) {
        console.error('[GRID] Error creating fallback rows:', e);
        return [];
      }
    }
  }, [gridData, deepCopyRow, searchTerm]);

  // Calculate impacted measures count
  const impactedMeasuresCount = useMemo(() => {
    const impactedMeasureIds = new Set<string>();
    
    console.log('[FOOTER] Calculating impacted measures count. editedCells:', editedCells.size, 'impactedCells:', impactedCells.size);
    
    // Helper function to extract measure ID from rowId
    const getMeasureIdFromRowId = (rowId: string): string | null => {
      // Check if rowId is directly a measure ID
      const directMeasure = gridData.find(m => m.id === rowId);
      if (directMeasure) {
        return directMeasure.id;
      }
      
      // Extract measure ID from rowId pattern: account-measure-xxx, category-xxx-measure-xxx, product-xxx-measure-xxx
      // Or measure row cells: measure-xxx
      const parts = rowId.split('-');
      
      // Look for 'measure-' in the parts
      const measureIndex = parts.findIndex(part => part === 'measure');
      if (measureIndex !== -1 && measureIndex < parts.length - 1) {
        // Reconstruct measure ID: measure-xxx
        const measureId = `measure-${parts.slice(measureIndex + 1).join('-')}`;
        // Verify it exists in gridData
        if (gridData.find(m => m.id === measureId)) {
          return measureId;
        }
      }
      
      // Fallback: search through all measures to find which one contains this row
      for (const m of gridData) {
        const row = findRowById(rowId, [m]);
        if (row) {
          return m.id;
        }
      }
      
      return null;
    };
    
    // Get measure IDs from edited cells
    editedCells.forEach((_, cellKey) => {
      // cellKey format: `${rowId}-${monthKey}`
      // Extract rowId by removing the last part (monthKey like 'feb2026', 'jan2026', etc.)
      const parts = cellKey.split('-');
      // MonthKey is always the last part (e.g., 'feb2026', 'jan2026', 'year', 'q1', etc.)
      // Reconstruct rowId from all parts except the last one
      const rowId = parts.slice(0, -1).join('-');
      const measureId = getMeasureIdFromRowId(rowId);
      if (measureId) {
        console.log('[FOOTER] Found edited cell in measure:', measureId, 'from rowId:', rowId, 'cellKey:', cellKey);
        impactedMeasureIds.add(measureId);
      }
    });
    
    // Get measure IDs from impacted cells
    impactedCells.forEach((_, cellKey) => {
      // cellKey format: `${rowId}-${monthKey}`
      // Extract rowId by removing the last part (monthKey like 'feb2026', 'jan2026', etc.)
      const parts = cellKey.split('-');
      // MonthKey is always the last part (e.g., 'feb2026', 'jan2026', 'year', 'q1', etc.)
      // Reconstruct rowId from all parts except the last one
      const rowId = parts.slice(0, -1).join('-');
      const measureId = getMeasureIdFromRowId(rowId);
      if (measureId) {
        console.log('[FOOTER] Found impacted cell in measure:', measureId, 'from rowId:', rowId, 'cellKey:', cellKey);
        impactedMeasureIds.add(measureId);
      }
    });
    
    console.log('[FOOTER] Total impacted measures:', impactedMeasureIds.size, 'measures:', Array.from(impactedMeasureIds));
    return impactedMeasureIds.size;
  }, [editedCells, impactedCells, gridData]);

  // Undo handler - undo the most recent operation
  const handleUndo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    const currentHistory = undoRedoHistory;
    
    console.log('[UNDO] handleUndo called. historyIndex:', currentIndex, 'operations.length:', currentHistory.length);
    
    // Can only undo if we have at least one operation
    if (currentIndex >= 0 && currentHistory.length > currentIndex) {
      const operation = currentHistory[currentIndex];
      console.log('[UNDO] Undoing operation:', operation.id, 'type:', operation.operationType, 'cell:', operation.cellKey);
      
      // Reverse the operation based on its type
      let valueToRestore: number | undefined = undefined;
      let noteToRestore: string | undefined = undefined;
      
      // Determine what to restore based on operation type
      // If operation type is 'both', undo the latest change (value or note)
      // For now, prioritize value if both exist
      if (operation.operationType === 'value' || operation.operationType === 'both') {
        valueToRestore = operation.oldValue;
      }
      if (operation.operationType === 'note' || operation.operationType === 'both') {
        noteToRestore = operation.oldNote;
      }
      
      // Set flag to prevent creating new undo operation
      isUndoRedoOperationRef.current = true;
      
      try {
        // Restore the cell value/note by calling handleCellChange with the old values
        // This will trigger all propagation logic automatically
        if (valueToRestore !== undefined) {
          // Call handleCellChange to restore value and trigger propagation
          handleCellChange(operation.rowId, operation.monthKey, valueToRestore, noteToRestore, true);
          
          // CRITICAL: Restore editedCells and impactedCells to their state BEFORE this operation
          // This ensures formatting (backgrounds, arrows) matches the previous state
          // We do this AFTER handleCellChange because it recalculates these maps
          // Use setTimeout to ensure handleCellChange completes first
          setTimeout(() => {
            setEditedCells(new Map(operation.editedCellsBefore));
            setImpactedCells(new Map(operation.impactedCellsBefore));
            console.log('[UNDO] Restored editedCells and impactedCells to previous state');
          }, 0);
          
          console.log('[UNDO] Undo completed. Restored value:', valueToRestore, 'note:', noteToRestore);
        } else if (noteToRestore !== undefined) {
          // Note-only undo - just restore the note
          setUnsavedNotes(prev => {
            const newMap = new Map(prev);
            if (noteToRestore) {
              newMap.set(operation.cellKey, noteToRestore);
            } else {
              newMap.delete(operation.cellKey);
            }
            return newMap;
          });
          
          // For note-only undo, also restore editedCells state
          // If the cell was edited before, keep it; if not, remove it
          setEditedCells(() => {
            const newMap = new Map(operation.editedCellsBefore);
            // If the note was the only edit, remove from editedCells
            if (!operation.editedCellsBefore.has(operation.cellKey)) {
              newMap.delete(operation.cellKey);
            }
            return newMap;
          });
          
          console.log('[UNDO] Undo completed (note only). Restored note:', noteToRestore);
        }
        
        // Update history index
        setHistoryIndex(currentIndex - 1);
      } finally {
        // Reset flag
        isUndoRedoOperationRef.current = false;
      }
    } else {
      console.log('[UNDO] Cannot undo - historyIndex:', currentIndex, 'operations.length:', currentHistory.length);
    }
  }, [undoRedoHistory, gridData, updateValue, calculateMeasureValues, lockedCells, onDataChange]);

  // Redo handler - reapply the next operation
  const handleRedo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    const currentHistory = undoRedoHistory;
    
    console.log('[REDO] handleRedo called. historyIndex:', currentIndex, 'operations.length:', currentHistory.length);
    
    if (currentIndex < currentHistory.length - 1 && currentHistory.length > 0) {
      const newIndex = currentIndex + 1;
      const operation = currentHistory[newIndex];
      console.log('[REDO] Redoing operation:', operation.id, 'type:', operation.operationType, 'cell:', operation.cellKey);
      
      // Reapply the operation by calling handleCellChange with the new values
      // Set flag to prevent creating new undo operation
      isUndoRedoOperationRef.current = true;
      
      try {
        if (operation.newValue !== undefined) {
          // Call handleCellChange to restore value and trigger propagation
          handleCellChange(operation.rowId, operation.monthKey, operation.newValue, operation.newNote, true);
          console.log('[REDO] Redo completed. Restored value:', operation.newValue, 'note:', operation.newNote);
        } else if (operation.newNote !== undefined) {
          // Note-only redo
          setUnsavedNotes(prev => {
            const newMap = new Map(prev);
            if (operation.newNote) {
              newMap.set(operation.cellKey, operation.newNote);
            } else {
              newMap.delete(operation.cellKey);
            }
            return newMap;
          });
          console.log('[REDO] Redo completed (note only). Restored note:', operation.newNote);
        }
        
        setHistoryIndex(newIndex);
      } finally {
        // Reset flag
        isUndoRedoOperationRef.current = false;
      }
    } else {
      console.log('[REDO] Cannot redo - historyIndex:', currentIndex, 'operations.length:', currentHistory.length);
    }
  }, [undoRedoHistory, gridData, updateValue, calculateMeasureValues, lockedCells, onDataChange]);

  // Register undo/redo handlers with parent
  useEffect(() => {
    if (onUndoHandler) {
      onUndoHandler(handleUndo);
    }
  }, [onUndoHandler, handleUndo]);

  useEffect(() => {
    if (onRedoHandler) {
      onRedoHandler(handleRedo);
    }
  }, [onRedoHandler, handleRedo]);

  // Report undo/redo availability to parent
  useEffect(() => {
    if (onCanUndoChange) {
      onCanUndoChange(historyIndex > 0);
    }
  }, [onCanUndoChange, historyIndex]);

  useEffect(() => {
    if (onCanRedoChange) {
      onCanRedoChange(historyIndex < undoRedoHistory.length - 1);
    }
  }, [onCanRedoChange, historyIndex, undoRedoHistory.length]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    // Clear draft edits
    if (onClearDrafts) {
      onClearDrafts();
    }
    
    // Restore to original data
    setGridData(JSON.parse(JSON.stringify(originalDataRef.current)));
    setUndoRedoHistory([]);
    setHistoryIndex(-1);
    setEditedCells(new Map());
    setImpactedCells(new Map());
    // Also clear saved edited cells
    setSavedEditedCells(new Map());
    // Clear unsaved notes
    setUnsavedNotes(new Map());
  }, [onClearDrafts]);

  // Save handler
  const handleSave = useCallback(() => {
    // Commit draft edits to saved history before clearing undo/redo history
    if (onCommitDrafts) {
      onCommitDrafts();
    }
    
    // Update original data reference
    originalDataRef.current = JSON.parse(JSON.stringify(gridData));
    // Clear history and reset
    setUndoRedoHistory([]);
    setHistoryIndex(-1);
    // Mark all currently edited cells as saved (they keep the icon but lose the badge)
    // Store the icon color based on whether it was an increment or decrement
    setSavedEditedCells(prev => {
      const newMap = new Map(prev);
      editedCells.forEach((originalValue, cellKey) => {
        // Extract rowId and monthKey from cellKey
        const parts = cellKey.split('-');
        const monthKey = parts[parts.length - 1] as keyof GridRowType['values'];
        const rowId = parts.slice(0, -1).join('-');
        
        // Find the current value for this cell
        let currentValue = 0;
        const measure = gridData.find(m => m.id === rowId);
        if (measure) {
          currentValue = measure.values[monthKey] || 0;
        } else {
          const row = findRowById(rowId, gridData);
          if (row) {
            currentValue = row.values[monthKey] || 0;
          }
        }
        
        // Only add to savedEditedCells if there was an actual value change
        if (originalValue !== currentValue) {
          // Calculate if it was an increment or decrement
          const isIncrement = originalValue !== 0 && currentValue > originalValue;
          const iconColor = isIncrement ? '#ff5d2d' : '#2E76E1';
          
          newMap.set(cellKey, iconColor);
          console.log('[SAVE] Adding cell to savedEditedCells:', cellKey, 'iconColor:', iconColor, 'originalValue:', originalValue, 'currentValue:', currentValue);
        } else {
          // No value change - remove from savedEditedCells if present
          newMap.delete(cellKey);
          console.log('[SAVE] Removing cell from savedEditedCells (no value change):', cellKey);
        }
      });
      console.log('[SAVE] Total saved edited cells:', newMap.size);
      return newMap;
    });
    // Clear impacted cells (they're now saved)
    setImpactedCells(new Map());
    // Clear editedCells - remove all cells
    // Note-only cells (no value change) are removed (no background after save)
    // Value-change cells are moved to savedEditedCells (for arrow display)
    setEditedCells(new Map());
    // Clear unsaved notes (they're now saved)
    setUnsavedNotes(new Map());
    // Reset "Show Only Impacted KPI" filter since there are no more unsaved edits
    setShowOnlyImpactedKPI(false);
    // Notify parent
    if (onDataChange) {
      onDataChange(gridData);
    }
  }, [gridData, onDataChange, editedCells, onCommitDrafts]);

  // Check if footer should be visible (only if there are unsaved edits)
  const isFooterVisible = editedCells.size > 0 || impactedCells.size > 0;

  // Filter rows based on "Show Only Impacted KPI" setting
  const getFilteredRows = useCallback((measureRow: GridRowType): GridRowType | GridRowType[] | null => {
    if (!showOnlyImpactedKPI) {
      return measureRow;
    }
    
    // Check if this measure has any edited or impacted cells
    const measureHasChanges = Array.from(editedCells.keys()).some(key => key.startsWith(measureRow.id + '-')) ||
                              Array.from(impactedCells.keys()).some(key => key.startsWith(measureRow.id + '-'));
    
    if (!measureHasChanges) {
      // Check children
      const hasChangedChildren = measureRow.children?.some(child => {
        const childHasChanges = Array.from(editedCells.keys()).some(key => key.startsWith(child.id + '-')) ||
                                Array.from(impactedCells.keys()).some(key => key.startsWith(child.id + '-'));
        return childHasChanges || (child.children && child.children.some(grandchild => 
          Array.from(editedCells.keys()).some(key => key.startsWith(grandchild.id + '-')) ||
          Array.from(impactedCells.keys()).some(key => key.startsWith(grandchild.id + '-'))
        ));
      });
      
      if (!hasChangedChildren) {
        return null; // Filter out this measure
      }
    }
    
    return measureRow;
  }, [showOnlyImpactedKPI, editedCells, impactedCells]);

  // Check if search is active (filtering columns)
  const isFiltering = searchTerm && searchTerm.trim().length > 0;

  return (
    <div className="grid-container-wrapper">
      <div className="grid-container" onKeyDown={handleKeyDown} tabIndex={0}>
        <table className={`grid-table ${isFiltering ? 'filtered' : ''}`}>
          <thead className="grid-header">
            <tr>
              <th>
                <div className="grid-header-title-container">
                  <span>Measures / Dimensions x Time</span>
                  {onSettingsClick && (
                    <button 
                      className="grid-header-settings-button"
                      onClick={onSettingsClick}
                      title="Settings"
                      type="button"
                    >
                      <svg fill="currentColor" viewBox="0 0 24 24" width="14" height="14">
                        <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </th>
              {visibleTimeHeaders.map((header) => {
                const searchTerms = searchTerm && searchTerm.trim() ? extractSearchTerms(searchTerm) : [];
                const dynamicWidth = columnWidths.get(header.key) || columnWidth;
                return (
                  <th 
                    key={header.key}
                    data-column-key={header.key}
                    style={{ minWidth: `${dynamicWidth}px`, width: `${dynamicWidth}px` }}
                  >
                    {searchTerms.length > 0 ? (
                      <SearchHighlight text={header.label} searchTerms={searchTerms} />
                    ) : (
                      header.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="grid-body">
            {!memoizedMeasureRows || memoizedMeasureRows.length === 0 ? (
              <tr>
                <td colSpan={visibleTimeHeaders.length + 1} className="grid-no-results">
                  {searchTerm && searchTerm.trim() ? `No results found for '${searchTerm}'` : 'No data available'}
                </td>
              </tr>
            ) : (
              memoizedMeasureRows.map((measureRow) => {
                if (!measureRow) return null;
                const measure = gridData.find(m => m.id === measureRow.id);
                if (!measure) return null;
              
                // Apply "Show Only Impacted KPI" filter first
                const impactedFilteredRow = getFilteredRows(measureRow);
                if (!impactedFilteredRow) {
                  return null;
                }
              const rowAfterImpactedFilter = Array.isArray(impactedFilteredRow) ? measureRow : impactedFilteredRow;
              
              // Apply filtering if selectedDimensionLevels is provided
              if (selectedDimensionLevels) {
                // Create a fresh copy for filtering to ensure we don't mutate the memoized row
                const rowForFiltering = deepCopyRow(rowAfterImpactedFilter);
                const filteredResult = filterRowsByType(rowForFiltering, selectedDimensionLevels);
                
                // Skip rendering if the row was filtered out
                if (!filteredResult) {
                  return null;
                }
                
                // Measure rows should always return a single GridRowType, not an array
                // But handle array case just in case (shouldn't happen)
                const filteredRow = Array.isArray(filteredResult) ? measureRow : filteredResult;
                
                return (
                  <GridRowComponent
                    key={measure.id}
                    row={filteredRow}
                    level={0}
                    isExpanded={expandedRows.has(measure.id)}
                    expandedRows={expandedRows}
                    onToggleExpand={toggleExpand}
                    formatValue={formatValue}
                    onCellChange={(rowId, monthKey, newValue, note) => {
                      handleCellChange(rowId, monthKey, newValue, note);
                    }}
                    visibleTimeKeys={getVisibleTimeKeys()}
                    focusedCell={focusedCell}
                    onCellFocus={handleFocusChange}
                    cellRefs={cellRefs}
                    editedCells={editedCells}
                    impactedCells={impactedCells}
                    savedEditedCells={savedEditedCells}
                    unsavedNotes={unsavedNotes}
                    columnWidth={columnWidth}
                    searchTerm={searchTerm}
                    onCellEditStateChange={handleCellEditStateChange}
                    editHistory={cellEditHistory}
                    onCellFocusWithHistory={onCellFocusWithHistory}
                    lockedCells={lockedCells}
                    onCellContextMenu={onCellContextMenu}
                  />
              );
              }
              
              // No filtering - render normally
              return (
                <GridRowComponent
                  key={measure.id}
                  row={rowAfterImpactedFilter}
                  level={0}
                  isExpanded={expandedRows.has(measure.id)}
                  expandedRows={expandedRows}
                  onToggleExpand={toggleExpand}
                  formatValue={formatValue}
                  onCellChange={(rowId, monthKey, newValue, note) => {
                    handleCellChange(rowId, monthKey, newValue, note);
                  }}
                  visibleTimeKeys={getVisibleTimeKeys()}
                  focusedCell={focusedCell}
                  onCellFocus={setFocusedCell}
                  cellRefs={cellRefs}
                  editedCells={editedCells}
                  impactedCells={impactedCells}
                  savedEditedCells={savedEditedCells}
                  unsavedNotes={unsavedNotes}
                  columnWidth={columnWidth}
                  searchTerm={searchTerm}
                  onCellEditStateChange={handleCellEditStateChange}
                  editHistory={cellEditHistory}
                  onCellFocusWithHistory={onCellFocusWithHistory}
                  lockedCells={lockedCells}
                  onCellContextMenu={onCellContextMenu}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
    <GridFooter
        isVisible={isFooterVisible}
        impactedMeasuresCount={impactedMeasuresCount}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCancel={handleCancel}
        onSave={handleSave}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < undoRedoHistory.length - 1}
        showOnlyImpactedKPI={showOnlyImpactedKPI}
        onToggleShowOnlyImpactedKPI={handleToggleShowOnlyImpactedKPI}
      />
      
      {/* Cell Note Popover */}
      {editingCell && onAddAdjustmentNote && editingInputRef.current && (
        <CellNotePopover
          key={`${editingCell.rowId}-${editingCell.monthKey}`}
          isOpen={true}
          cellElement={editingInputRef.current.parentElement as HTMLElement || cellRefs.current.get(`${editingCell.rowId}-${editingCell.monthKey}`) || null}
          cellKey={`${editingCell.rowId}-${editingCell.monthKey}`}
          rowId={editingCell.rowId}
          timeKey={editingCell.monthKey as string}
          onAddNote={onAddAdjustmentNote}
          onClose={() => {
            setEditingCell(null);
            editingInputRef.current = null;
          }}
        />
      )}
    </div>
  );
};

export default HierarchicalGrid;


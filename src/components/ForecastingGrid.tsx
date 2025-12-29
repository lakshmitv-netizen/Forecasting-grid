import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MeasureData } from '../types';
import { CellEditHistoryEntry } from '../types/editHistory';
import { AdjustmentNote } from '../types/adjustmentNote';
import { mockData } from '../data/mockData';
import { adjustmentMeasuresData } from '../data/adjustmentMeasuresData';
import HierarchicalGrid from './HierarchicalGrid';
import DimensionsTimeGrid from './DimensionsTimeGrid';
import TimeDimensionsGrid from './TimeDimensionsGrid';
import GridToolbar from './GridToolbar';
import SettingsPanel from './SettingsPanel';
import FiltersPanel from './FiltersPanel';
import CellDetailsHistoryPanel from './CellDetailsHistoryPanel';
import CellEditInfoPopover from './CellEditInfoPopover';
import CellContextMenu from './CellContextMenu';
import '../styles/components/Grid.css';

// Cell focus types for different layouts
type HierarchicalGridFocus = { rowId: string; monthKey: string } | null;
type DimensionsTimeGridFocus = { rowId: string; measureId: string } | null;
type TimeDimensionsGridFocus = { rowId: string; measureId: string } | null;

const ForecastingGrid: React.FC = () => {
  const [selectedMeasureSubgroup, setSelectedMeasureSubgroup] = useState<string>('Revenue and Quantity Measures');
  const [selectedLayoutState, setSelectedLayoutState] = useState<string>('Measures / Dimensions x Time');
  const [data, setData] = useState<MeasureData[]>(mockData);
  
  // Store focused cell for each layout
  const hierarchicalGridFocusRef = useRef<HierarchicalGridFocus>(null);
  const dimensionsTimeGridFocusRef = useRef<DimensionsTimeGridFocus>(null);
  const timeDimensionsGridFocusRef = useRef<TimeDimensionsGridFocus>(null);
  
  // State to track current focused cell for CellDetailsHistoryPanel (triggers re-render)
  const [currentFocusedCell, setCurrentFocusedCell] = useState<{ rowId: string; monthKey?: string; measureId?: string } | null>(null);
  
  // State to track edit history for all cells (includes both edits and notes) - SAVED edits only
  const [editHistory, setEditHistory] = useState<CellEditHistoryEntry[]>([]);
  
  // State to track DRAFT edit history (unsaved edits) - Map keyed by cellKey for quick lookup/update
  const [draftEditHistory, setDraftEditHistory] = useState<Map<string, CellEditHistoryEntry>>(new Map());
  
  // State for locked cells - locked cells cannot be edited or impacted by propagation
  const [lockedCells, setLockedCells] = useState<Set<string>>(new Set());
  
  // State for undo/redo
  const undoHandlerRef = useRef<(() => void) | null>(null);
  const redoHandlerRef = useRef<(() => void) | null>(null);
  // Note: canUndo/canRedo state managed by HierarchicalGrid
  const [_canUndo, setCanUndo] = useState(false);
  const [_canRedo, setCanRedo] = useState(false);
  
  // Function to add/edit DRAFT edit history entry (unsaved edits)
  // If a draft already exists for this cellKey, update it; otherwise create new
  const addDraftEditHistory = useCallback((entry: Omit<CellEditHistoryEntry, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    setDraftEditHistory(prev => {
      const newMap = new Map(prev);
      const existingDraft = newMap.get(entry.cellKey);
      
      if (existingDraft) {
        // Update existing draft - merge value and note changes
        // Keep the original oldValue from first edit, update newValue and note
        newMap.set(entry.cellKey, {
          ...existingDraft,
          oldValue: existingDraft.oldValue ?? entry.oldValue,
          newValue: entry.newValue ?? existingDraft.newValue,
          note: entry.note !== undefined ? (entry.note.trim() || undefined) : existingDraft.note,
          timestamp: new Date(), // Update timestamp to latest edit
        });
      } else {
        // Create new draft entry
        const newDraft: CellEditHistoryEntry = {
          ...entry,
          id: `draft-${entry.cellKey}-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          userId: 'john-carter',
          userName: 'John Carter',
        };
        
        // Ensure note is preserved and trimmed
        if (newDraft.note) {
          newDraft.note = newDraft.note.trim();
        }
        
        newMap.set(entry.cellKey, newDraft);
      }
      
      return newMap;
    });
  }, []);

  // Function to commit drafts to saved edit history (called on Save)
  const commitDraftsToHistory = useCallback(() => {
    const draftsArray = Array.from(draftEditHistory.values());
    if (draftsArray.length > 0) {
      setEditHistory(prev => [...draftsArray, ...prev]);
      setDraftEditHistory(new Map()); // Clear drafts after committing
    }
  }, [draftEditHistory]);

  // Function to clear draft edits (called on Cancel)
  const clearDrafts = useCallback(() => {
    setDraftEditHistory(new Map());
  }, []);

  // Function to add adjustment note (for notes added separately, not during edit)
  // Now adds to drafts instead of saved history
  const addAdjustmentNote = useCallback((note: Omit<AdjustmentNote, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    // Add as note-only entry to draft history
    addDraftEditHistory({
      cellKey: note.cellKey,
      rowId: note.rowId,
      timeKey: note.timeKey,
      measureId: note.measureId,
      note: note.note,
    });
  }, [addDraftEditHistory]);

  // Handler for adding note from the panel footer
  const handlePanelAddNote = useCallback((rowId: string, monthKey: string, note: string) => {
    const cellKey = `${rowId}-${monthKey}`;
    addAdjustmentNote({
      cellKey,
      rowId,
      timeKey: monthKey,
      measureId: undefined,
      note,
    });
  }, [addAdjustmentNote]);

  // Handler for showing edit info popover when a cell is focused
  // Check both draft and saved edit history
  const handleCellFocusWithHistory = useCallback((cellKey: string, cellRect: DOMRect | null, cellValue?: number, isLocked?: boolean) => {
    if (!cellRect) {
      setEditInfoPopover(null);
      return;
    }
    
    // Check draft first (most recent), then saved history
    const draftEntry = draftEditHistory.get(cellKey);
    const savedEntry = editHistory.find(entry => entry.cellKey === cellKey);
    const latestEntry = draftEntry || savedEntry;
    
    // Show popover if there's edit history OR if cell is locked
    if (!latestEntry && !isLocked) {
      setEditInfoPopover(null);
      return;
    }
    
    // For locked cells without edit history, create a minimal entry
    const entryToShow = latestEntry || (isLocked ? {
      id: `locked-${cellKey}`,
      cellKey,
      rowId: cellKey.split('-')[0] || '',
      timestamp: new Date(),
      userId: 'current-user',
      userName: 'John Carter',
      oldValue: undefined,
      newValue: cellValue,
      note: undefined
    } as CellEditHistoryEntry : null);
    
    if (!entryToShow) {
      setEditInfoPopover(null);
      return;
    }
    
    // Position the popover below the cell
    const popoverWidth = 280;
    let leftPos = cellRect.left + window.scrollX;
    
    // Ensure popover doesn't go off the right edge
    if (leftPos + popoverWidth > window.innerWidth - 20) {
      leftPos = window.innerWidth - popoverWidth - 20;
    }
    
    setEditInfoPopover({
      entry: entryToShow,
      cellKey,
      cellValue: cellValue ?? 0,
      isLocked: isLocked || false,
      position: {
        top: cellRect.bottom + window.scrollY + 8,
        left: leftPos
      }
    });
  }, [editHistory, draftEditHistory]);

  // Close edit info popover
  const handleCloseEditInfoPopover = useCallback(() => {
    setEditInfoPopover(null);
  }, []);

  // Open edit history panel from popover
  const handleViewEditHistory = useCallback(() => {
    setEditInfoPopover(null);
    setIsCellDetailsHistoryOpen(true);
    setIsSettingsOpen(false);
    setIsFiltersOpen(false);
  }, []);
  
  // Debug: Log when editHistory changes
  useEffect(() => {
    console.log('[ForecastingGrid] editHistory changed, total entries:', editHistory.length);
  }, [editHistory]);

  // Wrapper for onDataChange that tracks edit history
  // Removed unused handleDataChangeWithHistory - using onEditHistory callback in grid components instead
  
  // Update data when measure subgroup changes
  useEffect(() => {
    if (selectedMeasureSubgroup === 'Adjustment Measures') {
      setData(adjustmentMeasuresData);
    } else {
      setData(mockData);
    }
  }, [selectedMeasureSubgroup]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCellDetailsHistoryOpen, setIsCellDetailsHistoryOpen] = useState(false);
  
  // State for cell edit info popover
  const [editInfoPopover, setEditInfoPopover] = useState<{
    entry: CellEditHistoryEntry | null;
    cellKey: string;
    cellValue: number;
    isLocked?: boolean;
    position: { top: number; left: number };
  } | null>(null);

  // State for context menu
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    cellKey: string;
    cellValue: number;
    isLocked: boolean;
    isEditable: boolean;
  } | null>(null);

  // Clipboard state for context menu
  const [clipboardValue, setClipboardValue] = useState<number | null>(null);

  // Merge draft and saved edit history for display in grid (so notes show up immediately)
  const mergedEditHistory = useMemo(() => {
    const drafts = Array.from(draftEditHistory.values());
    const merged = [...drafts, ...editHistory];
    // Sort by timestamp descending (most recent first)
    return merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [draftEditHistory, editHistory]);

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, cellKey: string, cellValue: number, isLocked: boolean, isEditable: boolean) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      cellKey,
      cellValue,
      isLocked,
      isEditable
    });
    // Close edit info popover if open
    setEditInfoPopover(null);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextCopy = useCallback(() => {
    if (contextMenu) {
      setClipboardValue(contextMenu.cellValue);
      navigator.clipboard.writeText(String(contextMenu.cellValue));
    }
  }, [contextMenu]);

  const handleContextPaste = useCallback(() => {
    // Paste functionality - would need to trigger cell update
    console.log('Paste:', clipboardValue);
  }, [clipboardValue]);

  const handleContextToggleLock = useCallback(() => {
    if (contextMenu) {
      setLockedCells((prev: Set<string>) => {
        const newSet = new Set(prev);
        if (newSet.has(contextMenu.cellKey)) {
          newSet.delete(contextMenu.cellKey);
        } else {
          newSet.add(contextMenu.cellKey);
        }
        return newSet;
      });
    }
  }, [contextMenu]);

  // Close popover on outside click
  useEffect(() => {
    if (!editInfoPopover) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the popover
      if (target.closest('.cell-edit-info-popover')) return;
      // Don't close if clicking on an editable cell (will show popover for that cell)
      if (target.closest('.editable-cell')) return;
      setEditInfoPopover(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editInfoPopover]);

  
  const [selectedDimensionLevels, setSelectedDimensionLevels] = useState<Set<string>>(
    new Set(['account', 'category', 'product'])
  );
  const [selectedTimeGranularities, setSelectedTimeGranularities] = useState<Set<string>>(
    new Set(['month'])
  );
  
  // Default column width based on layout - 50% of slider range
  // "Measures / Dimensions x Time": 50px - 200px range, default = 50 + (200-50)*0.5 = 125px
  // "Dimensions / Time x Measures": 50px - 300px range, default = 50 + (300-50)*0.5 = 175px
  // "Time / Dimensions x Measures": 50px - 300px range, default = 50 + (300-50)*0.5 = 175px
  const getDefaultColumnWidth = (layout: string): number => {
    if (layout === 'Measures / Dimensions x Time') {
      // Set to 100px to fill available space for 12 months
      return 100;
    } else {
      // Range: 50px - 300px, default to smaller value
      return 120;
    }
  };
  
  const [columnWidth, setColumnWidth] = useState<number>(getDefaultColumnWidth(selectedLayoutState));
  
  // Search state
  const [gridSearch, setGridSearch] = useState<string>('');
  
  // Refs to store expand/collapse handlers from HierarchicalGrid
  const expandAllRef = useRef<(() => void) | null>(null);
  const collapseAllRef = useRef<(() => void) | null>(null);
  
  const handleExpandAllRows = () => {
    if (expandAllRef.current) {
      expandAllRef.current();
    }
  };
  
  const handleCollapseAllRows = () => {
    if (collapseAllRef.current) {
      collapseAllRef.current();
    }
  };
  const [lastRefreshed] = useState(() => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time}, ${date}`;
  });

  // Format dimension levels for display
  const formatDimensionLevels = (levels: Set<string>): string => {
    const hasCategory = levels.has('category');
    const hasProduct = levels.has('product');
    const hasAccount = levels.has('account');
    
    const parts: string[] = [];
    
    // Add Account if selected
    if (hasAccount) {
      parts.push('Account');
    }
    
    // If both category and product are selected, treat as Product Dimensions
    if (hasCategory && hasProduct) {
      parts.push('Product Dimensions');
    } else {
      // Otherwise, add them individually if selected
      if (hasCategory) {
        parts.push('Category');
      }
      if (hasProduct) {
        parts.push('Product');
      }
    }
    
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.join(' & ');
    return parts.slice(0, -1).join(', ') + ' & ' + parts[parts.length - 1];
  };

  // Format status text based on layout
  const formatStatusText = (layout: string, measureSubgroup: string, dimensions: string): string => {
    const dimensionsText = dimensions.includes('Dimensions') ? dimensions : `${dimensions} Dimensions`;
    
    switch (layout) {
      case 'Measures / Dimensions x Time':
        // Header: Measures, Inner: Dimensions, Columns: Time
        return `${measureSubgroup} over ${dimensionsText} across Time`;
      
      case 'Dimensions / Time x Measures':
        // Header: Dimensions, Inner: Time, Columns: Measures
        return `${dimensionsText} over Time across ${measureSubgroup}`;
      
      case 'Time / Dimensions x Measures':
        // Header: Time, Inner: Dimensions, Columns: Measures
        return `Time over ${dimensionsText} across ${measureSubgroup}`;
      
      default:
        return `${measureSubgroup} over ${dimensionsText} across Time`;
    }
  };

  const handleDimensionLevelsChange = (levels: Set<string>) => {
    setSelectedDimensionLevels(levels);
  };

  const handleTimeGranularitiesChange = (granularities: Set<string>) => {
    setSelectedTimeGranularities(granularities);
  };

  // Handle layout change - preserve focus and update column width to layout-specific default
  const handleLayoutChange = (newLayout: string) => {
    setSelectedLayoutState(newLayout);
    // Update column width to default for new layout
    setColumnWidth(getDefaultColumnWidth(newLayout));
  };

  // Helper to map HierarchicalGrid focus to DimensionsTimeGrid focus
  const mapToDimensionsTimeFocus = (
    hierarchicalFocus: HierarchicalGridFocus
  ): DimensionsTimeGridFocus => {
    if (!hierarchicalFocus) return null;

    // Extract measure ID from rowId (e.g., "product-trn-a-measure-sa-qty" -> "measure-sa-qty")
    const parts = hierarchicalFocus.rowId.split('-');
    const measureIndex = parts.findIndex(part => part === 'measure');
    if (measureIndex === -1) return null;
    
    const measureId = `measure-${parts.slice(measureIndex + 1).join('-')}`;
    
    // Extract dimension ID (remove measure suffix)
    const dimensionId = parts.slice(0, measureIndex).join('-');
    
    // Build the transformed row ID: dimension-{dimensionId}-{timeKey}
    const timeKey = hierarchicalFocus.monthKey;
    let transformedRowId = `dimension-${dimensionId}`;
    
    // Add time period suffix based on monthKey
    if (timeKey === 'year') {
      transformedRowId = `${transformedRowId}-year`;
    } else if (timeKey.startsWith('q')) {
      // Quarter: dimension-{dimensionId}-year-{quarter}
      transformedRowId = `${transformedRowId}-year-${timeKey}`;
    } else {
      // Month: dimension-{dimensionId}-year-{quarter}-{month}
      // Need to determine which quarter contains this month
      const quarterMap: { [key: string]: string } = {
        'jan2026': 'q1', 'feb2026': 'q1', 'mar2026': 'q1',
        'apr2026': 'q2', 'may2026': 'q2', 'jun2026': 'q2',
        'jul2026': 'q3', 'aug2026': 'q3', 'sep2026': 'q3',
        'oct2026': 'q4', 'nov2026': 'q4', 'dec2026': 'q4',
      };
      const quarter = quarterMap[timeKey];
      if (quarter) {
        transformedRowId = `${transformedRowId}-year-${quarter}-${timeKey}`;
      }
    }

    return { rowId: transformedRowId, measureId };
  };

  // Helper to map DimensionsTimeGrid focus to HierarchicalGrid focus
  const mapToHierarchicalFocus = (
    dimensionsTimeFocus: DimensionsTimeGridFocus
  ): HierarchicalGridFocus => {
    if (!dimensionsTimeFocus) return null;

    // Extract dimension ID and time period from rowId
    // Format: dimension-{dimensionId}-year or dimension-{dimensionId}-year-{quarter} or dimension-{dimensionId}-year-{quarter}-{month}
    const rowId = dimensionsTimeFocus.rowId.replace('dimension-', '');
    
    // Split by '-' to parse
    const parts = rowId.split('-');
    
    // Find where time period starts (look for 'year')
    const yearIndex = parts.findIndex(part => part === 'year');
    if (yearIndex === -1) return null;
    
    // Dimension ID is everything before 'year'
    const dimensionId = parts.slice(0, yearIndex).join('-');
    
    // Determine time key
    let monthKey: string;
    if (parts.length === yearIndex + 1) {
      // Just year
      monthKey = 'year';
    } else if (parts.length === yearIndex + 2) {
      // Year and quarter
      monthKey = parts[yearIndex + 1];
    } else {
      // Year, quarter, and month
      monthKey = parts[yearIndex + 2];
    }
    
    // Build hierarchical rowId: {dimensionId}-{measureId}
    const measureId = dimensionsTimeFocus.measureId;
    const hierarchicalRowId = `${dimensionId}-${measureId}`;

    return { rowId: hierarchicalRowId, monthKey };
  };

  return (
    <div className="forecasting-container">
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumbs-row">
            <div className="breadcrumbs">
              Planning & Forecasting FY26
              <span className="breadcrumbs-separator">&gt;</span>
              Grid
            </div>
          </div>
          <div className="last-refreshed-row">
            <div className="last-refreshed">
              {(() => {
                const statusText = formatStatusText(selectedLayoutState, selectedMeasureSubgroup, formatDimensionLevels(selectedDimensionLevels));
                const parts = statusText.split(' over ');
                const secondPart = parts[1]?.split(' across ') || [];
                
                return (
                  <>
                    Showing{' '}
                    <span className="last-refreshed-semibold">{parts[0]}</span>
                    {' over '}
                    <span className="last-refreshed-semibold">{secondPart[0]}</span>
                    {' across '}
                    <span className="last-refreshed-semibold">{secondPart[1]}</span>
                    {' • Last refreshed '}
                    <span className="last-refreshed-semibold">{lastRefreshed}</span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="page-header-right">
          <button className="refresh-button" type="button" title="Refresh">
            <svg className="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"/>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
          </button>
          <GridToolbar 
            onSettingsClick={() => {
              setIsSettingsOpen(true);
              setIsFiltersOpen(false); // Close filters if settings opens
              setIsCellDetailsHistoryOpen(false); // Close cell details if settings opens
            }}
            onFilterClick={() => {
              setIsFiltersOpen(true);
              setIsSettingsOpen(false); // Close settings if filters opens
              setIsCellDetailsHistoryOpen(false); // Close cell details if filters opens
            }}
            onNotesClick={() => {
              setIsCellDetailsHistoryOpen(true);
              setIsSettingsOpen(false); // Close settings if cell details opens
              setIsFiltersOpen(false); // Close filters if cell details opens
            }}
            searchValue={gridSearch}
            onSearchChange={setGridSearch}
            isSettingsActive={isSettingsOpen}
            isFilterActive={isFiltersOpen}
            isNotesActive={isCellDetailsHistoryOpen}
          />
        </div>
      </div>
      <div className="grid-wrapper">
        {selectedLayoutState === 'Dimensions / Time x Measures' ? (
          <DimensionsTimeGrid 
            data={data} 
            onDataChange={setData} 
            selectedDimensionLevels={selectedDimensionLevels}
            selectedTimeGranularities={selectedTimeGranularities}
            columnWidth={columnWidth}
            onExpandAllRows={(handler) => { expandAllRef.current = handler; }}
            onCollapseAllRows={(handler) => { collapseAllRef.current = handler; }}
            onSettingsClick={() => setIsSettingsOpen(true)}
            initialFocusedCell={mapToDimensionsTimeFocus(hierarchicalGridFocusRef.current)}
            onFocusedCellChange={(focus) => { 
              dimensionsTimeGridFocusRef.current = focus;
              setCurrentFocusedCell(focus);
            }}
            searchTerm={gridSearch}
            onEditHistory={addDraftEditHistory}
          />
        ) : selectedLayoutState === 'Time / Dimensions x Measures' ? (
          <TimeDimensionsGrid 
            data={data} 
            onDataChange={setData} 
            selectedDimensionLevels={selectedDimensionLevels}
            selectedTimeGranularities={selectedTimeGranularities}
            columnWidth={columnWidth}
            onExpandAllRows={(handler) => { expandAllRef.current = handler; }}
            onCollapseAllRows={(handler) => { collapseAllRef.current = handler; }}
            onSettingsClick={() => setIsSettingsOpen(true)}
            initialFocusedCell={timeDimensionsGridFocusRef.current}
            onFocusedCellChange={(focus) => {
              timeDimensionsGridFocusRef.current = focus;
              setCurrentFocusedCell(focus);
            }}
            searchTerm={gridSearch}
            onEditHistory={addDraftEditHistory}
          />
        ) : (
          <HierarchicalGrid 
            data={data} 
            onDataChange={setData} 
            selectedDimensionLevels={selectedDimensionLevels}
            selectedTimeGranularities={selectedTimeGranularities}
            columnWidth={columnWidth}
            onExpandAllRows={(handler) => { expandAllRef.current = handler; }}
            onCollapseAllRows={(handler) => { collapseAllRef.current = handler; }}
            onSettingsClick={() => setIsSettingsOpen(true)}
            initialFocusedCell={mapToHierarchicalFocus(dimensionsTimeGridFocusRef.current)}
            onFocusedCellChange={(focus) => { 
              hierarchicalGridFocusRef.current = focus;
              setCurrentFocusedCell(focus);
            }}
            searchTerm={gridSearch}
            onEditHistory={addDraftEditHistory}
            onCommitDrafts={commitDraftsToHistory}
            onClearDrafts={clearDrafts}
            onAddAdjustmentNote={addAdjustmentNote}
            cellEditHistory={mergedEditHistory}
            onCellFocusWithHistory={handleCellFocusWithHistory}
            lockedCells={lockedCells}
            onUndoHandler={(handler) => { undoHandlerRef.current = handler; }}
            onRedoHandler={(handler) => { redoHandlerRef.current = handler; }}
            onCanUndoChange={setCanUndo}
            onCanRedoChange={setCanRedo}
            onCellContextMenu={handleContextMenu}
        />
        )}
        <SettingsPanel 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          selectedDimensionLevels={selectedDimensionLevels}
          onDimensionLevelsChange={handleDimensionLevelsChange}
          selectedTimeGranularities={selectedTimeGranularities}
          onTimeGranularitiesChange={handleTimeGranularitiesChange}
          columnWidth={columnWidth}
          onColumnWidthChange={setColumnWidth}
          onExpandAllRows={handleExpandAllRows}
          onCollapseAllRows={handleCollapseAllRows}
          selectedMeasureSubgroup={selectedMeasureSubgroup}
          onMeasureSubgroupChange={setSelectedMeasureSubgroup}
          selectedLayout={selectedLayoutState}
          onLayoutChange={handleLayoutChange}
        />
        <FiltersPanel 
          isOpen={isFiltersOpen} 
          onClose={() => setIsFiltersOpen(false)}
          selectedMeasureSubgroup={selectedMeasureSubgroup}
          onMeasureSubgroupChange={setSelectedMeasureSubgroup}
          selectedDimensionLevels={selectedDimensionLevels}
          onDimensionLevelsChange={handleDimensionLevelsChange}
          data={data}
        />
        <CellDetailsHistoryPanel 
          isOpen={isCellDetailsHistoryOpen} 
          onClose={() => setIsCellDetailsHistoryOpen(false)}
          focusedCell={currentFocusedCell}
          data={data}
          layout={selectedLayoutState}
          editHistory={editHistory}
          draftEditHistory={draftEditHistory}
          onAddNote={handlePanelAddNote}
        />
        
        {/* Cell Edit Info Popover - shown when a cell with edit history is focused */}
        {editInfoPopover && editInfoPopover.entry && (
          <CellEditInfoPopover
            entry={editInfoPopover.entry}
            position={editInfoPopover.position}
            isLocked={editInfoPopover.isLocked || false}
            lockedValue={editInfoPopover.isLocked ? editInfoPopover.cellValue : undefined}
            onViewHistory={handleViewEditHistory}
            onClose={handleCloseEditInfoPopover}
          />
        )}

        {/* Cell Context Menu - shown on right-click */}
        {contextMenu && (
          <CellContextMenu
            isOpen={contextMenu.isOpen}
            position={contextMenu.position}
            onClose={handleCloseContextMenu}
            onCopy={handleContextCopy}
            onPaste={handleContextPaste}
            onToggleLock={handleContextToggleLock}
            isLocked={contextMenu.isLocked}
            canPaste={clipboardValue !== null}
            isEditable={contextMenu.isEditable}
          />
        )}
      </div>
    </div>
  );
};

export default ForecastingGrid;


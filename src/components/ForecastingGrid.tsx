import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MeasureData } from '../types';
import { CellEditHistoryEntry } from '../types/editHistory';
import { AdjustmentNote } from '../types/adjustmentNote';
import { mockData } from '../data/mockData';
import { adjustmentMeasuresData } from '../data/adjustmentMeasuresData';
import { findRowById, getChildren, distributeProportionally, propagateDownward, propagateUpward } from '../utils/valuePropagation';
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
  const [visibleMeasureIds, setVisibleMeasureIds] = useState<Set<string>>(new Set());
  
  // Store focused cell for each layout
  const hierarchicalGridFocusRef = useRef<HierarchicalGridFocus>(null);
  const dimensionsTimeGridFocusRef = useRef<DimensionsTimeGridFocus>(null);
  const timeDimensionsGridFocusRef = useRef<TimeDimensionsGridFocus>(null);
  
  // State to track current focused cell for CellDetailsHistoryPanel (triggers re-render)
  const [currentFocusedCell, setCurrentFocusedCell] = useState<{ rowId: string; monthKey?: string; measureId?: string } | null>(null);
  
  // State to track selected cells for multi-cell operations
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [lastSelectedCell, setLastSelectedCell] = useState<string | null>(null);
  // Ref to track selectedCells for synchronous access
  const selectedCellsRef = useRef<Set<string>>(new Set());
  
  // Track which cell is currently being edited globally
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  // Track cells that were impacted but are now saved (to prevent showing old popovers)
  const [savedImpactedCells, setSavedImpactedCells] = useState<Set<string>>(new Set());
  // Ref to track savedImpactedCells for synchronous access in callbacks
  const savedImpactedCellsRef = useRef<Set<string>>(new Set());
  
  // Keep refs in sync with state
  useEffect(() => {
    selectedCellsRef.current = selectedCells;
  }, [selectedCells]);
  
  useEffect(() => {
    savedImpactedCellsRef.current = savedImpactedCells;
  }, [savedImpactedCells]);
  
  // Handler for cell selection
  const handleCellSelect = useCallback((cellKey: string, event: React.MouseEvent) => {
    // Prevent selection if this is a double-click (which should enter edit mode)
    // Note: detail is only available on click events, not mousedown
    if (event.type === 'click' && event.detail === 2) {
      return;
    }
    
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    
    // If clicking a cell while another is editing, ALWAYS clear selection synchronously first
    // This prevents the editing cell from staying selected
    // BUT: Don't do this for Shift or Ctrl/Cmd clicks (they should work normally)
    if (editingCellKey && editingCellKey !== cellKey && !isCtrlOrCmd && !isShift) {
      // Clear selection and select only the new cell in one operation
      setSelectedCells(new Set([cellKey]));
      setLastSelectedCell(cellKey);
      return; // Early return to prevent double-processing
    }
    
    setSelectedCells(prev => {
      const newSelection = new Set<string>();
      
      if (isCtrlOrCmd) {
        // Toggle selection - keep previous selection and toggle this cell
        prev.forEach(cell => newSelection.add(cell));
        if (prev.has(cellKey)) {
          newSelection.delete(cellKey);
        } else {
          newSelection.add(cellKey);
        }
        setLastSelectedCell(cellKey);
      } else if (isShift) {
        // Shift key pressed - range selection
        if (lastSelectedCell && lastSelectedCell !== cellKey) {
          // Range selection - keep previous selection and add range from lastSelectedCell to cellKey
          // First, keep all previously selected cells
          prev.forEach(cell => newSelection.add(cell));
          // Then add the range endpoints
          newSelection.add(cellKey);
          newSelection.add(lastSelectedCell);
          // Add all cells in between (simplified - would need grid structure knowledge)
          // For now, just select the two endpoints
          setLastSelectedCell(cellKey);
        } else {
          // Shift clicked but no lastSelectedCell or same cell - treat as single selection and set it for next Shift click
          newSelection.clear();
          newSelection.add(cellKey);
          setLastSelectedCell(cellKey);
        }
      } else {
        // Single selection - ALWAYS clear previous and select new
        // This handles: normal click, or clicking same cell
        // This ensures that when clicking a cell while another is editing, we clear the old selection
        newSelection.clear();
        newSelection.add(cellKey);
        setLastSelectedCell(cellKey);
      }
      
      return newSelection;
    });
  }, [lastSelectedCell, editingCellKey]);
  
  // Clear selection handler
  const handleClearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setLastSelectedCell(null);
  }, []);
  
  // Clear selection when clicking outside the grid
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't clear if clicking on a cell, dropdown, panel, or toolbar buttons
      if (
        target.closest('.grid-cell') ||
        target.closest('.cell-details-history-panel') ||
        target.closest('.settings-panel') ||
        target.closest('.filters-panel') ||
        target.closest('.cell-details-history-dropdown-list') ||
        target.closest('.multi-cell-dropdown-list') ||
        target.closest('.grid-button-group') ||
        target.closest('.grid-button-group-item')
      ) {
        return;
      }
      // Clear selection on outside click
      setSelectedCells(new Set());
      setLastSelectedCell(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Function to create initial edit history entries with sample data
  const createInitialEditHistory = (): CellEditHistoryEntry[] => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    return [
      // Cells with both arrow and note indicators
      {
        id: 'initial-1',
        cellKey: 'account-measure-sa-qty-jan2026',
        rowId: 'account-measure-sa-qty',
        timeKey: 'jan2026',
        oldValue: 800,
        newValue: 950,
        note: 'Increased forecast based on strong Q1 pipeline and new customer commitments',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-2',
        cellKey: 'category-transmission-measure-sa-rev-feb2026',
        rowId: 'category-transmission-measure-sa-rev',
        timeKey: 'feb2026',
        oldValue: 40000,
        newValue: 35000,
        note: 'Adjusted downward due to supply chain delays affecting transmission assembly',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3',
        cellKey: 'product-trn-a-measure-opp-qty-mar2026',
        rowId: 'product-trn-a-measure-opp-qty',
        timeKey: 'mar2026',
        oldValue: 120,
        newValue: 150,
        note: 'TRN 750 - A demand increased following successful product launch event',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3a',
        cellKey: 'product-trn-b-measure-sa-qty-apr2026',
        rowId: 'product-trn-b-measure-sa-qty',
        timeKey: 'apr2026',
        oldValue: 80,
        newValue: 105,
        note: 'TRN 750 - B showing strong performance in Q2, adjusted forecast upward',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3b',
        cellKey: 'category-chassis-measure-opp-rev-may2026',
        rowId: 'category-chassis-measure-opp-rev',
        timeKey: 'may2026',
        oldValue: 60000,
        newValue: 52000,
        note: 'Chassis components forecast reduced due to material cost increases and supplier delays',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3c',
        cellKey: 'product-chs-a-measure-sa-qty-jun2026',
        rowId: 'product-chs-a-measure-sa-qty',
        timeKey: 'jun2026',
        oldValue: 120,
        newValue: 145,
        note: 'CHS 500 - A demand surge expected in June following new customer onboarding',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3d',
        cellKey: 'account-measure-opp-qty-jul2026',
        rowId: 'account-measure-opp-qty',
        timeKey: 'jul2026',
        oldValue: 1200,
        newValue: 1100,
        note: 'Q3 opportunity quantity adjusted based on revised sales pipeline analysis',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3e',
        cellKey: 'category-engine-measure-sa-rev-aug2026',
        rowId: 'category-engine-measure-sa-rev',
        timeKey: 'aug2026',
        oldValue: 40000,
        newValue: 45000,
        note: 'Engine assembly revenue increased due to higher production capacity and efficiency gains',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3f',
        cellKey: 'product-eng-y-measure-opp-rev-sep2026',
        rowId: 'product-eng-y-measure-opp-rev',
        timeKey: 'sep2026',
        oldValue: 12000,
        newValue: 10000,
        note: 'Engine Y revenue forecast reduced following competitive pricing analysis and market conditions',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3g',
        cellKey: 'product-trn-c-measure-sa-qty-oct2026',
        rowId: 'product-trn-c-measure-sa-qty',
        timeKey: 'oct2026',
        oldValue: 80,
        newValue: 95,
        note: 'TRN 750 - C sales forecast updated based on customer feedback and product improvements',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3h',
        cellKey: 'category-transmission-measure-opp-qty-nov2026',
        rowId: 'category-transmission-measure-opp-qty',
        timeKey: 'nov2026',
        oldValue: 600,
        newValue: 680,
        note: 'Transmission assembly opportunity quantity increased for Q4 based on strong market demand',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3i',
        cellKey: 'product-chs-b-measure-opp-rev-dec2026',
        rowId: 'product-chs-b-measure-opp-rev',
        timeKey: 'dec2026',
        oldValue: 12000,
        newValue: 10500,
        note: 'CHS 500 - B year-end forecast adjusted to reflect conservative Q4 projections',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3j',
        cellKey: 'product-trn-d-measure-sa-qty-jan2026',
        rowId: 'product-trn-d-measure-sa-qty',
        timeKey: 'jan2026',
        oldValue: 80,
        newValue: 65,
        note: 'TRN 750 - D forecast reduced due to component availability constraints',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3k',
        cellKey: 'category-chassis-measure-sa-rev-feb2026',
        rowId: 'category-chassis-measure-sa-rev',
        timeKey: 'feb2026',
        oldValue: 40000,
        newValue: 36000,
        note: 'Chassis components revenue decreased following customer order cancellations',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3l',
        cellKey: 'product-chs-c-measure-opp-qty-mar2026',
        rowId: 'product-chs-c-measure-opp-qty',
        timeKey: 'mar2026',
        oldValue: 120,
        newValue: 95,
        note: 'CHS 500 - C opportunity quantity reduced after competitor pricing analysis',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3m',
        cellKey: 'account-measure-sa-rev-apr2026',
        rowId: 'account-measure-sa-rev',
        timeKey: 'apr2026',
        oldValue: 80000,
        newValue: 72000,
        note: 'Sales agreement revenue adjusted downward due to delayed contract negotiations',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3n',
        cellKey: 'product-eng-z-measure-opp-rev-may2026',
        rowId: 'product-eng-z-measure-opp-rev',
        timeKey: 'may2026',
        oldValue: 12000,
        newValue: 9800,
        note: 'Engine Z opportunity revenue decreased following technical specification changes',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3o',
        cellKey: 'category-engine-measure-opp-qty-jun2026',
        rowId: 'category-engine-measure-opp-qty',
        timeKey: 'jun2026',
        oldValue: 600,
        newValue: 520,
        note: 'Engine assembly opportunity quantity reduced due to market volatility and economic factors',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3p',
        cellKey: 'product-trn-e-measure-sa-rev-jul2026',
        rowId: 'product-trn-e-measure-sa-rev',
        timeKey: 'jul2026',
        oldValue: 8000,
        newValue: 6800,
        note: 'TRN 750 - E sales revenue forecast decreased following quality control review',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3q',
        cellKey: 'category-chassis-measure-sa-qty-aug2026',
        rowId: 'category-chassis-measure-sa-qty',
        timeKey: 'aug2026',
        oldValue: 400,
        newValue: 340,
        note: 'Chassis components quantity reduced due to production capacity limitations',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3r',
        cellKey: 'product-chs-d-measure-opp-rev-sep2026',
        rowId: 'product-chs-d-measure-opp-rev',
        timeKey: 'sep2026',
        oldValue: 12000,
        newValue: 10200,
        note: 'CHS 500 - D opportunity revenue adjusted following customer budget constraints',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3s',
        cellKey: 'account-measure-opp-qty-oct2026',
        rowId: 'account-measure-opp-qty',
        timeKey: 'oct2026',
        oldValue: 1200,
        newValue: 1080,
        note: 'Opportunity quantity decreased due to extended sales cycle and market uncertainty',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-3t',
        cellKey: 'category-transmission-measure-sa-rev-nov2026',
        rowId: 'category-transmission-measure-sa-rev',
        timeKey: 'nov2026',
        oldValue: 40000,
        newValue: 35000,
        note: 'Transmission assembly sales revenue reduced following supplier delivery delays',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      // Cells with just arrow indicators (no notes)
      {
        id: 'initial-4',
        cellKey: 'account-measure-opp-rev-apr2026',
        rowId: 'account-measure-opp-rev',
        timeKey: 'apr2026',
        oldValue: 120000,
        newValue: 135000,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-5',
        cellKey: 'category-engine-measure-sa-qty-may2026',
        rowId: 'category-engine-measure-sa-qty',
        timeKey: 'may2026',
        oldValue: 400,
        newValue: 320,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6',
        cellKey: 'product-eng-x-measure-opp-rev-jun2026',
        rowId: 'product-eng-x-measure-opp-rev',
        timeKey: 'jun2026',
        oldValue: 12000,
        newValue: 14000,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6a',
        cellKey: 'product-trn-c-measure-sa-qty-jan2026',
        rowId: 'product-trn-c-measure-sa-qty',
        timeKey: 'jan2026',
        oldValue: 80,
        newValue: 95,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6b',
        cellKey: 'category-chassis-measure-sa-qty-feb2026',
        rowId: 'category-chassis-measure-sa-qty',
        timeKey: 'feb2026',
        oldValue: 400,
        newValue: 320,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6c',
        cellKey: 'product-chs-b-measure-opp-qty-mar2026',
        rowId: 'product-chs-b-measure-opp-qty',
        timeKey: 'mar2026',
        oldValue: 120,
        newValue: 140,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6d',
        cellKey: 'account-measure-sa-rev-may2026',
        rowId: 'account-measure-sa-rev',
        timeKey: 'may2026',
        oldValue: 80000,
        newValue: 88000,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6e',
        cellKey: 'product-eng-x-measure-sa-qty-jul2026',
        rowId: 'product-eng-x-measure-sa-qty',
        timeKey: 'jul2026',
        oldValue: 80,
        newValue: 70,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6f',
        cellKey: 'category-transmission-measure-opp-rev-aug2026',
        rowId: 'category-transmission-measure-opp-rev',
        timeKey: 'aug2026',
        oldValue: 60000,
        newValue: 55000,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6g',
        cellKey: 'product-trn-e-measure-sa-qty-sep2026',
        rowId: 'product-trn-e-measure-sa-qty',
        timeKey: 'sep2026',
        oldValue: 80,
        newValue: 90,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6h',
        cellKey: 'category-engine-measure-opp-qty-oct2026',
        rowId: 'category-engine-measure-opp-qty',
        timeKey: 'oct2026',
        oldValue: 600,
        newValue: 650,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6i',
        cellKey: 'product-chs-c-measure-sa-rev-nov2026',
        rowId: 'product-chs-c-measure-sa-rev',
        timeKey: 'nov2026',
        oldValue: 8000,
        newValue: 7200,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6j',
        cellKey: 'account-measure-opp-rev-dec2026',
        rowId: 'account-measure-opp-rev',
        timeKey: 'dec2026',
        oldValue: 120000,
        newValue: 132000,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6k',
        cellKey: 'product-trn-a-measure-sa-rev-feb2026',
        rowId: 'product-trn-a-measure-sa-rev',
        timeKey: 'feb2026',
        oldValue: 8000,
        newValue: 7500,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6l',
        cellKey: 'category-chassis-measure-opp-qty-apr2026',
        rowId: 'category-chassis-measure-opp-qty',
        timeKey: 'apr2026',
        oldValue: 600,
        newValue: 540,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6m',
        cellKey: 'product-eng-y-measure-sa-qty-may2026',
        rowId: 'product-eng-y-measure-sa-qty',
        timeKey: 'may2026',
        oldValue: 80,
        newValue: 88,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6n',
        cellKey: 'category-transmission-measure-sa-qty-jun2026',
        rowId: 'category-transmission-measure-sa-qty',
        timeKey: 'jun2026',
        oldValue: 400,
        newValue: 380,
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-6o',
        cellKey: 'product-chs-d-measure-opp-qty-jul2026',
        rowId: 'product-chs-d-measure-opp-qty',
        timeKey: 'jul2026',
        oldValue: 120,
        newValue: 135,
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      // Cells with just note indicators (no value changes)
      {
        id: 'initial-7',
        cellKey: 'account-measure-sa-qty-jul2026',
        rowId: 'account-measure-sa-qty',
        timeKey: 'jul2026',
        oldValue: 800,
        newValue: 800,
        note: 'Monitoring Q3 trends closely - may need adjustment based on mid-quarter review',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-8',
        cellKey: 'category-transmission-measure-opp-qty-aug2026',
        rowId: 'category-transmission-measure-opp-qty',
        timeKey: 'aug2026',
        oldValue: 600,
        newValue: 600,
        note: 'Waiting for confirmation on large enterprise deal before finalizing August forecast',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-9',
        cellKey: 'product-trn-b-measure-sa-rev-sep2026',
        rowId: 'product-trn-b-measure-sa-rev',
        timeKey: 'sep2026',
        oldValue: 8000,
        newValue: 8000,
        note: 'TRN 750 - B showing consistent performance, no changes needed at this time',
        timestamp: yesterday,
        userId: 'john-carter',
        userName: 'John Carter',
      },
      {
        id: 'initial-10',
        cellKey: 'product-eng-y-measure-opp-qty-oct2026',
        rowId: 'product-eng-y-measure-opp-qty',
        timeKey: 'oct2026',
        oldValue: 120,
        newValue: 120,
        note: 'Engine Y production capacity review scheduled for next week',
        timestamp: twoDaysAgo,
        userId: 'john-carter',
        userName: 'John Carter',
      },
    ];
  };

  // State to track edit history for all cells (includes both edits and notes) - SAVED edits only
  const [editHistory, setEditHistory] = useState<CellEditHistoryEntry[]>(createInitialEditHistory());
  
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
  
  // Ref to store cell change handler for programmatic mass updates
  const cellChangeHandlerRef = useRef<((rowId: string, monthKey: string, newValue: number, note?: string) => void) | null>(null);
  // Ref to get current cell value from grid's internal state
  const getCurrentCellValueRef = useRef<((rowId: string, monthKey: string) => number) | null>(null);
  
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

  // Mass update handler
  const handleMassUpdate = useCallback((cellKeys: string[], rule: string, valueStr: string, note?: string) => {
    if (cellKeys.length === 0) return;
    
    // Parse value - support percentage (e.g., "20%") or absolute number
    const isPercentage = valueStr.trim().endsWith('%');
    const numericValue = parseFloat(valueStr.replace('%', '').trim());
    
    if (isNaN(numericValue)) {
      console.log('[MassUpdate] Invalid numeric value:', valueStr);
      return;
    }
    
    console.log('[MassUpdate] Starting update for', cellKeys.length, 'cells, rule:', rule, 'value:', numericValue, isPercentage ? '%' : '');
    
    // Use the grid's handler directly - it handles edited cells, impacted cells, and propagation
    if (cellChangeHandlerRef.current && getCurrentCellValueRef.current && selectedLayoutState === 'Measures / Dimensions x Time') {
      // Process each cell sequentially to ensure each reads the latest state after previous updates
      const processUpdates = async () => {
        for (let i = 0; i < cellKeys.length; i++) {
          const cellKey = cellKeys[i];
          
          // Parse cellKey: format is `${rowId}-${monthKey}` where rowId can contain dashes
          // monthKey is always the last part (e.g., 'feb2026', 'jan2026', 'year', 'q1', etc.)
          const parts = cellKey.split('-');
          if (parts.length < 2) {
            console.log('[MassUpdate] Invalid cellKey:', cellKey);
            continue;
          }
          const monthKey = parts[parts.length - 1];
          const rowId = parts.slice(0, -1).join('-');
          
          if (!rowId || !monthKey) {
            console.log('[MassUpdate] Invalid cellKey:', cellKey);
            continue;
          }
          
          // Wait a bit before processing to ensure previous update completed and state synced
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Get current value from grid's internal state (reads latest after previous updates)
          if (!getCurrentCellValueRef.current) continue;
          const currentValue = getCurrentCellValueRef.current(rowId, monthKey);
          
          // Calculate new value based on rule
          let newValue: number;
          switch (rule) {
            case 'Increase':
              newValue = isPercentage ? currentValue * (1 + numericValue / 100) : currentValue + numericValue;
              break;
            case 'Decrease':
              newValue = isPercentage ? currentValue * (1 - numericValue / 100) : currentValue - numericValue;
              break;
            case 'Set to':
              newValue = numericValue;
              break;
            case 'Multiply by':
              newValue = currentValue * numericValue;
              break;
            case 'Divide by':
              if (numericValue === 0) continue;
              newValue = currentValue / numericValue;
              break;
            default:
              continue;
          }
          
          // Round to nearest integer
          newValue = Math.round(newValue);
          
          // Call the grid's handler - it will:
          // 1. Mark cell as edited
          // 2. Mark impacted cells
          // 3. Trigger propagation
          // 4. Call onEditHistory callback
          // 5. Update gridData and call onDataChange
          if (cellChangeHandlerRef.current) {
            cellChangeHandlerRef.current(rowId, monthKey as any, newValue, note?.trim() || undefined);
            
            // Wait a bit after calling handler to allow state updates to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };
      
      // Start processing updates (don't await - let it run in background)
      processUpdates();
    } else {
      // Fallback: Update data directly for other layouts
      setData(prevData => {
        const updatedData = JSON.parse(JSON.stringify(prevData)) as MeasureData[];
        
        cellKeys.forEach(cellKey => {
          // Parse cellKey: format is `${rowId}-${monthKey}` where rowId can contain dashes
          const parts = cellKey.split('-');
          if (parts.length < 2) return;
          const monthKey = parts[parts.length - 1];
          const rowId = parts.slice(0, -1).join('-');
          
          if (!rowId || !monthKey) return;
          
          const originalRow = findRowById(rowId, prevData);
          if (!originalRow) return;
          
          const currentValue = originalRow.values[monthKey as keyof typeof originalRow.values] || 0;
          
          let newValue: number;
          switch (rule) {
            case 'Increase':
              newValue = isPercentage ? currentValue * (1 + numericValue / 100) : currentValue + numericValue;
              break;
            case 'Decrease':
              newValue = isPercentage ? currentValue * (1 - numericValue / 100) : currentValue - numericValue;
              break;
            case 'Set to':
              newValue = numericValue;
              break;
            case 'Multiply by':
              newValue = currentValue * numericValue;
              break;
            case 'Divide by':
              if (numericValue === 0) return;
              newValue = currentValue / numericValue;
              break;
            default:
              return;
          }
          
          newValue = Math.round(newValue);
          const row = findRowById(rowId, updatedData);
          if (row) {
            row.values[monthKey as keyof typeof row.values] = newValue;
          }
          
          // Track edit history
          addDraftEditHistory({
            cellKey,
            rowId,
            timeKey: monthKey,
            oldValue: currentValue,
            newValue,
            note: note?.trim() || undefined,
          });
        });
        
        return updatedData;
      });
    }
    
    // Clear selection after update
    handleClearSelection();
  }, [data, addDraftEditHistory, handleClearSelection, selectedLayoutState]);

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

  // Function to add a new note entry (always creates a new thread, never updates existing)
  // Used for notes posted from the panel footer
  // Uses entry ID as Map key to allow multiple entries per cellKey
  const addNewNoteEntry = useCallback((entry: Omit<CellEditHistoryEntry, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    setDraftEditHistory(prev => {
      const newMap = new Map(prev);
      // Always create a new entry with unique ID, even if one exists for this cellKey
      const uniqueId = `draft-note-${entry.cellKey}-${Date.now()}-${Math.random()}`;
      const newDraft: CellEditHistoryEntry = {
        ...entry,
        id: uniqueId,
        timestamp: new Date(),
        userId: 'john-carter',
        userName: 'John Carter',
      };
      
      // Ensure note is preserved and trimmed
      if (newDraft.note) {
        newDraft.note = newDraft.note.trim();
      }
      
      // Use unique ID as key to allow multiple entries per cellKey
      // This allows multiple note threads for the same cell
      newMap.set(uniqueId, newDraft);
      
      return newMap;
    });
  }, []);

  // Handler for adding note from the panel footer
  // Always creates a new thread entry, never updates existing
  const handlePanelAddNote = useCallback((rowId: string, monthKey: string, note: string) => {
    const cellKey = `${rowId}-${monthKey}`;
    // Use addNewNoteEntry to always create a new thread
    addNewNoteEntry({
      cellKey,
      rowId,
      timeKey: monthKey,
      measureId: undefined,
      note,
    });
  }, [addNewNoteEntry]);

  // Handler for showing edit info popover when a cell is focused
  // Check both draft and saved edit history
  const handleCellFocusWithHistory = useCallback((cellKey: string, cellRect: DOMRect | null, cellValue?: number, isLocked?: boolean, isImpacted?: boolean) => {
    if (!cellRect) {
      setEditInfoPopover(null);
      return;
    }
    
    // If cell is impacted, don't show old edit history popover - impacted cells show their own state
    // Also don't show popover for cells that were impacted but are now saved (no direct change in current session)
    if (isImpacted) {
      console.log('[handleCellFocusWithHistory] Cell is impacted, closing popover:', cellKey);
      setEditInfoPopover(null);
      return;
    }
    
    // Check if this cell was impacted but is now saved (shouldn't show popover)
    // These cells were impacted in a previous session but are now saved, so they shouldn't show old popovers
    // Use ref for synchronous access to latest value
    if (savedImpactedCellsRef.current.has(cellKey)) {
      console.log('[handleCellFocusWithHistory] Cell was saved impacted, closing popover:', cellKey, 'savedImpactedCells size:', savedImpactedCellsRef.current.size);
      setEditInfoPopover(null);
      return;
    }
    
    // Check draft first (most recent), then saved history
    const draftEntry = draftEditHistory.get(cellKey);
    const savedEntry = editHistory.find(entry => entry.cellKey === cellKey);
    const latestEntry = draftEntry || savedEntry;
    
    // Show popover if there's edit history OR if cell is locked
    // But don't show if cell was impacted and saved (no direct change in current session)
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
  }, [editHistory, draftEditHistory]); // Note: savedImpactedCellsRef is a ref, so it doesn't need to be in deps

  // Close edit info popover
  const handleCloseEditInfoPopover = useCallback(() => {
    setEditInfoPopover(null);
  }, []);

  // Open edit history panel from popover
  const handleViewEditHistory = useCallback(() => {
    setEditInfoPopover(null);
    // Switch to single cell tab when opening from popover
    // Force panel remount by changing key to ensure tab switches
    setCellDetailsInitialTab('single');
    setPanelKey(prev => prev + 1); // Change key to force remount
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
  
  // Function to apply initial edit history to data
  const applyInitialEditHistoryToData = useCallback((baseData: MeasureData[]): MeasureData[] => {
    const initialHistory = createInitialEditHistory();
    const updatedData = JSON.parse(JSON.stringify(baseData)); // Deep clone
    
    // Update individual cell values to their final (newValue) state
    initialHistory.forEach(entry => {
      if (entry.oldValue !== undefined && entry.newValue !== undefined && entry.oldValue !== entry.newValue) {
        // Find the row and update its value to the final value
        const row = findRowById(entry.rowId, updatedData);
        if (row && entry.timeKey && row.values[entry.timeKey as keyof typeof row.values] !== undefined) {
          const delta = entry.newValue - entry.oldValue;
          const monthKey = entry.timeKey as keyof typeof row.values;
          
          // Check if this row has children (it's a parent row)
          const children = getChildren(entry.rowId, updatedData);
          
          if (children.length > 0) {
            // This is a parent row - distribute the change proportionally to children
            // First, update the parent row value
            row.values[monthKey] = entry.newValue;
            
            // Then distribute the delta to children proportionally
            const distribution = distributeProportionally(delta, children, monthKey as any);
            
            for (const [childId, childDelta] of distribution.entries()) {
              const child = findRowById(childId, updatedData);
              if (child) {
                const currentValue = child.values[monthKey];
                child.values[monthKey] = currentValue + childDelta;
                
                // Recursively propagate to grandchildren if any
                const grandchildUpdates = propagateDownward(childId, monthKey as any, childDelta, updatedData);
                grandchildUpdates.forEach(update => {
                  const grandchild = findRowById(update.rowId, updatedData);
                  if (grandchild) {
                    grandchild.values[update.monthKey] = update.newValue;
                  }
                });
              }
            }
          } else {
            // This is a leaf row - update directly and propagate upward to parents
            row.values[monthKey] = entry.newValue;
            
            // Propagate upward to update parent rows
            const ancestorUpdates = propagateUpward(entry.rowId, monthKey as any, delta, updatedData);
            ancestorUpdates.forEach(update => {
              const ancestor = findRowById(update.rowId, updatedData);
              if (ancestor) {
                ancestor.values[update.monthKey] = update.newValue;
              }
            });
          }
        }
      }
    });
    
    // Note: HierarchicalGrid will automatically recalculate aggregations (quarters, year) 
    // and parent row sums when it receives this data, but since we've already distributed
    // parent changes to children, the sums will be correct
    
    return updatedData;
  }, []);

  // Update data when measure subgroup changes
  useEffect(() => {
    if (selectedMeasureSubgroup === 'Adjustment Measures') {
      setData(adjustmentMeasuresData);
      // Initialize all measures as visible
      setVisibleMeasureIds(new Set(adjustmentMeasuresData.map(m => m.id)));
    } else {
      // Always apply initial edit history to mockData for Revenue and Quantity Measures
      const dataWithHistory = applyInitialEditHistoryToData(mockData);
      setData(dataWithHistory);
      // Initialize all measures as visible
      setVisibleMeasureIds(new Set(mockData.map(m => m.id)));
    }
  }, [selectedMeasureSubgroup, applyInitialEditHistoryToData]);

  // Handle measure reordering
  const handleMeasuresReorder = useCallback((orderedMeasures: MeasureData[], visibleIds: Set<string>) => {
    setData(orderedMeasures);
    setVisibleMeasureIds(new Set(visibleIds)); // Create a new Set to ensure state update
  }, []);

  // Filter data based on visible measures
  const filteredData = useMemo(() => {
    if (visibleMeasureIds.size === 0) {
      // If no visibility set yet, show all
      return data;
    }
    return data.filter(measure => visibleMeasureIds.has(measure.id));
  }, [data, visibleMeasureIds]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCellDetailsHistoryOpen, setIsCellDetailsHistoryOpen] = useState(false);
  const [cellDetailsInitialTab, setCellDetailsInitialTab] = useState<'single' | 'multi'>('single');
  const [panelKey, setPanelKey] = useState(0); // Key to force panel remount when switching tabs
  
  // State for cell edit info popover
  const [editInfoPopover, setEditInfoPopover] = useState<{
    entry: CellEditHistoryEntry | null;
    cellKey: string;
    cellValue: number;
    isLocked?: boolean;
    position: { top: number; left: number };
  } | null>(null);
  
  // Also check and close popover if currently open cell becomes saved impacted
  useEffect(() => {
    if (editInfoPopover && savedImpactedCellsRef.current.has(editInfoPopover.cellKey)) {
      console.log('[ForecastingGrid] Currently open popover cell is now saved impacted, closing:', editInfoPopover.cellKey);
      setEditInfoPopover(null);
    }
  }, [editInfoPopover, savedImpactedCells]);

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

  const handleContextMassUpdate = useCallback(() => {
    // Close context menu first
    setContextMenu(null);
    // Open the panel with multi-cell tab active immediately
    setCellDetailsInitialTab('multi');
    setIsCellDetailsHistoryOpen(true);
    setIsSettingsOpen(false);
    setIsFiltersOpen(false);
  }, []);

  // Handler for single cell update from the panel
  const handleSingleCellUpdate = useCallback((rowId: string, monthKey: string, newValue: number, adjustmentNote?: string) => {
    if (selectedLayoutState === 'Measures / Dimensions x Time') {
      // Use HierarchicalGrid's cell change handler
      if (cellChangeHandlerRef.current) {
        cellChangeHandlerRef.current(rowId, monthKey as any, newValue, adjustmentNote);
      }
    } else {
      // For other layouts, would need to call appropriate handlers
      // For now, log it
      console.log('[ForecastingGrid] Single cell update:', { rowId, monthKey, newValue, adjustmentNote });
    }
  }, [selectedLayoutState]);

  // Handler for toggling cell lock from the panel
  const handleToggleCellLock = useCallback((cellKey: string) => {
    setLockedCells((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }
      return newSet;
    });
  }, []);

  // Check if a cell is locked
  const isCellLocked = useCallback((cellKey: string) => {
    return lockedCells.has(cellKey);
  }, [lockedCells]);

  // Get current cell value from data
  const getCellValue = useCallback((rowId: string, monthKey: string): number | undefined => {
    // Find the row in the data structure
    const findRowValue = (items: any[]): number | undefined => {
      for (const item of items) {
        if (item.id === rowId) {
          return item.values?.[monthKey as keyof typeof item.values];
        }
        if (item.children) {
          const found = findRowValue(item.children);
          if (found !== undefined) return found;
        }
      }
      return undefined;
    };
    return findRowValue(data);
  }, [data]);

  // Select a single cell (used by View All Changes in the panel)
  const handleSelectSingleCell = useCallback((cellKey: string) => {
    const newSet = new Set<string>([cellKey]);
    setSelectedCells(newSet);
    selectedCellsRef.current = newSet;
    setLastSelectedCell(cellKey);
  }, []);

  // Close popover on outside click and scroll
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
    
    const handleScroll = () => {
      // Close popover when scrolling
      setEditInfoPopover(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scroll events
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [editInfoPopover]);

  
  const [selectedDimensionLevels, setSelectedDimensionLevels] = useState<Set<string>>(
    new Set(['account', 'category', 'product'])
  );
  const [selectedTimeGranularities, setSelectedTimeGranularities] = useState<Set<string>>(
    new Set(['month'])
  );
  
  // Show all periods toggle and date range
  const [showAllPeriods, setShowAllPeriods] = useState<boolean>(true);
  const [startPeriod, setStartPeriod] = useState<string>('');
  const [endPeriod, setEndPeriod] = useState<string>('');
  
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
              <Link 
                to="/planning-forecasting"
                className="breadcrumbs-link"
              >
                Planning & Forecasting FY26
              </Link>
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
                    Showing {parts[0]} over {secondPart[0]} across {secondPart[1]} • Last refreshed {lastRefreshed}
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
              // Capture selectedCells size from ref BEFORE any state changes or click handlers run
              // This ensures we get the value before click-outside handler potentially clears it
              const hasMultipleSelection = selectedCellsRef.current.size > 1;
              
              // Set the initial tab and open panel
              // The useEffect in CellDetailsHistoryPanel will handle updating the active tab
              setCellDetailsInitialTab(hasMultipleSelection ? 'multi' : 'single');
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
            data={filteredData} 
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
            showAllPeriods={showAllPeriods}
            startPeriod={startPeriod}
            endPeriod={endPeriod}
          />
        ) : selectedLayoutState === 'Time / Dimensions x Measures' ? (
          <TimeDimensionsGrid 
            data={filteredData} 
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
            showAllPeriods={showAllPeriods}
            startPeriod={startPeriod}
            endPeriod={endPeriod}
          />
        ) : (
          <HierarchicalGrid 
            data={filteredData} 
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
            selectedCells={selectedCells}
            onCellSelect={handleCellSelect}
            onCellChangeHandlerReady={(handler) => {
              cellChangeHandlerRef.current = handler;
            }}
            onGetCurrentCellValueReady={(handler: (rowId: string, monthKey: string) => number) => {
              getCurrentCellValueRef.current = handler;
            }}
            onEditingCellChange={(cellKey) => {
              setEditingCellKey(cellKey);
              // Clear selection when entering edit mode
              if (cellKey) {
                setSelectedCells(prev => {
                  // Remove the editing cell from selection if it's there
                  const newSelection = new Set(prev);
                  newSelection.delete(cellKey);
                  return newSelection;
                });
              }
            }}
            onSavedImpactedCellsReady={(cells) => {
              console.log('[ForecastingGrid] Received savedImpactedCells update:', Array.from(cells.keys()));
              setSavedImpactedCells(cells);
              savedImpactedCellsRef.current = cells; // Update ref immediately for synchronous access
            }}
            showAllPeriods={showAllPeriods}
            startPeriod={startPeriod}
            endPeriod={endPeriod}
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
          measures={data}
          onMeasuresReorder={handleMeasuresReorder}
          visibleMeasureIds={visibleMeasureIds}
          showAllPeriods={showAllPeriods}
          onShowAllPeriodsChange={setShowAllPeriods}
          startPeriod={startPeriod}
          onStartPeriodChange={setStartPeriod}
          endPeriod={endPeriod}
          onEndPeriodChange={setEndPeriod}
        />
        <FiltersPanel 
          isOpen={isFiltersOpen} 
          onClose={() => setIsFiltersOpen(false)}
          selectedMeasureSubgroup={selectedMeasureSubgroup}
          onMeasureSubgroupChange={setSelectedMeasureSubgroup}
          selectedDimensionLevels={selectedDimensionLevels}
          onDimensionLevelsChange={handleDimensionLevelsChange}
          data={data}
          showAllPeriods={showAllPeriods}
          onShowAllPeriodsChange={setShowAllPeriods}
          startPeriod={startPeriod}
          onStartPeriodChange={setStartPeriod}
          endPeriod={endPeriod}
          onEndPeriodChange={setEndPeriod}
        />
        <CellDetailsHistoryPanel 
          key={panelKey}
          isOpen={isCellDetailsHistoryOpen} 
          onClose={() => {
            setIsCellDetailsHistoryOpen(false);
            setCellDetailsInitialTab('single'); // Reset to single tab for next open
          }}
          focusedCell={currentFocusedCell}
          data={data}
          layout={selectedLayoutState}
          editHistory={editHistory}
          draftEditHistory={draftEditHistory}
          onAddNote={handlePanelAddNote}
          selectedCells={selectedCells}
          onClearSelection={handleClearSelection}
          onMassUpdate={handleMassUpdate}
          initialTab={cellDetailsInitialTab}
          onSetFocusedCell={setCurrentFocusedCell}
          onSingleCellUpdate={handleSingleCellUpdate}
          onToggleCellLock={handleToggleCellLock}
          isCellLocked={isCellLocked}
          getCellValue={getCellValue}
          onSelectSingleCell={handleSelectSingleCell}
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
            onMassUpdate={handleContextMassUpdate}
            isLocked={contextMenu.isLocked}
            canPaste={clipboardValue !== null}
            isEditable={contextMenu.isEditable}
            hasMultipleSelection={selectedCells.size > 1}
          />
        )}
      </div>
    </div>
  );
};

export default ForecastingGrid;


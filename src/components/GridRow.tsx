import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GridRow as GridRowType } from '../types';
import { extractSearchTerms, separateSearchTerms, matchesNumber } from '../utils/searchUtils';
import { SearchHighlight } from './SearchHighlight';
import { CellEditHistoryEntry } from '../types/editHistory';
import FillHandle from './FillHandle';
import '../styles/components/Grid.css';

interface GridRowProps {
  row: GridRowType;
  level: number;
  isExpanded: boolean;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  formatValue: (value: number, isQuantity?: boolean, measureName?: string) => string;
  onCellChange?: (rowId: string, monthKey: keyof GridRowType['values'], newValue: number, note?: string) => void;
  visibleTimeKeys?: (keyof GridRowType['values'])[];
  focusedCell?: { rowId: string; monthKey: keyof GridRowType['values'] } | null;
  onCellFocus?: (cell: { rowId: string; monthKey: keyof GridRowType['values'] } | null) => void;
  cellRefs?: React.MutableRefObject<Map<string, HTMLTableCellElement>>;
  editedCells?: Map<string, number>; // key: `${rowId}-${monthKey}`, value: originalValue
  impactedCells?: Map<string, number>; // key: `${rowId}-${monthKey}`, value: originalValue
  savedEditedCells?: Map<string, string>; // key: `${rowId}-${monthKey}`, value: icon color - cells that were edited and saved (show icon only)
  unsavedNotes?: Map<string, string>; // key: `${rowId}-${monthKey}`, value: note text - notes for dirty cells
  savedImpactedCells?: Set<string>; // Set of cellKeys that were impacted but are now saved (to prevent showing old notes/popovers)
  columnWidth?: number; // Column width in pixels for time period columns
  searchTerm?: string; // Search term for highlighting
  onCellEditStateChange?: (isEditing: boolean, rowId: string, monthKey: keyof GridRowType['values']) => void; // Callback when cell edit state changes
  editHistory?: CellEditHistoryEntry[]; // Edit history to check for notes
  onCellFocusWithHistory?: (cellKey: string, cellRect: DOMRect | null, cellValue?: number, isLocked?: boolean, isImpacted?: boolean) => void; // Callback when a cell is focused
  lockedCells?: Set<string>; // Set of locked cell keys that cannot be edited
  onCellContextMenu?: (e: React.MouseEvent, cellKey: string, cellValue: number, isLocked: boolean, isEditable: boolean) => void; // Callback for right-click context menu
  selectedCells?: Set<string>; // Set of selected cell keys
  onCellSelect?: (cellKey: string, event: React.MouseEvent) => void; // Callback when a cell is clicked for selection
  onCellMouseDown?: (cellKey: string, event: React.MouseEvent) => void; // Callback for mouse down (drag selection)
  onCellMouseMove?: (cellKey: string) => void; // Callback for mouse move (drag selection)
  lastSelectedCell?: string | null; // Last selected cell key (for drag handle indicator)
  onFillHandleDragStart?: (cellKey: string) => void; // Callback when fill handle drag starts
  onFillHandleDragMove?: (cellKey: string) => void; // Callback when fill handle is dragged
  onFillHandleDragEnd?: () => void; // Callback when fill handle drag ends
  readonlyMeasureIds?: Set<string>; // Set of measure IDs that are read-only
  isAdjustmentGroupSelected?: boolean; // Whether Adjustment Measures Group is selected
  onMeasureGroupChange?: (groups: Set<string>) => void; // Callback to change measure group selection
  measureGroupContext?: Map<string, string>; // Per-measure group context for shared measures
  onMeasureGroupContextChange?: (measureId: string, groupContext: string) => void; // Callback to change per-measure group context
  sharedMeasureIds?: string[]; // IDs of measures that exist in multiple groups
  onExpandMeasure?: (measureId: string) => void; // Callback to expand all rows within a measure
  onCollapseMeasure?: (measureId: string) => void; // Callback to collapse all rows within a measure
  readCells?: string[]; // Array of cell keys marked as read (will not show note indicators)
}

const GridRowComponent: React.FC<GridRowProps> = ({
  row,
  level,
  isExpanded,
  expandedRows,
  onToggleExpand,
  formatValue,
  onCellChange,
  visibleTimeKeys,
  focusedCell,
  onCellFocus,
  cellRefs,
  editedCells,
  impactedCells,
  savedEditedCells,
  unsavedNotes,
  savedImpactedCells = new Set<string>(),
  columnWidth = 100,
  searchTerm = '',
  onCellEditStateChange,
  editHistory = [],
  onCellFocusWithHistory,
  lockedCells = new Set<string>(),
  onCellContextMenu,
  selectedCells = new Set(),
  onCellSelect,
  onCellMouseDown,
  onCellMouseMove,
  lastSelectedCell = null,
  onFillHandleDragStart,
  onFillHandleDragMove,
  onFillHandleDragEnd,
  readonlyMeasureIds: _readonlyMeasureIds = new Set<string>(),
  isAdjustmentGroupSelected = false,
  onMeasureGroupChange,
  measureGroupContext = new Map<string, string>(),
  onMeasureGroupContextChange,
  sharedMeasureIds = [],
  onExpandMeasure,
  onCollapseMeasure,
  readCells: _readCells = [],
}) => {
  // Convert readCells array to Set for O(1) lookups
  const readCellsSet = React.useMemo(() => {
    return new Set(_readCells || []);
  }, [_readCells, JSON.stringify(_readCells), row.id]);
  
  const hasChildren = row.children && row.children.length > 0;
  const [editingCell, setEditingCell] = useState<{ monthKey: keyof GridRowType['values'] } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [adjustmentNote, setAdjustmentNote] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const adjustmentNoteInputRef = useRef<HTMLTextAreaElement>(null);
  const savedByEnterRef = useRef<boolean>(false);
  const isMovingToNoteInputRef = useRef<boolean>(false); // Track if we're intentionally moving focus to note input
  const shiftKeyPressedRef = useRef<boolean>(false); // Track if Shift key is pressed during selection
  const [hoveredCell, setHoveredCell] = useState<keyof GridRowType['values'] | null>(null);
  const [focusedCellKey, setFocusedCellKey] = useState<string | null>(null);
  const [showReadonlyWarning, setShowReadonlyWarning] = useState(false);
  const [warningPopoverPosition, setWarningPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const warningIconRef = useRef<HTMLSpanElement>(null);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [showMeasureMenu, setShowMeasureMenu] = useState(false);
  const [measureMenuPosition, setMeasureMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const measureMenuRef = useRef<HTMLButtonElement>(null);
  
  // Update popover position when showing
  useEffect(() => {
    if (showReadonlyWarning && warningIconRef.current) {
      const rect = warningIconRef.current.getBoundingClientRect();
      setWarningPopoverPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [showReadonlyWarning]);
  
  // Close popover when clicking outside
  useEffect(() => {
    if (!showReadonlyWarning) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.readonly-warning-popover') && !warningIconRef.current?.contains(target)) {
        setShowReadonlyWarning(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReadonlyWarning]);

  // Update measure menu position when showing
  useEffect(() => {
    if (showMeasureMenu && measureMenuRef.current) {
      const rect = measureMenuRef.current.getBoundingClientRect();
      setMeasureMenuPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [showMeasureMenu]);

  // Close measure menu when clicking outside
  useEffect(() => {
    if (!showMeasureMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.measure-menu-dropdown') && !measureMenuRef.current?.contains(target)) {
        setShowMeasureMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMeasureMenu]);
  
  // Convert savedImpactedCells Set to array so React can detect changes
  // Use state to force re-render when savedImpactedCells changes
  const [savedImpactedCellsArray, setSavedImpactedCellsArray] = useState<string[]>([]);
  
  // Update array whenever savedImpactedCells Set changes
  // Convert Set to string for dependency tracking - React will detect string changes
  useEffect(() => {
    if (savedImpactedCells) {
      const newArray = Array.from(savedImpactedCells);
      // Always update to ensure we have the latest values
      setSavedImpactedCellsArray(newArray);
    } else {
      setSavedImpactedCellsArray([]);
    }
    // Use Set size and a string representation to detect changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedImpactedCells ? Array.from(savedImpactedCells).sort().join('|') : '']);

  // Track Shift key state globally to prevent popover when Shift is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftKeyPressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        // Small delay to allow focus event to check the state before resetting
        setTimeout(() => {
          shiftKeyPressedRef.current = false;
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Use visibleTimeKeys if provided, otherwise show all time keys
  const timeKeys: (keyof GridRowType['values'])[] = visibleTimeKeys || [
    'year',
    'q1',
    'q2',
    'q3',
    'q4',
    'jan2026',
    'feb2026',
    'mar2026',
    'apr2026',
    'may2026',
    'jun2026',
    'jul2026',
    'aug2026',
    'sep2026',
    'oct2026',
    'nov2026',
    'dec2026',
  ];

  // State to track dropdown position
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // Use ref for onCellEditStateChange to avoid effect dependency issues
  const onCellEditStateChangeRef = useRef(onCellEditStateChange);
  useEffect(() => {
    onCellEditStateChangeRef.current = onCellEditStateChange;
  }, [onCellEditStateChange]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Calculate dropdown position immediately
      const updatePosition = () => {
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: Math.max(rect.width, 380)
          });
        }
      };
      // Update position immediately and after a short delay to ensure DOM is ready
      updatePosition();
      setTimeout(updatePosition, 0);
      setTimeout(updatePosition, 10);
      // Notify parent that editing started when input is focused
      if (onCellEditStateChangeRef.current) {
        onCellEditStateChangeRef.current(true, row.id, editingCell.monthKey);
      }
    } else {
      setDropdownPosition(null);
    }
  }, [editingCell, row.id]);

  // Update dropdown position on scroll/resize when editing
  useEffect(() => {
    if (!editingCell || !inputRef.current) return;
    
    const updatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 380)
        });
      }
    };
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [editingCell]);


  const handleCellValueClick = (monthKey: keyof GridRowType['values'], e: React.MouseEvent) => {
    // CRITICAL: If Shift/Ctrl/Cmd is pressed, don't stop propagation
    // This allows the cell's onClick handler to handle selection
    // Only stop propagation for normal clicks (which should trigger editing)
    const isModifierKey = e.shiftKey || e.ctrlKey || e.metaKey;
    if (!isModifierKey) {
      e.stopPropagation(); // Prevent cell click from firing for normal clicks
    }
    // Don't enter edit mode if Shift/Ctrl/Cmd key is pressed - let selection handle it
    if (isModifierKey) {
      return;
    }
    // Don't enter edit mode if already editing this cell
    if (editingCell?.monthKey === monthKey) {
      return;
    }
    console.log('[GridRow] Cell value clicked (entering edit mode):', { rowId: row.id, rowType: row.type, monthKey });
    if (!onCellChange) {
      console.log('[GridRow] No onCellChange handler, returning');
      return;
    }
    
    // Block editing for cells that belong to Adjustment Measures Group (read-only context)
    if (row.groupContext === 'Adjustment Measures Category') {
      return; // Not editable - belongs to read-only group context
    }
    // Close the edit info popover when entering edit mode
    if (onCellFocusWithHistory) {
      onCellFocusWithHistory('', null);
    }
    setEditingCell({ monthKey });
    setEditValue(row.values[monthKey].toString());
    // Check for unsaved note for this cell
    const cellKey = `${row.id}-${monthKey}`;
    const unsavedNote = unsavedNotes?.get(cellKey) || '';
    setAdjustmentNote(unsavedNote); // Restore unsaved note if it exists
    // Notify parent that editing started - use setTimeout to ensure state is set
    setTimeout(() => {
      if (onCellEditStateChange) {
        onCellEditStateChange(true, row.id, monthKey);
      }
    }, 0);
  };

  const handleCellEnterKey = (monthKey: keyof GridRowType['values']) => {
    console.log('[GridRow] Enter key pressed (entering edit mode):', { rowId: row.id, rowType: row.type, monthKey });
    if (!onCellChange) {
      console.log('[GridRow] No onCellChange handler, returning');
      return;
    }
    
    // Block editing for cells that belong to Adjustment Measures Group (read-only context)
    if (row.groupContext === 'Adjustment Measures Category') {
      return; // Not editable - belongs to read-only group context
    }
    // Close the edit info popover when entering edit mode
    if (onCellFocusWithHistory) {
      onCellFocusWithHistory('', null);
    }
    setEditingCell({ monthKey });
    setEditValue(row.values[monthKey].toString());
    // Check for unsaved note for this cell
    const cellKey = `${row.id}-${monthKey}`;
    const unsavedNote = unsavedNotes?.get(cellKey) || '';
    setAdjustmentNote(unsavedNote); // Restore unsaved note if it exists
    // Notify parent that editing started - use setTimeout to ensure state is set
    setTimeout(() => {
      if (onCellEditStateChange) {
        onCellEditStateChange(true, row.id, monthKey);
      }
    }, 0);
  };

  const handleCellBlur = (monthKey: keyof GridRowType['values'], inputValue: string) => {
    if (!onCellChange) return;
    
    // If we're intentionally moving focus to note input, don't process blur
    if (isMovingToNoteInputRef.current) {
      return;
    }
    
    // Use requestAnimationFrame to ensure mousedown events have processed first
    // This handles the case where user clicks on the Notes textarea
    requestAnimationFrame(() => {
      // Check flag again after event loop
      if (isMovingToNoteInputRef.current) {
        return;
      }
      processBlur(monthKey, inputValue);
    });
  };
  
  const processBlur = (monthKey: keyof GridRowType['values'], inputValue: string) => {
    if (!onCellChange) return;
    
    // If this was already saved by Enter key, skip to avoid double-saving
    if (savedByEnterRef.current) {
      savedByEnterRef.current = false;
      // Still clear editing state
      if (editingCell?.monthKey === monthKey) {
        setEditingCell(null);
        setEditValue('');
        setAdjustmentNote('');
        // Notify parent that editing ended
        if (onCellEditStateChange) {
          onCellEditStateChange(false, row.id, monthKey);
        }
      }
      // Refocus the cell after editing is complete
      setTimeout(() => {
        if (cellRefs && onCellFocus) {
          const cellKey = `${row.id}-${monthKey}`;
          const cellElement = cellRefs.current.get(cellKey);
          if (cellElement) {
            cellElement.focus();
            onCellFocus({ rowId: row.id, monthKey });
          }
        }
      }, 0);
      return;
    }
    
    // Capture row.id at blur time to avoid stale closure issues
    const currentRowId = row.id;
    
    // Read value directly from the input element, not from state (which might be stale)
    const numValue = parseFloat(inputValue.replace(/,/g, ''));
    if (!isNaN(numValue)) {
      // Round to 2 decimal places
      const roundedValue = Math.round(numValue * 100) / 100;
      console.error('[GridRow] ========================================');
      console.error('[GridRow] ✓ Calling onCellChange from blur:', { rowId: currentRowId, monthKey, value: roundedValue, editingCell: editingCell?.monthKey, hasOnCellChange: !!onCellChange });
      // Always save - don't compare with row.values[monthKey] as row prop might be stale
      // The parent component will handle deduplication if needed
      // Pass note to onCellChange so it can be saved with edit history
      const noteToSave = adjustmentNote.trim() || undefined;
      onCellChange(currentRowId, monthKey, roundedValue, noteToSave);
      
      // Clear note after saving
      if (noteToSave) {
        setAdjustmentNote('');
      }
      
      console.error('[GridRow] ✓ onCellChange called successfully from blur');
      console.error('[GridRow] ========================================');
    } else {
      console.log('[GridRow] ✗ Cannot save from blur - invalid number:', { numValue, isNaN: isNaN(numValue) });
    }
    
    // Only clear editing state if this is the currently editing cell
    if (editingCell?.monthKey === monthKey) {
      setEditingCell(null);
      setEditValue('');
      setAdjustmentNote('');
      // Notify parent that editing ended
      if (onCellEditStateChange) {
        onCellEditStateChange(false, currentRowId, monthKey);
      }
    }
    
    // Refocus the cell after editing is complete, but only if user didn't click on another cell
    setTimeout(() => {
      // Check if the active element is a different cell - if so, don't refocus
      const activeElement = document.activeElement;
      const isClickingAnotherCell = activeElement && (
        activeElement.classList.contains('grid-cell') ||
        activeElement.closest('.grid-cell')
      );
      
      if (!isClickingAnotherCell && cellRefs && onCellFocus) {
        const cellKey = `${currentRowId}-${monthKey}`;
        const cellElement = cellRefs.current.get(cellKey);
        if (cellElement && document.activeElement !== cellElement) {
          cellElement.focus();
          onCellFocus({ rowId: currentRowId, monthKey });
        }
      }
    }, 0);
  };

  // Helper function to save cell changes
  const handleSaveCell = (monthKey: keyof GridRowType['values'], inputValue?: string) => {
    const valueToSave = inputValue || editValue;
    const currentRowId = row.id;
    
    // Set flag to prevent blur handler from double-saving
    savedByEnterRef.current = true;
    
    // Save the value directly
    const numValue = parseFloat(valueToSave.replace(/,/g, ''));
    
    if (!isNaN(numValue) && onCellChange) {
      const roundedValue = Math.round(numValue * 100) / 100;
      // Pass note to onCellChange so it can be saved with edit history
      const noteToSave = adjustmentNote.trim() || undefined;
      onCellChange(currentRowId, monthKey, roundedValue, noteToSave);
      
      // Clear note after saving
      if (noteToSave) {
        setAdjustmentNote('');
      }
    }
    
    // Clear editing state
    if (editingCell?.monthKey === monthKey) {
      setEditingCell(null);
      setEditValue('');
      setAdjustmentNote('');
      // Notify parent that editing ended
      if (onCellEditStateChange) {
        onCellEditStateChange(false, currentRowId, monthKey);
      }
    }
    
    // Refocus the cell after saving
    setTimeout(() => {
      if (cellRefs && onCellFocus) {
        const cellKey = `${currentRowId}-${monthKey}`;
        const cellElement = cellRefs.current.get(cellKey);
        if (cellElement) {
          cellElement.focus();
          onCellFocus({ rowId: currentRowId, monthKey });
        }
      }
    }, 0);
  };

  // Helper function to cancel cell editing
  const handleCancelCell = (monthKey: keyof GridRowType['values']) => {
    const currentRowId = row.id;
    setEditingCell(null);
    setEditValue('');
    setAdjustmentNote('');
    // Notify parent that editing ended
    if (onCellEditStateChange) {
      onCellEditStateChange(false, currentRowId, monthKey);
    }
    // Refocus the cell after canceling edit
    setTimeout(() => {
      if (cellRefs && onCellFocus) {
        const cellKey = `${currentRowId}-${monthKey}`;
        const cellElement = cellRefs.current.get(cellKey);
        if (cellElement) {
          cellElement.focus();
          onCellFocus({ rowId: currentRowId, monthKey });
        }
      }
    }, 0);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, monthKey: keyof GridRowType['values']) => {
    // Handle ArrowDown to focus adjustment note input
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      // Mark that we're intentionally moving focus
      isMovingToNoteInputRef.current = true;
      // Use requestAnimationFrame to ensure the dropdown is rendered and ref is set
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (adjustmentNoteInputRef.current) {
            adjustmentNoteInputRef.current.focus();
            adjustmentNoteInputRef.current.select(); // Select text for better UX
            // Reset flag after focus is set
            setTimeout(() => {
              isMovingToNoteInputRef.current = false;
            }, 100);
          } else {
            // If ref is still not set, try again after a short delay
            setTimeout(() => {
              if (adjustmentNoteInputRef.current) {
                adjustmentNoteInputRef.current.focus();
                adjustmentNoteInputRef.current.select();
                setTimeout(() => {
                  isMovingToNoteInputRef.current = false;
                }, 100);
              } else {
                isMovingToNoteInputRef.current = false;
              }
            }, 100);
          }
        }, 10);
      });
      return;
    }
    
    if (e.key === 'Enter' || e.key === 'Return') {
      e.preventDefault();
      e.stopPropagation();
      const inputValue = (e.target as HTMLInputElement).value;
      handleSaveCell(monthKey, inputValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancelCell(monthKey);
    } else {
      // Stop propagation for other keys to prevent grid navigation while editing
      e.stopPropagation();
    }
  };

  // Helper function to render pencil icon for editable cells on hover/focus/selection
  const renderPencilIcon = (monthKey: keyof GridRowType['values'], isEditable: boolean) => {
    if (!isEditable || editingCell) return null;
    
    const cellKey = `${row.id}-${monthKey}`;
    const isHovered = hoveredCell === monthKey;
    const isFocused = focusedCellKey === cellKey;
    const isSelected = selectedCells.has(cellKey);
    const isMultipleSelected = selectedCells.size > 1;
    // Don't show pencil icon when multiple cells are selected
    const showPencil = (isHovered || isFocused || (isSelected && !isMultipleSelected));
    
    if (!showPencil) return null;
    
    return (
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.8,
          cursor: 'pointer',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          // Keep hover state when hovering over the icon
          if (isEditable) {
            setHoveredCell(monthKey);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditable && !editingCell && onCellChange) {
            handleCellValueClick(monthKey, e);
          }
        }}
      >
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M4.38298 15.4163L8.48876 19.5234C8.67329 19.708 8.95008 19.708 9.13461 19.5234L19.376 9.23257C19.5605 9.04798 19.5605 8.77109 19.376 8.5865L15.3163 4.52553C15.1318 4.34094 14.855 4.34094 14.6705 4.52553L4.38298 14.8164C4.19845 15.001 4.19845 15.2779 4.38298 15.4163V15.4163ZM16.6541 2.6336C16.4695 2.81819 16.4695 3.09507 16.6541 3.27966L20.7137 7.34063C20.8982 7.52522 21.175 7.52522 21.3596 7.34063L22.5129 6.18695C23.251 5.49474 23.251 4.3872 22.5129 3.64884L20.3447 1.47992C19.6065 0.741558 18.4532 0.741558 17.7151 1.47992L16.6541 2.6336V2.6336ZM0.96922 22.2463C0.876955 22.7077 1.29215 23.1231 1.75347 23.0308L6.7819 21.8309C6.96643 21.7848 7.10483 21.6925 7.19709 21.6002L7.28935 21.5079C7.38162 21.4156 7.42775 21.0926 7.24322 20.908L3.09131 16.7547C2.90678 16.5701 2.58385 16.6163 2.49159 16.7086L2.39932 16.8009C2.26093 16.9393 2.21479 17.0777 2.16866 17.2162L0.96922 22.2463V22.2463Z" 
          fill="#747474"
        />
      </svg>
    );
  };

  const renderCellValue = (monthKey: keyof GridRowType['values']) => {
    const cellKey = `${row.id}-${monthKey}`;
    
    if (editingCell?.monthKey === monthKey) {
      return (
        <>
          <input
            ref={inputRef}
            type="text"
            className="cell-input"
            data-cell-key={`${row.id}-${monthKey}`}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={(e) => handleCellBlur(monthKey, e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, monthKey)}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => {
              e.stopPropagation();
            }}
          />
          {/* Note Dropdown - appears below cell input when editing */}
          {dropdownPosition && createPortal(
            <div
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${Math.max(dropdownPosition.width, 280)}px`,
                backgroundColor: '#ffffff',
                border: '1px solid #c9c9c9',
                borderRadius: '4px',
                boxShadow: '0 7px 7px rgba(0, 0, 0, 0.07), 0 0 10px rgba(0, 0, 0, 0.05), 0 -1px 3px rgba(0, 0, 0, 0.03)',
                zIndex: 100000,
                fontFamily: 'var(--slds-g-font-family-base, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                marginTop: '4px',
                overflow: 'visible'
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur
            >
              {/* Nubbin/Arrow */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '20px',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid #c9c9c9'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '-6px',
                left: '21px',
                width: '0',
                height: '0',
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderBottom: '7px solid #ffffff'
              }}></div>
              
              {/* Popover Content */}
              <div style={{
                padding: '12px',
                paddingBottom: '8px'
              }}>
                {/* Value Change Section or Initial Message */}
                {(() => {
                  const oldValue = row.values[monthKey];
                  const parsedNewValue = editValue ? parseFloat(editValue.replace(/,/g, '')) : null;
                  const newValue = !isNaN(parsedNewValue || NaN) ? parsedNewValue! : oldValue;
                  const hasValueChanged = Math.abs(newValue - oldValue) > 0.01; // Account for floating point precision
                  const hasNotes = adjustmentNote.trim().length > 0;
                  const showButtons = hasValueChanged || hasNotes;
                  
                  if (!hasValueChanged) {
                    // Show initial instruction
                    return (
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#181818',
                        fontFamily: 'var(--slds-g-font-family-base, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: showButtons ? 'space-between' : 'flex-start',
                        gap: '8px'
                      }}>
                        <span>Edit the cell value and add any notes</span>
                        {showButtons && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            border: '1px solid #706e6b',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                          }}>
                            {/* Cancel Button (X) */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCancelCell(monthKey);
                              }}
                              style={{
                                width: '24px',
                                height: '24px',
                                minWidth: '24px',
                                minHeight: '24px',
                                border: 'none',
                                borderRadius: '0',
                                backgroundColor: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0',
                                margin: '0',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                boxSizing: 'border-box'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fef7f7';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                              }}
                              title="Cancel (Esc)"
                              type="button"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6l12 12" stroke="#0176d3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>

                            {/* Divider */}
                            <div style={{
                              width: '1px',
                              height: '18px',
                              backgroundColor: '#706e6b',
                              flexShrink: 0,
                              alignSelf: 'center'
                            }}></div>

                            {/* Save Button (Checkmark) */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const inputValue = inputRef.current?.value || editValue;
                                handleSaveCell(monthKey, inputValue);
                              }}
                              style={{
                                width: '24px',
                                height: '24px',
                                minWidth: '24px',
                                minHeight: '24px',
                                border: 'none',
                                borderRadius: '0',
                                backgroundColor: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0',
                                margin: '0',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                boxSizing: 'border-box',
                                color: '#0176d3',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                lineHeight: '1'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f0f8ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                              }}
                              title="Save (Enter)"
                              type="button"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                <path d="M20 6L9 17l-5-5" stroke="#0176d3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Show value change one-liner with buttons inline
                    const delta = newValue - oldValue;
                    const isQuantity = row.name?.toLowerCase().includes('quantity') || false;
                    const deltaFormatted = delta >= 0 ? `+${formatValue(delta, isQuantity, row.name)}` : formatValue(delta, isQuantity, row.name);
                    const deltaColor = delta >= 0 ? '#2e844a' : '#c23934';
                    
                    return (
                      <div style={{
                        fontSize: '13px',
                        color: '#181818',
                        fontFamily: 'var(--slds-g-font-family-base, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '4px',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          flex: '1',
                          minWidth: 0
                        }}>
                          <span style={{
                            textDecoration: 'line-through',
                            color: '#706e6b'
                          }}>{formatValue(oldValue, isQuantity, row.name)}</span>
                          <span style={{ color: '#706e6b' }}>→</span>
                          <span style={{
                            fontWeight: '600',
                            color: '#181818'
                          }}>{formatValue(newValue, isQuantity, row.name)}</span>
                          <span style={{
                            fontWeight: '600',
                            color: deltaColor,
                            marginLeft: '4px'
                          }}>({deltaFormatted})</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                          border: '1px solid #706e6b',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          backgroundColor: '#ffffff'
                        }}>
                          {/* Cancel Button (X) */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCancelCell(monthKey);
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              minWidth: '24px',
                              minHeight: '24px',
                              border: 'none',
                              borderRadius: '0',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0',
                              margin: '0',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              flexShrink: 0,
                              boxSizing: 'border-box'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef7f7';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                            }}
                            title="Cancel (Esc)"
                            type="button"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6l12 12" stroke="#0176d3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>

                          {/* Divider */}
                          <div style={{
                            width: '1px',
                            height: '18px',
                            backgroundColor: '#706e6b',
                            flexShrink: 0,
                            alignSelf: 'center'
                          }}></div>

                          {/* Save Button (Checkmark) */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const inputValue = inputRef.current?.value || editValue;
                              handleSaveCell(monthKey, inputValue);
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              minWidth: '24px',
                              minHeight: '24px',
                              border: 'none',
                              borderRadius: '0',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0',
                              margin: '0',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              flexShrink: 0,
                              boxSizing: 'border-box',
                              color: '#0176d3',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              lineHeight: '1'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f8ff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                            }}
                            title="Save (Enter)"
                            type="button"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                              <path d="M20 6L9 17l-5-5" stroke="#0176d3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Notes Section */}
                <textarea
                  ref={adjustmentNoteInputRef}
                  value={adjustmentNote}
                  onChange={(e) => {
                    e.stopPropagation();
                    setAdjustmentNote(e.target.value);
                  }}
                  placeholder="Enter notes (optional)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #c9c9c9',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'var(--slds-g-font-family-base, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                    color: '#181818',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxSizing: 'border-box',
                    resize: 'none',
                    lineHeight: '18px',
                    cursor: 'text',
                    marginBottom: '0'
                  }}
                  onFocus={(e) => {
                    e.stopPropagation();
                    e.target.style.borderColor = '#0176d3';
                    e.target.style.boxShadow = '0 0 0 1px #0176d3';
                    // Set flag to prevent cell blur from closing popover
                    isMovingToNoteInputRef.current = true;
                    setTimeout(() => {
                      isMovingToNoteInputRef.current = false;
                    }, 100);
                  }}
                  onBlur={(e) => {
                    e.stopPropagation();
                    e.target.style.borderColor = '#c9c9c9';
                    e.target.style.boxShadow = 'none';
                    // Don't process blur if we're saving via Enter or button
                    if (savedByEnterRef.current) {
                      return;
                    }
                    // Don't process blur if we're moving focus back to cell input
                    if (isMovingToNoteInputRef.current) {
                      return;
                    }
                  }}
                  onMouseDown={(e) => {
                    // Stop propagation so parent's preventDefault doesn't interfere
                    e.stopPropagation();
                    // Set flag to prevent cell blur handler from closing popover
                    isMovingToNoteInputRef.current = true;
                    // Allow default focus behavior by NOT calling preventDefault
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Ensure textarea is focused
                    if (adjustmentNoteInputRef.current && document.activeElement !== adjustmentNoteInputRef.current) {
                      adjustmentNoteInputRef.current.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle ArrowUp to move back to cell input
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      e.stopPropagation();
                      isMovingToNoteInputRef.current = true;
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                      setTimeout(() => {
                        isMovingToNoteInputRef.current = false;
                      }, 100);
                      return;
                    }
                    // Prevent other arrow keys from bubbling
                    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.stopPropagation();
                    }
                    // Allow Enter/Return to save
                    if ((e.key === 'Enter' || e.key === 'Return') && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      const inputValue = inputRef.current?.value || editValue;
                      handleSaveCell(monthKey, inputValue);
                    }
                    // Allow Escape to cancel
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCancelCell(monthKey);
                    }
                  }}
                />
              </div>
            </div>,
            document.body
          )}
        </>
      );
    }
    
    // Check if this cell has been directly edited or impacted
    // Note: cellKey is already declared at the top of renderCellValue
    
    // Check if cell is locked
    const isCellLocked = lockedCells.has(cellKey);
    
    const editedOriginalValue = editedCells?.get(cellKey);
    const impactedOriginalValue = impactedCells?.get(cellKey);
    const savedIconColor = savedEditedCells?.get(cellKey);
    const isSavedEdited = savedIconColor !== undefined;
    const currentValue = row.values[monthKey];
    // Check if edited (directly edited by user) - if in map, consider it edited
    const isDirectlyEdited = editedOriginalValue !== undefined;
    // Check if impacted (changed due to editing another cell) - if in map, consider it impacted
    const isImpacted = !isDirectlyEdited && impactedOriginalValue !== undefined;
    
    // IMPORTANT: If a cell is impacted, it should NOT show old edit history indicators (arrow and note triangle)
    // Even if it has edit history from editHistory prop, impacted cells take precedence
    
    // Check if this cell has a note
    // For impacted cells: only show note indicator if there's an unsaved note (new note added after impact)
    // For saved impacted cells (were impacted but now saved): don't show old notes
    // For non-impacted cells: show note indicator if there's a note in editHistory (saved notes)
    // CRITICAL: Check savedImpactedCells FIRST - if cell was impacted and saved, NEVER show note indicator
    // This handles the case where a cell had a note, then got impacted, then was saved
    // Check both cellKey formats to ensure we catch it regardless of format differences
    // IMPORTANT: savedImpactedCells is a Set<string>, check it directly and also use the memoized array
    const cellKeyAlt = `${row.id}-${monthKey}`;
    // Use savedImpactedCellsArray from useMemo (defined at component level) to ensure React detects changes
    // Check if cell is in savedImpactedCells using multiple methods to be absolutely sure
    const wasImpactedAndSaved = savedImpactedCells && (
      savedImpactedCells.has(cellKey) || 
      savedImpactedCells.has(cellKeyAlt) ||
      savedImpactedCellsArray.includes(cellKey) ||
      savedImpactedCellsArray.includes(cellKeyAlt)
    );
    
    // Calculate hasNote - explicitly exclude saved impacted cells and read cells
    // IMPORTANT: If cell is saved impacted OR marked as read, NEVER show note indicator, regardless of other conditions
    let hasNote = false;
    
    // Check if cell is marked as read - use Set for O(1) lookup
    const isCellReadInitial = readCellsSet.has(cellKey);
    
    
    // SCENARIO CHECK: If cell is saved impacted, it means it was impacted (not directly edited) and then saved
    // In this case, suppress ALL notes (even if there was a note in editHistory before it got impacted)
    if (wasImpactedAndSaved || isCellReadInitial) {
      // Cell is saved impacted or marked as read - don't show any notes (even if there's a note in editHistory)
      // This handles: cell had note -> got impacted -> saved -> triangle should NOT show
      // OR: cell had note -> marked as read -> triangle should NOT show
      hasNote = false;
    } else if (isImpacted) {
      // For currently impacted cells (not yet saved): only show note if there's an unsaved note (added after impact)
      hasNote = !!(unsavedNotes?.get(cellKey) && unsavedNotes.get(cellKey)!.trim() !== '');
    } else {
      // For non-impacted cells: check editHistory for saved notes
      // BUT: Only if cell is NOT saved impacted (double-check to be absolutely sure)
      if (!wasImpactedAndSaved && editHistory && editHistory.length > 0) {
        const matchingEntries = editHistory.filter(entry => {
          // Match by cellKey exactly
          if (entry.cellKey === cellKey) {
            return true;
          }
          // Also check if rowId and timeKey match (for compatibility)
          if (entry.rowId === row.id && entry.timeKey === monthKey) {
            return true;
          }
          return false;
        });
        
        hasNote = matchingEntries.some(entry => {
          return !!(entry.note && entry.note.trim() !== '');
        });
      }
    }
    
    // CRITICAL: Final check - if cell is saved impacted OR currently impacted, NEVER show note indicator
    // This ensures that saved impacted cells (cells that had notes but then got impacted) don't show the triangle
    // Double-check savedImpactedCells one more time to be absolutely sure
    // IMPORTANT: Re-check savedImpactedCells here to catch any updates that might have happened
    const isDefinitelySavedImpacted = savedImpactedCells && (
      savedImpactedCells.has(cellKey) || 
      savedImpactedCells.has(cellKeyAlt) ||
      savedImpactedCellsArray.includes(cellKey) ||
      savedImpactedCellsArray.includes(cellKeyAlt)
    );
    
    // Check if cell is marked as read - use Set for O(1) lookup, check both formats
    const isCellRead = isCellReadInitial || readCellsSet.has(cellKeyAlt);
    
    // CRITICAL: If cell is saved impacted or marked as read, force hasNote to false regardless of what we calculated above
    // This is the final gate to prevent showing the triangle
    // EXTRA SAFETY: Even if hasNote was set to true above, if cell is saved impacted or marked as read, suppress it
    // Note: We already checked isCellReadInitial earlier, but now we check the full isCellRead which includes cellKeyAlt
    const finalHasNoteForRender = (isDefinitelySavedImpacted || isImpacted || isCellRead) ? false : hasNote;
    
    // Check if this is a readonly measure (Last Year data)
    const isReadonlyMeasure = row.id.includes('measure-ly-order') || 
                              row.id.includes('-measure-ly-order') ||
                              row.name?.includes('Last Year');
    
    // Block editing for cells that belong to Adjustment Measures Category (read-only context)
    const isAdjustmentGroupCell = row.groupContext === 'Adjustment Measures Category';
    
    // Locked cells are not editable
    // Readonly measures (Last Year data) are not editable
    // Adjustment Measures Group cells are not editable
    const isEditable = onCellChange && !isCellLocked && !isReadonlyMeasure && !isAdjustmentGroupCell;
    
    // Calculate delta as percentage
    let deltaPercent: number | null = null;
    const originalValue = editedOriginalValue ?? impactedOriginalValue;
    if ((isDirectlyEdited || isImpacted) && originalValue !== undefined && originalValue !== 0) {
      deltaPercent = ((currentValue - originalValue) / originalValue) * 100;
    }

    // Check if cell value matches search for highlighting
    const searchTerms = searchTerm && searchTerm.trim() ? extractSearchTerms(searchTerm) : [];
    const { otherTerms } = separateSearchTerms(searchTerms);
    const valueMatchesSearch = otherTerms.length > 0 && matchesNumber(currentValue, otherTerms);
    
    
    // If cell is marked as read, render as a plain cell - no arrows, no delta badges, no note triangles
    if (isCellRead) {
      return (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <div className="cell-value-left-icon">
              {isCellLocked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <rect x="5" y="11" width="14" height="9" rx="1" fill="#6b7280"/>
                  <path d="M9 11V7c0-1.66 1.34-3 3-3s3 1.34 3 3v4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              ) : (
                <div style={{ width: '18px', height: '18px' }}></div>
              )}
            </div>
            <span 
              className="cell-value"
              style={{ cursor: isEditable ? 'pointer' : 'default' }}
            >
              {valueMatchesSearch ? (
                <SearchHighlight text={formatValue(currentValue, row.name?.toLowerCase().includes('quantity'), row.name)} searchTerms={otherTerms} />
              ) : (
                formatValue(currentValue, row.name?.toLowerCase().includes('quantity'), row.name)
              )}
            </span>
          </div>
        </>
      );
    }

    if (isDirectlyEdited) {
      const isIncrement = deltaPercent !== null && deltaPercent > 0;
      const deltaColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      
      return (
        <>
          <div className="cell-value-wrapper-edited-container">
            <div className="cell-value-left-icon">
              {isCellLocked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <rect x="5" y="11" width="14" height="9" rx="1" fill="#6b7280"/>
                  <path d="M9 11V7c0-1.66 1.34-3 3-3s3 1.34 3 3v4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              ) : (
                <div style={{ width: '18px', height: '18px' }}></div>
              )}
            </div>
            <div className="cell-value-left-section">
              {deltaPercent !== null && Math.abs(deltaPercent) > 0.001 && (
                <div className="cell-delta-badge" style={{ color: deltaColor }}>
                  {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(2)}%
                </div>
              )}
              <span 
                className="cell-value cell-value-edited"
                style={{ cursor: isEditable ? 'pointer' : 'default', color: deltaColor }}
              >
                {valueMatchesSearch ? (
                  <SearchHighlight text={formatValue(currentValue, row.name?.toLowerCase().includes('quantity'), row.name)} searchTerms={otherTerms} />
                ) : (
                  formatValue(currentValue, row.name?.toLowerCase().includes('quantity'), row.name)
                )}
              </span>
            </div>
          </div>
          {/* Dog ear triangle indicator for cells with notes */}
          {/* Show note indicator if cell has a note (from editHistory for saved notes, or unsavedNotes for unsaved notes) */}
          {finalHasNoteForRender && (
            <div className="cell-note-indicator"></div>
          )}
        </>
      );
    }
    
    // Impacted cell: show impacted state with new value and delta, no old arrow
    if (isImpacted) {
      const isIncrement = deltaPercent !== null && deltaPercent > 0;
      const deltaColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      
      return (
        <>
          <div className="cell-value-wrapper-edited-container">
            <div className="cell-value-left-icon">
              {isCellLocked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <rect x="5" y="11" width="14" height="9" rx="1" fill="#6b7280"/>
                  <path d="M9 11V7c0-1.66 1.34-3 3-3s3 1.34 3 3v4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              ) : (
                <div style={{ width: '18px', height: '18px' }}></div>
              )}
            </div>
            <div className="cell-value-left-section">
              {deltaPercent !== null && Math.abs(deltaPercent) > 0.001 && (
                <div className="cell-delta-badge" style={{ color: deltaColor }}>
                  {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(2)}%
                </div>
              )}
              <span 
                className="cell-value cell-value-edited"
                style={{ cursor: isEditable ? 'pointer' : 'default', color: deltaColor }}
              >
                {valueMatchesSearch ? (
                  <SearchHighlight text={formatValue(currentValue, row.name?.toLowerCase().includes('quantity'), row.name)} searchTerms={otherTerms} />
                ) : (
                  formatValue(currentValue, row.name?.toLowerCase().includes('quantity'), row.name)
                )}
              </span>
            </div>
          </div>
          {/* Don't show old note indicator for impacted cells */}
        </>
      );
    }
    
    // Saved edited cell: show only icon, no badge, normal value positioning
    // Only show if NOT impacted (impacted cells take precedence)
    // IMPORTANT: If a cell is impacted, it should NOT show old edit history indicators (arrow and note triangle)
    // Even if it has edit history from editHistory prop, impacted cells should not show old indicators
    // Also check if this cell was impacted and saved - if so, don't show old notes
    // CRITICAL: Check isImpacted FIRST - if impacted, never show old indicators
    if (isSavedEdited && !isImpacted && !wasImpactedAndSaved) {
      const iconColor = savedIconColor || '#2E76E1'; // Use stored color or default blue
      // Use saved icon color to determine arrow direction (orange = increase, blue = decrease)
      const isIncrease = iconColor === '#ff5d2d' || iconColor === '#FF5D2D';
      
      return (
        <>
          <div className="cell-value-wrapper-saved-container" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div className={`cell-value-left-icon ${!isCellLocked && (isIncrease ? 'cell-arrow-increase' : 'cell-arrow-decrease')}`}>
              {isCellLocked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <rect x="5" y="11" width="14" height="9" rx="1" fill="#6b7280"/>
                  <path d="M9 11V7c0-1.66 1.34-3 3-3s3 1.34 3 3v4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              ) : isIncrease ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6v10M12 6l4 4M12 6l-4 4" stroke="#ff5d2d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 18V8M12 18l4-4M12 18l-4-4" stroke="#2E76E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </div>
            <span 
              className={`cell-value cell-value-saved ${!isCellLocked && (isIncrease ? 'cell-value-increase' : 'cell-value-decrease')}`}
              style={{ cursor: isEditable ? 'pointer' : 'default' }}
            >
              {valueMatchesSearch ? (
                <SearchHighlight text={formatValue(currentValue)} searchTerms={otherTerms} />
              ) : (
                formatValue(currentValue)
              )}
            </span>
          </div>
          {/* Dog ear triangle indicator for cells with notes */}
          {/* finalHasNoteForRender already checks savedImpactedCells, so no need for redundant checks */}
          {finalHasNoteForRender && (
            <div className="cell-note-indicator"></div>
          )}
        </>
      );
    }
    
    if (isImpacted) {
      // Impacted cell: lighter yellow background, delta badge, no icon
      // Only show note indicator if there's an unsaved note (added after impact)
      const isIncrement = deltaPercent !== null && deltaPercent > 0;
      const deltaColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      
      return (
        <>
          <div className="cell-value-wrapper-impacted-container">
            <div className="cell-value-left-icon">
              {isCellLocked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <rect x="5" y="11" width="14" height="9" rx="1" fill="#6b7280"/>
                  <path d="M9 11V7c0-1.66 1.34-3 3-3s3 1.34 3 3v4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              ) : (
                <div style={{ width: '18px', height: '18px' }}></div>
              )}
            </div>
            <div className="cell-value-left-section">
              {deltaPercent !== null && Math.abs(deltaPercent) > 0.001 && (
                <div className="cell-delta-badge" style={{ color: deltaColor }}>
                  {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(2)}%
                </div>
              )}
              <span 
                className="cell-value cell-value-impacted"
                style={{ cursor: isEditable ? 'pointer' : 'default', color: deltaColor }}
              >
                {valueMatchesSearch ? (
                  <SearchHighlight text={formatValue(currentValue)} searchTerms={otherTerms} />
                ) : (
                  formatValue(currentValue)
                )}
              </span>
            </div>
          </div>
          {/* Dog ear triangle indicator for cells with notes */}
          {/* finalHasNoteForRender already checks savedImpactedCells, so no need for redundant checks */}
          {finalHasNoteForRender && (
            <div className="cell-note-indicator"></div>
          )}
        </>
      );
    }
    
    const cellValue = row.values[monthKey];
    const cellValueMatchesSearch = otherTerms.length > 0 && matchesNumber(cellValue, otherTerms);
    
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <div className="cell-value-left-icon">
            {isCellLocked ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <rect x="5" y="11" width="14" height="9" rx="1" fill="#6b7280"/>
                <path d="M9 11V7c0-1.66 1.34-3 3-3s3 1.34 3 3v4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            ) : (
              <div style={{ width: '18px', height: '18px' }}></div>
            )}
          </div>
          <span 
            className="cell-value"
            style={{ cursor: isEditable ? 'pointer' : 'default' }}
          >
            {cellValueMatchesSearch ? (
              <SearchHighlight text={formatValue(cellValue, row.name?.toLowerCase().includes('quantity'), row.name)} searchTerms={otherTerms} />
            ) : (
              formatValue(cellValue, row.name?.toLowerCase().includes('quantity'), row.name)
            )}
          </span>
        </div>
        {/* Dog ear triangle indicator for cells with saved notes (normal cells, not edited/impacted) */}
        {/* CRITICAL: Double-check savedImpactedCells here to ensure triangle doesn't show for saved impacted cells */}
        {/* Check savedImpactedCells directly at render time - convert to array fresh each time to ensure we get latest values */}
        {(() => {
          // Re-check savedImpactedCells at render time to catch any updates
          const cellKeyForCheck = `${row.id}-${monthKey}`;
          // Convert Set to array fresh each render to ensure we get the latest values
          const currentSavedImpactedArray = savedImpactedCells ? Array.from(savedImpactedCells) : [];
          // Check both Set and array to be absolutely sure
          const isInSavedImpacted = (
            (savedImpactedCells && (savedImpactedCells.has(cellKeyForCheck) || savedImpactedCells.has(cellKey))) ||
            currentSavedImpactedArray.includes(cellKeyForCheck) ||
            currentSavedImpactedArray.includes(cellKey) ||
            savedImpactedCellsArray.includes(cellKeyForCheck) ||
            savedImpactedCellsArray.includes(cellKey)
          );
          // If cell is saved impacted, NEVER show triangle, regardless of finalHasNoteForRender
          if (isInSavedImpacted) {
            return null;
          }
          return finalHasNoteForRender ? <div className="cell-note-indicator"></div> : null;
        })()}
      </>
    );
  };

  // Check if this row is a readonly measure (Last Year data) for row-level styling
  const isRowReadonlyMeasure = row.id.includes('measure-ly-order') || 
                               row.id.includes('-measure-ly-order') ||
                               row.name?.includes('Last Year');
  
  // Check if this is the actual measure row (not a child dimension row)
  const isActualMeasureRow = row.type === 'measure' && isRowReadonlyMeasure;
  // Check if this is a dimension row under a readonly measure
  const isDimensionUnderReadonlyMeasure = row.type !== 'measure' && isRowReadonlyMeasure;
  
  // Check if this is a shared measure (exists in multiple groups)
  const isSharedMeasure = row.type === 'measure' && sharedMeasureIds.includes(row.id);
  
  // Show warning icon for shared measures only when both groups are selected (has groupContext)
  // Don't show when only Adjustment Measures Group is selected
  const showGroupSwitcher = isSharedMeasure && row.groupContext !== undefined;

  return (
    <>
      <tr className={`grid-row ${row.type === 'measure' ? 'measure-row' : ''} ${isActualMeasureRow ? 'readonly-measure-row-actual' : ''} ${isDimensionUnderReadonlyMeasure ? 'readonly-dimension-row' : ''}`}>
        <td className="grid-cell">
          <div className="cell-content">
            <span className={`cell-indent level-${level}`}></span>
            {hasChildren && (
              <div
                className={`chevron-icon ${isExpanded ? 'expanded' : ''}`}
                onClick={() => onToggleExpand(row.id)}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
            {!hasChildren && <span style={{ width: '16px', display: 'inline-block' }}></span>}
            {row.type === 'account' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px', marginRight: '4px', width: '24px', height: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#5867E8"/>
                  <path d="M18.6463 12.2486C18.674 11.7779 18.314 11.6394 18.1755 11.6394H13.1909C12.7479 11.6394 12.6925 12.1102 12.6925 12.1379V17.5379H18.6463V12.2486ZM15.2125 16.1256C15.2125 16.3748 15.0186 16.5963 14.7417 16.5963H14.2709C14.0217 16.5963 13.8002 16.3748 13.8002 16.1256V15.6548C13.8002 15.4056 13.994 15.184 14.2709 15.184H14.7417C14.9909 15.184 15.2125 15.4056 15.2125 15.6548V16.1256ZM15.2125 13.7717C15.2125 14.0209 15.0186 14.2425 14.7417 14.2425H14.2709C14.0217 14.2425 13.8002 14.0209 13.8002 13.7717V13.3009C13.8002 13.0517 13.994 12.8302 14.2709 12.8302H14.7417C14.9909 12.8302 15.2125 13.0517 15.2125 13.3009V13.7717ZM17.5109 16.1256C17.5109 16.3748 17.3171 16.5963 17.0402 16.5963H16.5694C16.3202 16.5963 16.0986 16.3748 16.0986 16.1256V15.6548C16.0986 15.4056 16.2925 15.184 16.5694 15.184H17.0402C17.2894 15.184 17.5109 15.4056 17.5109 15.6548V16.1256ZM17.5109 13.7717C17.5109 14.0209 17.3171 14.2425 17.0402 14.2425H16.5694C16.3202 14.2425 16.0986 14.0209 16.0986 13.7717V13.3009C16.0986 13.0517 16.2925 12.8302 16.5694 12.8302H17.0402C17.2894 12.8302 17.5109 13.0517 17.5109 13.3009V13.7717ZM14.0494 9.75632V7.07017C14.0771 6.5994 13.7448 6.46094 13.6063 6.46094H5.85247C5.40939 6.46094 5.354 6.93171 5.354 6.9594V17.5379H11.3079V10.7809C11.3079 10.7809 11.3079 10.2271 11.8063 10.2271H13.6063C13.8832 10.2271 14.0494 9.95017 14.0494 9.75632ZM7.874 15.904C7.874 16.1532 7.68016 16.3748 7.40323 16.3748H6.96016C6.71093 16.3748 6.48939 16.1532 6.48939 15.904V15.4332C6.48939 15.184 6.68323 14.9625 6.96016 14.9625H7.43093C7.68016 14.9625 7.9017 15.184 7.9017 15.4332V15.904H7.874ZM7.874 13.5225C7.874 13.7717 7.68016 13.9932 7.40323 13.9932H6.96016C6.71093 13.9932 6.48939 13.7717 6.48939 13.5225V13.0517C6.48939 12.8025 6.68323 12.5809 6.96016 12.5809H7.43093C7.68016 12.5809 7.9017 12.8025 7.9017 13.0517V13.5225H7.874ZM7.874 11.1686C7.874 11.4179 7.68016 11.6394 7.40323 11.6394H6.96016C6.71093 11.6394 6.48939 11.4179 6.48939 11.1686V10.6979C6.48939 10.4486 6.68323 10.2271 6.96016 10.2271H7.43093C7.68016 10.2271 7.9017 10.4486 7.9017 10.6979V11.1686H7.874ZM7.874 8.81478C7.874 9.06401 7.68016 9.28555 7.40323 9.28555H6.96016C6.71093 9.28555 6.48939 9.06401 6.48939 8.81478V8.34401C6.48939 8.09478 6.68323 7.87325 6.96016 7.87325H7.43093C7.68016 7.87325 7.9017 8.09478 7.9017 8.34401V8.81478H7.874ZM10.394 15.904C10.394 16.1532 10.2002 16.3748 9.92323 16.3748H9.45247C9.20324 16.3748 8.9817 16.1532 8.9817 15.904V15.4332C8.9817 15.184 9.17554 14.9625 9.45247 14.9625H9.92323C10.1725 14.9625 10.394 15.184 10.394 15.4332V15.904ZM10.394 13.5225C10.394 13.7717 10.2002 13.9932 9.92323 13.9932H9.45247C9.20324 13.9932 8.9817 13.7717 8.9817 13.5225V13.0517C8.9817 12.8025 9.17554 12.5809 9.45247 12.5809H9.92323C10.1725 12.5809 10.394 12.8025 10.394 13.0517V13.5225ZM10.394 11.1686C10.394 11.4179 10.2002 11.6394 9.92323 11.6394H9.45247C9.20324 11.6394 8.9817 11.4179 8.9817 11.1686V10.6979C8.9817 10.4486 9.17554 10.2271 9.45247 10.2271H9.92323C10.1725 10.2271 10.394 10.4486 10.394 10.6979V11.1686ZM10.394 8.81478C10.394 9.06401 10.2002 9.28555 9.92323 9.28555H9.45247C9.20324 9.28555 8.9817 9.06401 8.9817 8.81478V8.34401C8.9817 8.09478 9.17554 7.87325 9.45247 7.87325H9.92323C10.1725 7.87325 10.394 8.09478 10.394 8.34401V8.81478ZM12.914 8.81478C12.914 9.06401 12.7202 9.28555 12.4432 9.28555H12.0002C11.7509 9.28555 11.5294 9.06401 11.5294 8.81478V8.34401C11.5294 8.09478 11.7232 7.87325 12.0002 7.87325H12.4709C12.7202 7.87325 12.9417 8.09478 12.9417 8.34401V8.81478H12.914Z" fill="white"/>
                </svg>
              </span>
            )}
            {row.type === 'product' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px', marginRight: '4px', width: '24px', height: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_2078_22246)">
                    <rect width="24" height="24" rx="4" fill="#9050E9"/>
                    <path d="M5.2798 15.8408H6.4798C6.7438 15.8408 6.9598 15.6248 6.9598 15.3608V7.92078C6.9598 7.65678 6.7438 7.44078 6.4798 7.44078H5.2798C5.0158 7.44078 4.7998 7.65678 4.7998 7.92078V15.3608C4.7998 15.6248 5.0158 15.8408 5.2798 15.8408ZM18.7198 7.44078H17.5198C17.2558 7.44078 17.0398 7.65678 17.0398 7.92078V15.3608C17.0398 15.6248 17.2558 15.8408 17.5198 15.8408H18.7198C18.9838 15.8408 19.1998 15.6248 19.1998 15.3608V7.92078C19.1998 7.65678 18.9838 7.44078 18.7198 7.44078ZM12.7198 15.8408C12.9838 15.8408 13.1998 15.6248 13.1998 15.3608V7.92078C13.1998 7.65678 12.9838 7.44078 12.7198 7.44078H11.2798C11.0158 7.44078 10.7998 7.65678 10.7998 7.92078V15.3608C10.7998 15.6248 11.0158 15.8408 11.2798 15.8408H12.7198ZM15.5998 15.8408C15.8638 15.8408 16.0798 15.6248 16.0798 15.3608V7.92078C16.0798 7.65678 15.8638 7.44078 15.5998 7.44078H15.1198C14.8558 7.44078 14.6398 7.65678 14.6398 7.92078V15.3608C14.6398 15.6248 14.8558 15.8408 15.1198 15.8408H15.5998ZM9.3598 15.8408C9.6238 15.8408 9.8398 15.6248 9.8398 15.3608V7.92078C9.8398 7.65678 9.6238 7.44078 9.3598 7.44078H8.8798C8.6158 7.44078 8.3998 7.65678 8.3998 7.92078V15.3608C8.3998 15.6248 8.6158 15.8408 8.8798 15.8408H9.3598ZM18.7198 17.2808H5.2798C5.0158 17.2808 4.7998 17.4968 4.7998 17.7608V18.2408C4.7998 18.5048 5.0158 18.7208 5.2798 18.7208H18.7198C18.9838 18.7208 19.1998 18.5048 19.1998 18.2408V17.7608C19.1998 17.4968 18.9838 17.2808 18.7198 17.2808ZM18.7198 4.80078H5.2798C5.0158 4.80078 4.7998 5.01678 4.7998 5.28078V5.76078C4.7998 6.02478 5.0158 6.24078 5.2798 6.24078H18.7198C18.9838 6.24078 19.1998 6.02478 19.1998 5.76078V5.28078C19.1998 5.01678 18.9838 4.80078 18.7198 4.80078Z" fill="white"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_2078_22246">
                      <rect width="24" height="24" rx="12" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </span>
            )}
            {row.type === 'category' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px', marginRight: '4px', width: '24px', height: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_2078_22252)">
                    <rect width="24" height="24" rx="4" fill="#396547"/>
                    <path d="M14.8318 7.05678L16.9678 9.19278C17.4478 9.64878 17.4478 10.4168 16.9678 10.8728L11.3998 16.4168V8.78478L13.1278 7.03278C13.2409 6.92186 13.3749 6.83445 13.522 6.77558C13.6691 6.7167 13.8264 6.68754 13.9848 6.68977C14.1432 6.692 14.2996 6.72558 14.445 6.78858C14.5904 6.85157 14.7218 6.94272 14.8318 7.05678ZM8.9998 4.80078H5.9998C5.68154 4.80078 5.37632 4.92721 5.15128 5.15225C4.92623 5.3773 4.7998 5.68252 4.7998 6.00078V16.5128C4.7998 16.8658 4.86933 17.2153 5.00442 17.5414C5.1395 17.8676 5.3375 18.1639 5.5871 18.4135C5.83671 18.6631 6.13303 18.8611 6.45915 18.9962C6.78527 19.1313 7.13481 19.2008 7.4878 19.2008C7.8408 19.2008 8.19033 19.1313 8.51646 18.9962C8.84258 18.8611 9.1389 18.6631 9.38851 18.4135C9.63811 18.1639 9.83611 17.8676 9.97119 17.5414C10.1063 17.2153 10.1758 16.8658 10.1758 16.5128V6.00078C10.1998 5.32878 9.6478 4.80078 8.9998 4.80078ZM7.4878 17.7128C6.8158 17.7128 6.2878 17.1848 6.2878 16.5128C6.2878 15.8408 6.8158 15.3128 7.4878 15.3128C8.1598 15.3128 8.6878 15.8408 8.6878 16.5128C8.6878 17.1848 8.1598 17.7128 7.4878 17.7128ZM17.9998 13.8008H15.8878L14.4478 15.2408H17.7598L17.7358 17.7608H11.9518L10.5118 19.2008H17.9998C18.3181 19.2008 18.6233 19.0744 18.8483 18.8493C19.0734 18.6243 19.1998 18.319 19.1998 18.0008V15.0008C19.1998 14.6825 19.0734 14.3773 18.8483 14.1523C18.6233 13.9272 18.3181 13.8008 17.9998 13.8008Z" fill="white"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_2078_22252">
                      <rect width="24" height="24" rx="12" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="cell-name">
                {searchTerm && searchTerm.trim() ? (
                  <SearchHighlight 
                    text={row.name || ''} 
                    searchTerms={extractSearchTerms(searchTerm)} 
                  />
                ) : (
                  row.name || ''
                )}
              </span>
              {/* Show measure group name for measures with groupContext */}
              {row.type === 'measure' && row.groupContext && (
                <span style={{ 
                  fontSize: '10px', 
                  color: '#374151', 
                  marginTop: '2px',
                  fontWeight: 400
                }}>
                  {row.groupContext}
                </span>
              )}
            </div>
            {/* Warning icon / Group switcher for shared measures */}
            {showGroupSwitcher && (
              <span 
                ref={warningIconRef}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  marginLeft: '8px',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReadonlyWarning(!showReadonlyWarning);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L1 21h22L12 2z" fill="#FBBF24" stroke="#CA8A04" strokeWidth="1.5"/>
                  <path d="M12 9v5" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="17" r="1" fill="#92400E"/>
                </svg>
                {/* Popover rendered via portal */}
                {showReadonlyWarning && warningPopoverPosition && createPortal(
                  <div 
                    className="readonly-warning-popover"
                    style={{
                      position: 'fixed',
                      top: warningPopoverPosition.top,
                      left: warningPopoverPosition.left,
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      zIndex: 10000,
                      width: '260px',
                      whiteSpace: 'normal'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Nubbin (triangle pointer) */}
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '16px',
                      width: '16px',
                      height: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '0',
                        width: '16px',
                        height: '16px',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        transform: 'rotate(45deg)',
                        boxShadow: '-2px -2px 4px rgba(0, 0, 0, 0.05)'
                      }} />
                    </div>
                    
                    {/* Status message - changes based on selected group */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '10px 12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '6px'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <path d="M12 2L1 21h22L12 2z" fill="#FBBF24" stroke="#CA8A04" strokeWidth="1.5"/>
                        <path d="M12 9v5" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="17" r="1" fill="#92400E"/>
                      </svg>
                      <div style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
                        This measure is common across multiple categories, select a category to change its context.
                      </div>
                    </div>
                    
                    {/* Dropdown selector */}
                    <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: 500 }}>
                      Select measure category:
                    </div>
                    
                    {/* Custom dropdown */}
                    <div style={{ position: 'relative' }}>
                      <div
                        onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                        style={{
                          padding: '8px 12px',
                          fontSize: '13px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.groupContext === 'Adjustment Measures Category' ? 'Adjustment Mea...' : 'Revenue & Quantity Category'}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, transform: isGroupDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <path stroke="#6b7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4"/>
                        </svg>
                      </div>
                      
                      {/* Dropdown options */}
                      {isGroupDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          zIndex: 10001,
                          overflow: 'hidden'
                        }}>
                          {/* Revenue & Quantity Category option */}
                          <div
                            onClick={() => {
                              if (onMeasureGroupContextChange) {
                                onMeasureGroupContextChange(row.id, 'Revenue & Quantity Category');
                              }
                              setIsGroupDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              fontSize: '13px',
                              cursor: 'pointer',
                              backgroundColor: row.groupContext !== 'Adjustment Measures Category' ? '#f3f4f6' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = row.groupContext !== 'Adjustment Measures Category' ? '#f3f4f6' : 'white'}
                          >
                            <span>Revenue & Quantity Category</span>
                            {row.groupContext !== 'Adjustment Measures Category' && (
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                <path stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l3 3 7-7"/>
                              </svg>
                            )}
                          </div>
                          
                          {/* Adjustment Measures Category option */}
                          <div
                            onClick={() => {
                              if (onMeasureGroupContextChange) {
                                onMeasureGroupContextChange(row.id, 'Adjustment Measures Category');
                              }
                              setIsGroupDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              fontSize: '13px',
                              cursor: 'pointer',
                              backgroundColor: row.groupContext === 'Adjustment Measures Category' ? '#f3f4f6' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = row.groupContext === 'Adjustment Measures Category' ? '#f3f4f6' : 'white'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Adjustment Mea...</span>
                              <span style={{
                                fontSize: '10px',
                                color: '#4b5563',
                                backgroundColor: '#d1d5db',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                flexShrink: 0
                              }}>
                                READ ONLY
                              </span>
                            </div>
                            {row.groupContext === 'Adjustment Measures Category' && (
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                                <path stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l3 3 7-7"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </span>
            )}
            {/* 3-dot menu button for measure rows */}
            {row.type === 'measure' && (
              <button
                ref={measureMenuRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMeasureMenu(!showMeasureMenu);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  marginRight: '8px',
                  padding: '4px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="3" r="1.5" fill="#6b7280"/>
                  <circle cx="8" cy="8" r="1.5" fill="#6b7280"/>
                  <circle cx="8" cy="13" r="1.5" fill="#6b7280"/>
                </svg>
                {/* Dropdown menu rendered via portal */}
                {showMeasureMenu && measureMenuPosition && createPortal(
                  <div
                    className="measure-menu-dropdown"
                    style={{
                      position: 'fixed',
                      top: measureMenuPosition.top,
                      left: measureMenuPosition.left,
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      zIndex: 10000,
                      minWidth: '160px',
                      overflow: 'hidden'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      onClick={() => {
                        if (onExpandMeasure) {
                          onExpandMeasure(row.id);
                        }
                        setShowMeasureMenu(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <span>Expand All</span>
                    </div>
                    <div
                      onClick={() => {
                        if (onCollapseMeasure) {
                          onCollapseMeasure(row.id);
                        }
                        setShowMeasureMenu(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderTop: '1px solid #e5e7eb',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <span>Collapse All</span>
                    </div>
                  </div>,
                  document.body
                )}
              </button>
            )}
          </div>
        </td>
        {timeKeys.map((key) => {
          const cellKey = `${row.id}-${key}`;
          const isFocused = focusedCell?.rowId === row.id && focusedCell?.monthKey === key;
          const isCellLocked = lockedCells.has(cellKey);
          // Check if this is a readonly measure (Last Year data)
          const isReadonlyMeasureCell = row.id.includes('measure-ly-order') || 
                                        row.id.includes('-measure-ly-order') ||
                                        row.name?.includes('Last Year');
          
          // Block editing for cells that belong to Adjustment Measures Category (read-only context)
          const isAdjustmentGroupCell = row.type !== 'measure' && row.groupContext === 'Adjustment Measures Category';
          
          // Apply striped texture to dimension cells under readonly measures or adjustment group
          const shouldShowTexture = isDimensionUnderReadonlyMeasure || isAdjustmentGroupCell;
          const isEditable = onCellChange && !isCellLocked && !isReadonlyMeasureCell && !isAdjustmentGroupCell;
          
          // Check if this cell has a note
          // For impacted cells: only show note indicator if there's an unsaved note (new note added after impact)
          // For saved impacted cells (were impacted but now saved): don't show old notes
          // For non-impacted cells: show note indicator if there's a note in editHistory (saved notes)
          const cellKeyForNoteCheck = `${row.id}-${key}`;
          const editedOriginalValueForNote = editedCells?.get(cellKeyForNoteCheck);
          const impactedOriginalValueForNote = impactedCells?.get(cellKeyForNoteCheck);
          const isImpactedForNote = !editedOriginalValueForNote && impactedOriginalValueForNote !== undefined;
          // Check if cell is saved impacted - check both cell key formats to be absolutely sure
          const isSavedImpacted = savedImpactedCells.has(cellKeyForNoteCheck) || savedImpactedCells.has(`${row.id}-${key}`);
          
          // Calculate hasNote - explicitly exclude saved impacted cells and read cells
          // IMPORTANT: If cell is saved impacted OR marked as read, NEVER show note indicator, regardless of other conditions
          let hasNote = false;
          
          // Check if cell is marked as read - use Set for O(1) lookup
          const isCellRead = readCellsSet.has(cellKeyForNoteCheck);
          
          
          if (isSavedImpacted || isCellRead) {
            // Cell is saved impacted or marked as read - don't show any notes, period
            // This handles: cell had note -> got impacted -> saved -> triangle should NOT show
            // OR: cell had note -> marked as read -> triangle should NOT show
            hasNote = false;
          } else if (isImpactedForNote) {
            // For impacted cells: only show note if there's an unsaved note (added after impact)
            hasNote = !!(unsavedNotes?.get(cellKeyForNoteCheck) && unsavedNotes.get(cellKeyForNoteCheck)!.trim() !== '');
          } else {
            // For non-impacted cells: only show note if there's a note in editHistory
            if (editHistory && editHistory.length > 0) {
              hasNote = editHistory.some(entry => {
                // Match by cellKeyForNoteCheck exactly (not cellKey which might be from outer scope)
                if (entry.cellKey === cellKeyForNoteCheck) {
                  return !!(entry.note && entry.note.trim() !== '');
                }
                // Also check if rowId and timeKey match (for compatibility)
                if (entry.rowId === row.id && entry.timeKey === key) {
                  return !!(entry.note && entry.note.trim() !== '');
                }
                return false;
              });
            }
          }
          
          // Force hasNote to false if cell is saved impacted or marked as read (safety check)
          // Triple-check savedImpactedCells directly to be absolutely sure
          const finalHasNote = (isSavedImpacted || isCellRead) ? false : hasNote;
          
          
          return (
            <td
              key={cellKey}
              data-cell-key={cellKey}
              data-cell-read={isCellRead ? 'true' : 'false'}
              style={{ minWidth: `${columnWidth}px`, width: `${columnWidth}px`, position: 'relative' }}
              ref={(el) => {
                if (el && cellRefs) {
                  cellRefs.current.set(cellKey, el);
                }
              }}
              className={`grid-cell cell-value-cell ${isFocused ? 'cell-focused' : ''} ${!isCellRead && shouldShowTexture ? 'cell-readonly-texture' : ''} ${!isCellRead && finalHasNote && !isSavedImpacted ? 'cell-has-note' : ''} ${isCellRead ? 'cell-marked-read' : ''} ${selectedCells.has(cellKey) ? 'cell-selected' : ''} ${(() => {
                // If cell is marked as read, suppress ALL indicator classes (no colored backgrounds)
                if (isCellRead) return '';
                const cellKeyForCheck = `${row.id}-${key}`;
                const editedOriginalValue = editedCells?.get(cellKeyForCheck);
                const impactedOriginalValue = impactedCells?.get(cellKeyForCheck);
                const savedIconColorCheck = savedEditedCells?.get(cellKeyForCheck);
                const isSavedEditedCheck = savedIconColorCheck !== undefined;
                
                // Priority order: edited > impacted > saved edited
                // Check if edited (directly edited by user) - highest priority
                if (editedOriginalValue !== undefined) {
                  // Always show as edited if it's in the editedCells map, even if value matches (to handle rounding)
                  return 'edited-cell';
                }
                // Check if impacted (changed due to editing another cell) - second priority
                if (impactedOriginalValue !== undefined) {
                  // Always show as impacted if it's in the impactedCells map, even if value matches (to handle rounding)
                  return 'impacted-cell';
                }
                // Check if saved edited (show icon only, no special styling) - lowest priority
                // Only apply this if cell is NOT currently edited or impacted
                if (isSavedEditedCheck) {
                  return ''; // No special class for saved edited cells
                }
                return '';
              })()}`}
              tabIndex={isEditable ? 0 : -1}
              onMouseMove={(_e) => {
                // Handle drag selection mouse move
                if (onCellMouseMove) {
                  onCellMouseMove(cellKey);
                }
              }}
              onMouseEnter={(e) => {
                // Set hover state for pencil icon - always set if editable, regardless of other conditions
                if (isEditable) {
                  setHoveredCell(key);
                }
                // Show popover on hover for cells with indicators (but NOT for read cells)
                if (onCellFocusWithHistory && (isEditable || isCellLocked) && !editingCell && !isCellRead) {
                  const focusCellKey = `${row.id}-${key}`;
                  const isDirty = editedCells?.has(focusCellKey) && !savedEditedCells?.has(focusCellKey);
                  const isImpactedCell = impactedCells?.has(focusCellKey);
                  const wasImpactedAndSaved = savedImpactedCells.has(focusCellKey);
                  
                  // Check if cell has edit history before showing popover
                  const hasEditHistory = editHistory && editHistory.some(entry => 
                    entry.cellKey === focusCellKey || (entry.rowId === row.id && entry.timeKey === key)
                  );
                  
                  // Only show popover if cell has edit history AND is not impacted/saved impacted
                  if (hasEditHistory && (!isDirty || isCellLocked) && !isImpactedCell && !wasImpactedAndSaved) {
                    const cellElement = e.currentTarget;
                    const cellRect = cellElement.getBoundingClientRect();
                    const cellValue = row.values[key];
                    onCellFocusWithHistory(focusCellKey, cellRect, cellValue, isCellLocked, isImpactedCell || wasImpactedAndSaved);
                  }
                }
              }}
              onMouseLeave={(e) => {
                // Clear hover state for pencil icon - but only if not moving to the pencil icon itself
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || !relatedTarget.closest('svg')) {
                  setHoveredCell(null);
                }
                // Close popover when mouse leaves (unless moving to popover itself)
                if (onCellFocusWithHistory) {
                  // Don't close if moving to popover
                  if (!relatedTarget || !relatedTarget.closest('.cell-edit-info-popover')) {
                    onCellFocusWithHistory('', null);
                  }
                }
              }}
              onMouseDown={(e) => {
                // Handle drag selection (only store the starting cell, don't interfere with clicks)
                // Only call if no modifier keys (let onClick handle those)
                if (onCellMouseDown && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.button === 0) {
                  onCellMouseDown(cellKey, e);
                }
                
                // Track Shift key state for this selection
                shiftKeyPressedRef.current = e.shiftKey;
                
                // CRITICAL: Never handle Shift/Ctrl/Cmd in mousedown - always let onClick handle them
                // This ensures modifier keys are reliably detected
                // Return immediately if any modifier key is pressed
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                  return; // Let onClick handle modifier key clicks - don't do anything here
                }
                
                // Use mousedown to catch selection earlier, before blur refocus happens
                // Only handle if this is a left click
                if (e.button !== 0) {
                  return;
                }
                
                // If this cell is currently being edited, don't trigger selection
                if (editingCell?.monthKey === key) {
                  return;
                }
                // If another cell in this row is being edited, clear selection first
                // Only handle normal clicks here when another cell is editing
                // Allow selection for locked cells (they can't be edited but can be selected for viewing history, etc.)
                const canSelect = isEditable || isCellLocked;
                if (editingCell && editingCell.monthKey !== key && onCellSelect && canSelect) {
                  // Clear any existing selection by selecting only this cell
                  // Only do this if no modifier keys are pressed (already checked above)
                  const syntheticEvent = { ...e, ctrlKey: false, metaKey: false, shiftKey: false, detail: 1 } as React.MouseEvent;
                  onCellSelect(cellKey, syntheticEvent);
                  return;
                }
                // Handle normal clicks (no modifier keys) when no cell is editing
                // Allow selection for locked cells
                if (onCellSelect && canSelect && !editingCell) {
                  onCellSelect(cellKey, e);
                }
              }}
              onClick={(e) => {
                // Track Shift key state for this selection
                shiftKeyPressedRef.current = e.shiftKey;
                
                // CRITICAL: For modifier keys (Shift/Ctrl/Cmd), ALWAYS allow selection
                // even if clicking on the cell value area - selection takes precedence over editing
                const isModifierKey = e.shiftKey || e.ctrlKey || e.metaKey;
                
                // Allow all clicks to proceed for selection
                // Editing is now done by clicking the pencil icon, not the cell value
                
                // Prevent selection on double-click
                if (e.detail === 2) {
                  return;
                }
                // If this cell is currently being edited, don't trigger selection
                if (editingCell?.monthKey === key) {
                  return;
                }
                // Handle selection on click - especially for Shift/Ctrl/Cmd keys
                // This ensures modifier keys are properly detected
                // Allow selection for locked cells (they can't be edited but can be selected for viewing history, etc.)
                const canSelect = isEditable || isCellLocked;
                if (onCellSelect && canSelect) {
                  // CRITICAL: Always handle Shift/Ctrl/Cmd clicks here - these MUST be handled in onClick
                  // Check event.shiftKey directly to ensure we catch it
                  if (isModifierKey) {
                    // Always call onCellSelect for modifier keys - don't check if already selected
                    e.stopPropagation(); // Prevent any other handlers from interfering
                    onCellSelect(cellKey, e);
                    return;
                  }
                  // For normal clicks, only handle if mousedown didn't already handle it
                  // (mousedown handles normal clicks when another cell is editing)
                  // Prevent double-selection: only call if mousedown didn't already handle it
                  if (!editingCell && !selectedCells.has(cellKey)) {
                    onCellSelect(cellKey, e);
                  }
                }
              }}
              onDoubleClick={(e) => {
                // Enter edit mode on double-click
                if (isEditable && !editingCell) {
                  e.stopPropagation();
                  handleCellValueClick(key, e);
                }
              }}
              onFocus={(e) => {
                e.stopPropagation();
                // Set focused cell key for pencil icon visibility
                if (isEditable) {
                  setFocusedCellKey(cellKey);
                }
                // Call parent onCellFocus handler
                if (onCellFocus && isEditable) {
                  onCellFocus({ rowId: row.id, monthKey: key });
                }
                // Show popover on focus for cells with indicators (but NOT for read cells)
                if (onCellFocusWithHistory && (isEditable || isCellLocked) && !editingCell && !shiftKeyPressedRef.current && !isCellRead) {
                  const focusCellKey = `${row.id}-${key}`;
                  const isDirty = editedCells?.has(focusCellKey) && !savedEditedCells?.has(focusCellKey);
                  // Check if this cell is impacted
                  const isImpactedCell = impactedCells?.has(focusCellKey);
                  // Check if this cell was impacted but is now saved (don't show popover)
                  const wasImpactedAndSaved = savedImpactedCells.has(focusCellKey);
                  // Don't show popover for dirty/unsaved cells (unless locked)
                  // Also don't show popover for impacted cells (they show their own state)
                  // Also don't show popover for saved impacted cells (they were impacted but are now saved)
                  if ((!isDirty || isCellLocked) && !isImpactedCell && !wasImpactedAndSaved) {
                    const cellElement = e.currentTarget;
                    const cellRect = cellElement.getBoundingClientRect();
                    const cellValue = row.values[key];
                    onCellFocusWithHistory(focusCellKey, cellRect, cellValue, isCellLocked, isImpactedCell || wasImpactedAndSaved);
                  }
                }
                // Reset shift key tracking after focus
                shiftKeyPressedRef.current = false;
              }}
              onBlur={(e) => {
                e.stopPropagation();
                // Clear focused cell key for pencil icon visibility
                setFocusedCellKey(null);
                // Close popover when cell loses focus (unless moving to popover)
                if (onCellFocusWithHistory) {
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  // Don't close if moving to popover
                  if (!relatedTarget || !relatedTarget.closest('.cell-edit-info-popover')) {
                    onCellFocusWithHistory('', null);
                  }
                }
              }}
              onKeyDown={(e) => {
                // Don't enter edit mode if Shift key is pressed - just select the cell
                if (e.key === 'Enter' && isEditable && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCellEnterKey(key);
                }
              }}
              onContextMenu={(e) => {
                if (onCellContextMenu) {
                  const cellValue = row.values[key];
                  onCellContextMenu(e, cellKey, cellValue, isCellLocked, isEditable || false);
                }
              }}
            >
              {(() => {
                // ROOT CAUSE FIX: renderCellValue already handles note indicators internally
                // It checks savedImpactedCells and impactedCells correctly
                // We should NOT add note indicators here - let renderCellValue handle everything
                return renderCellValue(key);
              })()}
              {renderPencilIcon(key, !!isEditable)}
              {/* Fill handle - show on last selected cell */}
              {lastSelectedCell === cellKey && selectedCells.has(cellKey) && (
                <FillHandle
                  cellKey={cellKey}
                  cellElement={cellRefs?.current?.get(cellKey) || null}
                  onDragStart={onFillHandleDragStart}
                  onDragMove={onFillHandleDragMove}
                  onDragEnd={onFillHandleDragEnd}
                />
              )}
            </td>
          );
        })}
      </tr>
      {hasChildren && isExpanded && row.children && (
        <>
          {row.children.map((child) => {
            // Inherit groupContext from parent measure
            const childWithContext = row.groupContext ? { ...child, groupContext: row.groupContext } : child;
            return (
              <GridRowComponent
                key={child.id}
                row={childWithContext}
                level={level + 1}
                isExpanded={expandedRows.has(child.id)}
                expandedRows={expandedRows}
                onToggleExpand={onToggleExpand}
                formatValue={formatValue}
                onCellChange={onCellChange}
                visibleTimeKeys={visibleTimeKeys}
                focusedCell={focusedCell}
                onCellFocus={onCellFocus}
                cellRefs={cellRefs}
                editedCells={editedCells}
                impactedCells={impactedCells}
                savedEditedCells={savedEditedCells}
                unsavedNotes={unsavedNotes}
                savedImpactedCells={savedImpactedCells}
                columnWidth={columnWidth}
                searchTerm={searchTerm}
                editHistory={editHistory}
                onCellFocusWithHistory={onCellFocusWithHistory}
                lockedCells={lockedCells}
                onCellContextMenu={onCellContextMenu}
                selectedCells={selectedCells}
                onCellSelect={onCellSelect}
                lastSelectedCell={lastSelectedCell}
                onFillHandleDragStart={onFillHandleDragStart}
                onFillHandleDragMove={onFillHandleDragMove}
                onFillHandleDragEnd={onFillHandleDragEnd}
                isAdjustmentGroupSelected={isAdjustmentGroupSelected}
                onMeasureGroupChange={onMeasureGroupChange}
                measureGroupContext={measureGroupContext}
                onMeasureGroupContextChange={onMeasureGroupContextChange}
                sharedMeasureIds={sharedMeasureIds}
                readCells={_readCells}
              />
            );
          })}
        </>
      )}
    </>
  );
};

export default GridRowComponent;


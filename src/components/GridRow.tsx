import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GridRow as GridRowType } from '../types';
import { extractSearchTerms, separateSearchTerms, matchesNumber } from '../utils/searchUtils';
import { SearchHighlight } from './SearchHighlight';
import { CellEditHistoryEntry } from '../types/editHistory';
import '../styles/components/Grid.css';

interface GridRowProps {
  row: GridRowType;
  level: number;
  isExpanded: boolean;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  formatValue: (value: number, isQuantity?: boolean) => string;
  onCellChange?: (rowId: string, monthKey: keyof GridRowType['values'], newValue: number, note?: string) => void;
  visibleTimeKeys?: (keyof GridRowType['values'])[];
  focusedCell?: { rowId: string; monthKey: keyof GridRowType['values'] } | null;
  onCellFocus?: (cell: { rowId: string; monthKey: keyof GridRowType['values'] } | null) => void;
  cellRefs?: React.MutableRefObject<Map<string, HTMLTableCellElement>>;
  editedCells?: Map<string, number>; // key: `${rowId}-${monthKey}`, value: originalValue
  impactedCells?: Map<string, number>; // key: `${rowId}-${monthKey}`, value: originalValue
  savedEditedCells?: Map<string, string>; // key: `${rowId}-${monthKey}`, value: icon color - cells that were edited and saved (show icon only)
  unsavedNotes?: Map<string, string>; // key: `${rowId}-${monthKey}`, value: note text - notes for dirty cells
  columnWidth?: number; // Column width in pixels for time period columns
  searchTerm?: string; // Search term for highlighting
  onCellEditStateChange?: (isEditing: boolean, rowId: string, monthKey: keyof GridRowType['values']) => void; // Callback when cell edit state changes
  editHistory?: CellEditHistoryEntry[]; // Edit history to check for notes
  onCellFocusWithHistory?: (cellKey: string, cellRect: DOMRect | null, cellValue?: number, isLocked?: boolean) => void; // Callback when a cell is focused
  lockedCells?: Set<string>; // Set of locked cell keys that cannot be edited
  onCellContextMenu?: (e: React.MouseEvent, cellKey: string, cellValue: number, isLocked: boolean, isEditable: boolean) => void; // Callback for right-click context menu
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
  columnWidth = 100,
  searchTerm = '',
  onCellEditStateChange,
  editHistory = [],
  onCellFocusWithHistory,
  lockedCells = new Set<string>(),
  onCellContextMenu,
}) => {
  const hasChildren = row.children && row.children.length > 0;
  const [editingCell, setEditingCell] = useState<{ monthKey: keyof GridRowType['values'] } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [adjustmentNote, setAdjustmentNote] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const adjustmentNoteInputRef = useRef<HTMLTextAreaElement>(null);
  const savedByEnterRef = useRef<boolean>(false);
  const isMovingToNoteInputRef = useRef<boolean>(false); // Track if we're intentionally moving focus to note input

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
    e.stopPropagation(); // Prevent cell click from firing
    console.log('[GridRow] Cell value clicked (entering edit mode):', { rowId: row.id, rowType: row.type, monthKey });
    // Measure rows are calculated values and should not be editable
    if (row.type === 'measure') {
      console.log('[GridRow] Measure row is not editable, returning');
      return;
    }
    if (!onCellChange) {
      console.log('[GridRow] No onCellChange handler, returning');
      return;
    }
    setEditingCell({ monthKey });
    setEditValue(row.values[monthKey].toString());
    // Check for unsaved note for this cell
    const cellKey = `${row.id}-${monthKey}`;
    const unsavedNote = unsavedNotes?.get(cellKey) || '';
    setAdjustmentNote(unsavedNote); // Restore unsaved note if it exists
  };

  const handleCellEnterKey = (monthKey: keyof GridRowType['values']) => {
    console.log('[GridRow] Enter key pressed (entering edit mode):', { rowId: row.id, rowType: row.type, monthKey });
    // Measure rows are calculated values and should not be editable
    if (row.type === 'measure') {
      console.log('[GridRow] Measure row is not editable, returning');
      return;
    }
    if (!onCellChange) {
      console.log('[GridRow] No onCellChange handler, returning');
      return;
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
    
    // Refocus the cell after editing is complete
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
    
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // Read value directly from the input element
      const inputValue = (e.target as HTMLInputElement).value;
      const currentRowId = row.id;
      
      // Store on window immediately to track Enter key press
      if (typeof window !== 'undefined') {
        (window as any).gridRowEnterKeyPressed = { rowId: currentRowId, monthKey, inputValue, timestamp: Date.now() };
        (window as any).gridRowEnterKeyPressCount = ((window as any).gridRowEnterKeyPressCount || 0) + 1;
      }
      
      console.log('[GridRow] Enter pressed - Saving:', { rowId: currentRowId, monthKey, value: inputValue, editingCell: editingCell?.monthKey });
      
      // Set flag to prevent blur handler from double-saving
      savedByEnterRef.current = true;
      
      // Save the value directly
      const numValue = parseFloat(inputValue.replace(/,/g, ''));
      
      // Store debug info
      if (typeof window !== 'undefined') {
        (window as any).gridRowBeforeOnCellChange = { 
          numValue, 
          isNaN: isNaN(numValue), 
          hasOnCellChange: !!onCellChange,
          onCellChangeType: typeof onCellChange,
          rowId: currentRowId,
          monthKey
        };
      }
      
      if (!isNaN(numValue) && onCellChange) {
        const roundedValue = Math.round(numValue * 100) / 100;
        // Store on window for debugging
        if (typeof window !== 'undefined') {
          (window as any).gridRowOnCellChangeCall = { rowId: currentRowId, monthKey, newValue: roundedValue, timestamp: Date.now() };
          (window as any).gridRowOnCellChangeCallCount = ((window as any).gridRowOnCellChangeCallCount || 0) + 1;
        }
        // Use multiple logging methods to ensure visibility
        console.error('========================================');
        console.error('[GridRow] ✓ Calling onCellChange from Enter key');
        console.error('rowId:', currentRowId);
        console.error('monthKey:', monthKey);
        console.error('newValue:', roundedValue);
        console.error('hasOnCellChange:', !!onCellChange);
        console.error('onCellChange type:', typeof onCellChange);
        console.error('========================================');
        // Also log to console.log and console.warn
        console.log('[GridRow] ✓ Calling onCellChange from Enter key:', { rowId: currentRowId, monthKey, newValue: roundedValue });
        console.warn('[GridRow] ✓ Calling onCellChange from Enter key:', { rowId: currentRowId, monthKey, newValue: roundedValue });
        // Pass note to onCellChange so it can be saved with edit history
        // Read note from state - it should be current since we're in the blur handler
        const noteToSave = adjustmentNote.trim() || undefined;
        onCellChange(currentRowId, monthKey, roundedValue, noteToSave);
        
        // Clear note after saving
        if (noteToSave) {
          setAdjustmentNote('');
        }
        
        console.error('[GridRow] ✓ onCellChange called successfully');
      } else {
        if (typeof window !== 'undefined') {
          (window as any).gridRowOnCellChangeFailed = { numValue, isNaN: isNaN(numValue), hasOnCellChange: !!onCellChange };
        }
        console.error('[GridRow] ✗ Cannot save - invalid number or no onCellChange:', { numValue, isNaN: isNaN(numValue), hasOnCellChange: !!onCellChange });
      }
      
      // Clear editing state
      if (editingCell?.monthKey === monthKey) {
        setEditingCell(null);
        setEditValue('');
        setAdjustmentNote('');
      }
      
      // Refocus the cell after saving (don't blur, just refocus the td element)
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
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      const monthKey = editingCell?.monthKey;
      setEditingCell(null);
      setEditValue('');
      setAdjustmentNote('');
      // Refocus the cell after canceling edit
      setTimeout(() => {
        if (cellRefs && onCellFocus && monthKey) {
          const cellKey = `${row.id}-${monthKey}`;
          const cellElement = cellRefs.current.get(cellKey);
          if (cellElement) {
            cellElement.focus();
            onCellFocus({ rowId: row.id, monthKey });
          }
        }
      }, 0);
    } else {
      // Stop propagation for other keys to prevent grid navigation while editing
      e.stopPropagation();
    }
  };

  const renderCellValue = (monthKey: keyof GridRowType['values']) => {
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
                marginTop: '4px'
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
              
              {/* Note Input */}
              <div style={{
                padding: '12px'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '590',
                  color: '#181818',
                  marginBottom: '8px',
                  lineHeight: '18px'
                }}>
                  Notes
                </label>
                <textarea
                  ref={adjustmentNoteInputRef}
                  value={adjustmentNote}
                  onChange={(e) => {
                    e.stopPropagation();
                    setAdjustmentNote(e.target.value);
                  }}
                  placeholder="Enter notes"
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
                    cursor: 'text'
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
                    // Don't process blur if we're saving via Enter
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
                    // Allow Enter to save
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Read note directly from textarea element to ensure we have the latest value
                      const noteText = (e.target as HTMLTextAreaElement).value.trim();
                      
                      // Always call onCellChange if we have a note, even if value hasn't changed
                      if (noteText && onCellChange) {
                        // Get current cell value (use editValue if set, otherwise use row value)
                        const currentCellValue = editValue || formatValue(row.values[monthKey]);
                        const numValue = parseFloat(currentCellValue.replace(/,/g, ''));
                        const roundedValue = !isNaN(numValue) ? Math.round(numValue * 100) / 100 : row.values[monthKey];
                        
                        // Set flag BEFORE calling onCellChange to prevent blur handler interference
                        savedByEnterRef.current = true;
                        isMovingToNoteInputRef.current = false;
                        
                        // Update state first to ensure note is captured
                        setAdjustmentNote(noteText);
                        
                        // Save the note - pass it explicitly as a string (not undefined)
                        onCellChange(row.id, monthKey, roundedValue, noteText);
                        
                        // Clear state after a short delay to ensure save completes
                        setTimeout(() => {
                          setAdjustmentNote('');
                          setEditingCell(null);
                          setEditValue('');
                          
                          // Notify parent that editing ended
                          if (onCellEditStateChange) {
                            onCellEditStateChange(false, row.id, monthKey);
                          }
                          
                          // Refocus the cell
                          if (cellRefs && onCellFocus) {
                            const cellKey = `${row.id}-${monthKey}`;
                            const cellElement = cellRefs.current.get(cellKey);
                            if (cellElement) {
                              cellElement.focus();
                              onCellFocus({ rowId: row.id, monthKey });
                            }
                          }
                        }, 10);
                      }
                    }
                    // Allow Escape to cancel
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      setAdjustmentNote('');
                      setEditingCell(null);
                      setEditValue('');
                      if (onCellEditStateChange) {
                        onCellEditStateChange(false, row.id, monthKey);
                      }
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
    const cellKey = `${row.id}-${monthKey}`;
    
    // Check if cell is locked
    const isCellLocked = lockedCells.has(cellKey);
    
    // Check if this cell has a note - check editHistory for any entry with a note for this cell
    const hasNote = editHistory && editHistory.length > 0 && editHistory.some(entry => {
      // Match by cellKey exactly
      if (entry.cellKey === cellKey) {
        return !!(entry.note && entry.note.trim() !== '');
      }
      // Also check if rowId and timeKey match (for compatibility)
      if (entry.rowId === row.id && entry.timeKey === monthKey) {
        return !!(entry.note && entry.note.trim() !== '');
      }
      return false;
    });
    
    // Check if this is a readonly measure (Last Year data)
    const isReadonlyMeasure = row.id.includes('measure-ly-order') || 
                              row.id.includes('-measure-ly-order') ||
                              row.name?.includes('Last Year');
    
    // Measure rows are not editable - they are calculated values
    // Locked cells are also not editable
    // Readonly measures (Last Year data) are not editable
    const isEditable = row.type !== 'measure' && onCellChange && !isCellLocked && !isReadonlyMeasure;
    const editedOriginalValue = editedCells?.get(cellKey);
    const impactedOriginalValue = impactedCells?.get(cellKey);
    const savedIconColor = savedEditedCells?.get(cellKey);
    const isSavedEdited = savedIconColor !== undefined;
    const currentValue = row.values[monthKey];
    // Check if edited (directly edited by user) - if in map, consider it edited
    const isDirectlyEdited = editedOriginalValue !== undefined;
    // Check if impacted (changed due to editing another cell) - if in map, consider it impacted
    const isImpacted = !isDirectlyEdited && impactedOriginalValue !== undefined;
    
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
    
    // Debug logging to track value rendering
    if (isDirectlyEdited) {
      console.log('[GridRow] Rendering directly edited cell:', { rowId: row.id, monthKey, cellKey, originalValue, currentValue, deltaPercent });
    } else if (isImpacted) {
      console.log('[GridRow] Rendering impacted cell:', { rowId: row.id, monthKey, cellKey, originalValue, currentValue, deltaPercent });
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
                className={`cell-value cell-value-edited ${row.type === 'measure' ? 'cell-value-readonly' : ''}`}
                style={{ cursor: isEditable ? 'pointer' : 'default', color: deltaColor }}
                onClick={isEditable ? (e) => handleCellValueClick(monthKey, e) : undefined}
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
          {hasNote && (
            <div className="cell-note-indicator"></div>
          )}
        </>
      );
    }
    
    // Saved edited cell: show only icon, no badge, normal value positioning
    if (isSavedEdited) {
      const iconColor = savedIconColor || '#2E76E1'; // Use stored color or default blue
      // Use saved icon color to determine arrow direction (orange = increase, blue = decrease)
      const isIncrease = iconColor === '#ff5d2d' || iconColor === '#FF5D2D';
      
      return (
        <>
          <div className="cell-value-wrapper-saved-container">
            <div className="cell-value-left-icon">
              {isCellLocked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <rect x="5" y="11" width="14" height="9" rx="1" fill="#6b7280"/>
                  <path d="M9 11V7c0-1.66 1.34-3 3-3s3 1.34 3 3v4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              ) : isIncrease ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6v10M12 6l4 4M12 6l-4 4" stroke="#ff5d2d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 18V8M12 18l4-4M12 18l-4-4" stroke="#2E76E1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </div>
            <span 
              className={`cell-value cell-value-saved ${!isCellLocked && (isIncrease ? 'cell-value-increase' : 'cell-value-decrease')} ${row.type === 'measure' ? 'cell-value-readonly' : ''}`}
              style={{ cursor: isEditable ? 'pointer' : 'default' }}
              onClick={isEditable ? (e) => handleCellValueClick(monthKey, e) : undefined}
            >
              {valueMatchesSearch ? (
                <SearchHighlight text={formatValue(currentValue)} searchTerms={otherTerms} />
              ) : (
                formatValue(currentValue)
              )}
            </span>
          </div>
          {/* Dog ear triangle indicator for cells with notes */}
          {hasNote && (
            <div className="cell-note-indicator"></div>
          )}
        </>
      );
    }
    
    if (isImpacted) {
      // Impacted cell: lighter yellow background, delta badge, no icon
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
                className={`cell-value cell-value-impacted ${row.type === 'measure' ? 'cell-value-readonly' : ''}`}
                style={{ cursor: isEditable ? 'pointer' : 'default', color: deltaColor }}
                onClick={isEditable ? (e) => handleCellValueClick(monthKey, e) : undefined}
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
          {hasNote && (
            <div className="cell-note-indicator"></div>
          )}
        </>
      );
    }
    
    const cellValue = row.values[monthKey];
    const cellValueMatchesSearch = otherTerms.length > 0 && matchesNumber(cellValue, otherTerms);
    
    return (
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
          className={`cell-value ${row.type === 'measure' ? 'cell-value-readonly' : ''}`}
          style={{ cursor: isEditable ? 'pointer' : 'default' }}
          onClick={isEditable ? (e) => handleCellValueClick(monthKey, e) : undefined}
        >
          {cellValueMatchesSearch ? (
            <SearchHighlight text={formatValue(cellValue, row.name?.toLowerCase().includes('quantity'))} searchTerms={otherTerms} />
          ) : (
            formatValue(cellValue)
          )}
        </span>
      </div>
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
          // Only apply texture to dimension cells under readonly measures, not the measure row itself
          const shouldShowTexture = isDimensionUnderReadonlyMeasure;
          const isEditable = row.type !== 'measure' && onCellChange && !isCellLocked && !isReadonlyMeasureCell;
          
          // Check if this cell has a note - check editHistory for any entry with a note for this cell
          const hasNote = editHistory && editHistory.length > 0 && editHistory.some(entry => {
            // Match by cellKey exactly
            if (entry.cellKey === cellKey) {
              return !!(entry.note && entry.note.trim() !== '');
            }
            // Also check if rowId and timeKey match (for compatibility)
            if (entry.rowId === row.id && entry.timeKey === key) {
              return !!(entry.note && entry.note.trim() !== '');
            }
            return false;
          });
          
          return (
            <td
              key={cellKey}
              style={{ minWidth: `${columnWidth}px`, width: `${columnWidth}px`, position: 'relative' }}
              ref={(el) => {
                if (el && cellRefs) {
                  cellRefs.current.set(cellKey, el);
                }
              }}
              className={`grid-cell cell-value-cell ${isFocused ? 'cell-focused' : ''} ${shouldShowTexture ? 'cell-readonly-texture' : ''} ${hasNote ? 'cell-has-note' : ''} ${(() => {
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
              onFocus={(e) => {
                if (onCellFocus && isEditable) {
                  onCellFocus({ rowId: row.id, monthKey: key });
                }
                // Call onCellFocusWithHistory for any editable cell OR locked cell
                // But NOT if we're currently editing (adjustment note dropdown is shown)
                // And NOT if cell is in dirty state (edited but not saved)
                if (onCellFocusWithHistory && (isEditable || isCellLocked) && !editingCell) {
                  const focusCellKey = `${row.id}-${key}`;
                  const isDirty = editedCells?.has(focusCellKey) && !savedEditedCells?.has(focusCellKey);
                  // Don't show popover for dirty/unsaved cells (unless locked)
                  if (!isDirty || isCellLocked) {
                    const cellElement = e.currentTarget;
                    const cellRect = cellElement.getBoundingClientRect();
                    const cellValue = row.values[key];
                    onCellFocusWithHistory(focusCellKey, cellRect, cellValue, isCellLocked);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isEditable) {
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
              {renderCellValue(key)}
              {/* Dog ear triangle indicator for cells with notes */}
              {hasNote && (
                <div className="cell-note-indicator"></div>
              )}
            </td>
          );
        })}
      </tr>
      {hasChildren && isExpanded && row.children && (
        <>
          {row.children.map((child) => (
            <GridRowComponent
              key={child.id}
              row={child}
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
              columnWidth={columnWidth}
              searchTerm={searchTerm}
              editHistory={editHistory}
              onCellFocusWithHistory={onCellFocusWithHistory}
              lockedCells={lockedCells}
              onCellContextMenu={onCellContextMenu}
            />
          ))}
        </>
      )}
    </>
  );
};

export default GridRowComponent;


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
  formatValue: (value: number) => string;
  onCellChange?: (rowId: string, monthKey: keyof GridRowType['values'], newValue: number, note?: string) => void;
  visibleTimeKeys?: (keyof GridRowType['values'])[];
  focusedCell?: { rowId: string; monthKey: keyof GridRowType['values'] } | null;
  onCellFocus?: (cell: { rowId: string; monthKey: keyof GridRowType['values'] } | null) => void;
  cellRefs?: React.MutableRefObject<Map<string, HTMLTableCellElement>>;
  editedCells?: Map<string, number>; // key: `${rowId}-${monthKey}`, value: originalValue
  impactedCells?: Map<string, number>; // key: `${rowId}-${monthKey}`, value: originalValue
  savedEditedCells?: Map<string, string>; // key: `${rowId}-${monthKey}`, value: icon color - cells that were edited and saved (show icon only)
  columnWidth?: number; // Column width in pixels for time period columns
  searchTerm?: string; // Search term for highlighting
  onCellEditStateChange?: (isEditing: boolean, rowId: string, monthKey: keyof GridRowType['values']) => void; // Callback when cell edit state changes
  editHistory?: CellEditHistoryEntry[]; // Edit history to check for notes
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
  columnWidth = 100,
  searchTerm = '',
  onCellEditStateChange,
  editHistory = [],
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
    setAdjustmentNote(''); // Clear note when starting new edit
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
    setEditingCell({ monthKey });
    setEditValue(row.values[monthKey].toString());
    setAdjustmentNote(''); // Clear note when starting new edit
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
    
    // Measure rows are not editable - they are calculated values
    const isEditable = row.type !== 'measure' && onCellChange;
    
    // Check if this cell has been directly edited or impacted
    const cellKey = `${row.id}-${monthKey}`;
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
      const iconColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      const deltaColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      
      return (
        <div className="cell-value-wrapper-edited-container">
          <div className="cell-value-left-section">
            {deltaPercent !== null && (
              <div className="cell-delta-badge" style={{ color: deltaColor }}>
                {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(0)}%
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
          <div className="cell-edit-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill={iconColor}/>
              {/* User head - connected directly to body */}
              <circle cx="12" cy="9.5" r="3.2" fill="white"/>
              {/* User body/shoulders - wider and better proportioned, connected to head */}
              <path d="M4.5 18.5C4.5 15.2 7.7 12.5 12 12.5C16.3 12.5 19.5 15.2 19.5 18.5V20H4.5V18.5Z" fill="white"/>
            </svg>
          </div>
        </div>
      );
    }
    
    // Saved edited cell: show only icon, no badge, normal value positioning
    if (isSavedEdited) {
      const iconColor = savedIconColor || '#2E76E1'; // Use stored color or default blue
      
      return (
        <div className="cell-value-wrapper-saved-container">
          <span 
            className={`cell-value ${row.type === 'measure' ? 'cell-value-readonly' : ''}`}
            style={{ cursor: isEditable ? 'pointer' : 'default' }}
            onClick={isEditable ? (e) => handleCellValueClick(monthKey, e) : undefined}
          >
            {valueMatchesSearch ? (
              <SearchHighlight text={formatValue(currentValue)} searchTerms={otherTerms} />
            ) : (
              formatValue(currentValue)
            )}
          </span>
          <div className="cell-edit-icon cell-edit-icon-saved">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill={iconColor}/>
              {/* User head */}
              <circle cx="12" cy="9.5" r="3.2" fill="white"/>
              {/* User body/shoulders */}
              <path d="M4.5 18.5C4.5 15.2 7.7 12.5 12 12.5C16.3 12.5 19.5 15.2 19.5 18.5V20H4.5V18.5Z" fill="white"/>
            </svg>
          </div>
        </div>
      );
    }
    
    if (isImpacted) {
      // Impacted cell: lighter yellow background, delta badge, no icon
      const isIncrement = deltaPercent !== null && deltaPercent > 0;
      const deltaColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      
      return (
        <div className="cell-value-wrapper-impacted-container">
          <div className="cell-value-left-section">
            {deltaPercent !== null && (
              <div className="cell-delta-badge" style={{ color: deltaColor }}>
                {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(0)}%
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
      );
    }
    
    const cellValue = row.values[monthKey];
    const cellValueMatchesSearch = otherTerms.length > 0 && matchesNumber(cellValue, otherTerms);
    
    return (
      <span 
        className={`cell-value ${row.type === 'measure' ? 'cell-value-readonly' : ''}`}
        style={{ cursor: isEditable ? 'pointer' : 'default' }}
        onClick={isEditable ? (e) => handleCellValueClick(monthKey, e) : undefined}
      >
        {cellValueMatchesSearch ? (
          <SearchHighlight text={formatValue(cellValue)} searchTerms={otherTerms} />
        ) : (
          formatValue(cellValue)
        )}
      </span>
    );
  };

  return (
    <>
      <tr className={`grid-row ${row.type === 'measure' ? 'measure-row' : ''}`}>
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
          const isEditable = row.type !== 'measure' && onCellChange;
          
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
              className={`grid-cell cell-value-cell ${isFocused ? 'cell-focused' : ''} ${(() => {
                const cellKeyForCheck = `${row.id}-${key}`;
                const editedOriginalValue = editedCells?.get(cellKeyForCheck);
                const impactedOriginalValue = impactedCells?.get(cellKeyForCheck);
                const savedIconColorCheck = savedEditedCells?.get(cellKeyForCheck);
                const isSavedEditedCheck = savedIconColorCheck !== undefined;
                // Check if saved edited (show icon only, no special styling)
                if (isSavedEditedCheck) {
                  return ''; // No special class for saved edited cells
                }
                // Check if edited (directly edited by user)
                if (editedOriginalValue !== undefined) {
                  // Always show as edited if it's in the editedCells map, even if value matches (to handle rounding)
                  return 'edited-cell';
                }
                // Check if impacted (changed due to editing another cell)
                if (impactedOriginalValue !== undefined) {
                  // Always show as impacted if it's in the impactedCells map, even if value matches (to handle rounding)
                  return 'impacted-cell';
                }
                return '';
              })()}`}
              tabIndex={isEditable ? 0 : -1}
              onFocus={() => {
                if (onCellFocus && isEditable) {
                  onCellFocus({ rowId: row.id, monthKey: key });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isEditable) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCellEnterKey(key);
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
              columnWidth={columnWidth}
              searchTerm={searchTerm}
              editHistory={editHistory}
            />
          ))}
        </>
      )}
    </>
  );
};

export default GridRowComponent;


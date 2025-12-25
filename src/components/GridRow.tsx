import React, { useState, useRef, useEffect } from 'react';
import { GridRow as GridRowType } from '../types';
import '../styles/components/Grid.css';

interface GridRowProps {
  row: GridRowType;
  level: number;
  isExpanded: boolean;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  formatValue: (value: number) => string;
  onCellChange?: (rowId: string, monthKey: keyof GridRowType['values'], newValue: number) => void;
  visibleTimeKeys?: (keyof GridRowType['values'])[];
  focusedCell?: { rowId: string; monthKey: keyof GridRowType['values'] } | null;
  onCellFocus?: (cell: { rowId: string; monthKey: keyof GridRowType['values'] } | null) => void;
  cellRefs?: React.MutableRefObject<Map<string, HTMLTableCellElement>>;
  editedCells?: Map<string, number>; // key: `${rowId}-${monthKey}`, value: originalValue
  impactedCells?: Map<string, number>; // key: `${rowId}-${monthKey}`, value: originalValue
  savedEditedCells?: Map<string, string>; // key: `${rowId}-${monthKey}`, value: icon color - cells that were edited and saved (show icon only)
  columnWidth?: number; // Column width in pixels for time period columns
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
}) => {
  const hasChildren = row.children && row.children.length > 0;
  const [editingCell, setEditingCell] = useState<{ monthKey: keyof GridRowType['values'] } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const savedByEnterRef = useRef<boolean>(false);

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

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (monthKey: keyof GridRowType['values']) => {
    console.log('[GridRow] Cell clicked:', { rowId: row.id, rowType: row.type, monthKey, hasOnCellChange: !!onCellChange });
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
  };

  const handleCellBlur = (monthKey: keyof GridRowType['values'], inputValue: string) => {
    if (!onCellChange) return;
    
    // If this was already saved by Enter key, skip to avoid double-saving
    if (savedByEnterRef.current) {
      savedByEnterRef.current = false;
      // Still clear editing state
      if (editingCell?.monthKey === monthKey) {
        setEditingCell(null);
        setEditValue('');
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
      console.log('[GridRow] handleCellBlur - Saving:', { rowId: currentRowId, monthKey, value: roundedValue, editingCell: editingCell?.monthKey });
      // Always save - don't compare with row.values[monthKey] as row prop might be stale
      // The parent component will handle deduplication if needed
      onCellChange(currentRowId, monthKey, roundedValue);
    }
    
    // Only clear editing state if this is the currently editing cell
    if (editingCell?.monthKey === monthKey) {
      setEditingCell(null);
      setEditValue('');
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
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // Read value directly from the input element
      const inputValue = (e.target as HTMLInputElement).value;
      const currentRowId = row.id;
      console.log('[GridRow] Enter pressed - Saving:', { rowId: currentRowId, monthKey, value: inputValue, editingCell: editingCell?.monthKey });
      
      // Set flag to prevent blur handler from double-saving
      savedByEnterRef.current = true;
      
      // Save the value directly
      const numValue = parseFloat(inputValue.replace(/,/g, ''));
      if (!isNaN(numValue) && onCellChange) {
        const roundedValue = Math.round(numValue * 100) / 100;
        onCellChange(currentRowId, monthKey, roundedValue);
      }
      
      // Clear editing state
      if (editingCell?.monthKey === monthKey) {
        setEditingCell(null);
        setEditValue('');
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
        <input
          ref={inputRef}
          type="text"
          className="cell-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={(e) => handleCellBlur(monthKey, e.target.value)}
          onKeyDown={(e) => handleCellKeyDown(e, monthKey)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
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
            >
              {formatValue(currentValue)}
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
          >
            {formatValue(currentValue)}
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
            >
              {formatValue(currentValue)}
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <span 
        className={`cell-value ${row.type === 'measure' ? 'cell-value-readonly' : ''}`}
        style={{ cursor: isEditable ? 'pointer' : 'default' }}
      >
        {formatValue(row.values[monthKey])}
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
            <span className="cell-name">{row.name}</span>
          </div>
        </td>
        {timeKeys.map((key) => {
          const cellKey = `${row.id}-${key}`;
          const isFocused = focusedCell?.rowId === row.id && focusedCell?.monthKey === key;
          const isEditable = row.type !== 'measure' && onCellChange;
          
          return (
            <td
              key={cellKey}
              style={{ minWidth: `${columnWidth}px`, width: `${columnWidth}px` }}
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
              onClick={() => {
                if (isEditable && onCellFocus) {
                  onCellFocus({ rowId: row.id, monthKey: key });
                }
                handleCellClick(key);
              }}
            >
              {renderCellValue(key)}
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
            />
          ))}
        </>
      )}
    </>
  );
};

export default GridRowComponent;


import React, { useState, useRef, useEffect } from 'react';
import { TransformedRow } from '../utils/layoutTransform';
import '../styles/components/Grid.css';

interface TimeDimensionsRowProps {
  row: TransformedRow;
  level: number;
  isExpanded: boolean;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  formatValue: (value: number) => string;
  measures: Array<{ id: string; name: string }>;
  onCellChange?: (timeKey: string, dimensionId: string, measureId: string, newValue: number) => void;
  focusedCell?: { rowId: string; measureId: string } | null;
  onCellFocus?: (cell: { rowId: string; measureId: string } | null) => void;
  cellRefs?: React.MutableRefObject<Map<string, HTMLTableCellElement>>;
  editedCells?: Map<string, number>;
  impactedCells?: Map<string, number>;
  savedEditedCells?: Map<string, string>;
  columnWidth?: number;
}

const TimeDimensionsRowComponent: React.FC<TimeDimensionsRowProps> = ({
  row,
  level,
  isExpanded,
  expandedRows,
  onToggleExpand,
  formatValue,
  measures,
  onCellChange,
  focusedCell,
  onCellFocus,
  cellRefs,
  editedCells,
  impactedCells,
  savedEditedCells,
  columnWidth = 100,
}) => {
  const hasChildren = row.children && row.children.length > 0;
  const [editingCell, setEditingCell] = useState<{ measureId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const savedByEnterRef = useRef<boolean>(false);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellValueClick = (measureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Only dimension rows (account, category, product) are editable, not time rows
    if (row.type === 'account' || row.type === 'category' || row.type === 'product') {
      if (!onCellChange) {
        console.log('[TimeDimensionsRow] No onCellChange handler');
        return;
      }
      const currentValue = row.measureValues.get(measureId) || 0;
      console.log('[TimeDimensionsRow] Cell clicked, entering edit mode:', { rowId: row.id, measureId, currentValue });
      setEditingCell({ measureId });
      setEditValue(currentValue.toString());
    }
  };

  const handleCellEnterKey = (measureId: string) => {
    // Only dimension rows are editable
    if (row.type !== 'account' && row.type !== 'category' && row.type !== 'product') {
      return;
    }
    if (!onCellChange) {
      console.log('[TimeDimensionsRow] No onCellChange handler');
      return;
    }
    const currentValue = row.measureValues.get(measureId) || 0;
    console.log('[TimeDimensionsRow] Enter key pressed, entering edit mode:', { rowId: row.id, measureId, currentValue });
    setEditingCell({ measureId });
    setEditValue(currentValue.toString());
  };

  const handleCellBlur = (measureId: string, inputValue: string) => {
    // If this was already saved by Enter key, skip to avoid double-saving
    if (savedByEnterRef.current) {
      savedByEnterRef.current = false;
      setEditingCell(null);
      setEditValue('');
      return;
    }

    if (!onCellChange) {
      setEditingCell(null);
      setEditValue('');
      return;
    }

    // Read value from inputRef to ensure we get the current value, fallback to parameter
    const actualInputValue = inputRef.current?.value || inputValue;
    console.log('[TimeDimensionsRow] Blur event, inputValue:', actualInputValue, 'editValue state:', editValue);
    const numValue = parseFloat(actualInputValue.replace(/,/g, ''));
    if (!isNaN(numValue)) {
      const roundedValue = Math.round(numValue * 100) / 100;
      console.log('[TimeDimensionsRow] Calling onCellChange from blur with:', { timeKey: row.timeKey, dimensionId: row.id, measureId, newValue: roundedValue });
      const timeKey = row.timeKey || 'year';
      // Extract original dimension ID from row.id (format: dimension-{originalId}-{timeKey})
      const dimensionId = row.id.replace(/^dimension-/, '').replace(/-\w+$/, '');
      onCellChange(timeKey, dimensionId, measureId, roundedValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, measureId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // Read value from inputRef to ensure we get the current value
      const inputValue = inputRef.current?.value || (e.target as HTMLInputElement).value;
      console.log('[TimeDimensionsRow] Enter pressed, inputValue:', inputValue, 'editValue state:', editValue);
      const numValue = parseFloat(inputValue.replace(/,/g, ''));
      if (!isNaN(numValue) && onCellChange) {
        const roundedValue = Math.round(numValue * 100) / 100;
        console.log('[TimeDimensionsRow] Calling onCellChange with:', { timeKey: row.timeKey, dimensionId: row.id, measureId, newValue: roundedValue });
        savedByEnterRef.current = true;
        const timeKey = row.timeKey || 'year';
        // Extract original dimension ID from row.id
        const dimensionId = row.id.replace(/^dimension-/, '').replace(/-\w+$/, '');
        onCellChange(timeKey, dimensionId, measureId, roundedValue);
      } else {
        console.log('[TimeDimensionsRow] Invalid number or no onCellChange:', { numValue, isNaN: isNaN(numValue), hasOnCellChange: !!onCellChange });
      }
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setEditingCell(null);
      setEditValue('');
    }
  };

  const renderCellValue = (measureId: string) => {
    if (editingCell?.measureId === measureId) {
      return (
        <input
          ref={inputRef}
          type="text"
          className="cell-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={(e) => {
            // Read value from the input element directly
            const value = inputRef.current?.value || e.target.value;
            handleCellBlur(measureId, value);
          }}
          onKeyDown={(e) => handleCellKeyDown(e, measureId)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => {
            e.stopPropagation();
          }}
        />
      );
    }

    const cellKey = `${row.id}-${measureId}`;
    const editedOriginalValue = editedCells?.get(cellKey);
    const impactedOriginalValue = impactedCells?.get(cellKey);
    const savedIconColor = savedEditedCells?.get(cellKey);
    const isSavedEdited = savedIconColor !== undefined;
    const currentValue = row.measureValues.get(measureId) || 0;
    const isDirectlyEdited = editedOriginalValue !== undefined;
    const isImpacted = !isDirectlyEdited && impactedOriginalValue !== undefined;

    // Calculate delta as percentage
    let deltaPercent: number | null = null;
    const originalValue = editedOriginalValue ?? impactedOriginalValue;
    if ((isDirectlyEdited || isImpacted) && originalValue !== undefined && originalValue !== 0) {
      deltaPercent = ((currentValue - originalValue) / originalValue) * 100;
    }

    const isEditable = (row.type === 'account' || row.type === 'category' || row.type === 'product');

    if (isDirectlyEdited) {
      const isIncrement = deltaPercent !== null && deltaPercent > 0;
      const iconColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      const deltaColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      
      return (
        <div 
          className="cell-value-wrapper-edited-container"
          onClick={isEditable ? (e) => handleCellValueClick(measureId, e) : undefined}
          style={{ cursor: isEditable ? 'pointer' : 'default' }}
        >
          <div className="cell-value-left-section">
            {deltaPercent !== null && (
              <div className="cell-delta-badge" style={{ color: deltaColor }}>
                {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(0)}%
              </div>
            )}
            <span 
              className={`cell-value cell-value-edited ${!isEditable ? 'cell-value-readonly' : ''}`}
              style={{ color: deltaColor }}
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
        <div 
          className="cell-value-wrapper-saved-container"
          onClick={isEditable ? (e) => handleCellValueClick(measureId, e) : undefined}
          style={{ cursor: isEditable ? 'pointer' : 'default' }}
        >
          <span 
            className={`cell-value ${!isEditable ? 'cell-value-readonly' : ''}`}
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
        <div 
          className="cell-value-wrapper-impacted-container"
          onClick={isEditable ? (e) => handleCellValueClick(measureId, e) : undefined}
          style={{ cursor: isEditable ? 'pointer' : 'default' }}
        >
          <div className="cell-value-left-section">
            {deltaPercent !== null && (
              <div className="cell-delta-badge" style={{ color: deltaColor }}>
                {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(0)}%
              </div>
            )}
            <span 
              className={`cell-value cell-value-impacted ${!isEditable ? 'cell-value-readonly' : ''}`}
              style={{ color: deltaColor }}
            >
              {formatValue(currentValue)}
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <span 
        className={`cell-value ${!isEditable ? 'cell-value-readonly' : ''}`}
        style={{ cursor: isEditable ? 'pointer' : 'default' }}
        onClick={isEditable ? (e) => handleCellValueClick(measureId, e) : undefined}
      >
        {formatValue(currentValue)}
      </span>
    );
  };

  const rowClassName = `grid-row ${row.type === 'year' || row.type === 'quarter' || row.type === 'month' ? `time-row ${row.type}` : 'dimension-row'}`;

  return (
    <>
      <tr className={rowClassName}>
        <td className="grid-cell" style={{ width: '300px', minWidth: '300px' }}>
          <div className="cell-content">
            <span className={`cell-indent level-${row.level}`}></span>
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
        {measures.map((measure) => {
          const cellKey = `${row.id}-${measure.id}`;
          const isFocused = focusedCell?.rowId === row.id && focusedCell?.measureId === measure.id;
          const isEditable = row.type === 'account' || row.type === 'category' || row.type === 'product';
          
          // Check if this cell is edited or impacted
          const editedOriginalValue = editedCells?.get(cellKey);
          const impactedOriginalValue = impactedCells?.get(cellKey);
          const savedIconColorCheck = savedEditedCells?.get(cellKey);
          const isSavedEdited = savedIconColorCheck !== undefined;
          const isDirectlyEdited = editedOriginalValue !== undefined;
          const isImpacted = !isDirectlyEdited && impactedOriginalValue !== undefined;
          
          // Determine cell class
          let cellClassName = 'grid-cell cell-value-cell';
          if (isFocused) {
            cellClassName += ' cell-focused';
          }
          if (isSavedEdited) {
            // No special class for saved edited cells
          } else if (isDirectlyEdited) {
            cellClassName += ' edited-cell';
          } else if (isImpacted) {
            cellClassName += ' impacted-cell';
          }

          return (
            <td
              key={cellKey}
              style={{ minWidth: `${columnWidth}px`, width: `${columnWidth}px` }}
              ref={(el) => {
                if (el && cellRefs) {
                  cellRefs.current.set(cellKey, el);
                }
              }}
              className={cellClassName}
              onClick={(e) => {
                // If clicking directly on the td (not on the inner span), trigger edit mode
                if (isEditable && e.target === e.currentTarget) {
                  handleCellEnterKey(measure.id);
                }
              }}
              onFocus={() => {
                if (onCellFocus && isEditable) {
                  onCellFocus({ rowId: row.id, measureId: measure.id });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isEditable) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCellEnterKey(measure.id);
                }
              }}
            >
              {renderCellValue(measure.id)}
            </td>
          );
        })}
      </tr>
      {hasChildren && isExpanded && row.children && (
        <>
          {row.children.map((child) => (
            <TimeDimensionsRowComponent
              key={child.id}
              row={child}
              level={level + 1}
              isExpanded={expandedRows.has(child.id)}
              expandedRows={expandedRows}
              onToggleExpand={onToggleExpand}
              formatValue={formatValue}
              measures={measures}
              onCellChange={onCellChange}
              focusedCell={focusedCell}
              onCellFocus={onCellFocus}
              cellRefs={cellRefs}
              editedCells={editedCells}
              impactedCells={impactedCells}
              savedEditedCells={savedEditedCells}
              columnWidth={columnWidth}
            />
          ))}
        </>
      )}
    </>
  );
};

export default TimeDimensionsRowComponent;


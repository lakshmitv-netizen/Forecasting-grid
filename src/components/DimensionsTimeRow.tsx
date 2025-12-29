import React, { useState, useRef, useEffect } from 'react';
import { TransformedRow } from '../utils/layoutTransform';
import { extractSearchTerms, separateSearchTerms, matchesNumber, matchesTimePeriod } from '../utils/searchUtils';
import { SearchHighlight } from './SearchHighlight';
import '../styles/components/Grid.css';

interface DimensionsTimeRowProps {
  row: TransformedRow;
  level: number;
  isExpanded: boolean;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  formatValue: (value: number, isQuantity?: boolean) => string;
  measures: Array<{ id: string; name: string }>;
  onCellChange?: (dimensionId: string, timeKey: string | null, measureId: string, newValue: number) => void;
  focusedCell?: { rowId: string; measureId: string } | null;
  onCellFocus?: (cell: { rowId: string; measureId: string } | null) => void;
  cellRefs?: React.MutableRefObject<Map<string, HTMLTableCellElement>>;
  editedCells?: Map<string, number>;
  impactedCells?: Map<string, number>;
  savedEditedCells?: Map<string, string>;
  columnWidth?: number;
  searchTerm?: string;
}

const DimensionsTimeRowComponent: React.FC<DimensionsTimeRowProps> = ({
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
  searchTerm = '',
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
    // Only time rows (year, quarter, month) are editable
    if (row.type === 'year' || row.type === 'quarter' || row.type === 'month') {
      if (!onCellChange) {
        console.log('[DimensionsTimeRow] No onCellChange handler');
        return;
      }
      const currentValue = row.measureValues.get(measureId) || 0;
      console.log('[DimensionsTimeRow] Cell clicked, entering edit mode:', { rowId: row.id, measureId, currentValue });
      setEditingCell({ measureId });
      setEditValue(currentValue.toString());
    }
  };

  const handleCellEnterKey = (measureId: string) => {
    // Only time rows (year, quarter, month) are editable
    if (row.type !== 'year' && row.type !== 'quarter' && row.type !== 'month') {
      return;
    }
    if (!onCellChange) {
      console.log('[DimensionsTimeRow] No onCellChange handler');
      return;
    }
    const currentValue = row.measureValues.get(measureId) || 0;
    console.log('[DimensionsTimeRow] Enter key pressed, entering edit mode:', { rowId: row.id, measureId, currentValue });
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
    console.log('[DimensionsTimeRow] Blur event, inputValue:', actualInputValue, 'editValue state:', editValue);
    const numValue = parseFloat(actualInputValue.replace(/,/g, ''));
    if (!isNaN(numValue)) {
      const roundedValue = Math.round(numValue * 100) / 100;
      console.log('[DimensionsTimeRow] Calling onCellChange from blur with:', { rowId: row.id, timeKey: row.timeKey, measureId, newValue: roundedValue });
      const timeKey = row.timeKey || null;
      onCellChange(row.id, timeKey, measureId, roundedValue);
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
      console.log('[DimensionsTimeRow] Enter pressed, inputValue:', inputValue, 'editValue state:', editValue);
      const numValue = parseFloat(inputValue.replace(/,/g, ''));
      if (!isNaN(numValue) && onCellChange) {
        const roundedValue = Math.round(numValue * 100) / 100;
        console.log('[DimensionsTimeRow] Calling onCellChange with:', { rowId: row.id, timeKey: row.timeKey, measureId, newValue: roundedValue });
        savedByEnterRef.current = true;
        const timeKey = row.timeKey || null;
        onCellChange(row.id, timeKey, measureId, roundedValue);
      } else {
        console.log('[DimensionsTimeRow] Invalid number or no onCellChange:', { numValue, isNaN: isNaN(numValue), hasOnCellChange: !!onCellChange });
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

    const isEditable = row.type !== 'account' && row.type !== 'category' && row.type !== 'product' && 
                      (row.type === 'year' || row.type === 'quarter' || row.type === 'month');

    if (isDirectlyEdited) {
      const isIncrement = deltaPercent !== null && deltaPercent > 0;
      const deltaColor = isIncrement ? '#ff5d2d' : '#2E76E1';
      
      return (
        <div 
          className="cell-value-wrapper-edited-container"
          onClick={isEditable ? (e) => handleCellValueClick(measureId, e) : undefined}
          style={{ cursor: isEditable ? 'pointer' : 'default' }}
        >
          <div className="cell-value-left-icon">
            <div style={{ width: '18px', height: '18px' }}></div>
          </div>
          <div className="cell-value-left-section">
            {deltaPercent !== null && Math.abs(deltaPercent) > 0.001 && (
              <div className="cell-delta-badge" style={{ color: deltaColor }}>
                {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(2)}%
              </div>
            )}
            <span 
              className={`cell-value cell-value-edited ${!isEditable ? 'cell-value-readonly' : ''}`}
              style={{ color: deltaColor }}
            >
              {searchTerm && searchTerm.trim() ? (() => {
                const searchTerms = extractSearchTerms(searchTerm);
                const { otherTerms } = separateSearchTerms(searchTerms);
                const valueStr = formatValue(currentValue);
                return otherTerms.length > 0 && matchesNumber(currentValue, otherTerms) ? (
                  <SearchHighlight text={valueStr} searchTerms={otherTerms} />
                ) : (
                  valueStr
                );
              })() : (() => {
                return formatValue(currentValue);
              })()}
            </span>
          </div>
        </div>
      );
    }
    
    // Saved edited cell: show only icon, no badge, normal value positioning
    if (isSavedEdited) {
      const iconColor = savedIconColor || '#2E76E1'; // Use stored color or default blue
      // Use saved icon color to determine arrow direction (orange = increase, blue = decrease)
      const isIncrease = iconColor === '#ff5d2d' || iconColor === '#FF5D2D';
      
      return (
        <div 
          className="cell-value-wrapper-saved-container"
          onClick={isEditable ? (e) => handleCellValueClick(measureId, e) : undefined}
          style={{ cursor: isEditable ? 'pointer' : 'default' }}
        >
          <div className="cell-value-left-icon">
            {isIncrease ? (
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
            className={`cell-value cell-value-saved ${isIncrease ? 'cell-value-increase' : 'cell-value-decrease'} ${!isEditable ? 'cell-value-readonly' : ''}`}
          >
            {searchTerm && searchTerm.trim() ? (() => {
              const searchTerms = extractSearchTerms(searchTerm);
              const { otherTerms } = separateSearchTerms(searchTerms);
              const valueStr = formatValue(currentValue);
              return otherTerms.length > 0 && matchesNumber(currentValue, otherTerms) ? (
                <SearchHighlight text={valueStr} searchTerms={otherTerms} />
              ) : (
                valueStr
              );
            })() : formatValue(currentValue)}
          </span>
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
          <div className="cell-value-left-icon">
            <div style={{ width: '18px', height: '18px' }}></div>
          </div>
          <div className="cell-value-left-section">
            {deltaPercent !== null && Math.abs(deltaPercent) > 0.001 && (
              <div className="cell-delta-badge" style={{ color: deltaColor }}>
                {deltaPercent > 0 ? '+' : ''} {deltaPercent.toFixed(2)}%
              </div>
            )}
            <span 
              className={`cell-value cell-value-impacted ${!isEditable ? 'cell-value-readonly' : ''}`}
              style={{ color: deltaColor }}
            >
              {searchTerm && searchTerm.trim() ? (() => {
                const searchTerms = extractSearchTerms(searchTerm);
                const { otherTerms } = separateSearchTerms(searchTerms);
                const valueStr = formatValue(currentValue);
                return otherTerms.length > 0 && matchesNumber(currentValue, otherTerms) ? (
                  <SearchHighlight text={valueStr} searchTerms={otherTerms} />
                ) : (
                  valueStr
                );
              })() : (() => {
                return formatValue(currentValue);
              })()}
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <div className="cell-value-left-icon">
          <div style={{ width: '16px', height: '16px' }}></div>
        </div>
        <span 
          className={`cell-value ${!isEditable ? 'cell-value-readonly' : ''}`}
        style={{ cursor: isEditable ? 'pointer' : 'default' }}
        onClick={isEditable ? (e) => handleCellValueClick(measureId, e) : undefined}
      >
        {searchTerm && searchTerm.trim() ? (() => {
          const searchTerms = extractSearchTerms(searchTerm);
          const { otherTerms } = separateSearchTerms(searchTerms);
          const valueStr = formatValue(currentValue);
          return otherTerms.length > 0 && matchesNumber(currentValue, otherTerms) ? (
            <SearchHighlight text={valueStr} searchTerms={otherTerms} />
          ) : (
            valueStr
          );
        })() : (() => {
          const measure = measures.find(m => m.id === measureId);
          const isQuantity = measure?.name?.toLowerCase().includes('quantity') || false;
          return formatValue(currentValue, isQuantity);
        })()}
      </span>
      </div>
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
            <span className="cell-name">
              {searchTerm && searchTerm.trim() ? (() => {
                const searchTerms = extractSearchTerms(searchTerm);
                const { timeTerms, otherTerms } = separateSearchTerms(searchTerms);
                const allTerms = [...timeTerms, ...otherTerms];
                
                // Check if this is a time row and if it matches time terms
                let shouldHighlight = false;
                if (timeTerms.length > 0 && row.timeKey) {
                  shouldHighlight = matchesTimePeriod(row.timeKey, timeTerms);
                }
                // Also check if row name matches other terms
                if (!shouldHighlight && otherTerms.length > 0) {
                  const textLower = row.name.toLowerCase();
                  shouldHighlight = otherTerms.some(term => textLower.includes(term.toLowerCase()));
                }
                
                return shouldHighlight && allTerms.length > 0 ? (
                  <SearchHighlight text={row.name} searchTerms={allTerms} />
                ) : (
                  row.name
                );
              })() : row.name}
            </span>
          </div>
        </td>
        {measures.map((measure) => {
          const cellKey = `${row.id}-${measure.id}`;
          const isFocused = focusedCell?.rowId === row.id && focusedCell?.measureId === measure.id;
          const isEditable = row.type === 'year' || row.type === 'quarter' || row.type === 'month';
          
          // Check if this cell is edited or impacted
          const editedOriginalValue = editedCells?.get(cellKey);
          const impactedOriginalValue = impactedCells?.get(cellKey);
          const savedIconColorCheck = savedEditedCells?.get(cellKey);
          const isSavedEdited = savedIconColorCheck !== undefined;
          const isDirectlyEdited = editedOriginalValue !== undefined;
          const isImpacted = !isDirectlyEdited && impactedOriginalValue !== undefined;
          
          // Debug logging for impacted cells
          if (impactedOriginalValue !== undefined || editedOriginalValue !== undefined) {
            console.log('[DimensionsTimeRow] Cell state:', {
              cellKey,
              rowId: row.id,
              measureId: measure.id,
              isDirectlyEdited,
              isImpacted,
              editedValue: editedOriginalValue,
              impactedValue: impactedOriginalValue,
              impactedCellsSize: impactedCells?.size,
              editedCellsSize: editedCells?.size
            });
          }
          
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
              tabIndex={isEditable ? 0 : -1}
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
            <DimensionsTimeRowComponent
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
              searchTerm={searchTerm}
            />
          ))}
        </>
      )}
    </>
  );
};

export default DimensionsTimeRowComponent;


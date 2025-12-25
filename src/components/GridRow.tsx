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
}

const GridRowComponent: React.FC<GridRowProps> = ({
  row,
  level,
  isExpanded,
  expandedRows,
  onToggleExpand,
  formatValue,
  onCellChange,
}) => {
  const hasChildren = row.children && row.children.length > 0;
  const [editingCell, setEditingCell] = useState<{ monthKey: keyof GridRowType['values'] } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const monthKeys: (keyof GridRowType['values'])[] = [
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
    if (!onCellChange) return;
    setEditingCell({ monthKey });
    setEditValue(row.values[monthKey].toString());
  };

  const handleCellBlur = () => {
    if (!editingCell || !onCellChange) return;
    
    const numValue = parseFloat(editValue.replace(/,/g, ''));
    if (!isNaN(numValue) && numValue !== row.values[editingCell.monthKey]) {
      onCellChange(row.id, editingCell.monthKey, numValue);
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
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
          onBlur={handleCellBlur}
          onKeyDown={handleCellKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    
    return (
      <span 
        className="cell-value"
        onClick={() => handleCellClick(monthKey)}
        style={{ cursor: onCellChange ? 'pointer' : 'default' }}
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
        {monthKeys.map((key) => (
          <td key={key} className="grid-cell cell-value-cell">
            {renderCellValue(key)}
          </td>
        ))}
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
            />
          ))}
        </>
      )}
    </>
  );
};

export default GridRowComponent;


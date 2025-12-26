import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { MeasureData } from '../types';
import TimeDimensionsRowComponent from './TimeDimensionsRow';
import { transformToTimeDimensionsLayout, TransformedRow } from '../utils/layoutTransform';
import '../styles/components/Grid.css';

interface TimeDimensionsGridProps {
  data: MeasureData[];
  onDataChange?: (newData: MeasureData[]) => void;
  selectedDimensionLevels?: Set<string>;
  selectedTimeGranularities?: Set<string>;
  columnWidth?: number;
  onExpandAllRows?: (handler: () => void) => void;
  onCollapseAllRows?: (handler: () => void) => void;
  onSettingsClick?: () => void;
  initialFocusedCell?: { rowId: string; measureId: string } | null;
  onFocusedCellChange?: (focus: { rowId: string; measureId: string } | null) => void;
}

const TimeDimensionsGrid: React.FC<TimeDimensionsGridProps> = ({
  data,
  onDataChange,
  selectedDimensionLevels,
  selectedTimeGranularities,
  columnWidth = 100,
  onExpandAllRows,
  onCollapseAllRows,
  onSettingsClick,
  initialFocusedCell,
  onFocusedCellChange,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; measureId: string } | null>(initialFocusedCell || null);
  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const [editedCells, setEditedCells] = useState<Map<string, number>>(new Map());
  const [impactedCells, setImpactedCells] = useState<Map<string, number>>(new Map());
  const [savedEditedCells] = useState<Map<string, string>>(new Map());
  const [gridData, setGridData] = useState<MeasureData[]>(data);

  // Update local data when prop changes
  useEffect(() => {
    if (data !== gridData) {
      console.log('[TimeDimensionsGrid] Data prop changed, updating gridData');
      setGridData(data);
    }
  }, [data, gridData]);

  // Transform data to Time/Dimensions x Measures layout
  const transformedRows = useMemo(() => {
    try {
      const transformed = transformToTimeDimensionsLayout(gridData);
      return transformed;
    } catch (error) {
      console.error('[TimeDimensionsGrid] Error transforming data:', error);
      return [];
    }
  }, [gridData]);

  // Helper to collect all dimensions from a time row's descendants
  const collectDimensionsFromDescendants = useCallback((row: TransformedRow): TransformedRow[] => {
    const dimensions: TransformedRow[] = [];
    const collect = (children: TransformedRow[]) => {
      for (const child of children) {
        if (child.type === 'account' || child.type === 'category' || child.type === 'product') {
          dimensions.push(child);
        } else if (child.children) {
          collect(child.children);
        }
      }
    };
    if (row.children) {
      collect(row.children);
    }
    return dimensions;
  }, []);

  // Expand all rows by default
  useEffect(() => {
    const allRowIds = new Set<string>();
    const collectRowIds = (rows: TransformedRow[]) => {
      rows.forEach(row => {
        allRowIds.add(row.id);
        if (row.children) {
          collectRowIds(row.children);
        }
      });
    };
    collectRowIds(transformedRows);
    setExpandedRows(allRowIds);
  }, [transformedRows]);

  // Filter dimension rows based on selected dimension levels (applied at each time period)
  const filterDimensionsByLevels = useCallback((
    dimensionRows: TransformedRow[],
    selectedLevels: Set<string>
  ): TransformedRow[] => {
    if (!selectedLevels || selectedLevels.size === 0) {
      return dimensionRows;
    }

    const filtered: TransformedRow[] = [];

    for (const row of dimensionRows) {
      const levelKey = row.type === 'account' ? 'account' : 
                       row.type === 'category' ? 'category' : 
                       row.type === 'product' ? 'product' : null;
      
      if (!levelKey) {
        // Not a dimension row, keep as is
        filtered.push(row);
        continue;
      }

      if (selectedLevels.has(levelKey)) {
        // This level is selected, process children
        const processedChildren = row.children ? filterDimensionsByLevels(row.children, selectedLevels) : undefined;
        filtered.push({
          ...row,
          children: processedChildren,
        });
      } else {
        // This level is not selected, promote its children
        if (row.children) {
          const promoted = filterDimensionsByLevels(row.children, selectedLevels);
          filtered.push(...promoted);
        }
      }
    }

    return filtered;
  }, []);

  // Determine the deepest enabled time granularity level
  const getDeepestEnabledGranularity = useCallback((selectedGranularities: Set<string>): string | null => {
    if (!selectedGranularities || selectedGranularities.size === 0) {
      return 'month'; // Default to month if nothing selected
    }
    
    // Check in order: month > quarter > year
    if (selectedGranularities.has('month')) {
      return 'month';
    }
    if (selectedGranularities.has('quarter')) {
      return 'quarter';
    }
    if (selectedGranularities.has('year')) {
      return 'year';
    }
    
    return null;
  }, []);

  // Filter time rows based on selected time granularities
  // Dimensions only appear under the deepest enabled time granularity level
  const filterTimeRows = useCallback((
    rows: TransformedRow[],
    selectedGranularities: Set<string>
  ): TransformedRow[] => {
    if (!selectedGranularities || selectedGranularities.size === 0) {
      return rows;
    }

    const deepestGranularity = getDeepestEnabledGranularity(selectedGranularities);
    const filtered: TransformedRow[] = [];

    for (const row of rows) {
      if (row.type === 'year') {
        if (selectedGranularities.has('year')) {
          // Collect dimensions BEFORE filtering (from original row.children)
          const allDimensions = deepestGranularity === 'year' ? collectDimensionsFromDescendants(row) : [];
          
          // Process children (quarters) - this may filter out months if they're not deepest
          const processedChildren = row.children ? filterTimeRows(row.children, selectedGranularities) : undefined;
          
          // Only keep dimensions if year is the deepest enabled level
          if (deepestGranularity === 'year') {
            // Year is the deepest level - aggregate collected dimensions
            
            // Aggregate dimensions by their base ID (remove time suffix)
            const dimensionMap = new Map<string, TransformedRow>();
            allDimensions.forEach(dim => {
              // Extract base dimension ID (remove time suffix like -q1, -jan2026)
              const baseId = dim.id.replace(/-(q[1-4]|jan2026|feb2026|mar2026|apr2026|may2026|jun2026|jul2026|aug2026|sep2026|oct2026|nov2026|dec2026)$/, '');
              if (!dimensionMap.has(baseId)) {
                // Create a new dimension row for year level
                dimensionMap.set(baseId, {
                  ...dim,
                  id: `${baseId}-year`,
                  parentId: row.id,
                });
              } else {
                // Aggregate values
                const existing = dimensionMap.get(baseId)!;
                dim.measureValues.forEach((value, measureId) => {
                  const current = existing.measureValues.get(measureId) || 0;
                  existing.measureValues.set(measureId, current + value);
                });
              }
            });
            
            const filteredDimensions = Array.from(dimensionMap.values()).length > 0 ? 
              filterDimensionsByLevels(Array.from(dimensionMap.values()), selectedDimensionLevels || new Set()) : 
              [];
            
            filtered.push({
              ...row,
              children: [...(processedChildren || []), ...filteredDimensions],
            });
          } else {
            // Year is not the deepest level, remove dimensions (only keep time children)
            filtered.push({
              ...row,
              children: processedChildren,
            });
          }
        } else {
          // Year not selected, promote quarters
          if (row.children) {
            const promoted = filterTimeRows(row.children, selectedGranularities);
            filtered.push(...promoted);
          }
        }
      } else if (row.type === 'quarter') {
        if (selectedGranularities.has('quarter')) {
          // Collect dimensions BEFORE filtering (from original row.children)
          const allDimensions = deepestGranularity === 'quarter' ? collectDimensionsFromDescendants(row) : [];
          
          // Process children (months) - this may filter out months if they're not deepest
          const processedChildren = row.children ? filterTimeRows(row.children, selectedGranularities) : undefined;
          
          // Only keep dimensions if quarter is the deepest enabled level
          if (deepestGranularity === 'quarter') {
            // Quarter is the deepest level - aggregate collected dimensions
            
            // Aggregate dimensions by their base ID
            const dimensionMap = new Map<string, TransformedRow>();
            const quarterKey = row.timeKey || 'q1';
            allDimensions.forEach(dim => {
              const baseId = dim.id.replace(/-(jan2026|feb2026|mar2026|apr2026|may2026|jun2026|jul2026|aug2026|sep2026|oct2026|nov2026|dec2026)$/, '');
              if (!dimensionMap.has(baseId)) {
                dimensionMap.set(baseId, {
                  ...dim,
                  id: `${baseId}-${quarterKey}`,
                  parentId: row.id,
                });
              } else {
                const existing = dimensionMap.get(baseId)!;
                dim.measureValues.forEach((value, measureId) => {
                  const current = existing.measureValues.get(measureId) || 0;
                  existing.measureValues.set(measureId, current + value);
                });
              }
            });
            
            const filteredDimensions = Array.from(dimensionMap.values()).length > 0 ? 
              filterDimensionsByLevels(Array.from(dimensionMap.values()), selectedDimensionLevels || new Set()) : 
              [];
            
            filtered.push({
              ...row,
              children: [...(processedChildren || []), ...filteredDimensions],
            });
          } else {
            // Quarter is not the deepest level, remove dimensions (only keep time children)
            filtered.push({
              ...row,
              children: processedChildren,
            });
          }
        } else {
          // Quarter not selected, promote months
          if (row.children) {
            const promoted = filterTimeRows(row.children, selectedGranularities);
            filtered.push(...promoted);
          }
        }
      } else if (row.type === 'month') {
        if (selectedGranularities.has('month')) {
          // Month is the deepest time level, so if month is enabled and is the deepest, keep dimensions
          if (deepestGranularity === 'month') {
            // Filter dimensions under this month
            const processedChildren = row.children ? filterDimensionsByLevels(row.children, selectedDimensionLevels || new Set()) : undefined;
            filtered.push({
              ...row,
              children: processedChildren,
            });
          } else {
            // Month is enabled but not the deepest (shouldn't happen, but handle it)
            filtered.push({
              ...row,
              children: undefined,
            });
          }
        }
        // If month not selected, skip it
      } else {
        // Dimension row - process children recursively
        const processedChildren = row.children ? filterTimeRows(row.children, selectedGranularities) : undefined;
        filtered.push({
          ...row,
          children: processedChildren,
        });
      }
    }

    return filtered;
  }, [filterDimensionsByLevels, selectedDimensionLevels, getDeepestEnabledGranularity, collectDimensionsFromDescendants]);

  // Apply filters
  const filteredRows = useMemo(() => {
    let result = transformedRows;
    
    // Apply time filtering first
    if (selectedTimeGranularities && selectedTimeGranularities.size > 0) {
      result = filterTimeRows(result, selectedTimeGranularities);
    }
    
    return result;
  }, [transformedRows, selectedTimeGranularities, filterTimeRows]);

  // Get measures list
  const measures = useMemo(() => {
    return data.map(measure => ({
      id: measure.id,
      name: measure.name,
    }));
  }, [data]);

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

  const expandAllRows = useCallback(() => {
    const allRowIds = new Set<string>();
    const collectRowIds = (rows: TransformedRow[]) => {
      rows.forEach(row => {
        allRowIds.add(row.id);
        if (row.children) {
          collectRowIds(row.children);
        }
      });
    };
    collectRowIds(filteredRows);
    setExpandedRows(allRowIds);
  }, [filteredRows]);

  const collapseAllRows = useCallback(() => {
    // Only keep top-level rows expanded
    const topLevelIds = new Set(filteredRows.map(row => row.id));
    setExpandedRows(topLevelIds);
  }, [filteredRows]);

  useEffect(() => {
    if (onExpandAllRows) {
      onExpandAllRows(expandAllRows);
    }
  }, [onExpandAllRows, expandAllRows]);

  useEffect(() => {
    if (onCollapseAllRows) {
      onCollapseAllRows(collapseAllRows);
    }
  }, [onCollapseAllRows, collapseAllRows]);

  // Restore focus when initialFocusedCell changes
  useEffect(() => {
    if (initialFocusedCell && cellRefs.current) {
      const cellKey = `${initialFocusedCell.rowId}-${initialFocusedCell.measureId}`;
      const cellElement = cellRefs.current.get(cellKey);
      if (cellElement) {
        setTimeout(() => {
          cellElement.focus();
        }, 100);
      }
    }
  }, [initialFocusedCell]);

  const handleFocusChange = useCallback((focus: { rowId: string; measureId: string } | null) => {
    setFocusedCell(focus);
    if (onFocusedCellChange) {
      onFocusedCellChange(focus);
    }
  }, [onFocusedCellChange]);

  const formatValue = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Handle cell value change
  const handleCellChange = useCallback((
    timeKey: string,
    dimensionId: string,
    measureId: string,
    newValue: number
  ) => {
    try {
      console.log('[TimeDimensionsGrid] handleCellChange called:', { timeKey, dimensionId, measureId, newValue });
      
      if (!onDataChange) {
        console.log('[TimeDimensionsGrid] No onDataChange handler');
        return;
      }

      // Find the measure
      const measure = gridData.find(m => m.id === measureId);
      if (!measure) {
        console.log('[TimeDimensionsGrid] Measure not found:', measureId);
        return;
      }

      // Find the dimension row in the measure's hierarchy
      const findRowInMeasure = (rows: any[], id: string): any => {
        for (const row of rows) {
          if (row.id === id) return row;
          if (row.children) {
            const found = findRowInMeasure(row.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const dimensionRow = measure.children ? findRowInMeasure(measure.children, dimensionId) : null;
      if (!dimensionRow) {
        console.log('[TimeDimensionsGrid] Dimension row not found:', dimensionId);
        return;
      }

      // Store original value for edited cell
      const cellKey = `dimension-${dimensionId}-${timeKey}-${measureId}`;
      const originalValue = dimensionRow.values?.[timeKey as keyof typeof dimensionRow.values] || 0;
      setEditedCells(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(cellKey)) {
          newMap.set(cellKey, originalValue);
        }
        return newMap;
      });

      // Collect all updates
      const allUpdates: Array<{ measureId: string; rowId: string; timeKey: string; newValue: number }> = [];
      allUpdates.push({ measureId, rowId: dimensionId, timeKey, newValue });

      // Propagate upward through dimension hierarchy
      const storeOriginalValueIfImpacted = (rowId: string, mId: string, tKey: string) => {
        const impactedCellKey = `dimension-${rowId}-${tKey}-${mId}`;
        const impactedRow = measure.children ? findRowInMeasure(measure.children, rowId) : null;
        if (impactedRow && impactedRow.values) {
          const impactedOriginalValue = impactedRow.values[tKey as keyof typeof impactedRow.values] || 0;
          setImpactedCells(prev => {
            const newMap = new Map(prev);
            if (!newMap.has(impactedCellKey)) {
              newMap.set(impactedCellKey, impactedOriginalValue);
            }
            return newMap;
          });
        }
      };

      // Update parent dimension rows
      let currentRow = dimensionRow;
      while (currentRow && currentRow.parentId && currentRow.parentId !== measure.id) {
        const parentRow = measure.children ? findRowInMeasure(measure.children, currentRow.parentId) : null;
        if (parentRow) {
          // Sum all children for this time period
          const childrenSum = (parentRow.children || []).reduce((sum: number, child: any) => {
            const childValue = child.values?.[timeKey as keyof typeof child.values] || 0;
            // Check if this child has an update
            const childUpdate = allUpdates.find(u => u.rowId === child.id && u.timeKey === timeKey);
            return sum + (childUpdate ? childUpdate.newValue : childValue);
          }, 0);
          
          storeOriginalValueIfImpacted(parentRow.id, measureId, timeKey);
          allUpdates.push({ measureId, rowId: parentRow.id, timeKey, newValue: childrenSum });
          currentRow = parentRow;
        } else {
          break;
        }
      }

      // Handle time aggregation (month -> quarter -> year)
      if (timeKey !== 'year' && timeKey !== 'q1' && timeKey !== 'q2' && timeKey !== 'q3' && timeKey !== 'q4') {
        // This is a month, update its quarter
        const quarterMap: { [key: string]: string } = {
          jan2026: 'q1', feb2026: 'q1', mar2026: 'q1',
          apr2026: 'q2', may2026: 'q2', jun2026: 'q2',
          jul2026: 'q3', aug2026: 'q3', sep2026: 'q3',
          oct2026: 'q4', nov2026: 'q4', dec2026: 'q4',
        };
        const quarterKey = quarterMap[timeKey];
        if (quarterKey) {
          // Sum all months in this quarter for this dimension
          const monthKeys = Object.keys(quarterMap).filter(k => quarterMap[k] === quarterKey);
          const quarterSum = monthKeys.reduce((sum, monthKey) => {
            const monthValue = dimensionRow.values?.[monthKey as keyof typeof dimensionRow.values] || 0;
            const monthUpdate = allUpdates.find(u => u.rowId === dimensionId && u.timeKey === monthKey);
            return sum + (monthUpdate ? monthUpdate.newValue : monthValue);
          }, 0);
          
          storeOriginalValueIfImpacted(dimensionId, measureId, quarterKey);
          allUpdates.push({ measureId, rowId: dimensionId, timeKey: quarterKey, newValue: quarterSum });
        }
      }

      // Update year value (sum of all quarters or months)
      const quarterKeys = ['q1', 'q2', 'q3', 'q4'];
      const yearSum = quarterKeys.reduce((sum, qKey) => {
        const quarterValue = dimensionRow.values?.[qKey as keyof typeof dimensionRow.values] || 0;
        const quarterUpdate = allUpdates.find(u => u.rowId === dimensionId && u.timeKey === qKey);
        return sum + (quarterUpdate ? quarterUpdate.newValue : quarterValue);
      }, 0);
      
      storeOriginalValueIfImpacted(dimensionId, measureId, 'year');
      allUpdates.push({ measureId, rowId: dimensionId, timeKey: 'year', newValue: yearSum });

      // Handle cross-measure dependencies (Final Forecast = average)
      if (measureId !== 'measure-final-forecast') {
        const finalForecastMeasure = gridData.find(m => m.id === 'measure-final-forecast');
        if (finalForecastMeasure) {
          const otherMeasures = gridData.filter(m => 
            m.id !== 'measure-final-forecast' && 
            (m.id === 'measure-baseline-forecast' || 
             m.id === 'measure-account-manager-adjusted' || 
             m.id === 'measure-sales-manager-adjusted' || 
             m.id === 'measure-regional-director-adjusted')
          );
          
          if (otherMeasures.length > 0) {
            const finalForecastRow = finalForecastMeasure.children ? findRowInMeasure(finalForecastMeasure.children, dimensionId) : null;
            if (finalForecastRow) {
              const averageValue = otherMeasures.reduce((sum, m) => {
                const mRow = m.children ? findRowInMeasure(m.children, dimensionId) : null;
                const mValue = mRow ? (mRow.values?.[timeKey as keyof typeof mRow.values] || 0) : 0;
                const mUpdate = allUpdates.find(u => u.measureId === m.id && u.rowId === dimensionId && u.timeKey === timeKey);
                return sum + (mUpdate ? mUpdate.newValue : mValue);
              }, 0) / otherMeasures.length;
              
              storeOriginalValueIfImpacted(dimensionId, 'measure-final-forecast', timeKey);
              allUpdates.push({ measureId: 'measure-final-forecast', rowId: dimensionId, timeKey, newValue: averageValue });
            }
          }
        }
      }

      // Apply all updates
      const updatedData = gridData.map(m => {
        const updatedMeasure = JSON.parse(JSON.stringify(m));
        const updatesForMeasure = allUpdates.filter(u => u.measureId === m.id);
        if (updatesForMeasure.length === 0) return updatedMeasure;
        
        const updateRowValue = (rows: any[]): void => {
          for (const row of rows) {
            const update = updatesForMeasure.find(u => u.rowId === row.id);
            if (update && row.values) {
              row.values[update.timeKey as keyof typeof row.values] = update.newValue;
            }
            if (row.children) {
              updateRowValue(row.children);
            }
          }
        };
        
        if (updatedMeasure.children) {
          updateRowValue(updatedMeasure.children);
        }
        
        return updatedMeasure;
      });

      setGridData(updatedData);
      onDataChange(updatedData);
    } catch (error) {
      console.error('[TimeDimensionsGrid] Error in handleCellChange:', error);
    }
  }, [gridData, onDataChange]);

  if (filteredRows.length === 0) {
    return (
      <div className="grid-container">
        <div className="grid-empty">No data available</div>
      </div>
    );
  }

  return (
    <div className="grid-container">
      <div className="grid-wrapper">
        <table className="grid-table dimensions-time-table time-dimensions-table">
          <thead className="grid-header dimensions-time-layout">
            <tr>
              <th style={{ width: '300px', minWidth: '300px' }}>
                <div className="grid-header-title-container" style={{ justifyContent: 'space-between' }}>
                  <span>Time / Dimensions x Measures</span>
                  {onSettingsClick && (
                    <button 
                      className="grid-header-settings-button"
                      onClick={onSettingsClick}
                      title="Settings"
                      type="button"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </th>
              {measures.map((measure) => (
                <th
                  key={measure.id}
                  style={{
                    minWidth: `${columnWidth}px`,
                    width: `${columnWidth}px`,
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {measure.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="grid-body">
            {filteredRows.map((row) => (
              <TimeDimensionsRowComponent
                key={row.id}
                row={row}
                level={0}
                isExpanded={expandedRows.has(row.id)}
                expandedRows={expandedRows}
                onToggleExpand={toggleExpand}
                formatValue={formatValue}
                measures={measures}
                onCellChange={handleCellChange}
                focusedCell={focusedCell}
                onCellFocus={handleFocusChange}
                cellRefs={cellRefs}
                editedCells={editedCells}
                impactedCells={impactedCells}
                savedEditedCells={savedEditedCells}
                columnWidth={columnWidth}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeDimensionsGrid;


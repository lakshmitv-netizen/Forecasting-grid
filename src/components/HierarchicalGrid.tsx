import React, { useState, useCallback } from 'react';
import { MeasureData, GridRow as GridRowType } from '../types';
import GridRowComponent from './GridRow';
import {
  propagateUpward,
  propagateDownward,
  updateCrossMeasureDependencies,
  findRowById,
  distributeProportionally,
} from '../utils/valuePropagation';
import '../styles/components/Grid.css';

interface HierarchicalGridProps {
  data: MeasureData[];
  onDataChange?: (newData: MeasureData[]) => void;
}

const HierarchicalGrid: React.FC<HierarchicalGridProps> = ({ data, onDataChange }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [gridData, setGridData] = useState<MeasureData[]>(data);

  // Calculate measure values from children
  const calculateMeasureValues = useCallback((dataToCalculate: MeasureData[]): MeasureData[] => {
    const updated = JSON.parse(JSON.stringify(dataToCalculate));
    const monthKeys: (keyof GridRowType['values'])[] = [
      'jan2026', 'feb2026', 'mar2026', 'apr2026', 'may2026', 'jun2026',
      'jul2026', 'aug2026', 'sep2026', 'oct2026', 'nov2026', 'dec2026',
    ];
    
    for (const measure of updated) {
      for (const monthKey of monthKeys) {
        if (measure.children && measure.children.length > 0) {
          measure.values[monthKey] = measure.children.reduce(
            (sum, child) => sum + child.values[monthKey],
            0
          );
        }
      }
    }
    
    return updated;
  }, []);

  // Update local state when prop changes and recalculate measure values
  React.useEffect(() => {
    const calculatedData = calculateMeasureValues(data);
    setGridData(calculatedData);
  }, [data, calculateMeasureValues]);

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

  const formatValue = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  };

  // Update a single value in the data structure
  const updateValue = useCallback((
    rowId: string,
    monthKey: keyof GridRowType['values'],
    newValue: number,
    dataToUpdate: MeasureData[]
  ): MeasureData[] => {
    const newData = JSON.parse(JSON.stringify(dataToUpdate)); // Deep clone
    
    const updateRowValue = (rows: GridRowType[], id: string): boolean => {
      for (const row of rows) {
        if (row.id === id) {
          row.values[monthKey] = newValue;
          return true;
        }
        if (row.children && updateRowValue(row.children, id)) {
          return true;
        }
      }
      return false;
    };

    const updateMeasureValue = (measures: MeasureData[], id: string): boolean => {
      for (const measure of measures) {
        if (measure.id === id) {
          measure.values[monthKey] = newValue;
          return true;
        }
        if (updateRowValue(measure.children, id)) {
          return true;
        }
      }
      return false;
    };

    // Check if it's a measure row
    const isMeasure = newData.some(m => m.id === rowId);
    if (isMeasure) {
      updateMeasureValue(newData, rowId);
    } else {
      updateRowValue(newData.flatMap(m => m.children), rowId);
    }

    return newData;
  }, []);

  // Handle cell value change
  const handleCellChange = useCallback((
    rowId: string,
    monthKey: keyof GridRowType['values'],
    newValue: number
  ) => {
    // Check if it's a measure row
    const measure = gridData.find(m => m.id === rowId);
    const isMeasureRow = !!measure;
    
    let oldValue: number;
    if (isMeasureRow) {
      oldValue = measure.values[monthKey];
    } else {
      const row = findRowById(rowId, gridData);
      if (!row) return;
      oldValue = row.values[monthKey];
    }

    const delta = newValue - oldValue;

    if (delta === 0) return;

    // Collect all updates
    const allUpdates: { rowId: string; monthKey: keyof GridRowType['values']; newValue: number }[] = [];

    // 1. Update the edited cell
    allUpdates.push({ rowId, monthKey, newValue });

    // 2. Propagate upward (to ancestors)
    const upwardUpdates = propagateUpward(rowId, monthKey, delta, gridData);
    allUpdates.push(...upwardUpdates);

    // 3. Propagate downward (to descendants)
    // For measure rows, propagate to account level proportionally
    if (isMeasureRow) {
      const measureData = gridData.find(m => m.id === rowId);
      if (measureData && measureData.children.length > 0) {
        const accountDistribution = distributeProportionally(delta, measureData.children, monthKey);
        for (const [accountId, accountDelta] of accountDistribution.entries()) {
          const account = measureData.children.find(c => c.id === accountId);
          if (account) {
            const accountNewValue = account.values[monthKey] + accountDelta;
            allUpdates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
            const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, gridData);
            allUpdates.push(...accountUpdates);
          }
        }
      }
    } else {
      const downwardUpdates = propagateDownward(rowId, monthKey, delta, gridData);
      allUpdates.push(...downwardUpdates);
    }

    // 4. Update cross-measure dependencies (Orders = Sales Agreement)
    console.log('[GRID] Calling updateCrossMeasureDependencies:', { rowId, monthKey, newValue });
    const crossMeasureUpdates = updateCrossMeasureDependencies(rowId, monthKey, newValue, gridData);
    console.log('[GRID] Cross-measure updates returned:', crossMeasureUpdates.length, 'updates');
    allUpdates.push(...crossMeasureUpdates);

    // Apply all updates
    let updatedData = gridData;
    for (const update of allUpdates) {
      updatedData = updateValue(update.rowId, update.monthKey, update.newValue, updatedData);
    }

    // Recalculate measure values from children after all updates
    updatedData = calculateMeasureValues(updatedData);

    setGridData(updatedData);
    if (onDataChange) {
      onDataChange(updatedData);
    }
  }, [gridData, updateValue, onDataChange, calculateMeasureValues]);

  const monthLabels = [
    'Jan 26',
    'Feb 26',
    'Mar 26',
    'Apr 26',
    'May 26',
    'Jun 26',
    'Jul 26',
    'Aug 26',
    'Sep 26',
    'Oct 26',
    'Nov 26',
    'Dec 26',
  ];

  return (
    <div className="grid-container">
      <table className="grid-table">
        <thead className="grid-header">
          <tr>
            <th>Measures / Dimensions x Time</th>
            {monthLabels.map((month) => (
              <th key={month}>{month}</th>
            ))}
          </tr>
        </thead>
        <tbody className="grid-body">
          {gridData.map((measure) => {
            const measureRow: GridRowType = {
              id: measure.id,
              name: measure.name,
              parentId: null,
              level: 0,
              type: 'measure',
              children: measure.children,
              values: measure.values,
            };
            return (
              <GridRowComponent
                key={measure.id}
                row={measureRow}
                level={0}
                isExpanded={expandedRows.has(measure.id)}
                expandedRows={expandedRows}
                onToggleExpand={toggleExpand}
                formatValue={formatValue}
                onCellChange={handleCellChange}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HierarchicalGrid;


import React, { useState, useRef, useEffect } from 'react';
import { MeasureData } from '../types';
import { mockData } from '../data/mockData';
import { adjustmentMeasuresData } from '../data/adjustmentMeasuresData';
import HierarchicalGrid from './HierarchicalGrid';
import DimensionsTimeGrid from './DimensionsTimeGrid';
import TimeDimensionsGrid from './TimeDimensionsGrid';
import GridToolbar from './GridToolbar';
import SettingsPanel from './SettingsPanel';
import '../styles/components/Grid.css';

// Cell focus types for different layouts
type HierarchicalGridFocus = { rowId: string; monthKey: string } | null;
type DimensionsTimeGridFocus = { rowId: string; measureId: string } | null;
type TimeDimensionsGridFocus = { rowId: string; measureId: string } | null;

const ForecastingGrid: React.FC = () => {
  const [selectedMeasureSubgroup, setSelectedMeasureSubgroup] = useState<string>('Revenue and Quantity Measures');
  const [selectedLayoutState, setSelectedLayoutState] = useState<string>('Measures / Dimensions x Time');
  const [data, setData] = useState<MeasureData[]>(mockData);
  
  // Store focused cell for each layout
  const hierarchicalGridFocusRef = useRef<HierarchicalGridFocus>(null);
  const dimensionsTimeGridFocusRef = useRef<DimensionsTimeGridFocus>(null);
  const timeDimensionsGridFocusRef = useRef<TimeDimensionsGridFocus>(null);
  
  // Update data when measure subgroup changes
  useEffect(() => {
    if (selectedMeasureSubgroup === 'Adjustment Measures') {
      setData(adjustmentMeasuresData);
    } else {
      setData(mockData);
    }
  }, [selectedMeasureSubgroup]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDimensionLevels, setSelectedDimensionLevels] = useState<Set<string>>(
    new Set(['account', 'category', 'product'])
  );
  const [selectedTimeGranularities, setSelectedTimeGranularities] = useState<Set<string>>(
    new Set(['month'])
  );
  
  // Default column width based on layout
  // For "Dimensions / Time x Measures": 100px (measure columns)
  // For "Measures / Dimensions x Time": 125px (time period columns)
  const getDefaultColumnWidth = (layout: string): number => {
    return layout === 'Dimensions / Time x Measures' ? 100 : 125;
  };
  
  const [columnWidth, setColumnWidth] = useState<number>(getDefaultColumnWidth(selectedLayoutState));
  
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
        <div className="breadcrumbs-row">
          <div className="breadcrumbs">
            Planning & Forecasting FY26
            <span className="breadcrumbs-separator">&gt;</span>
            Grid
          </div>
          <div className="last-refreshed">
            Last Refreshed {lastRefreshed}
            <svg className="refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
        <div className="page-title-section">
          <div className="page-title">
            Planning & Forecasting FY26
            <svg className="title-dropdown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <GridToolbar 
            onSettingsClick={() => setIsSettingsOpen(true)} 
          />
        </div>
      </div>
      <div className="grid-wrapper">
        {selectedLayoutState === 'Dimensions / Time x Measures' ? (
          <DimensionsTimeGrid 
            data={data} 
            onDataChange={setData} 
            selectedDimensionLevels={selectedDimensionLevels}
            selectedTimeGranularities={selectedTimeGranularities}
            columnWidth={columnWidth}
            onExpandAllRows={(handler) => { expandAllRef.current = handler; }}
            onCollapseAllRows={(handler) => { collapseAllRef.current = handler; }}
            onSettingsClick={() => setIsSettingsOpen(true)}
            initialFocusedCell={mapToDimensionsTimeFocus(hierarchicalGridFocusRef.current)}
            onFocusedCellChange={(focus) => { dimensionsTimeGridFocusRef.current = focus; }}
          />
        ) : selectedLayoutState === 'Time / Dimensions x Measures' ? (
          <TimeDimensionsGrid 
            data={data} 
            onDataChange={setData} 
            selectedDimensionLevels={selectedDimensionLevels}
            selectedTimeGranularities={selectedTimeGranularities}
            columnWidth={columnWidth}
            onExpandAllRows={(handler) => { expandAllRef.current = handler; }}
            onCollapseAllRows={(handler) => { collapseAllRef.current = handler; }}
            onSettingsClick={() => setIsSettingsOpen(true)}
            initialFocusedCell={timeDimensionsGridFocusRef.current}
            onFocusedCellChange={(focus) => { timeDimensionsGridFocusRef.current = focus; }}
          />
        ) : (
          <HierarchicalGrid 
            data={data} 
            onDataChange={setData} 
            selectedDimensionLevels={selectedDimensionLevels}
            selectedTimeGranularities={selectedTimeGranularities}
            columnWidth={columnWidth}
            onExpandAllRows={(handler) => { expandAllRef.current = handler; }}
            onCollapseAllRows={(handler) => { collapseAllRef.current = handler; }}
            onSettingsClick={() => setIsSettingsOpen(true)}
            initialFocusedCell={mapToHierarchicalFocus(dimensionsTimeGridFocusRef.current)}
            onFocusedCellChange={(focus) => { hierarchicalGridFocusRef.current = focus; }}
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
        />
      </div>
    </div>
  );
};

export default ForecastingGrid;


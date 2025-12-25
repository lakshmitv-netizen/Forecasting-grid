import React, { useState, useRef } from 'react';
import { MeasureData } from '../types';
import { mockData } from '../data/mockData';
import HierarchicalGrid from './HierarchicalGrid';
import GridToolbar from './GridToolbar';
import SettingsPanel from './SettingsPanel';
import '../styles/components/Grid.css';

const ForecastingGrid: React.FC = () => {
  const [data, setData] = useState<MeasureData[]>(mockData);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDimensionLevels, setSelectedDimensionLevels] = useState<Set<string>>(
    new Set(['account', 'category', 'product'])
  );
  const [selectedTimeGranularities, setSelectedTimeGranularities] = useState<Set<string>>(
    new Set(['month'])
  );
  const [columnWidth, setColumnWidth] = useState<number>(125); // Default column width in pixels (50% of slider range)
  
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
        <HierarchicalGrid 
          data={data} 
          onDataChange={setData} 
          selectedDimensionLevels={selectedDimensionLevels}
          selectedTimeGranularities={selectedTimeGranularities}
          columnWidth={columnWidth}
          onExpandAllRows={(handler) => { expandAllRef.current = handler; }}
          onCollapseAllRows={(handler) => { collapseAllRef.current = handler; }}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
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
        />
      </div>
    </div>
  );
};

export default ForecastingGrid;


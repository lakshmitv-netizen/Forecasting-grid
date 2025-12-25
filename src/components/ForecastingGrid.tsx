import React, { useState } from 'react';
import { MeasureData } from '../types';
import { mockData } from '../data/mockData';
import HierarchicalGrid from './HierarchicalGrid';
import GridToolbar from './GridToolbar';
import '../styles/components/Grid.css';

const ForecastingGrid: React.FC = () => {
  const [data, setData] = useState<MeasureData[]>(mockData);
  const [lastRefreshed] = useState(() => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time}, ${date}`;
  });

  return (
    <div className="forecasting-container">
      <div className="page-header">
        <div className="breadcrumbs">
          Planning & Forecasting FY26
          <span className="breadcrumbs-separator">&gt;</span>
          Grid
        </div>
        <div className="page-title-section">
          <div className="page-title">
            Planning & Forecasting FY26
            <svg className="title-dropdown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="last-refreshed">
            Last Refreshed {lastRefreshed}
            <svg className="refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      </div>

      <GridToolbar />
      <HierarchicalGrid data={data} onDataChange={setData} />
    </div>
  );
};

export default ForecastingGrid;


import React, { useState, useRef, useEffect } from 'react';
import './index.css';

function App() {
  const [expandedRows, setExpandedRows] = useState(new Set(['aggregate', 'usa', 'michigan', 'magnadrive', 'transmission', 'chassis']));
  const [selectedMonth, setSelectedMonth] = useState('January 2025');
  const [selectedView, setSelectedView] = useState('Specific Time');
  const [lastSelectedCell, setLastSelectedCell] = useState(null); // Track last selected cell
  const [selectedCell, setSelectedCell] = useState(null); // Track which cell is selected (rowId and columnName)
  const headerScrollRef = useRef(null);
  const contentScrollRef = useRef(null);
  
  const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'];
  const monthNames = ['January \'25', 'February \'25', 'March \'25', 'April \'25', 'May \'25', 'June \'25', 'July \'25', 'August \'25', 'September \'25', 'October \'25', 'November \'25', 'December \'25'];
  
  const viewOptions = ['Time series', 'Time Roll-up', 'Specific Time'];
  
  // KPI options for the dropdown in Time Series view
  const kpiOptions = [
    'Baseline (Revenue) [Read-Only]',
    'AM Adjusted (Revenue) [Editable]',
    'SM Adjustment [Read-Only]',
    'RSD Adjustment [Read-Only]',
    'Final Forecast (Revenue) [Read-Only]'
  ];

  const toggleRow = (rowId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  // Generate data based on selected month
  const generateDataForMonth = (month) => {
    // Add seasonal variations - unique multiplier for each month
    const monthIndex = months.indexOf(month);
    // Array of unique multipliers for each month (varying from 0.85 to 1.20)
    const uniqueMultipliers = [
      1.15, // January
      0.92, // February
      1.05, // March
      1.18, // April
      0.88, // May
      1.10, // June
      1.20, // July
      0.85, // August
      1.12, // September
      0.95, // October
      1.08, // November
      1.00, // December
    ];
    const seasonalMultiplier = uniqueMultipliers[monthIndex];
    
    return [
    {
      id: 'aggregate',
      name: 'Aggregate',
      hasChildren: true,
      baseline: Math.round(5000000 * seasonalMultiplier),
      amAdjusted: Math.round(5500000 * seasonalMultiplier),
      smAdjustment: Math.round(200000 * seasonalMultiplier),
      rsdAdjustment: Math.round(280000 * seasonalMultiplier),
      finalForecast: Math.round(5980000 * seasonalMultiplier),
      children: [
        {
          id: 'magnadrive',
          name: 'MagnaDrive - Michigan Plant',
          hasChildren: true,
          baseline: Math.round(5000000 * seasonalMultiplier),
          amAdjusted: Math.round(5500000 * seasonalMultiplier),
          smAdjustment: Math.round(200000 * seasonalMultiplier),
          rsdAdjustment: Math.round(280000 * seasonalMultiplier),
          finalForecast: Math.round(5980000 * seasonalMultiplier),
          children: [
            {
              id: 'transmission',
              name: 'Transmission Assemblies',
              hasChildren: true,
              baseline: Math.round(4000000 * seasonalMultiplier),
              amAdjusted: Math.round(4400000 * seasonalMultiplier),
              smAdjustment: Math.round(150000 * seasonalMultiplier),
              rsdAdjustment: Math.round(200000 * seasonalMultiplier),
              finalForecast: Math.round(4750000 * seasonalMultiplier),
              children: [
                { 
                  id: 'product-1', 
                  name: 'Product A', 
                  hasChildren: false,
                  baseline: Math.round(850000 * seasonalMultiplier),
                  amAdjusted: Math.round(920000 * seasonalMultiplier),
                  smAdjustment: Math.round(30000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(45000 * seasonalMultiplier),
                  finalForecast: Math.round(995000 * seasonalMultiplier)
                },
                { 
                  id: 'product-2', 
                  name: 'Product B', 
                  hasChildren: false,
                  baseline: Math.round(820000 * seasonalMultiplier),
                  amAdjusted: Math.round(900000 * seasonalMultiplier),
                  smAdjustment: Math.round(40000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(38000 * seasonalMultiplier),
                  finalForecast: Math.round(978000 * seasonalMultiplier)
                },
                { 
                  id: 'product-3', 
                  name: 'Product C', 
                  hasChildren: false,
                  baseline: Math.round(750000 * seasonalMultiplier),
                  amAdjusted: Math.round(830000 * seasonalMultiplier),
                  smAdjustment: Math.round(28000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(52000 * seasonalMultiplier),
                  finalForecast: Math.round(910000 * seasonalMultiplier)
                },
                { 
                  id: 'product-4', 
                  name: 'Product D', 
                  hasChildren: false,
                  baseline: Math.round(680000 * seasonalMultiplier),
                  amAdjusted: Math.round(750000 * seasonalMultiplier),
                  smAdjustment: Math.round(25000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(45000 * seasonalMultiplier),
                  finalForecast: Math.round(820000 * seasonalMultiplier)
                },
                { 
                  id: 'product-5', 
                  name: 'Product E', 
                  hasChildren: false,
                  baseline: Math.round(500000 * seasonalMultiplier),
                  amAdjusted: Math.round(580000 * seasonalMultiplier),
                  smAdjustment: Math.round(15000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(20000 * seasonalMultiplier),
                  finalForecast: Math.round(615000 * seasonalMultiplier)
                },
                { 
                  id: 'product-6', 
                  name: 'Product F', 
                  hasChildren: false,
                  baseline: Math.round(400000 * seasonalMultiplier),
                  amAdjusted: Math.round(420000 * seasonalMultiplier),
                  smAdjustment: Math.round(22000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(0 * seasonalMultiplier),
                  finalForecast: Math.round(442000 * seasonalMultiplier)
                },
              ],
            },
            {
              id: 'chassis',
              name: 'Chassis Components',
              hasChildren: true,
              baseline: Math.round(1000000 * seasonalMultiplier),
              amAdjusted: Math.round(1100000 * seasonalMultiplier),
              smAdjustment: Math.round(50000 * seasonalMultiplier),
              rsdAdjustment: Math.round(80000 * seasonalMultiplier),
              finalForecast: Math.round(1230000 * seasonalMultiplier),
              children: [
                { 
                  id: 'chassis-1', 
                  name: 'Chassis Product 1', 
                  hasChildren: false,
                  baseline: Math.round(380000 * seasonalMultiplier),
                  amAdjusted: Math.round(420000 * seasonalMultiplier),
                  smAdjustment: Math.round(18000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(22000 * seasonalMultiplier),
                  finalForecast: Math.round(460000 * seasonalMultiplier)
                },
                { 
                  id: 'chassis-2', 
                  name: 'Chassis Product 2', 
                  hasChildren: false,
                  baseline: Math.round(330000 * seasonalMultiplier),
                  amAdjusted: Math.round(380000 * seasonalMultiplier),
                  smAdjustment: Math.round(16000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(30000 * seasonalMultiplier),
                  finalForecast: Math.round(426000 * seasonalMultiplier)
                },
                { 
                  id: 'chassis-3', 
                  name: 'Chassis Product 3', 
                  hasChildren: false,
                  baseline: Math.round(290000 * seasonalMultiplier),
                  amAdjusted: Math.round(300000 * seasonalMultiplier),
                  smAdjustment: Math.round(16000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(28000 * seasonalMultiplier),
                  finalForecast: Math.round(344000 * seasonalMultiplier)
                },
              ],
            },
          ],
        },
      ],
    },
    ];
  };

  const data = generateDataForMonth(selectedMonth);

  // Generate data for all months for Time Series view
  const allMonthsData = months.map(month => generateDataForMonth(month));

  // Helper function to find a row in data by id (recursive)
  const findRowById = (dataArray, id) => {
    for (const row of dataArray) {
      if (row.id === id) return row;
      if (row.children) {
        const found = findRowById(row.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to get metric value for a row
  const getMetricValue = (row, metric) => {
    switch(metric) {
      case 'Baseline (Revenue) [Read-Only]':
        return row.baseline;
      case 'AM Adjusted (Revenue) [Editable]':
        return row.amAdjusted;
      case 'SM Adjustment [Read-Only]':
        return row.smAdjustment;
      case 'RSD Adjustment [Read-Only]':
        return row.rsdAdjustment;
      case 'Final Forecast (Revenue) [Read-Only]':
        return row.finalForecast;
      default:
        return undefined;
    }
  };

  const handleCellClick = (columnName, rowId) => {
    setLastSelectedCell(columnName);
    setSelectedCell({ columnName, rowId });
  };

  // Handle cell click in Time Series view
  const handleTimeSeriesCellClick = (rowId, monthIndex) => {
    const clickedMonth = months[monthIndex];
    setSelectedMonth(clickedMonth);
    setSelectedCell({ columnName: lastSelectedCell, rowId });
  };

  const Row = ({ row, level = 0, view = 'Specific Time' }) => {
    const hasChildren = row.children && row.children.length > 0;
    const isExpanded = expandedRows.has(row.id);
    const indent = level * 24;

    if (view === 'Time series') {
      // Time Series view - months as columns
      // Get the metric values for this row across all months
      const getCellValue = (monthIndex) => {
        if (!lastSelectedCell) return '-';
        const monthData = allMonthsData[monthIndex];
        const rowData = findRowById(monthData, row.id);
        if (!rowData) return '-';
        
        const value = getMetricValue(rowData, lastSelectedCell);
        if (value === undefined) return '-';
        
        // Format based on metric type
        if (lastSelectedCell === 'SM Adjustment [Read-Only]' || lastSelectedCell === 'RSD Adjustment [Read-Only]') {
          return value > 0 ? `+$${value.toLocaleString()}` : `-$${Math.abs(value).toLocaleString()}`;
        }
        return `$${value.toLocaleString()}`;
      };

      // Check if this cell is selected (matches the previously selected cell in Specific Time view)
      const isCellSelected = (monthIndex) => {
        // Get the month name to match with selected month
        const monthName = months[monthIndex];
        // Check if this is the same row and same month as the selection
        return selectedCell && selectedCell.rowId === row.id && selectedMonth === monthName;
      };

      return (
        <>
          <div className={`table-row ${hasChildren ? 'parent-row' : 'child-row'}`}>
            <div className="cell name-cell" style={{ paddingLeft: `${20 + indent}px` }}>
              {hasChildren && (
                <button 
                  className="expand-button"
                  onClick={() => toggleRow(row.id)}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              <span className={hasChildren ? 'parent-text' : 'child-text'}>
                {row.name}
              </span>
            </div>
            {monthNames.map((month, idx) => (
              <div 
                key={month} 
                className={`cell ${isCellSelected(idx) ? 'selected' : ''}`}
                style={{ fontWeight: row.id === 'aggregate' ? 'bold' : 'normal', cursor: 'pointer' }}
                onClick={() => handleTimeSeriesCellClick(row.id, idx)}
              >
                {getCellValue(idx)}
              </div>
            ))}
          </div>
          {hasChildren && isExpanded && row.children.map(child => (
            <Row key={child.id} row={child} level={level + 1} view={view} />
          ))}
        </>
      );
    }

    // Specific Time view - current grid
    const isSelected = (columnName) => {
      return selectedCell && selectedCell.rowId === row.id && selectedCell.columnName === columnName;
    };

    return (
      <>
        <div className={`table-row ${hasChildren ? 'parent-row' : 'child-row'}`}>
          <div className="cell name-cell" style={{ paddingLeft: `${20 + indent}px` }}>
            {hasChildren && (
              <button 
                className="expand-button"
                onClick={() => toggleRow(row.id)}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <span className={hasChildren ? 'parent-text' : 'child-text'}>
              {row.name}
            </span>
          </div>
          <div 
            className={`cell ${isSelected('Baseline (Revenue) [Read-Only]') ? 'selected' : ''}`}
            style={{ fontWeight: row.id === 'aggregate' ? 'bold' : 'normal', cursor: 'pointer' }}
            onClick={() => handleCellClick('Baseline (Revenue) [Read-Only]', row.id)}
          >
            {row.baseline !== undefined ? `$${row.baseline.toLocaleString()}` : '-'}
          </div>
          <div 
            className={`cell ${isSelected('AM Adjusted (Revenue) [Editable]') ? 'selected' : ''}`}
            style={{ fontWeight: row.id === 'aggregate' ? 'bold' : 'normal', cursor: 'pointer' }}
            onClick={() => handleCellClick('AM Adjusted (Revenue) [Editable]', row.id)}
          >
            {row.amAdjusted !== undefined ? `$${row.amAdjusted.toLocaleString()}` : '-'}
          </div>
          <div 
            className={`cell ${isSelected('SM Adjustment [Read-Only]') ? 'selected' : ''}`}
            style={{ fontWeight: row.id === 'aggregate' ? 'bold' : 'normal', cursor: 'pointer' }}
            onClick={() => handleCellClick('SM Adjustment [Read-Only]', row.id)}
          >
            {row.smAdjustment !== undefined ? row.smAdjustment > 0 ? `+$${row.smAdjustment.toLocaleString()}` : `-$${Math.abs(row.smAdjustment).toLocaleString()}` : '-'}
          </div>
          <div 
            className={`cell ${isSelected('RSD Adjustment [Read-Only]') ? 'selected' : ''}`}
            style={{ fontWeight: row.id === 'aggregate' ? 'bold' : 'normal', cursor: 'pointer' }}
            onClick={() => handleCellClick('RSD Adjustment [Read-Only]', row.id)}
          >
            {row.rsdAdjustment !== undefined ? `+$${row.rsdAdjustment.toLocaleString()}` : '-'}
          </div>
          <div 
            className={`cell ${isSelected('Final Forecast (Revenue) [Read-Only]') ? 'selected' : ''}`}
            style={{ fontWeight: row.id === 'aggregate' ? 'bold' : 'normal', cursor: 'pointer' }}
            onClick={() => handleCellClick('Final Forecast (Revenue) [Read-Only]', row.id)}
          >
            {row.finalForecast !== undefined ? `$${row.finalForecast.toLocaleString()}` : '-'}
          </div>
        </div>
        {hasChildren && isExpanded && row.children.map(child => (
          <Row key={child.id} row={child} level={level + 1} view={view} />
        ))}
      </>
    );
  };

  return (
    <div className="app-container">
      <div className="header-container">
        <div className="header-title">MagnaDrive - Michigan Powertrain Plant Forecast</div>
      </div>
      
      <div className="button-group">
        {viewOptions.map((option, index) => (
          <button
            key={option}
            className={`view-button ${selectedView === option ? 'active' : ''} ${index === 0 ? 'first' : ''} ${index === viewOptions.length - 1 ? 'last' : ''}`}
            onClick={() => setSelectedView(option)}
          >
            {option}
          </button>
        ))}
      </div>
      
      {selectedView === 'Specific Time' && (
        <div className="simple-grid">
          <div className="month-selector-header">
            <div className="cell"></div>
            <div className="cell" style={{ gridColumn: '2 / 7', display: 'flex', justifyContent: 'center' }}>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="month-selector">
                {months.map(month => <option key={month} value={month}>{month}</option>)}
              </select>
            </div>
          </div>
          
          <div className="table-header">
            <div className="cell header-cell name-header">Name</div>
            <div className="cell header-cell">Baseline (Revenue) [Read-Only]</div>
            <div className="cell header-cell">AM Adjusted (Revenue) [Editable]</div>
            <div className="cell header-cell">SM Adjustment [Read-Only]</div>
            <div className="cell header-cell">RSD Adjustment [Read-Only]</div>
            <div className="cell header-cell">Final Forecast (Revenue) [Read-Only]</div>
          </div>
          
          <div className="table-content">
            {data.map(row => (
              <Row key={row.id} row={row} view={selectedView} />
            ))}
          </div>
        </div>
      )}

      {selectedView === 'Time series' && (
        <div className="simple-grid grid-timeseries">
          <div className="month-selector-header">
            <div className="cell"></div>
            <div className="cell" style={{ gridColumn: '2 / 13', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <select 
                value={lastSelectedCell || ''} 
                onChange={(e) => setLastSelectedCell(e.target.value)}
                className="month-selector"
                style={{ fontSize: '14px', fontWeight: '600' }}
              >
                {kpiOptions.map(kpi => (
                  <option key={kpi} value={kpi}>{kpi}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="table-header">
            <div className="cell header-cell name-header">Name</div>
            {monthNames.map(month => (
              <div key={month} className="cell header-cell">{month}</div>
            ))}
          </div>
          
          <div className="table-content">
            {data.map(row => (
              <Row key={row.id} row={row} view={selectedView} />
            ))}
          </div>
        </div>
      )}

      {selectedView === 'Time Roll-up' && (
        <div className="simple-grid">
          <div className="month-selector-header">
            <div className="cell"></div>
            <div className="cell" style={{ gridColumn: '2 / 13', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#03234d' }}>
                Time Roll-up View
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useState, useRef, useEffect } from 'react';
import './index.css';

// Searchable Dropdown Component
function SearchableDropdown({ value, options, onChange, placeholder = "Search...", displayFormatter = null, style = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Get display text for current value
  const getDisplayText = () => {
    let text;
    if (typeof options[0] === 'string') {
      text = value;
    } else {
      const option = options.find(opt => opt.value === value);
      text = option ? option.label : value;
    }
    // Apply formatter if provided
    return displayFormatter ? displayFormatter(text) : text;
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const label = typeof option === 'string' ? option : option.label;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle option selection
  const handleSelect = (option) => {
    const selectedValue = typeof option === 'string' ? option : option.value;
    onChange(selectedValue);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="searchable-dropdown" ref={dropdownRef} style={style}>
      <div className="searchable-dropdown-container">
        <input
          ref={inputRef}
          type="text"
          className="searchable-dropdown-input"
          value={isOpen ? searchTerm : getDisplayText()}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
        />
        {!isOpen && (
          <svg 
            className="searchable-dropdown-icon" 
            width="12" 
            height="8" 
            viewBox="0 0 12 8" 
            fill="none"
            onClick={() => inputRef.current?.focus()}
          >
            <path d="M1 1.5L6 6.5L11 1.5" stroke="#5C5C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="searchable-dropdown-menu">
          {filteredOptions.map((option, index) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            
            return (
              <div
                key={index}
                className={`searchable-dropdown-option ${optionValue === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                {optionLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function App() {
  const [expandedRows, setExpandedRows] = useState(new Set(['aggregate', 'usa', 'michigan', 'magnadrive', 'transmission', 'chassis']));
  const [selectedMonth, setSelectedMonth] = useState('January 2025');
  const [selectedView, setSelectedView] = useState('Specific Time');
  const [lastSelectedCell, setLastSelectedCell] = useState('Baseline (Revenue) [Read-Only]'); // Track last selected cell with default
  // BB Cell: tracks the black-bordered cell with {kpi, time, hierarchy}
  const [selectedCell, setSelectedCell] = useState({ 
    kpi: 'Baseline (Revenue) [Read-Only]', 
    time: 0, 
    hierarchy: 'aggregate' 
  });
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0); // Track which month column was selected in Time Series
  const headerScrollRef = useRef(null);
  const contentScrollRef = useRef(null);
  const prevViewRef = useRef(selectedView);
  
  const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'];
  const monthNames = ['January \'25', 'February \'25', 'March \'25', 'April \'25', 'May \'25', 'June \'25', 'July \'25', 'August \'25', 'September \'25', 'October \'25', 'November \'25', 'December \'25'];
  const monthsWithFY = ['FY 25', ...months]; // Months array with FY 25 as first option
  
  const viewOptions = ['Time series', 'Time Roll-up', 'Specific Time'];
  
  // KPI options for the dropdown in Time Series view
  const kpiOptions = [
    'Baseline (Revenue) [Read-Only]',
    'AM Adjusted (Revenue) [Editable]',
    'SM Adjustment [Read-Only]',
    'RSD Adjustment [Read-Only]',
    'Final Forecast (Revenue) [Read-Only]'
  ];

  // Helper function to display KPI with emojis for Time Series view
  const getTimeSeriesKPIDisplay = (kpi) => {
    if (!kpi) return '';
    if (kpi.includes('[Read-Only]')) {
      return kpi.replace(' [Read-Only]', '') + ' 📖';
    } else if (kpi.includes('[Editable]')) {
      return kpi.replace(' [Editable]', '') + ' ✏️';
    }
    return kpi;
  };

  // Handle view switching - update BB cell's KPI or time
  useEffect(() => {
    const prevView = prevViewRef.current;
    
    // Switching from Time Series → Specific Time
    if (prevView === 'Time series' && selectedView === 'Specific Time') {
      setSelectedCell(prev => ({
        ...prev,
        kpi: lastSelectedCell
      }));
      // Handle FY 25 case (time === -1)
      setSelectedMonth(selectedCell.time === -1 ? 'FY 25' : months[selectedCell.time || 0]);
    }
    
    // Switching from Specific Time → Time Series
    if (prevView === 'Specific Time' && selectedView === 'Time series') {
      // Handle FY 25 case
      const currentMonthIndex = selectedMonth === 'FY 25' ? -1 : months.indexOf(selectedMonth);
      setSelectedCell(prev => ({
        ...prev,
        time: currentMonthIndex
      }));
    }
    
    // Switching from Time Roll-up → Specific Time
    if (prevView === 'Time Roll-up' && selectedView === 'Specific Time') {
      setSelectedCell(prev => ({
        ...prev,
        kpi: lastSelectedCell
      }));
      // Handle FY 25 case (time === -1)
      setSelectedMonth(selectedCell.time === -1 ? 'FY 25' : months[selectedCell.time || 0]);
    }
    
    // Switching from Time Roll-up → Time Series
    if (prevView === 'Time Roll-up' && selectedView === 'Time series') {
      setLastSelectedCell(selectedCell.kpi || 'Baseline (Revenue) [Read-Only]');
    }
    
    // Switching from Specific Time → Time Roll-up
    if (prevView === 'Specific Time' && selectedView === 'Time Roll-up') {
      // Handle FY 25 case
      const currentMonthIndex = selectedMonth === 'FY 25' ? -1 : months.indexOf(selectedMonth);
      setSelectedCell(prev => ({
        ...prev,
        time: currentMonthIndex
      }));
    }
    
    // Switching from Time Series → Time Roll-up
    if (prevView === 'Time series' && selectedView === 'Time Roll-up') {
      setSelectedCell(prev => ({
        ...prev,
        hierarchy: prev.hierarchy || 'aggregate'
      }));
    }
    
    prevViewRef.current = selectedView;
  }, [selectedView, months, selectedMonth, lastSelectedCell, selectedCell.time, selectedCell.kpi]);

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
    // If FY 25 is selected, calculate sum of all months
    if (month === 'FY 25') {
      // Calculate actual sum by generating each month and summing the rounded values
      const uniqueMultipliers = [1.15, 0.92, 1.05, 1.18, 0.88, 1.10, 1.20, 0.85, 1.12, 0.95, 1.08, 1.00];
      
      // Calculate sums for each metric
      const aggregateBaseline = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(5000000 * mult), 0);
      const aggregateAmAdjusted = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(5500000 * mult), 0);
      const aggregateSmAdjustment = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(200000 * mult), 0);
      const aggregateRsdAdjustment = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(280000 * mult), 0);
      const aggregateFinalForecast = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(5980000 * mult), 0);
      
      const transmissionBaseline = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(4000000 * mult), 0);
      const transmissionAmAdjusted = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(4400000 * mult), 0);
      const transmissionSmAdjustment = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(150000 * mult), 0);
      const transmissionRsdAdjustment = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(200000 * mult), 0);
      const transmissionFinalForecast = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(4750000 * mult), 0);
      
      const chassisBaseline = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(1000000 * mult), 0);
      const chassisAmAdjusted = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(1100000 * mult), 0);
      const chassisSmAdjustment = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(50000 * mult), 0);
      const chassisRsdAdjustment = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(80000 * mult), 0);
      const chassisFinalForecast = uniqueMultipliers.reduce((sum, mult) => sum + Math.round(1230000 * mult), 0);
      
      // Calculate product sums
      const productASums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(850000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(920000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(30000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(45000 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(995000 * mult), 0)
      };
      const productBSums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(820000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(900000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(40000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(38000 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(978000 * mult), 0)
      };
      const productCSums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(750000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(830000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(28000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(52000 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(910000 * mult), 0)
      };
      const productDSums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(680000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(750000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(25000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(45000 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(820000 * mult), 0)
      };
      const productESums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(500000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(580000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(15000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(20000 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(615000 * mult), 0)
      };
      const productFSums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(400000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(420000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(22000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(0 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(442000 * mult), 0)
      };
      const chassis1Sums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(380000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(420000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(18000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(22000 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(460000 * mult), 0)
      };
      const chassis2Sums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(330000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(380000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(16000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(30000 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(426000 * mult), 0)
      };
      const chassis3Sums = {
        baseline: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(290000 * mult), 0),
        amAdjusted: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(300000 * mult), 0),
        smAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(16000 * mult), 0),
        rsdAdjustment: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(28000 * mult), 0),
        finalForecast: uniqueMultipliers.reduce((sum, mult) => sum + Math.round(344000 * mult), 0)
      };
      
      return [
      {
        id: 'aggregate',
        name: 'Aggregate',
        hasChildren: true,
        baseline: aggregateBaseline,
        amAdjusted: aggregateAmAdjusted,
        smAdjustment: aggregateSmAdjustment,
        rsdAdjustment: aggregateRsdAdjustment,
        finalForecast: aggregateFinalForecast,
        children: [
          {
            id: 'magnadrive',
            name: 'MagnaDrive - Michigan Plant',
            hasChildren: true,
            baseline: aggregateBaseline,
            amAdjusted: aggregateAmAdjusted,
            smAdjustment: aggregateSmAdjustment,
            rsdAdjustment: aggregateRsdAdjustment,
            finalForecast: aggregateFinalForecast,
            children: [
              {
                id: 'transmission',
                name: 'Transmission Assemblies',
                hasChildren: true,
                baseline: transmissionBaseline,
                amAdjusted: transmissionAmAdjusted,
                smAdjustment: transmissionSmAdjustment,
                rsdAdjustment: transmissionRsdAdjustment,
                finalForecast: transmissionFinalForecast,
                children: [
                  { 
                    id: 'product-1', 
                    name: 'TRN-750-A', 
                    hasChildren: false,
                    ...productASums
                  },
                  { 
                    id: 'product-2', 
                    name: 'TRN-850-M', 
                    hasChildren: false,
                    ...productBSums
                  },
                  { 
                    id: 'product-3', 
                    name: 'TRN-850-M', 
                    hasChildren: false,
                    ...productCSums
                  },
                  { 
                    id: 'product-4', 
                    name: 'TRN-850-M', 
                    hasChildren: false,
                    ...productDSums
                  },
                  { 
                    id: 'product-5', 
                    name: 'TRN-750-A', 
                    hasChildren: false,
                    ...productESums
                  },
                  { 
                    id: 'product-6', 
                    name: 'TRN-750-A', 
                    hasChildren: false,
                    ...productFSums
                  },
                ],
              },
              {
                id: 'chassis',
                name: 'Chassis Components',
                hasChildren: true,
                baseline: chassisBaseline,
                amAdjusted: chassisAmAdjusted,
                smAdjustment: chassisSmAdjustment,
                rsdAdjustment: chassisRsdAdjustment,
                finalForecast: chassisFinalForecast,
                children: [
                  { 
                    id: 'chassis-1', 
                    name: 'Chassis Product 1', 
                    hasChildren: false,
                    ...chassis1Sums
                  },
                  { 
                    id: 'chassis-2', 
                    name: 'Chassis Product 2', 
                    hasChildren: false,
                    ...chassis2Sums
                  },
                  { 
                    id: 'chassis-3', 
                    name: 'Chassis Product 3', 
                    hasChildren: false,
                    ...chassis3Sums
                  },
                ],
              },
            ],
          },
        ],
      },
      ];
    }
    
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
    const seasonalMultiplier = monthIndex >= 0 ? uniqueMultipliers[monthIndex] : 1.0;
    
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
                  name: 'TRN-750-A', 
                  hasChildren: false,
                  baseline: Math.round(850000 * seasonalMultiplier),
                  amAdjusted: Math.round(920000 * seasonalMultiplier),
                  smAdjustment: Math.round(30000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(45000 * seasonalMultiplier),
                  finalForecast: Math.round(995000 * seasonalMultiplier)
                },
                { 
                  id: 'product-2', 
                  name: 'TRN-850-M', 
                  hasChildren: false,
                  baseline: Math.round(820000 * seasonalMultiplier),
                  amAdjusted: Math.round(900000 * seasonalMultiplier),
                  smAdjustment: Math.round(40000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(38000 * seasonalMultiplier),
                  finalForecast: Math.round(978000 * seasonalMultiplier)
                },
                { 
                  id: 'product-3', 
                  name: 'TRN-850-M', 
                  hasChildren: false,
                  baseline: Math.round(750000 * seasonalMultiplier),
                  amAdjusted: Math.round(830000 * seasonalMultiplier),
                  smAdjustment: Math.round(28000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(52000 * seasonalMultiplier),
                  finalForecast: Math.round(910000 * seasonalMultiplier)
                },
                { 
                  id: 'product-4', 
                  name: 'TRN-850-M', 
                  hasChildren: false,
                  baseline: Math.round(680000 * seasonalMultiplier),
                  amAdjusted: Math.round(750000 * seasonalMultiplier),
                  smAdjustment: Math.round(25000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(45000 * seasonalMultiplier),
                  finalForecast: Math.round(820000 * seasonalMultiplier)
                },
                { 
                  id: 'product-5', 
                  name: 'TRN-750-A', 
                  hasChildren: false,
                  baseline: Math.round(500000 * seasonalMultiplier),
                  amAdjusted: Math.round(580000 * seasonalMultiplier),
                  smAdjustment: Math.round(15000 * seasonalMultiplier),
                  rsdAdjustment: Math.round(20000 * seasonalMultiplier),
                  finalForecast: Math.round(615000 * seasonalMultiplier)
                },
                { 
                  id: 'product-6', 
                  name: 'TRN-750-A', 
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

  // Helper function to get all hierarchies (row IDs and names) from data
  const getAllHierarchies = (dataArray, hierarchies = []) => {
    dataArray.forEach(row => {
      hierarchies.push({ id: row.id, name: row.name });
      if (row.children && row.children.length > 0) {
        getAllHierarchies(row.children, hierarchies);
      }
    });
    return hierarchies;
  };

  const allHierarchies = getAllHierarchies(data);

  const handleCellClick = (columnName, rowId, monthOverride = null) => {
    // Update the BB cell with: KPI, Time, Hierarchy
    const currentMonth = monthOverride || selectedMonth;
    const monthIndex = months.indexOf(currentMonth);
    
    const bbCell = {
      kpi: columnName,           // KPI/Column name
      time: monthIndex,          // Time/Month index
      hierarchy: rowId           // Hierarchy/Row ID
    };
    
    setSelectedCell(bbCell);
    setLastSelectedCell(columnName);
    setSelectedMonth(currentMonth);
  };

  // Handle cell click in Time Series view
  const handleTimeSeriesCellClick = (rowId, monthIndex, kpiOverride = null) => {
    const clickedMonth = months[monthIndex];
    setSelectedMonth(clickedMonth);
    setSelectedMonthIndex(monthIndex);
    
    // Use kpiOverride if provided, otherwise use the current lastSelectedCell
    const kpiToUse = kpiOverride !== null ? kpiOverride : lastSelectedCell;
    
    // Update the BB cell with: KPI, Time, Hierarchy
    const bbCell = {
      kpi: kpiToUse,             // KPI/Column name
      time: monthIndex,          // Time/Month index
      hierarchy: rowId           // Hierarchy/Row ID
    };
    
    setSelectedCell(bbCell);
    if (kpiOverride !== null) {
      setLastSelectedCell(kpiOverride);
    }
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

      // Check if this cell is selected (matches the BB cell)
      const isCellSelected = (monthIndex) => {
        // Check if this cell matches the BB cell: same hierarchy (rowId) and same time (monthIndex)
        return selectedCell && selectedCell.hierarchy === row.id && selectedCell.time === monthIndex;
      };

      // Calculate FY 25 total (sum of all 12 months)
      const getFYTotal = () => {
        if (!lastSelectedCell) return '-';
        
        let total = 0;
        months.forEach((month, idx) => {
          const monthData = allMonthsData[idx];
          const rowData = findRowById(monthData, row.id);
          if (rowData) {
            const value = getMetricValue(rowData, lastSelectedCell);
            if (value !== undefined) {
              total += value;
            }
          }
        });
        
        // Format based on metric type
        if (lastSelectedCell === 'SM Adjustment [Read-Only]' || lastSelectedCell === 'RSD Adjustment [Read-Only]') {
          return total > 0 ? `+$${total.toLocaleString()}` : `-$${Math.abs(total).toLocaleString()}`;
        }
        return `$${total.toLocaleString()}`;
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
              className={`cell ${selectedCell && selectedCell.time === -1 && selectedCell.hierarchy === row.id ? 'selected' : ''}`}
              style={{ fontWeight: row.id === 'aggregate' ? 'bold' : 'normal', cursor: 'pointer' }}
              onClick={() => {
                // Just update BB cell, don't switch views
                setSelectedCell({
                  ...selectedCell,
                  time: -1,
                  hierarchy: row.id,
                  kpi: lastSelectedCell
                });
                setSelectedMonth('FY 25');
              }}
            >
              {getFYTotal()}
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
      // Check if this cell matches the BB cell: same hierarchy (rowId) and same KPI (columnName)
      return selectedCell && selectedCell.hierarchy === row.id && selectedCell.kpi === columnName;
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
              <SearchableDropdown
                value={selectedMonth}
                options={monthsWithFY}
                onChange={(newMonth) => {
                  // For FY 25, use -1 as time index, otherwise use month index
                  const monthIndex = newMonth === 'FY 25' ? -1 : months.indexOf(newMonth);
                  setSelectedMonth(newMonth);
                  
                  // Update BB cell directly if it exists
                  if (selectedCell && selectedCell.hierarchy && selectedCell.kpi) {
                    setSelectedCell({
                      ...selectedCell,
                      time: monthIndex
                    });
                  }
                }}
                placeholder="select time"
              />
            </div>
          </div>
          
          <div className="table-header">
            <div className="cell header-cell name-header">Name</div>
            <div className="cell header-cell">Baseline (Revenue) 📖</div>
            <div className="cell header-cell">AM Adjusted (Revenue) ✏️</div>
            <div className="cell header-cell">SM Adjustment 📖</div>
            <div className="cell header-cell">RSD Adjustment 📖</div>
            <div className="cell header-cell">Final Forecast (Revenue) 📖</div>
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
            <div className="timeseries-header-center">
              <SearchableDropdown
                value={lastSelectedCell || ''}
                options={kpiOptions}
                onChange={(newKPI) => {
                  setLastSelectedCell(newKPI);
                  
                  // Update BB cell directly if it exists
                  if (selectedCell && selectedCell.hierarchy && selectedCell.time !== undefined) {
                    setSelectedCell({
                      ...selectedCell,
                      kpi: newKPI
                    });
                  }
                }}
                displayFormatter={getTimeSeriesKPIDisplay}
                placeholder="select KPI"
                style={{ fontSize: '14px', fontWeight: '600' }}
              />
            </div>
          </div>
          
          <div className="table-header">
            <div className="cell header-cell name-header">Name</div>
            <div className="cell header-cell">FY 25</div>
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
            <div className="cell" style={{ gridColumn: '2 / 7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <SearchableDropdown
                value={selectedCell.hierarchy || 'aggregate'}
                options={allHierarchies.map(h => ({ value: h.id, label: h.name }))}
                onChange={(newHierarchy) => {
                  setSelectedCell({
                    ...selectedCell,
                    hierarchy: newHierarchy
                  });
                }}
                placeholder="select dimension"
                style={{ fontSize: '14px', fontWeight: '600' }}
              />
            </div>
          </div>
          
          <div className="table-header">
            <div className="cell header-cell name-header">Month</div>
            <div className="cell header-cell">Baseline (Revenue) 📖</div>
            <div className="cell header-cell">AM Adjusted (Revenue) ✏️</div>
            <div className="cell header-cell">SM Adjustment 📖</div>
            <div className="cell header-cell">RSD Adjustment 📖</div>
            <div className="cell header-cell">Final Forecast (Revenue) 📖</div>
          </div>
          
          <div className="table-content">
            {/* Aggregate row - sum of all 12 months */}
            {(() => {
              // Calculate totals across all months
              let totalBaseline = 0;
              let totalAmAdjusted = 0;
              let totalSmAdjustment = 0;
              let totalRsdAdjustment = 0;
              let totalFinalForecast = 0;
              
              months.forEach((month, idx) => {
                const monthData = allMonthsData[idx];
                const rowData = findRowById(monthData, selectedCell.hierarchy || 'aggregate');
                if (rowData) {
                  totalBaseline += rowData.baseline || 0;
                  totalAmAdjusted += rowData.amAdjusted || 0;
                  totalSmAdjustment += rowData.smAdjustment || 0;
                  totalRsdAdjustment += rowData.rsdAdjustment || 0;
                  totalFinalForecast += rowData.finalForecast || 0;
                }
              });
              
              return (
                <div className="table-row" style={{ borderBottom: '2px solid #c9c9c9' }}>
                  <div className="cell name-cell" style={{ paddingLeft: '20px' }}>
                    <span style={{ fontWeight: 'bold', color: '#03234d' }}>FY 25</span>
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === -1 && selectedCell.kpi === 'Baseline (Revenue) [Read-Only]' ? 'selected' : ''}`}
                    style={{ fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: -1,
                        kpi: 'Baseline (Revenue) [Read-Only]'
                      });
                      setLastSelectedCell('Baseline (Revenue) [Read-Only]');
                      setSelectedMonth('FY 25');
                    }}
                  >
                    ${totalBaseline.toLocaleString()}
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === -1 && selectedCell.kpi === 'AM Adjusted (Revenue) [Editable]' ? 'selected' : ''}`}
                    style={{ fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: -1,
                        kpi: 'AM Adjusted (Revenue) [Editable]'
                      });
                      setLastSelectedCell('AM Adjusted (Revenue) [Editable]');
                      setSelectedMonth('FY 25');
                    }}
                  >
                    ${totalAmAdjusted.toLocaleString()}
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === -1 && selectedCell.kpi === 'SM Adjustment [Read-Only]' ? 'selected' : ''}`}
                    style={{ fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: -1,
                        kpi: 'SM Adjustment [Read-Only]'
                      });
                      setLastSelectedCell('SM Adjustment [Read-Only]');
                      setSelectedMonth('FY 25');
                    }}
                  >
                    {totalSmAdjustment > 0 ? `+$${totalSmAdjustment.toLocaleString()}` : `-$${Math.abs(totalSmAdjustment).toLocaleString()}`}
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === -1 && selectedCell.kpi === 'RSD Adjustment [Read-Only]' ? 'selected' : ''}`}
                    style={{ fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: -1,
                        kpi: 'RSD Adjustment [Read-Only]'
                      });
                      setLastSelectedCell('RSD Adjustment [Read-Only]');
                      setSelectedMonth('FY 25');
                    }}
                  >
                    +${totalRsdAdjustment.toLocaleString()}
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === -1 && selectedCell.kpi === 'Final Forecast (Revenue) [Read-Only]' ? 'selected' : ''}`}
                    style={{ fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: -1,
                        kpi: 'Final Forecast (Revenue) [Read-Only]'
                      });
                      setLastSelectedCell('Final Forecast (Revenue) [Read-Only]');
                      setSelectedMonth('FY 25');
                    }}
                  >
                    ${totalFinalForecast.toLocaleString()}
                  </div>
                </div>
              );
            })()}
            
            {months.map((month, monthIndex) => {
              const monthData = allMonthsData[monthIndex];
              const rowData = findRowById(monthData, selectedCell.hierarchy || 'aggregate');
              
              return (
                <div key={month} className="table-row">
                  <div className="cell name-cell" style={{ paddingLeft: '20px' }}>
                    <span style={{ fontWeight: '590', color: '#03234d' }}>{monthNames[monthIndex]}</span>
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === monthIndex && selectedCell.kpi === 'Baseline (Revenue) [Read-Only]' ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: monthIndex,
                        kpi: 'Baseline (Revenue) [Read-Only]'
                      });
                      setLastSelectedCell('Baseline (Revenue) [Read-Only]');
                      setSelectedMonth(month);
                    }}
                  >
                    {rowData && rowData.baseline !== undefined ? `$${rowData.baseline.toLocaleString()}` : '-'}
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === monthIndex && selectedCell.kpi === 'AM Adjusted (Revenue) [Editable]' ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: monthIndex,
                        kpi: 'AM Adjusted (Revenue) [Editable]'
                      });
                      setLastSelectedCell('AM Adjusted (Revenue) [Editable]');
                      setSelectedMonth(month);
                    }}
                  >
                    {rowData && rowData.amAdjusted !== undefined ? `$${rowData.amAdjusted.toLocaleString()}` : '-'}
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === monthIndex && selectedCell.kpi === 'SM Adjustment [Read-Only]' ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: monthIndex,
                        kpi: 'SM Adjustment [Read-Only]'
                      });
                      setLastSelectedCell('SM Adjustment [Read-Only]');
                      setSelectedMonth(month);
                    }}
                  >
                    {rowData && rowData.smAdjustment !== undefined 
                      ? (rowData.smAdjustment > 0 ? `+$${rowData.smAdjustment.toLocaleString()}` : `-$${Math.abs(rowData.smAdjustment).toLocaleString()}`)
                      : '-'}
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === monthIndex && selectedCell.kpi === 'RSD Adjustment [Read-Only]' ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: monthIndex,
                        kpi: 'RSD Adjustment [Read-Only]'
                      });
                      setLastSelectedCell('RSD Adjustment [Read-Only]');
                      setSelectedMonth(month);
                    }}
                  >
                    {rowData && rowData.rsdAdjustment !== undefined ? `+$${rowData.rsdAdjustment.toLocaleString()}` : '-'}
                  </div>
                  
                  <div 
                    className={`cell ${selectedCell.time === monthIndex && selectedCell.kpi === 'Final Forecast (Revenue) [Read-Only]' ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedCell({
                        hierarchy: selectedCell.hierarchy || 'aggregate',
                        time: monthIndex,
                        kpi: 'Final Forecast (Revenue) [Read-Only]'
                      });
                      setLastSelectedCell('Final Forecast (Revenue) [Read-Only]');
                      setSelectedMonth(month);
                    }}
                  >
                    {rowData && rowData.finalForecast !== undefined ? `$${rowData.finalForecast.toLocaleString()}` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

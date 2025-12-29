import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDimensionLevels: Set<string>;
  onDimensionLevelsChange: (levels: Set<string>) => void;
  selectedTimeGranularities: Set<string>;
  onTimeGranularitiesChange: (granularities: Set<string>) => void;
  columnWidth: number; // Column width in pixels
  onColumnWidthChange: (width: number) => void;
  onExpandAllRows?: () => void;
  onCollapseAllRows?: () => void;
  selectedMeasureSubgroup?: string;
  onMeasureSubgroupChange?: (subgroup: string) => void;
  selectedLayout?: string;
  onLayoutChange?: (layout: string) => void;
}

const layoutOptions = [
  {
    value: 'Measures / Dimensions x Time',
    subtitle: 'Measures, Dimensions in Rows, Time in columns'
  },
  {
    value: 'Dimensions / Time x Measures',
    subtitle: 'Dimension, Time in Rows, Meaasures in columns'
  },
  {
    value: 'Time / Dimensions x Measures',
    subtitle: 'Time, Dimension in Rows, Measures in columns'
  }
];

const measureSubgroupOptions = [
  {
    value: 'Revenue and Quantity Measures'
  },
  {
    value: 'Adjustment Measures'
  }
];

interface DimensionLevel {
  id: string;
  name: string;
  hierarchy: string;
}

const dimensionLevels: DimensionLevel[] = [
  { id: 'account', name: 'Accounts', hierarchy: 'Account Hierarchy' },
  { id: 'category', name: 'Category', hierarchy: 'Product Hierarchy' },
  { id: 'product', name: 'Product', hierarchy: 'Product Hierarchy' }
];

interface TimeGranularity {
  id: string;
  name: string;
}

const timeGranularities: TimeGranularity[] = [
  { id: 'year', name: 'Years' },
  { id: 'quarter', name: 'Quarters' },
  { id: 'month', name: 'Months' }
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  selectedDimensionLevels, 
  onDimensionLevelsChange,
  selectedTimeGranularities,
  onTimeGranularitiesChange,
  columnWidth,
  onColumnWidthChange,
  onExpandAllRows,
  onCollapseAllRows,
  selectedMeasureSubgroup: propSelectedMeasureSubgroup,
  onMeasureSubgroupChange,
  selectedLayout: propSelectedLayout,
  onLayoutChange
}) => {
  const [selectedLayout, setSelectedLayout] = useState(propSelectedLayout || layoutOptions[0].value);
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const layoutDropdownRef = useRef<HTMLDivElement>(null);
  
  const [selectedMeasureSubgroup, setSelectedMeasureSubgroup] = useState(
    propSelectedMeasureSubgroup || measureSubgroupOptions[0].value
  );
  const [isMeasureSubgroupDropdownOpen, setIsMeasureSubgroupDropdownOpen] = useState(false);
  const measureSubgroupDropdownRef = useRef<HTMLDivElement>(null);
  
  // Sync internal state with props
  useEffect(() => {
    if (propSelectedMeasureSubgroup !== undefined) {
      setSelectedMeasureSubgroup(propSelectedMeasureSubgroup);
    }
  }, [propSelectedMeasureSubgroup]);

  useEffect(() => {
    if (propSelectedLayout !== undefined) {
      setSelectedLayout(propSelectedLayout);
    }
  }, [propSelectedLayout]);
  
  const [isDimensionDropdownOpen, setIsDimensionDropdownOpen] = useState(false);
  const dimensionDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isTimeGranularityDropdownOpen, setIsTimeGranularityDropdownOpen] = useState(false);
  const timeGranularityDropdownRef = useRef<HTMLDivElement>(null);
  
  // Column width slider state
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Get slider range based on selected layout
  const getSliderRange = (): { min: number; max: number } => {
    if (selectedLayout === 'Dimensions / Time x Measures' || selectedLayout === 'Time / Dimensions x Measures') {
      return { min: 50, max: 300 }; // Range for measure columns
    }
    // Default range for "Measures / Dimensions x Time" (time period columns)
    return { min: 50, max: 200 };
  };
  
  const sliderRange = getSliderRange();
  
  // Convert pixel width to slider value (1-100) based on current layout's range
  const pixelToSliderValue = (pixels: number): number => {
    const { min, max } = sliderRange;
    // Map min to 1, max to 100
    return 1 + ((pixels - min) / (max - min)) * 99;
  };
  
  // Convert slider value (1-100) to pixel width based on current layout's range
  const sliderValueToPixel = (value: number): number => {
    const { min, max } = sliderRange;
    // Map 1 to min, 100 to max
    return min + ((value - 1) / 99) * (max - min);
  };
  
  const sliderValue = Math.round(pixelToSliderValue(columnWidth));
  
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Map to 1-100 scale
      const sliderVal = Math.max(1, Math.min(100, Math.round(1 + (x / rect.width) * 99)));
      const newWidth = sliderValueToPixel(sliderVal);
      onColumnWidthChange(Math.round(newWidth));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onColumnWidthChange, sliderRange]);
  
  const handleSliderClick = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Map to 1-100 scale
    const sliderVal = Math.max(1, Math.min(100, Math.round(1 + (x / rect.width) * 99)));
    const newWidth = sliderValueToPixel(sliderVal);
    onColumnWidthChange(Math.round(newWidth));
  };

  // Reset column width to 50% of slider range for current layout
  const handleResetColumnWidth = () => {
    const defaultWidth = sliderRange.min + (sliderRange.max - sliderRange.min) * 0.5;
    onColumnWidthChange(defaultWidth);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target as Node)) {
        setIsLayoutDropdownOpen(false);
      }
      if (measureSubgroupDropdownRef.current && !measureSubgroupDropdownRef.current.contains(event.target as Node)) {
        setIsMeasureSubgroupDropdownOpen(false);
      }
      if (dimensionDropdownRef.current && !dimensionDropdownRef.current.contains(event.target as Node)) {
        setIsDimensionDropdownOpen(false);
      }
      if (timeGranularityDropdownRef.current && !timeGranularityDropdownRef.current.contains(event.target as Node)) {
        setIsTimeGranularityDropdownOpen(false);
      }
    };

    if (isLayoutDropdownOpen || isMeasureSubgroupDropdownOpen || isDimensionDropdownOpen || isTimeGranularityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLayoutDropdownOpen, isMeasureSubgroupDropdownOpen, isDimensionDropdownOpen, isTimeGranularityDropdownOpen]);

  const toggleDimensionLevel = (levelId: string) => {
    const newSet = new Set(selectedDimensionLevels);
    if (newSet.has(levelId)) {
      newSet.delete(levelId);
    } else {
      newSet.add(levelId);
    }
    onDimensionLevelsChange(newSet);
  };

  const getSelectedCount = () => {
    return selectedDimensionLevels.size;
  };

  const getTimeGranularitySelectedCount = () => {
    return selectedTimeGranularities.size;
  };

  const toggleTimeGranularity = (granularityId: string) => {
    const newSet = new Set(selectedTimeGranularities);
    if (newSet.has(granularityId)) {
      newSet.delete(granularityId);
    } else {
      newSet.add(granularityId);
    }
    onTimeGranularitiesChange(newSet);
  };

  const getHierarchyGroups = () => {
    const groups: { [key: string]: DimensionLevel[] } = {};
    dimensionLevels.forEach(level => {
      if (!groups[level.hierarchy]) {
        groups[level.hierarchy] = [];
      }
      groups[level.hierarchy].push(level);
    });
    return groups;
  };

  if (!isOpen) return null;

  return (
    <div className="settings-panel">
        {/* Panel Header */}
        <div className="settings-panel-header">
          <div className="settings-panel-title-section">
            <svg className="settings-panel-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
            <p className="settings-panel-title">Table Settings</p>
          </div>
          <div className="settings-panel-actions">
            <button className="settings-panel-close" onClick={onClose} aria-label="Close">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="settings-panel-body">
          {/* Table Layout Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <p className="settings-section-title">Measure, Dimension & Time Settings</p>
            </div>

            <div className="settings-field">
              <label className="settings-field-label">Select Layout</label>
              <div className="settings-dropdown-wrapper" ref={layoutDropdownRef}>
                <div 
                  className={`settings-dropdown-trigger ${isLayoutDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsLayoutDropdownOpen(!isLayoutDropdownOpen)}
                >
                  <span className={selectedLayout ? 'settings-dropdown-value' : 'settings-dropdown-placeholder'}>
                    {selectedLayout || 'Select Layout'}
                  </span>
                  <svg className="settings-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isLayoutDropdownOpen && (
                  <div className="settings-dropdown-list">
                    {layoutOptions.map((option, index) => (
                      <div
                        key={index}
                        className={`settings-dropdown-option ${selectedLayout === option.value ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedLayout(option.value);
                          setIsLayoutDropdownOpen(false);
                          if (onLayoutChange) {
                            onLayoutChange(option.value);
                          }
                        }}
                      >
                        <div className="settings-dropdown-option-title">{option.value}</div>
                        <div className="settings-dropdown-option-subtitle">{option.subtitle}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-field-label">Measure Subgroup</label>
              <div className="settings-dropdown-wrapper" ref={measureSubgroupDropdownRef}>
                <div 
                  className={`settings-dropdown-trigger ${isMeasureSubgroupDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsMeasureSubgroupDropdownOpen(!isMeasureSubgroupDropdownOpen)}
                >
                  <span className={selectedMeasureSubgroup ? 'settings-dropdown-value' : 'settings-dropdown-placeholder'}>
                    {selectedMeasureSubgroup || 'Select Measure Subgroup'}
                  </span>
                  <svg className="settings-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isMeasureSubgroupDropdownOpen && (
                  <div className="settings-dropdown-list">
                    {measureSubgroupOptions.map((option, index) => (
                      <div
                        key={index}
                        className={`settings-dropdown-option ${selectedMeasureSubgroup === option.value ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedMeasureSubgroup(option.value);
                          setIsMeasureSubgroupDropdownOpen(false);
                          if (onMeasureSubgroupChange) {
                            onMeasureSubgroupChange(option.value);
                          }
                        }}
                      >
                        <div className="settings-dropdown-option-title">{option.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <a href="#" className="settings-link">Reorder Measures</a>
            </div>

            <div className="settings-field settings-field-spaced">
              <label className="settings-field-label">Dimension Levels</label>
              <div className="settings-dropdown-wrapper" ref={dimensionDropdownRef}>
                <div 
                  className={`settings-dropdown-trigger ${isDimensionDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsDimensionDropdownOpen(!isDimensionDropdownOpen)}
                >
                  <span className={getSelectedCount() > 0 ? 'settings-dropdown-value' : 'settings-dropdown-placeholder'}>
                    {getSelectedCount() > 0 ? `${getSelectedCount()} Level${getSelectedCount() !== 1 ? 's' : ''} Selected` : 'Select Dimension Levels'}
                  </span>
                  <svg className="settings-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isDimensionDropdownOpen && (
                  <div className="settings-dropdown-list settings-dimension-dropdown">
                    {Object.entries(getHierarchyGroups()).map(([hierarchy, levels]) => (
                      <div key={hierarchy}>
                        <div className="settings-dropdown-header">{hierarchy}</div>
                        {levels.map((level) => {
                          const isSelected = selectedDimensionLevels.has(level.id);
                          return (
                            <div
                              key={level.id}
                              className="settings-dropdown-checkbox-option"
                              onClick={() => toggleDimensionLevel(level.id)}
                            >
                              <div className={`settings-checkbox-wrapper ${isSelected ? 'checked' : ''}`}>
                                {isSelected ? (
                                  <svg className="settings-checkbox-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : null}
                              </div>
                              <span className="settings-dropdown-checkbox-label">{level.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-field-label">Time Granularity</label>
              <div className="settings-dropdown-wrapper" ref={timeGranularityDropdownRef}>
                <div 
                  className={`settings-dropdown-trigger ${isTimeGranularityDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsTimeGranularityDropdownOpen(!isTimeGranularityDropdownOpen)}
                >
                  <span className={getTimeGranularitySelectedCount() > 0 ? 'settings-dropdown-value' : 'settings-dropdown-placeholder'}>
                    {getTimeGranularitySelectedCount() > 0 ? `${getTimeGranularitySelectedCount()} Level${getTimeGranularitySelectedCount() !== 1 ? 's' : ''} Selected` : 'Select Time Granularity'}
                  </span>
                  <svg className="settings-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isTimeGranularityDropdownOpen && (
                  <div className="settings-dropdown-list settings-dimension-dropdown">
                    {timeGranularities.map((granularity) => {
                      const isSelected = selectedTimeGranularities.has(granularity.id);
                      return (
                        <div
                          key={granularity.id}
                          className="settings-dropdown-checkbox-option"
                          onClick={() => toggleTimeGranularity(granularity.id)}
                        >
                          <div className={`settings-checkbox-wrapper ${isSelected ? 'checked' : ''}`}>
                            {isSelected ? (
                              <svg className="settings-checkbox-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : null}
                          </div>
                          <span className="settings-dropdown-checkbox-label">{granularity.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Display Settings Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <p className="settings-section-title">Display Settings</p>
            </div>

            <div className="settings-field settings-field-spacing">
              <label className="settings-field-label">Row Settings</label>
              <div className="settings-button-group">
                <button 
                  className="settings-button settings-button-left"
                  onClick={onExpandAllRows}
                  disabled={!onExpandAllRows}
                >
                  Expand All Rows
                </button>
                <button 
                  className="settings-button settings-button-right"
                  onClick={onCollapseAllRows}
                  disabled={!onCollapseAllRows}
                >
                  <span className="settings-button-text">Collapse All Rows</span>
                  <span className="settings-button-separator"></span>
                  <svg className="settings-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="settings-field settings-field-spacing">
              <label className="settings-field-label">Column Settings</label>
              <div className="settings-button-group">
                <button 
                  className="settings-button settings-button-left"
                  onClick={handleResetColumnWidth}
                >
                  Reset Column Width
                </button>
                <button className="settings-button settings-button-right">
                  <span className="settings-button-text">Reset Sort</span>
                  <span className="settings-button-separator"></span>
                  <svg className="settings-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-field-label">Column Width</label>
              <div className="settings-slider-wrapper">
                <span className="settings-slider-label">1-100</span>
                <div className="settings-slider-container" ref={sliderRef} onClick={handleSliderClick}>
                  <div className="settings-slider-track">
                    <div className="settings-slider-fill" style={{ width: `${((sliderValue - 1) / 99) * 100}%` }}></div>
                    <div 
                      className="settings-slider-thumb" 
                      style={{ left: `${((sliderValue - 1) / 99) * 100}%` }}
                      onMouseDown={handleSliderMouseDown}
                    ></div>
                  </div>
                </div>
                <span className="settings-slider-value">{sliderValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default SettingsPanel;


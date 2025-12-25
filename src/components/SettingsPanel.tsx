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
  onCollapseAllRows
}) => {
  const [selectedLayout, setSelectedLayout] = useState(layoutOptions[0].value);
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const layoutDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isDimensionDropdownOpen, setIsDimensionDropdownOpen] = useState(false);
  const dimensionDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isTimeGranularityDropdownOpen, setIsTimeGranularityDropdownOpen] = useState(false);
  const timeGranularityDropdownRef = useRef<HTMLDivElement>(null);
  
  // Column width slider state
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Convert pixel width (50-200px) to slider value (0-100)
  const pixelToSliderValue = (pixels: number): number => {
    // Map 50px to 0, 200px to 100
    return ((pixels - 50) / (200 - 50)) * 100;
  };
  
  // Convert slider value (0-100) to pixel width (50-200px)
  const sliderValueToPixel = (value: number): number => {
    // Map 0 to 50px, 100 to 200px
    return 50 + (value / 100) * (200 - 50);
  };
  
  const sliderValue = pixelToSliderValue(columnWidth);
  
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newWidth = sliderValueToPixel(percentage);
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
  }, [isDragging, onColumnWidthChange]);
  
  const handleSliderClick = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newWidth = sliderValueToPixel(percentage);
    onColumnWidthChange(Math.round(newWidth));
  };

  // Reset column width to default (100px)
  const handleResetColumnWidth = () => {
    onColumnWidthChange(100);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target as Node)) {
        setIsLayoutDropdownOpen(false);
      }
      if (dimensionDropdownRef.current && !dimensionDropdownRef.current.contains(event.target as Node)) {
        setIsDimensionDropdownOpen(false);
      }
      if (timeGranularityDropdownRef.current && !timeGranularityDropdownRef.current.contains(event.target as Node)) {
        setIsTimeGranularityDropdownOpen(false);
      }
    };

    if (isLayoutDropdownOpen || isDimensionDropdownOpen || isTimeGranularityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLayoutDropdownOpen, isDimensionDropdownOpen, isTimeGranularityDropdownOpen]);

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
            <svg className="settings-panel-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="settings-panel-title">Table Settings</p>
            <div className="settings-panel-info-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
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
              <div className="settings-input-wrapper">
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="Planning Measures"
                  readOnly
                />
                <svg className="settings-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
                <span className="settings-slider-label">0-100</span>
                <div className="settings-slider-container" ref={sliderRef} onClick={handleSliderClick}>
                  <div className="settings-slider-track">
                    <div className="settings-slider-fill" style={{ width: `${sliderValue}%` }}></div>
                    <div 
                      className="settings-slider-thumb" 
                      style={{ left: `${sliderValue}%` }}
                      onMouseDown={handleSliderMouseDown}
                    ></div>
                  </div>
                </div>
                <span className="settings-slider-value">{Math.round(sliderValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default SettingsPanel;


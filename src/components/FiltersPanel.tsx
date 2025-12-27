import React, { useState, useRef, useEffect } from 'react';
import { MeasureData } from '../types';
import ProductFilterPopover from './ProductFilterPopover';
import TimeFilterPopover from './TimeFilterPopover';
import '../styles/components/FiltersPanel.css';

interface Filter {
  id: string;
  type: 'measures' | 'account' | 'category' | 'products' | 'time';
  label: string;
  value: string;
  field?: string;
  operator?: string;
}

interface FiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMeasureSubgroup?: string;
  onMeasureSubgroupChange?: (subgroup: string) => void;
  selectedDimensionLevels?: Set<string>;
  onDimensionLevelsChange?: (levels: Set<string>) => void;
  data?: MeasureData[];
}

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

const FiltersPanel: React.FC<FiltersPanelProps> = ({ 
  isOpen, 
  onClose,
  selectedMeasureSubgroup: propSelectedMeasureSubgroup,
  onMeasureSubgroupChange,
  selectedDimensionLevels: propSelectedDimensionLevels,
  onDimensionLevelsChange,
  data = []
}) => {
  const [selectedMeasureSubgroup, setSelectedMeasureSubgroup] = useState(
    propSelectedMeasureSubgroup || measureSubgroupOptions[0].value
  );
  const [isMeasureSubgroupDropdownOpen, setIsMeasureSubgroupDropdownOpen] = useState(false);
  const measureSubgroupDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedDimensionLevels, setSelectedDimensionLevels] = useState<Set<string>>(
    propSelectedDimensionLevels || new Set(['account', 'category', 'product'])
  );
  const [isDimensionDropdownOpen, setIsDimensionDropdownOpen] = useState(false);
  const dimensionDropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal state with props
  useEffect(() => {
    if (propSelectedMeasureSubgroup !== undefined) {
      setSelectedMeasureSubgroup(propSelectedMeasureSubgroup);
    }
  }, [propSelectedMeasureSubgroup]);

  useEffect(() => {
    if (propSelectedDimensionLevels !== undefined) {
      setSelectedDimensionLevels(new Set(propSelectedDimensionLevels));
    }
  }, [propSelectedDimensionLevels]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (measureSubgroupDropdownRef.current && !measureSubgroupDropdownRef.current.contains(event.target as Node)) {
        setIsMeasureSubgroupDropdownOpen(false);
      }
      if (dimensionDropdownRef.current && !dimensionDropdownRef.current.contains(event.target as Node)) {
        setIsDimensionDropdownOpen(false);
      }
    };

    if (isMeasureSubgroupDropdownOpen || isDimensionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMeasureSubgroupDropdownOpen, isDimensionDropdownOpen]);

  const getSelectedDimensionCount = () => {
    return selectedDimensionLevels.size;
  };

  const toggleDimensionLevel = (levelId: string) => {
    const newSet = new Set(selectedDimensionLevels);
    if (newSet.has(levelId)) {
      newSet.delete(levelId);
    } else {
      newSet.add(levelId);
    }
    setSelectedDimensionLevels(newSet);
    if (onDimensionLevelsChange) {
      onDimensionLevelsChange(newSet);
    }
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

  const [filters, setFilters] = useState<Filter[]>([
    { id: '1', type: 'measures', label: 'Filter by Measures', value: '5 Measures Selected' },
    { id: '2', type: 'account', label: 'Filter by Account', value: 'Equals All' },
    { id: '3', type: 'category', label: 'Filter by Category', value: 'Equals All' },
    { id: '4', type: 'products', label: 'Filter by Products', value: 'Equals All' },
    { id: '5', type: 'time', label: 'Filter by Time', value: 'Equals Jan 26 to Dec 26' },
  ]);

  const [editingProductFilterId, setEditingProductFilterId] = useState<string | null>(null);
  const [editingTimeFilterId, setEditingTimeFilterId] = useState<string | null>(null);
  const filterCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleRemoveFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
    if (editingProductFilterId === filterId) {
      setEditingProductFilterId(null);
    }
    if (editingTimeFilterId === filterId) {
      setEditingTimeFilterId(null);
    }
  };

  const handleRemoveAll = () => {
    setFilters([]);
    setEditingProductFilterId(null);
    setEditingTimeFilterId(null);
  };

  const handleProductFilterClick = (filterId: string) => {
    setEditingProductFilterId(filterId);
    setEditingTimeFilterId(null);
  };

  // Removed unused handleTimeFilterClick - will be implemented when time filter popover is integrated

  const handleProductFilterSave = (filterId: string, field: string, operator: string, selectedValues: string[]) => {
    // Store the actual product names (comma-separated) in filter.value
    const productValue = selectedValues.length > 0 
      ? selectedValues.join(', ')
      : 'All';
    
    setFilters(filters.map(f => 
      f.id === filterId 
        ? { ...f, value: productValue, field, operator }
        : f
    ));
    
    setEditingProductFilterId(null);
  };

  const handleProductFilterCancel = () => {
    setEditingProductFilterId(null);
  };

  const handleTimeFilterSave = (filterId: string, field: string, operator: string, selectedValues: string[]) => {
    // Store the actual time period values (comma-separated) in filter.value
    const timeValue = selectedValues.length > 0 
      ? selectedValues.join(', ')
      : 'All';
    
    setFilters(filters.map(f => 
      f.id === filterId 
        ? { ...f, value: timeValue, field, operator }
        : f
    ));
    
    setEditingTimeFilterId(null);
  };

  const handleTimeFilterCancel = () => {
    setEditingTimeFilterId(null);
  };

  // Removed unused handleSave and handleCancel - save/cancel handled in individual filter popovers

  const getProductFilterValue = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return '';
    
    // If value is "Equals All" or "All", return empty string
    if (filter.value === 'Equals All' || filter.value === 'All') {
      return '';
    }
    
    // Return the value as-is (comma-separated product names)
    return filter.value;
  };

  const getProductFilterField = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    return filter?.field || 'products';
  };

  const getProductFilterOperator = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    return filter?.operator || 'equals';
  };

  const getTimeFilterValue = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return '';
    
    // If value is "Equals All" or "All", return empty string
    if (filter.value === 'Equals All' || filter.value === 'All' || filter.value.includes('Jan 26 to Dec 26')) {
      return '';
    }
    
    // Return the value as-is (comma-separated time period values)
    return filter.value;
  };

  const getTimeFilterField = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    return filter?.field || 'time';
  };

  const getTimeFilterOperator = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    return filter?.operator || 'equals';
  };

  // Removed unused getTimeFilterDisplayValue - will be implemented when time filter display is needed

  const getProductFilterDisplayValue = (filter: Filter): string => {
    if (filter.type !== 'products') return filter.value;
    
    // If value is "Equals All" or "All", show "Equals All"
    if (filter.value === 'Equals All' || filter.value === 'All') {
      return 'Equals All';
    }
    
    // Otherwise, parse the comma-separated product names and show count
    const products = filter.value.split(',').map(v => v.trim()).filter(v => v.length > 0);
    const count = products.length;
    
    return count > 0 
      ? `${count} ${count === 1 ? 'Item' : 'Items'} selected`
      : 'Equals All';
  };

  if (!isOpen) return null;

  return (
    <div className="filters-panel">
      {/* Panel Header */}
      <div className="filters-panel-header">
        <div className="filters-panel-title-section">
          <button className="filters-panel-back-button" onClick={onClose} aria-label="Back">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="filters-panel-title">Filters</p>
          <div className="filters-panel-info-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="filters-panel-actions">
          <button className="filters-panel-close" onClick={onClose} aria-label="Close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="filters-panel-body">
        {/* Top Section - Dropdowns */}
        <div className="filters-top-section">
          <div className="filters-field">
            <label className="filters-field-label">Measure Subgroup</label>
            <div className="filters-dropdown-wrapper" ref={measureSubgroupDropdownRef}>
              <div 
                className={`filters-dropdown-trigger ${isMeasureSubgroupDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsMeasureSubgroupDropdownOpen(!isMeasureSubgroupDropdownOpen)}
              >
                <span className={selectedMeasureSubgroup ? 'filters-dropdown-value' : 'filters-dropdown-placeholder'}>
                  {selectedMeasureSubgroup || 'Select Measure Subgroup'}
                </span>
                <svg className="filters-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isMeasureSubgroupDropdownOpen && (
                <div className="filters-dropdown-list">
                  {measureSubgroupOptions.map((option, index) => (
                    <div
                      key={index}
                      className={`filters-dropdown-option ${selectedMeasureSubgroup === option.value ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedMeasureSubgroup(option.value);
                        setIsMeasureSubgroupDropdownOpen(false);
                        if (onMeasureSubgroupChange) {
                          onMeasureSubgroupChange(option.value);
                        }
                      }}
                    >
                      <div className="filters-dropdown-option-title">{option.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filters-field">
            <label className="filters-field-label">Dimension Levels</label>
            <div className="filters-dropdown-wrapper" ref={dimensionDropdownRef}>
              <div 
                className={`filters-dropdown-trigger ${isDimensionDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsDimensionDropdownOpen(!isDimensionDropdownOpen)}
              >
                <span className={getSelectedDimensionCount() > 0 ? 'filters-dropdown-value' : 'filters-dropdown-placeholder'}>
                  {getSelectedDimensionCount() > 0 ? `${getSelectedDimensionCount()} Level${getSelectedDimensionCount() !== 1 ? 's' : ''} Selected` : 'Select Dimension Levels'}
                </span>
                <svg className="filters-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isDimensionDropdownOpen && (
                <div className="filters-dropdown-list filters-dimension-dropdown">
                  {Object.entries(getHierarchyGroups()).map(([hierarchy, levels]) => (
                    <div key={hierarchy}>
                      <div className="filters-dropdown-header">{hierarchy}</div>
                      {levels.map((level) => {
                        const isSelected = selectedDimensionLevels.has(level.id);
                        return (
                          <div
                            key={level.id}
                            className="filters-dropdown-checkbox-option"
                            onClick={() => toggleDimensionLevel(level.id)}
                          >
                            <div className={`filters-checkbox-wrapper ${isSelected ? 'checked' : ''}`}>
                              {isSelected ? (
                                <svg className="filters-checkbox-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : null}
                            </div>
                            <span className="filters-dropdown-checkbox-label">{level.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Cards */}
        {filters.length > 0 && (
          <div className="filters-list">
            {filters.map((filter) => {
              const isProductFilter = filter.type === 'products';
              // Removed unused isEditing variable
              
              return (
                <div 
                  key={filter.id} 
                  className="filter-card"
                  ref={(el) => {
                    if (isProductFilter) {
                      filterCardRefs.current[filter.id] = el;
                    }
                  }}
                >
                  <div 
                    className={`filter-card-content ${isProductFilter ? 'filter-card-clickable' : ''}`}
                    onClick={isProductFilter ? () => handleProductFilterClick(filter.id) : undefined}
                  >
                    <p className="filter-card-label">{filter.label}</p>
                    <p className="filter-card-value">
                      {isProductFilter ? getProductFilterDisplayValue(filter) : filter.value}
                    </p>
                  </div>
                  <button 
                    className="filter-card-remove" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFilter(filter.id);
                    }}
                    aria-label={`Remove ${filter.label}`}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Links */}
        <div className="filters-actions">
          <button className="filters-link" onClick={() => {/* TODO: Implement add filter */}}>
            Add Filter
          </button>
          {filters.length > 0 && (
            <button className="filters-link filters-link-right" onClick={handleRemoveAll}>
              Remove All
            </button>
          )}
        </div>
      </div>


      {/* Product Filter Popover */}
      {editingProductFilterId && (
        <ProductFilterPopover
          isOpen={true}
          onClose={handleProductFilterCancel}
          onSave={(field, operator, selectedValues) => handleProductFilterSave(editingProductFilterId, field, operator, selectedValues)}
          onCancel={handleProductFilterCancel}
          initialField={getProductFilterField(editingProductFilterId)}
          initialOperator={getProductFilterOperator(editingProductFilterId)}
          initialValue={getProductFilterValue(editingProductFilterId)}
          data={data}
          anchorElement={filterCardRefs.current[editingProductFilterId]}
        />
      )}

      {/* Time Filter Popover */}
      {editingTimeFilterId && (
        <TimeFilterPopover
          isOpen={true}
          onClose={handleTimeFilterCancel}
          onSave={(field, operator, selectedValues) => handleTimeFilterSave(editingTimeFilterId, field, operator, selectedValues)}
          onCancel={handleTimeFilterCancel}
          initialField={getTimeFilterField(editingTimeFilterId)}
          initialOperator={getTimeFilterOperator(editingTimeFilterId)}
          initialValue={getTimeFilterValue(editingTimeFilterId)}
          anchorElement={filterCardRefs.current[editingTimeFilterId]}
        />
      )}
    </div>
  );
};

export default FiltersPanel;


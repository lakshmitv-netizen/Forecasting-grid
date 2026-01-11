import React, { useState, useRef, useEffect } from 'react';
import { MeasureData, GridRow } from '../types';
import ProductFilterPopover from './ProductFilterPopover';
import CategoryFilterPopover from './CategoryFilterPopover';
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
  showAllPeriods?: boolean;
  onShowAllPeriodsChange?: (showAll: boolean) => void;
  startPeriod?: string;
  endPeriod?: string;
  onStartPeriodChange?: (period: string) => void;
  onEndPeriodChange?: (period: string) => void;
  onApplyFilters?: (filteredData: MeasureData[]) => void;
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
  data = [],
  showAllPeriods = true,
  onShowAllPeriodsChange,
  startPeriod = '',
  endPeriod = '',
  onStartPeriodChange,
  onEndPeriodChange,
  onApplyFilters
}) => {
  // Track original values for Cancel functionality (only for filter cards)
  const [originalFilters, setOriginalFilters] = useState<Filter[]>([
    { id: '3', type: 'category', label: 'Filter by Category', value: 'Equals All' },
    { id: '4', type: 'products', label: 'Filter by Products', value: 'Equals All' },
    { id: '5', type: 'time', label: 'Filter by Time', value: 'Equals Jan 26 to Dec 26' },
  ]);

  // Local state for filter values (not applied until Apply button is clicked)
  const [localShowAllPeriods, setLocalShowAllPeriods] = useState(showAllPeriods);
  const [localStartPeriod, setLocalStartPeriod] = useState(startPeriod);
  const [localEndPeriod, setLocalEndPeriod] = useState(endPeriod);

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

  // Track if filters have changed (dirty state)
  const [isDirty, setIsDirty] = useState(false);

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

  useEffect(() => {
    setLocalShowAllPeriods(showAllPeriods);
    setLocalStartPeriod(startPeriod);
    setLocalEndPeriod(endPeriod);
  }, [showAllPeriods, startPeriod, endPeriod]);

  // Reset dirty state when panel opens
  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
      setLocalShowAllPeriods(showAllPeriods);
      setLocalStartPeriod(startPeriod);
      setLocalEndPeriod(endPeriod);
      setOriginalFilters([...filters]);
    }
  }, [isOpen]);


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
    { id: '3', type: 'category', label: 'Filter by Category', value: 'Equals All' },
    { id: '4', type: 'products', label: 'Filter by Products', value: 'Equals All' },
    { id: '5', type: 'time', label: 'Filter by Time', value: 'Equals Jan 26 to Dec 26' },
  ]);

  // Check if filters are dirty (only for filter cards, not for measure subgroup/period selection)
  useEffect(() => {
    if (!isOpen) return;
    
    // Only check filter cards for dirty state - measure subgroup and period selection apply immediately
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(originalFilters);
    
    setIsDirty(filtersChanged);
  }, [
    isOpen,
    filters,
    originalFilters
  ]);

  const [editingProductFilterId, setEditingProductFilterId] = useState<string | null>(null);
  const [editingCategoryFilterId, setEditingCategoryFilterId] = useState<string | null>(null);
  const [editingTimeFilterId, setEditingTimeFilterId] = useState<string | null>(null);
  const filterCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Temporarily disabled - remove button is hidden
  // const handleRemoveFilter = (filterId: string) => {
  //   setFilters(filters.filter(f => f.id !== filterId));
  //   if (editingProductFilterId === filterId) {
  //     setEditingProductFilterId(null);
  //   }
  //   if (editingCategoryFilterId === filterId) {
  //     setEditingCategoryFilterId(null);
  //   }
  //   if (editingTimeFilterId === filterId) {
  //     setEditingTimeFilterId(null);
  //   }
  // };

  const handleRemoveAll = () => {
    setFilters([]);
    setEditingProductFilterId(null);
    setEditingCategoryFilterId(null);
    setEditingTimeFilterId(null);
  };

  const handleProductFilterClick = (filterId: string) => {
    setEditingProductFilterId(filterId);
    setEditingCategoryFilterId(null);
    setEditingTimeFilterId(null);
  };

  const handleCategoryFilterClick = (filterId: string) => {
    setEditingCategoryFilterId(filterId);
    setEditingProductFilterId(null);
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

  const handleCategoryFilterSave = (filterId: string, field: string, operator: string, selectedValues: string[]) => {
    // Store the actual category names (comma-separated) in filter.value
    const categoryValue = selectedValues.length > 0 
      ? selectedValues.join(', ')
      : 'All';
    
    setFilters(filters.map(f => 
      f.id === filterId 
        ? { ...f, value: categoryValue, field, operator }
        : f
    ));
    
    setEditingCategoryFilterId(null);
  };

  const handleCategoryFilterCancel = () => {
    setEditingCategoryFilterId(null);
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

  const getCategoryFilterValue = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return '';
    
    // If value is "Equals All" or "All", return empty string
    if (filter.value === 'Equals All' || filter.value === 'All') {
      return '';
    }
    
    // Return the value as-is (comma-separated category names)
    return filter.value;
  };

  const getCategoryFilterField = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    return filter?.field || 'category';
  };

  const getCategoryFilterOperator = (filterId: string): string => {
    const filter = filters.find(f => f.id === filterId);
    return filter?.operator || 'equals';
  };

  const getCategoryFilterDisplayValue = (filter: Filter): string => {
    if (filter.type !== 'category') return filter.value;
    
    // If value is "Equals All" or "All", show "Equals All"
    if (filter.value === 'Equals All' || filter.value === 'All') {
      return 'Equals All';
    }
    
    // Otherwise, parse the comma-separated category names and show count
    const categories = filter.value.split(',').map(v => v.trim()).filter(v => v.length > 0);
    const count = categories.length;
    
    return count > 0 
      ? `${count} ${count === 1 ? 'Item' : 'Items'} selected`
      : 'Equals All';
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

  // Filter data based on all active filters (AND logic applied across all criteria)
  const applyFilters = (dataToFilter: MeasureData[]): MeasureData[] => {
    // Deep clone to avoid mutating original data
    let filtered: MeasureData[] = JSON.parse(JSON.stringify(dataToFilter));

    // Get active filter values
    const categoryFilter = filters.find(f => f.type === 'category');
    const productFilter = filters.find(f => f.type === 'products');
    
    const selectedCategories = categoryFilter && categoryFilter.value !== 'Equals All' && categoryFilter.value !== 'All'
      ? categoryFilter.value.split(',').map(c => c.trim())
      : null;
    
    const selectedProducts = productFilter && productFilter.value !== 'Equals All' && productFilter.value !== 'All'
      ? productFilter.value.split(',').map(p => p.trim())
      : null;

    // Filter by dimension levels first
    filtered = filtered.map((measure: MeasureData) => {
      const filteredChildren = filterByDimensionLevels(measure.children || [], selectedDimensionLevels);
      return {
        ...measure,
        children: filteredChildren
      };
    });

    // Apply filters with AND logic - order matters for intelligent filtering
    // 1. Filter by categories (if specified)
    // This will limit which categories are shown
    if (selectedCategories) {
      filtered = filtered.map((measure: MeasureData) => {
        const filteredChildren = filterByCategories(measure.children || [], selectedCategories);
        return {
          ...measure,
          children: filteredChildren
        };
      });
    }

    // 2. Filter by products (if specified)
    // If categories are also filtered, products will automatically be limited to those categories
    // If products are selected but categories are not, show only those products (from any category)
    if (selectedProducts) {
      filtered = filtered.map((measure: MeasureData) => {
        // If categories are also filtered, products are already limited to those categories
        // Just filter to the selected products
        const filteredChildren = filterByProducts(measure.children || [], selectedProducts);
        return {
          ...measure,
          children: filteredChildren
        };
      });
    } else if (selectedCategories) {
      // If only categories are selected (no product filter), show all products from selected categories
      // This is already handled by filterByCategories which keeps all children
    }

    // Filter by time periods (if showAllPeriods is false)
    // Use prop values since they're already synced with parent
    if (!showAllPeriods && (startPeriod || endPeriod)) {
      filtered = filtered.map((measure: MeasureData) => {
        const filteredChildren = filterByTimePeriods(measure.children || [], startPeriod, endPeriod);
        return {
          ...measure,
          children: filteredChildren
        };
      });
    }

    return filtered;
  };

  // Helper function to filter by dimension levels
  const filterByDimensionLevels = (rows: GridRow[], levels: Set<string>): GridRow[] => {
    const result: GridRow[] = [];
    rows.forEach(row => {
      const shouldInclude = levels.has(row.type);
      const filteredChildren = row.children ? filterByDimensionLevels(row.children, levels) : [];
      
      if (shouldInclude) {
        result.push({
          ...row,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        });
      } else if (filteredChildren.length > 0) {
        // If this level is excluded but has children that should be included, include it but mark it differently
        result.push({
          ...row,
          children: filteredChildren
        });
      }
    });
    return result;
  };

  // Helper function to filter by products
  const filterByProducts = (rows: GridRow[], selectedProducts: string[]): GridRow[] => {
    const result: GridRow[] = [];
    rows.forEach(row => {
      if (row.type === 'product') {
        if (selectedProducts.includes(row.name)) {
          result.push(row);
        }
      } else {
        const filteredChildren = row.children ? filterByProducts(row.children, selectedProducts) : [];
        if (filteredChildren.length > 0) {
          result.push({
            ...row,
            children: filteredChildren
          });
        }
      }
    });
    return result;
  };

  // Helper function to filter by categories
  const filterByCategories = (rows: GridRow[], selectedCategories: string[]): GridRow[] => {
    const result: GridRow[] = [];
    rows.forEach(row => {
      if (row.type === 'category') {
        if (selectedCategories.includes(row.name)) {
          result.push({
            ...row,
            children: row.children // Keep all children
          });
        }
      } else {
        const filteredChildren = row.children ? filterByCategories(row.children, selectedCategories) : [];
        if (filteredChildren.length > 0) {
          result.push({
            ...row,
            children: filteredChildren
          });
        }
      }
    });
    return result;
  };

  // Helper function to filter by accounts
  const filterByAccounts = (rows: GridRow[], selectedAccounts: string[]): GridRow[] => {
    const result: GridRow[] = [];
    rows.forEach(row => {
      if (row.type === 'account') {
        if (selectedAccounts.includes(row.name)) {
          result.push({
            ...row,
            children: row.children // Keep all children
          });
        }
      } else {
        const filteredChildren = row.children ? filterByAccounts(row.children, selectedAccounts) : [];
        if (filteredChildren.length > 0) {
          result.push({
            ...row,
            children: filteredChildren
          });
        }
      }
    });
    return result;
  };

  // Helper function to filter by time periods
  const filterByTimePeriods = (rows: GridRow[], startDate: string, endDate: string): GridRow[] => {
    if (!startDate && !endDate) return rows;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Map month keys to date ranges
    const monthKeyToDate: { [key: string]: Date } = {
      'jan2026': new Date('2026-01-01'),
      'feb2026': new Date('2026-02-01'),
      'mar2026': new Date('2026-03-01'),
      'apr2026': new Date('2026-04-01'),
      'may2026': new Date('2026-05-01'),
      'jun2026': new Date('2026-06-01'),
      'jul2026': new Date('2026-07-01'),
      'aug2026': new Date('2026-08-01'),
      'sep2026': new Date('2026-09-01'),
      'oct2026': new Date('2026-10-01'),
      'nov2026': new Date('2026-11-01'),
      'dec2026': new Date('2026-12-01'),
    };

    return rows.map(row => {
      const filteredValues: GridRow['values'] = { ...row.values };
      
      // Filter values based on date range
      Object.keys(monthKeyToDate).forEach(monthKey => {
        const monthDate = monthKeyToDate[monthKey];
        if (start && monthDate < start) {
          delete (filteredValues as any)[monthKey];
        }
        if (end) {
          const monthEnd = new Date(monthDate);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          if (monthEnd > end) {
            delete (filteredValues as any)[monthKey];
          }
        }
      });

      const filteredChildren = row.children ? filterByTimePeriods(row.children, startDate, endDate) : [];
      
      return {
        ...row,
        values: filteredValues,
        children: filteredChildren.length > 0 ? filteredChildren : undefined
      };
    });
  };

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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M14.8618 1.23047H1.20022C0.738686 1.23047 0.523301 1.75355 0.800224 2.09201L6.76946 9.07662C6.95407 9.29201 7.04638 9.5997 7.04638 9.87662V14.3074C7.04638 14.5535 7.29253 14.7689 7.53869 14.7689H8.46176C8.70792 14.7689 8.89253 14.5535 8.89253 14.3074V9.87662C8.89253 9.56893 9.01561 9.29201 9.23099 9.07662L15.2618 2.09201C15.5387 1.75355 15.3233 1.23047 14.8618 1.23047V1.23047Z" fill="#0250D9"/>
            </svg>
          </button>
          <p className="filters-panel-title">Filters</p>
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
                        // Apply immediately for measure subgroup (existing functionality)
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

          {/* Show all Periods Toggle */}
          <div className="filters-field filters-field-show-periods">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="filters-field-label">Show all Periods</label>
              <button
                className={`filters-toggle ${localShowAllPeriods ? 'active' : ''}`}
                onClick={() => {
                  const newValue = !localShowAllPeriods;
                  setLocalShowAllPeriods(newValue);
                  // Apply immediately for show all periods (existing functionality)
                  if (onShowAllPeriodsChange) {
                    onShowAllPeriodsChange(newValue);
                  }
                }}
                aria-label="Toggle show all periods"
              >
                <div className="filters-toggle-track">
                  <div className="filters-toggle-thumb"></div>
                  {showAllPeriods && (
                    <svg className="filters-toggle-check" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Start and End Period Inputs */}
          {!localShowAllPeriods && (
            <>
              <div className="filters-field">
                <label className="filters-field-label">Start</label>
                <div className="filters-input-wrapper">
                  <input
                    type="date"
                    className="filters-date-input"
                    placeholder="Start"
                    value={localStartPeriod}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setLocalStartPeriod(newValue);
                      // Apply immediately for start period (existing functionality)
                      if (onStartPeriodChange) {
                        onStartPeriodChange(newValue);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="filters-field filters-field-end-period">
                <label className="filters-field-label">End</label>
                <div className="filters-input-wrapper">
                  <input
                    type="date"
                    className="filters-date-input"
                    placeholder="End"
                    value={localEndPeriod}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setLocalEndPeriod(newValue);
                      // Apply immediately for end period (existing functionality)
                      if (onEndPeriodChange) {
                        onEndPeriodChange(newValue);
                      }
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* AND Logic Explanation */}
        <div className="filters-and-logic-info">
          <svg className="filters-info-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM8 11.5C7.58579 11.5 7.25 11.1642 7.25 10.75C7.25 10.3358 7.58579 10 8 10C8.41421 10 8.75 10.3358 8.75 10.75C8.75 11.1642 8.41421 11.5 8 11.5ZM7.25 8.75V4.5C7.25 4.08579 7.58579 3.75 8 3.75C8.41421 3.75 8.75 4.08579 8.75 4.5V8.75C8.75 9.16421 8.41421 9.5 8 9.5C7.58579 9.5 7.25 9.16421 7.25 8.75Z" fill="#5867E8"/>
          </svg>
          <span className="filters-and-logic-text">All filter criteria are combined using AND logic</span>
        </div>

        {/* Cancel and Apply Buttons Header */}
        {isDirty && (
          <div className="filters-apply-actions-header">
            <button 
              className="filters-cancel-button"
              onClick={() => {
                // Revert only filter card changes (measure subgroup and period selection are already applied)
                setFilters([...originalFilters]);
                setIsDirty(false);
              }}
            >
              Cancel
            </button>
            <button 
              className="filters-apply-button"
              onClick={() => {
                // Apply filter card changes (measure subgroup and period selection are already applied)
                // Filter the data and pass it back
                if (onApplyFilters && data.length > 0) {
                  const filteredData = applyFilters(data);
                  onApplyFilters(filteredData);
                }
                
                // Update original filter values
                setOriginalFilters([...filters]);
                setIsDirty(false);
              }}
            >
              Apply
            </button>
          </div>
        )}

        {/* Filter Cards */}
        {filters.length > 0 && (
          <div className="filters-list">
            {filters.map((filter) => {
              const isProductFilter = filter.type === 'products';
              const isCategoryFilter = filter.type === 'category';
              const isClickable = isProductFilter || isCategoryFilter;
              
              return (
                <div 
                  key={filter.id} 
                  className="filter-card"
                  ref={(el) => {
                    if (isProductFilter || isCategoryFilter) {
                      filterCardRefs.current[filter.id] = el;
                    }
                  }}
                >
                  <div 
                    className={`filter-card-content ${isClickable ? 'filter-card-clickable' : ''}`}
                    onClick={isClickable ? () => {
                      if (isProductFilter) {
                        handleProductFilterClick(filter.id);
                      } else if (isCategoryFilter) {
                        handleCategoryFilterClick(filter.id);
                      }
                    } : undefined}
                  >
                    <p className="filter-card-label">{filter.label}</p>
                    <p className="filter-card-value">
                      {isProductFilter 
                        ? getProductFilterDisplayValue(filter) 
                        : isCategoryFilter
                        ? getCategoryFilterDisplayValue(filter)
                        : filter.value}
                    </p>
                  </div>
                  {/* Delete icon (non-functional) */}
                  <button 
                    className="filter-card-remove" 
                    aria-label={`Remove ${filter.label}`}
                    type="button"
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

      {/* Category Filter Popover */}
      {editingCategoryFilterId && (
        <CategoryFilterPopover
          isOpen={true}
          onClose={handleCategoryFilterCancel}
          onSave={(field, operator, selectedValues) => handleCategoryFilterSave(editingCategoryFilterId, field, operator, selectedValues)}
          onCancel={handleCategoryFilterCancel}
          initialField={getCategoryFilterField(editingCategoryFilterId)}
          initialOperator={getCategoryFilterOperator(editingCategoryFilterId)}
          initialValue={getCategoryFilterValue(editingCategoryFilterId)}
          data={data}
          anchorElement={filterCardRefs.current[editingCategoryFilterId]}
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


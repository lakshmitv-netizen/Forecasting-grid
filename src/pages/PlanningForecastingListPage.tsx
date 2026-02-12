import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages/PlanningForecastingListPage.css';

interface ForecastRecord {
  id: string;
  name: string;
  adminTemplate: string;
  startPeriod: string;
  endPeriod: string;
}

const mockRecords: ForecastRecord[] = [
  { id: 'fy26', name: 'Planning & Forecasting FY26', adminTemplate: 'KAM_MonthlyForecastUpdate_Template', startPeriod: 'Jan 1st 2026', endPeriod: 'Dec 31st 2026' },
  { id: 'fy25', name: 'Planning & Forecasting FY25', adminTemplate: 'Account_HealthMonitoring_Template', startPeriod: 'Jan 1st 2025', endPeriod: 'Dec 31st 2025' },
  { id: 'fy24', name: 'Planning & Forecasting FY24', adminTemplate: 'Product_Performance_Template', startPeriod: 'Jan 1st 2024', endPeriod: 'Dec 31st 2024' },
  { id: 'fy23', name: 'Planning & Forecasting FY23', adminTemplate: 'Regional_SalesForecast_Template', startPeriod: 'Jan 1st 2023', endPeriod: 'Dec 31st 2023' },
  { id: 'fy22', name: 'Planning & Forecasting FY22', adminTemplate: 'Quarterly_BusinessReview_Template', startPeriod: 'Jan 1st 2022', endPeriod: 'Dec 31st 2022' },
  { id: 'fy21', name: 'Planning & Forecasting FY21', adminTemplate: 'Annual_BudgetPlanning_Template', startPeriod: 'Jan 1st 2021', endPeriod: 'Dec 31st 2021' },
];

const PlanningForecastingListPage: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    planName: '',
    status: 'draft',
    fiscalYear: '',
    planTemplate: '',
    planningAccount: '',
    planningLevel: 'category',
    listView: '',
    selectDescendents: false
  });
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [valuesSearchTerm, setValuesSearchTerm] = useState<string>('');
  const [showSelectedOnly, setShowSelectedOnly] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // State for plan configuration combobox
  const [planConfigSearchTerm, setPlanConfigSearchTerm] = useState<string>('');
  const [planConfigDropdownOpen, setPlanConfigDropdownOpen] = useState<boolean>(false);
  const [planConfigDropdownPosition, setPlanConfigDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
  const planConfigComboboxRef = useRef<HTMLDivElement>(null);
  
  // State for root record
  const [rootRecordSearchTerm, setRootRecordSearchTerm] = useState<string>('');
  const [rootRecordDropdownOpen, setRootRecordDropdownOpen] = useState<boolean>(false);
  const [rootRecordDropdownPosition, setRootRecordDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
  const rootRecordComboboxRef = useRef<HTMLDivElement>(null);
  
  // Plan configuration options
  const planConfigOptions = [
    { id: 'template-1', name: 'Plan View 1', meta: 'Account Hierarchy Starting at L1 • Followed by Products Hierarchy' },
    { id: 'template-2', name: 'Plan View 2', meta: 'Account Hierarchy Starting at L3 • Followed by Products Hierarchy' },
    { id: 'plan-view-3a', name: 'Plan View 3', meta: 'Product Hierarchy Starting at L3 • Followed by Accounts Hierarchy' },
    { id: 'plan-view-3b', name: 'Plan View 4', meta: 'Product Hierarchy Starting at L3 • Followed by Products, Users, Territories Hierarchy' }
  ];
  
  // Get selected plan config for display
  const selectedPlanConfig = planConfigOptions.find(opt => opt.id === newRecord.planTemplate);
  
  // Helper function to extract level and type from plan config meta
  const getRootRecordInfo = () => {
    if (!selectedPlanConfig) return { type: '', level: '', placeholder: 'Select Root Record' };
    
    const meta = selectedPlanConfig.meta;
    // Extract type (Account Hierarchy, Product Hierarchy, etc.) and level (L1, L3, etc.)
    const accountMatch = meta.match(/Account Hierarchy Starting at (L\d+)/);
    const productMatch = meta.match(/Product Hierarchy Starting at (L\d+)/);
    
    if (accountMatch) {
      const level = accountMatch[1];
      return {
        type: 'Account',
        level: level,
        placeholder: `Select ${level} Account`,
        supportingText: `This Plan Configuration starts at Accounts at level ${level}`
      };
    } else if (productMatch) {
      const level = productMatch[1];
      return {
        type: 'Product',
        level: level,
        placeholder: `Select ${level} Product`,
        supportingText: `This Plan Configuration starts at Products at level ${level}`
      };
    }
    
    return { type: '', level: '', placeholder: 'Select Root Record', supportingText: '' };
  };
  
  const rootRecordInfo = getRootRecordInfo();
  
  // Get root record options based on plan configuration
  const getRootRecordOptions = (): string[] => {
    if (!selectedPlanConfig) return [];
    
    const meta = selectedPlanConfig.meta;
    const accountMatch = meta.match(/Account Hierarchy Starting at (L\d+)/);
    const productMatch = meta.match(/Product Hierarchy Starting at (L\d+)/);
    
    if (accountMatch) {
      const level = accountMatch[1];
      if (level === 'L1') {
        return ['Acme', 'MagnaDrive', 'Zenith Industries'];
      } else if (level === 'L3') {
        return ['Acme NYC', 'Magnadrive Michigan Power Plant', 'Zenith Ohio Plant'];
      }
    } else if (productMatch) {
      const level = productMatch[1];
      if (level === 'L3') {
        return ['TRN 750 - A', 'TRN 750 - B', 'TRN 750 - C', 'TRN 850 - A', 'TRN 650 - A'];
      }
    }
    
    return [];
  };
  
  const rootRecordOptions = getRootRecordOptions();
  
  // Filter root record options based on search
  const filteredRootRecordOptions = rootRecordSearchTerm.trim() === ''
    ? rootRecordOptions
    : rootRecordOptions.filter(option =>
        option.toLowerCase().includes(rootRecordSearchTerm.toLowerCase())
      );
  
  // Update dropdown position when it opens
  useEffect(() => {
    if (planConfigDropdownOpen && planConfigComboboxRef.current) {
      const rect = planConfigComboboxRef.current.getBoundingClientRect();
      setPlanConfigDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    } else {
      setPlanConfigDropdownPosition(null);
    }
  }, [planConfigDropdownOpen]);
  
  // Update root record dropdown position when it opens
  useEffect(() => {
    if (rootRecordDropdownOpen && rootRecordComboboxRef.current) {
      const rect = rootRecordComboboxRef.current.getBoundingClientRect();
      setRootRecordDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    } else {
      setRootRecordDropdownPosition(null);
    }
  }, [rootRecordDropdownOpen]);
  
  // Update search term when plan template changes externally
  useEffect(() => {
    if (selectedPlanConfig && planConfigSearchTerm !== selectedPlanConfig.name) {
      setPlanConfigSearchTerm(selectedPlanConfig.name);
    } else if (!newRecord.planTemplate && planConfigSearchTerm) {
      setPlanConfigSearchTerm('');
    }
    // Clear root record when plan config changes
    if (newRecord.planTemplate) {
      setRootRecordSearchTerm('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRecord.planTemplate]);
  
  // Filter plan config options based on search - show all if search is empty
  const filteredPlanConfigOptions = planConfigSearchTerm.trim() === '' 
    ? planConfigOptions 
    : planConfigOptions.filter(option => 
        option.name.toLowerCase().includes(planConfigSearchTerm.toLowerCase()) ||
        option.meta.toLowerCase().includes(planConfigSearchTerm.toLowerCase())
      );
  
  // State for account combobox
  const [accountLevel, setAccountLevel] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [levelDropdownOpen, setLevelDropdownOpen] = useState<boolean>(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState<boolean>(false);
  const accountComboboxRef = useRef<HTMLDivElement>(null);
  
  // Get account options based on selected level
  const getAccountOptionsByLevel = (level: string): string[] => {
    switch (level) {
      case 'Level 0':
        return ['Acme Industries', 'Zenith Industries', 'Magnadrive Industries'];
      case 'Level 1':
        return ['Magnadrive North America', 'Magnadrive South America', 'Acme North America', 'Acme South America', 'Zenith North America', 'Zenith South America'];
      case 'Level 2':
        return ['Magnadrive Michigan Plant', 'Magnadrive Ohio Plant'];
      default:
        return [];
    }
  };
  
  // Handle click outside for account combobox
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (accountComboboxRef.current && !accountComboboxRef.current.contains(target)) {
        setLevelDropdownOpen(false);
        setAccountDropdownOpen(false);
      }
      
      // Check if click is outside plan config combobox and not on the portal dropdown
      if (planConfigDropdownOpen && planConfigComboboxRef.current) {
        const isClickOnCombobox = planConfigComboboxRef.current.contains(target);
        const isClickOnDropdown = (target as Element).closest('.slds-dropdown.slds-dropdown_fluid');
        if (!isClickOnCombobox && !isClickOnDropdown) {
          setPlanConfigDropdownOpen(false);
          setPlanConfigDropdownPosition(null);
        }
      }
      
      // Check if click is outside root record combobox and not on the portal dropdown
      if (rootRecordDropdownOpen && rootRecordComboboxRef.current) {
        const isClickOnCombobox = rootRecordComboboxRef.current.contains(target);
        const isClickOnDropdown = (target as Element).closest('.slds-dropdown.slds-dropdown_fluid');
        if (!isClickOnCombobox && !isClickOnDropdown) {
          setRootRecordDropdownOpen(false);
          setRootRecordDropdownPosition(null);
        }
      }
    };
    
    if (levelDropdownOpen || accountDropdownOpen || planConfigDropdownOpen || rootRecordDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [levelDropdownOpen, accountDropdownOpen, planConfigDropdownOpen, rootRecordDropdownOpen]);
  
  // Clear account name when level changes (but not on initial mount)
  const prevAccountLevelRef = useRef<string>('');
  useEffect(() => {
    if (prevAccountLevelRef.current !== accountLevel && prevAccountLevelRef.current !== '') {
      setAccountName('');
    }
    prevAccountLevelRef.current = accountLevel;
  }, [accountLevel]);
  
  // Mock data for the values table based on product level
  const getMockValues = (level: string) => {
    switch (level) {
      case 'category':
        return [
          { id: 'transmission-assembly', name: 'Transmission Assembly' },
          { id: 'chassis-components', name: 'Chassis Components' },
          { id: 'engine-components', name: 'Engine Components' },
          { id: 'electrical-systems', name: 'Electrical Systems' },
          { id: 'hydraulic-systems', name: 'Hydraulic Systems' },
          { id: 'brake-systems', name: 'Brake Systems' },
          { id: 'suspension-systems', name: 'Suspension Systems' }
        ];
      case 'brand':
        return [
          { id: 'trn-750-series', name: 'TRN 750 Series' },
          { id: 'trn-850-series', name: 'TRN 850 Series' },
          { id: 'trn-650-series', name: 'TRN 650 Series' },
          { id: 'chassis-heavy-duty', name: 'Heavy-Duty Chassis' },
          { id: 'chassis-standard', name: 'Standard Chassis' },
          { id: 'chassis-lightweight', name: 'Lightweight Chassis' },
          { id: 'engine-v8', name: 'V8 Engine Line' },
          { id: 'engine-v6', name: 'V6 Engine Line' }
        ];
      case 'product':
        return [
          { id: 'trn-750-a', name: 'TRN 750 - A' },
          { id: 'trn-750-b', name: 'TRN 750 - B' },
          { id: 'trn-750-c', name: 'TRN 750 - C' },
          { id: 'trn-750-d', name: 'TRN 750 - D' },
          { id: 'trn-750-e', name: 'TRN 750 - E' },
          { id: 'chassis-product-1', name: 'Chassis Product 1' },
          { id: 'chassis-product-2', name: 'Chassis Product 2' },
          { id: 'engine-block-assembly', name: 'Engine Block Assembly' },
          { id: 'cylinder-head-pro', name: 'Cylinder Head Pro' },
          { id: 'piston-assembly-set', name: 'Piston Assembly Set' }
        ];
      default:
        return [];
    }
  };

  const mockValues = getMockValues(newRecord.planningLevel);
  
  // Filter values based on search term and showSelectedOnly toggle
  const filteredValues = mockValues.filter(value => {
    const matchesSearch = value.name.toLowerCase().includes(valuesSearchTerm.toLowerCase());
    if (showSelectedOnly) {
      return matchesSearch && selectedValues.has(value.id);
    }
    return matchesSearch;
  });


  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(mockRecords.map(r => r.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === mockRecords.length);
  };

  return (
    <div className="app">
      <Header />
      <div className="main-content list-page-content">
        <div className="list-page-container">
          {/* Page Header */}
          <div className="list-page-header">
            <div className="list-page-header-left">
              <div className="list-page-title-row">
                <div className="list-page-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z"/>
                  </svg>
                </div>
                <h1 className="list-page-title">Recently Viewed</h1>
                <svg className="list-page-title-chevron" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5H7z"/>
                </svg>
                <button className="list-page-pin-button" title="Pin this list view">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                  </svg>
                </button>
              </div>
              <p className="list-page-subtitle">
                {mockRecords.length} items • Sorted by Name • Updated a few seconds ago
              </p>
            </div>
            <div className="list-page-header-right">
              <button className="list-page-new-btn" onClick={() => {
                setIsModalOpen(true);
                setSelectedValues(new Set());
              }}>New</button>
            </div>
          </div>

          {/* Table */}
          <div className="list-page-table-container">
            <table className="list-page-table">
              <thead>
                <tr>
                  <th className="list-page-th-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="list-page-checkbox"
                    />
                  </th>
                  <th className="list-page-th-name">
                    <span>Name</span>
                    <svg className="list-page-sort-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5H7z"/>
                    </svg>
                  </th>
                  <th className="list-page-th">
                    <span>Plan Configuration</span>
                    <svg className="list-page-sort-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5H7z"/>
                    </svg>
                  </th>
                  <th className="list-page-th">
                    <span>Start Period</span>
                    <svg className="list-page-sort-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5H7z"/>
                    </svg>
                  </th>
                  <th className="list-page-th">
                    <span>End Period</span>
                    <svg className="list-page-sort-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5H7z"/>
                    </svg>
                  </th>
                  <th className="list-page-th-actions"></th>
                </tr>
              </thead>
              <tbody>
                {mockRecords.map((record) => (
                  <tr key={record.id} className="list-page-row">
                    <td className="list-page-td-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedRows.has(record.id)}
                        onChange={() => handleSelectRow(record.id)}
                        className="list-page-checkbox"
                      />
                    </td>
                    <td className="list-page-td-name">
                      <Link 
                        to={record.id === 'fy26' ? '/planning-forecasting' : '#'}
                        className="list-page-name-link"
                      >
                        {record.name}
                      </Link>
                    </td>
                    <td className="list-page-td">
                      <a href="#" className="list-page-link">{record.adminTemplate}</a>
                    </td>
                    <td className="list-page-td">{record.startPeriod}</td>
                    <td className="list-page-td">{record.endPeriod}</td>
                    <td className="list-page-td-actions">
                      <button className="list-page-row-action-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 10l5 5 5-5H7z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Record Modal */}
      {isModalOpen && createPortal(
        <div className="list-page-modal-overlay" onClick={() => {
          setIsModalOpen(false);
          setSelectedValues(new Set());
        }}>
          <div className={`list-page-modal ${newRecord.planTemplate ? 'list-page-modal-expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="list-page-modal-header">
              <h2 className="list-page-modal-title">Create New Plan</h2>
            </div>
            <div className="list-page-modal-body">
              {/* BASIC DETAILS Section */}
              <div className="list-page-modal-section">
                <div className="list-page-modal-row">
                  <div className="list-page-modal-field">
                    <label className="list-page-modal-label">Plan Name:</label>
                    <input 
                      type="text" 
                      className="list-page-modal-input"
                      value={newRecord.planName}
                      onChange={(e) => setNewRecord({...newRecord, planName: e.target.value})}
                      placeholder="Enter Plan Name"
                    />
                  </div>
                  <div className="list-page-modal-field">
                    <label className="list-page-modal-label">Plan Status:</label>
                    <select 
                      className="list-page-modal-select"
                      value={newRecord.status}
                      onChange={(e) => setNewRecord({...newRecord, status: e.target.value})}
                      style={!newRecord.status ? { color: '#999' } : {}}
                    >
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
                <div className="list-page-modal-row">
                  <div className="list-page-modal-field list-page-modal-field-full">
                    <label className="list-page-modal-label">Fiscal Year:</label>
                    <select 
                      className="list-page-modal-select"
                      value={newRecord.fiscalYear}
                      onChange={(e) => setNewRecord({...newRecord, fiscalYear: e.target.value})}
                      style={!newRecord.fiscalYear ? { color: '#999' } : {}}
                    >
                      <option value="">Select Fiscal Year</option>
                      <option value="2026">2026 (Jan - Dec)</option>
                      <option value="2025">2025 (Jan - Dec)</option>
                      <option value="2024">2024 (Jan - Dec)</option>
                      <option value="2023">2023 (Jan - Dec)</option>
                      <option value="2022">2022 (Jan - Dec)</option>
                      <option value="2021">2021 (Jan - Dec)</option>
                    </select>
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#666',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        i
                      </div>
                      <span style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                        Default time granularity shown will be in months
                      </span>
                    </div>
                  </div>
                </div>
                <div className="list-page-modal-row">
                  <div className="list-page-modal-field list-page-modal-field-full">
                    <label className="list-page-modal-label">Plan Configuration:</label>
                    <div ref={planConfigComboboxRef} style={{ position: 'relative' }}>
                      <div className="slds-combobox">
                        <div className="slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right" style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className="slds-input slds-combobox__input"
                            value={planConfigDropdownOpen ? planConfigSearchTerm : (selectedPlanConfig ? selectedPlanConfig.name : planConfigSearchTerm)}
                            placeholder="Select Plan Configuration"
                            onChange={(e) => {
                              setPlanConfigSearchTerm(e.target.value);
                              setPlanConfigDropdownOpen(true);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlanConfigDropdownOpen(true);
                              // Clear search term when clicking to show all options
                              if (selectedPlanConfig && planConfigSearchTerm === selectedPlanConfig.name) {
                                setPlanConfigSearchTerm('');
                              } else if (!planConfigSearchTerm) {
                                setPlanConfigSearchTerm('');
                              }
                            }}
                            onFocus={(e) => {
                              e.stopPropagation();
                              setPlanConfigDropdownOpen(true);
                              // Clear search term when focusing to show all options
                              if (selectedPlanConfig && planConfigSearchTerm === selectedPlanConfig.name) {
                                setPlanConfigSearchTerm('');
                              } else if (!planConfigSearchTerm) {
                                setPlanConfigSearchTerm('');
                              }
                            }}
                            style={{
                              height: '40px',
                              padding: '0 36px 0 12px',
                              border: '1px solid #c9c9c9',
                              borderRadius: '0.25rem',
                              fontSize: '14px',
                              color: '#181818',
                              backgroundColor: 'white',
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          />
                          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5.5 9.5C7.70914 9.5 9.5 7.70914 9.5 5.5C9.5 3.29086 7.70914 1.5 5.5 1.5C3.29086 1.5 1.5 3.29086 1.5 5.5C1.5 7.70914 3.29086 9.5 5.5 9.5Z" stroke="#666" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8.5 8.5L10.5 10.5" stroke="#666" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          {planConfigDropdownOpen && planConfigDropdownPosition && createPortal(
                            <div 
                              className="slds-dropdown slds-dropdown_fluid" 
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'fixed',
                                top: `${planConfigDropdownPosition.top}px`,
                                left: `${planConfigDropdownPosition.left}px`,
                                width: `${planConfigDropdownPosition.width}px`,
                                zIndex: 99999,
                                backgroundColor: '#ffffff',
                                border: '1px solid #c9c9c9',
                                borderRadius: '0.25rem',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.12)',
                                padding: '0.25rem 0',
                                maxHeight: '20rem',
                                overflowY: 'auto'
                              }}>
                              <ul className="slds-listbox slds-listbox_vertical" role="listbox">
                                {filteredPlanConfigOptions.length > 0 ? (
                                  filteredPlanConfigOptions.map((option) => (
                                    <li key={option.id} role="presentation" className="slds-listbox__item">
                                      <div
                                        className={`slds-media slds-listbox__option slds-listbox__option_plain slds-media_small ${newRecord.planTemplate === option.id ? 'slds-is-selected' : ''}`}
                                        role="option"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          setNewRecord({...newRecord, planTemplate: option.id});
                                          setPlanConfigSearchTerm(option.name);
                                          setPlanConfigDropdownOpen(false);
                                          setPlanConfigDropdownPosition(null);
                                        }}
                                        style={{
                                          padding: '0.75rem',
                                          cursor: 'pointer',
                                          backgroundColor: newRecord.planTemplate === option.id ? '#f3f2f2' : '#ffffff',
                                          transition: 'background-color 0.1s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (newRecord.planTemplate !== option.id) {
                                            e.currentTarget.style.backgroundColor = '#e3f2fd';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (newRecord.planTemplate !== option.id) {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                          }
                                        }}
                                      >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#181818', marginBottom: '4px' }}>
                                            {option.name}
                                          </div>
                                          <div style={{ fontSize: '14px', fontWeight: 400, color: '#666', lineHeight: '1.5' }}>
                                            {option.meta}
                                          </div>
                                        </div>
                                      </div>
                                    </li>
                                  ))
                                ) : (
                                  <li role="presentation" className="slds-listbox__item">
                                    <div style={{ padding: '0.75rem', color: '#666', fontSize: '14px' }}>
                                      No results found
                                    </div>
                                  </li>
                                )}
                              </ul>
                            </div>,
                            document.body
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ROOT RECORD Field */}
                {newRecord.planTemplate && (
                  <div className="list-page-modal-row">
                    <div className="list-page-modal-field list-page-modal-field-full">
                      <label className="list-page-modal-label">Root Record:</label>
                      <div ref={rootRecordComboboxRef} style={{ position: 'relative' }}>
                        <div className="slds-combobox">
                          <div className="slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right" style={{ position: 'relative' }}>
                            <input
                              type="text"
                              className="slds-input slds-combobox__input"
                              value={rootRecordSearchTerm}
                              placeholder={rootRecordInfo.placeholder}
                              onChange={(e) => {
                                setRootRecordSearchTerm(e.target.value);
                                setRootRecordDropdownOpen(true);
                              }}
                              onFocus={() => setRootRecordDropdownOpen(true)}
                              disabled={!newRecord.planTemplate}
                              style={{
                                height: '40px',
                                padding: '0 36px 0 12px',
                                border: '1px solid #c9c9c9',
                                borderRadius: '0.25rem',
                                fontSize: '14px',
                                color: newRecord.planTemplate ? '#181818' : '#999',
                                backgroundColor: newRecord.planTemplate ? 'white' : '#f3f2f2',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                width: '100%',
                                boxSizing: 'border-box',
                                cursor: newRecord.planTemplate ? 'text' : 'not-allowed'
                              }}
                            />
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.5 9.5C7.70914 9.5 9.5 7.70914 9.5 5.5C9.5 3.29086 7.70914 1.5 5.5 1.5C3.29086 1.5 1.5 3.29086 1.5 5.5C1.5 7.70914 3.29086 9.5 5.5 9.5Z" stroke="#666" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8.5 8.5L10.5 10.5" stroke="#666" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            {rootRecordDropdownOpen && newRecord.planTemplate && rootRecordDropdownPosition && createPortal(
                              <div 
                                className="slds-dropdown slds-dropdown_fluid" 
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'fixed',
                                  top: `${rootRecordDropdownPosition.top}px`,
                                  left: `${rootRecordDropdownPosition.left}px`,
                                  width: `${rootRecordDropdownPosition.width}px`,
                                  zIndex: 99999,
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #c9c9c9',
                                  borderRadius: '0.25rem',
                                  boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.12)',
                                  padding: '0.25rem 0',
                                  maxHeight: '15rem',
                                  overflowY: 'auto'
                                }}>
                                <ul className="slds-listbox slds-listbox_vertical" role="listbox">
                                  {filteredRootRecordOptions.length > 0 ? (
                                    filteredRootRecordOptions.map((option) => (
                                      <li key={option} role="presentation" className="slds-listbox__item">
                                        <div
                                          className={`slds-media slds-listbox__option slds-listbox__option_plain slds-media_small ${rootRecordSearchTerm === option ? 'slds-is-selected' : ''}`}
                                          role="option"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setRootRecordSearchTerm(option);
                                            setRootRecordDropdownOpen(false);
                                            setRootRecordDropdownPosition(null);
                                          }}
                                          style={{
                                            padding: '0.5rem 0.75rem',
                                            cursor: 'pointer',
                                            backgroundColor: rootRecordSearchTerm === option ? '#f3f2f2' : '#ffffff',
                                            transition: 'background-color 0.1s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            if (rootRecordSearchTerm !== option) {
                                              e.currentTarget.style.backgroundColor = '#e3f2fd';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (rootRecordSearchTerm !== option) {
                                              e.currentTarget.style.backgroundColor = '#ffffff';
                                            }
                                          }}
                                        >
                                          <span className="slds-media__body">
                                            <span className="slds-listbox__option-text">{option}</span>
                                          </span>
                                        </div>
                                      </li>
                                    ))
                                  ) : (
                                    <li role="presentation" className="slds-listbox__item">
                                      <div style={{ padding: '0.75rem', color: '#666', fontSize: '14px' }}>
                                        {newRecord.planTemplate ? 'No options available' : 'Select a Plan Configuration first'}
                                      </div>
                                    </li>
                                  )}
                                </ul>
                              </div>,
                              document.body
                            )}
                          </div>
                        </div>
                      </div>
                      {rootRecordInfo.supportingText && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#666',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            i
                          </div>
                          <span style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                            {rootRecordInfo.supportingText}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="list-page-modal-footer">
              <button className="list-page-modal-cancel" onClick={() => {
                setIsModalOpen(false);
                setSelectedValues(new Set());
              }}>
                Cancel
              </button>
              <button className="list-page-modal-create" onClick={() => {
                setIsModalOpen(false);
                setSelectedValues(new Set());
              }}>
                Create Plan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PlanningForecastingListPage;


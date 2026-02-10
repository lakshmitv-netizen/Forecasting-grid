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
    timeGranularity: 'months',
    offsetUnit: 'months',
    startDate: '',
    endDate: '',
    planTemplate: '',
    planningAccount: '',
    planningLevel: 'category',
    listView: '',
    selectDescendents: false
  });
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [valuesSearchTerm, setValuesSearchTerm] = useState<string>('');
  const [showSelectedOnly, setShowSelectedOnly] = useState<boolean>(false);
  
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
      if (accountComboboxRef.current && !accountComboboxRef.current.contains(event.target as Node)) {
        setLevelDropdownOpen(false);
        setAccountDropdownOpen(false);
      }
    };
    
    if (levelDropdownOpen || accountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [levelDropdownOpen, accountDropdownOpen]);
  
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
                    <span>Admin Template</span>
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
              <button className="list-page-modal-close" onClick={() => {
                setIsModalOpen(false);
                setSelectedValues(new Set());
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <h2 className="list-page-modal-title">Create New Plan</h2>
            </div>
            <div className="list-page-modal-body">
              {/* BASIC DETAILS Section */}
              <div className="list-page-modal-section">
                <h3 className="list-page-modal-section-title">Basic Details</h3>
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
                </div>
                <div className="list-page-modal-row">
                  <div className="list-page-modal-field list-page-modal-field-full">
                    <label className="list-page-modal-label">Time Granularity:</label>
                    <select 
                      className="list-page-modal-select"
                      value={newRecord.offsetUnit}
                      onChange={(e) => setNewRecord({...newRecord, offsetUnit: e.target.value})}
                    >
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="quarters">Quarters</option>
                    </select>
                  </div>
                </div>
                <div className="list-page-modal-row">
                  <div className="list-page-modal-field">
                    <label className="list-page-modal-label">Offset:</label>
                    <input 
                      type="number"
                      className="list-page-modal-input"
                      value={newRecord.startDate}
                      onChange={(e) => setNewRecord({...newRecord, startDate: e.target.value})}
                      placeholder="Enter Offset"
                      min="0"
                    />
                  </div>
                  <div className="list-page-modal-field">
                    <label className="list-page-modal-label">Display Duration:</label>
                    <input 
                      type="number"
                      className="list-page-modal-input"
                      value={newRecord.endDate}
                      onChange={(e) => setNewRecord({...newRecord, endDate: e.target.value})}
                      placeholder="Enter Display Duration"
                      min="0"
                    />
                  </div>
                </div>
                <div className="list-page-modal-row">
                  <div className="list-page-modal-field list-page-modal-field-full">
                      <label className="list-page-modal-label">Select Admin Template:</label>
                    <select 
                      className="list-page-modal-select"
                      value={newRecord.planTemplate}
                      onChange={(e) => setNewRecord({...newRecord, planTemplate: e.target.value})}
                    >
                      <option value="">Select Plan Template</option>
                      <option value="template-1">Template 1</option>
                      <option value="template-2">Template 2</option>
                      <option value="template-3">Template 3</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ACCOUNT SCOPE Section - Progressive Disclosure */}
              {newRecord.planTemplate && (
                <div className="list-page-modal-section">
                  <h3 className="list-page-modal-section-title">Account Scope</h3>
                  <div className="list-page-modal-row">
                    <div className="list-page-modal-field list-page-modal-field-full">
                      <label className="list-page-modal-label">
                        Select Account:
                        <span className="list-page-modal-tooltip-wrapper">
                          <span className="list-page-modal-tooltip-icon">i</span>
                          <span className="list-page-modal-tooltip">
                            All account nodes marked as "Planning" under the selected account will be displayed on the grid.
                          </span>
                        </span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <div ref={accountComboboxRef} style={{ position: 'relative', display: 'flex', flex: '0 1 auto', minWidth: '300px' }}>
                          <div className="slds-combobox-group" style={{ display: 'flex', width: '100%', alignItems: 'stretch' }}>
                            {/* First combobox - Level */}
                            <div className="slds-combobox" style={{ flex: '0 0 150px', position: 'relative' }}>
                              <div className="slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right" style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  className="slds-input slds-combobox__input"
                                  value={accountLevel}
                                  placeholder="Select Level"
                                  readOnly
                                  onClick={() => {
                                    setLevelDropdownOpen(!levelDropdownOpen);
                                    setAccountDropdownOpen(false);
                                  }}
                                  style={{
                                    height: '40px',
                                    padding: '0 36px 0 12px',
                                    border: '1px solid #c9c9c9',
                                    borderTopLeftRadius: '0.25rem',
                                    borderBottomLeftRadius: '0.25rem',
                                    borderRight: '2px solid #c9c9c9',
                                    fontSize: '14px',
                                    color: '#181818',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                />
                                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                {levelDropdownOpen && (
                                  <div className="slds-dropdown slds-dropdown_fluid" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',
                                    width: '150px',
                                    zIndex: 10000,
                                    marginTop: '0.125rem',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #c9c9c9',
                                    borderRadius: '0.25rem',
                                    boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.12)',
                                    padding: '0.25rem 0',
                                    maxHeight: '15rem',
                                    overflowY: 'auto'
                                  }}>
                                    <ul className="slds-listbox slds-listbox_vertical" role="listbox">
                                      {['Level 0', 'Level 1', 'Level 2'].map((level) => (
                                        <li key={level} role="presentation" className="slds-listbox__item">
                                          <div
                                            className={`slds-media slds-listbox__option slds-listbox__option_plain slds-media_small ${accountLevel === level ? 'slds-is-selected' : ''}`}
                                            role="option"
                                            onClick={() => {
                                              setAccountLevel(level);
                                              setLevelDropdownOpen(false);
                                              setAccountName(''); // Clear account name when level changes
                                            }}
                                            style={{
                                              padding: '0.5rem 0.75rem',
                                              cursor: 'pointer',
                                              backgroundColor: accountLevel === level ? '#f3f2f2' : '#ffffff',
                                              transition: 'background-color 0.1s ease'
                                            }}
                                          >
                                            <span className="slds-media__body">
                                              <span className="slds-listbox__option-text">{level}</span>
                                            </span>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Second combobox - Account Name */}
                            <div className="slds-combobox" style={{ flex: '1', position: 'relative' }}>
                              <div className="slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right" style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  className="slds-input slds-combobox__input"
                                  value={accountName}
                                  placeholder={accountLevel ? "Select Account" : "Select Level First"}
                                  readOnly
                                  disabled={!accountLevel}
                                  onClick={() => {
                                    if (accountLevel) {
                                      setAccountDropdownOpen(!accountDropdownOpen);
                                      setLevelDropdownOpen(false);
                                    }
                                  }}
                                  style={{
                                    height: '40px',
                                    padding: '0 36px 0 12px',
                                    border: '1px solid #c9c9c9',
                                    borderTopRightRadius: '0.25rem',
                                    borderBottomRightRadius: '0.25rem',
                                    borderLeft: 'none',
                                    fontSize: '14px',
                                    color: accountLevel ? '#181818' : '#999',
                                    backgroundColor: accountLevel ? 'white' : '#f3f2f2',
                                    cursor: accountLevel ? 'pointer' : 'not-allowed',
                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                />
                                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                {accountDropdownOpen && accountLevel && (
                                  <div className="slds-dropdown slds-dropdown_fluid" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: '0',
                                    left: '0',
                                    zIndex: 10000,
                                    marginTop: '0.125rem',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #c9c9c9',
                                    borderRadius: '0.25rem',
                                    boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.12)',
                                    padding: '0.25rem 0',
                                    maxHeight: '15rem',
                                    overflowY: 'auto'
                                  }}>
                                    <ul className="slds-listbox slds-listbox_vertical" role="listbox">
                                      {getAccountOptionsByLevel(accountLevel).map((account) => (
                                        <li key={account} role="presentation" className="slds-listbox__item">
                                          <div
                                            className={`slds-media slds-listbox__option slds-listbox__option_plain slds-media_small ${accountName === account ? 'slds-is-selected' : ''}`}
                                            role="option"
                                            onClick={() => {
                                              setAccountName(account);
                                              setAccountDropdownOpen(false);
                                              setNewRecord({...newRecord, planningAccount: account.toLowerCase().replace(/\s+/g, '-')});
                                            }}
                                            style={{
                                              padding: '0.5rem 0.75rem',
                                              cursor: 'pointer',
                                              backgroundColor: accountName === account ? '#f3f2f2' : '#ffffff',
                                              transition: 'background-color 0.1s ease'
                                            }}
                                          >
                                            <span className="slds-media__body">
                                              <span className="slds-listbox__option-text">{account}</span>
                                            </span>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '15px', color: 'var(--color-on-surface-3)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                          <input
                            type="checkbox"
                            checked={newRecord.selectDescendents}
                            onChange={(e) => setNewRecord({...newRecord, selectDescendents: e.target.checked})}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>Select Descendents</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCT SCOPE Section - Progressive Disclosure */}
              {newRecord.planTemplate && (
                <div className="list-page-modal-section">
                  <h3 className="list-page-modal-section-title">Product Scope</h3>
                  <div className="list-page-modal-row">
                    <div className="list-page-modal-field list-page-modal-field-full">
                      <label className="list-page-modal-label">Product Level:</label>
                      <select 
                        className="list-page-modal-select"
                        value={newRecord.planningLevel}
                        onChange={(e) => {
                          setNewRecord({...newRecord, planningLevel: e.target.value});
                          // Clear selected values and search term when level changes
                          setSelectedValues(new Set());
                          setValuesSearchTerm('');
                        }}
                      >
                        <option value="category">Category</option>
                        <option value="product">Product</option>
                      </select>
                    </div>
                  </div>
                  <div className="list-page-modal-row">
                    <div className="list-page-modal-field list-page-modal-field-full">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="list-page-modal-label" style={{ marginBottom: 0 }}>
                          Select Values:
                          <span className="list-page-modal-tooltip-wrapper">
                            <span className="list-page-modal-tooltip-icon">i</span>
                            <span className="list-page-modal-tooltip">
                              All items selected in this list will be populated as values for the selected product level and all their hierarchical descendants will be shown on the grid.
                            </span>
                          </span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-on-surface-3)', marginBottom: 0 }}>
                          <span>Show selected</span>
                          <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                            <input
                              type="checkbox"
                              checked={showSelectedOnly}
                              onChange={(e) => setShowSelectedOnly(e.target.checked)}
                              style={{
                                position: 'absolute',
                                opacity: 0,
                                width: 0,
                                height: 0
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '36px',
                                height: '20px',
                                backgroundColor: showSelectedOnly ? '#0176d3' : '#c9c9c9',
                                borderRadius: '10px',
                                transition: 'background-color 0.2s',
                                cursor: 'pointer'
                              }}
                              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: showSelectedOnly ? '18px' : '2px',
                                  width: '16px',
                                  height: '16px',
                                  backgroundColor: 'white',
                                  borderRadius: '50%',
                                  transition: 'left 0.2s',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                                }}
                              />
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="list-page-modal-values-table-container">
                        <table className="list-page-modal-values-table">
                          <thead>
                            <tr>
                              <th className="list-page-modal-values-th-checkbox">
                                <input 
                                  type="checkbox" 
                                  checked={selectedValues.size === filteredValues.length && filteredValues.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedValues(new Set(filteredValues.map(v => v.id)));
                                    } else {
                                      setSelectedValues(new Set());
                                    }
                                  }}
                                  className="list-page-modal-values-checkbox"
                                />
                              </th>
                              <th className="list-page-modal-values-th-name">
                                <div className="list-page-modal-values-header-content">
                                  <span>Name</span>
                                  <div className="list-page-modal-values-search-wrapper">
                                    <svg className="list-page-modal-values-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M6.33333 11.6667C9.27885 11.6667 11.6667 9.27885 11.6667 6.33333C11.6667 3.38781 9.27885 1 6.33333 1C3.38781 1 1 3.38781 1 6.33333C1 9.27885 3.38781 11.6667 6.33333 11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M13 13L10.1 10.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <input
                                      type="text"
                                      className="list-page-modal-values-search-input"
                                      placeholder="Search..."
                                      value={valuesSearchTerm}
                                      onChange={(e) => setValuesSearchTerm(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredValues.map((value) => (
                              <tr key={value.id} className="list-page-modal-values-row">
                                <td className="list-page-modal-values-td-checkbox">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedValues.has(value.id)}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedValues);
                                      if (e.target.checked) {
                                        newSelected.add(value.id);
                                      } else {
                                        newSelected.delete(value.id);
                                      }
                                      setSelectedValues(newSelected);
                                    }}
                                    className="list-page-modal-values-checkbox"
                                  />
                                </td>
                                <td className="list-page-modal-values-td-name">{value.name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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


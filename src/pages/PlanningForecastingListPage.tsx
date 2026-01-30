import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import SearchableSelect from '../components/SearchableSelect';
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
    startDate: '',
    endDate: '',
    planTemplate: '',
    planningAccount: '',
    planningLevel: 'category',
    listView: ''
  });
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [valuesSearchTerm, setValuesSearchTerm] = useState<string>('');
  
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
  
  // Filter values based on search term
  const filteredValues = mockValues.filter(value =>
    value.name.toLowerCase().includes(valuesSearchTerm.toLowerCase())
  );

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Helper function to format date
  const formatDate = (date: Date): string => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}${getOrdinalSuffix(day)} ${year}`;
  };

  // Generate period options based on time granularity
  const getPeriodOptions = (granularity: string): string[] => {
    switch (granularity) {
      case 'weeks':
        // Generate week start dates for 2026 (52 weeks)
        const weeks: string[] = [];
        const startDate = new Date(2026, 0, 1); // January 1, 2026
        
        for (let i = 0; i < 52; i++) {
          const weekStartDate = new Date(startDate);
          weekStartDate.setDate(startDate.getDate() + (i * 7));
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekStartDate.getDate() + 6); // End of week (6 days later)
          
          const weekNumber = i + 1;
          const startFormatted = formatDate(weekStartDate);
          const endFormatted = formatDate(weekEndDate);
          
          weeks.push(`Week ${weekNumber} (${startFormatted} to ${endFormatted})`);
        }
        return weeks;
      case 'months':
        return [
          'January 2026',
          'February 2026',
          'March 2026',
          'April 2026',
          'May 2026',
          'June 2026',
          'July 2026',
          'August 2026',
          'September 2026',
          'October 2026',
          'November 2026',
          'December 2026'
        ];
      case 'quarters':
        return [
          'Q1 2026',
          'Q2 2026',
          'Q3 2026',
          'Q4 2026'
        ];
      default:
        return [];
    }
  };

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
                  <div className="list-page-modal-field">
                    <label className="list-page-modal-label">Status:</label>
                    <select 
                      className="list-page-modal-select"
                      value={newRecord.status}
                      onChange={(e) => setNewRecord({...newRecord, status: e.target.value})}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="list-page-modal-row">
                  <div className="list-page-modal-field list-page-modal-field-full">
                    <label className="list-page-modal-label">Select Lowest Time Granularity:</label>
                    <select 
                      className="list-page-modal-select"
                      value={newRecord.timeGranularity}
                      onChange={(e) => {
                        // Reset start and end periods when granularity changes
                        setNewRecord({
                          ...newRecord, 
                          timeGranularity: e.target.value,
                          startDate: '',
                          endDate: ''
                        });
                      }}
                    >
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="quarters">Quarters</option>
                    </select>
                  </div>
                </div>
                <div className="list-page-modal-row">
                  <div className="list-page-modal-field">
                    <SearchableSelect
                      label="Start Period:"
                      value={newRecord.startDate}
                      onChange={(value) => setNewRecord({...newRecord, startDate: value})}
                      options={getPeriodOptions(newRecord.timeGranularity)}
                      placeholder="Select Start Period"
                    />
                  </div>
                  <div className="list-page-modal-field">
                    <SearchableSelect
                      label="End Period:"
                      value={newRecord.endDate}
                      onChange={(value) => setNewRecord({...newRecord, endDate: value})}
                      options={getPeriodOptions(newRecord.timeGranularity)}
                      placeholder="Select End Period"
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
                      <select 
                        className="list-page-modal-select"
                        value={newRecord.planningAccount}
                        onChange={(e) => setNewRecord({...newRecord, planningAccount: e.target.value})}
                      >
                        <option value="">Select Account</option>
                        <option value="acme-na">Acme North America</option>
                        <option value="acme-eu">Acme Europe</option>
                        <option value="acme-apac">Acme APAC</option>
                      </select>
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
                        <option value="brand">Brand</option>
                        <option value="product">Product</option>
                      </select>
                    </div>
                  </div>
                  <div className="list-page-modal-row">
                    <div className="list-page-modal-field list-page-modal-field-full">
                      <label className="list-page-modal-label">
                        Select Values:
                        <span className="list-page-modal-tooltip-wrapper">
                          <span className="list-page-modal-tooltip-icon">i</span>
                          <span className="list-page-modal-tooltip">
                            All items selected in this list will be populated as values for the selected product level and all their hierarchical descendants will be shown on the grid.
                          </span>
                        </span>
                      </label>
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


import React, { useState } from 'react';
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
    startDate: '',
    endDate: '',
    planTemplate: '',
    planningAccount: '',
    planningLevel: 'category',
    listView: ''
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
              <button className="list-page-new-btn" onClick={() => setIsModalOpen(true)}>New</button>
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
        <div className="list-page-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="list-page-modal" onClick={(e) => e.stopPropagation()}>
            <div className="list-page-modal-header">
              <button className="list-page-modal-close" onClick={() => setIsModalOpen(false)}>
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
                  <div className="list-page-modal-field">
                    <label className="list-page-modal-label">Start Date:</label>
                    <input 
                      type="text" 
                      className="list-page-modal-input"
                      value={newRecord.startDate}
                      onChange={(e) => setNewRecord({...newRecord, startDate: e.target.value})}
                      placeholder="MM/DD/YY"
                    />
                  </div>
                  <div className="list-page-modal-field">
                    <label className="list-page-modal-label">End Date:</label>
                    <input 
                      type="text" 
                      className="list-page-modal-input"
                      value={newRecord.endDate}
                      onChange={(e) => setNewRecord({...newRecord, endDate: e.target.value})}
                      placeholder="MM/DD/YY"
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
                      <label className="list-page-modal-label">
                        Select Values:
                        <span className="list-page-modal-tooltip-wrapper">
                          <span className="list-page-modal-tooltip-icon">i</span>
                          <span className="list-page-modal-tooltip">
                            All Items in this listview will be populated as values for the selected product level and all their hierarchical descendants will be shown on the grid.
                          </span>
                        </span>
                      </label>
                      <select 
                        className="list-page-modal-select"
                        value={newRecord.listView}
                        onChange={(e) => setNewRecord({...newRecord, listView: e.target.value})}
                      >
                        <option value="">Select List View</option>
                        <option value="fast-growing">Fast Growing Categories</option>
                        <option value="all">All Categories</option>
                        <option value="custom">Custom List</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="list-page-modal-footer">
              <button className="list-page-modal-cancel" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="list-page-modal-create" onClick={() => setIsModalOpen(false)}>
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


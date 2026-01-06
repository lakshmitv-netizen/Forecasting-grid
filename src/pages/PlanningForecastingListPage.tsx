import React, { useState } from 'react';
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
    name: '',
    adminTemplate: '',
    startPeriod: '',
    endPeriod: '',
    defaultMeasureSubgroup: 'revenue-quantity',
    defaultTimeGranularity: 'months'
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
      {isModalOpen && (
        <div className="list-page-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <button className="list-page-modal-close-outside" onClick={() => setIsModalOpen(false)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
          </button>
          <div className="list-page-modal" onClick={(e) => e.stopPropagation()}>
            <div className="list-page-modal-header">
              <h2 className="list-page-modal-title">New Plan</h2>
            </div>
            <div className="list-page-modal-body">
              <div className="list-page-modal-row">
                <div className="list-page-modal-field">
                  <label className="list-page-modal-label">Name</label>
                  <input 
                    type="text" 
                    className="list-page-modal-input"
                    value={newRecord.name}
                    onChange={(e) => setNewRecord({...newRecord, name: e.target.value})}
                    placeholder="Enter Name"
                  />
                </div>
                <div className="list-page-modal-field">
                  <label className="list-page-modal-label">Select Admin Template</label>
                  <div className="list-page-modal-search-wrapper">
                    <input 
                      type="text" 
                      className="list-page-modal-input list-page-modal-search-input"
                      value={newRecord.adminTemplate}
                      onChange={(e) => setNewRecord({...newRecord, adminTemplate: e.target.value})}
                      placeholder="Select Template"
                    />
                    <svg className="list-page-modal-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="list-page-modal-row">
                <div className="list-page-modal-field">
                  <label className="list-page-modal-label">Start Period</label>
                  <select 
                    className="list-page-modal-select"
                    value={newRecord.startPeriod}
                    onChange={(e) => setNewRecord({...newRecord, startPeriod: e.target.value})}
                  >
                    <option value="">Select Start Period</option>
                    <option value="jan-2026">Jan 2026</option>
                    <option value="feb-2026">Feb 2026</option>
                    <option value="mar-2026">Mar 2026</option>
                    <option value="q1-2026">Q1 2026</option>
                    <option value="q2-2026">Q2 2026</option>
                  </select>
                </div>
                <div className="list-page-modal-field">
                  <label className="list-page-modal-label">End Period</label>
                  <select 
                    className="list-page-modal-select"
                    value={newRecord.endPeriod}
                    onChange={(e) => setNewRecord({...newRecord, endPeriod: e.target.value})}
                  >
                    <option value="">Select End Period</option>
                    <option value="dec-2026">Dec 2026</option>
                    <option value="nov-2026">Nov 2026</option>
                    <option value="oct-2026">Oct 2026</option>
                    <option value="q4-2026">Q4 2026</option>
                    <option value="q3-2026">Q3 2026</option>
                  </select>
                </div>
              </div>
              <div className="list-page-modal-row">
                <div className="list-page-modal-field">
                  <label className="list-page-modal-label">Default Time Granularity</label>
                  <select 
                    className="list-page-modal-select"
                    value={newRecord.defaultTimeGranularity}
                    onChange={(e) => setNewRecord({...newRecord, defaultTimeGranularity: e.target.value})}
                  >
                    <option value="months">Months</option>
                    <option value="quarters">Quarters</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                <div className="list-page-modal-field">
                  <label className="list-page-modal-label">Default Measure Subgroup</label>
                  <select 
                    className="list-page-modal-select"
                    value={newRecord.defaultMeasureSubgroup}
                    onChange={(e) => setNewRecord({...newRecord, defaultMeasureSubgroup: e.target.value})}
                  >
                    <option value="revenue-quantity">Revenue and Quantity Measures</option>
                    <option value="adjustment">Adjustment Measures</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="list-page-modal-footer">
              <button className="list-page-modal-cancel" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="list-page-modal-create">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningForecastingListPage;


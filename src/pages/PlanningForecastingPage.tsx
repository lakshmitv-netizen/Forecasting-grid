import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages/PlanningForecastingPage.css';

const PlanningForecastingPage: React.FC = () => {
  const [leftTab, setLeftTab] = useState<'details' | 'grid-config'>('details');
  const [rightTab, setRightTab] = useState<'activity' | 'chatter'>('activity');
  const [gridConfigTab, setGridConfigTab] = useState<'mvp' | 'post-mvp'>('mvp');
  const [criteriaRowCount, setCriteriaRowCount] = useState<number>(2);
  const [postMvpCriteriaRowCount, setPostMvpCriteriaRowCount] = useState<number>(4);
  const [selectedHierarchyLevel, setSelectedHierarchyLevel] = useState<string>('Category');
  const [focusedSearchInput, setFocusedSearchInput] = useState<number | null>(null);
  
  // Initialize with prefilled values
  const initialDimensions = new Map<number, string>([
    [0, 'Account'],
    [1, 'Category'],
    [2, 'Account'],
    [3, 'Category']
  ]);
  const initialFields = new Map<number, string>([
    [0, 'City'],
    [1, 'Category Name'],
    [2, 'AnnualRevenue'],
    [3, 'Category Name']
  ]);
  const initialOperators = new Map<number, string>([
    [0, 'Equals'],
    [1, 'Equals'],
    [2, 'Greater Than'],
    [3, 'Equals']
  ]);
  const initialValues = new Map<number, string>([
    [0, 'Bangalore'],
    [1, 'Transmission Assemblies'],
    [2, '$ 12,500,000'],
    [3, 'Chassis Components']
  ]);
  
  const [selectedFields, setSelectedFields] = useState<Map<number, string>>(initialFields);
  const [selectedDimensions, setSelectedDimensions] = useState<Map<number, string>>(initialDimensions);
  const [selectedOperators, setSelectedOperators] = useState<Map<number, string>>(initialOperators);
  const [selectedValues, setSelectedValues] = useState<Map<number, string>>(initialValues);
  const [criteriaLogic, setCriteriaLogic] = useState<string>('(1 AND 2) OR (3 AND 4)');

  // Update criteria logic when row count changes (only if user hasn't manually edited it)
  useEffect(() => {
    // Only auto-update if the logic matches the default pattern
    const defaultPattern = Array.from({ length: postMvpCriteriaRowCount }, (_, i) => `(${i + 1})`).join(' AND ');
    // Don't override if it's the custom prefilled logic
    if (criteriaLogic === '(1 AND 2) OR (3 AND 4)') {
      return;
    }
    if (criteriaLogic === defaultPattern || criteriaLogic.match(/^\(\d+\)( AND \(\d+\))*$/)) {
      const newLogic = Array.from({ length: postMvpCriteriaRowCount }, (_, i) => `(${i + 1})`).join(' AND ');
      setCriteriaLogic(newLogic);
    }
  }, [postMvpCriteriaRowCount, criteriaLogic]);

  // Get dropdown options based on selected hierarchy level
  const getHierarchyOptions = (level: string): string[] => {
    const hierarchy: string[] = ['Parent Account', 'Account', 'Category', 'Product'];
    const levelIndex = hierarchy.indexOf(level);
    if (levelIndex === -1) return hierarchy;
    // Return current level and all ancestor levels
    return hierarchy.slice(0, levelIndex + 1).reverse();
  };

  // Get fields based on selected hierarchy level
  const getFieldsForLevel = (level: string): string[] => {
    switch (level) {
      case 'Account':
        return ['Account Name', 'City', 'AnnualRevenue'];
      case 'Parent Account':
        return ['Account Name', 'City', 'AnnualRevenue'];
      case 'Category':
        return ['Category Name', 'CatalogID', 'Status'];
      case 'Product':
        return ['Product Name', 'SKU', 'Status', 'Price'];
      default:
        return [];
    }
  };

  return (
    <div className="app">
      <Header />
      <div className="main-content planning-forecasting-page">
        {/* Page Header */}
        <div className="planning-page-header">
          <div className="planning-page-header-left">
            <div className="planning-page-icon">
              <span className="planning-page-icon-letter">P</span>
            </div>
            <div className="planning-page-title-section">
              <div className="planning-page-title-row">
                <h1 className="planning-page-title">Planning & Forecasting FY26</h1>
                <svg className="planning-page-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="planning-page-subtitle">Planning & Forecasting FY26 • Created: 10:10am 20/11/2025</p>
            </div>
          </div>
          <div className="planning-page-header-right">
            <Link to="/" className="planning-view-grid-button">
              View Grid
            </Link>
          </div>
        </div>

        {/* Main Content - Two Panels */}
        <div className="planning-content-panels">
          {/* Left Panel */}
          <div className="planning-left-panel">
            <div className="planning-panel-tabs">
              <button 
                className={`planning-tab ${leftTab === 'details' ? 'active' : ''}`}
                onClick={() => setLeftTab('details')}
              >
                Details
              </button>
              <button 
                className={`planning-tab ${leftTab === 'grid-config' ? 'active' : ''}`}
                onClick={() => setLeftTab('grid-config')}
              >
                Grid Configuration
              </button>
            </div>
            <div className="planning-panel-content">
              {leftTab === 'details' && (
                <div className="planning-information-section">
                  <h3 className="planning-section-title">Information</h3>
                  <div className="planning-info-field">
                    <label className="planning-info-label">Name</label>
                    <div className="planning-info-value">Planning & Forecasting FY26</div>
                  </div>
                  <div className="planning-info-field">
                    <label className="planning-info-label">Admin Template</label>
                    <a href="#" className="planning-info-link">KAM_MonthlyForecastUpdate_Template</a>
                  </div>
                  <div className="planning-info-field">
                    <label className="planning-info-label">Start Period</label>
                    <div className="planning-info-value">Jan 1st 2026</div>
                  </div>
                  <div className="planning-info-field">
                    <label className="planning-info-label">End Period</label>
                    <div className="planning-info-value">Dec 31st 2026</div>
                  </div>
                </div>
              )}
              {leftTab === 'grid-config' && (
                <div className="planning-grid-config-section">
                  <p className="planning-wip-text">
                    <span className="planning-wip-label">WIP</span>
                    From here the users will select the specific dimension values that the grid needs to show
                  </p>
                  
                  {/* Grid Config Version Tabs */}
                  <div className="grid-config-version-tabs">
                    <button 
                      className={`grid-config-version-tab ${gridConfigTab === 'mvp' ? 'active' : ''}`}
                      onClick={() => setGridConfigTab('mvp')}
                    >
                      MVP version
                    </button>
                    <button 
                      className={`grid-config-version-tab ${gridConfigTab === 'post-mvp' ? 'active' : ''}`}
                      onClick={() => setGridConfigTab('post-mvp')}
                    >
                      Post MVP version
                    </button>
                  </div>

                  {/* MVP Version Tab */}
                  {gridConfigTab === 'mvp' && (
                    <div className="grid-config-tab-content">
                      <div className="mvp-account-selection">
                        <label className="grid-config-label">Select Account</label>
                        <div className="mvp-account-search-wrapper">
                          <input 
                            type="text" 
                            className="mvp-account-search-input" 
                            placeholder="Placeholder text..."
                            defaultValue="MagnaDrive Michigan Plant"
                          />
                          <svg className="mvp-account-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mvp-category-selection">
                        <label className="grid-config-label">Select Category</label>
                        <p className="mvp-criteria-subtext">Describe Criteria for selecting Categories</p>
                        <div className="mvp-formula-logic-field">
                          <label className="mvp-criteria-field-label">Criteria Logic</label>
                          <input 
                            type="text" 
                            className="grid-config-input mvp-formula-input" 
                            value={Array.from({ length: criteriaRowCount }, (_, i) => `(${i + 1})`).join(' AND ')}
                            disabled
                          />
                        </div>
                        <div className="mvp-criteria-section">
                          <div className="mvp-criteria-rows">
                            {Array.from({ length: criteriaRowCount }, (_, index) => (
                              <div key={index} className="mvp-criteria-row">
                                <div className="mvp-criteria-row-number">{index + 1}</div>
                                <div className="mvp-criteria-field">
                                  <label className="mvp-criteria-field-label">Category Field</label>
                                  <select className="grid-config-dropdown">
                                    <option>Select...</option>
                                  </select>
                                </div>
                                <div className="mvp-criteria-field">
                                  <label className="mvp-criteria-field-label">Operator</label>
                                  <select className="grid-config-dropdown">
                                    <option>Select...</option>
                                  </select>
                                </div>
                                <div className="mvp-criteria-field">
                                  <label className="mvp-criteria-field-label">Value</label>
                                  <input type="text" className="grid-config-input" placeholder="" disabled />
                                </div>
                                <button 
                                  className="grid-config-delete-btn"
                                  onClick={() => {
                                    if (criteriaRowCount > 1) {
                                      setCriteriaRowCount(criteriaRowCount - 1);
                                    }
                                  }}
                                >
                                  <svg fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="mvp-criteria-actions">
                            <button 
                              className="grid-config-add-btn"
                              onClick={() => setCriteriaRowCount(criteriaRowCount + 1)}
                            >
                              + Add Condition
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mvp-product-selection">
                        <label className="grid-config-label">Select Products</label>
                        <p className="mvp-product-note">
                          Users will not be able to select products in MVP as per engg comment - Reference - "In the scope definition mock, there are "Products" and "Categories". Both these picklists define the scope on the product dimension. We'll be defining the scope on the higher level (Category) only. Please remove the product picklist from the mock"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Post MVP Version Tab */}
                  {gridConfigTab === 'post-mvp' && (
                    <div className="grid-config-tab-content">
                      
                      <div className="grid-config-layout">
                    {/* Left Navigation Panel */}
                    <div className="grid-config-sidebar">
                      <div className="grid-config-quick-find">
                        <svg className="grid-config-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" className="grid-config-search-input" placeholder="Quick Find" />
                      </div>
                      <div className="grid-config-hierarchy-header">Hierarchy Levels</div>
                      <div className="grid-config-nav-items">
                        <button 
                          className="grid-config-nav-item disabled"
                          disabled
                        >
                          Parent Account
                        </button>
                        <button 
                          className="grid-config-nav-item disabled"
                          disabled
                        >
                          Account
                        </button>
                        <button 
                          className={`grid-config-nav-item ${selectedHierarchyLevel === 'Category' ? 'active' : ''}`}
                          onClick={() => setSelectedHierarchyLevel('Category')}
                        >
                          Category
                        </button>
                        <button 
                          className="grid-config-nav-item disabled"
                          disabled
                        >
                          Product
                        </button>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="grid-config-main">
                      <div className="grid-config-header">
                        <h2 className="grid-config-title">Select Categories</h2>
                        <p className="grid-config-description">Describe the Criteria to select Categories</p>
                      </div>

                      <div className="mvp-formula-logic-field">
                        <label className="mvp-criteria-field-label">Criteria Logic</label>
                        <input 
                          type="text" 
                          className="grid-config-input mvp-formula-input" 
                          value={criteriaLogic}
                          onChange={(e) => setCriteriaLogic(e.target.value)}
                        />
                      </div>
                      <div className="mvp-criteria-section">
                        <div className="mvp-criteria-rows">
                          {Array.from({ length: postMvpCriteriaRowCount }, (_, index) => (
                            <div key={index} className="mvp-criteria-row">
                              <div className="mvp-criteria-row-number">{index + 1}</div>
                              <div className="mvp-criteria-field">
                                <label className="mvp-criteria-field-label">Dimension & its field</label>
                                <div className="grouped-combobox-wrapper">
                                  <div className="grouped-combobox">
                                    <select 
                                      className="grouped-combobox-dropdown"
                                      value={selectedDimensions.get(index) || getHierarchyOptions(selectedHierarchyLevel)[0]}
                                      onChange={(e) => {
                                        const newMap = new Map(selectedDimensions);
                                        newMap.set(index, e.target.value);
                                        setSelectedDimensions(newMap);
                                      }}
                                    >
                                      {getHierarchyOptions(selectedHierarchyLevel).map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                    <div className="grouped-combobox-divider"></div>
                                    <div className="grouped-combobox-search">
                                      <input 
                                        type="text" 
                                        className="grouped-combobox-search-input" 
                                        placeholder="Search field..."
                                        value={selectedFields.get(index) || ''}
                                        onChange={(e) => {
                                          const newMap = new Map(selectedFields);
                                          newMap.set(index, e.target.value);
                                          setSelectedFields(newMap);
                                        }}
                                        onFocus={() => setFocusedSearchInput(index)}
                                        onBlur={() => setTimeout(() => setFocusedSearchInput(null), 200)}
                                      />
                                      <svg className="grouped-combobox-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                      </svg>
                                    </div>
                                  </div>
                                  {focusedSearchInput === index && (
                                    <div className="field-picklist">
                                      {getFieldsForLevel(selectedDimensions.get(index) || getHierarchyOptions(selectedHierarchyLevel)[0]).map((field) => (
                                        <div
                                          key={field}
                                          className="field-picklist-item"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            const newMap = new Map(selectedFields);
                                            newMap.set(index, field);
                                            setSelectedFields(newMap);
                                            setFocusedSearchInput(null);
                                          }}
                                        >
                                          {field}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mvp-criteria-field">
                                <label className="mvp-criteria-field-label">Operator</label>
                                <select 
                                  className="grid-config-dropdown"
                                  value={selectedOperators.get(index) || 'Select...'}
                                  onChange={(e) => {
                                    const newMap = new Map(selectedOperators);
                                    newMap.set(index, e.target.value);
                                    setSelectedOperators(newMap);
                                  }}
                                >
                                  <option>Select...</option>
                                  <option>Equals</option>
                                  <option>Contains</option>
                                  <option>Not Equals</option>
                                  <option>Less Than</option>
                                  <option>Greater Than</option>
                                </select>
                              </div>
                              <div className="mvp-criteria-field">
                                <label className="mvp-criteria-field-label">Value</label>
                                <input 
                                  type="text" 
                                  className="grid-config-input" 
                                  placeholder=""
                                  value={selectedValues.get(index) || ''}
                                  onChange={(e) => {
                                    const newMap = new Map(selectedValues);
                                    newMap.set(index, e.target.value);
                                    setSelectedValues(newMap);
                                  }}
                                />
                              </div>
                              <button 
                                className="grid-config-delete-btn"
                                onClick={() => {
                                  if (postMvpCriteriaRowCount > 1) {
                                    setPostMvpCriteriaRowCount(postMvpCriteriaRowCount - 1);
                                  }
                                }}
                              >
                                <svg fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mvp-criteria-actions">
                          <button 
                            className="grid-config-add-btn"
                            onClick={() => setPostMvpCriteriaRowCount(postMvpCriteriaRowCount + 1)}
                          >
                            + Add Condition
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="planning-right-panel">
            <div className="planning-panel-tabs">
              <button 
                className={`planning-tab ${rightTab === 'activity' ? 'active' : ''}`}
                onClick={() => setRightTab('activity')}
              >
                Activity
              </button>
              <button 
                className={`planning-tab ${rightTab === 'chatter' ? 'active' : ''}`}
                onClick={() => setRightTab('chatter')}
              >
                Chatter
              </button>
            </div>
            <div className="planning-panel-content">
              {rightTab === 'activity' && (
                <div className="planning-activity-section">
                  <div className="planning-activity-filters">
                    <div className="planning-filter-icons">
                      <button className="planning-filter-icon-button">
                        <svg className="planning-filter-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <svg className="planning-filter-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button className="planning-filter-icon-button">
                        <svg className="planning-filter-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                        </svg>
                        <svg className="planning-filter-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button className="planning-filter-icon-button">
                        <svg className="planning-filter-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                        <svg className="planning-filter-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button className="planning-filter-icon-button">
                        <svg className="planning-filter-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        <svg className="planning-filter-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div className="planning-filter-text">
                      <span>Filters: All time • All activities • All types</span>
                      <svg className="planning-filter-gear" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="planning-activity-links">
                    <a href="#" className="planning-activity-link">Refresh</a>
                    <a href="#" className="planning-activity-link">Expand All</a>
                    <a href="#" className="planning-activity-link">View All</a>
                  </div>
                  <div className="planning-activity-section-item">
                    <div className="planning-activity-section-header">
                      <h4 className="planning-activity-section-title">Upcoming & Overdue</h4>
                      <svg className="planning-page-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="planning-empty-state">
                      <p className="planning-empty-text">No activities to show.</p>
                      <p className="planning-empty-subtext">Get started by sending an email, scheduling a task, and more.</p>
                    </div>
                  </div>
                  <div className="planning-activity-divider"></div>
                  <div className="planning-activity-section-item">
                    <div className="planning-empty-state">
                      <p className="planning-empty-text">No past activity.</p>
                      <p className="planning-empty-subtext">Past meetings and tasks marked as done show up here.</p>
                    </div>
                  </div>
                </div>
              )}
              {rightTab === 'chatter' && (
                <div className="planning-chatter-section">
                  <p>Chatter content will go here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="planning-page-footer">
          <Link to="/" className="planning-footer-item">
            <svg className="planning-footer-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>To Do List</span>
          </Link>
          <Link to="/" className="planning-footer-item">
            <svg className="planning-footer-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <span>Notes</span>
          </Link>
          <Link to="/" className="planning-footer-item">
            <svg className="planning-footer-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
            <span>Rewind</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlanningForecastingPage;

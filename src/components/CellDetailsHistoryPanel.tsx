import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MeasureData } from '../types';
import { extractCellInfo, CellInfo } from '../utils/cellInfoUtils';
import { CellEditHistoryEntry } from '../types/editHistory';
import CellEditHistoryCard from './CellEditHistoryCard';
import '../styles/components/CellDetailsHistoryPanel.css';

interface CellDetailsHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  focusedCell?: { rowId: string; monthKey?: string; measureId?: string } | null;
  data?: MeasureData[];
  layout?: string;
  editHistory?: CellEditHistoryEntry[];
  draftEditHistory?: Map<string, CellEditHistoryEntry>; // Draft (unsaved) edits
  onAddNote?: (rowId: string, monthKey: string, note: string) => void;
  selectedCells?: Set<string>; // Set of selected cell keys
  onClearSelection?: () => void; // Callback to clear selection
  onMassUpdate?: (cellKeys: string[], rule: string, value: string, note?: string) => void; // Callback for mass update
  initialTab?: 'single' | 'multi'; // Initial tab to show when panel opens
}

const CellDetailsHistoryPanel: React.FC<CellDetailsHistoryPanelProps> = ({ 
  isOpen, 
  onClose, 
  focusedCell,
  data = [],
  layout = 'Measures / Dimensions x Time',
  editHistory = [],
  draftEditHistory,
  onAddNote,
  selectedCells = new Set(),
  onClearSelection,
  onMassUpdate,
  initialTab = 'single'
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>(initialTab);
  
  // Update activeTab when panel opens or initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      // When panel opens, set the tab based on initialTab prop
      setActiveTab(initialTab);
    } else {
      // Reset to single tab when panel closes
      setActiveTab('single');
    }
  }, [isOpen, initialTab]);
  const [isHierarchyPopoverOpen, setIsHierarchyPopoverOpen] = useState(false);
  const [panelNoteText, setPanelNoteText] = useState('');
  const hierarchyButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Multi-cell form state
  const [selectCells, setSelectCells] = useState<string>('Manually');
  const [selectAction, setSelectAction] = useState<string>('Mass Update');
  const [rule, setRule] = useState<string>('Increase');
  const [value, setValue] = useState<string>('20%');
  const [bulkNote, setBulkNote] = useState<string>('');
  const [isSelectCellsDropdownOpen, setIsSelectCellsDropdownOpen] = useState(false);
  const [isSelectActionDropdownOpen, setIsSelectActionDropdownOpen] = useState(false);
  const [isRuleDropdownOpen, setIsRuleDropdownOpen] = useState(false);
  const [actionSearchTerm, setActionSearchTerm] = useState<string>('');
  const selectCellsDropdownRef = useRef<HTMLDivElement>(null);
  const selectActionDropdownRef = useRef<HTMLDivElement>(null);
  const ruleDropdownRef = useRef<HTMLDivElement>(null);
  
  // Replies state - keyed by entry ID
  interface CardReply {
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: Date;
  }
  const [cardReplies, setCardReplies] = useState<Record<string, CardReply[]>>({});
  
  // Use useMemo to ensure cellInfo updates when dependencies change
  const cellInfo: CellInfo | null = React.useMemo(() => {
    if (!focusedCell) return null;
    return extractCellInfo(focusedCell, data, layout);
  }, [focusedCell, data, layout]);
  
  const hasFocusedCell = focusedCell !== null && focusedCell !== undefined;

  // Filter edit history for the current focused cell
  const cellEditHistory = useMemo(() => {
    if (!focusedCell) return [];
    
    // Build cell key based on layout
    let cellKey: string;
    if (layout === 'Dimensions / Time x Measures' || layout === 'Time / Dimensions x Measures') {
      // For these layouts, cellKey stored is `${dimensionId}-${measureId}`
      // But focusedCell.rowId might be a transformed ID like "dimension-product-trn-a-year-q1-jan2026"
      // We need to extract the base dimension ID (remove time parts)
      let baseDimensionId = focusedCell.rowId;
      if (baseDimensionId.startsWith('dimension-')) {
        // Remove "dimension-" prefix and time parts (year, q1-q4, jan2026-dec2026)
        const parts = baseDimensionId.split('-');
        // Find where time parts start (usually after product/category/account)
        let dimensionEndIndex = parts.length;
        for (let i = 1; i < parts.length; i++) {
          if (parts[i] === 'year' || ['q1', 'q2', 'q3', 'q4'].includes(parts[i]) || 
              parts[i].match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\d{4}$/)) {
            dimensionEndIndex = i;
            break;
          }
        }
        baseDimensionId = parts.slice(0, dimensionEndIndex).join('-');
      }
      cellKey = focusedCell.measureId 
        ? `${baseDimensionId}-${focusedCell.measureId}`
        : baseDimensionId;
    } else {
      // For HierarchicalGrid, cellKey is `${rowId}-${monthKey}`
      cellKey = focusedCell.monthKey 
        ? `${focusedCell.rowId}-${focusedCell.monthKey}`
        : focusedCell.rowId;
    }
    
    // Merge drafts and saved history
    const draftsArray = draftEditHistory ? Array.from(draftEditHistory.values()) : [];
    const allHistory = [...draftsArray, ...editHistory];
    
    const filtered = allHistory
      .filter(entry => {
        // Exact match
        const exactMatch = entry.cellKey === cellKey;
        
        if (exactMatch) {
          return true;
        }
        
        // For transformed layouts, also check if rowId and measureId match
        if (layout === 'Dimensions / Time x Measures' || layout === 'Time / Dimensions x Measures') {
          const rowMeasureMatch = entry.rowId === focusedCell.rowId && entry.measureId === focusedCell.measureId;
          if (rowMeasureMatch) {
            return true;
          }
        }
        
        return false;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Most recent first
    
    return filtered;
  }, [focusedCell, editHistory, draftEditHistory, layout]);
  
  // Add reply to a card
  const handleAddCardReply = useCallback((entryId: string, message: string) => {
    const newReply: CardReply = {
      id: `reply-${Date.now()}-${Math.random()}`,
      userId: 'john-carter',
      userName: 'John Carter',
      message,
      timestamp: new Date()
    };
    
    setCardReplies(prev => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), newReply]
    }));
  }, []);

  // Handle posting note from panel footer
  const handlePostNote = useCallback(() => {
    if (!panelNoteText.trim() || !focusedCell || !onAddNote) return;
    
    const monthKey = focusedCell.monthKey || '';
    onAddNote(focusedCell.rowId, monthKey, panelNoteText.trim());
    setPanelNoteText('');
  }, [panelNoteText, focusedCell, onAddNote]);

  // Close popover when focused cell changes
  useEffect(() => {
    if (focusedCell) {
      setIsHierarchyPopoverOpen(false);
    }
  }, [focusedCell?.rowId, focusedCell?.monthKey, focusedCell?.measureId]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        hierarchyButtonRef.current &&
        !hierarchyButtonRef.current.contains(event.target as Node)
      ) {
        setIsHierarchyPopoverOpen(false);
      }
    };

    if (isHierarchyPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isHierarchyPopoverOpen]);

  // Close multi-cell dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectCellsDropdownRef.current &&
        !selectCellsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSelectCellsDropdownOpen(false);
      }
      if (
        selectActionDropdownRef.current &&
        !selectActionDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSelectActionDropdownOpen(false);
        setActionSearchTerm('');
      }
      if (
        ruleDropdownRef.current &&
        !ruleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRuleDropdownOpen(false);
      }
    };

    if (isSelectCellsDropdownOpen || isSelectActionDropdownOpen || isRuleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isSelectCellsDropdownOpen, isSelectActionDropdownOpen, isRuleDropdownOpen]);

  // Multi-cell options
  const selectCellsOptions = ['Manually', 'Automatically'];
  
  // Criteria state for automatic selection
  interface SelectionCriteria {
    id: string;
    field: string; // 'KPI', 'Product', 'Time', 'Cell Value'
    operator: string; // 'Equal to', 'Contains', 'Between', 'Greater than', etc.
    value: string;
  }
  
  const [criteria, setCriteria] = useState<SelectionCriteria[]>([]);
  
  const addCriteria = () => {
    setCriteria([...criteria, {
      id: `criteria-${Date.now()}-${Math.random()}`,
      field: 'KPI',
      operator: 'Equal to',
      value: ''
    }]);
  };
  
  const removeCriteria = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };
  
  const updateCriteria = (id: string, updates: Partial<SelectionCriteria>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  
  const fieldOptions = ['KPI', 'Product', 'Time', 'Cell Value'];
  const operatorOptions: Record<string, string[]> = {
    'KPI': ['Equal to', 'Not equal to', 'Contains'],
    'Product': ['Equal to', 'Not equal to', 'Contains', 'Starts with', 'Ends with'],
    'Time': ['Equal to', 'Between', 'Before', 'After'],
    'Cell Value': ['Equal to', 'Not equal to', 'Greater than', 'Less than', 'Between']
  };
  const selectActionOptions = [
    'Mass Update',
    'Copy',
    'Copy Formula',
    'Copy Trend',
    'Copy conditional formatting rule',
    'Copy Adjustment Notes'
  ];
  const ruleOptions = ['Increase', 'Decrease', 'Set to', 'Multiply by', 'Divide by'];
  
  // Filter actions based on search term
  const filteredActions = selectActionOptions.filter(action =>
    action.toLowerCase().includes(actionSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="cell-details-history-panel">
      {/* Panel Header */}
      <div className="cell-details-history-panel-header">
        <div className="cell-details-history-panel-title-section">
          <div className="cell-details-history-panel-note-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="cell-details-history-panel-title">Cell Details & Updates</p>
        </div>
        <div className="cell-details-history-panel-actions">
          <button className="cell-details-history-panel-close" onClick={onClose} aria-label="Close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="cell-details-history-tabs">
        <button
          className={`cell-details-history-tab ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          Single Cell
        </button>
        <button
          className={`cell-details-history-tab ${activeTab === 'multi' ? 'active' : ''}`}
          onClick={() => setActiveTab('multi')}
        >
          Multi-cell
        </button>
      </div>

      {/* Panel Body */}
      <div className="cell-details-history-panel-body">
        {activeTab === 'multi' ? (
          <div className="cell-details-history-content">
            <div className="cell-details-history-tab-content">
              <div className="cell-details-history-multi-cell-form">
                {/* Select Cells */}
                <div className="cell-details-history-multi-field">
                  <label className="cell-details-history-multi-label">Select Cells</label>
                  <div className="cell-details-history-dropdown-wrapper" ref={selectCellsDropdownRef}>
                    <div 
                      className={`cell-details-history-dropdown-trigger ${isSelectCellsDropdownOpen ? 'open' : ''}`}
                      onClick={() => setIsSelectCellsDropdownOpen(!isSelectCellsDropdownOpen)}
                    >
                      <span className="cell-details-history-dropdown-value">
                        {selectCells === 'Automatically' ? 'Automatically' : selectedCells.size > 0 ? `${selectedCells.size} cell${selectedCells.size === 1 ? '' : 's'} selected` : 'Manually'}
                      </span>
                      <svg className="cell-details-history-dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isSelectCellsDropdownOpen && (
                      <div className="cell-details-history-dropdown-list">
                        {selectCellsOptions.map((option, index) => (
                          <div
                            key={index}
                            className={`cell-details-history-dropdown-option ${selectCells === option ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectCells(option);
                              setIsSelectCellsDropdownOpen(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                        {selectedCells.size > 0 && onClearSelection && (
                          <div
                            className="cell-details-history-dropdown-option"
                            onClick={() => {
                              onClearSelection();
                              setIsSelectCellsDropdownOpen(false);
                            }}
                            style={{ color: '#0050D9', fontWeight: 500 }}
                          >
                            Clear Selection
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Criteria UI for Automatic Selection */}
                {selectCells === 'Automatically' && (
                  <div className="cell-details-history-criteria-section">
                    <div className="cell-details-history-criteria-header">
                      <h3 className="cell-details-history-criteria-title">Cell Selection Criteria</h3>
                    </div>
                    <div className="cell-details-history-criteria-list">
                      {criteria.map((criterion) => (
                        <div key={criterion.id} className="cell-details-history-criteria-card">
                          <div className="cell-details-history-criteria-content">
                            <div className="cell-details-history-criteria-field">
                              <select
                                value={criterion.field}
                                onChange={(e) => updateCriteria(criterion.id, { field: e.target.value, operator: operatorOptions[e.target.value][0] || '' })}
                                className="cell-details-history-criteria-select"
                              >
                                {fieldOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                            <div className="cell-details-history-criteria-operator">
                              <select
                                value={criterion.operator}
                                onChange={(e) => updateCriteria(criterion.id, { operator: e.target.value })}
                                className="cell-details-history-criteria-select"
                              >
                                {operatorOptions[criterion.field]?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                            <div className="cell-details-history-criteria-value">
                              <input
                                type="text"
                                value={criterion.value}
                                onChange={(e) => updateCriteria(criterion.id, { value: e.target.value })}
                                placeholder="Enter value"
                                className="cell-details-history-criteria-input"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeCriteria(criterion.id)}
                            className="cell-details-history-criteria-delete"
                            aria-label="Delete criterion"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="cell-details-history-criteria-actions">
                      <button
                        onClick={addCriteria}
                        className="cell-details-history-criteria-add-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Condition
                      </button>
                      <button
                        onClick={addCriteria}
                        className="cell-details-history-criteria-add-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Group
                      </button>
                    </div>
                  </div>
                )}

                {/* Select Action */}
                <div className="cell-details-history-multi-field">
                  <label className="cell-details-history-multi-label">Select Action</label>
                  <div className="cell-details-history-dropdown-wrapper" ref={selectActionDropdownRef}>
                    <div 
                      className={`cell-details-history-dropdown-trigger ${isSelectActionDropdownOpen ? 'open' : ''}`}
                      onClick={() => setIsSelectActionDropdownOpen(!isSelectActionDropdownOpen)}
                    >
                      <span className="cell-details-history-dropdown-value">
                        {selectAction}
                      </span>
                      <svg className="cell-details-history-dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isSelectActionDropdownOpen && (
                      <div className="cell-details-history-dropdown-list cell-details-history-dropdown-list-with-search">
                        <div className="cell-details-history-dropdown-search">
                          <svg className="cell-details-history-dropdown-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            className="cell-details-history-dropdown-search-input"
                            placeholder="Select Action"
                            value={actionSearchTerm}
                            onChange={(e) => setActionSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="cell-details-history-dropdown-options-container">
                          {filteredActions.length > 0 ? (
                            filteredActions.map((option, index) => (
                              <div
                                key={index}
                                className={`cell-details-history-dropdown-option ${selectAction === option ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectAction(option);
                                  setIsSelectActionDropdownOpen(false);
                                  setActionSearchTerm('');
                                }}
                              >
                                {option}
                              </div>
                            ))
                          ) : (
                            <div className="cell-details-history-dropdown-option cell-details-history-dropdown-no-results">
                              No results found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rule - only show for Mass Update */}
                {selectAction === 'Mass Update' && (
                  <div className="cell-details-history-multi-field">
                    <label className="cell-details-history-multi-label">Rule</label>
                    <div className="cell-details-history-dropdown-wrapper" ref={ruleDropdownRef}>
                      <div 
                        className={`cell-details-history-dropdown-trigger ${isRuleDropdownOpen ? 'open' : ''}`}
                        onClick={() => setIsRuleDropdownOpen(!isRuleDropdownOpen)}
                      >
                        <span className="cell-details-history-dropdown-value">
                          {rule}
                        </span>
                        <svg className="cell-details-history-dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {isRuleDropdownOpen && (
                        <div className="cell-details-history-dropdown-list">
                          {ruleOptions.map((option, index) => (
                            <div
                              key={index}
                              className={`cell-details-history-dropdown-option ${rule === option ? 'selected' : ''}`}
                              onClick={() => {
                                setRule(option);
                                setIsRuleDropdownOpen(false);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Value - only show for Mass Update */}
                {selectAction === 'Mass Update' && (
                  <div className="cell-details-history-multi-field">
                    <label className="cell-details-history-multi-label">Value</label>
                    <input
                      type="text"
                      className="cell-details-history-multi-input"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                )}

                {/* Bulk Add Adjustment Note - show for Mass Update */}
                {selectAction === 'Mass Update' && (
                  <div className="cell-details-history-multi-field">
                    <label className="cell-details-history-multi-label">Bulk Adjustment Note</label>
                    <textarea
                      className="cell-details-history-multi-textarea"
                      value={bulkNote}
                      onChange={(e) => setBulkNote(e.target.value)}
                      placeholder="Enter adjustment note (optional)"
                      rows={4}
                    />
                  </div>
                )}

                {/* Bulk Add Adjustment Note - show for Copy Adjustment Notes */}
                {selectAction === 'Copy Adjustment Notes' && (
                  <div className="cell-details-history-multi-field">
                    <label className="cell-details-history-multi-label">Bulk Add Adjustment Note</label>
                    <textarea
                      className="cell-details-history-multi-textarea"
                      value={bulkNote}
                      onChange={(e) => setBulkNote(e.target.value)}
                      placeholder="Enter adjustment note"
                      rows={4}
                    />
                  </div>
                )}

                {/* Update Button */}
                <div className="cell-details-history-multi-actions">
                  <button 
                    className="cell-details-history-multi-update-btn"
                    onClick={() => {
                      if (selectAction === 'Mass Update' && selectedCells.size > 0 && value.trim() && onMassUpdate) {
                        onMassUpdate(Array.from(selectedCells), rule, value.trim(), bulkNote.trim() || undefined);
                      }
                    }}
                    disabled={selectAction === 'Mass Update' && (selectedCells.size === 0 || !value.trim())}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !hasFocusedCell ? (
          <div className="cell-details-history-empty-state">
            <div className="cell-details-history-empty-image">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="80" height="80" rx="4" stroke="#C9C9C9" strokeWidth="2" fill="none"/>
                <rect x="30" y="30" width="60" height="60" rx="2" fill="#F3F3F3"/>
                <line x1="40" y1="50" x2="80" y2="50" stroke="#C9C9C9" strokeWidth="2" strokeLinecap="round"/>
                <line x1="40" y1="65" x2="80" y2="65" stroke="#C9C9C9" strokeWidth="2" strokeLinecap="round"/>
                <line x1="40" y1="80" x2="70" y2="80" stroke="#C9C9C9" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="cell-details-history-empty-text">Select a cell to know more</p>
          </div>
        ) : (
        <div className="cell-details-history-content">
            {/* Tab Content */}
            {activeTab === 'single' ? (
              <>
            {/* Cell Info Header - Compact single line: Measure · Time · Dimension */}
            {cellInfo && (
              <div className="cell-details-history-header-compact">
                <span className="cell-details-history-header-value">{cellInfo.measureName || 'N/A'}</span>
                <span className="cell-details-history-header-separator">·</span>
                <span className="cell-details-history-header-value">{cellInfo.timePeriod || 'N/A'}</span>
                <span className="cell-details-history-header-separator">·</span>
                <span className="cell-details-history-header-value">
                  {cellInfo.dimensionPath.length > 0 ? cellInfo.dimensionPath[cellInfo.dimensionPath.length - 1] : 'N/A'}
                </span>
                <button
                  ref={hierarchyButtonRef}
                  className="cell-details-history-hierarchy-button-compact"
                  onClick={() => setIsHierarchyPopoverOpen(!isHierarchyPopoverOpen)}
                  aria-label="Show hierarchy"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {isHierarchyPopoverOpen && (
                  <div ref={popoverRef} className="cell-details-history-hierarchy-popover">
                    <div className="cell-details-history-hierarchy-popover-nubbin"></div>
                    <div className="cell-details-history-hierarchy-popover-content">
                      {cellInfo.dimensionPath.length > 0 ? (
                        <span className="cell-details-history-hierarchy-path">
                          {cellInfo.dimensionPath.join(' > ')}
                        </span>
                      ) : (
                        <span className="cell-details-history-hierarchy-path">No hierarchy available</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
              <div className="cell-details-history-tab-content">
                {/* Combined Edit History and Notes Section */}
                <div className="cell-details-history-notes-section">
                  <h3 className="cell-details-history-notes-title">Cell edit history</h3>
                  
                  {/* Combined History List */}
                  <div className="cell-details-history-notes-list">
                    {cellEditHistory.length > 0 ? (
                      cellEditHistory.map((entry, index) => (
                        <CellEditHistoryCard 
                          key={entry.id} 
                          entry={entry}
                          replies={cardReplies[entry.id] || []}
                          onAddReply={handleAddCardReply}
                          isLast={index === cellEditHistory.length - 1}
                          isFirst={index === 0}
                        />
                      ))
                    ) : (
                      <div>
                        <p className="cell-details-history-placeholder">
                          {hasFocusedCell 
                            ? 'No cell edit history available for this cell.' 
                            : 'Select a cell to view edit history.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </>
            ) : null}
        </div>
        )}
        
        {/* Panel Footer - Note Input */}
        {hasFocusedCell && activeTab === 'single' && (
          <div className="cell-details-history-panel-footer">
            <div className="cell-details-history-note-input-section">
              <label className="cell-details-history-note-label">Notes</label>
              <textarea
                className="cell-details-history-note-textarea"
                value={panelNoteText}
                onChange={(e) => setPanelNoteText(e.target.value)}
                placeholder="Enter a note or comment"
                rows={3}
              />
            </div>
            <div className="cell-details-history-note-actions">
              <button className="cell-details-history-attach-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                Attach File
              </button>
              <button 
                className="cell-details-history-post-btn"
                onClick={handlePostNote}
                disabled={!panelNoteText.trim()}
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CellDetailsHistoryPanel;


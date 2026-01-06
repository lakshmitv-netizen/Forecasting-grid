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
  onSetFocusedCell?: (cell: { rowId: string; monthKey?: string; measureId?: string }) => void; // Callback to set focused cell
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
  initialTab = 'single',
  onSetFocusedCell
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>(initialTab);
  
  // Update activeTab when panel opens or initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      // When panel opens or initialTab changes while open, always set the tab based on initialTab prop
      setActiveTab(initialTab);
    } else {
      // Reset to single tab when panel closes
      setActiveTab('single');
    }
  }, [isOpen, initialTab]);
  
  const [isHierarchyPopoverOpen, setIsHierarchyPopoverOpen] = useState(false);
  const [_nubbinLeft, _setNubbinLeft] = useState<number | null>(null); // Kept for potential future use
  const [panelNoteText, setPanelNoteText] = useState('');
  const [genericCommentText, setGenericCommentText] = useState(''); // For comments when no cell selected
  const hierarchyButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Filter state for history
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  
  // Generic comments state (for no-cell-selected mode)
  interface GenericComment {
    id: string;
    userId: string;
    userName: string;
    userInitials: string;
    message: string;
    timestamp: Date;
  }
  const [genericComments, setGenericComments] = useState<GenericComment[]>([
    {
      id: 'gc-1',
      userId: 'user-1',
      userName: 'John Carter',
      userInitials: 'JC',
      message: 'Q1 forecasts looking solid. Let\'s review before the monthly meeting.',
      timestamp: new Date('2026-01-05T09:30:00')
    },
    {
      id: 'gc-2',
      userId: 'user-2',
      userName: 'Sarah Chen',
      userInitials: 'SC',
      message: 'Updated the transmission assembly projections based on supplier feedback.',
      timestamp: new Date('2026-01-04T14:15:00')
    }
  ]);
  
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

  // Selection state now derived directly from selectedCells.size in render logic

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

  // Handle posting generic comment (when no cell selected)
  const handlePostGenericComment = useCallback(() => {
    if (!genericCommentText.trim()) return;
    
    const newComment: GenericComment = {
      id: `gc-${Date.now()}-${Math.random()}`,
      userId: 'john-carter',
      userName: 'John Carter',
      userInitials: 'JC',
      message: genericCommentText.trim(),
      timestamp: new Date()
    };
    
    setGenericComments(prev => [newComment, ...prev]);
    setGenericCommentText('');
  }, [genericCommentText]);

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterPopoverOpen(false);
      }
    };

    if (isFilterPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isFilterPopoverOpen]);

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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12.7383 12.216L12.4614 12.4929C12.1537 12.8006 11.7537 12.9544 11.3229 12.9544H10.5229C9.78444 12.9544 8.98444 12.3698 8.98444 11.3544V10.5852C8.98444 9.96983 9.26137 9.6006 9.41521 9.38522L12.7383 6.0006C12.8306 5.90829 12.9229 5.69291 12.9229 5.56983V3.01599C12.9229 2.21599 12.246 1.53906 11.446 1.53906H3.56907C2.76908 1.53906 2.09215 2.27752 2.09215 3.01599H1.59985C1.046 3.01599 0.615234 3.47752 0.615234 4.03137C0.615234 4.58522 1.046 5.01599 1.59985 5.01599H2.09215V7.01599H1.59985C1.046 7.01599 0.615234 7.44676 0.615234 8.0006C0.615234 8.55445 1.046 8.98522 1.59985 8.98522H2.09215V10.9852H1.59985C1.046 10.9852 0.615234 11.4468 0.615234 11.9698C0.615234 12.5237 1.046 12.9544 1.59985 12.9544H2.09215C2.09215 13.9391 2.76908 14.4314 3.56907 14.4314H11.446C12.246 14.4314 12.9229 13.7544 12.9229 12.9544V12.3083C12.9229 12.1544 12.8614 12.1237 12.7383 12.216V12.216ZM10.2153 5.262C10.2153 5.53892 9.99987 5.75431 9.72295 5.75431H4.79988C4.52296 5.75431 4.30758 5.53892 4.30758 5.262V4.76969C4.30758 4.49277 4.52296 4.27738 4.79988 4.27738H9.72295C9.99987 4.27738 10.2153 4.49277 10.2153 4.76969V5.262ZM7.99988 11.2317C7.99988 11.5086 7.78449 11.724 7.50757 11.724H4.79988C4.52296 11.724 4.30758 11.5086 4.30758 11.2317V10.7394C4.30758 10.4624 4.52296 10.2471 4.79988 10.2471H7.50757C7.78449 10.2471 7.99988 10.4624 7.99988 10.7394V11.2317ZM8.73834 8.24728C8.73834 8.5242 8.52295 8.73959 8.24603 8.73959H4.79988C4.52296 8.73959 4.30758 8.5242 4.30758 8.24728V7.75497C4.30758 7.47805 4.52296 7.26267 4.79988 7.26267H8.24603C8.52295 7.26267 8.73834 7.47805 8.73834 7.75497V8.24728ZM15.2306 6.89245L14.9229 6.58476C14.7383 6.40014 14.4306 6.40014 14.246 6.58476L10.4922 10.4617C10.4614 10.4617 10.4614 10.5232 10.4614 10.5232V11.354C10.4614 11.4155 10.4614 11.4771 10.523 11.4771H11.323C11.3537 11.4771 11.3845 11.4463 11.4153 11.4463L15.1999 7.63091C15.446 7.41553 15.446 7.10784 15.2306 6.89245V6.89245Z" fill="#0250D9"/>
            </svg>
          </div>
          <p className="cell-details-history-panel-title">History & Updates</p>
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
          History
        </button>
        <button
          className={`cell-details-history-tab ${activeTab === 'multi' ? 'active' : ''}`}
          onClick={() => setActiveTab('multi')}
        >
          Update
        </button>
      </div>

      {/* Panel Body */}
      <div className="cell-details-history-panel-body">
        {/* UPDATE TAB */}
        {activeTab === 'multi' && selectedCells.size !== 1 ? (
          /* Update > Mass Update UI (No selection or multiple cells) */
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
                        {selectCells}
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
                  {selectCells === 'Manually' && (
                    <div className="cell-details-history-multi-helper-text">
                      {selectedCells.size > 0 ? (
                        `${selectedCells.size} cell${selectedCells.size === 1 ? '' : 's'} selected`
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#5C5C5C', flexWrap: 'wrap' }}>
                          Hold <span className="cell-details-history-shift-key">Shift</span> key and select multiple cells
                        </span>
                      )}
                    </div>
                  )}
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

                {/* Update and Cancel Buttons */}
                <div className="cell-details-history-multi-actions">
                  <button 
                    className="cell-details-history-multi-cancel-btn"
                    onClick={() => {
                      // Clear form state
                      setSelectCells('Manually');
                      setSelectAction('Mass Update');
                      setRule('Increase');
                      setValue('20%');
                      setBulkNote('');
                      // Clear selection
                      if (onClearSelection) {
                        onClearSelection();
                      }
                    }}
                  >
                    Cancel
                  </button>
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
        ) : activeTab === 'multi' && selectedCells.size === 1 ? (
          /* Update > Single Cell Update UI (exactly 1 cell selected) */
          <div className="cell-details-history-content">
            {/* Cell Info Header */}
            {cellInfo && (
              <div className="cell-details-history-header-compact">
                <span className="cell-details-history-header-value">{cellInfo.measureName || 'N/A'}</span>
                <span className="cell-details-history-header-separator">·</span>
                <span className="cell-details-history-header-value">{cellInfo.timePeriod || 'N/A'}</span>
                <span className="cell-details-history-header-separator">·</span>
                <span className="cell-details-history-header-value">
                  {cellInfo.dimensionPath.length > 0 ? cellInfo.dimensionPath[cellInfo.dimensionPath.length - 1] : 'N/A'}
                </span>
              </div>
            )}
            <div className="cell-details-history-tab-content">
              <div className="cell-details-history-single-update-form">
                  
                  {/* Value Field */}
                  <div className="cell-details-history-multi-field">
                    <label className="cell-details-history-multi-label">New Value</label>
                    <input
                      type="text"
                      className="cell-details-history-multi-input"
                      placeholder="Enter new value"
                    />
                  </div>
                  
                  {/* Adjustment Note */}
                  <div className="cell-details-history-multi-field">
                    <label className="cell-details-history-multi-label">Adjustment Note</label>
                    <textarea
                      className="cell-details-history-multi-textarea"
                      placeholder="Enter adjustment note (optional)"
                      rows={3}
                    />
                  </div>
                  
                  {/* Lock/Unlock Toggle */}
                  <div className="cell-details-history-multi-field">
                    <label className="cell-details-history-lock-toggle">
                      <input type="checkbox" />
                      <span className="cell-details-history-lock-slider"></span>
                      <span className="cell-details-history-lock-label">Lock this cell</span>
                    </label>
                  </div>
                  
                {/* Update Button */}
                <div className="cell-details-history-multi-actions">
                  <button className="cell-details-history-multi-cancel-btn">
                    Cancel
                  </button>
                  <button className="cell-details-history-multi-update-btn">
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'single' && selectedCells.size !== 1 ? (
          /* History > Aggregated History View (No selection = all cells, Multiple = selected cells) */
          <div className="cell-details-history-content">
            {/* Contextual Header with Filter */}
            <div className="cell-details-history-context-header">
              {selectedCells.size === 0 ? (
                <span className="cell-details-history-context-text">Recent changes across all cells</span>
              ) : (
                <span className="cell-details-history-context-text">Changes in {selectedCells.size} selected cells</span>
              )}
              <div className="cell-details-history-filter-wrapper">
                <button
                  ref={filterButtonRef}
                  className={`cell-details-history-filter-btn ${isFilterPopoverOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                  aria-label="Filter history"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                  </svg>
                </button>
                {isFilterPopoverOpen && (
                  <div ref={filterPopoverRef} className="cell-details-history-filter-popover">
                    <div className="cell-details-history-filter-popover-nubbin"></div>
                    <div className="cell-details-history-filter-popover-content">
                      <div className="cell-details-history-filter-field">
                        <label>Date Range</label>
                        <div className="cell-details-history-filter-date-row">
                          <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            placeholder="From"
                          />
                          <span>to</span>
                          <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            placeholder="To"
                          />
                        </div>
                      </div>
                      <div className="cell-details-history-filter-field">
                        <label>User</label>
                        <select
                          value={filterUser}
                          onChange={(e) => setFilterUser(e.target.value)}
                        >
                          <option value="">All users</option>
                          <option value="john-carter">John Carter</option>
                          <option value="sarah-chen">Sarah Chen</option>
                          <option value="mike-johnson">Mike Johnson</option>
                        </select>
                      </div>
                      <div className="cell-details-history-filter-actions">
                        <button
                          className="cell-details-history-filter-clear-btn"
                          onClick={() => {
                            setFilterDateFrom('');
                            setFilterDateTo('');
                            setFilterUser('');
                          }}
                        >
                          Clear
                        </button>
                        <button
                          className="cell-details-history-filter-apply-btn"
                          onClick={() => setIsFilterPopoverOpen(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="cell-details-history-tab-content">
                <div className="cell-details-history-multi-history">
                  {/* Edit History Thread - Latest edit per cell */}
                  <div className="cell-details-history-multi-history-section">
                    <div className="cell-details-history-notes-list">
                      {(() => {
                        // For no selection (size === 0), show all edits; for multiple selection, filter to selected cells
                        const relevantEdits = selectedCells.size === 0 
                          ? editHistory.slice().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                          : editHistory
                              .filter(e => Array.from(selectedCells).some(cellKey => e.cellKey === cellKey))
                              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                        
                        // Helper to generate cell context from entry (Row · Column · Header)
                        const getCellContext = (entry: CellEditHistoryEntry): string => {
                          const cellInfo = extractCellInfo(
                            { rowId: entry.rowId, monthKey: entry.timeKey, measureId: entry.measureId },
                            data,
                            layout
                          );
                          if (!cellInfo) return entry.cellKey;
                          
                          const parts = [];
                          // Row context first (dimension)
                          if (cellInfo.dimensionPath.length > 0) {
                            parts.push(cellInfo.dimensionPath[cellInfo.dimensionPath.length - 1]);
                          }
                          // Column context second (time)
                          if (cellInfo.timePeriod) parts.push(cellInfo.timePeriod);
                          // Header context third (measure)
                          if (cellInfo.measureName) parts.push(cellInfo.measureName);
                          return parts.join(' · ') || entry.cellKey;
                        };
                        
                        // Helper to get full hierarchy path for tooltip
                        const getFullHierarchyPath = (entry: CellEditHistoryEntry): string => {
                          const cellInfo = extractCellInfo(
                            { rowId: entry.rowId, monthKey: entry.timeKey, measureId: entry.measureId },
                            data,
                            layout
                          );
                          if (!cellInfo || cellInfo.dimensionPath.length === 0) return '';
                          return cellInfo.dimensionPath.join(' > ');
                        };
                        
                        // Helper to get dimension type from entry
                        const getDimensionType = (entry: CellEditHistoryEntry): 'account' | 'category' | 'product' | undefined => {
                          const rowId = entry.rowId.toLowerCase();
                          if (rowId.includes('account') || rowId.includes('magnadrive')) return 'account';
                          if (rowId.includes('category') || rowId.includes('chassis') || rowId.includes('transmission') || rowId.includes('powertrain')) return 'category';
                          if (rowId.includes('product') || rowId.includes('trn-') || rowId.includes('chs-') || rowId.includes('pwr-')) return 'product';
                          return 'product'; // default to product
                        };
                        
                        // Get thread color based on dimension type
                        const getThreadColor = (dimType: 'account' | 'category' | 'product' | undefined): string => {
                          switch (dimType) {
                            case 'account': return '#5867E8';
                            case 'category': return '#396547';
                            case 'product': return '#9050E9';
                            default: return '#9050E9';
                          }
                        };
                        
                        // Group edits by cell and get latest per cell
                        const editsByCell = relevantEdits.reduce((acc, edit) => {
                          if (!acc[edit.cellKey]) {
                            acc[edit.cellKey] = [];
                          }
                          acc[edit.cellKey].push(edit);
                          return acc;
                        }, {} as Record<string, CellEditHistoryEntry[]>);
                        
                        // Get only the latest edit per cell, sorted by timestamp
                        const latestEditsPerCell = Object.values(editsByCell)
                          .map(edits => edits[0]) // First one is latest (already sorted)
                          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                        
                        // Handler for "View all changes" - sets focused cell, UI automatically adapts
                        const handleViewAllChanges = (entry: CellEditHistoryEntry) => {
                          // Set the focused cell - this will trigger hasSingleSelection to become true
                          if (onSetFocusedCell) {
                            onSetFocusedCell({
                              rowId: entry.rowId,
                              monthKey: entry.timeKey,
                              measureId: entry.measureId
                            });
                          }
                        };
                        
                        return latestEditsPerCell.length > 0 ? (
                          latestEditsPerCell.map((entry, index) => {
                            const dimType = getDimensionType(entry);
                            return (
                              <CellEditHistoryCard 
                                key={entry.id} 
                                entry={entry}
                                replies={cardReplies[entry.id] || []}
                                onAddReply={handleAddCardReply}
                                isLast={index === latestEditsPerCell.length - 1}
                                isFirst={index === 0}
                                cellContext={getCellContext(entry)}
                                cellContextAsHeader={true}
                                threadColor={getThreadColor(dimType)}
                                dimensionType={dimType}
                                editCountForCell={editsByCell[entry.cellKey].length}
                                onViewAllChanges={() => handleViewAllChanges(entry)}
                                fullHierarchyPath={getFullHierarchyPath(entry)}
                              />
                            );
                          })
                        ) : (
                          <p className="cell-details-history-placeholder">{selectedCells.size === 0 ? 'No edit history available yet' : 'No edits found for selected cells'}</p>
                        );
                      })()}
                      
                      {/* Generic Comments Section (only when no cell selected) */}
                      {selectedCells.size === 0 && genericComments.length > 0 && (
                        <div className="cell-details-history-generic-comments">
                          <div className="cell-details-history-generic-comments-divider">
                            <span>General Comments</span>
                          </div>
                          {genericComments.map((comment, index) => (
                            <div key={comment.id} className="cell-details-history-generic-comment-card">
                              <div className="cell-details-history-generic-comment-bead" style={{ backgroundColor: '#0176D3' }}>
                                {comment.userInitials}
                              </div>
                              <div className="cell-details-history-generic-comment-content">
                                <div className="cell-details-history-generic-comment-header">
                                  <span className="cell-details-history-generic-comment-user">{comment.userName}</span>
                                  <span className="cell-details-history-generic-comment-time">
                                    {comment.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {comment.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </span>
                                </div>
                                <p className="cell-details-history-generic-comment-message">{comment.message}</p>
                              </div>
                              {index < genericComments.length - 1 && (
                                <div className="cell-details-history-generic-comment-line"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </div>
            
            {/* Comment Box (only when no cell selected) */}
            {selectedCells.size === 0 && (
              <div className="cell-details-history-panel-footer">
                <div className="cell-details-history-note-input-section">
                  <label className="cell-details-history-note-label">Comments</label>
                  <textarea
                    className="cell-details-history-note-textarea"
                    value={genericCommentText}
                    onChange={(e) => setGenericCommentText(e.target.value)}
                    placeholder="Enter a general comment"
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
                    onClick={handlePostGenericComment}
                    disabled={!genericCommentText.trim()}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'single' && selectedCells.size === 1 ? (
          /* History > Single Cell - Full History (exactly 1 cell selected) */
          <div className="cell-details-history-content">
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
                <div 
                  className="cell-details-history-hierarchy-info-wrapper"
                  onMouseEnter={() => setIsHierarchyPopoverOpen(true)}
                  onMouseLeave={() => setIsHierarchyPopoverOpen(false)}
                >
                  <button
                    ref={hierarchyButtonRef}
                    className="cell-details-history-hierarchy-button-compact"
                    onFocus={() => setIsHierarchyPopoverOpen(true)}
                    onBlur={() => setIsHierarchyPopoverOpen(false)}
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
              </div>
            )}
              <div className="cell-details-history-tab-content">
                {/* Edit History Section */}
                <div className="cell-details-history-notes-section">
                  {/* History List */}
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
                      <div className="cell-details-history-empty-state-content">
                        {hasFocusedCell && (
                          <div className="cell-details-history-empty-illustration">
                            <svg width="304" height="192" viewBox="0 0 304 192" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M132 32L192 152H72L132 32Z" fill="#C1D5FF"/>
                              <path d="M174.453 24.6162C174.297 24.1951 173.703 24.1951 173.547 24.6162L172.388 27.7471C172.278 28.0437 172.044 28.2779 171.747 28.3877L168.616 29.5469C168.195 29.7027 168.195 30.2973 168.616 30.4531L171.747 31.6123C172.044 31.7221 172.278 31.9563 172.388 32.2529L173.547 35.3838C173.703 35.8049 174.297 35.8049 174.453 35.3838L175.612 32.2529C175.722 31.9563 175.956 31.7221 176.253 31.6123L179.384 30.4531C179.805 30.2973 179.805 29.7027 179.384 29.5469L176.253 28.3877C175.956 28.2779 175.722 28.0437 175.612 27.7471L174.453 24.6162Z" stroke="#7097FF" strokeWidth="0.6"/>
                              <path d="M77.265 56.5117C77.5175 55.8294 78.4825 55.8294 78.735 56.5117L79.8937 59.6433C79.9731 59.8578 80.1422 60.0269 80.3567 60.1063L83.4883 61.265C84.1706 61.5175 84.1706 62.4825 83.4883 62.735L80.3567 63.8937C80.1422 63.9731 79.9731 64.1422 79.8937 64.3567L78.735 67.4883C78.4825 68.1706 77.5175 68.1706 77.265 67.4883L76.1063 64.3567C76.0269 64.1422 75.8578 63.9731 75.6433 63.8937L72.5117 62.735C71.8294 62.4825 71.8294 61.5175 72.5117 61.265L75.6433 60.1063C75.8578 60.0269 76.0269 59.8578 76.1063 59.6433L77.265 56.5117Z" fill="#2E52B4"/>
                              <path d="M228.477 72.3319C228.313 71.8894 227.687 71.8894 227.523 72.3319L226.742 74.4422C226.691 74.5813 226.581 74.691 226.442 74.7424L224.332 75.5233C223.889 75.6871 223.889 76.3129 224.332 76.4767L226.442 77.2576C226.581 77.309 226.691 77.4187 226.742 77.5578L227.523 79.6681C227.687 80.1106 228.313 80.1106 228.477 79.6681L229.258 77.5578C229.309 77.4187 229.419 77.309 229.558 77.2576L231.668 76.4767C232.111 76.3129 232.111 75.6871 231.668 75.5233L229.558 74.7424C229.419 74.691 229.309 74.5813 229.258 74.4422L228.477 72.3319Z" fill="#2E52B4"/>
                              <path d="M196 88C196 80.5739 193.05 73.452 187.799 68.201C182.548 62.95 175.426 60 168 60C160.574 60 153.452 62.95 148.201 68.201C142.95 73.452 140 80.5739 140 88L168 88L196 88Z" fill="#DFEAFE"/>
                              <path d="M147 88C147 83.7565 145.367 79.6869 142.46 76.6863C139.553 73.6857 135.611 72 131.5 72C127.389 72 123.447 73.6857 120.54 76.6863C117.633 79.6869 116 83.7565 116 88L131.5 88L147 88Z" fill="#DFEAFE"/>
                              <path d="M40 128C40 117.391 44.2143 107.14 51.7157 99.6388C59.2172 92.1374 69.3913 87.9231 80 87.9231C90.6087 87.9231 100.783 92.1374 108.284 99.6388C115.786 107.14 120 117.391 120 128L80 127.923L40 128Z" fill="#DFEAFE"/>
                              <path d="M106 128C106 122.982 108.56 118.09 112.022 114.542C115.485 110.993 120.18 109 125.077 109C129.973 109 134.669 110.993 138.131 114.542C141.593 118.09 144 122.982 144 128L125.077 127.921L106 128Z" fill="#DFEAFE"/>
                              <g filter="url(#filter0_ddddii_2091_51862)">
                                <path d="M188 56L136 160H240L188 56Z" fill="url(#paint0_linear_2091_51862)"/>
                                <path d="M188 56L166 100H210L188 56Z" fill="white" fillOpacity="0.4"/>
                              </g>
                              <defs>
                                <filter id="filter0_ddddii_2091_51862" x="133.994" y="53.6591" width="135.1" height="132.425" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                  <feOffset dx="1.33764" dy="1.00323"/>
                                  <feGaussianBlur stdDeviation="1.67205"/>
                                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2091_51862"/>
                                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                  <feOffset dx="4.68174" dy="4.01292"/>
                                  <feGaussianBlur stdDeviation="3.00969"/>
                                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.21 0"/>
                                  <feBlend mode="normal" in2="effect1_dropShadow_2091_51862" result="effect2_dropShadow_2091_51862"/>
                                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                  <feOffset dx="10.7011" dy="9.02906"/>
                                  <feGaussianBlur stdDeviation="4.18012"/>
                                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.13 0"/>
                                  <feBlend mode="normal" in2="effect2_dropShadow_2091_51862" result="effect3_dropShadow_2091_51862"/>
                                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                  <feOffset dx="19.0614" dy="16.0517"/>
                                  <feGaussianBlur stdDeviation="5.01615"/>
                                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
                                  <feBlend mode="normal" in2="effect3_dropShadow_2091_51862" result="effect4_dropShadow_2091_51862"/>
                                  <feBlend mode="normal" in="SourceGraphic" in2="effect4_dropShadow_2091_51862" result="shape"/>
                                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                  <feOffset dx="-1.00323" dy="-1.00323"/>
                                  <feGaussianBlur stdDeviation="0.501615"/>
                                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"/>
                                  <feBlend mode="normal" in2="shape" result="effect5_innerShadow_2091_51862"/>
                                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                  <feOffset dx="1.00323" dy="1.00323"/>
                                  <feGaussianBlur stdDeviation="0.501615"/>
                                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                  <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0"/>
                                  <feBlend mode="normal" in2="effect5_innerShadow_2091_51862" result="effect6_innerShadow_2091_51862"/>
                                </filter>
                                <linearGradient id="paint0_linear_2091_51862" x1="165.5" y1="94.5" x2="198" y2="145.5" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#A4BCFF"/>
                                  <stop offset="1" stopColor="#648EFF"/>
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                        )}
                        <p className="cell-details-history-placeholder">
                          No cell edit history available for this cell. Edit the value or add a note to see the changes logged here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>
        ) : null}
        
        {/* Panel Footer - Note Input (only for single cell selection in History tab) */}
        {selectedCells.size === 1 && activeTab === 'single' && (
          <div className="cell-details-history-panel-footer">
            <div className="cell-details-history-note-input-section">
              <label className="cell-details-history-note-label">Comments</label>
              <textarea
                className="cell-details-history-note-textarea"
                value={panelNoteText}
                onChange={(e) => setPanelNoteText(e.target.value)}
                placeholder="Enter a comment"
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


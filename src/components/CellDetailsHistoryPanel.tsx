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
  onAddNote?: (rowId: string, monthKey: string, note: string) => void;
}

const CellDetailsHistoryPanel: React.FC<CellDetailsHistoryPanelProps> = ({ 
  isOpen, 
  onClose, 
  focusedCell,
  data = [],
  layout = 'Measures / Dimensions x Time',
  editHistory = [],
  onAddNote
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('single');
  const [isHierarchyPopoverOpen, setIsHierarchyPopoverOpen] = useState(false);
  const [panelNoteText, setPanelNoteText] = useState('');
  const hierarchyButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
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
    
    const filtered = editHistory
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
  }, [focusedCell, editHistory, layout]);
  
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
          <p className="cell-details-history-panel-title">Cell Details and History</p>
          <div className="cell-details-history-panel-info-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
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
        {!hasFocusedCell ? (
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

            {/* Tab Content */}
            {activeTab === 'single' ? (
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
            ) : (
              <div className="cell-details-history-tab-content">
                <p className="cell-details-history-placeholder">Multi-cell details and history content will go here...</p>
              </div>
            )}
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


import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/components/Grid.css';

interface GridToolbarProps {
  onSettingsClick?: () => void;
  onFilterClick?: () => void;
  onNotesClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isSettingsActive?: boolean;
  isFilterActive?: boolean;
  isNotesActive?: boolean;
}

const GridToolbar: React.FC<GridToolbarProps> = ({ 
  onSettingsClick,
  onFilterClick,
  onNotesClick,
  searchValue = '',
  onSearchChange,
  isSettingsActive = false,
  isFilterActive = false,
  isNotesActive = false
}) => {
  const [gridSearchInput, setGridSearchInput] = useState<string>(searchValue);
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external searchValue prop
  useEffect(() => {
    if (searchValue !== gridSearchInput) {
      setGridSearchInput(searchValue);
    }
  }, [searchValue]);

  // Debounced search update
  const handleSearchInputChange = useCallback((value: string) => {
    setGridSearchInput(value);
    
    // Clear existing timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    
    // Set new timer for debounced update
    searchDebounceTimerRef.current = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(value);
      }
    }, 300);
  }, [onSearchChange]);

  // Immediate search on Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
      if (onSearchChange) {
        onSearchChange(gridSearchInput);
      }
    } else if (e.key === 'Escape') {
      setGridSearchInput('');
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
      if (onSearchChange) {
        onSearchChange('');
      }
    }
  }, [gridSearchInput, onSearchChange]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setGridSearchInput('');
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    if (onSearchChange) {
      onSearchChange('');
    }
  }, [onSearchChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="grid-toolbar">
      <div className="grid-search">
        <svg className="grid-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="grid-search-input"
          placeholder="Search in Grid.."
          value={gridSearchInput}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {gridSearchInput && (
          <button
            className="grid-search-clear"
            onClick={handleClearSearch}
            type="button"
            title="Clear search"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="grid-button-group">
        <button className={`grid-button-group-item ${isSettingsActive ? 'active' : ''}`} title="Settings" onClick={onSettingsClick}>
          <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
        <button className={`grid-button-group-item ${isFilterActive ? 'active' : ''}`} title="Filter" onClick={onFilterClick}>
          <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z"/>
          </svg>
        </button>
        <button className="grid-button-group-item" title="Sort">
          <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M8 16V4H6v12H3l4.5 5L12 16H8zm8-12l-4.5 5H16v12h2V9h3L16 4z"/>
          </svg>
        </button>
        <button className="grid-button-group-item" title="Chart">
          <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/>
          </svg>
        </button>
        <button className={`grid-button-group-item ${isNotesActive ? 'active' : ''}`} title="Cell Details & Updates" onClick={onNotesClick}>
          <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </button>
        <button className="grid-button-group-item" title="Alerts">
          <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GridToolbar;


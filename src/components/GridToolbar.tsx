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
  activeFilterCount?: number;
}

const GridToolbar: React.FC<GridToolbarProps> = ({ 
  onSettingsClick,
  onFilterClick,
  onNotesClick,
  searchValue = '',
  onSearchChange,
  isSettingsActive = false,
  isFilterActive = false,
  isNotesActive = false,
  activeFilterCount = 0
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
        <button className={`grid-button-group-item ${isFilterActive ? 'active' : ''}`} title="Filter" onClick={onFilterClick} style={{ position: 'relative' }}>
          <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z"/>
          </svg>
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>
        <button className={`grid-button-group-item ${isNotesActive ? 'active' : ''}`} title="Edit Information" onClick={onNotesClick}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12.7383 12.216L12.4614 12.4929C12.1537 12.8006 11.7537 12.9544 11.3229 12.9544H10.5229C9.78444 12.9544 8.98444 12.3698 8.98444 11.3544V10.5852C8.98444 9.96983 9.26137 9.6006 9.41521 9.38522L12.7383 6.0006C12.8306 5.90829 12.9229 5.69291 12.9229 5.56983V3.01599C12.9229 2.21599 12.246 1.53906 11.446 1.53906H3.56907C2.76908 1.53906 2.09215 2.27752 2.09215 3.01599H1.59985C1.046 3.01599 0.615234 3.47752 0.615234 4.03137C0.615234 4.58522 1.046 5.01599 1.59985 5.01599H2.09215V7.01599H1.59985C1.046 7.01599 0.615234 7.44676 0.615234 8.0006C0.615234 8.55445 1.046 8.98522 1.59985 8.98522H2.09215V10.9852H1.59985C1.046 10.9852 0.615234 11.4468 0.615234 11.9698C0.615234 12.5237 1.046 12.9544 1.59985 12.9544H2.09215C2.09215 13.9391 2.76908 14.4314 3.56907 14.4314H11.446C12.246 14.4314 12.9229 13.7544 12.9229 12.9544V12.3083C12.9229 12.1544 12.8614 12.1237 12.7383 12.216V12.216ZM10.2153 5.262C10.2153 5.53892 9.99987 5.75431 9.72295 5.75431H4.79988C4.52296 5.75431 4.30758 5.53892 4.30758 5.262V4.76969C4.30758 4.49277 4.52296 4.27738 4.79988 4.27738H9.72295C9.99987 4.27738 10.2153 4.49277 10.2153 4.76969V5.262ZM7.99988 11.2317C7.99988 11.5086 7.78449 11.724 7.50757 11.724H4.79988C4.52296 11.724 4.30758 11.5086 4.30758 11.2317V10.7394C4.30758 10.4624 4.52296 10.2471 4.79988 10.2471H7.50757C7.78449 10.2471 7.99988 10.4624 7.99988 10.7394V11.2317ZM8.73834 8.24728C8.73834 8.5242 8.52295 8.73959 8.24603 8.73959H4.79988C4.52296 8.73959 4.30758 8.5242 4.30758 8.24728V7.75497C4.30758 7.47805 4.52296 7.26267 4.79988 7.26267H8.24603C8.52295 7.26267 8.73834 7.47805 8.73834 7.75497V8.24728ZM15.2306 6.89245L14.9229 6.58476C14.7383 6.40014 14.4306 6.40014 14.246 6.58476L10.4922 10.4617C10.4614 10.4617 10.4614 10.5232 10.4614 10.5232V11.354C10.4614 11.4155 10.4614 11.4771 10.523 11.4771H11.323C11.3537 11.4771 11.3845 11.4463 11.4153 11.4463L15.1999 7.63091C15.446 7.41553 15.446 7.10784 15.2306 6.89245V6.89245Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GridToolbar;


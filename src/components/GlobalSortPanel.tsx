import React, { useState, useEffect } from 'react';
import '../styles/components/FiltersPanel.css';
import '../styles/components/GlobalSortPanel.css';

export interface SortCriterion {
  id: string;
  columnKey: string;
  direction: 'asc' | 'desc';
}

export interface GlobalSortConfig {
  criteria: SortCriterion[];
  preserveHierarchy: boolean;
  sortMeasures: boolean;
}

interface GlobalSortPanelProps {
  isOpen: boolean;
  onClose: () => void;
  availableColumns: { key: string; label: string }[];
  initialConfig: GlobalSortConfig;
  onApply: (config: GlobalSortConfig) => void;
  /** When true, "Sort measures" is off, disabled, and cannot be applied on. */
  sortMeasuresDisabled?: boolean;
  /** When false, hide sort criteria strip (section title, rows, Add button). */
  showSortCriteriaSection?: boolean;
  /** Gray bar above criteria (e.g. sort by columns vs calculated fields). */
  sortCriteriaSectionTitle?: string;
  /** Label above the sort picker (e.g. Column vs calculated field). */
  sortPickerFieldLabel?: string;
  placeholderSelectColumn?: string;
  addSortButtonLabel?: string;
}

const GlobalSortPanel: React.FC<GlobalSortPanelProps> = ({
  isOpen,
  onClose,
  availableColumns,
  initialConfig,
  onApply,
  sortMeasuresDisabled = false,
  showSortCriteriaSection = true,
  sortCriteriaSectionTitle = 'Sort by column',
  sortPickerFieldLabel = 'Column',
  placeholderSelectColumn = 'Select a column',
  addSortButtonLabel = 'Add a sort column',
}) => {
  const [criteria, setCriteria] = useState<SortCriterion[]>(
    initialConfig.criteria.length > 0 ? initialConfig.criteria : [{ id: 's-default', columnKey: '', direction: 'asc' }]
  );
  const [preserveHierarchy, setPreserveHierarchy] = useState(initialConfig.preserveHierarchy);
  const [sortMeasures, setSortMeasures] = useState(initialConfig.sortMeasures ?? false);
  const [isDirty, setIsDirty] = useState(false);

  const defaultCriteria = (): SortCriterion[] =>
    initialConfig.criteria.length > 0
      ? initialConfig.criteria
      : [{ id: `s-default`, columnKey: '', direction: 'asc' }];

  useEffect(() => {
    if (isOpen) {
      setCriteria(defaultCriteria());
      setPreserveHierarchy(initialConfig.preserveHierarchy);
      setSortMeasures(sortMeasuresDisabled ? false : (initialConfig.sortMeasures ?? false));
      setIsDirty(false);
    }
  }, [isOpen, sortMeasuresDisabled]);

  const markDirty = () => setIsDirty(true);

  const addCriterion = () => {
    setCriteria(prev => [...prev, { id: `s-${Date.now()}`, columnKey: '', direction: 'asc' }]);
    markDirty();
  };

  const removeCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
    markDirty();
  };

  const updateColumn = (id: string, columnKey: string) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, columnKey } : c));
    markDirty();
  };

  const updateDirection = (id: string, direction: 'asc' | 'desc') => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, direction } : c));
    markDirty();
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setCriteria(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    markDirty();
  };

  const moveDown = (index: number) => {
    setCriteria(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    markDirty();
  };

  const sortMeasuresApplied = sortMeasuresDisabled ? false : sortMeasures;

  const handleApply = () => {
    const validCriteria = criteria.filter(c => c.columnKey !== '');
    onApply({ criteria: validCriteria, preserveHierarchy, sortMeasures: sortMeasuresApplied });
    setIsDirty(false);
    onClose();
  };

  const handleCancel = () => {
    setCriteria(initialConfig.criteria);
    setPreserveHierarchy(initialConfig.preserveHierarchy);
    setSortMeasures(sortMeasuresDisabled ? false : (initialConfig.sortMeasures ?? false));
    setIsDirty(false);
  };

  /** Match Filters panel: Cancel reverts and closes the side panel */
  const handleHeaderCancel = () => {
    handleCancel();
    onClose();
  };

  const handleClearAll = () => {
    setCriteria([]);
    onApply({ criteria: [], preserveHierarchy, sortMeasures: sortMeasuresApplied });
    setIsDirty(false);
  };

  if (!isOpen) return null;

  return (
    <div className="sort-panel">
      {/* Panel Header */}
      <div className="sort-panel-header">
        {isDirty ? (
          <>
            <button type="button" className="filters-header-cancel-btn" onClick={handleHeaderCancel}>
              Cancel
            </button>
            <div className="filters-panel-header-actions">
              <button type="button" className="filters-header-apply-only-btn" onClick={handleApply}>
                Apply
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="sort-panel-title-section">
              <button className="sort-panel-back-button" onClick={onClose} aria-label="Back">
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.923 9.84655C17.2922 9.47731 17.2922 8.92343 16.923 8.55419L9.9076 1.47695C9.53837 1.1077 8.98452 1.1077 8.61529 1.47695L1.5384 8.55419C1.16917 8.92343 1.16917 9.47731 1.5384 9.84655L2.8307 11.1389C3.19993 11.5082 3.75377 11.5082 4.123 11.1389L6.33838 8.92344C6.70761 8.55419 7.38453 8.80035 7.38453 9.35422V22.401C7.38453 22.8933 7.8153 23.3241 8.3076 23.3241H10.1537C10.6461 23.3241 11.0768 22.8318 11.0768 22.401V9.35422C11.0768 8.80035 11.7537 8.55419 12.123 8.92344L14.3383 11.1389C14.7076 11.5082 15.2614 11.5082 15.6307 11.1389L16.923 9.84655V9.84655ZM30.4617 22.1535L29.1694 20.9226C28.8001 20.5534 28.2463 20.5534 27.8771 20.9226L25.6617 23.1381C25.2924 23.5074 24.6155 23.2612 24.6155 22.7073V9.53752C24.6155 9.04519 24.1848 8.61441 23.6925 8.61441H21.8463C21.354 8.61441 20.9232 9.10674 20.9232 9.53752V22.5843C20.9232 23.1381 20.2463 23.3843 19.8771 23.015L17.6617 20.7996C17.2925 20.4303 16.7386 20.4303 16.3694 20.7996L15.0771 22.1535C14.7079 22.5227 14.7079 23.0766 15.0771 23.4458L22.154 30.5231C22.5232 30.8923 23.0771 30.8923 23.4463 30.5231L30.5232 23.4458C30.8309 23.0766 30.8309 22.4612 30.4617 22.1535V22.1535Z" fill="#0250D9"/>
                </svg>
              </button>
              <p className="sort-panel-title">Sort</p>
            </div>
            <div className="sort-panel-actions">
              <button className="sort-panel-close" onClick={onClose} aria-label="Close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Panel Body */}
      <div className="sort-panel-body">

        <div className="sort-panel-settings">
          <h3 className="sort-panel-settings-heading">Sort settings</h3>
          <button
            type="button"
            className="sort-panel-hierarchy-row"
            aria-pressed={preserveHierarchy}
            onClick={() => { setPreserveHierarchy(v => !v); markDirty(); }}
          >
            <span className={`sort-panel-checkbox${preserveHierarchy ? ' checked' : ''}`} aria-hidden>
              {preserveHierarchy && (
                <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className="sort-panel-hierarchy-label">Preserve hierarchy on sort</span>
          </button>
          <button
            type="button"
            className="sort-panel-hierarchy-row"
            disabled={sortMeasuresDisabled}
            aria-pressed={sortMeasuresApplied}
            onClick={() => {
              if (sortMeasuresDisabled) return;
              setSortMeasures(v => !v);
              markDirty();
            }}
          >
            <span className={`sort-panel-checkbox${sortMeasuresApplied ? ' checked' : ''}`} aria-hidden>
              {sortMeasuresApplied && (
                <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className="sort-panel-hierarchy-label">Sort measures</span>
          </button>
          {showSortCriteriaSection && (
            <div className="sort-panel-section-header">
              <p className="sort-panel-section-title">{sortCriteriaSectionTitle}</p>
            </div>
          )}
        </div>

        {/* Criteria list */}
        {showSortCriteriaSection && criteria.map((criterion, index) => {
          const otherKeys = new Set(criteria.filter(c => c.id !== criterion.id).map(c => c.columnKey));
          const options = availableColumns.filter(col => !otherKeys.has(col.key));
          const sectionLabel = index === 0 ? 'Sort by' : 'Then by';

          return (
            <div key={criterion.id} className="sort-criterion-section">
              <div className="sort-criterion-label">{sectionLabel}</div>
              <div className="sort-criterion-row">

                {/* Reorder arrows */}
                <div className="sort-reorder-group">
                  <button
                    type="button"
                    className="sort-arrow-btn"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="sort-arrow-btn"
                    onClick={() => moveDown(index)}
                    disabled={index === criteria.length - 1}
                    title="Move down"
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Column dropdown */}
                <div className="sort-col-field">
                  <label className="sort-col-field-label" htmlFor={`sort-col-${criterion.id}`}>
                    {sortPickerFieldLabel}
                  </label>
                  <div className="sort-col-select-wrap">
                    <select
                      id={`sort-col-${criterion.id}`}
                      className="sort-col-select"
                      value={criterion.columnKey}
                      onChange={e => updateColumn(criterion.id, e.target.value)}
                    >
                      <option value="">{placeholderSelectColumn}</option>
                      {options.map(col => (
                        <option key={col.key} value={col.key}>{col.label}</option>
                      ))}
                    </select>
                    <svg className="sort-col-select-caret" viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Radio: Ascending / Descending */}
                <div className="sort-radio-group">
                  <label className="sort-radio-label" onClick={() => updateDirection(criterion.id, 'asc')}>
                    <div className={`sort-radio${criterion.direction === 'asc' ? ' checked' : ''}`}>
                      {criterion.direction === 'asc' && <div className="sort-radio-dot"/>}
                    </div>
                    Ascending
                  </label>
                  <label className="sort-radio-label" onClick={() => updateDirection(criterion.id, 'desc')}>
                    <div className={`sort-radio${criterion.direction === 'desc' ? ' checked' : ''}`}>
                      {criterion.direction === 'desc' && <div className="sort-radio-dot"/>}
                    </div>
                    Descending
                  </label>
                </div>

                {/* Trash */}
                <button
                  type="button"
                  className="sort-trash-btn"
                  onClick={() => removeCriterion(criterion.id)}
                  title="Remove"
                >
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add button — right below the last criterion block */}
        {showSortCriteriaSection && (
          <button className="sort-add-btn" onClick={addCriterion}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            {addSortButtonLabel}
          </button>
        )}

        {/* Remove All link at the bottom */}
        {showSortCriteriaSection && criteria.some(c => c.columnKey !== '') && (
          <div className="filters-actions" style={{ marginTop: 'auto' }}>
            <button className="filters-link filters-link-right" onClick={handleClearAll}>
              Remove All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSortPanel;

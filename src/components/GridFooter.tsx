import React from 'react';
import '../styles/components/GridFooter.css';

interface GridFooterProps {
  isVisible: boolean;
  impactedMeasuresCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showOnlyImpactedKPI: boolean;
  onToggleShowOnlyImpactedKPI: (checked: boolean) => void;
}

const GridFooter: React.FC<GridFooterProps> = ({
  isVisible,
  impactedMeasuresCount,
  onUndo,
  onRedo,
  onCancel,
  onSave,
  canUndo,
  canRedo,
  showOnlyImpactedKPI,
  onToggleShowOnlyImpactedKPI,
}) => {
  console.log('[FOOTER] Rendering footer. isVisible:', isVisible, 'impactedMeasuresCount:', impactedMeasuresCount);
  
  if (!isVisible) {
    console.log('[FOOTER] Footer not visible, returning null');
    return null;
  }
  
  console.log('[FOOTER] Footer visible, showing. impactedMeasuresCount:', impactedMeasuresCount);

  return (
    <div className="grid-footer">
      <div className="grid-footer-left">
        <button className="grid-footer-button grid-footer-button-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
      
      <div className="grid-footer-center">
        {impactedMeasuresCount > 0 && (
          <div className="grid-footer-warning">
            <svg className="grid-footer-warning-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#DD7A01"/>
            </svg>
            <span className="grid-footer-warning-text">
              4 Measures are impacted by this edit
            </span>
            <span className="grid-footer-separator">•</span>
            <label className="grid-footer-checkbox-label">
              <input
                type="checkbox"
                className="grid-footer-checkbox"
                checked={showOnlyImpactedKPI}
                onChange={(e) => onToggleShowOnlyImpactedKPI(e.target.checked)}
              />
              <span className="grid-footer-checkbox-text">Show Only Impacted Measures</span>
            </label>
          </div>
        )}
      </div>
      
      <div className="grid-footer-right">
        <div className="grid-footer-button-group">
          <button
            className="grid-footer-icon-button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <svg className="grid-footer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill="#0250D9"/>
            </svg>
          </button>
          <button
            className="grid-footer-icon-button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <svg className="grid-footer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" fill="#0250D9"/>
            </svg>
          </button>
        </div>
        <button className="grid-footer-button grid-footer-button-brand" onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default GridFooter;


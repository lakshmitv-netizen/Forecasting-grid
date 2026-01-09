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
            <svg className="grid-footer-warning-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M31.6308 26.1508L17.5384 3.3614C16.8 2.12953 15.2 2.12953 14.4615 3.3614L0.369217 26.1508C-0.492322 27.5675 0.369217 29.5385 1.90768 29.5385H30.0923C31.6308 29.5385 32.5538 27.5675 31.6308 26.1508ZM16 24.6104C14.9538 24.6104 14.1538 23.8097 14.1538 22.7626C14.1538 21.7155 14.9538 20.9148 16 20.9148C17.0461 20.9148 17.8461 21.7155 17.8461 22.7626C17.8461 23.8097 17.0461 24.6104 16 24.6104ZM17.8461 19.0674C17.8461 19.4369 17.6 19.6833 17.2307 19.6833H14.7692C14.4 19.6833 14.1538 19.4369 14.1538 19.0674V11.0603C14.1538 10.6907 14.4 10.4443 14.7692 10.4443H17.2307C17.6 10.4443 17.8461 10.6907 17.8461 11.0603V19.0674Z" fill="#CA8501"/>
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
          Save Grid
        </button>
      </div>
    </div>
  );
};

export default GridFooter;


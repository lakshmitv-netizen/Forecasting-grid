import React from 'react';
import '../styles/components/GridFooter.css';

interface GridFooterProps {
  isVisible: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const GridFooter: React.FC<GridFooterProps> = ({
  isVisible,
  onUndo,
  onRedo,
  onCancel,
  onSave,
  canUndo,
  canRedo,
}) => {
  console.log('[FOOTER] Rendering footer. isVisible:', isVisible);
  
  if (!isVisible) {
    console.log('[FOOTER] Footer not visible, returning null');
    return null;
  }
  
  console.log('[FOOTER] Footer visible, showing.');

  return (
    <div className="grid-footer">
      <div className="grid-footer-left">
        <button className="grid-footer-button grid-footer-button-outline" onClick={onCancel}>
          Cancel
        </button>
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
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default GridFooter;


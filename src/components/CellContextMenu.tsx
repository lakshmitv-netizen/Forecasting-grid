import React, { useEffect, useRef } from 'react';
import '../styles/components/CellContextMenu.css';

interface CellContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onToggleLock: () => void;
  isLocked: boolean;
  canPaste: boolean;
  isEditable: boolean;
}

const CellContextMenu: React.FC<CellContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onCopy,
  onPaste,
  onToggleLock,
  isLocked,
  canPaste,
  isEditable
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div 
      className="cell-context-menu"
      ref={menuRef}
      style={{ left: position.x, top: position.y }}
    >
      {/* Copy */}
      <button 
        className="cell-context-menu-item"
        onClick={() => handleAction(onCopy)}
      >
        <svg className="cell-context-menu-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        <span className="cell-context-menu-label">Copy</span>
        <span className="cell-context-menu-shortcut">⌘C</span>
      </button>

      {/* Paste */}
      <button 
        className={`cell-context-menu-item ${!canPaste || !isEditable ? 'disabled' : ''}`}
        onClick={() => canPaste && isEditable && handleAction(onPaste)}
        disabled={!canPaste || !isEditable}
      >
        <svg className="cell-context-menu-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
        </svg>
        <span className="cell-context-menu-label">Paste</span>
        <span className="cell-context-menu-shortcut">⌘V</span>
      </button>

      <div className="cell-context-menu-separator" />

      {/* Lock/Unlock */}
      <button 
        className="cell-context-menu-item"
        onClick={() => handleAction(onToggleLock)}
      >
        <svg className="cell-context-menu-icon" viewBox="0 0 24 24" fill="currentColor">
          {isLocked ? (
            <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z"/>
          ) : (
            <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
          )}
        </svg>
        <span className="cell-context-menu-label">{isLocked ? 'Unlock Cell' : 'Lock Cell'}</span>
      </button>
    </div>
  );
};

export default CellContextMenu;


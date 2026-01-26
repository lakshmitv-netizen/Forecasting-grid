import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/FillHandle.css';

interface FillHandleProps {
  cellKey: string;
  cellElement: HTMLElement | null;
  onDragStart?: (cellKey: string) => void;
  onDragMove?: (cellKey: string) => void;
  onDragEnd?: () => void;
}

const FillHandle: React.FC<FillHandleProps> = ({
  cellKey,
  cellElement,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Find the cell under the mouse cursor
      const target = e.target as HTMLElement;
      const cellElement = target.closest('.grid-cell');
      if (cellElement) {
        const targetCellKey = cellElement.getAttribute('data-cell-key');
        if (targetCellKey && targetCellKey !== cellKey && onDragMove) {
          onDragMove(targetCellKey);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onDragEnd) {
        onDragEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, cellKey, onDragMove, onDragEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(cellKey);
    }
  };

  if (!cellElement) return null;

  return (
    <div
      ref={handleRef}
      className="fill-handle"
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        bottom: '-4px',
        right: '-4px',
        width: '8px',
        height: '8px',
        cursor: 'crosshair',
        zIndex: 1000,
      }}
    />
  );
};

export default FillHandle;

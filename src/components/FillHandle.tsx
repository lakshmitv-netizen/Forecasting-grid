import React, { useState, useEffect } from 'react';
import { useIsGrid264UpdatedExperience } from '../contexts/IndustryContext';
import '../styles/components/FillHandle.css';

interface FillHandleProps {
  cellKey: string;
  onDragStart?: (cellKey: string) => void;
  onDragMove?: (cellKey: string) => void;
  onDragEnd?: () => void;
}

const FillHandle: React.FC<FillHandleProps> = ({
  cellKey,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const isGrid264Ux = useIsGrid264UpdatedExperience();
  const [isDragging, setIsDragging] = useState(false);

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

  if (isGrid264Ux) {
    return (
      <button
        type="button"
        className="fill-handle"
        aria-label="Fill down drag handle"
        onMouseDown={handleMouseDown}
      />
    );
  }

  return (
    <div
      className="fill-handle"
      onMouseDown={handleMouseDown}
    />
  );
};

export default FillHandle;

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

interface ResizableHeaderProps {
  id: string;
  label: string;
  width: number;
  onResize: (id: string, newWidth: number) => void;
  onAutoFit: () => void;
  onSort: () => void;
  sortDir: 'asc' | 'desc' | null;
  className?: string;
}

export const ResizableHeader: React.FC<ResizableHeaderProps> = ({ 
  id, label, width, onResize, onSort, sortDir, className = "" 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const deltaX = e.clientX - startX;
    onResize(id, startWidth + deltaX);
  }, [isResizing, startX, startWidth, id, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <th 
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
      className={`relative group select-none border-r border-slate-700 last:border-r-0 bg-slate-900 z-30 ${className}`}
    >
      <div 
        className="flex items-center justify-between px-4 py-5 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={onSort}
      >
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-normal leading-tight">{label}</span>
        {sortDir && (
          <span className="ml-1">
            {sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        )}
      </div>
      
      <div
        onMouseDown={handleMouseDown}
        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-brand-500 transition-colors ${isResizing ? 'bg-brand-500 w-1' : ''}`}
      />
    </th>
  );
};

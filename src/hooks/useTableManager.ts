import { useState, useMemo } from 'react';

export interface ColumnDef {
  id: string;
  label: string;
  defaultWidth: number;
  width?: number;
  visible?: boolean;
  wrap?: boolean;
}

export const useTableManager = (tableId: string, initialColumns: ColumnDef[]) => {
  const [columns, setColumns] = useState<ColumnDef[]>(() => {
    const saved = localStorage.getItem(`table_cols_${tableId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with initial to get any new columns
        return initialColumns.map(col => {
          const savedCol = parsed.find((p: any) => p.id === col.id);
          return savedCol ? { ...col, ...savedCol } : { ...col, visible: true, width: col.defaultWidth };
        });
      } catch (e) {
        console.error('Failed to parse table columns', e);
      }
    }
    return initialColumns.map(col => ({ ...col, visible: true, width: col.defaultWidth }));
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const saveColumns = (newCols: ColumnDef[]) => {
    setColumns(newCols);
    localStorage.setItem(`table_cols_${tableId}`, JSON.stringify(newCols));
  };

  const toggleVisibility = (id: string) => {
    saveColumns(columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const resizeColumn = (id: string, newWidth: number) => {
    saveColumns(columns.map(c => c.id === id ? { ...c, width: Math.max(50, newWidth) } : c));
  };

  const reorderColumn = (dragIndex: number, hoverIndex: number) => {
    const newCols = [...columns];
    const dragCol = newCols[dragIndex];
    newCols.splice(dragIndex, 1);
    newCols.splice(hoverIndex, 0, dragCol);
    saveColumns(newCols);
  };

  const resetToDefaults = () => {
    saveColumns(initialColumns.map(col => ({ ...col, visible: true, width: col.defaultWidth })));
  };

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  return {
    columns,
    visibleColumns,
    isSettingsOpen,
    setIsSettingsOpen,
    toggleVisibility,
    resizeColumn,
    reorderColumn,
    resetToDefaults
  };
};

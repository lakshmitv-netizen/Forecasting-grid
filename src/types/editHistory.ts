export interface CellEditHistoryEntry {
  id: string;
  cellKey: string; // `${rowId}-${monthKey}` or `${rowId}-${measureId}`
  rowId: string;
  timeKey?: string; // monthKey for HierarchicalGrid, measureId for other layouts
  measureId?: string;
  oldValue?: number; // Optional - if undefined, this is just a note entry
  newValue?: number; // Optional - if undefined, this is just a note entry
  note?: string; // Optional - adjustment note associated with this edit
  timestamp: Date;
  userId: string;
  userName: string;
}


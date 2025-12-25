export type RowType = 'measure' | 'account' | 'category' | 'product';

export interface GridRow {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  type: RowType;
  children?: GridRow[];
  values: {
    jan2026: number;
    feb2026: number;
    mar2026: number;
    apr2026: number;
    may2026: number;
    jun2026: number;
    jul2026: number;
    aug2026: number;
    sep2026: number;
    oct2026: number;
    nov2026: number;
    dec2026: number;
  };
}

export interface MeasureData {
  id: string;
  name: string;
  values: {
    jan2026: number;
    feb2026: number;
    mar2026: number;
    apr2026: number;
    may2026: number;
    jun2026: number;
    jul2026: number;
    aug2026: number;
    sep2026: number;
    oct2026: number;
    nov2026: number;
    dec2026: number;
  };
  children: GridRow[];
}


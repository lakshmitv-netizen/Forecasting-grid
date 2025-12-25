export type RowType = 'measure' | 'account' | 'category' | 'product';

export interface GridRow {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  type: RowType;
  children?: GridRow[];
  values: {
    year: number; // FY26 - sum of all months
    q1: number;   // Q1 - sum of Jan, Feb, Mar
    q2: number;   // Q2 - sum of Apr, May, Jun
    q3: number;   // Q3 - sum of Jul, Aug, Sep
    q4: number;   // Q4 - sum of Oct, Nov, Dec
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
    year: number;
    q1: number;
    q2: number;
    q3: number;
    q4: number;
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


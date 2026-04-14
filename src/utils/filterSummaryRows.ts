import { GridRow, MeasureData } from '../types';

const VALUE_KEYS = [
  'year',
  'q1',
  'q2',
  'q3',
  'q4',
  'jan2026',
  'feb2026',
  'mar2026',
  'apr2026',
  'may2026',
  'jun2026',
  'jul2026',
  'aug2026',
  'sep2026',
  'oct2026',
  'nov2026',
  'dec2026',
] as const;

function zeroValues(): GridRow['values'] {
  const v = {} as GridRow['values'];
  for (const k of VALUE_KEYS) (v as Record<string, number>)[k] = 0;
  return v;
}

function cloneValues(src: GridRow['values']): GridRow['values'] {
  const v = {} as GridRow['values'];
  for (const k of VALUE_KEYS) (v as Record<string, number>)[k] = Number(src[k as keyof GridRow['values']] ?? 0);
  return v;
}

function addValues(a: GridRow['values'], b: GridRow['values']): GridRow['values'] {
  const o = zeroValues();
  for (const k of VALUE_KEYS) {
    (o as Record<string, number>)[k] =
      (a[k as keyof GridRow['values']] as number) + (b[k as keyof GridRow['values']] as number);
  }
  return o;
}

export function subtractValues(a: GridRow['values'], b: GridRow['values']): GridRow['values'] {
  const o = zeroValues();
  for (const k of VALUE_KEYS) {
    const diff =
      (a[k as keyof GridRow['values']] as number) - (b[k as keyof GridRow['values']] as number);
    (o as Record<string, number>)[k] = diff > 0 ? diff : 0;
  }
  return o;
}

/** Sum leaf rows only (no children) to avoid double-counting parent rollups. */
export function sumDeepestLeafValues(row: GridRow): GridRow['values'] {
  if (!row.children?.length) return cloneValues(row.values);
  return row.children.reduce((acc, c) => addValues(acc, sumDeepestLeafValues(c)), zeroValues());
}

export function sumForest(rows: GridRow[]): GridRow['values'] {
  return rows.reduce((acc, r) => addValues(acc, sumDeepestLeafValues(r)), zeroValues());
}

function deepCloneRow(row: GridRow): GridRow {
  return JSON.parse(JSON.stringify(row)) as GridRow;
}

function filteredOutLabelForType(t: GridRow['type'], n: number): string | null {
  if (n <= 0) return null;
  if (t === 'account' || t === 'category' || t === 'product') {
    return `Filtered out (${n})`;
  }
  return null;
}

function makeFilteredOutRow(
  id: string,
  name: string,
  parentId: string | null,
  level: number,
  values: GridRow['values'],
  dimension: 'account' | 'category' | 'product',
): GridRow {
  return {
    id,
    name,
    parentId,
    level,
    type: 'filterSummary',
    filterSummaryRole: 'filteredOut',
    filteredOutDimension: dimension,
    values,
    children: undefined,
  };
}

/**
 * Merge filtered direct children (visible) with a single aggregate row for anything
 * present in unfiltered but removed by the filter. Matching rows stay at this level (no wrapper).
 */
function injectMerge(
  unfKids: GridRow[],
  filKids: GridRow[],
  parentRowId: string,
  measureId: string,
): GridRow[] {
  if (unfKids.length === 0) {
    return filKids.map(f => augmentFilteredSubtree(f, measureId));
  }

  const filSet = new Set(filKids.map(f => f.id));
  const unfById = new Map(unfKids.map(u => [u.id, u]));

  const result: GridRow[] = filKids.map(fk => {
    const u = unfById.get(fk.id);
    if (!u) return augmentFilteredSubtree(fk, measureId);
    return augmentMergePair(u, fk, measureId);
  });

  const excluded = unfKids.filter(u => !filSet.has(u.id));
  if (excluded.length > 0) {
    const dim = excluded[0].type;
    const label = filteredOutLabelForType(dim, excluded.length);
    if (label && (dim === 'account' || dim === 'category' || dim === 'product')) {
      const sum = sumForest(excluded);
      const level = excluded[0].level ?? 1;
      const parentId = excluded[0].parentId ?? parentRowId;
      const id = `fo-${dim}-${parentRowId}-${measureId}`.replace(/\s+/g, '-');
      result.push(makeFilteredOutRow(id, label, parentId, level, sum, dim));
    }
  }

  return result;
}

function augmentMergePair(unf: GridRow, fil: GridRow, measureId: string): GridRow {
  const unfC = unf.children;
  if (!unfC?.length) {
    return { ...fil };
  }
  const filC = fil.children ?? [];
  const newChildren = injectMerge(unfC, filC, fil.id, measureId);
  return { ...fil, children: newChildren };
}

function augmentFilteredSubtree(fil: GridRow, measureId: string): GridRow {
  if (!fil.children?.length) return { ...fil };
  const unf = deepCloneRow(fil);
  const newChildren = injectMerge(unf.children ?? [], fil.children, fil.id, measureId);
  return { ...fil, children: newChildren };
}

function augmentMeasure(unf: MeasureData, fil: MeasureData): MeasureData {
  const unfC = unf.children ?? [];
  const filC = fil.children ?? [];
  if (unfC.length === 0) {
    return { ...fil, children: filC.map(c => augmentFilteredSubtree(c, fil.id)) };
  }
  const newChildren = injectMerge(unfC, filC, fil.id, fil.id);
  return { ...fil, children: newChildren };
}

type Dim = 'account' | 'category' | 'product';

function isDim(t: string): t is Dim {
  return t === 'account' || t === 'category' || t === 'product';
}

/**
 * Column filters: siblings that fail the filter are not removed from the UI — they are rolled into
 * the same synthetic "Filtered out (N)" rows used for global (panel) hierarchy filters, merging
 * counts/values into an existing FO row when present or appending a new one (ids use `-cf` suffix).
 * `mappedChildren[i]` is the result of filterRowTree(originalChildren[i]) or null when excluded.
 */
export function mergeColumnFilteredSiblingsIntoTree(
  parentRow: GridRow,
  originalChildren: GridRow[],
  mappedChildren: (GridRow | null)[],
  measureId: string,
): GridRow[] {
  const droppedByDim: Record<Dim, GridRow[]> = {
    account: [],
    category: [],
    product: [],
  };
  const survivors: GridRow[] = [];

  for (let i = 0; i < originalChildren.length; i++) {
    const c = originalChildren[i];
    const fc = mappedChildren[i];
    if (c.type === 'filterSummary') {
      if (fc) survivors.push(fc);
      continue;
    }
    if (fc !== null) {
      survivors.push(fc);
      continue;
    }
    if (isDim(c.type)) {
      droppedByDim[c.type].push(c);
    }
  }

  let out = [...survivors];
  const dims: Dim[] = ['account', 'category', 'product'];
  for (const dim of dims) {
    const dropped = droppedByDim[dim];
    if (dropped.length === 0) continue;

    const sumVals = dropped.reduce(
      (acc, r) => addValues(acc, sumDeepestLeafValues(r)),
      zeroValues(),
    );
    const foIdx = out.findIndex(
      r =>
        r.type === 'filterSummary' &&
        r.filterSummaryRole === 'filteredOut' &&
        r.filteredOutDimension === dim,
    );
    if (foIdx >= 0) {
      const fo = out[foIdx];
      const match = /^Filtered out \((\d+)\)$/.exec(fo.name);
      const baseN = match ? parseInt(match[1], 10) : 0;
      out[foIdx] = {
        ...fo,
        name: `Filtered out (${baseN + dropped.length})`,
        values: addValues(cloneValues(fo.values), sumVals),
      };
    } else {
      const parentId = dropped[0].parentId ?? parentRow.id;
      const level = dropped[0].level ?? (parentRow.level ?? 0) + 1;
      const id = `fo-${dim}-${parentRow.id}-${measureId}-cf`.replace(/\s+/g, '-');
      out.push(
        makeFilteredOutRow(
          id,
          `Filtered out (${dropped.length})`,
          parentId,
          level,
          sumVals,
          dim,
        ),
      );
    }
  }
  return out;
}

type TopBottomDim = 'account' | 'category' | 'product';

/**
 * When "preserve hierarchy" is off and Top/Bottom N applies globally: show only rows of `targetDim`
 * that pass `rowPassesFilters`, plus one aggregate "Filtered out (N)" for everything else under the measure.
 */
export function mergeGlobalTopBottomNMeasureChildren(
  measureRow: GridRow,
  targetDim: TopBottomDim,
  rowPassesFilters: (r: GridRow) => boolean,
): GridRow[] {
  const collectOfDimension = (nodes: GridRow[] | undefined): GridRow[] => {
    if (!nodes?.length) return [];
    const out: GridRow[] = [];
    for (const n of nodes) {
      if (n.type === targetDim) out.push(n);
      out.push(...collectOfDimension(n.children));
    }
    return out;
  };

  const allTarget = collectOfDimension(measureRow.children);
  const passing = allTarget.filter(rowPassesFilters);

  const measureTotal = sumForest(measureRow.children ?? []);
  let visibleSum = zeroValues();
  for (const r of passing) {
    visibleSum = addValues(visibleSum, sumDeepestLeafValues(r));
  }
  const foVals = subtractValues(measureTotal, visibleSum);

  /** Same-dimension rows that did not pass the filter (e.g. plants outside Top N), not total tree node count. */
  const excludedCount = Math.max(0, allTarget.length - passing.length);

  // Keep original parentId (and level) so GridRow can resolve ancestor names for the flattened
  // hierarchy subtitle; only the displayed tree is flat under the measure.
  const visible = passing.map(r => ({
    ...deepCloneRow(r),
    children: undefined,
  }));

  if (excludedCount === 0) {
    return visible;
  }

  const label = filteredOutLabelForType(targetDim, excludedCount);
  if (!label) {
    return visible;
  }

  const fo = makeFilteredOutRow(
    `${measureRow.id}-filtered-out-global-topbottom`,
    label,
    measureRow.id,
    1,
    foVals,
    targetDim,
  );

  return [...visible, fo];
}

export function injectFilterSummaryRows(
  filtered: MeasureData[],
  unfiltered: MeasureData[],
): MeasureData[] {
  const unfMap = new Map(unfiltered.map(m => [m.id, m]));
  return filtered.map(fm => {
    const um = unfMap.get(fm.id);
    if (!um) return fm;
    return augmentMeasure(um, fm);
  });
}

/** True if any measure tree contains a filtered-out aggregate (filter summary) row. */
export function hasFilteredOutSummaryRows(measures: MeasureData[]): boolean {
  const walk = (rows: GridRow[] | undefined): boolean => {
    if (!rows?.length) return false;
    for (const r of rows) {
      if (r.type === 'filterSummary' && r.filterSummaryRole === 'filteredOut') return true;
      if (walk(r.children)) return true;
    }
    return false;
  };
  return measures.some(m => walk(m.children));
}

/** Remove synthetic filter summary rows for persistence. */
export function stripFilterSummaryRows(measures: MeasureData[]): MeasureData[] {
  return measures.map(m => ({
    ...m,
    children: m.children ? stripGridRows(m.children) : [],
  }));
}

function stripGridRows(children: GridRow[]): GridRow[] {
  return children.flatMap(c => {
    if (c.type === 'filterSummary') {
      return [];
    }
    return [stripGridRowDeep(c)];
  });
}

function stripGridRowDeep(row: GridRow): GridRow {
  if (!row.children?.length) return row;
  return { ...row, children: stripGridRows(row.children) };
}

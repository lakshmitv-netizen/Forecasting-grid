import { MeasureData, GridRow } from '../types';

type MonthKey = keyof GridRow['values'];

// Flatten the hierarchy to make searching easier
const flattenHierarchy = (data: MeasureData[]): GridRow[] => {
  const result: GridRow[] = [];
  
  const traverse = (rows: GridRow[]) => {
    for (const row of rows) {
      result.push(row);
      if (row.children) {
        traverse(row.children);
      }
    }
  };
  
  for (const measure of data) {
    traverse(measure.children);
  }
  
  return result;
};

// Find a row by ID
export const findRowById = (rowId: string, data: MeasureData[]): GridRow | null => {
  const allRows = flattenHierarchy(data);
  return allRows.find(row => row.id === rowId) || null;
};

// Find parent row
export const findParentRow = (rowId: string, data: MeasureData[]): GridRow | null => {
  const row = findRowById(rowId, data);
  if (!row || !row.parentId) return null;
  
  // Check if parent is a measure
  const measure = data.find(m => m.id === row.parentId);
  if (measure) return null; // Parent is a measure, no GridRow parent
  
  return findRowById(row.parentId, data);
};

// Get all direct children of a row
export const getChildren = (rowId: string, data: MeasureData[]): GridRow[] => {
  const row = findRowById(rowId, data);
  return row?.children || [];
};

// Get all descendants (children, grandchildren, etc.)
export const getAllDescendants = (rowId: string, data: MeasureData[]): GridRow[] => {
  const result: GridRow[] = [];
  const children = getChildren(rowId, data);
  
  for (const child of children) {
    result.push(child);
    result.push(...getAllDescendants(child.id, data));
  }
  
  return result;
};

// Get all ancestors (parent, grandparent, etc.)
export const getAllAncestors = (rowId: string, data: MeasureData[]): GridRow[] => {
  const result: GridRow[] = [];
  let current = findParentRow(rowId, data);
  
  while (current) {
    result.push(current);
    current = findParentRow(current.id, data);
  }
  
  return result;
};

// Calculate proportional distribution of delta among children
export const distributeProportionally = (
  delta: number,
  children: GridRow[],
  monthKey: MonthKey
): Map<string, number> => {
  const distribution = new Map<string, number>();
  
  if (children.length === 0) return distribution;
  
  // Calculate current total
  const currentTotal = children.reduce((sum, child) => sum + child.values[monthKey], 0);
  
  if (currentTotal === 0) {
    // Equal distribution if all zeros
    const equalDelta = delta / children.length;
    children.forEach(child => distribution.set(child.id, equalDelta));
  } else {
    // Proportional distribution
    children.forEach(child => {
      const proportion = child.values[monthKey] / currentTotal;
      const childDelta = delta * proportion;
      distribution.set(child.id, childDelta);
    });
  }
  
  return distribution;
};

// Calculate measure value from sum of its children
export const calculateMeasureValue = (
  measureId: string,
  monthKey: MonthKey,
  data: MeasureData[]
): number => {
  const measure = data.find(m => m.id === measureId);
  if (!measure || !measure.children || measure.children.length === 0) {
    return 0;
  }
  
  return measure.children.reduce((sum, child) => sum + child.values[monthKey], 0);
};

// Propagate upward: child → parent → grandparent
export const propagateUpward = (
  rowId: string,
  monthKey: MonthKey,
  delta: number,
  data: MeasureData[]
): { rowId: string; monthKey: MonthKey; newValue: number }[] => {
  const updates: { rowId: string; monthKey: MonthKey; newValue: number }[] = [];
  const ancestors = getAllAncestors(rowId, data);
  
  for (const ancestor of ancestors) {
    const currentValue = ancestor.values[monthKey];
    const newValue = currentValue + delta;
    updates.push({ rowId: ancestor.id, monthKey, newValue });
  }
  
  return updates;
};

// Propagate downward: parent → children → grandchildren
export const propagateDownward = (
  rowId: string,
  monthKey: MonthKey,
  delta: number,
  data: MeasureData[]
): { rowId: string; monthKey: MonthKey; newValue: number }[] => {
  const updates: { rowId: string; monthKey: MonthKey; newValue: number }[] = [];
  const children = getChildren(rowId, data);
  
  if (children.length === 0) return updates;
  
  const distribution = distributeProportionally(delta, children, monthKey);
  
  for (const [childId, childDelta] of distribution.entries()) {
    const child = findRowById(childId, data);
    if (!child) continue;
    
    const currentValue = child.values[monthKey];
    const newValue = currentValue + childDelta;
    updates.push({ rowId: childId, monthKey, newValue });
    
    // Recursively propagate to grandchildren
    const grandchildUpdates = propagateDownward(childId, monthKey, childDelta, data);
    updates.push(...grandchildUpdates);
  }
  
  return updates;
};

// Find measure by row ID
export const findMeasureByRowId = (rowId: string, data: MeasureData[]): MeasureData | null => {
  const row = findRowById(rowId, data);
  if (!row) {
    console.log('[findMeasureByRowId] Row not found for:', rowId);
    return null;
  }
  
  console.log('[findMeasureByRowId] Row found:', { id: row.id, name: row.name, parentId: row.parentId });
  
  // Check if parentId is a measure ID (direct parent is measure)
  if (row.parentId) {
    const measure = data.find(m => m.id === row.parentId);
    if (measure) {
      console.log('[findMeasureByRowId] Found measure via direct parentId:', measure.id);
      return measure;
    }
  }
  
  // Traverse up the hierarchy to find measure
  // First check the current row's parentId
  if (row.parentId) {
    const directMeasure = data.find(m => m.id === row.parentId);
    if (directMeasure) {
      console.log('[findMeasureByRowId] Found measure via direct parentId:', directMeasure.id);
      return directMeasure;
    }
  }
  
  // Traverse up the hierarchy
  let current: GridRow | null = row;
  let depth = 0;
  const maxDepth = 10; // Safety limit
  
  while (current && depth < maxDepth) {
    // Get parent row
    const parent = findParentRow(current.id, data);
    
    if (!parent) {
      // No parent found - check if current's parentId is a measure (this handles account rows)
      if (current.parentId) {
        const measure = data.find(m => m.id === current!.parentId);
        if (measure) {
          console.log('[findMeasureByRowId] Found measure when parent is null:', measure.id);
          return measure;
        }
      }
      break;
    }
    
    // Check if parent's parentId is a measure (this handles account rows whose parent is measure)
    if (parent.parentId) {
      const measure = data.find(m => m.id === parent.parentId);
      if (measure) {
        console.log('[findMeasureByRowId] Found measure via parent.parentId:', measure.id);
        return measure;
      }
    }
    
    current = parent;
    depth++;
  }
  
  console.log('[findMeasureByRowId] No measure found after traversal');
  return null;
};

// Get measure ID from row ID
export const getMeasureIdFromRowId = (rowId: string, data: MeasureData[]): string | null => {
  console.log('[getMeasureIdFromRowId] Looking for measure for rowId:', rowId);
  console.log('[getMeasureIdFromRowId] Available measures:', data.map(m => m.id));
  const measure = findMeasureByRowId(rowId, data);
  console.log('[getMeasureIdFromRowId] Found measure:', measure?.id || 'null');
  return measure?.id || null;
};

// Check if a measure is Sales Agreement
export const isSalesAgreementMeasure = (measureId: string): boolean => {
  return measureId === 'measure-sa-qty' || measureId === 'measure-sa-rev';
};

// Check if a measure is Order
export const isOrderMeasure = (measureId: string): boolean => {
  return measureId === 'measure-order-qty' || measureId === 'measure-order-rev';
};

// Get corresponding Order measure ID from Sales Agreement measure ID
export const getCorrespondingOrderMeasureId = (saMeasureId: string): string | null => {
  if (saMeasureId === 'measure-sa-qty') return 'measure-order-qty';
  if (saMeasureId === 'measure-sa-rev') return 'measure-order-rev';
  return null;
};

// Calculate unit price from revenue and quantity
export const calculateUnitPrice = (
  revenueRowId: string,
  quantityRowId: string,
  monthKey: MonthKey,
  data: MeasureData[]
): number | null => {
  const revenueRow = findRowById(revenueRowId, data);
  const quantityRow = findRowById(quantityRowId, data);
  
  if (!revenueRow || !quantityRow) return null;
  
  const revenue = revenueRow.values[monthKey];
  const quantity = quantityRow.values[monthKey];
  
  if (quantity === 0) return null;
  
  return revenue / quantity;
};

// Get corresponding Revenue measure ID from Quantity measure ID
export const getCorrespondingRevenueMeasureId = (quantityMeasureId: string): string | null => {
  if (quantityMeasureId === 'measure-sa-qty') return 'measure-sa-rev';
  if (quantityMeasureId === 'measure-order-qty') return 'measure-order-rev';
  if (quantityMeasureId === 'measure-forecast-qty') return 'measure-forecast-rev';
  return null;
};

// Get corresponding Quantity measure ID from Revenue measure ID
export const getCorrespondingQuantityMeasureId = (revenueMeasureId: string): string | null => {
  if (revenueMeasureId === 'measure-sa-rev') return 'measure-sa-qty';
  if (revenueMeasureId === 'measure-order-rev') return 'measure-order-qty';
  if (revenueMeasureId === 'measure-forecast-rev') return 'measure-forecast-qty';
  return null;
};

// Get corresponding Forecasted measure ID from Sales Agreement measure ID
export const getCorrespondingForecastedMeasureId = (saMeasureId: string): string | null => {
  if (saMeasureId === 'measure-sa-qty') return 'measure-forecast-qty';
  if (saMeasureId === 'measure-sa-rev') return 'measure-forecast-rev';
  return null;
};

// Update cross-measure dependencies
export const updateCrossMeasureDependencies = (
  rowId: string,
  monthKey: MonthKey,
  newValue: number,
  data: MeasureData[]
): { rowId: string; monthKey: MonthKey; newValue: number }[] => {
  const updates: { rowId: string; monthKey: MonthKey; newValue: number }[] = [];
  
  console.log('[CROSS-MEASURE] Function called:', { rowId, monthKey, newValue, dataLength: data.length });
  
  // Check if rowId is itself a measure ID (measure-level edit)
  const directMeasure = data.find(m => m.id === rowId);
  let measureId: string | null = null;
  let row: GridRow | null = null;
  let path: string[] = [];
  
  if (directMeasure) {
    // This is a measure-level edit
    measureId = rowId;
    console.log('[CROSS-MEASURE] RowId is a measure ID:', measureId);
    // For measure-level edits, path is empty (we'll update all account rows)
    path = [];
  } else {
    // This is a child row edit
    measureId = getMeasureIdFromRowId(rowId, data);
    console.log('[CROSS-MEASURE] measureId from row:', measureId);
    
    if (!measureId) {
      console.log('[CROSS-MEASURE] No measureId found, returning empty');
      return updates;
    }
    
    row = findRowById(rowId, data);
    console.log('[CROSS-MEASURE] Row found:', row ? { name: row.name, id: row.id, parentId: row.parentId } : 'null');
    
    if (!row) {
      console.log('[CROSS-MEASURE] Row not found, returning empty');
      return updates;
    }
    
    // Build hierarchy path (from account to the edited row)
    let current: GridRow | null = row;
    while (current) {
      path.push(current.name);
      current = findParentRow(current.id, data);
    }
    path.reverse(); // Now path[0] = account, path[1] = category (if exists), path[2] = product (if exists)
    
    console.log('[CROSS-MEASURE] Path built:', path);
    
    if (path.length === 0) {
      console.log('[CROSS-MEASURE] Path is empty, returning empty');
      return updates;
    }
  }
  
  // Helper to find row by path in a measure (finds row at same hierarchy level)
  const findRowByPath = (rows: GridRow[], pathIndex: number): GridRow | null => {
    if (pathIndex >= path.length) return null;
    
    for (const row of rows) {
      if (row.name === path[pathIndex]) {
        // If this is the last element in path, we found the target row
        if (pathIndex === path.length - 1) {
          return row;
        }
        // Otherwise, continue searching in children
        if (row.children) {
          const found = findRowByPath(row.children, pathIndex + 1);
          if (found) return found;
        }
      }
    }
    return null;
  };
  
  // Handle measure-level edits (when rowId is a measure ID)
  if (directMeasure) {
    // For measure-level edits, we need to update all account rows proportionally
    
    // Handle Sales Agreement Revenue changes
    if (measureId === 'measure-sa-rev') {
      // 1. Sales Agreement Revenue → Sales Agreement Quantity (reverse: Qty = Rev / Unit Price)
      const quantityMeasureId = 'measure-sa-qty';
      const quantityMeasure = data.find(m => m.id === quantityMeasureId);
      if (quantityMeasure && directMeasure.children.length > 0 && quantityMeasure.children.length > 0) {
        // Calculate unit price from account level
        const revAccount = directMeasure.children[0];
        const qtyAccount = quantityMeasure.children[0];
        const unitPrice = calculateUnitPrice(revAccount.id, qtyAccount.id, monthKey, data);
        if (unitPrice !== null && unitPrice !== 0) {
          const newQuantity = newValue / unitPrice;
          // Update quantity measure
          updates.push({ rowId: quantityMeasureId, monthKey, newValue: newQuantity });
          const qtyDelta = newQuantity - quantityMeasure.values[monthKey];
          if (qtyDelta !== 0 && quantityMeasure.children.length > 0) {
            const accountDistribution = distributeProportionally(qtyDelta, quantityMeasure.children, monthKey);
            for (const [accountId, accountDelta] of accountDistribution.entries()) {
              const account = quantityMeasure.children.find(c => c.id === accountId);
              if (account) {
                const accountNewValue = account.values[monthKey] + accountDelta;
                updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
                const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
                updates.push(...accountUpdates);
              }
            }
          }
        }
      }
      
      // 2. Sales Agreement Revenue → Order Revenue (100%)
      const orderRevenueMeasureId = 'measure-order-rev';
      const orderRevenueMeasure = data.find(m => m.id === orderRevenueMeasureId);
      if (orderRevenueMeasure) {
        // Update order revenue measure
        updates.push({ rowId: orderRevenueMeasureId, monthKey, newValue });
        const orderRevDelta = newValue - orderRevenueMeasure.values[monthKey];
        if (orderRevDelta !== 0 && orderRevenueMeasure.children.length > 0) {
          // Distribute to account rows proportionally
          const accountDistribution = distributeProportionally(orderRevDelta, orderRevenueMeasure.children, monthKey);
          for (const [accountId, accountDelta] of accountDistribution.entries()) {
            const account = orderRevenueMeasure.children.find(c => c.id === accountId);
            if (account) {
              const accountNewValue = account.values[monthKey] + accountDelta;
              updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
              const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
              updates.push(...accountUpdates);
            }
          }
        }
        
        // 2b. Order Revenue → Order Quantity (reverse: Qty = Rev / Unit Price)
        const orderQuantityMeasureId = 'measure-order-qty';
        const orderQuantityMeasure = data.find(m => m.id === orderQuantityMeasureId);
        if (orderQuantityMeasure && orderRevenueMeasure.children.length > 0 && orderQuantityMeasure.children.length > 0) {
          // Calculate unit price from account level
          const orderRevAccount = orderRevenueMeasure.children[0];
          const orderQtyAccount = orderQuantityMeasure.children[0];
          const unitPrice = calculateUnitPrice(orderRevAccount.id, orderQtyAccount.id, monthKey, data);
          if (unitPrice !== null && unitPrice !== 0) {
            const newOrderQuantity = newValue / unitPrice;
            // Update order quantity measure
            updates.push({ rowId: orderQuantityMeasureId, monthKey, newValue: newOrderQuantity });
            const orderQtyDelta = newOrderQuantity - orderQuantityMeasure.values[monthKey];
            if (orderQtyDelta !== 0 && orderQuantityMeasure.children.length > 0) {
              const accountDistribution = distributeProportionally(orderQtyDelta, orderQuantityMeasure.children, monthKey);
              for (const [accountId, accountDelta] of accountDistribution.entries()) {
                const account = orderQuantityMeasure.children.find(c => c.id === accountId);
                if (account) {
                  const accountNewValue = account.values[monthKey] + accountDelta;
                  updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
                  const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
                  updates.push(...accountUpdates);
                }
              }
            }
          }
        }
      }
      
      // 3. Sales Agreement Revenue → Forecasted Revenue (100%)
      const forecastRevenueMeasureId = 'measure-forecast-rev';
      const forecastRevenueMeasure = data.find(m => m.id === forecastRevenueMeasureId);
      if (forecastRevenueMeasure) {
        // Update forecast revenue measure
        updates.push({ rowId: forecastRevenueMeasureId, monthKey, newValue });
        const forecastRevDelta = newValue - forecastRevenueMeasure.values[monthKey];
        if (forecastRevDelta !== 0 && forecastRevenueMeasure.children.length > 0) {
          // Distribute to account rows proportionally
          const accountDistribution = distributeProportionally(forecastRevDelta, forecastRevenueMeasure.children, monthKey);
          for (const [accountId, accountDelta] of accountDistribution.entries()) {
            const account = forecastRevenueMeasure.children.find(c => c.id === accountId);
            if (account) {
              const accountNewValue = account.values[monthKey] + accountDelta;
              updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
              const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
              updates.push(...accountUpdates);
            }
          }
        }
        
        // 3b. Forecasted Revenue → Forecasted Quantity (reverse: Qty = Rev / Unit Price)
        const forecastQuantityMeasureId = 'measure-forecast-qty';
        const forecastQuantityMeasure = data.find(m => m.id === forecastQuantityMeasureId);
        if (forecastQuantityMeasure && forecastRevenueMeasure.children.length > 0 && forecastQuantityMeasure.children.length > 0) {
          // Calculate unit price from account level
          const forecastRevAccount = forecastRevenueMeasure.children[0];
          const forecastQtyAccount = forecastQuantityMeasure.children[0];
          const unitPrice = calculateUnitPrice(forecastRevAccount.id, forecastQtyAccount.id, monthKey, data);
          if (unitPrice !== null && unitPrice !== 0) {
            const newForecastQuantity = newValue / unitPrice;
            // Update forecast quantity measure
            updates.push({ rowId: forecastQuantityMeasureId, monthKey, newValue: newForecastQuantity });
            const forecastQtyDelta = newForecastQuantity - forecastQuantityMeasure.values[monthKey];
            if (forecastQtyDelta !== 0 && forecastQuantityMeasure.children.length > 0) {
              const accountDistribution = distributeProportionally(forecastQtyDelta, forecastQuantityMeasure.children, monthKey);
              for (const [accountId, accountDelta] of accountDistribution.entries()) {
                const account = forecastQuantityMeasure.children.find(c => c.id === accountId);
                if (account) {
                  const accountNewValue = account.values[monthKey] + accountDelta;
                  updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
                  const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
                  updates.push(...accountUpdates);
                }
              }
            }
          }
        }
      }
    }
    
    if (measureId === 'measure-sa-qty') {
      // 1. Sales Agreement Quantity → Sales Agreement Revenue
      const revenueMeasureId = 'measure-sa-rev';
      const revenueMeasure = data.find(m => m.id === revenueMeasureId);
      if (revenueMeasure && directMeasure.children.length > 0) {
        // Calculate unit price from measure totals
        const currentQty = directMeasure.values[monthKey];
        const currentRev = revenueMeasure.values[monthKey];
        if (currentQty !== 0) {
          const unitPrice = currentRev / currentQty;
          const newRevenue = newValue * unitPrice;
          // Update revenue measure
          updates.push({ rowId: revenueMeasureId, monthKey, newValue: newRevenue });
          // Distribute to account rows proportionally
          const revenueDelta = newRevenue - currentRev;
          if (revenueDelta !== 0 && revenueMeasure.children.length > 0) {
            const accountDistribution = distributeProportionally(revenueDelta, revenueMeasure.children, monthKey);
            for (const [accountId, accountDelta] of accountDistribution.entries()) {
              const account = revenueMeasure.children.find(c => c.id === accountId);
              if (account) {
                const accountNewValue = account.values[monthKey] + accountDelta;
                updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
                const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
                updates.push(...accountUpdates);
              }
            }
          }
        }
      }
      
      // 2. Sales Agreement Quantity → Order Quantity (100%)
      const orderMeasureId = 'measure-order-qty';
      const orderMeasure = data.find(m => m.id === orderMeasureId);
      if (orderMeasure) {
        // Update order measure
        updates.push({ rowId: orderMeasureId, monthKey, newValue });
        const orderDelta = newValue - orderMeasure.values[monthKey];
        if (orderDelta !== 0 && orderMeasure.children.length > 0) {
          // Distribute to account rows proportionally
          const accountDistribution = distributeProportionally(orderDelta, orderMeasure.children, monthKey);
          for (const [accountId, accountDelta] of accountDistribution.entries()) {
            const account = orderMeasure.children.find(c => c.id === accountId);
            if (account) {
              const accountNewValue = account.values[monthKey] + accountDelta;
              updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
              const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
              updates.push(...accountUpdates);
            }
          }
        }
        
        // 2b. Order Quantity → Order Revenue (via unit price)
        const orderRevenueMeasureId = 'measure-order-rev';
        const orderRevenueMeasure = data.find(m => m.id === orderRevenueMeasureId);
        if (orderRevenueMeasure && orderMeasure.children.length > 0 && orderRevenueMeasure.children.length > 0) {
          // Calculate unit price from account level
          const orderAccount = orderMeasure.children[0];
          const orderRevAccount = orderRevenueMeasure.children[0];
          const unitPrice = calculateUnitPrice(orderRevAccount.id, orderAccount.id, monthKey, data);
          if (unitPrice !== null) {
            const newOrderRevenue = newValue * unitPrice;
            updates.push({ rowId: orderRevenueMeasureId, monthKey, newValue: newOrderRevenue });
            const orderRevDelta = newOrderRevenue - orderRevenueMeasure.values[monthKey];
            if (orderRevDelta !== 0 && orderRevenueMeasure.children.length > 0) {
              const accountDistribution = distributeProportionally(orderRevDelta, orderRevenueMeasure.children, monthKey);
              for (const [accountId, accountDelta] of accountDistribution.entries()) {
                const account = orderRevenueMeasure.children.find(c => c.id === accountId);
                if (account) {
                  const accountNewValue = account.values[monthKey] + accountDelta;
                  updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
                  const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
                  updates.push(...accountUpdates);
                }
              }
            }
          }
        }
      }
      
      // 3. Sales Agreement Quantity → Forecasted Quantity (100%)
      const forecastMeasureId = 'measure-forecast-qty';
      const forecastMeasure = data.find(m => m.id === forecastMeasureId);
      if (forecastMeasure) {
        // Update forecast measure
        updates.push({ rowId: forecastMeasureId, monthKey, newValue });
        const forecastDelta = newValue - forecastMeasure.values[monthKey];
        if (forecastDelta !== 0 && forecastMeasure.children.length > 0) {
          // Distribute to account rows proportionally
          const accountDistribution = distributeProportionally(forecastDelta, forecastMeasure.children, monthKey);
          for (const [accountId, accountDelta] of accountDistribution.entries()) {
            const account = forecastMeasure.children.find(c => c.id === accountId);
            if (account) {
              const accountNewValue = account.values[monthKey] + accountDelta;
              updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
              const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
              updates.push(...accountUpdates);
            }
          }
        }
        
        // 3b. Forecasted Quantity → Forecasted Revenue (via unit price)
        const forecastRevenueMeasureId = 'measure-forecast-rev';
        const forecastRevenueMeasure = data.find(m => m.id === forecastRevenueMeasureId);
        if (forecastRevenueMeasure && forecastMeasure.children.length > 0 && forecastRevenueMeasure.children.length > 0) {
          // Calculate unit price from account level
          const forecastAccount = forecastMeasure.children[0];
          const forecastRevAccount = forecastRevenueMeasure.children[0];
          const unitPrice = calculateUnitPrice(forecastRevAccount.id, forecastAccount.id, monthKey, data);
          if (unitPrice !== null) {
            const newForecastRevenue = newValue * unitPrice;
            updates.push({ rowId: forecastRevenueMeasureId, monthKey, newValue: newForecastRevenue });
            const forecastRevDelta = newForecastRevenue - forecastRevenueMeasure.values[monthKey];
            if (forecastRevDelta !== 0 && forecastRevenueMeasure.children.length > 0) {
              const accountDistribution = distributeProportionally(forecastRevDelta, forecastRevenueMeasure.children, monthKey);
              for (const [accountId, accountDelta] of accountDistribution.entries()) {
                const account = forecastRevenueMeasure.children.find(c => c.id === accountId);
                if (account) {
                  const accountNewValue = account.values[monthKey] + accountDelta;
                  updates.push({ rowId: accountId, monthKey, newValue: accountNewValue });
                  const accountUpdates = propagateDownward(accountId, monthKey, accountDelta, data);
                  updates.push(...accountUpdates);
                }
              }
            }
          }
        }
      }
    }
    
    return updates; // Return early for measure-level edits
  }
  
  // Handle child row edits (when rowId is a child row, not a measure)
  
  // Handle Sales Agreement Revenue changes
  if (measureId === 'measure-sa-rev') {
    // 1. Sales Agreement Revenue → Sales Agreement Quantity (reverse: Qty = Rev / Unit Price)
    const quantityMeasureId = 'measure-sa-qty';
    const quantityMeasure = data.find(m => m.id === quantityMeasureId);
    if (quantityMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const quantityRow = findRowByPath(quantityMeasure.children, 0);
      if (quantityRow) {
        const unitPrice = calculateUnitPrice(rowId, quantityRow.id, monthKey, data);
        if (unitPrice !== null && unitPrice !== 0) {
          const newQuantity = newValue / unitPrice;
          updates.push({ rowId: quantityRow.id, monthKey, newValue: newQuantity });
          const qtyDelta = newQuantity - quantityRow.values[monthKey];
          if (qtyDelta !== 0) {
            updates.push(...propagateUpward(quantityRow.id, monthKey, qtyDelta, data));
            updates.push(...propagateDownward(quantityRow.id, monthKey, qtyDelta, data));
          }
        }
      }
    }
    
    // 2. Sales Agreement Revenue → Order Revenue (100%)
    const orderRevenueMeasureId = 'measure-order-rev';
    const orderRevenueMeasure = data.find(m => m.id === orderRevenueMeasureId);
    if (orderRevenueMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const orderRevenueRow = findRowByPath(orderRevenueMeasure.children, 0);
      if (orderRevenueRow) {
        updates.push({ rowId: orderRevenueRow.id, monthKey, newValue });
        const orderRevDelta = newValue - orderRevenueRow.values[monthKey];
        if (orderRevDelta !== 0) {
          updates.push(...propagateUpward(orderRevenueRow.id, monthKey, orderRevDelta, data));
          updates.push(...propagateDownward(orderRevenueRow.id, monthKey, orderRevDelta, data));
        }
        
        // 2b. Order Revenue → Order Quantity (reverse: Qty = Rev / Unit Price)
        const orderQuantityMeasureId = 'measure-order-qty';
        const orderQuantityMeasure = data.find(m => m.id === orderQuantityMeasureId);
        if (orderQuantityMeasure && path.length > 0) {
          const orderQuantityRow = findRowByPath(orderQuantityMeasure.children, 0);
          if (orderQuantityRow) {
            const unitPrice = calculateUnitPrice(orderRevenueRow.id, orderQuantityRow.id, monthKey, data);
            if (unitPrice !== null && unitPrice !== 0) {
              const newOrderQuantity = newValue / unitPrice;
              updates.push({ rowId: orderQuantityRow.id, monthKey, newValue: newOrderQuantity });
              const orderQtyDelta = newOrderQuantity - orderQuantityRow.values[monthKey];
              if (orderQtyDelta !== 0) {
                updates.push(...propagateUpward(orderQuantityRow.id, monthKey, orderQtyDelta, data));
                updates.push(...propagateDownward(orderQuantityRow.id, monthKey, orderQtyDelta, data));
              }
            }
          }
        }
      }
    }
    
    // 3. Sales Agreement Revenue → Forecasted Revenue (100%)
    const forecastRevenueMeasureId = 'measure-forecast-rev';
    const forecastRevenueMeasure = data.find(m => m.id === forecastRevenueMeasureId);
    if (forecastRevenueMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const forecastRevenueRow = findRowByPath(forecastRevenueMeasure.children, 0);
      if (forecastRevenueRow) {
        updates.push({ rowId: forecastRevenueRow.id, monthKey, newValue });
        const forecastRevDelta = newValue - forecastRevenueRow.values[monthKey];
        if (forecastRevDelta !== 0) {
          updates.push(...propagateUpward(forecastRevenueRow.id, monthKey, forecastRevDelta, data));
          updates.push(...propagateDownward(forecastRevenueRow.id, monthKey, forecastRevDelta, data));
        }
        
        // 3b. Forecasted Revenue → Forecasted Quantity (reverse: Qty = Rev / Unit Price)
        const forecastQuantityMeasureId = 'measure-forecast-qty';
        const forecastQuantityMeasure = data.find(m => m.id === forecastQuantityMeasureId);
        if (forecastQuantityMeasure && path.length > 0) {
          const forecastQuantityRow = findRowByPath(forecastQuantityMeasure.children, 0);
          if (forecastQuantityRow) {
            const unitPrice = calculateUnitPrice(forecastRevenueRow.id, forecastQuantityRow.id, monthKey, data);
            if (unitPrice !== null && unitPrice !== 0) {
              const newForecastQuantity = newValue / unitPrice;
              updates.push({ rowId: forecastQuantityRow.id, monthKey, newValue: newForecastQuantity });
              const forecastQtyDelta = newForecastQuantity - forecastQuantityRow.values[monthKey];
              if (forecastQtyDelta !== 0) {
                updates.push(...propagateUpward(forecastQuantityRow.id, monthKey, forecastQtyDelta, data));
                updates.push(...propagateDownward(forecastQuantityRow.id, monthKey, forecastQtyDelta, data));
              }
            }
          }
        }
      }
    }
  }
  
  // 1. Sales Agreement Quantity → Sales Agreement Revenue (via unit price)
  if (measureId === 'measure-sa-qty') {
    const revenueMeasureId = 'measure-sa-rev';
    const revenueMeasure = data.find(m => m.id === revenueMeasureId);
    if (revenueMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const revenueRow = findRowByPath(revenueMeasure.children, 0);
      if (revenueRow) {
        // Calculate unit price from current values at the same hierarchy level
        const unitPrice = calculateUnitPrice(revenueRow.id, rowId, monthKey, data);
        if (unitPrice !== null) {
          const newRevenue = newValue * unitPrice;
          updates.push({ rowId: revenueRow.id, monthKey, newValue: newRevenue });
          const revenueDelta = newRevenue - revenueRow.values[monthKey];
          if (revenueDelta !== 0) {
            updates.push(...propagateUpward(revenueRow.id, monthKey, revenueDelta, data));
            updates.push(...propagateDownward(revenueRow.id, monthKey, revenueDelta, data));
          }
        }
      }
    }
  }
  
  // 2. Sales Agreement Quantity → Order Quantity (100%)
  if (measureId === 'measure-sa-qty') {
    const orderMeasureId = 'measure-order-qty';
    const orderMeasure = data.find(m => m.id === orderMeasureId);
    if (orderMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const orderRow = findRowByPath(orderMeasure.children, 0);
      if (orderRow) {
        updates.push({ rowId: orderRow.id, monthKey, newValue });
        const orderDelta = newValue - orderRow.values[monthKey];
        if (orderDelta !== 0) {
          updates.push(...propagateUpward(orderRow.id, monthKey, orderDelta, data));
          updates.push(...propagateDownward(orderRow.id, monthKey, orderDelta, data));
        }
        
        // 2b. Order Quantity → Order Revenue (via unit price) - triggered by SA Qty change
        const orderRevenueMeasureId = 'measure-order-rev';
        const orderRevenueMeasure = data.find(m => m.id === orderRevenueMeasureId);
        if (orderRevenueMeasure && path.length > 0) {
          const orderRevenueRow = findRowByPath(orderRevenueMeasure.children, 0);
          if (orderRevenueRow) {
            const unitPrice = calculateUnitPrice(orderRevenueRow.id, orderRow.id, monthKey, data);
            if (unitPrice !== null) {
              const newOrderRevenue = newValue * unitPrice;
              updates.push({ rowId: orderRevenueRow.id, monthKey, newValue: newOrderRevenue });
              const orderRevDelta = newOrderRevenue - orderRevenueRow.values[monthKey];
              if (orderRevDelta !== 0) {
                updates.push(...propagateUpward(orderRevenueRow.id, monthKey, orderRevDelta, data));
                updates.push(...propagateDownward(orderRevenueRow.id, monthKey, orderRevDelta, data));
              }
            }
          }
        }
      }
    }
  }
  
  // 3. Order Quantity → Order Revenue (via unit price)
  if (measureId === 'measure-order-qty') {
    console.log('[CROSS-MEASURE] Processing Order Qty → Order Rev');
    const revenueMeasureId = 'measure-order-rev';
    const revenueMeasure = data.find(m => m.id === revenueMeasureId);
    console.log('[CROSS-MEASURE] Order Revenue measure found:', !!revenueMeasure, 'path length:', path.length);
    if (revenueMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const revenueRow = findRowByPath(revenueMeasure.children, 0);
      console.log('[CROSS-MEASURE] Order Revenue row found:', revenueRow ? revenueRow.name : 'null');
      if (revenueRow) {
        const unitPrice = calculateUnitPrice(revenueRow.id, rowId, monthKey, data);
        console.log('[CROSS-MEASURE] Unit price for Order:', unitPrice);
        if (unitPrice !== null) {
          const newRevenue = newValue * unitPrice;
          console.log('[CROSS-MEASURE] New Order Revenue:', newRevenue);
          updates.push({ rowId: revenueRow.id, monthKey, newValue: newRevenue });
          const revenueDelta = newRevenue - revenueRow.values[monthKey];
          if (revenueDelta !== 0) {
            updates.push(...propagateUpward(revenueRow.id, monthKey, revenueDelta, data));
            updates.push(...propagateDownward(revenueRow.id, monthKey, revenueDelta, data));
          }
        } else {
          console.log('[CROSS-MEASURE] Unit price is null for Order Revenue');
        }
      }
    }
  }
  
  // 3b. Order Revenue → Order Quantity (reverse: Qty = Rev / Unit Price)
  if (measureId === 'measure-order-rev') {
    const quantityMeasureId = 'measure-order-qty';
    const quantityMeasure = data.find(m => m.id === quantityMeasureId);
    if (quantityMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const quantityRow = findRowByPath(quantityMeasure.children, 0);
      if (quantityRow) {
        const unitPrice = calculateUnitPrice(rowId, quantityRow.id, monthKey, data);
        if (unitPrice !== null && unitPrice !== 0) {
          const newQuantity = newValue / unitPrice;
          updates.push({ rowId: quantityRow.id, monthKey, newValue: newQuantity });
          const qtyDelta = newQuantity - quantityRow.values[monthKey];
          if (qtyDelta !== 0) {
            updates.push(...propagateUpward(quantityRow.id, monthKey, qtyDelta, data));
            updates.push(...propagateDownward(quantityRow.id, monthKey, qtyDelta, data));
          }
        }
      }
    }
  }
  
  // 4. Sales Agreement Quantity → Forecasted Quantity (100%)
  if (measureId === 'measure-sa-qty') {
    const forecastMeasureId = 'measure-forecast-qty';
    const forecastMeasure = data.find(m => m.id === forecastMeasureId);
    if (forecastMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const forecastRow = findRowByPath(forecastMeasure.children, 0);
      if (forecastRow) {
        updates.push({ rowId: forecastRow.id, monthKey, newValue });
        const forecastDelta = newValue - forecastRow.values[monthKey];
        if (forecastDelta !== 0) {
          updates.push(...propagateUpward(forecastRow.id, monthKey, forecastDelta, data));
          updates.push(...propagateDownward(forecastRow.id, monthKey, forecastDelta, data));
        }
        
        // 4b. Forecasted Quantity → Forecasted Revenue (via unit price) - triggered by SA Qty change
        const forecastRevenueMeasureId = 'measure-forecast-rev';
        const forecastRevenueMeasure = data.find(m => m.id === forecastRevenueMeasureId);
        if (forecastRevenueMeasure && path.length > 0) {
          const forecastRevenueRow = findRowByPath(forecastRevenueMeasure.children, 0);
          if (forecastRevenueRow) {
            const unitPrice = calculateUnitPrice(forecastRevenueRow.id, forecastRow.id, monthKey, data);
            if (unitPrice !== null) {
              const newForecastRevenue = newValue * unitPrice;
              updates.push({ rowId: forecastRevenueRow.id, monthKey, newValue: newForecastRevenue });
              const forecastRevDelta = newForecastRevenue - forecastRevenueRow.values[monthKey];
              if (forecastRevDelta !== 0) {
                updates.push(...propagateUpward(forecastRevenueRow.id, monthKey, forecastRevDelta, data));
                updates.push(...propagateDownward(forecastRevenueRow.id, monthKey, forecastRevDelta, data));
              }
            }
          }
        }
      }
    }
  }
  
  // 5. Forecasted Quantity → Forecasted Revenue (via unit price)
  if (measureId === 'measure-forecast-qty') {
    console.log('[CROSS-MEASURE] Processing Forecasted Qty → Forecasted Rev');
    const revenueMeasureId = 'measure-forecast-rev';
    const revenueMeasure = data.find(m => m.id === revenueMeasureId);
    console.log('[CROSS-MEASURE] Forecasted Revenue measure found:', !!revenueMeasure, 'path length:', path.length);
    if (revenueMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const revenueRow = findRowByPath(revenueMeasure.children, 0);
      console.log('[CROSS-MEASURE] Forecasted Revenue row found:', revenueRow ? revenueRow.name : 'null');
      if (revenueRow) {
        const unitPrice = calculateUnitPrice(revenueRow.id, rowId, monthKey, data);
        console.log('[CROSS-MEASURE] Unit price for Forecasted:', unitPrice);
        if (unitPrice !== null) {
          const newRevenue = newValue * unitPrice;
          console.log('[CROSS-MEASURE] New Forecasted Revenue:', newRevenue);
          updates.push({ rowId: revenueRow.id, monthKey, newValue: newRevenue });
          const revenueDelta = newRevenue - revenueRow.values[monthKey];
          if (revenueDelta !== 0) {
            updates.push(...propagateUpward(revenueRow.id, monthKey, revenueDelta, data));
            updates.push(...propagateDownward(revenueRow.id, monthKey, revenueDelta, data));
          }
        } else {
          console.log('[CROSS-MEASURE] Unit price is null for Forecasted Revenue');
        }
      }
    }
  }
  
  // 5b. Forecasted Revenue → Forecasted Quantity (reverse: Qty = Rev / Unit Price)
  if (measureId === 'measure-forecast-rev') {
    const quantityMeasureId = 'measure-forecast-qty';
    const quantityMeasure = data.find(m => m.id === quantityMeasureId);
    if (quantityMeasure && path.length > 0 && row) {
      // Find the corresponding row at the same hierarchy level
      const quantityRow = findRowByPath(quantityMeasure.children, 0);
      if (quantityRow) {
        const unitPrice = calculateUnitPrice(rowId, quantityRow.id, monthKey, data);
        if (unitPrice !== null && unitPrice !== 0) {
          const newQuantity = newValue / unitPrice;
          updates.push({ rowId: quantityRow.id, monthKey, newValue: newQuantity });
          const qtyDelta = newQuantity - quantityRow.values[monthKey];
          if (qtyDelta !== 0) {
            updates.push(...propagateUpward(quantityRow.id, monthKey, qtyDelta, data));
            updates.push(...propagateDownward(quantityRow.id, monthKey, qtyDelta, data));
          }
        }
      }
    }
  }
  
  return updates;
};


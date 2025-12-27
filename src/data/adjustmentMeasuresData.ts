import { MeasureData, GridRow } from '../types';

const monthlyValue = (base: number) => {
  const months = {
    jan2026: base,
    feb2026: base,
    mar2026: base,
    apr2026: base,
    may2026: base,
    jun2026: base,
    jul2026: base,
    aug2026: base,
    sep2026: base,
    oct2026: base,
    nov2026: base,
    dec2026: base,
  };
  
  // Calculate quarters
  const q1 = months.jan2026 + months.feb2026 + months.mar2026;
  const q2 = months.apr2026 + months.may2026 + months.jun2026;
  const q3 = months.jul2026 + months.aug2026 + months.sep2026;
  const q4 = months.oct2026 + months.nov2026 + months.dec2026;
  
  // Calculate year (sum of all months)
  const year = q1 + q2 + q3 + q4;
  
  return {
    year,
    q1,
    q2,
    q3,
    q4,
    ...months,
  };
};

// Helper function to create the standard hierarchy structure for a measure
const createHierarchy = (
  measureId: string,
  accountBase: number,
  categoryBase: number,
  productBase: number
): GridRow[] => {
  return [
    {
      id: `account-${measureId}`,
      name: 'Magna Drive - Michigan Plan',
      parentId: measureId,
      level: 1,
      type: 'account',
      values: monthlyValue(accountBase),
      children: [
        {
          id: `category-transmission-${measureId}`,
          name: 'Transmission Assembly',
          parentId: `account-${measureId}`,
          level: 2,
          type: 'category',
          values: monthlyValue(categoryBase),
          children: [
            {
              id: `product-trn-a-${measureId}`,
              name: 'TRN 750 - A',
              parentId: `category-transmission-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
            {
              id: `product-trn-b-${measureId}`,
              name: 'TRN 750 - B',
              parentId: `category-transmission-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
            {
              id: `product-trn-c-${measureId}`,
              name: 'TRN 750 - C',
              parentId: `category-transmission-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
            {
              id: `product-trn-d-${measureId}`,
              name: 'TRN 750 - D',
              parentId: `category-transmission-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
            {
              id: `product-trn-e-${measureId}`,
              name: 'TRN 750 - E',
              parentId: `category-transmission-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
          ],
        },
        {
          id: `category-chassis-${measureId}`,
          name: 'Chassis Components',
          parentId: `account-${measureId}`,
          level: 2,
          type: 'category',
          values: monthlyValue(categoryBase),
          children: [
            {
              id: `product-chassis-1-${measureId}`,
              name: 'Chassis Product 1',
              parentId: `category-chassis-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase * 2.5),
            },
            {
              id: `product-chassis-2-${measureId}`,
              name: 'Chassis Product 2',
              parentId: `category-chassis-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase * 2.5),
            },
          ],
        },
      ],
    },
  ];
};

/**
 * Adjustment Measures Data
 * 
 * Dependencies:
 * - Baseline Forecast: Independent (base measure)
 * - Account Manager Adjusted Forecast: Depends on Baseline Forecast
 * - Sales Manager Adjusted Forecast: Depends on Account Manager Adjusted Forecast
 * - Regional Director Adjusted Forecast: Depends on Sales Manager Adjusted Forecast
 * - Final Forecast: Depends on Regional Director Adjusted Forecast (final aggregation)
 */
export const adjustmentMeasuresData: MeasureData[] = [
  // Baseline Forecast - Independent base measure
  {
    id: 'measure-baseline-forecast',
    name: 'Baseline Forecast',
    values: monthlyValue(85000),
    children: createHierarchy('measure-baseline-forecast', 85000, 42500, 8500),
  },
  // Account Manager Adjusted Forecast - Depends on Baseline Forecast
  {
    id: 'measure-account-manager-adjusted',
    name: 'Account Manager Adjusted Forecast',
    values: monthlyValue(87000), // Slightly higher than baseline
    children: createHierarchy('measure-account-manager-adjusted', 87000, 43500, 8700),
  },
  // Sales Manager Adjusted Forecast - Depends on Account Manager Adjusted Forecast
  {
    id: 'measure-sales-manager-adjusted',
    name: 'Sales Manager Adjusted Forecast',
    values: monthlyValue(89000), // Higher than Account Manager
    children: createHierarchy('measure-sales-manager-adjusted', 89000, 44500, 8900),
  },
  // Regional Director Adjusted Forecast - Depends on Sales Manager Adjusted Forecast
  {
    id: 'measure-regional-director-adjusted',
    name: 'Regional Director Adjusted Forecast',
    values: monthlyValue(92000), // Higher than Sales Manager
    children: createHierarchy('measure-regional-director-adjusted', 92000, 46000, 9200),
  },
  // Final Forecast - Depends on Regional Director Adjusted Forecast
  {
    id: 'measure-final-forecast',
    name: 'Final Forecast',
    values: monthlyValue(95000), // Highest value, final aggregation
    children: createHierarchy('measure-final-forecast', 95000, 47500, 9500),
  },
];





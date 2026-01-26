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

// Helper function to create Consumer Goods hierarchy structure
const createConsumerGoodsHierarchy = (
  measureId: string,
  accountBase: number,
  categoryBase: number,
  productBase: number
): GridRow[] => {
  return [
    {
      id: `account-${measureId}`,
      name: 'SnackCo - Midwest Distribution',
      parentId: measureId,
      level: 1,
      type: 'account',
      values: monthlyValue(accountBase),
      children: [
        {
          id: `category-chips-${measureId}`,
          name: 'Chips & Crisps',
          parentId: `account-${measureId}`,
          level: 2,
          type: 'category',
          values: monthlyValue(categoryBase),
          children: [
            {
              id: `product-chips-1-${measureId}`,
              name: 'Classic Potato Chips',
              parentId: `category-chips-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
            {
              id: `product-chips-2-${measureId}`,
              name: 'Tortilla Chips',
              parentId: `category-chips-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
            {
              id: `product-chips-3-${measureId}`,
              name: 'Kettle Cooked Chips',
              parentId: `category-chips-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
            {
              id: `product-chips-4-${measureId}`,
              name: 'Veggie Crisps',
              parentId: `category-chips-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
            {
              id: `product-chips-5-${measureId}`,
              name: 'Pita Chips',
              parentId: `category-chips-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase),
            },
          ],
        },
        {
          id: `category-candy-${measureId}`,
          name: 'Candy & Sweets',
          parentId: `account-${measureId}`,
          level: 2,
          type: 'category',
          values: monthlyValue(categoryBase),
          children: [
            {
              id: `product-candy-1-${measureId}`,
              name: 'Chocolate Bars',
              parentId: `category-candy-${measureId}`,
              level: 3,
              type: 'product',
              values: monthlyValue(productBase * 2.5),
            },
            {
              id: `product-candy-2-${measureId}`,
              name: 'Gummy Bears',
              parentId: `category-candy-${measureId}`,
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

// Consumer Goods Measures based on screenshot
export const consumerGoodsData: MeasureData[] = [
  // Planned Volume
  {
    id: 'measure-planned-volume',
    name: 'Planned Volume',
    values: monthlyValue(950),
    children: createConsumerGoodsHierarchy('measure-planned-volume', 950, 475, 95),
  },
  // PY Volume (Previous Year Volume)
  {
    id: 'measure-py-volume',
    name: 'Previous Year Volume',
    values: monthlyValue(800),
    children: createConsumerGoodsHierarchy('measure-py-volume', 800, 400, 80),
  },
  // Forecasted Volume
  {
    id: 'measure-forecasted-volume',
    name: 'Forecasted Volume',
    values: monthlyValue(1000),
    children: createConsumerGoodsHierarchy('measure-forecasted-volume', 1000, 500, 100),
  },
  // Target Volume
  {
    id: 'measure-target-volume',
    name: 'Target Volume',
    values: monthlyValue(1100),
    children: createConsumerGoodsHierarchy('measure-target-volume', 1100, 550, 110),
  },
  // Revenue
  {
    id: 'measure-revenue',
    name: 'Revenue',
    values: monthlyValue(100000),
    children: createConsumerGoodsHierarchy('measure-revenue', 100000, 50000, 10000),
  },
  // Promo Spend%
  {
    id: 'measure-promo-spend',
    name: 'Promo Spend%',
    values: monthlyValue(12.5), // Percentage values
    children: createConsumerGoodsHierarchy('measure-promo-spend', 12.5, 11.0, 10.5),
  },
  // Market Share%
  {
    id: 'measure-market-share',
    name: 'Market Share%',
    values: monthlyValue(18.5), // Percentage values
    children: createConsumerGoodsHierarchy('measure-market-share', 18.5, 17.0, 16.5),
  },
  // Days of Inventory
  {
    id: 'measure-days-inventory',
    name: 'Days of Inventory',
    values: monthlyValue(45),
    children: createConsumerGoodsHierarchy('measure-days-inventory', 45, 42, 40),
  },
  // Trade Spend ROI
  {
    id: 'measure-trade-spend-roi',
    name: 'Trade Spend ROI',
    values: monthlyValue(3.2), // ROI multiplier
    children: createConsumerGoodsHierarchy('measure-trade-spend-roi', 3.2, 3.0, 2.8),
  },
];

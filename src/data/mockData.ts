import { MeasureData, GridRow } from '../types';
import { IndustryType } from '../contexts/IndustryContext';
import { consumerGoodsData } from './consumerGoodsData';

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

// Helper function to create the standard Manufacturing hierarchy structure for a measure
const createManufacturingHierarchy = (
  measureId: string,
  accountBase: number,
  categoryBase: number,
  productBase: number
): GridRow[] => {
  return [
    {
      id: `account-${measureId}`,
      name: 'MagnaDrive - Michigan Plant',
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

export const getMockData = (industry: IndustryType | null): MeasureData[] => {
  if (industry === 'consumer-goods') {
    return consumerGoodsData;
  }
  
  // Default to manufacturing data
  return manufacturingData;
};

const manufacturingData: MeasureData[] = [
  // Sales Agreement Quantity
  {
    id: 'measure-sa-qty',
    name: 'Sales Agreement Quantity',
    values: monthlyValue(800),
    children: createManufacturingHierarchy('measure-sa-qty', 800, 400, 80),
  },
  // Sales Agreement Revenue
  {
    id: 'measure-sa-rev',
    name: 'Sales Agreement Revenue',
    values: monthlyValue(80000),
    children: createManufacturingHierarchy('measure-sa-rev', 80000, 40000, 8000),
  },
  // Opportunity Quantity
  {
    id: 'measure-opp-qty',
    name: 'Opportunity Quantity',
    values: monthlyValue(1200),
    children: createManufacturingHierarchy('measure-opp-qty', 1200, 600, 120),
  },
  // Opportunity Revenue
  {
    id: 'measure-opp-rev',
    name: 'Opportunity Revenue',
    values: monthlyValue(120000),
    children: createManufacturingHierarchy('measure-opp-rev', 120000, 60000, 12000),
  },
  // Order Quantity
  {
    id: 'measure-order-qty',
    name: 'Order Quantity',
    values: monthlyValue(950),
    children: createManufacturingHierarchy('measure-order-qty', 950, 475, 95),
  },
  // Order Revenue
  {
    id: 'measure-order-rev',
    name: 'Order Revenue',
    values: monthlyValue(95000),
    children: createManufacturingHierarchy('measure-order-rev', 95000, 47500, 9500),
  },
  // Last Year Order Quantity
  {
    id: 'measure-ly-order-qty',
    name: 'Last Year Order Quantity',
    values: monthlyValue(750),
    children: createManufacturingHierarchy('measure-ly-order-qty', 750, 375, 75),
  },
  // Last Years Order Revenue
  {
    id: 'measure-ly-order-rev',
    name: 'Last Years Order Revenue',
    values: monthlyValue(75000),
    children: createManufacturingHierarchy('measure-ly-order-rev', 75000, 37500, 7500),
  },
  // Forecasted Quantity
  {
    id: 'measure-forecast-qty',
    name: 'Forecasted Quantity',
    values: monthlyValue(1000),
    children: createManufacturingHierarchy('measure-forecast-qty', 1000, 500, 100),
  },
  // Forecasted Revenue
  {
    id: 'measure-forecast-rev',
    name: 'Forecasted Revenue',
    values: monthlyValue(100000),
    children: createManufacturingHierarchy('measure-forecast-rev', 100000, 50000, 10000),
  },
];


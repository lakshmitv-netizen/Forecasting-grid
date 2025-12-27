# Forecasting & Planning Tool

A React + TypeScript application for financial forecasting and planning with hierarchical data visualization.

## Features

- **Hierarchical Grid**: Expandable/collapsible rows showing measures, accounts, categories, and products
- **Two Measures**: Sales Agreement Revenue and Sales Agreement Quantity
- **Time Periods**: 12 months (Jan 2026 - Dec 2026)
- **Full UI**: Salesforce-style header, navigation tabs, grid toolbar, and bottom action bar
- **Pixel-Perfect Design**: Styled to match Figma design specifications

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Top header bar
│   ├── NavigationTabs.tsx
│   ├── ForecastingGrid.tsx
│   ├── HierarchicalGrid.tsx
│   ├── GridRow.tsx
│   ├── GridToolbar.tsx
│   └── BottomBar.tsx
├── data/
│   └── mockData.ts     # Sample data
├── types/
│   └── index.ts        # TypeScript types
└── styles/             # CSS files
    ├── variables.css   # Design tokens from Figma
    └── components/     # Component-specific styles
```

## Usage

- Click the chevron icons (▶) next to rows to expand/collapse hierarchical data
- Use the search bar to filter grid content (functionality to be added)
- Action buttons in the toolbar are ready for future functionality

## Next Steps

The grid toolbar controls (settings, filter, sort, chart, comments, alerts) are currently UI-only. Functionality can be added as needed.






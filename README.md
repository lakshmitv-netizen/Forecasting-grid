# Forecasting & Planning Tool

A React + TypeScript application for financial forecasting and planning with advanced hierarchical data visualization, inline editing, and collaborative features.

## Features

### Core Functionality

- **Hierarchical Grid**: Multi-level expandable/collapsible rows showing measures, accounts, categories, and products
- **10 Measures Across 2 Categories**:
  - **Revenue & Quantity Measures**: Sales Agreement, Opportunity, Order, Last Year Order, and Forecasted (Quantity in No.s and Revenue)
  - **Adjustment Measures**: Alternative views with different calculation contexts
- **Time Periods**: 12 months (Jan 2026 - Dec 2026) plus quarterly and yearly rollups
- **Multiple Industry Views**: Manufacturing, Retail, and Technology with industry-specific data

### Data Editing & Calculations

- **Inline Cell Editing**: Click any cell to edit values directly in the grid
- **Value Propagation**:
  - **Upward Rollups**: Child edits automatically aggregate to parents
  - **Downward Distribution**: Parent edits cascade to children via disaggregation rules
- **Cross-Measure Dependencies**: Revenue ↔ Quantity automatic calculations with unit pricing
- **Disaggregation Mechanisms**: Even split, proportional, fixed, custom, or no cascade
- **Fill Handle**: Drag to fill adjacent cells with auto-incremented or copied values

### Advanced Filtering

- **Column Filtering**: Multi-condition AND logic with "Matches filter" / "Does not match filter" bucket grouping
- **Global Top/Bottom N**: Show top or bottom N items across entire hierarchy
- **Dimension Filters**: Filter by accounts, categories, or products
- **Time Period Filters**: Filter by specific months, quarters, or year
- **Filter Panel**: Comprehensive filtering UI with multiple filter types

### Layout Options

- **Measures / Dimensions x Time** (default): Measures as rows, time as columns
- **Time x Measures / Dimensions**: Time as rows, measures as columns
- **Dimensions x Time**: Filtered by single measure
- **Time x Dimensions**: Time as rows with single measure

### Collaboration Features

- **Cell Notes & Comments**: Add notes to individual cells with rich text support
- **Edit History**: Track all changes with timestamps, user info, and previous values
- **Cell Details Panel**: View complete edit history and impact analysis for any cell
- **Approval Workflows**: Designated approvers can review and approve forecasts
- **Alerts Panel**: Notifications for significant changes or required actions
- **Mark as Read**: Track which cells have been reviewed

### Additional Features

- **Export to CSV**: Download grid data with hierarchical structure preserved
- **Settings Panel**: Configure frozen columns, display options, and grid behavior
- **Reorder Measures**: Drag-and-drop measure ordering
- **Measure Group Filtering**: Toggle between measure categories
- **Search**: Full-text search across dimension names
- **Responsive Design**: Salesforce Lightning Design System (SLDS 2) styling

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lakshmitv-netizen/Forecasting-grid.git
cd Forecasting-grid
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deployment

The app is configured for Heroku deployment with Express server:

```bash
npm start
```

Live demo: https://forecasting-grid-dec-29-cb7a69ef9e7e.herokuapp.com/

## Project Structure

```
src/
├── components/              # React components
│   ├── ForecastingGrid.tsx # Main grid orchestrator
│   ├── HierarchicalGrid.tsx # Grid rendering with calculations
│   ├── GridRow.tsx         # Individual row with edit capabilities
│   ├── FiltersPanel.tsx    # Advanced filtering UI
│   ├── CellDetailsHistoryPanel.tsx # Edit history viewer
│   ├── ExportCsvModal.tsx  # CSV export
│   ├── SettingsPanel.tsx   # Grid settings
│   ├── AlertsPanel.tsx     # Notifications
│   └── ...
├── data/
│   ├── mockData.ts         # Manufacturing data
│   ├── retailData.ts       # Retail industry data
│   ├── technologyData.ts   # Technology industry data
│   └── adjustmentMeasuresData.ts
├── utils/
│   ├── valuePropagation.ts # Upward/downward calculation logic
│   ├── filterSummaryRows.ts # Filtering and aggregation
│   ├── mergeHierarchyValues.ts # Hierarchy data merging
│   └── ...
├── types/
│   └── index.ts            # TypeScript type definitions
├── styles/                 # SLDS 2 compliant CSS
│   ├── variables.css       # Design tokens
│   └── components/         # Component-specific styles
└── pages/
    └── PlanningForecastingListPage.tsx # Main page layout
```

## Usage Guide

### Basic Operations

- **Expand/Collapse**: Click chevron icons (▶/▼) to expand or collapse hierarchical rows
- **Edit Cell**: Click any editable cell to enter a new value
- **Fill Handle**: Click and drag the blue dot in the bottom-right corner of a cell to fill adjacent cells
- **Add Note**: Click the note icon in cell edit popover to add comments

### Filtering

1. Click the **Filters** button in the toolbar
2. Add filters using the **+ Add Filter** button
3. Select dimension, operator, and value
4. Apply filters to see "Matches filter" / "Does not match filter" buckets

### Changing Views

- Use the **Layout** dropdown to switch between different grid orientations
- Use **Measure Subgroups** to toggle between measure categories
- Use **Industry** switcher to view different industry datasets

### Exporting Data

1. Click **Export to CSV** in the toolbar
2. Configure export options (include hierarchy, totals, etc.)
3. Download the generated CSV file

## Key Technical Features

- **Advanced State Management**: Complex cell editing state with undo/redo capability
- **Optimized Rendering**: Efficient React rendering for large hierarchical datasets
- **Type Safety**: Full TypeScript coverage with strict typing
- **Design System**: Salesforce Lightning Design System 2 (SLDS 2) integration
- **Calculation Engine**: Sophisticated value propagation with cross-measure dependencies
- **Filter Engine**: Multi-condition filtering with bucket aggregation

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

Proprietary - Salesforce Internal Use

## Contact

For questions or issues, contact the development team.

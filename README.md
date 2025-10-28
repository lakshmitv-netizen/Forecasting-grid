# Forecasting Grid

A hierarchical data grid application for forecasting and financial planning.

## Features

- **Hierarchical Data Display**: View data in a tree structure with expand/collapse functionality
- **Specific Time View**: Analyze data for a specific month with detailed KPIs
- **Time Series View**: Track metrics across all 12 months of the year
- **Dynamic Data**: Seasonal variations and realistic forecasting data
- **Interactive Selection**: Click cells to select and navigate between views
- **Responsive Design**: Sticky header and columns for easy navigation

## Technology Stack

- React 18
- Create React App
- Custom CSS for styling
- AG Grid (initial implementation, later replaced with custom grid)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Project Structure

```
grid/
├── public/          # Static files
├── src/
│   ├── App.jsx     # Main application component
│   ├── index.js    # Entry point
│   └── index.css   # Global styles
└── package.json    # Dependencies and scripts
```

## Features in Detail

### Specific Time View
- View data for a selected month (January - December 2025)
- Tracks 5 KPIs: Baseline Revenue, AM Adjusted Revenue, SM Adjustment, RSD Adjustment, Final Forecast
- Click any cell to select it and switch to Time Series view

### Time Series View
- See a KPI's progression across all 12 months
- Select KPI through dropdown menu
- Click any month's cell to jump back to Specific Time view for that month

### Data Hierarchy
- Aggregate (Total)
  - MagnaDrive - Michigan Plant
    - Transmission Assemblies
      - Products A-F (6 products)
    - Chassis Components
      - Products 1-3 (3 products)

## Deployment

This application is deployed on Vercel and can be accessed at: [Your Vercel URL]

## Development

To contribute to this project:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary software.

import React from 'react';
import Header from './components/Header';
import NavigationTabs from './components/NavigationTabs';
import ForecastingGrid from './components/ForecastingGrid';
import BottomBar from './components/BottomBar';
import './styles/variables.css';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <NavigationTabs />
      <div className="main-content">
        <ForecastingGrid />
        <div style={{ height: '60px' }}></div>
      </div>
      <BottomBar />
    </div>
  );
}

export default App;


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ForecastingGrid from './components/ForecastingGrid';
import PlanningForecastingPage from './pages/PlanningForecastingPage';
import './styles/variables.css';
import './styles/App.css';

function App() {
  console.log('App component rendering');
  return (
    <Router>
      <Routes>
        <Route path="/planning-forecasting" element={<PlanningForecastingPage />} />
        <Route path="/" element={
          <div className="app">
            <Header />
            <div className="main-content">
              <ForecastingGrid />
              <div style={{ height: '60px' }}></div>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;


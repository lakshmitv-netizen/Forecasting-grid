import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ForecastingGrid from './components/ForecastingGrid';
import PlanningForecastingPage from './pages/PlanningForecastingPage';
import PlanningForecastingListPage from './pages/PlanningForecastingListPage';
import './styles/variables.css';
import './styles/App.css';

function App() {
  console.log('App component rendering');
  return (
    <Router>
      <Routes>
        <Route path="/planning-forecasting-list" element={<PlanningForecastingListPage />} />
        <Route path="/planning-forecasting" element={<PlanningForecastingPage />} />
        <Route path="/" element={
          <div className="app">
            <Header />
            <div className="main-content">
              <ForecastingGrid />
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;


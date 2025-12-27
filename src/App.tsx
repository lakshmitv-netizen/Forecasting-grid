import Header from './components/Header';
import ForecastingGrid from './components/ForecastingGrid';
import './styles/variables.css';
import './styles/App.css';

function App() {
  console.log('App component rendering');
  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <ForecastingGrid />
        <div style={{ height: '60px' }}></div>
      </div>
    </div>
  );
}

export default App;


import React from 'react';
import Navbar from './components/Navbar';
import Banner from './components/Banner';
import Row from './components/Row';
import { mockBanner, categories } from './mockData';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <Banner movie={mockBanner} />
      
      <div className="rows-container">
        {categories.map((category, index) => (
          <Row 
            key={index} 
            title={category.title} 
            items={category.items} 
            isLargeRow={index === 0} 
          />
        ))}
      </div>
      
      <footer className="footer">
        <p>Chandu-Flix Demo © 2026</p>
      </footer>
    </div>
  );
}

export default App;

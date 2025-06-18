import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Register from './components/Register';
import Search from './components/Search';
import Footer from './components/Footer';
import { Container } from 'react-bootstrap';

function App() {
  return (
    <div className="blood-donor-app d-flex flex-column">
      <Navbar />
      <Container className="py-4 flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}

export default App;

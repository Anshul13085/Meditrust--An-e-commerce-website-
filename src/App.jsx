import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import IndexPage from './pages/IndexPage';
import Signup from './pages/SignUpPage';
import Login from './pages/LoginPage';
import AboutUs from './pages/AboutUsPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import UserHomePage from './pages/UserHomePage'; // ✅ Import your personal home page
import CheckoutPage from './pages/CheckoutPage'; // ✅ Import the checkout page

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/home" element={<UserHomePage />} /> {/* ✅ Add this line */}
          <Route path="/checkout" element={<CheckoutPage />} /> {/* ✅ Add this line */}
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

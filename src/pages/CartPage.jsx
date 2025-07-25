import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CartPage.module.css";

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);  // To handle any errors

  // Load cart items from the backend when the component mounts
  useEffect(() => {
    fetchCartItems();
  }, []); // Runs only once when the component is mounted

  // Function to fetch cart items
  const fetchCartItems = () => {
    axios.get('http://localhost:3000/api/cart', { withCredentials: true })
      .then((response) => {
        // Update state with the fetched cart items
        setCartItems(response.data);
      })
      .catch((error) => {
        console.error("Error fetching cart items:", error);
        setError("Failed to load cart items");
      });
  };

  // Update quantity
  const updateQuantity = (productId, delta) => {
    const item = cartItems.find((item) => item.sr_number === productId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);  // Ensure quantity doesn't go below 1
  
      axios.post('http://localhost:3000/api/cart/update', 
        { productId, quantity: newQuantity }, 
        { withCredentials: true }
      )
        .then((response) => {
          if (response.data.message === "Cart item updated successfully") {
            // Update the local cart state with the new quantity
            setCartItems((prevItems) =>
              prevItems.map((cartItem) =>
                cartItem.sr_number === productId ? { ...cartItem, quantity: newQuantity } : cartItem
              )
            );
          } else {
            console.error("Failed to update quantity in cart.");
            // Refresh cart items to ensure UI is in sync with database
            fetchCartItems();
          }
        })
        .catch((error) => {
          console.error("Error updating quantity:", error);
          // Refresh cart items to ensure UI is in sync with database
          fetchCartItems();
        });
    }
  };
  
  
  // Remove item from cart
  const handleRemoveItem = (productId) => {
    // Send a request to remove the item from the cart in the backend
    axios.delete(`http://localhost:3000/api/cart/remove/${productId}`, { withCredentials: true })
      .then((response) => {
        // Remove the item from the local state
        setCartItems((prevItems) =>
          prevItems.filter((item) => item.sr_number !== productId)
        );
      })
      .catch((error) => {
        console.error("Error removing item from cart:", error);
        setError("Failed to remove item from cart");
        // Refresh cart items to ensure UI is in sync with database
        fetchCartItems();
      });
  };

  // Calculate total
  const getTotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.transfer_price * item.quantity || 0),
      0
    );
  };

  return (
    <div className={styles.cartPageWrapper}>
      <header className={styles.header}>
        <h1 className={styles.logo}>MediTrust</h1>
        <nav role="navigation">
          <ul className={styles.navList}>
            <li><Link to="/" className={styles.navLink}>Home</Link></li>
            <li><Link to="/products" className={styles.navLink}>Products</Link></li>
            <li><Link to="/cart" className={styles.navLink}>Cart</Link></li>
            <li><Link to="/checkout" className={styles.navLink}>Checkout</Link></li>
            <li><Link to="/about-us" className={styles.navLink}>About Us</Link></li>
          </ul>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <h2>Your Cart</h2>

        {error && <p className={styles.error}>{error}</p>}  {/* Show error message */}

        <div className={styles.cartItems}>
          {cartItems.length === 0 ? (
            <p className={styles.emptyCart}>Your cart is empty!</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemDetails}>
                  <p><strong>{item.product_name}</strong> ({item.packet_size})</p>
                  <p>Price: ₹{item.transfer_price}</p>
                  <p>Total: ₹{item.transfer_price * item.quantity}</p>

                  <div className={styles.quantityControls}>
                    <button onClick={() => updateQuantity(item.sr_number, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.sr_number, 1)}>+</button>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.sr_number)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className={styles.total}>
          <h3>Total: ₹{getTotal()}</h3>
        </div>

        <div className={styles.buttonContainer}>
          <button onClick={() => navigate('/products')} className={styles.backButton}>
            Back to Products
          </button>
          <button onClick={() => navigate('/')} className={styles.homeButton}>
            Go to Home
          </button>
          <button onClick={() => navigate('/checkout')} className={styles.checkoutButton}>
            Proceed to Checkout
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 MediTrust. All rights reserved.</p>
        <p>Contact us: anshulmaddiwar@gmail.com; 7404675212</p>
      </footer>
    </div>
  );
};

export default CartPage;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styles from "./CheckoutPage.module.css";

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [licenseVerified, setLicenseVerified] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/cart", { withCredentials: true })
      .then((res) => {
        setCartItems(res.data);
        // Calculate total amount
        const total = res.data.reduce((sum, item) => {
          return sum + (item.transfer_price * item.quantity);
        }, 0);
        setTotalAmount(total);
      })
      .catch((err) => console.error("Failed to load cart items:", err));
  }, []);

  const handleVerify = () => {
    if (!licenseNumber) {
      setError("License number is required.");
      return;
    }

    // Set loading state to true
    setIsVerifying(true);
    setError("");

    axios
      .post(
        "http://localhost:3000/api/verify-license",
        { licenseNumber },
        { withCredentials: true }
      )
      .then((res) => {
        setIsVerifying(false);
        if (res.data.verified) {
          setLicenseVerified(true);
          setError("");
        } else {
          setLicenseVerified(false);
          setError("Invalid or unregistered license.");
        }
      })
      .catch((err) => {
        setIsVerifying(false);
        setError("Verification failed. Try again.");
        console.error(err);
      });
  };

  const handlePay = () => {
    if (!licenseVerified) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000); // Hide after 3 seconds
      return;
    }

    alert("Proceeding to payment...");
    // Add payment logic here
  };

  return (
    <div className={styles.checkoutContainer}>
      <header className={styles.header}>
        <h1 className={styles.logo}>MediTrust</h1>
        <nav>
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
        <h2>Checkout</h2>

        {cartItems.length === 0 ? (
          <p className={styles.emptyCart}>Your cart is empty.</p>
        ) : (
          <>
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemDetails}>
                    <p><strong>{item.product_name}</strong> ({item.packet_size})</p>
                    <p>Price: ₹{item.transfer_price}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Total: ₹{item.transfer_price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="total-amount">
              <strong>Total Amount:</strong> ₹{totalAmount.toFixed(2)}
            </p>

            <div className={styles.verificationSection}>
              <input
                type="text"
                placeholder="Enter Pharmacy License Number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                disabled={isVerifying}
              />
              <button 
                onClick={handleVerify} 
                disabled={isVerifying || !licenseNumber}
              >
                {isVerifying ? "Verifying..." : "Verify License"}
              </button>
              
              {isVerifying && (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingBar}>
                    <div className={styles.loadingProgress}></div>
                  </div>
                  <p>Verifying license, please wait...</p>
                </div>
              )}
              
              {error && <p className={styles.error}>{error}</p>}
              {licenseVerified && (
                <p className={styles.verified}>License Verified ✅</p>
              )}
            </div>

            <button
              className={styles.payButton}
              onClick={handlePay}
              disabled={cartItems.length === 0 || !licenseVerified}
            >
              Pay
            </button>
          </>
        )}

        {showPopup && (
          <div className={styles.popup}>
            Please verify your pharmacy license before proceeding.
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 MediTrust. All rights reserved.</p>
        <p>Contact us: anshulmaddiwar@gmail.com; 7404675212</p>
      </footer>
    </div>
  );
};

export default CheckoutPage;
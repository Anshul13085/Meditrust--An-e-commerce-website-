import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ Add useNavigate
import styles from "./IndexPage.module.css";

const IndexPage = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate(); // ✅

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch("http://localhost:3000/auth-status", {
          credentials: "include",
        });
        const data = await response.json();
        setAuthStatus(data);

        // ✅ Redirect if user is already logged in
        if (data.loggedIn) {
          setUserName(data.userName); // Assuming the user object has a 'userName'
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching auth status", error);
      }
    };

    fetchAuthStatus();
  }, [navigate]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/logout", {
        method: "POST",
        credentials: "include",
      });
      setAuthStatus({ loggedIn: false });
      setUserName('');
      navigate("/"); // Redirect to home after logout
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <div className={styles.indexBody}>
      <header className={styles.header}>
        <h1>MediTrust</h1>
        <nav role="navigation">
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link to="/" className={styles.navLink}>Home</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/products" className={styles.navLink}>Products</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/cart" className={styles.navLink}>Cart</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/checkout" className={styles.navLink}>Checkout</Link>
            </li>
            <li className={styles.navItem}>
              <Link to="/about-us" className={styles.navLink}>About Us</Link>
            </li>
            <li className={styles.navItem}>
              {authStatus?.loggedIn ? (
                <>
                  <span className={styles.navLink}>Hello, {userName}!</span>
                  <button onClick={handleLogout} className={styles.navLink}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={styles.navLink}>Login</Link> |{" "}
                  <Link to="/signup" className={styles.navLink}>Sign Up</Link>
                </>
              )}
            </li>
          </ul>
        </nav>
      </header>

      <main className={styles.content}>
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>Welcome to MediTrust</h2>
          <p>Your Trusted Bulk Medicine Ordering Platform</p>
          <Link to="/products" className={styles.btn}>Shop Now</Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 MediTrust. All rights reserved.</p>
        <p>Contact us: anshulmaddiwar@gmail.com; 7404675212</p>
      </footer>
    </div>
  );
};

export default IndexPage;

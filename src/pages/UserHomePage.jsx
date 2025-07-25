import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./IndexPage.module.css";

const UserHome = () => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/auth-status", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.loggedIn) {
          setUserName(data.user.name);
        } else {
          navigate("/login"); // redirect to login if not authenticated
        }
      } catch (error) {
        console.error("Error fetching user info", error);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    fetch("http://localhost:3000/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => navigate("/")) // redirect to public index page after logout
      .catch((err) => console.error("Logout error:", err));
  };

  return (
    <div className={styles.indexBody}>
      <header className={styles.header}>
        <h1>MediTrust</h1>
        <nav role="navigation">
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link to="/home" className={styles.navLink}>Home</Link>
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
          </ul>
        </nav>
        <div className={styles.userSection}>
          <span>Welcome, {userName}</span>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>
      </header>
      
      <main className={styles.content}>
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>Welcome to MediTrust, {userName}</h2>
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

export default UserHome;

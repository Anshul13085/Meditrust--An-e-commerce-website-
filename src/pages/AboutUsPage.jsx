import React from "react";
import { Link } from "react-router-dom";
import styles from "./AboutUsPage.module.css";

const AboutUsPage = () => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>MediTrust</h1>
                <nav>
                    <ul className={styles.navList}>
                        <li className={styles.navItem}><Link to="/" className={styles.navLink}>Home</Link></li>
                        <li className={styles.navItem}><Link to="/products" className={styles.navLink}>Products</Link></li>
                        <li className={styles.navItem}><Link to="/cart" className={styles.navLink}>Cart</Link></li>
                        <li className={styles.navItem}><Link to="/checkout" className={styles.navLink}>Checkout</Link></li>
                        <li className={styles.navItem}><Link to="/about-us" className={styles.navLink}>About Us</Link></li>
                        <li className={styles.navItem}><Link to="/login" className={styles.navLink}>Login</Link></li>
                        <li className={styles.navItem}><Link to="/signup" className={styles.navLink}>Sign Up</Link></li>
                    </ul>
                </nav>
            </header>

            <main className={styles.aboutContainer}>
                <h2>About MediTrust</h2>
                <p>
                    Welcome to <strong>MediTrust</strong>, your trusted partner in bulk medicine procurement. We are an exclusive e-commerce platform developed specifically for <strong>Maneesh Pharmaceuticals Limited</strong>, connecting pharmacies and hospitals directly with the manufacturer. By eliminating intermediaries, we ensure that our buyers receive authentic, high-quality medicines at competitive prices with a seamless ordering experience.
                </p>

                <p>
                    At MediTrust, we understand the critical role pharmaceuticals play in healthcare. That’s why we prioritize transparency, efficiency, and affordability in our supply chain.
                </p>

                <div className={styles.highlights}>
                    <h3>Our Key Benefits:</h3>
                    <ul>
                        <li>Direct Manufacturer-to-Buyer Model – No middlemen, ensuring cost-effective pricing.</li>
                        <li>Genuine & Quality-Assured Medicines – Sourced directly from Maneesh Pharmaceuticals Limited.</li>
                        <li>Bulk Order Convenience – Order in large quantities with ease.</li>
                        <li>Secure & Verified Transactions – Only registered pharmacies and hospitals can purchase, ensuring compliance.</li>
                        <li>Fast & Reliable Delivery – Optimized logistics to get medicines to you on time.</li>
                    </ul>
                </div>

                <p><strong>Join us in revolutionizing the pharmaceutical supply chain</strong> by making essential medicines more accessible, affordable, and reliable.</p>

                <p>📍 <strong>MediTrust – A Platform by Maneesh Pharmaceuticals Limited</strong></p>
                <p>🔗 Your Trusted Partner in Bulk Medicine Procurement</p>
            </main>

            <footer className={styles.footer}>
                <p>&copy; 2025 MediTrust. All rights reserved.</p>
                <p>Contact us: anshulmaddiwar@gmail.com; 7404675212</p>
            </footer>
        </div>
    );
};

export default AboutUsPage;

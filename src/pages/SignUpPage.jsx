import React, { useState } from "react";
import styles from "./SignUpPage.module.css";

const SignUpPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission

        const response = await fetch("http://localhost:3000/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                email,
                password,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Signup successful! Redirecting to login...");
            window.location.href = "/login"; // Redirect to login page
        } else {
            setErrorMessage(data.error); // Show error message
        }
    };

    return (
        <div className={styles.authContainer}>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="name">Full Name:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Sign Up</button>
            </form>
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            <p>
                Already have an account? <a href="/login">Login</a>
            </p>
        </div>
    );
};

export default SignUpPage;

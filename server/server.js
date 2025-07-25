const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const axios = require("axios");  // Importing axios to make HTTP requests to Flask

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3001",  // Ensure this matches your frontend's URL
  credentials: true, // Enable cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

// Session config
app.use(session({
  secret: "meditrust_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,  // Change to true for production with HTTPS
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "InsIdIous",
  database: "meditrust",
});

db.connect(err => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected!");
  }
});

// License verification endpoint - calls the Python model
app.post("/api/verify-license", async (req, res) => {
  try {
    const { licenseNumber } = req.body;
    
    if (!licenseNumber) {
      return res.status(400).json({ error: "License number is required" });
    }

    // Call the Flask API for license verification
    const response = await axios.post("http://localhost:5001/verify-license", { 
      licenseNumber 
    });

    // Return the verification result
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error verifying license:", error);
    res.status(500).json({ 
      error: "Failed to verify license",
      verified: false 
    });
  }
});

// Auth status
app.get("/auth-status", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.status(200).json({ message: "Login successful", user: req.session.user });
  });
});

// Signup
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query("SELECT id FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length > 0) return res.status(400).json({ error: "Email already registered" });

    db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
      [name, email, hashedPassword], 
      (err) => {
        if (err) return res.status(500).json({ error: "Signup failed" });
        res.status(201).json({ message: "Signup successful" });
      });
  });
});

// Get all medicines
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM medicines", (err, results) => {
    if (err) {
      console.error("Error fetching medicines:", err);
      res.status(500).json({ error: "Failed to fetch medicines" });
    } else {
      res.status(200).json(results);
    }
  });
});

// Add item to cart
app.post("/api/cart", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Valid product ID and quantity required" });
  }

  // Check if medicine exists by sr_number
  db.query("SELECT * FROM medicines WHERE sr_number = ?", [productId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error during product lookup" });
    if (result.length === 0) return res.status(400).json({ error: "Product not found" });

    // Check if the item already exists in the user's cart
    db.query(
      "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
      [userId, productId],
      (err, existingCart) => {
        if (err) return res.status(500).json({ error: "Error checking cart" });

        if (existingCart.length > 0) {
          // If item already exists, update quantity
          const newQuantity = existingCart[0].quantity + quantity;
          db.query(
            "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
            [newQuantity, userId, productId],
            (err) => {
              if (err) return res.status(500).json({ error: "Failed to update cart quantity" });
              res.status(200).json({ message: "Cart updated with new quantity" });
            }
          );
        } else {
          // If item doesn't exist, add new item to cart
          db.query(
            "INSERT INTO cart (user_id, product_id, quantity, added_at) VALUES (?, ?, ?, NOW())",
            [userId, productId, quantity],
            (err) => {
              if (err) {
                console.error("Error adding to cart:", err);
                return res.status(500).json({ error: "Failed to add item to cart" });
              }
              res.status(200).json({ message: "Item added to cart" });
            }
          );
        }
      }
    );
  });
});

// Get cart items for user
app.get("/api/cart", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;

  const query = `
    SELECT c.id, c.product_id, c.quantity, c.added_at, m.*
    FROM cart c
    JOIN medicines m ON c.product_id = m.sr_number
    WHERE c.user_id = ?;
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching cart:", err);
      return res.status(500).json({ error: "Failed to fetch cart" });
    }
    res.status(200).json(results);
  });
});

// Remove item from cart
app.delete("/api/cart/remove/:productId", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;
  const productId = req.params.productId;

  // Delete item from cart
  const query = "DELETE FROM cart WHERE user_id = ? AND product_id = ?";
  db.query(query, [userId, productId], (err, result) => {
    if (err) {
      console.error("Error removing item from cart:", err);
      return res.status(500).json({ error: "Failed to remove item from cart" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    res.status(200).json({ message: "Item removed from cart" });
  });
});

// Update cart item quantity
app.post("/api/cart/update", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Valid product ID and quantity required" });
  }

  // Update quantity in cart
  const query = "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?";
  db.query(query, [quantity, userId, productId], (err, result) => {
    if (err) {
      console.error("Error updating cart item:", err);
      return res.status(500).json({ error: "Failed to update cart item" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    res.status(200).json({ message: "Cart item updated successfully" });
  });
});

// Integration with Flask backend for predictions (optional)
app.post("/api/predict-demand", async (req, res) => {
  try {
    const { productId } = req.body;

    // Make a request to Flask backend to predict demand
    const response = await axios.post("http://localhost:5001/predict", { productId });

    res.json(response.data);
  } catch (error) {
    console.error("Error connecting to Flask backend:", error);
    res.status(500).json({ error: "Failed to fetch prediction from Flask backend" });
  }
});

// Starting server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
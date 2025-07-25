import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Product.module.css';

const ProductPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [user, setUser] = useState(null);

  // Fetch user and recommendations
  useEffect(() => {
    const fetchRecommendations = async (userId) => {
      try {
        const response = await axios.post('http://localhost:5001/user_recommendations', {
          user_id: userId,
        });
        const recommendedProducts = response.data.recommended_products || [];
        setRecommendations(recommendedProducts);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    axios.get('http://localhost:3000/auth-status', { withCredentials: true })
      .then((response) => {
        if (response.data.loggedIn) {
          setUser(response.data.user);
          fetchRecommendations(response.data.user.id);
        }
      })
      .catch((error) => {
        console.error('Error checking auth status:', error);
      });
  }, []);

  // Fetch products
  useEffect(() => {
    axios.get('http://localhost:3000/api/products', { withCredentials: true })
      .then((response) => {
        const allProducts = response.data;
        setProducts(allProducts);

        // Set default quantity only for products not already set
        setQuantities(prev => {
          const newQuantities = { ...prev };
          allProducts.forEach(product => {
            if (!newQuantities.hasOwnProperty(product.sr_number)) {
              newQuantities[product.sr_number] = 1;
            }
          });
          return newQuantities;
        });
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      });
  }, []);

  // Quantity handlers
  const handleQuantityChange = (productId, value) => {
    const number = parseInt(value);
    if (!isNaN(number) && number > 0) {
      setQuantities(prev => ({ ...prev, [productId]: number }));
    }
  };

  const increaseQuantity = (productId) => {
    setQuantities(prev => ({ ...prev, [productId]: (prev[productId] || 1) + 1 }));
  };

  const decreaseQuantity = (productId) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      return { ...prev, [productId]: current > 1 ? current - 1 : 1 };
    });
  };

  const showTemporaryPopup = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const handleAddToCart = async (product, quantity) => {
  if (!user) {
    showTemporaryPopup('You must be logged in to add items to the cart.');
    return;
  }

  // Ensure we have a valid product ID
  const productId = product.sr_number || product.product_id;

  if (!productId) {
    console.error("Invalid product ID:", product);
    showTemporaryPopup('Failed to add item to cart: Invalid product ID');
    return;
  }

  try {
    console.log("Adding to cart:", {productId, quantity, product});
    
    const response = await axios.post('http://localhost:3000/api/cart', {
      productId,
      quantity,
    }, { withCredentials: true });

    if (response.status === 200) {
      showTemporaryPopup(`${product.product_name} added to cart!`);
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    showTemporaryPopup('Failed to add item to cart.');
  }
};

  const term = searchTerm.toLowerCase();

  const filteredRecommendations = recommendations.filter((product) =>
    product.product_name?.toLowerCase().includes(term) ||
    product.generic_name?.toLowerCase().includes(term)
  );

  const recommendedIds = new Set(recommendations.map(p => p.sr_number));
  const filteredProducts = products
    .filter(product => !recommendedIds.has(product.sr_number))
    .filter(product =>
      product.product_name?.toLowerCase().includes(term) ||
      product.generic_name?.toLowerCase().includes(term)
    );

  // Standard product card renderer
const renderProductCard = (product) => {
  const productId = product.sr_number;
  
  return (
    <div key={productId} className={styles.card}>
      <h3>{product.product_name?.trim()}</h3>
      <p><strong>Generic Name:</strong> {product.generic_name}</p>
      <p><strong>Composition:</strong> {product.composition}</p>
      <p><strong>Uses:</strong> {product.uses}</p>
      <p><strong>Storage:</strong> {product.storage_condition}</p>

      <div className={styles.bottomSection}>
        <p className={styles.packetSize}><strong>Pack Size:</strong> {product.packet_size}</p>
        <p className={styles.price}><strong>Price:</strong> ₹{product.transfer_price}</p>

        <div className={styles.quantityAddContainer}>
          <div className={styles.quantityControl}>
            <button onClick={() => decreaseQuantity(productId)}>-</button>
            <input
              type="number"
              min="1"
              value={quantities[productId] || 1}
              onChange={(e) => handleQuantityChange(productId, e.target.value)}
            />
            <button onClick={() => increaseQuantity(productId)}>+</button>
          </div>
          <button
            className={styles.addButton}
            onClick={() => handleAddToCart(product, quantities[productId] || 1)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

// Recommended product card renderer
const renderRecommendedCard = (product) => {
  // Round up the recommended quantity to the next integer
  const recommendedQty = Math.ceil(product.predicted_quantity);
  const productId = product.product_id || product.sr_number;
  
  return (
    <div key={productId} className={`${styles.card} ${styles.recommendedCard}`}>
      <div className={styles.recommendedBadge}>Recommended</div>
      <h3>{product.product_name?.trim()}</h3>
      <p><strong>Generic Name:</strong> {product.generic_name}</p>
      <p><strong>Composition:</strong> {product.composition}</p>
      <p><strong>Uses:</strong> {product.uses}</p>
      <p><strong>Storage:</strong> {product.storage_condition}</p>

      <div className={styles.bottomSection}>
        <p className={styles.packetSize}><strong>Pack Size:</strong> {product.packet_size}</p>
        <p className={styles.price}><strong>Price:</strong> ₹{product.transfer_price}</p>
        
        <div className={styles.quantityAddContainer}>
          <div className={styles.quantityWrapper}>
            <div className={styles.quantityControl}>
              <button onClick={() => decreaseQuantity(productId)}>-</button>
              <input
                type="number"
                min="1"
                value={quantities[productId] || 1}
                onChange={(e) => handleQuantityChange(productId, e.target.value)}
              />
              <button onClick={() => increaseQuantity(productId)}>+</button>
            </div>
            <button 
              className={styles.recommendedQtyButton}
              onClick={() => {
                // Apply recommended quantity only to this specific product
                setQuantities(prev => ({
                  ...prev,
                  [productId]: recommendedQty
                }));
              }}
            >
              Use Recommended ({recommendedQty})
            </button>
          </div>
          <button
            className={styles.addButton}
            onClick={() => {
              const quantity = quantities[productId] || 1;
              const productForCart = {
                ...product,
                sr_number: productId  // Ensure sr_number is set correctly
              };
              handleAddToCart(productForCart, quantity);
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className={styles.container}>
      <div className={styles.topButtons}>
        <button onClick={() => navigate('/')} className={styles.navButton}>Home</button>
        <button onClick={() => navigate('/cart')} className={styles.navButton}>Cart</button>
      </div>

      <h2 className={styles.heading}>Medicines</h2>
      <input
        type="text"
        placeholder="Search medicines..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchBar}
      />

      {filteredRecommendations.length > 0 && (
        <>
          <h3 className={styles.recommendationsHeading}>Recommended For You</h3>
          <div className={styles.recommendationsGrid}>
            {filteredRecommendations.map(renderRecommendedCard)}
          </div>
        </>
      )}

      <div className={styles.grid}>
        {filteredProducts.map(renderProductCard)}
      </div>

      {showPopup && <div className={styles.popup}>{popupMessage}</div>}
    </div>
  );
};

export default ProductPage;

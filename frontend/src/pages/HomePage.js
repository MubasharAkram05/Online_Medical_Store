import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { medicineService } from '../services/medicineService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import MedicineCard from '../components/medicine/MedicineCard';
import { CATEGORIES } from '../utils/constants';
import './HomePage.css';

/**
 * useAutoScrollRow — continuous right-to-left auto-scroll for a horizontal
 * row. Only visibly active on mobile, where the target becomes a scrollable
 * single-row flex container (see HomePage.css); on desktop those containers
 * have no overflow, so this is a harmless no-op.
 */
const useAutoScrollRow = (intervalMs = 3000) => {
  const ref = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const el = ref.current;
      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      if (el.scrollLeft >= maxScroll - 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const card = el.firstElementChild;
        const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return ref;
};

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await medicineService.getAll({ limit: 6, featured: true });
        setFeaturedProducts(response.data.medicines || response.data || []);
      } catch (error) {
        // Fallback to mock data if API fails
        const mockProducts = [
          { id: 1, name: 'Paracetamol 500mg', description: 'Relieves pain and lowers your body temperature', price: 25, quantity: 17, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', category: 'Medicines' },
          { id: 2, name: 'Antibiotic Amoxicillin', description: 'Treats bacterial infections', price: 150, quantity: 25, image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=400&fit=crop', category: 'Medicines' },
          { id: 3, name: 'Ibuprofen 400mg', description: 'Pain relief and anti-inflammatory', price: 45, quantity: 30, image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop', category: 'Medicines' },
          { id: 4, name: 'Azithromycin 500mg', description: 'Antibiotic for respiratory infections', price: 200, quantity: 15, image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop', category: 'Medicines' },
          { id: 5, name: 'Cetirizine 10mg', description: 'Antihistamine for allergies', price: 35, quantity: 40, image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c16?w=400&h=400&fit=crop', category: 'Medicines' },
          { id: 6, name: 'Omeprazole 20mg', description: 'Treats acid reflux and heartburn', price: 120, quantity: 22, image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop', category: 'Medicines' }
        ];
        setFeaturedProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const heroFeaturesRef = useAutoScrollRow(2500);
  const featuresScrollRef = useAutoScrollRow(3000);

  const getCategoryEmoji = (categoryName) => {
    switch (categoryName) {
      case 'Baby Care':
        return '👶';
      case 'First Aid':
        return '➕';
      case 'Medical Devices':
        return '🩺';
      case 'Medicines':
        return '💊';
      case 'Personal Care':
        return '🧴';
      case 'Vitamins & Supplements':
        return '🌿';
      default:
        return '📁';
    }
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Your Health, Our Priority</h1>
          <p className="hero-subtitle">
            Get authentic medicines delivered to your doorstep. Trusted by thousands of customers.
          </p>
          <div className="hero-buttons">
            <Link to="/medicines">
              <Button variant="primary" size="large">Shop Now</Button>
            </Link>
            <Link to="/medicines">
              <Button variant="outline" size="large">Browse Products</Button>
            </Link>
          </div>
          <div className="hero-features" ref={heroFeaturesRef}>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Authentic Medicines</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚚</span>
              <span>Fast Delivery</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💊</span>
              <span>Prescription Support</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎧</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Browse our wide range of healthcare products</p>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((category) => (
              <Link key={category.id} to={`/medicines?category=${encodeURIComponent(category.name)}`}>
                <Card className="category-card">
                  <span className="category-emoji">{getCategoryEmoji(category.name)}</span>
                  <div className="category-card-content">
                    <h3 className="category-name">{category.name}</h3>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Popular medicines and health products</p>
          </div>
          {loading ? (
            <div className="loading">Loading featured products...</div>
          ) : (
            <div className="products-grid">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <MedicineCard key={product.id} medicine={product} />
                ))
              ) : (
                <p>No featured products available</p>
              )}
            </div>
          )}
          <div className="section-footer">
            <Link to="/medicines">
              <Button variant="outline" size="medium">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Us?</h2>
          </div>
          <div className="features-grid" ref={featuresScrollRef}>
            <Card className="feature-card">
              <div className="feature-icon-large">💊</div>
              <h3 className="feature-title">Authentic Products</h3>
              <p className="feature-text">100% genuine medicines from licensed suppliers</p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon-large">🚚</div>
              <h3 className="feature-title">Fast Delivery</h3>
              <p className="feature-text">Quick and reliable delivery to your doorstep</p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon-large">👨‍⚕️</div>
              <h3 className="feature-title">Expert Support</h3>
              <p className="feature-text">24/7 customer support from healthcare experts</p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon-large">💰</div>
              <h3 className="feature-title">Best Prices</h3>
              <p className="feature-text">Competitive prices on all healthcare products</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;


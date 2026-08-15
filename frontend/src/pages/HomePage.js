import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { medicineService } from '../services/medicineService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import MedicineCard from '../components/medicine/MedicineCard';
import { CATEGORIES } from '../utils/constants';
import './HomePage.css';

/**
 * useMarqueeScroll — frame-by-frame right-to-left auto-scroll that never
 * pauses (unlike interval-based scrolling, which visibly steps and stops
 * between jumps). The row's content must be rendered twice back-to-back
 * (see the `[0, 1].map(...)` usage below); once scrollLeft passes the
 * midpoint (end of the first copy) it wraps back by exactly that width,
 * which is invisible since the second copy is identical to the first.
 * Pauses on hover/touch and respects prefers-reduced-motion.
 */
const useMarqueeScroll = (speedPxPerSec = 40) => {
  const ref = useRef(null);
  const pausedRef = useRef(false);
  // Tracked separately from el.scrollLeft, which the browser rounds to a
  // whole pixel on every write — reading it back to compute the next step
  // would silently drop any sub-pixel-per-frame speed (it always rounds
  // back down to the same integer, so the row never appears to move).
  const positionRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    let rafId;
    let lastTs = null;

    const step = (ts) => {
      const el = ref.current;
      if (el) {
        if (lastTs === null) lastTs = ts;
        const dt = ts - lastTs;
        lastTs = ts;

        if (!pausedRef.current) {
          const halfWidth = el.scrollWidth / 2;
          if (halfWidth > el.clientWidth) {
            if (positionRef.current === null) positionRef.current = el.scrollLeft;
            let next = positionRef.current + (speedPxPerSec * dt) / 1000;
            if (next >= halfWidth) next -= halfWidth;
            if (next < 0) next += halfWidth;
            positionRef.current = next;
            el.scrollLeft = next;
          }
        }
      } else {
        lastTs = null;
        positionRef.current = null;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [speedPxPerSec]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };
  // Lets an arrow button nudge the row without the auto-scroll loop
  // overwriting the jump on the very next frame — it mutates the same
  // positionRef the loop reads from, instead of touching el.scrollLeft
  // directly (which the loop doesn't know about).
  const nudge = (deltaPx) => {
    const el = ref.current;
    if (!el) return;
    const halfWidth = el.scrollWidth / 2;
    let base = positionRef.current === null ? el.scrollLeft : positionRef.current;
    let next = base + deltaPx;
    if (halfWidth > 0) {
      next = ((next % halfWidth) + halfWidth) % halfWidth;
    }
    positionRef.current = next;
    el.scrollLeft = next;
  };

  return { ref, pause, resume, nudge };
};

/**
 * useBurstAutoScroll — like useMarqueeScroll, but automatically pauses for
 * `burstPauseMs` after every `cardsPerBurst` cards' worth of distance has
 * scrolled by, then resumes. An arrow-button nudge (via `nudge`) pauses for
 * its own given duration instead, overriding any burst pause in progress.
 */
const useBurstAutoScroll = (speedPxPerSec, cardsPerBurst, burstPauseMs) => {
  const ref = useRef(null);
  const hoverPausedRef = useRef(false);
  const pausedUntilRef = useRef(0);
  const positionRef = useRef(null);
  const distanceRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    let rafId;
    let lastTs = null;

    const step = (ts) => {
      const el = ref.current;
      if (el) {
        if (lastTs === null) lastTs = ts;
        const dt = ts - lastTs;
        lastTs = ts;

        if (!hoverPausedRef.current && ts >= pausedUntilRef.current) {
          const halfWidth = el.scrollWidth / 2;
          if (halfWidth > el.clientWidth) {
            if (positionRef.current === null) positionRef.current = el.scrollLeft;
            const delta = (speedPxPerSec * dt) / 1000;
            let next = positionRef.current + delta;
            if (next >= halfWidth) next -= halfWidth;
            if (next < 0) next += halfWidth;
            positionRef.current = next;
            el.scrollLeft = next;

            const card = el.firstElementChild;
            const cardStep = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.5;
            distanceRef.current += delta;
            if (distanceRef.current >= cardStep * cardsPerBurst) {
              distanceRef.current = 0;
              pausedUntilRef.current = ts + burstPauseMs;
            }
          }
        }
      } else {
        lastTs = null;
        positionRef.current = null;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [speedPxPerSec, cardsPerBurst, burstPauseMs]);

  const pause = () => { hoverPausedRef.current = true; };
  const resume = () => { hoverPausedRef.current = false; };
  const nudge = (deltaPx, pauseMs) => {
    const el = ref.current;
    if (!el) return;
    const halfWidth = el.scrollWidth / 2;
    let base = positionRef.current === null ? el.scrollLeft : positionRef.current;
    let next = base + deltaPx;
    if (halfWidth > 0) {
      next = ((next % halfWidth) + halfWidth) % halfWidth;
    }
    positionRef.current = next;
    el.scrollLeft = next;
    distanceRef.current = 0;
    if (pauseMs) pausedUntilRef.current = performance.now() + pauseMs;
  };

  return { ref, pause, resume, nudge };
};

const HERO_FEATURES = [
  { icon: '✓', label: 'Authentic Medicines' },
  { icon: '🚚', label: 'Fast Delivery' },
  { icon: '💊', label: 'Prescription Support' },
  { icon: '🎧', label: '24/7 Support' },
];

const WHY_CHOOSE_FEATURES = [
  { icon: '💊', title: 'Authentic Products', text: '100% genuine medicines from licensed suppliers' },
  { icon: '🚚', title: 'Fast Delivery', text: 'Quick and reliable delivery to your doorstep' },
  { icon: '👨‍⚕️', title: 'Expert Support', text: '24/7 customer support from healthcare experts' },
  { icon: '💰', title: 'Best Prices', text: 'Competitive prices on all healthcare products' },
];

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

  const whyChooseFeatures = useMarqueeScroll(25);
  const categories = useBurstAutoScroll(20, 3, 3000);

  const scrollCategories = (direction) => {
    const el = categories.ref.current;
    if (!el) return;
    const card = el.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.5;
    categories.nudge(direction * step, 5000);
  };

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
              <Button variant="primary" size="large">Browse Products</Button>
            </Link>
          </div>
          <div className="hero-features">
            {HERO_FEATURES.map((feature) => (
              <div className="feature-item" key={feature.label}>
                <span className="feature-icon">{feature.icon}</span>
                <span>{feature.label}</span>
              </div>
            ))}
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
          <div className="categories-carousel">
            <button
              type="button"
              className="carousel-arrow carousel-arrow-left"
              onClick={() => scrollCategories(-1)}
              aria-label="Previous category"
            >
              ‹
            </button>
            <div
              className="categories-grid"
              ref={categories.ref}
              onMouseEnter={categories.pause}
              onMouseLeave={categories.resume}
              onTouchStart={categories.pause}
              onTouchEnd={categories.resume}
            >
              {[0, 1].map((copy) => (
                <React.Fragment key={copy}>
                  {CATEGORIES.map((category) => (
                    <Link key={`${copy}-${category.id}`} to={`/medicines?category=${encodeURIComponent(category.name)}`}>
                      <Card className="category-card">
                        <span className="category-emoji">{getCategoryEmoji(category.name)}</span>
                        <div className="category-card-content">
                          <h3 className="category-name">{category.name}</h3>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <button
              type="button"
              className="carousel-arrow carousel-arrow-right"
              onClick={() => scrollCategories(1)}
              aria-label="Next category"
            >
              ›
            </button>
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
          <div
            className="features-grid"
            ref={whyChooseFeatures.ref}
            onMouseEnter={whyChooseFeatures.pause}
            onMouseLeave={whyChooseFeatures.resume}
            onTouchStart={whyChooseFeatures.pause}
            onTouchEnd={whyChooseFeatures.resume}
          >
            {[0, 1].map((copy) => (
              <React.Fragment key={copy}>
                {WHY_CHOOSE_FEATURES.map((feature) => (
                  <Card className="feature-card" key={`${copy}-${feature.title}`}>
                    <div className="feature-icon-large">{feature.icon}</div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-text">{feature.text}</p>
                  </Card>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;


import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import MedicineCard from '../components/medicine/MedicineCard';
import Button from '../components/common/Button';
import { toast } from 'react-toastify';
import { medicineService } from '../services/medicineService';
import './MedicinesPage.css';

const BROWSE_FILTERS = [
  { id: 'all', label: 'All Products', description: 'Browse the full catalogue', icon: '🛍️' },
  { id: 'prescription', label: 'Prescription Drugs', description: 'Requires doctor approval', icon: '💊' },
  { id: 'otc', label: 'OTC Essentials', description: 'No prescription needed', icon: '🛒' },
  { id: 'wellness', label: 'Wellness & Care', description: 'Vitamins, supplements & personal care', icon: '🌿' }
];

const WELLNESS_CATEGORIES = ['Vitamins & Supplements', 'Personal Care', 'Baby Care', 'First Aid', 'Wellness'];
const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'priceLowHigh', label: 'Price: Low to High' },
  { id: 'priceHighLow', label: 'Price: High to Low' },
  { id: 'popularity', label: 'Popularity' }
];

const MedicinesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [browseFilter, setBrowseFilter] = useState('all');
  const [allMedicines, setAllMedicines] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('relevance');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scrollRestored, setScrollRestored] = useState(false);

  // Restore scroll position when returning from detail page
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('medicinesPageScrollPosition');
    if (savedScrollPosition && !scrollRestored && !loading && medicines.length > 0) {
      // Wait for content to render, then restore scroll position
      const restoreScroll = () => {
        const scrollY = parseInt(savedScrollPosition, 10);
        window.scrollTo({
          top: scrollY,
          behavior: 'instant'
        });
        setScrollRestored(true);
        // Clear the saved position after restoring
        sessionStorage.removeItem('medicinesPageScrollPosition');
      };

      // Use multiple strategies to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScroll();
        });
      });
    }
  }, [scrollRestored, loading, medicines.length]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await medicineService.getAll();
        const items = response.data?.medicines || response.data || [];
        setAllMedicines(items);
        setMedicines(items);

        const uniqueCategories = Array.from(
          new Set(items.map((item) => item.category).filter(Boolean))
        );
        setCategories(['All Categories', ...uniqueCategories]);
      } catch (error) {
        toast.error('Unable to load products from the server.');
        setAllMedicines([]);
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchQuery.trim().toLowerCase();
    const nextSuggestions = allMedicines
      .filter((item) => {
        const brand = item.brand || '';
        const cat = item.category || '';
        return (
          item.name.toLowerCase().includes(query) ||
          (brand && brand.toLowerCase().includes(query)) ||
          (cat && cat.toLowerCase().includes(query))
        );
      })
      .slice(0, 6);
    setSuggestions(nextSuggestions);
  }, [searchQuery, allMedicines]);

  const filteredMedicines = useMemo(() => {
    let filtered = [...allMedicines];

    if (browseFilter === 'prescription') {
      filtered = filtered.filter((item) => Boolean(item.requires_prescription));
    } else if (browseFilter === 'otc') {
      filtered = filtered.filter((item) => !item.requires_prescription);
    } else if (browseFilter === 'wellness') {
      filtered = filtered.filter((item) =>
        WELLNESS_CATEGORIES.includes(item.category || '')
      );
    }

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(
        (item) => (item.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const brand = item.brand || '';
        return (
          item.name.toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          brand.toLowerCase().includes(query) ||
          (item.category || '').toLowerCase().includes(query)
        );
      });

      filtered = filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        return aName.indexOf(query) - bName.indexOf(query);
      });
    }

    if (sortOption === 'priceLowHigh') {
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === 'priceHighLow') {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOption === 'popularity') {
      filtered.sort((a, b) => (b.popularity || b.stock || 0) - (a.popularity || a.stock || 0));
    }

    return filtered;
  }, [allMedicines, browseFilter, selectedCategory, searchQuery, sortOption]);

  useEffect(() => {
    setMedicines(filteredMedicines);
  }, [filteredMedicines]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
    }
  };

  return (
    <div className="medicines-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Products</h1>
        </div>

        <div className="browse-strip">
          {BROWSE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`browse-chip ${browseFilter === filter.id ? 'active' : ''}`}
              onClick={() => setBrowseFilter(filter.id)}
            >
              <span className="chip-icon">{filter.icon}</span>
              <div className="chip-text">
                <strong>{filter.label}</strong>
                <small>{filter.description}</small>
              </div>
            </button>
          ))}
        </div>

        <div className="search-filter-bar">
          <div className="search-wrapper">
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search by medicine, brand, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <i className="icon">🔍</i>
              </button>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <ul
                className="suggestions-list"
                onMouseLeave={() => setShowSuggestions(false)}
              >
                {suggestions.map((item) => (
                  <li
                    key={item.id}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setSearchQuery(item.name);
                      setShowSuggestions(false);
                    }}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.category || 'Uncategorized'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="filter-controls">
            <select
              className="category-filter"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (e.target.value === 'All Categories') {
                  setSearchParams({});
                } else {
                  setSearchParams({ category: e.target.value });
                }
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat === 'All Categories' ? 'All Categories' : cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              className="sort-filter"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <>
            {medicines.length > 0 ? (
              <div className="products-grid">
                {medicines.map((medicine) => (
                  <MedicineCard key={medicine.id} medicine={medicine} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <p>No products found matching your criteria.</p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Categories');
                  setSearchParams({});
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MedicinesPage;


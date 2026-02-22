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
const CATEGORY_ALIASES = {
  all: 'All Categories',
  'all categories': 'All Categories',
  medicines: 'Medicines',
  'medical devices': 'Medical Devices',
  'medical-devices': 'Medical Devices',
  'personal care': 'Personal Care',
  'personal-care': 'Personal Care',
  'baby care': 'Baby Care',
  'baby-care': 'Baby Care',
  'first aid': 'First Aid',
  'first-aid': 'First Aid',
  vitamins: 'Vitamins & Supplements',
  'vitamins and supplements': 'Vitamins & Supplements',
  'vitamins & supplements': 'Vitamins & Supplements',
  'vitamins-and-supplements': 'Vitamins & Supplements'
};
const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'priceLowHigh', label: 'Price: Low to High' },
  { id: 'priceHighLow', label: 'Price: High to Low' },
  { id: 'popularity', label: 'Popularity' }
];

const normalizeCategoryKey = (value) =>
  decodeURIComponent(String(value || ''))
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const WELLNESS_CATEGORY_KEYS = new Set(WELLNESS_CATEGORIES.map(normalizeCategoryKey));

const MedicinesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const rawUrlCategory = searchParams.get('category') || '';

  const [allMedicines, setAllMedicines] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [loading, setLoading] = useState(true);
  const [scrollRestored, setScrollRestored] = useState(false);

  // State for filter controls that are not in the URL
  const [browseFilter, setBrowseFilter] = useState('all');
  const [sortOption, setSortOption] = useState('relevance');

  // Local state for the search input, synced with URL
  const [searchInput, setSearchInput] = useState(urlSearch);

  // State for UI elements like suggestion visibility
  const [showSuggestions, setShowSuggestions] = useState(false);

  const normalizedCategory = useMemo(() => {
    if (!rawUrlCategory) return 'All Categories';

    const decoded = decodeURIComponent(rawUrlCategory).trim().toLowerCase();
    const aliasMatch = CATEGORY_ALIASES[decoded];
    if (aliasMatch) return aliasMatch;

    const normalizedRaw = normalizeCategoryKey(decoded);
    if (CATEGORY_ALIASES[normalizedRaw]) {
      return CATEGORY_ALIASES[normalizedRaw];
    }

    const directMatch = categories.find(
      (category) => {
        const categoryKey = normalizeCategoryKey(category);
        return categoryKey === normalizeCategoryKey(decoded) || categoryKey === normalizedRaw;
      }
    );
    if (directMatch) return directMatch;

    const slugMatch = categories.find((category) =>
      normalizeCategoryKey(category) === normalizeCategoryKey(decoded.replace(/-/g, ' '))
    );

    return slugMatch || 'All Categories';
  }, [rawUrlCategory, categories]);

  // Sync search input with URL search param if it changes (e.g. back/forward)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Canonicalize category query so both direct URL and navigation links behave consistently.
  useEffect(() => {
    if (!rawUrlCategory) return;

    const current = decodeURIComponent(rawUrlCategory).trim();
    if (normalizedCategory === 'All Categories') {
      return;
    }

    if (current.toLowerCase() !== normalizedCategory.toLowerCase()) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('category', normalizedCategory);
      setSearchParams(nextParams, { replace: true });
    }
  }, [rawUrlCategory, normalizedCategory, searchParams, setSearchParams]);

  // Restore scroll position when returning from detail page
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('medicinesPageScrollPosition');
    const canRestore = sessionStorage.getItem('medicinesPageCanRestore') === '1';

    if (!scrollRestored && !loading && allMedicines.length > 0 && canRestore && savedScrollPosition) {
      const restoreScroll = () => {
        const scrollY = parseInt(savedScrollPosition, 10);
        window.scrollTo({ top: scrollY, behavior: 'instant' });
        setScrollRestored(true);
        sessionStorage.removeItem('medicinesPageScrollPosition');
        sessionStorage.removeItem('medicinesPageCanRestore');
      };
      requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
      return;
    }

    if (!scrollRestored && !loading) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setScrollRestored(true);
      sessionStorage.removeItem('medicinesPageScrollPosition');
      sessionStorage.removeItem('medicinesPageCanRestore');
    }
  }, [scrollRestored, loading, allMedicines.length]);

  // Fetch all medicines and categories once on component mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await medicineService.getAll();
        const items = response.data?.medicines || response.data || [];
        setAllMedicines(items);

        const categoryMap = new Map();
        items.forEach((item) => {
          if (!item.category) return;
          const label = String(item.category).trim();
          const key = normalizeCategoryKey(label);
          if (key && !categoryMap.has(key)) {
            categoryMap.set(key, label);
          }
        });
        setCategories(['All Categories', ...Array.from(categoryMap.values())]);
      } catch (error) {
        toast.error('Unable to load products from the server.');
        setAllMedicines([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const query = searchInput.trim().toLowerCase();
    return allMedicines
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
  }, [searchInput, allMedicines]);

  const filteredMedicines = useMemo(() => {
    let filtered = [...allMedicines];

    if (browseFilter === 'prescription') {
      filtered = filtered.filter((item) => Boolean(item.requires_prescription));
    } else if (browseFilter === 'otc') {
      filtered = filtered.filter((item) => !item.requires_prescription);
    } else if (browseFilter === 'wellness') {
      filtered = filtered.filter((item) =>
        WELLNESS_CATEGORY_KEYS.has(normalizeCategoryKey(item.category || ''))
      );
    }

    if (normalizedCategory !== 'All Categories') {
      const activeCategoryKey = normalizeCategoryKey(normalizedCategory);
      filtered = filtered.filter(
        (item) => normalizeCategoryKey(item.category || '') === activeCategoryKey
      );
    }

    if (urlSearch.trim()) {
      const query = urlSearch.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const brand = item.brand || '';
        return (
          item.name.toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          brand.toLowerCase().includes(query) ||
          (item.category || '').toLowerCase().includes(query)
        );
      });
      filtered.sort((a, b) => a.name.toLowerCase().indexOf(query) - b.name.toLowerCase().indexOf(query));
    }

    if (sortOption === 'priceLowHigh') {
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === 'priceHighLow') {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOption === 'popularity') {
      filtered.sort((a, b) => (b.popularity || b.stock || 0) - (a.popularity || a.stock || 0));
    }

    return filtered;
  }, [allMedicines, browseFilter, normalizedCategory, urlSearch, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newSearchParams.set('search', searchInput.trim());
    } else {
      newSearchParams.delete('search');
    }
    setSearchParams(newSearchParams);
    setShowSuggestions(false);
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    const newSearchParams = new URLSearchParams(searchParams);
    if (newCategory === 'All Categories') {
      newSearchParams.delete('category');
    } else {
      newSearchParams.set('category', newCategory);
    }
    setSearchParams(newSearchParams);
  };

  const handleClearFilters = () => {
    setBrowseFilter('all');
    setSortOption('relevance');
    setSearchInput('');
    setSearchParams({});
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
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search by medicine, brand, or category..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                      setSearchInput(item.name);
                      setShowSuggestions(false);
                      const newSearchParams = new URLSearchParams(searchParams);
                      newSearchParams.set('search', item.name);
                      setSearchParams(newSearchParams);
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
              value={normalizedCategory}
              onChange={handleCategoryChange}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
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
            {filteredMedicines.length > 0 ? (
              <div className="products-grid">
                {filteredMedicines.map((medicine) => (
                  <MedicineCard key={medicine.id} medicine={medicine} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <p>No products found matching your criteria.</p>
                <Button variant="outline" onClick={handleClearFilters}>
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


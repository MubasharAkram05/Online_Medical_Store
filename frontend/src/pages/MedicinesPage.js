import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MedicineCard from '../components/medicine/MedicineCard';
import Button from '../components/common/Button';
import { toast } from 'react-toastify';
import { medicineService } from '../services/medicineService';
import './MedicinesPage.css';

const MedicinesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [allMedicines, setAllMedicines] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [loading, setLoading] = useState(true);

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
    let filtered = [...allMedicines];

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(
        (item) => (item.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query)
      );
    }

    setMedicines(filtered);
  }, [searchQuery, selectedCategory, allMedicines]);

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

        <div className="search-filter-bar">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <i className="icon">🔍</i>
            </button>
          </form>
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
            {categories.map(cat => (
              <option key={cat} value={cat === 'All Categories' ? 'All Categories' : cat}>
                {cat}
              </option>
            ))}
          </select>
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


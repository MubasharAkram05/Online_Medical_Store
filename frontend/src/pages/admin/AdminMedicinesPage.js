import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import AddProductModal from '../../components/admin/AddProductModal';
import { adminService } from '../../services/adminService';
import './AdminMedicinesPage.css';

const AdminMedicinesPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [suppliers, setSuppliers] = useState([]);
  const navigate = useNavigate();

  const filteredMedicines = useMemo(() => {
    let result = [...medicines];

    // Category Tabs Filtering
    if (categoryFilter === 'Prescription') {
      result = result.filter(m => m.requires_prescription);
    } else if (categoryFilter === 'OTC') {
      result = result.filter(m => !m.requires_prescription && m.category === 'Medicines');
    } else if (categoryFilter === 'Wellness') {
      const wellnessCats = ['Baby Care', 'Personal Care', 'Vitamins & Supplements', 'First Aid'];
      result = result.filter(m => wellnessCats.includes(m.category));
    }

    // Search Filtering
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        (m.manufacturer || '').toLowerCase().includes(query) ||
        (m.category || '').toLowerCase().includes(query)
      );
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock-low') {
      result.sort((a, b) => a.stock - b.stock);
    }

    return result;
  }, [medicines, search, categoryFilter, sortBy]);

  const categorySuggestions = useMemo(() => {
    const values = medicines
      .map((medicine) => (medicine.category || '').trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [medicines]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const response = await adminService.getMedicines();
      setMedicines(response.data?.medicines || []);
    } catch (error) {
      toast.error('Unable to load medicines.');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await adminService.getSuppliers();
      setSuppliers(response.data?.suppliers || []);
    } catch (error) {
      toast.error('Unable to load suppliers.');
    }
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([loadMedicines(), loadSuppliers()]);
    };
    load();
  }, []);

  const handleOpenModal = () => {
    setEditingMedicine(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMedicine(null);
  };

  const handleSave = async (formData, medicineId) => {
    try {
      if (medicineId) {
        await adminService.updateMedicine(medicineId, formData);
        toast.success('Medicine updated successfully.');
      } else {
        await adminService.createMedicine(formData);
        toast.success('Medicine created successfully.');
      }
      await loadMedicines();
    } catch (error) {
      throw error;
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await adminService.deleteMedicine(id);
      toast.success('Medicine deleted successfully.');
      await loadMedicines();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to delete medicine.');
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-loading">Loading medicines...</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Products</h1>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button variant="primary" onClick={handleOpenModal}>
            Add Product
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/suppliers')}>
            Manage Suppliers
          </Button>
        </div>
      </div>

      <div className="category-filters">
        <div
          className={`category-card ${categoryFilter === 'All' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('All')}
        >
          <div className="category-icon">📦</div>
          <div className="category-info">
            <h3>All Products</h3>
            <p>Browse the full catalogue</p>
          </div>
        </div>
        <div
          className={`category-card ${categoryFilter === 'Prescription' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('Prescription')}
        >
          <div className="category-icon">💊</div>
          <div className="category-info">
            <h3>Prescription Drugs</h3>
            <p>Requires doctor approval</p>
          </div>
        </div>
        <div
          className={`category-card ${categoryFilter === 'OTC' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('OTC')}
        >
          <div className="category-icon">🛒</div>
          <div className="category-info">
            <h3>OTC Essentials</h3>
            <p>No prescription needed</p>
          </div>
        </div>
        <div
          className={`category-card ${categoryFilter === 'Wellness' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('Wellness')}
        >
          <div className="category-icon">🍃</div>
          <div className="category-info">
            <h3>Wellness & Care</h3>
            <p>Vitamins, supplements & personal care</p>
          </div>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by medicine, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button className="search-btn">🔍</button>
        </div>
        <select
          className="filter-select"
          onChange={(e) => setCategoryFilter(e.target.value)}
          value={categoryFilter}
        >
          <option value="All">All Categories</option>
          <option value="Medicines">Medicines</option>
          <option value="Medical Devices">Medical Devices</option>
          <option value="Baby Care">Baby Care</option>
          <option value="Personal Care">Personal Care</option>
          <option value="Vitamins & Supplements">Vitamins & Supplements</option>
          <option value="First Aid">First Aid</option>
        </select>
        <select
          className="filter-select"
          onChange={(e) => setSortBy(e.target.value)}
          value={sortBy}
        >
          <option value="relevance">Relevance</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="stock-low">Stock: Low to High</option>
        </select>
      </div>

      <div className="product-grid">
        {filteredMedicines.length > 0 ? (
          filteredMedicines.map((medicine) => (
            <div className="product-management-card" key={medicine.id}>
              <div className="card-image-wrapper">
                {medicine.image ? (
                  <img src={medicine.image} alt={medicine.name} />
                ) : (
                  <div className="image-placeholder">No Image Available</div>
                )}
                {medicine.requires_prescription && (
                  <div className="rx-badge">℞ Prescription Required</div>
                )}
              </div>
              <div className="card-content">
                <h2>{medicine.name}</h2>
                <div className="manufacturer-name">{medicine.manufacturer || 'General Medicine'}</div>
                <p className="product-snippet">
                  {medicine.description || 'No description available for this product.'}
                </p>

                <div className="card-footer">
                  <div className="price-stock-row">
                    <div className="price-display">
                      <span className="price-currency">PKR</span>
                      {Number(medicine.price).toFixed(2)}
                    </div>
                    <div className="stock-pill">Stock: {medicine.stock}</div>
                  </div>

                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => navigate(`/medicines/${medicine.id}`)}
                    >
                      View
                    </button>
                    <button
                      className="action-btn edit"
                      onClick={() => handleEdit(medicine)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(medicine.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <h3>No products found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingMedicine={editingMedicine}
        suppliers={suppliers}
        categorySuggestions={categorySuggestions}
      />
    </div>
  );
};

export default AdminMedicinesPage;


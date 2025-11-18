import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
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
  const [suppliers, setSuppliers] = useState([]);
  const [stockUpdatingId, setStockUpdatingId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const filteredMedicines = useMemo(() => {
    if (!search.trim()) return medicines;
    return medicines.filter((medicine) =>
      medicine.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [medicines, search]);

  const categorySuggestions = useMemo(() => {
    const values = medicines
      .map((medicine) => (medicine.category || '').trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [medicines]);

  const lowStockProducts = useMemo(() => {
    return medicines.filter((medicine) => medicine.stock <= 5);
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

  useEffect(() => {
    const load = async () => {
      await Promise.all([loadMedicines(), loadSuppliers()]);
    };

    load();
  }, []);

  useEffect(() => {
    if (!medicines.length) return;

    const state = location.state || {};
    if (state.editId) {
      const medicine = medicines.find((item) => item.id === state.editId);
      if (medicine) {
        handleEdit(medicine);
      }
      navigate('/admin/medicines', { replace: true, state: {} });
    } else if (state.deleteId) {
      handleDelete(state.deleteId);
      navigate('/admin/medicines', { replace: true, state: {} });
    }
  }, [location.state, medicines, navigate]);
  const loadSuppliers = async () => {
    try {
      const response = await adminService.getSuppliers();
      setSuppliers(response.data?.suppliers || []);
    } catch (error) {
      toast.error('Unable to load suppliers.');
    }
  };

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
      throw error; // Re-throw to let modal handle the error display
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

  const handleStockAdjust = async (id, direction) => {
    if (stockUpdatingId === id) return;
    const isDecrease = direction === 'decrease';
    if (isDecrease) {
      const current = medicines.find((item) => item.id === id);
      if (!current || current.stock <= 0) {
        toast.info('Stock is already at zero.');
        return;
      }
    }

    try {
      setStockUpdatingId(id);
      const response = await adminService.adjustMedicineStock(id, {
        direction,
        amount: 1
      });
      const updated = response.data?.medicine;
      if (updated) {
        setMedicines((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        if (editingId === updated.id) {
          setForm((prev) => ({
            ...prev,
            stock: updated.stock
          }));
        }
      }
      toast.success(
        `Stock ${direction === 'increase' ? 'increased' : 'decreased'} successfully.`
      );
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to update stock.');
    } finally {
      setStockUpdatingId(null);
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
        <div>
          <h1>Product Management</h1>
          <p>Maintain inventory, update pricing, and track expiry dates.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button variant="primary" onClick={handleOpenModal}>
            Add Product
          </Button>
          <Link className="link-button" to="/admin/suppliers">
            Manage Suppliers
          </Link>
        </div>
      </div>

      {/* Low Stock Products Section */}
      {lowStockProducts.length > 0 && (
        <Card className="admin-form-card">
          <h2>Low Stock Products</h2>
          <div className="low-stock-grid">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div className="low-stock-card" key={product.id}>
                <div className="low-stock-card-header">
                  <h4>{product.name}</h4>
                </div>
                <div className="low-stock-card-body">
                  <p className="low-stock-category">Category: {product.category || '—'}</p>
                  <div className="low-stock-meta">
                    <span className="low-stock-label">Stock:</span>
                    <span className="low-stock-value">{product.stock}</span>
                    <span className="low-stock-expiry">
                      Expiry: {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="admin-table-card">
        <div className="card-header">
          <div>
            <h2>Catalogue Overview</h2>
            <p>{filteredMedicines.length} products</p>
          </div>
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Category</th>
              <th>Expiry</th>
              <th>Supplier</th>
              <th>Requires Rx</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.map((medicine) => (
              <tr key={medicine.id}>
                <td>
                  <div className="table-title">{medicine.name}</div>
                  <div className="table-subtitle">{medicine.description || '—'}</div>
                </td>
                <td>
                  <div className="stock-cell">
                    <span className="stock-value">{medicine.stock}</span>
                    <div className="stock-actions">
                      <button
                        type="button"
                        className="stock-button"
                        onClick={() => handleStockAdjust(medicine.id, 'decrease')}
                        disabled={stockUpdatingId === medicine.id || medicine.stock === 0}
                        title="Decrease stock"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="stock-button"
                        onClick={() => handleStockAdjust(medicine.id, 'increase')}
                        disabled={stockUpdatingId === medicine.id}
                        title="Increase stock"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </td>
                <td>PKR {Number(medicine.price).toFixed(2)}</td>
                <td>{medicine.category || '—'}</td>
                <td>{medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : '—'}</td>
                <td>{medicine.supplier?.name || '—'}</td>
                <td>{medicine.requires_prescription ? 'Yes' : 'No'}</td>
                <td className="table-actions">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => handleEdit(medicine)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(medicine.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

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


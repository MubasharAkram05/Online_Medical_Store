import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { adminService } from '../../services/adminService';
import './AdminMedicinesPage.css';

const initialForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  requires_prescription: false,
  category: '',
  image: '',
  dosageInstructions: '',
  sideEffects: '',
  interactionNotes: '',
  expiry_date: '',
  supplier_id: ''
};

const AdminMedicinesPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
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

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      supplier_id: form.supplier_id || null,
      interactionNotes: form.interactionNotes
        ? form.interactionNotes.split('\n').map((line) => line.trim()).filter(Boolean)
        : []
    };

    try {
      if (editingId) {
        await adminService.updateMedicine(editingId, payload);
        toast.success('Medicine updated successfully.');
      } else {
        await adminService.createMedicine(payload);
        toast.success('Medicine created successfully.');
      }
      resetForm();
      await loadMedicines();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to save medicine.');
    }
  };

  const handleEdit = (medicine) => {
    setEditingId(medicine.id);
    setForm({
      name: medicine.name || '',
      description: medicine.description || '',
      price: medicine.price ?? '',
      stock: medicine.stock ?? '',
      requires_prescription: Boolean(medicine.requires_prescription),
      category: medicine.category || '',
      image: medicine.image || '',
      dosageInstructions: medicine.dosageInstructions || '',
      sideEffects: medicine.sideEffects || '',
      interactionNotes: (medicine.interactionNotes || []).join('\n'),
      expiry_date: medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : '',
      supplier_id: medicine.supplier?.id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <Link className="link-button" to="/admin/suppliers">
          Manage Suppliers
        </Link>
      </div>

      <Card className="admin-form-card">
        <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-grid">
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Category</span>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  list="medicine-category-suggestions"
                  placeholder="Select or enter category"
                />
                <datalist id="medicine-category-suggestions">
                  {categorySuggestions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>
              <label>
                <span>Price (PKR)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                  required
                />
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.requires_prescription}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      requires_prescription: e.target.checked
                    }))
                  }
                />
                <span>Requires Prescription</span>
              </label>
              <label>
                <span>Image URL</span>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                />
              </label>
              <label className="textarea-field">
                <span>Description</span>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </label>
              <label className="textarea-field">
                <span>Dosage Instructions</span>
                <textarea
                  rows="3"
                  value={form.dosageInstructions}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dosageInstructions: e.target.value }))
                  }
                />
              </label>
              <label className="textarea-field">
                <span>Side Effects</span>
                <textarea
                  rows="3"
                  value={form.sideEffects}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sideEffects: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Expiry Date</span>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                />
              </label>
              <label>
                <span>Supplier</span>
                <select
                  value={form.supplier_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="textarea-field full-width">
                <span>Interaction Notes (one per line)</span>
                <textarea
                  rows="3"
                  value={form.interactionNotes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, interactionNotes: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <Button type="submit" variant="primary">
                {editingId ? 'Update Product' : 'Add Product'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
        </form>
      </Card>

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
    </div>
  );
};

export default AdminMedicinesPage;


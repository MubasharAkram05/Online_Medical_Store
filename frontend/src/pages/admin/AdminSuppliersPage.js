import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { adminService } from '../../services/adminService';
import { useDialog } from '../../context/DialogContext';
import './AdminSuppliersPage.css';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  manufacturer: '',
  notes: ''
};

const AdminSuppliersPage = () => {
  const { confirm } = useDialog();
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSuppliers();
      setSuppliers(response.data?.suppliers || []);
    } catch (error) {
      toast.error('Unable to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await adminService.updateSupplier(editingId, form);
        toast.success('Supplier updated successfully.');
      } else {
        await adminService.createSupplier(form);
        toast.success('Supplier created successfully.');
      }
      resetForm();
      await loadSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to save supplier.');
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      manufacturer: supplier.manufacturer || '',
      notes: supplier.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Confirmation',
      message: 'Delete this supplier?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await adminService.deleteSupplier(id);
      toast.success('Supplier removed.');
      await loadSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to delete supplier.');
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-loading">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h1>Suppliers</h1>
          <p>Manage supplier contacts, notes, and procurement information.</p>
        </div>
      </div>

      <Card className="admin-form-card">
          <h2>{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
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
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </label>
              <label>
                <span>Manufacturer</span>
                <input
                  type="text"
                  value={form.manufacturer}
                  onChange={(e) => setForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
                />
              </label>
              <label className="textarea-field">
                <span>Address</span>
                <textarea
                  rows="3"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </label>
              <label className="textarea-field">
                <span>Notes</span>
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
            </div>
            <div className="form-actions">
              <Button type="submit" variant="primary">
                {editingId ? 'Update Supplier' : 'Add Supplier'}
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
            <h2>Supplier Directory</h2>
            <p>{suppliers.length} partners</p>
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>              <th>Manufacturer</th>              <th>Address</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.email || '—'}</td>
                <td>{supplier.phone || '—'}</td>
                <td>{supplier.manufacturer || '—'}</td>
                <td>{supplier.address || '—'}</td>
                <td className="table-actions">
                  <Button variant="outline" size="small" onClick={() => handleEdit(supplier)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="small" onClick={() => handleDelete(supplier.id)}>
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

export default AdminSuppliersPage;


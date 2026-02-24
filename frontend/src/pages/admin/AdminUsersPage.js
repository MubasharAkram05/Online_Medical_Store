import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { adminService } from '../../services/adminService';
import { useDialog } from '../../context/DialogContext';
import './AdminUsersPage.css';

const ROLES = ['patient', 'doctor', 'pharmacist', 'admin'];

const AdminUsersPage = () => {
  const { confirm } = useDialog();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setUsers(response.data?.users || []);
    } catch (error) {
      toast.error('Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateRole = async (userId, role, isVerified) => {
    try {
      setUpdatingId(userId);
      await adminService.updateUserRole(userId, { role, isVerified });
      toast.success('User updated.');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to update user.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    const isConfirmed = await confirm({
      title: 'Confirmation',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!isConfirmed) {
      return;
    }

    try {
      setUpdatingId(userId);
      await adminService.deleteUser(userId);
      toast.success('User deleted successfully.');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to delete user. They might have existing orders or records.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((user) => (roleFilter ? user.role === roleFilter : true));

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="admin-loading">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>User Management</h1>
            <p>Adjust roles and verification status.</p>
          </div>
          <div className="filters">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <Button variant="outline" size="small" onClick={loadUsers}>
              Refresh
            </Button>
          </div>
        </div>

        <Card className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value, user.isVerified)}
                      disabled={updatingId === user.id}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={user.isVerified}
                        onChange={(e) =>
                          handleUpdateRole(user.id, user.role, e.target.checked)
                        }
                        disabled={updatingId === user.id}
                      />
                      <span>{user.isVerified ? 'Yes' : 'No'}</span>
                    </label>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="table-actions">
                    <div className="action-buttons">
                      <Link className="link-button" to={`/orders?userId=${user.id}`}>
                        Orders
                      </Link>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={updatingId === user.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="empty-state">No users match the selected filter.</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminUsersPage;


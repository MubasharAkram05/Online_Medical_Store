import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import Button from '../common/Button';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './AddProductModal.css';

const initialForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  requires_prescription: false,
  category: '',
  manufacturer: '',
  image: '',
  imageFile: null,
  dosageInstructions: '',
  sideEffects: '',
  interactionNotes: '',
  expiry_date: '',
  manufacturing_date: '',
  supplier_id: ''
};

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['clean']
  ],
};

const QUILL_FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'align'
];

const AddProductModal = ({ isOpen, onClose, onSave, editingMedicine, suppliers, categorySuggestions }) => {
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingMedicine) {
        setForm({
          name: editingMedicine.name || '',
          description: editingMedicine.description || '',
          price: editingMedicine.price ?? '',
          stock: editingMedicine.stock ?? '',
          requires_prescription: Boolean(editingMedicine.requires_prescription),
          category: editingMedicine.category || '',
          manufacturer: editingMedicine.manufacturer || '',
          image: editingMedicine.image || '',
          imageFile: null,
          dosageInstructions: editingMedicine.dosageInstructions || '',
          sideEffects: editingMedicine.sideEffects || '',
          interactionNotes: (editingMedicine.interactionNotes || []).join('\n'),
          expiry_date: editingMedicine.expiryDate ? editingMedicine.expiryDate.slice(0, 10) : '',
          manufacturing_date: editingMedicine.manufacturingDate ? editingMedicine.manufacturingDate.slice(0, 10) : '',
          supplier_id: editingMedicine.supplier?.id || ''
        });
        setImagePreview(editingMedicine.image || null);
      } else {
        setForm(initialForm);
        setImagePreview(null);
      }
    }
  }, [isOpen, editingMedicine]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPG, PNG, or WEBP)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setForm((prev) => ({ ...prev, imageFile: file, image: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, imageFile: null, image: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData();

      // Add all form fields
      formData.append('name', form.name);
      formData.append('description', form.description || '');
      formData.append('price', form.price);
      formData.append('stock', form.stock);
      formData.append('requires_prescription', form.requires_prescription);
      formData.append('category', form.category || '');
      formData.append('manufacturer', form.manufacturer || '');
      formData.append('dosageInstructions', form.dosageInstructions || '');
      formData.append('sideEffects', form.sideEffects || '');
      formData.append('expiry_date', form.expiry_date || '');
      formData.append('manufacturing_date', form.manufacturing_date || '');
      formData.append('supplier_id', form.supplier_id || '');

      // Add image: file takes priority over URL
      if (form.imageFile) {
        formData.append('image', form.imageFile);
      } else if (form.image) {
        formData.append('image', form.image);
      }

      // Handle interactionNotes - convert to array format for backend
      if (form.interactionNotes) {
        const notesArray = form.interactionNotes
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        // For FormData, we need to send as JSON string or individual items
        // Backend expects it in body, so we'll send as JSON string
        formData.append('interactionNotes', JSON.stringify(notesArray));
      } else {
        formData.append('interactionNotes', JSON.stringify([]));
      }

      await onSave(formData, editingMedicine?.id);
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Unable to save product.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setForm(initialForm);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="add-product-modal-overlay" onClick={handleClose}>
      <div className="add-product-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="add-product-modal-header">
          <h2>{editingMedicine ? 'Edit Product' : 'Add Product'}</h2>
          <button className="modal-close-btn" onClick={handleClose}>×</button>
        </div>

        <form className="add-product-modal-form" onSubmit={handleSubmit}>
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
              <span>Manufacturer</span>
              <input
                type="text"
                value={form.manufacturer}
                onChange={(e) => setForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
                placeholder="Enter manufacturer/brand"
              />
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

            {/* Image Upload Section */}
            <label className="image-upload-field full-width">
              <span>Product Image</span>
              <div className="image-upload-container">
                {imagePreview ? (
                  <div className="image-preview-wrapper">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="image-upload-placeholder">
                    <div className="upload-icon">📷</div>
                    <p>Upload an image or enter URL</p>
                  </div>
                )}
                <div className="image-input-group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, image: e.target.value, imageFile: null }));
                      setImagePreview(e.target.value || null);
                    }}
                    placeholder="Or enter image URL"
                    className="url-input"
                  />
                </div>
              </div>
            </label>

            <div className="textarea-field rich-editor-field full-width">
              <span>Description</span>
              <ReactQuill
                theme="snow"
                value={form.description}
                onChange={(content) =>
                  setForm((prev) => ({ ...prev, description: content }))
                }
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Enter detailed product description..."
              />
            </div>
            <div className="textarea-field rich-editor-field">
              <span>Dosage Instructions</span>
              <ReactQuill
                theme="snow"
                value={form.dosageInstructions}
                onChange={(content) =>
                  setForm((prev) => ({ ...prev, dosageInstructions: content }))
                }
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Enter detailed dosage instructions..."
              />
            </div>
            <div className="textarea-field rich-editor-field">
              <span>Side Effects</span>
              <ReactQuill
                theme="snow"
                value={form.sideEffects}
                onChange={(content) =>
                  setForm((prev) => ({ ...prev, sideEffects: content }))
                }
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Enter potential side effects..."
              />
            </div>
            <label>
              <span>Expiry Date</span>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
            </label>
            <label>
              <span>Manufacturing Date</span>
              <input
                type="date"
                value={form.manufacturing_date}
                onChange={(e) => setForm((prev) => ({ ...prev, manufacturing_date: e.target.value }))}
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
            <Button type="submit" variant="primary" disabled={uploading}>
              {uploading ? 'Saving...' : editingMedicine ? 'Update Product' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;


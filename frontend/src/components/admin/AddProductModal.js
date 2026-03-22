import React, { useState, useRef, useEffect } from 'react';
// toast for showing success/error notifications
import { toast } from 'react-toastify';
// reusable button component
import Button from '../common/Button';
// rich text editor component
import ReactQuill from 'react-quill';
// rich text editor styles
import 'react-quill/dist/quill.snow.css';
import './AddProductModal.css';

/**
 * Initial empty form state
 * Used when adding a new product or resetting the form
 * All fields start empty/false/null
 */
const initialForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  requires_prescription: false, // whether prescription is needed — boolean
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
/**
 * Quill editor toolbar configuration
 * Defines which buttons appear in the rich text editor toolbar
 */
const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }], // heading sizes H1, H2, H3, Normal
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }], // numbered and bullet lists
    [{ 'align': [] }],
    ['clean'] // remove formatting button
  ],
};
/**
 * Quill editor allowed formats
 * Only these formats will be accepted in the editor
 * Any other format will be stripped out
 */
const QUILL_FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'align'
];
/**
 * AddProductModal Component
 * Modal form for adding a new product or editing an existing one
 * Handles image upload (file or URL), rich text editors, and form submission
 *
 *  param {boolean} isOpen - Whether the modal is open or closed
 *  {function} onClose - Function to close the modal
 * {function} onSave - Function to save the product (API call happens here)
 *  {object} editingMedicine - Medicine object if editing, null if adding new
 *  {array} suppliers - List of suppliers for the dropdown
 *  {array} categorySuggestions - List of category suggestions for autocomplete
 */
const AddProductModal = ({ isOpen, onClose, onSave, editingMedicine, suppliers, categorySuggestions }) => {
    // form state — stores all input field values
   // initialized with empty initialForm
  const [form, setForm] = useState(initialForm);
  // imagePreview state — stores the image URL or base64 string for preview
  // null means no image selected — placeholder will be shown
  const [imagePreview, setImagePreview] = useState(null);
   // uploading state — true when form is being submitted
  // used to disable submit button and show "Saving..." text
  const [uploading, setUploading] = useState(false);
  // ref to directly access the file input element
  // used to clear the file input when image is removed
  const fileInputRef = useRef(null);
 /**
   * useEffect — runs when modal opens or editingMedicine changes
   * If editing — fills form with existing medicine data
   * If adding new — resets form to empty initialForm
   */
  useEffect(() => {
    if (isOpen) {
      if (editingMedicine) {
        // Edit mode — fill form with existing medicine data
        setForm({
          name: editingMedicine.name || '',
          description: editingMedicine.description || '',
          // using ?? instead of || because price/stock can be 0
          price: editingMedicine.price ?? '',
          stock: editingMedicine.stock ?? '',
          // convert to boolean — database may return 0/1 or "true"/"false"
          requires_prescription: Boolean(editingMedicine.requires_prescription),
          category: editingMedicine.category || '',
          manufacturer: editingMedicine.manufacturer || '',
          // always null — existing image comes as URL not file object
          image: editingMedicine.image || '',
          imageFile: null,
          dosageInstructions: editingMedicine.dosageInstructions || '',
          sideEffects: editingMedicine.sideEffects || '',
          // convert array to string — one note per line in textarea
          interactionNotes: (editingMedicine.interactionNotes || []).join('\n'),
          // slice(0, 10) to get only YYYY-MM-DD from full ISO timestamp
          expiry_date: editingMedicine.expiryDate ? editingMedicine.expiryDate.slice(0, 10) : '',
          manufacturing_date: editingMedicine.manufacturingDate ? editingMedicine.manufacturingDate.slice(0, 10) : '',
           // optional chaining — supplier may be null
          supplier_id: editingMedicine.supplier?.id || ''
        });
        // set image preview to existing image URL if it exists, otherwise null
        setImagePreview(editingMedicine.image || null);
      } else {
        // Add mode — reset form to empty state
        setForm(initialForm);
        setImagePreview(null);
      }
    }
  }, [isOpen, editingMedicine]);

    /**
   * handleFileChange — handles image file selection
   * Validates file type and size before accepting
   * Creates a base64 (used to encode binary data as printable text) preview of the selected image
   * param {Event} event - File input change event
   */
  const handleFileChange = (event) => {
    // get the first selected file from file input (multiple files not allowed)
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
       // store file in form state
      // clear image URL — file takes priority over URL
      setForm((prev) => ({ ...prev, imageFile: file, image: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      // start reading the file as base64 URL
      reader.readAsDataURL(file);
    }
  };
  /**
   * handleRemoveImage — removes the selected image
   * Clears image from form state, preview, and file input
   */
  const handleRemoveImage = () => {
    // clear image file and URL from form state
    setForm((prev) => ({ ...prev, imageFile: null, image: '' }));
     // clear image preview — placeholder will be shown
    setImagePreview(null);
     // directly clear the file input element
    // React state alone cannot clear the browser file input, so we use a ref to access it
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  /**
   * handleSubmit — handles form submission
   * Builds FormData object with all fields and submits to parent
   * Handles both add and edit modes
   * param {Event} event - Form submit event
   */
  const handleSubmit = async (event) => {
        // prevent default browser form submission and page reload
    event.preventDefault();
     // set uploading to true — disables submit button
    // shows "Saving..." text on button
    setUploading(true);

    try {
       // FormData is used instead of JSON
      // because it supports both text fields and file uploads
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

      // image priority — file takes priority over URL
      // if file is selected → send file
      // if only URL is given → send URL
      // if neither → don't append image field
      if (form.imageFile) {
        formData.append('image', form.imageFile);
      } else if (form.image) {
        formData.append('image', form.image);
      }

      // Handle interactionNotes - convert string to array format for backend
      if (form.interactionNotes) {
        const notesArray = form.interactionNotes
          .split('\n')
          .map((line) => line.trim()) //Delete the extra empty spaces from the beginning and the end of the text.
          .filter(Boolean);
        // send as JSON string — FormData only supports strings
        formData.append('interactionNotes', JSON.stringify(notesArray));
      } else {
       // no notes — send empty array
        formData.append('interactionNotes', JSON.stringify([]));
      }
      // call parent save function with formData
      // pass medicine ID if editing — null if adding new
      await onSave(formData, editingMedicine?.id);
      // close modal after successful save
      handleClose();
    } catch (error) {
      // show error notification
      // use server error message if available
      // fallback to generic message if not
      toast.error(error.response?.data?.error?.message || 'Unable to save product.');
    } finally {
      // always reset uploading state
      // whether save was successful or failed
      setUploading(false);
    }
  };
  /**
   * handleClose — closes the modal and resets all state
   * Called when: close button clicked, overlay clicked, cancel clicked, save successful
   */
  const handleClose = () => {
    setForm(initialForm);
    setImagePreview(null);
        // clear file input element directly because React state cannot reset it
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
     // call parent close function
    // parent will set isOpen to false — modal will disappear
    onClose();
  };
  // if modal is closed — render nothing
  // saves memory and improves performance
  if (!isOpen) return null;

  return (
     // overlay — dark background behind modal
    // clicking overlay closes the modal
    <div className="add-product-modal-overlay" onClick={handleClose}>
             {/* modal container — white box
          stopPropagation prevents clicks inside modal
          from bubbling up to overlay and closing modal */}
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
               {/* Price — number input, min 0, allows decimals
                step="0.01" allows prices like 49.99 */}
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
             {/* Stock — number input, min 0, whole numbers only */}
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
               {/* Prescription Checkbox — boolean field
                checked uses e.target.checked instead of e.target.value */}
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
                 {/* file input — connected to ref for manual clearing
                 accept restricts file types in browser dialog */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  {/* URL input — alternative to file upload
                      setting image URL clears any selected file */}
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
              {/* Submit button
                disabled while uploading to prevent double submission
                text changes based on mode and uploading state */}
            <Button type="submit" variant="primary" disabled={uploading}>
              {uploading ? 'Saving...' : editingMedicine ? 'Update Product' : 'Add Product'}
            </Button>
            {/* Cancel button
                type="button" prevents form submission
                onClick closes modal and resets form */}
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


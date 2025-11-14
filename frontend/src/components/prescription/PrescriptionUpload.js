import React, { useRef, useState } from 'react';
import Button from '../common/Button';
import './PrescriptionUpload.css';

const ACCEPTED_TYPES = ['.jpg', '.jpeg', '.png', '.pdf'];

const PrescriptionUpload = ({ onUpload, loading }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : '');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      fileInputRef.current.files = event.dataTransfer.files;
      setFileName(file.name);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const file = fileInputRef.current.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (notes) {
      formData.append('notes', notes);
    }

    onUpload(formData, () => {
      fileInputRef.current.value = '';
      setFileName('');
      setNotes('');
    });
  };

  return (
    <form className="prescription-upload" onSubmit={handleSubmit}>
      <div
        className="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          hidden
        />
        <div className="dropzone-icon">📄</div>
        <p>Drag & drop prescription file, or <span>browse</span></p>
        <small>Supported formats: JPG, PNG, PDF (max 5MB)</small>
        {fileName && <div className="selected-file">Selected: {fileName}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add any additional information for the pharmacist..."
          rows={3}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Upload Prescription'}
      </Button>
    </form>
  );
};

export default PrescriptionUpload;


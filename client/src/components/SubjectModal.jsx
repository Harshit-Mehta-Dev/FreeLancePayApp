import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';

const SubjectModal = ({ isOpen, onClose, onSave, subject = null }) => {
  const [formData, setFormData] = useState({ name: '', color: '#6366f1' });
  const colors = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981', 'var(--primary)', 
    '#3b82f6', '#ef4444', '#06b6d4', '#f97316', '#a855f7'
  ];

  // Reset form when modal opens or subject changes
  useEffect(() => {
    if (isOpen) {
      if (subject) {
        setFormData({ name: subject.name, color: subject.color });
      } else {
        setFormData({ name: '', color: '#6366f1' });
      }
    }
  }, [isOpen, subject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (subject) {
        await api.put(`/subjects/${subject.id}`, formData);
      } else {
        await api.post('/subjects', formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save subject', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={subject ? 'Edit Subject' : 'Add New Subject'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Subject Name</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            placeholder="e.g. Mathematics"
          />
        </div>
        <div className="form-group">
          <label>Theme Color</label>
          <div className="color-picker">
            {colors.map(color => (
              <div 
                key={color}
                className={`color-option ${formData.color === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({...formData, color})}
              />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">
            {subject ? 'Update Subject' : 'Create Subject'}
          </button>
        </div>
      </form>

      <style>{`
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-main);
          color: var(--text-main);
        }
        .color-picker {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.75rem;
        }
        .color-option {
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        .color-option.active {
          border-color: var(--text-main);
          transform: scale(1.1);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
      `}</style>
    </Modal>
  );
};

export default SubjectModal;

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';

const TaskModal = ({ isOpen, onClose, onSave, subjects, task = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    deadline: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          subject_id: task.subject_id,
          deadline: task.deadline ? task.deadline.substring(0, 16) : ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          subject_id: '',
          deadline: ''
        });
      }
    }
  }, [isOpen, task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (task && task.id) {
        await api.put(`/tasks/${task.id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save task', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task && task.id ? 'Edit Task' : 'Create New Task'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Task Title</label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            placeholder="e.g. Finish Calculus Homework"
          />
        </div>
        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Describe the details of your task..."
          />
        </div>
        <div className="form-row">
          <div className="form-group flex-1">
            <label>Subject</label>
            <select 
              value={formData.subject_id} 
              onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group flex-1">
            <label>Deadline</label>
            <input 
              type="datetime-local" 
              value={formData.deadline} 
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!formData.subject_id}>
            {task && task.id ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </form>

      <style>{`
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-row {
          display: flex;
          gap: 1rem;
        }
        .flex-1 { flex: 1; }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        input, textarea, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-main);
          color: var(--text-main);
          outline: none;
        }
        input:focus, textarea:focus, select:focus {
          border-color: var(--primary);
        }
        textarea {
          min-height: 80px;
          resize: vertical;
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

export default TaskModal;

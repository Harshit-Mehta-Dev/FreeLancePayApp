import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';

const ExamModal = ({ isOpen, onClose, onSave, subjects, exam = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    exam_date: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (exam) {
        setFormData({
          title: exam.title || '',
          subject_id: exam.subject_id || '',
          exam_date: exam.exam_date ? exam.exam_date.substring(0, 16) : ''
        });
      } else {
        setFormData({
          title: '',
          subject_id: '',
          exam_date: ''
        });
      }
    }
  }, [isOpen, exam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (exam && exam.id) {
        await api.put(`/exams/${exam.id}`, formData);
      } else {
        await api.post('/exams', formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save exam', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exam && exam.id ? 'Edit Exam' : 'Add Exam Reminder'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Exam Title</label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            placeholder="e.g. Finals - Theory of Computation"
          />
        </div>
        <div className="form-group">
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
        <div className="form-group">
          <label>Exam Date & Time</label>
          <input 
            type="datetime-local" 
            value={formData.exam_date} 
            onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
            required
          />
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!formData.subject_id}>
            {exam && exam.id ? 'Update Exam' : 'Set Reminder'}
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
          font-size: 0.875rem;
          font-weight: 500;
        }
        input, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-main);
          color: var(--text-main);
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

export default ExamModal;

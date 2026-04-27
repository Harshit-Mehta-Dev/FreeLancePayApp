import React, { useState, useEffect } from 'react';
import { Plus, BookMarked, Trash2, Edit } from 'lucide-react';
import api from '../utils/api';
import SubjectModal from '../components/SubjectModal';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this subject? This will also delete all associated tasks and exams.')) {
      try {
        await api.delete(`/subjects/${id}`);
        fetchSubjects();
      } catch (err) {
        console.error('Failed to delete subject', err);
      }
    }
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  return (
    <div className="subjects-view animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Your Subjects</h1>
          <p className="subtitle">Organize your studies by academic area</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Subject</span>
        </button>
      </header>

      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div key={subject.id} className="subject-card card glass">
            <div className="subject-color" style={{ backgroundColor: subject.color }}></div>
            <div className="subject-info">
              <div className="subject-icon" style={{ backgroundColor: subject.color + '20' }}>
                <BookMarked size={20} style={{ color: subject.color }} />
              </div>
              <h3>{subject.name}</h3>
            </div>
            <div className="subject-actions">
              <button className="btn-icon-sm" onClick={() => handleEdit(subject)}>
                <Edit size={16} />
              </button>
              <button className="btn-icon-sm hover-danger" onClick={() => handleDelete(subject.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="empty-state-full card glass">
            <div className="empty-icon glass">
              <BookMarked size={48} className="text-muted" />
            </div>
            <h3>No subjects yet</h3>
            <p>Add your first subject to start organizing your study materials.</p>
            <button onClick={openAddModal} className="btn btn-secondary">Create First Subject</button>
          </div>
        )}
      </div>

      <SubjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchSubjects}
        subject={editingSubject}
      />

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }
        .subtitle {
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .subject-card {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          transition: transform 0.2s;
        }
        .subject-card:hover {
          transform: translateY(-4px);
        }
        .subject-color {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 5px;
        }
        .subject-info {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .subject-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .subject-info h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }
        .subject-actions {
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .subject-card:hover .subject-actions {
          opacity: 1;
        }
        .hover-danger:hover {
          color: #ef4444;
          background: #fee2e2;
        }
        .empty-state-full {
          grid-column: 1 / -1;
          text-align: center;
          padding: 5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .empty-icon {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default Subjects;

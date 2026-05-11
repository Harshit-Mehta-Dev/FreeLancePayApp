import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Calendar, Trash2, Edit } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../utils/api';
import ExamModal from '../components/ExamModal';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const fetchData = async () => {
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        api.get('/exams'),
        api.get('/subjects')
      ]);
      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      console.error('Failed to fetch exams', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this exam reminder?')) {
      try {
        await api.delete(`/exams/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete exam', err);
      }
    }
  };

  const openAddModal = () => {
    setEditingExam(null);
    setIsModalOpen(true);
  };

  const upcomingExams = exams.filter(e => dayjs(e.exam_date).isAfter(dayjs()));
  const pastExams = exams.filter(e => dayjs(e.exam_date).isBefore(dayjs())).sort((a, b) => dayjs(b.exam_date).diff(dayjs(a.exam_date)));

  return (
    <div className="exams-view animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Exam Reminders</h1>
          <p className="subtitle">Track your upcoming tests and deadlines</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Exam</span>
        </button>
      </header>

      <section className="exam-section">
        <h2>Upcoming Exams</h2>
        <div className="exams-grid">
          {upcomingExams.map((exam) => (
            <div key={exam.id} className="exam-card card glass highlight">
              <div className="exam-date-tag">
                <span className="month">{dayjs(exam.exam_date).format('MMM')}</span>
                <span className="day">{dayjs(exam.exam_date).format('DD')}</span>
              </div>
              <div className="exam-info">
                <div className="exam-top">
                  <span className="subject-tag">{exam.subject_name}</span>
                  <div className="exam-actions">
                    <button className="btn-icon-sm" onClick={() => handleEdit(exam)}><Edit size={14} /></button>
                    <button className="btn-icon-sm hover-danger" onClick={() => handleDelete(exam.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3>{exam.title}</h3>
                <div className="exam-time">
                  <Calendar size={14} />
                  <span>{dayjs(exam.exam_date).format('h:mm A')}</span>
                  <span className="countdown">({dayjs(exam.exam_date).fromNow()})</span>
                </div>
              </div>
            </div>
          ))}

          {upcomingExams.length === 0 && (
            <div className="empty-state-card card glass">
              <AlertCircle size={40} className="text-muted" />
              <p>No upcoming exams. Stay prepared!</p>
            </div>
          )}
        </div>
      </section>

      {pastExams.length > 0 && (
        <section className="exam-section past">
          <h2>Past Exams</h2>
          <div className="exams-list-simple">
            {pastExams.map((exam) => (
              <div key={exam.id} className="exam-item-simple card glass">
                <div className="simple-info">
                  <span className="date">{dayjs(exam.exam_date).format('MMM D, YYYY')}</span>
                  <h4>{exam.title}</h4>
                  <span className="subject">{exam.subject_name}</span>
                </div>
                <button className="btn-icon-sm hover-danger" onClick={() => handleDelete(exam.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      <ExamModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchData}
        subjects={subjects}
        exam={editingExam}
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
        }
        .exam-section {
          margin-bottom: 3rem;
        }
        .exam-section h2 {
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          color: var(--text-main);
          font-weight: 700;
        }
        .exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .exam-card {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem;
          position: relative;
        }
        .exam-card.highlight {
          border-left: 4px solid var(--secondary);
        }
        .exam-date-tag {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 60px;
          height: 60px;
          background: var(--bg-main);
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .exam-date-tag .month {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--secondary);
        }
        .exam-date-tag .day {
          font-size: 1.25rem;
          font-weight: 800;
        }
        .exam-info {
          flex: 1;
        }
        .exam-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .subject-tag {
          font-size: 0.75rem;
          padding: 0.2rem 0.6rem;
          background: var(--bg-main);
          border-radius: 4px;
          color: var(--text-muted);
        }
        .exam-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .exam-card:hover .exam-actions {
          opacity: 1;
        }
        .exam-info h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }
        .exam-time {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .countdown {
          font-weight: 600;
          color: var(--secondary);
        }
        .exams-list-simple {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .exam-item-simple {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
        }
        .simple-info {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .simple-info h4 {
          font-size: 0.9375rem;
          min-width: 200px;
        }
        .simple-info .date, .simple-info .subject {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .hover-danger:hover {
          color: #ef4444;
          background: #fee2e2;
        }
        .empty-state-card {
          grid-column: 1 / -1;
          padding: 3rem;
          text-align: center;
          background: transparent;
          border: 2px dashed var(--border);
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default Exams;

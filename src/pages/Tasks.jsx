import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Clock, Trash2, Edit } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed

  const fetchData = async () => {
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/subjects')
      ]);
      setTasks(tasksRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleComplete = async (taskId, currentStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { completed: !currentStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle task completion', err);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete task', err);
      }
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <div className="tasks-view animate-fade-in">
      <header className="page-header">
        <div>
          <h1>Study Tasks</h1>
          <p className="subtitle">Manage and track your academic assignments</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </header>

      <div className="filter-bar glass">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button>
        <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <div className="tasks-container">
        <div className="tasks-list">
          {filteredTasks.map((task) => (
            <div key={task.id} className={`task-item card glass ${task.completed ? 'completed' : ''}`}>
              <button 
                className="complete-toggle" 
                onClick={() => toggleComplete(task.id, task.completed)}
              >
                {task.completed ? <CheckSquare size={24} className="text-secondary" /> : <Square size={24} />}
              </button>
              
              <div className="task-info">
                <div className="task-header-row">
                  <h3>{task.title}</h3>
                  <div className="task-actions">
                    <button className="btn-icon-sm" onClick={() => handleEdit(task)}>
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon-sm hover-danger" onClick={() => handleDelete(task.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="task-desc">{task.description}</p>
                <div className="task-meta">
                  <span className="badge" style={{ backgroundColor: task.subject_color + '20', color: task.subject_color }}>
                    {task.subject_name}
                  </span>
                  {task.deadline && (
                    <span className="deadline">
                      <Clock size={14} />
                      {dayjs(task.deadline).format('MMM D, h:mm A')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="empty-state card glass">
              <CheckSquare size={48} className="text-muted" />
              <h3>No tasks found</h3>
              <p>Try changing your filter or add a new task to get started.</p>
            </div>
          )}
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchData}
        subjects={subjects}
        task={editingTask}
      />

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .subtitle {
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .filter-bar {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: var(--radius);
          margin-bottom: 2rem;
          width: fit-content;
        }
        .filter-bar button {
          background: transparent;
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-bar button.active {
          background: var(--bg-card);
          color: var(--text-main);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .task-item {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 1.5rem;
          transition: all 0.2s;
        }
        .task-item:hover {
          transform: translateX(4px);
        }
        .task-item.completed {
          opacity: 0.6;
        }
        .task-item.completed h3 {
          text-decoration: line-through;
        }
        .complete-toggle {
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          color: var(--text-muted);
          margin-top: 0.25rem;
          flex-shrink: 0;
        }
        .task-info {
          flex: 1;
        }
        .task-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .task-info h3 {
          font-size: 1.125rem;
          color: var(--text-main);
        }
        .task-actions {
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .task-item:hover .task-actions {
          opacity: 1;
        }
        .task-desc {
          font-size: 0.9375rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .task-meta {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          font-size: 0.8125rem;
        }
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 600;
        }
        .deadline {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--text-muted);
        }
        .hover-danger:hover {
          color: #ef4444;
          background: #fee2e2;
        }
        .empty-state {
          text-align: center;
          padding: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Tasks;

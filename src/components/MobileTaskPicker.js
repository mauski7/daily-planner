// src/components/MobileTaskPicker.js
import React, { useState, useMemo } from 'react';
import { X, Search, ChevronRight, Clock, Plus } from 'lucide-react';

export default function MobileTaskPicker({
  isOpen,
  onClose,
  timeSlot,
  lifeAreas,
  projects,
  onSelectTask,
  onAddCustomTask
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTaskName, setCustomTaskName] = useState('');

  // Get all available tasks
  const allTasks = useMemo(() => {
    const tasks = [];
    lifeAreas.forEach(area => {
      const areaProjects = projects[area.id] || [];
      areaProjects.forEach(project => {
        (project.tasks || []).forEach(task => {
          if (!task.completed) {
            tasks.push({
              ...task,
              areaId: area.id,
              areaName: area.name,
              areaColor: area.color,
              projectId: project.id,
              projectName: project.name
            });
          }
        });
      });
    });
    return tasks;
  }, [lifeAreas, projects]);

  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return allTasks;
    const query = searchQuery.toLowerCase();
    return allTasks.filter(task =>
      task.name.toLowerCase().includes(query) ||
      task.projectName.toLowerCase().includes(query) ||
      task.areaName.toLowerCase().includes(query)
    );
  }, [allTasks, searchQuery]);

  // Group filtered tasks by life area
  const tasksByArea = useMemo(() => {
    const grouped = {};
    filteredTasks.forEach(task => {
      if (!grouped[task.areaId]) {
        grouped[task.areaId] = {
          area: { id: task.areaId, name: task.areaName, color: task.areaColor },
          tasks: []
        };
      }
      grouped[task.areaId].tasks.push(task);
    });
    return Object.values(grouped);
  }, [filteredTasks]);

  const handleSelectTask = (task) => {
    onSelectTask(timeSlot, task);
    onClose();
    setSearchQuery('');
  };

  const handleAddCustom = () => {
    if (customTaskName.trim()) {
      onAddCustomTask(timeSlot, customTaskName.trim());
      onClose();
      setCustomTaskName('');
      setShowCustomInput(false);
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="mobile-task-picker">
        <div className="mobile-picker-header">
          <div className="mobile-picker-title">
            <Clock size={18} />
            <span>Add task at {formatTime(timeSlot)}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="mobile-picker-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mobile-picker-content">
          {/* Quick add custom task */}
          <div className="mobile-picker-section">
            {showCustomInput ? (
              <div className="custom-task-input">
                <input
                  type="text"
                  placeholder="Enter task name..."
                  value={customTaskName}
                  onChange={(e) => setCustomTaskName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
                  autoFocus
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAddCustom}
                  disabled={!customTaskName.trim()}
                >
                  Add
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTaskName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="add-custom-task-btn"
                onClick={() => setShowCustomInput(true)}
              >
                <Plus size={18} />
                <span>Add custom task</span>
              </button>
            )}
          </div>

          {/* Tasks list */}
          {tasksByArea.length === 0 ? (
            <div className="mobile-picker-empty">
              {searchQuery ? (
                <p>No tasks match "{searchQuery}"</p>
              ) : (
                <>
                  <p>No tasks available</p>
                  <p className="hint">Create tasks in the Projects tab first</p>
                </>
              )}
            </div>
          ) : (
            tasksByArea.map(({ area, tasks }) => (
              <div key={area.id} className="mobile-picker-section">
                <div
                  className="mobile-picker-area-header"
                  style={{ borderLeftColor: area.color }}
                >
                  <span
                    className="area-dot"
                    style={{ backgroundColor: area.color }}
                  />
                  {area.name}
                </div>
                <div className="mobile-picker-tasks">
                  {tasks.map(task => (
                    <button
                      key={`${task.areaId}-${task.projectId}-${task.id}`}
                      className="mobile-picker-task"
                      onClick={() => handleSelectTask(task)}
                    >
                      <div className="task-info">
                        <span className="task-name">{task.name}</span>
                        <span className="task-project">{task.projectName}</span>
                      </div>
                      <ChevronRight size={18} className="chevron" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// src/components/ManagementSidebar.js
import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Palette, ChevronDown, ChevronRight } from 'lucide-react';

const LIFE_AREA_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#009688', '#e91e63',
  '#f44336', '#00bcd4', '#8bc34a', '#ff5722', '#3f51b5', '#ffc107'
];

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent', color: '#f44336', icon: '🔴' },
  { value: 'high', label: 'High', color: '#ff9800', icon: '🟠' },
  { value: 'medium', label: 'Medium', color: '#ffc107', icon: '🟡' },
  { value: 'low', label: 'Low', color: '#4caf50', icon: '🟢' }
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 75, label: '1h 15m' },
  { value: 90, label: '1h 30m' },
  { value: 105, label: '1h 45m' },
  { value: 120, label: '2 hours' },
  { value: 135, label: '2h 15m' },
  { value: 150, label: '2h 30m' },
  { value: 165, label: '2h 45m' },
  { value: 180, label: '3 hours' },
  { value: 195, label: '3h 15m' },
  { value: 210, label: '3h 30m' },
  { value: 225, label: '3h 45m' },
  { value: 240, label: '4 hours' }
];

export default function ManagementSidebar({
  isOpen,
  onClose,
  lifeAreas,
  projects,
  onAddLifeArea,
  onEditLifeArea,
  onDeleteLifeArea,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onAddTask,
  onEditTask,
  onDeleteTask
}) {
  const [selectedLifeArea, setSelectedLifeArea] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    lifeAreas: true,
    projects: false,
    tasks: false
  });

  // Life Area states
  const [showAddLifeArea, setShowAddLifeArea] = useState(false);
  const [newLifeAreaName, setNewLifeAreaName] = useState('');
  const [newLifeAreaColor, setNewLifeAreaColor] = useState(LIFE_AREA_COLORS[0]);
  const [editingLifeAreaId, setEditingLifeAreaId] = useState(null);
  const [editingLifeAreaName, setEditingLifeAreaName] = useState('');
  const [editingLifeAreaColor, setEditingLifeAreaColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(null);

  // Project states
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  // Task states
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  const [editingTaskPriority, setEditingTaskPriority] = useState('medium');
  const [editingTaskDuration, setEditingTaskDuration] = useState(60);

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Life Area handlers
  const handleAddLifeArea = () => {
    if (newLifeAreaName.trim()) {
      onAddLifeArea(newLifeAreaName.trim(), newLifeAreaColor);
      setNewLifeAreaName('');
      setNewLifeAreaColor(LIFE_AREA_COLORS[0]);
      setShowAddLifeArea(false);
    }
  };

  const startEditingLifeArea = (area) => {
    setEditingLifeAreaId(area.id);
    setEditingLifeAreaName(area.name);
    setEditingLifeAreaColor(area.color);
  };

  const saveEditingLifeArea = () => {
    if (editingLifeAreaName.trim()) {
      onEditLifeArea(editingLifeAreaId, editingLifeAreaName.trim(), editingLifeAreaColor);
      setEditingLifeAreaId(null);
      setEditingLifeAreaName('');
      setEditingLifeAreaColor('');
    }
  };

  // Project handlers
  const handleAddProject = () => {
    if (newProjectName.trim() && selectedLifeArea) {
      onAddProject(selectedLifeArea, newProjectName.trim());
      setNewProjectName('');
      setShowAddProject(false);
      setExpandedSections(prev => ({ ...prev, projects: true }));
    }
  };

  const startEditingProject = (project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const saveEditingProject = () => {
    if (editingProjectName.trim() && selectedLifeArea) {
      onEditProject(selectedLifeArea, editingProjectId, editingProjectName.trim());
      setEditingProjectId(null);
      setEditingProjectName('');
    }
  };

  // Task handlers
  const handleAddTask = () => {
    if (newTaskName.trim() && selectedProject && selectedLifeArea) {
      onAddTask(selectedLifeArea, selectedProject, newTaskName.trim(), newTaskPriority, newTaskDuration);
      setNewTaskName('');
      setNewTaskPriority('medium');
      setNewTaskDuration(60);
      setShowAddTask(false);
      setExpandedSections(prev => ({ ...prev, tasks: true }));
    }
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task.id);
    setEditingTaskName(task.name);
    setEditingTaskPriority(task.priority || 'medium');
    setEditingTaskDuration(task.durationMinutes || 60);
  };

  const saveEditingTask = () => {
    if (editingTaskName.trim() && selectedProject && selectedLifeArea) {
      onEditTask(selectedLifeArea, selectedProject, editingTaskId, editingTaskName.trim(), editingTaskPriority, editingTaskDuration);
      setEditingTaskId(null);
      setEditingTaskName('');
      setEditingTaskPriority('medium');
      setEditingTaskDuration(60);
    }
  };

  // Get filtered data
  const selectedAreaProjects = selectedLifeArea ? (projects[selectedLifeArea] || []) : [];
  const selectedProjectTasks = selectedProject
    ? selectedAreaProjects.find(p => p.id === selectedProject)?.tasks || []
    : [];

  if (!isOpen) return null;

  return (
    <>
      <div className="management-overlay" onClick={onClose} />
      <div className={`management-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="management-header">
          <h2>Management</h2>
          <button className="close-management-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="management-content">
          {/* LIFE AREAS SECTION */}
          <div className="management-section">
            <button
              className="management-section-header"
              onClick={() => toggleSection('lifeAreas')}
            >
              {expandedSections.lifeAreas ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <h3>Life Areas</h3>
              <span className="section-count">{lifeAreas.length}</span>
            </button>

            {expandedSections.lifeAreas && (
              <div className="management-section-content">
                {lifeAreas.map(area => (
                  <div
                    key={area.id}
                    className={`management-item ${selectedLifeArea === area.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedLifeArea(area.id);
                      setSelectedProject(null);
                      setExpandedSections(prev => ({ ...prev, projects: true, tasks: false }));
                    }}
                  >
                    {editingLifeAreaId === area.id ? (
                      <div className="management-item-edit">
                        <button
                          className="color-dot-btn"
                          style={{ backgroundColor: editingLifeAreaColor }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(showColorPicker === area.id ? null : area.id);
                          }}
                        >
                          <Palette size={10} />
                        </button>
                        <input
                          type="text"
                          value={editingLifeAreaName}
                          onChange={(e) => setEditingLifeAreaName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') saveEditingLifeArea();
                            if (e.key === 'Escape') setEditingLifeAreaId(null);
                          }}
                          autoFocus
                          className="management-input"
                        />
                        <button className="icon-btn success-btn" onClick={(e) => { e.stopPropagation(); saveEditingLifeArea(); }}>
                          <Check size={12} />
                        </button>
                        <button className="icon-btn cancel-btn" onClick={(e) => { e.stopPropagation(); setEditingLifeAreaId(null); }}>
                          <X size={12} />
                        </button>

                        {showColorPicker === area.id && (
                          <div className="color-picker-dropdown" onClick={(e) => e.stopPropagation()}>
                            {LIFE_AREA_COLORS.map(color => (
                              <button
                                key={color}
                                className={`color-option ${editingLifeAreaColor === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  setEditingLifeAreaColor(color);
                                  setShowColorPicker(null);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="management-item-dot" style={{ backgroundColor: area.color }} />
                        <span className="management-item-name">{area.name}</span>
                        <div className="management-item-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="icon-btn edit-btn" onClick={() => startEditingLifeArea(area)}>
                            <Edit2 size={12} />
                          </button>
                          <button className="icon-btn delete-btn" onClick={() => onDeleteLifeArea(area.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {showAddLifeArea ? (
                  <div className="management-add-form">
                    <button
                      className="color-dot-btn"
                      style={{ backgroundColor: newLifeAreaColor }}
                      onClick={() => setShowColorPicker('new')}
                    >
                      <Palette size={10} />
                    </button>
                    <input
                      type="text"
                      placeholder="Life area name..."
                      value={newLifeAreaName}
                      onChange={(e) => setNewLifeAreaName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddLifeArea();
                        if (e.key === 'Escape') setShowAddLifeArea(false);
                      }}
                      autoFocus
                      className="management-input"
                    />
                    <button className="icon-btn success-btn" onClick={handleAddLifeArea}>
                      <Check size={12} />
                    </button>
                    <button className="icon-btn cancel-btn" onClick={() => setShowAddLifeArea(false)}>
                      <X size={12} />
                    </button>

                    {showColorPicker === 'new' && (
                      <div className="color-picker-dropdown">
                        {LIFE_AREA_COLORS.map(color => (
                          <button
                            key={color}
                            className={`color-option ${newLifeAreaColor === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setNewLifeAreaColor(color);
                              setShowColorPicker(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="management-add-btn" onClick={() => setShowAddLifeArea(true)}>
                    <Plus size={14} /> Add Life Area
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PROJECTS SECTION */}
          <div className="management-section">
            <button
              className="management-section-header"
              onClick={() => toggleSection('projects')}
            >
              {expandedSections.projects ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <h3>Projects</h3>
              <span className="section-count">{selectedAreaProjects.length}</span>
            </button>

            {expandedSections.projects && (
              <div className="management-section-content">
                {!selectedLifeArea ? (
                  <div className="management-empty">Select a life area first</div>
                ) : (
                  <>
                    {selectedAreaProjects.map(project => (
                      <div
                        key={project.id}
                        className={`management-item ${selectedProject === project.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedProject(project.id);
                          setExpandedSections(prev => ({ ...prev, tasks: true }));
                        }}
                      >
                        {editingProjectId === project.id ? (
                          <div className="management-item-edit">
                            <input
                              type="text"
                              value={editingProjectName}
                              onChange={(e) => setEditingProjectName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') saveEditingProject();
                                if (e.key === 'Escape') setEditingProjectId(null);
                              }}
                              autoFocus
                              className="management-input"
                            />
                            <button className="icon-btn success-btn" onClick={(e) => { e.stopPropagation(); saveEditingProject(); }}>
                              <Check size={12} />
                            </button>
                            <button className="icon-btn cancel-btn" onClick={(e) => { e.stopPropagation(); setEditingProjectId(null); }}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="management-item-name">{project.name}</span>
                            <span className="management-item-count">{project.tasks?.length || 0} tasks</span>
                            <div className="management-item-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="icon-btn edit-btn" onClick={() => startEditingProject(project)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="icon-btn delete-btn" onClick={() => onDeleteProject(selectedLifeArea, project.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {showAddProject ? (
                      <div className="management-add-form">
                        <input
                          type="text"
                          placeholder="Project name..."
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddProject();
                            if (e.key === 'Escape') setShowAddProject(false);
                          }}
                          autoFocus
                          className="management-input"
                        />
                        <button className="icon-btn success-btn" onClick={handleAddProject}>
                          <Check size={12} />
                        </button>
                        <button className="icon-btn cancel-btn" onClick={() => setShowAddProject(false)}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button className="management-add-btn" onClick={() => setShowAddProject(true)}>
                        <Plus size={14} /> Add Project
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* TASKS SECTION */}
          <div className="management-section">
            <button
              className="management-section-header"
              onClick={() => toggleSection('tasks')}
            >
              {expandedSections.tasks ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <h3>Tasks</h3>
              <span className="section-count">{selectedProjectTasks.length}</span>
            </button>

            {expandedSections.tasks && (
              <div className="management-section-content">
                {!selectedProject ? (
                  <div className="management-empty">Select a project first</div>
                ) : (
                  <>
                    {selectedProjectTasks.map(task => (
                      <div key={task.id} className="management-item task-item">
                        {editingTaskId === task.id ? (
                          <div className="management-task-edit">
                            <input
                              type="text"
                              value={editingTaskName}
                              onChange={(e) => setEditingTaskName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditingTask();
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              autoFocus
                              className="management-input"
                            />
                            <select
                              value={editingTaskPriority}
                              onChange={(e) => setEditingTaskPriority(e.target.value)}
                              className="priority-select"
                            >
                              {PRIORITY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.icon} {opt.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={editingTaskDuration}
                              onChange={(e) => setEditingTaskDuration(Number(e.target.value))}
                              className="duration-select"
                            >
                              {DURATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button className="icon-btn success-btn" onClick={saveEditingTask}>
                              <Check size={12} />
                            </button>
                            <button className="icon-btn cancel-btn" onClick={() => setEditingTaskId(null)}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="task-priority-badge">
                              {PRIORITY_OPTIONS.find(p => p.value === (task.priority || 'medium'))?.icon}
                            </span>
                            <span className="management-item-name">{task.name}</span>
                            <span className="task-duration-badge">
                              {DURATION_OPTIONS.find(d => d.value === task.durationMinutes)?.label || '1 hour'}
                            </span>
                            <div className="management-item-actions">
                              <button className="icon-btn edit-btn" onClick={() => startEditingTask(task)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="icon-btn delete-btn" onClick={() => onDeleteTask(selectedLifeArea, selectedProject, task.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {showAddTask ? (
                      <div className="management-add-form task-add-form">
                        <input
                          type="text"
                          placeholder="Task name..."
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask();
                            if (e.key === 'Escape') setShowAddTask(false);
                          }}
                          autoFocus
                          className="management-input"
                        />
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value)}
                          className="priority-select"
                        >
                          {PRIORITY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.icon} {opt.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newTaskDuration}
                          onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                          className="duration-select"
                        >
                          {DURATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button className="icon-btn success-btn" onClick={handleAddTask}>
                          <Check size={12} />
                        </button>
                        <button className="icon-btn cancel-btn" onClick={() => setShowAddTask(false)}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button className="management-add-btn" onClick={() => setShowAddTask(true)}>
                        <Plus size={14} /> Add Task
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// src/components/ProjectsSidebar.js
import React, { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Edit2, Check, X, Palette, ListTodo, Search } from 'lucide-react';

const LIFE_AREA_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#009688', '#e91e63',
  '#f44336', '#00bcd4', '#8bc34a', '#ff5722', '#3f51b5', '#ffc107'
];

const ProjectsSidebar = React.memo(function ProjectsSidebar({
  lifeAreas,
  projects,
  collapsedAreas,
  collapsedProjects,
  onToggleArea,
  onToggleProject,
  onAddProjectClick,
  onDeleteProject,
  onDragStart,
  onAddLifeArea,
  onEditLifeArea,
  onDeleteLifeArea,
  onAddTask,
  onEditTask,
  onDeleteTask
}) {
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState(LIFE_AREA_COLORS[0]);
  const [addingTaskTo, setAddingTaskTo] = useState(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const startEditing = (area) => {
    setEditingAreaId(area.id);
    setEditingName(area.name);
    setEditingColor(area.color);
  };

  const cancelEditing = () => {
    setEditingAreaId(null);
    setEditingName('');
    setEditingColor('');
    setShowColorPicker(null);
  };

  const saveEditing = () => {
    if (editingName.trim()) {
      onEditLifeArea(editingAreaId, editingName, editingColor);
      cancelEditing();
    }
  };

  const handleAddArea = () => {
    if (newAreaName.trim()) {
      onAddLifeArea(newAreaName, newAreaColor);
      setNewAreaName('');
      setNewAreaColor(LIFE_AREA_COLORS[0]);
      setShowAddArea(false);
    }
  };

  const handleAddTask = (area, projectId) => {
    if (newTaskName.trim()) {
      onAddTask(area, projectId, newTaskName);
      setNewTaskName('');
      setAddingTaskTo(null);
    }
  };

  const startEditingTask = (taskId, taskName) => {
    setEditingTaskId(taskId);
    setEditingTaskName(taskName);
  };

  const saveEditingTask = (area, projectId) => {
    if (editingTaskName.trim()) {
      onEditTask(area, projectId, editingTaskId, editingTaskName);
      setEditingTaskId(null);
      setEditingTaskName('');
    }
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskName('');
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      if (editingAreaId) {
        cancelEditing();
      } else if (editingTaskId) {
        cancelEditingTask();
      } else if (addingTaskTo) {
        setAddingTaskTo(null);
        setNewTaskName('');
      } else {
        setShowAddArea(false);
        setNewAreaName('');
      }
    }
  };

  // Filter projects and tasks based on search query
  const filteredLifeAreas = useMemo(() => {
    if (!searchQuery.trim()) return lifeAreas;

    const query = searchQuery.toLowerCase();
    return lifeAreas.filter(area => {
      // Check if area name matches
      if (area.name.toLowerCase().includes(query)) return true;

      // Check if any project in this area matches
      const areaProjects = projects[area.id] || [];
      return areaProjects.some(project => {
        // Check project name
        if (project.name.toLowerCase().includes(query)) return true;

        // Check task names
        return project.tasks?.some(task =>
          task.name.toLowerCase().includes(query)
        );
      });
    });
  }, [lifeAreas, projects, searchQuery]);

  return (
    <aside className="projects-sidebar">
      <div className="sidebar-header">
        <h2>Projects</h2>
        <div className="sidebar-header-actions">
          <button
            className="add-project-btn"
            onClick={onAddProjectClick}
            title="Add Project"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="sidebar-controls">
        <div className="sidebar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search projects, tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="projects-sidebar-content">
        {filteredLifeAreas.map((area) => (
          <div key={area.id} className={`life-area ${!collapsedAreas[area.id] ? 'expanded' : ''}`}>
          <div className="life-area-header">
            <button
              className="life-area-toggle"
              onClick={() => onToggleArea(area.id)}
              aria-label={`Toggle ${area.name}`}
            >
              {collapsedAreas[area.id] ?
                <ChevronRight size={16} /> :
                <ChevronDown size={16} />
              }
            </button>

            {editingAreaId === area.id ? (
              <div className="life-area-edit">
                <button
                  className="color-picker-btn"
                  style={{ backgroundColor: editingColor }}
                  onClick={() => setShowColorPicker(showColorPicker === area.id ? null : area.id)}
                  title="Change color"
                >
                  <Palette size={12} />
                </button>
                <input
                  type="text"
                  className="life-area-name-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, saveEditing)}
                  autoFocus
                  maxLength={50}
                />
                <button
                  className="icon-btn success-btn"
                  onClick={saveEditing}
                  title="Save"
                >
                  <Check size={14} />
                </button>
                <button
                  className="icon-btn cancel-btn"
                  onClick={cancelEditing}
                  title="Cancel"
                >
                  <X size={14} />
                </button>

                {showColorPicker === area.id && (
                  <div className="color-picker-palette">
                    {LIFE_AREA_COLORS.map(color => (
                      <button
                        key={color}
                        className={`color-option ${editingColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setEditingColor(color);
                          setShowColorPicker(null);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div
                  className="life-area-dot"
                  style={{ backgroundColor: area.color }}
                />
                <span className="life-area-name">{area.name}</span>
                <span className="project-count">
                  {projects[area.id]?.length || 0}
                </span>
                <div className="life-area-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => startEditing(area)}
                    title="Edit life area"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => {
                      if (window.confirm(`Delete "${area.name}"? This will also delete all associated projects.`)) {
                        onDeleteLifeArea(area.id);
                      }
                    }}
                    title="Delete life area"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>

          {!collapsedAreas[area.id] && (
            <div className="projects-list">
              {projects[area.id]?.length > 0 ? (
                projects[area.id].map(project => (
                  <div key={project.id} className="project-container">
                    <div className="project-item-header">
                      <button
                        className="project-toggle"
                        onClick={() => onToggleProject(project.id)}
                        aria-label={`Toggle ${project.name} tasks`}
                      >
                        {collapsedProjects[project.id] ?
                          <ChevronRight size={14} /> :
                          <ChevronDown size={14} />
                        }
                      </button>
                      <span className="project-name">{project.name}</span>
                      <span className="task-count">
                        <ListTodo size={14} />
                        {project.tasks?.length || 0}
                      </span>
                      <div className="project-actions">
                        <button
                          className="icon-btn add-task-btn"
                          onClick={() => setAddingTaskTo(project.id)}
                          title="Add task"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          className="delete-project-btn"
                          onClick={() => onDeleteProject(area.id, project.id)}
                          title="Delete project"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {!collapsedProjects[project.id] && (
                      <div className="tasks-list">
                        {addingTaskTo === project.id && (
                          <div className="add-task-form">
                            <input
                              type="text"
                              className="task-name-input"
                              placeholder="Task name..."
                              value={newTaskName}
                              onChange={(e) => setNewTaskName(e.target.value)}
                              onKeyDown={(e) => handleKeyPress(e, () => handleAddTask(area.id, project.id))}
                              autoFocus
                              maxLength={100}
                            />
                            <button
                              className="icon-btn success-btn"
                              onClick={() => handleAddTask(area.id, project.id)}
                              title="Add"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              className="icon-btn cancel-btn"
                              onClick={() => {
                                setAddingTaskTo(null);
                                setNewTaskName('');
                              }}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}

                        {project.tasks && project.tasks.length > 0 ? (
                          project.tasks.map(task => (
                            <div
                              key={task.id}
                              className={`task-item ${task.completed ? 'completed' : ''}`}
                              draggable={!editingTaskId}
                              onDragStart={() => onDragStart(task, project.id, project.name, area.id)}
                            >
                              {editingTaskId === task.id ? (
                                <div className="task-edit-form">
                                  <input
                                    type="text"
                                    className="task-name-input"
                                    value={editingTaskName}
                                    onChange={(e) => setEditingTaskName(e.target.value)}
                                    onKeyDown={(e) => handleKeyPress(e, () => saveEditingTask(area.id, project.id))}
                                    autoFocus
                                    maxLength={100}
                                  />
                                  <button
                                    className="icon-btn success-btn"
                                    onClick={() => saveEditingTask(area.id, project.id)}
                                    title="Save"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    className="icon-btn cancel-btn"
                                    onClick={cancelEditingTask}
                                    title="Cancel"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="task-name">{task.name}</span>
                                  <div className="task-actions">
                                    <button
                                      className="icon-btn edit-btn"
                                      onClick={() => startEditingTask(task.id, task.name)}
                                      title="Edit task"
                                    >
                                      <Edit2 size={10} />
                                    </button>
                                    <button
                                      className="icon-btn delete-btn"
                                      onClick={() => onDeleteTask(area.id, project.id, task.id)}
                                      title="Delete task"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          !addingTaskTo && (
                            <div className="empty-tasks">
                              <p className="empty-state-text">No tasks yet</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p className="empty-state-text">No projects yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="add-life-area-section">
        {showAddArea ? (
          <div className="add-life-area-form">
            <button
              className="color-picker-btn"
              style={{ backgroundColor: newAreaColor }}
              onClick={() => setShowColorPicker('new')}
              title="Choose color"
            >
              <Palette size={12} />
            </button>
            <input
              type="text"
              className="life-area-name-input"
              placeholder="Life area name..."
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, handleAddArea)}
              autoFocus
              maxLength={50}
            />
            <button
              className="icon-btn success-btn"
              onClick={handleAddArea}
              title="Add"
            >
              <Check size={14} />
            </button>
            <button
              className="icon-btn cancel-btn"
              onClick={() => {
                setShowAddArea(false);
                setNewAreaName('');
                setShowColorPicker(null);
              }}
              title="Cancel"
            >
              <X size={14} />
            </button>

            {showColorPicker === 'new' && (
              <div className="color-picker-palette">
                {LIFE_AREA_COLORS.map(color => (
                  <button
                    key={color}
                    className={`color-option ${newAreaColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setNewAreaColor(color);
                      setShowColorPicker(null);
                    }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            className="add-life-area-btn"
            onClick={() => setShowAddArea(true)}
          >
            <Plus size={16} /> Add Life Area
          </button>
        )}
        </div>
      </div>
    </aside>
  );
});

export default ProjectsSidebar;

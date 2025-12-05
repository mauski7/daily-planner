import React, { useState, useMemo } from 'react';
import { Search, X, Filter, Plus } from 'lucide-react';

export default function TasksSidebar({
  lifeAreas,
  projects,
  onDragStart,
  taskScheduleFrequency = {},
  onAddTask
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLifeAreas, setFilterLifeAreas] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddProject, setQuickAddProject] = useState('');

  // Build list of all projects for quick-add dropdown
  const allProjects = useMemo(() => {
    const projectList = [];
    lifeAreas.forEach(area => {
      const areaProjects = projects[area.id] || [];
      areaProjects.forEach(project => {
        projectList.push({
          id: project.id,
          name: project.name,
          areaId: area.id,
          areaName: area.name,
          areaColor: area.color
        });
      });
    });
    return projectList;
  }, [lifeAreas, projects]);

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
              projectName: project.name,
              frequency: taskScheduleFrequency[task.id] || 0
            });
          }
        });
      });
    });
    return tasks;
  }, [lifeAreas, projects, taskScheduleFrequency]);

  // Handle quick-add task submission
  const handleQuickAdd = () => {
    if (!quickAddName.trim() || !quickAddProject) return;

    const project = allProjects.find(p => p.id === quickAddProject);
    if (project && onAddTask) {
      onAddTask(project.areaId, project.id, quickAddName.trim());
      setQuickAddName('');
      setShowQuickAdd(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = allTasks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(query) ||
        task.projectName.toLowerCase().includes(query) ||
        task.areaName.toLowerCase().includes(query)
      );
    }

    if (filterLifeAreas.length > 0) {
      filtered = filtered.filter(task => filterLifeAreas.includes(task.areaId));
    }

    return filtered;
  }, [allTasks, searchQuery, filterLifeAreas]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Sort by frequency first, then alphabetically
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredTasks]);

  const toggleLifeAreaFilter = (areaId) => {
    setFilterLifeAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const clearFilters = () => {
    setFilterLifeAreas([]);
    setSearchQuery('');
  };

  const hasActiveFilters = filterLifeAreas.length > 0 || searchQuery.trim();

  return (
    <aside className="tasks-sidebar">
      <div className="sidebar-header">
        <h2>Tasks</h2>
        <div className="sidebar-header-buttons">
          <button
            className={`quick-add-toggle-btn ${showQuickAdd ? 'active' : ''}`}
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            title="Quick add task"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {showQuickAdd && (
        <div className="quick-add-form">
          <input
            type="text"
            className="quick-add-input"
            placeholder="Task name..."
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
            autoFocus
          />
          <select
            className="quick-add-select"
            value={quickAddProject}
            onChange={(e) => setQuickAddProject(e.target.value)}
          >
            <option value="">Select project...</option>
            {allProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.areaName} / {project.name}
              </option>
            ))}
          </select>
          <div className="quick-add-buttons">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleQuickAdd}
              disabled={!quickAddName.trim() || !quickAddProject}
            >
              Add Task
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowQuickAdd(false);
                setQuickAddName('');
                setQuickAddProject('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="tasks-search-row">
        <div className="tasks-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="tasks-search-input"
            placeholder="Search tasks..."
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
        <button
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle filters"
        >
          <Filter size={16} />
          {hasActiveFilters && <span className="filter-badge">{filterLifeAreas.length}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="tasks-filters">
          <div className="filter-group">
            <div className="filter-group-label">Life Areas</div>
            <div className="filter-chips">
              {lifeAreas.map(area => (
                <button
                  key={area.id}
                  className={`filter-chip ${filterLifeAreas.includes(area.id) ? 'active' : ''}`}
                  onClick={() => toggleLifeAreaFilter(area.id)}
                  style={{
                    borderColor: area.color,
                    backgroundColor: filterLifeAreas.includes(area.id) ? `${area.color}20` : 'transparent'
                  }}
                >
                  <span className="filter-chip-dot" style={{ backgroundColor: area.color }} />
                  {area.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="tasks-list">
        {sortedTasks.length === 0 ? (
          <div className="tasks-empty">
            {hasActiveFilters ? (
              <>
                <p>No tasks match your filters</p>
                <button className="btn-link" onClick={clearFilters}>Clear filters</button>
              </>
            ) : (
              <>
                <p>No tasks yet</p>
                <p className="empty-hint">Add tasks in the Projects panel</p>
              </>
            )}
          </div>
        ) : (
          sortedTasks.map(task => (
            <div
              key={`${task.areaId}-${task.projectId}-${task.id}`}
              className="task-card"
              draggable
              onDragStart={() => onDragStart(task, task.projectId, task.projectName, task.areaId)}
            >
              <div className="task-card-header">
                <span className="task-card-name">{task.name}</span>
              </div>
              <div className="task-card-tags">
                <span
                  className="task-tag area-tag"
                  style={{
                    backgroundColor: `${task.areaColor}20`,
                    borderColor: task.areaColor,
                    color: task.areaColor
                  }}
                >
                  <span className="task-tag-dot" style={{ backgroundColor: task.areaColor }} />
                  {task.areaName}
                </span>
                <span className="task-tag project-tag">
                  {task.projectName}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

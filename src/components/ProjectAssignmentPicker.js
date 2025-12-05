// src/components/ProjectAssignmentPicker.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Search, Clock } from 'lucide-react';

export default function ProjectAssignmentPicker({
  projects,
  lifeAreas,
  onAssign,
  recentProjects = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 280 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate and update dropdown position
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const minWidth = 280;
      const dropdownWidth = Math.max(rect.width, minWidth);

      // Calculate left position, ensuring dropdown doesn't overflow viewport
      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth - 20) {
        left = window.innerWidth - dropdownWidth - 20;
      }

      setDropdownPosition({
        top: rect.bottom + 8,
        left: left,
        width: dropdownWidth
      });
    }
  }, []);

  // Position dropdown when opened and on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Don't close if clicking on the button or dropdown
      if (buttonRef.current && buttonRef.current.contains(event.target)) {
        return;
      }
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    // Use capture phase to catch events before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen]);

  // Flatten projects for easier searching
  const allProjects = Object.entries(projects).flatMap(([areaId, areaProjects]) =>
    areaProjects.map(project => ({
      ...project,
      areaId,
      areaName: lifeAreas?.find(a => a.id === areaId)?.name || '',
      areaColor: lifeAreas?.find(a => a.id === areaId)?.color || '#ccc'
    }))
  );

  // Filter projects based on search
  const filteredProjects = allProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.areaName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get recent projects (limit to 5)
  const recentProjectsList = recentProjects
    .slice(0, 5)
    .map(recentId => allProjects.find(p => p.id === recentId))
    .filter(Boolean);

  const handleSelect = (e, projectId, areaId) => {
    e.preventDefault();
    e.stopPropagation();
    onAssign(projectId, areaId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const dropdown = isOpen ? ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="assignment-dropdown-portal"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 99999
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="assignment-search" onMouseDown={(e) => e.stopPropagation()}>
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="assignment-search-input"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          autoFocus
        />
      </div>

      <div className="assignment-options">
        {/* Recent Projects Section */}
        {!searchQuery && recentProjectsList.length > 0 && (
          <div className="assignment-section">
            <div className="assignment-section-header">
              <Clock size={14} />
              <span>Recent</span>
            </div>
            {recentProjectsList.map(project => (
              <button
                key={project.id}
                className="assignment-option"
                onClick={(e) => handleSelect(e, project.id, project.areaId)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span
                  className="assignment-option-dot"
                  style={{ backgroundColor: project.areaColor }}
                />
                <div className="assignment-option-info">
                  <span className="assignment-option-name">{project.name}</span>
                  <span className="assignment-option-area">{project.areaName}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* All Projects Section */}
        <div className="assignment-section">
          {!searchQuery && recentProjectsList.length > 0 && (
            <div className="assignment-section-header">
              <span>All Projects</span>
            </div>
          )}
          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <button
                key={project.id}
                className="assignment-option"
                onClick={(e) => handleSelect(e, project.id, project.areaId)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span
                  className="assignment-option-dot"
                  style={{ backgroundColor: project.areaColor }}
                />
                <div className="assignment-option-info">
                  <span className="assignment-option-name">{project.name}</span>
                  <span className="assignment-option-area">{project.areaName}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="assignment-empty">
              No projects found
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="project-assignment-picker">
      <button
        ref={buttonRef}
        className="assign-trigger-btn"
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        Assign to project...
      </button>
      {dropdown}
    </div>
  );
}

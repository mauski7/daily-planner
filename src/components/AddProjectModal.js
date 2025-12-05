// src/components/AddProjectModal.js
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const MAX_PROJECT_NAME_LENGTH = 100;
const MIN_PROJECT_NAME_LENGTH = 1;

export default function AddProjectModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  onNameChange,
  selectedArea,
  onAreaChange,
  isSaving,
  existingProjects = {},
  lifeAreas = []
}) {
  const [validationError, setValidationError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Validate project name
  const validateProjectName = (name) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return 'Project name is required';
    }

    if (trimmedName.length < MIN_PROJECT_NAME_LENGTH) {
      return 'Project name is too short';
    }

    if (trimmedName.length > MAX_PROJECT_NAME_LENGTH) {
      return `Project name must be less than ${MAX_PROJECT_NAME_LENGTH} characters`;
    }

    // Check for duplicates in the selected area
    const areaProjects = existingProjects[selectedArea] || [];
    const isDuplicate = areaProjects.some(
      project => project.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      const areaName = lifeAreas.find(area => area.id === selectedArea)?.name || 'this area';
      return `A project named "${trimmedName}" already exists in ${areaName}`;
    }

    return '';
  };

  // Update validation when name or area changes
  useEffect(() => {
    if (projectName) {
      const error = validateProjectName(projectName);
      setValidationError(error);
    } else {
      setValidationError('');
    }
  }, [projectName, selectedArea]);

  // Clear validation when modal closes
  useEffect(() => {
    if (!isOpen) {
      setValidationError('');
      setSearchFilter('');
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      // Keyboard shortcuts for life area selection (1-9)
      if (isOpen && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        const filteredAreas = lifeAreas.filter(area =>
          area.name.toLowerCase().includes(searchFilter.toLowerCase())
        );
        if (index < filteredAreas.length) {
          onAreaChange(filteredAreas[index].id);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, lifeAreas, searchFilter, onAreaChange]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const modal = document.querySelector('.modal');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const error = validateProjectName(projectName);
    if (error) {
      setValidationError(error);
      return;
    }

    if (projectName.trim() && !isSaving) {
      onSubmit();
    }
  };

  const handleNameChange = (value) => {
    // Sanitize input: remove leading/trailing whitespace, limit length
    const sanitized = value.slice(0, MAX_PROJECT_NAME_LENGTH);
    onNameChange(sanitized);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="modal-header">
          <h3 id="modal-title">Add New Project</h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">
              Project Name
              <span className="char-count">
                {projectName.length}/{MAX_PROJECT_NAME_LENGTH}
              </span>
            </label>
            <input
              id="project-name"
              className={`form-input ${validationError ? 'input-error' : ''}`}
              type="text"
              value={projectName}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              placeholder="Enter project name..."
              autoFocus
              disabled={isSaving}
              maxLength={MAX_PROJECT_NAME_LENGTH}
            />
            {validationError && (
              <span className="validation-error">{validationError}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="life-area-search">
              Life Area
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 400 }}>
                (Press 1-9 for quick select)
              </span>
            </label>
            <input
              id="life-area-search"
              type="text"
              className="form-input"
              placeholder="Search life areas..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              disabled={isSaving}
              style={{ marginBottom: '1rem' }}
            />
            <div className="life-area-cards">
              {lifeAreas
                .filter(area => area.name.toLowerCase().includes(searchFilter.toLowerCase()))
                .map((area, index) => (
                  <button
                    key={area.id}
                    type="button"
                    className={`life-area-card ${selectedArea === area.id ? 'selected' : ''}`}
                    onClick={() => onAreaChange(area.id)}
                    disabled={isSaving}
                    style={{
                      borderColor: area.color,
                      backgroundColor: selectedArea === area.id ? `${area.color}15` : 'transparent'
                    }}
                  >
                    <span
                      className="life-area-card-dot"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="life-area-card-name">{area.name}</span>
                    <span className="life-area-card-shortcut">{index + 1}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSaving || !projectName.trim() || !!validationError}
          >
            {isSaving ? 'Adding...' : 'Add Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

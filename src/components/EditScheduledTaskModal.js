// src/components/EditScheduledTaskModal.js
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Calendar, Clock, CalendarDays } from 'lucide-react';

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

export default function EditScheduledTaskModal({
  isOpen,
  task,
  timeSlot,
  onClose,
  onSaveThisDay,
  onSaveAllFuture,
  isProjectTask
}) {
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(60);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTaskName(task.name || '');
      setDuration(task.durationMinutes || 60);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSaveThisDay = () => {
    onSaveThisDay(timeSlot, {
      name: taskName.trim(),
      durationMinutes: duration
    });
    onClose();
  };

  const handleSaveAllFuture = () => {
    onSaveAllFuture(timeSlot, task, {
      name: taskName.trim(),
      durationMinutes: duration
    });
    onClose();
  };

  const hasChanges = taskName.trim() !== task.name || duration !== (task.durationMinutes || 60);
  const isCalendarEvent = task.type === 'calendar';

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Scheduled Task</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Time slot indicator */}
          <div className="edit-task-time-info">
            <Clock size={16} />
            <span>Scheduled at {timeSlot}</span>
          </div>

          {/* Task Name */}
          <div className="form-group">
            <label className="form-label">Task Name</label>
            <input
              type="text"
              className="form-input"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              autoFocus
            />
          </div>

          {/* Duration */}
          <div className="form-group">
            <label className="form-label">Duration</label>
            <select
              className="form-select"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Info about task source */}
          {isProjectTask && (
            <div className="edit-task-source-info">
              <CalendarDays size={16} />
              <span>
                This task is linked to project: <strong>{task.projectName}</strong>
              </span>
            </div>
          )}

          {isCalendarEvent && (
            <div className="edit-task-source-info calendar-source">
              <Calendar size={16} />
              <span>
                This is a calendar event from <strong>{task.calendarName}</strong>.
                Calendar events can only be edited for this day.
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer edit-task-footer">
          {/* Cancel button */}
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>

          {/* This Day Only button */}
          <button
            className="btn btn-this-day"
            onClick={handleSaveThisDay}
            disabled={!hasChanges || !taskName.trim()}
            title="Changes will only apply to this specific day"
          >
            <Calendar size={16} />
            This Day Only
          </button>

          {/* All Future button - only for project tasks */}
          {isProjectTask && !isCalendarEvent && (
            <button
              className="btn btn-all-future"
              onClick={handleSaveAllFuture}
              disabled={!hasChanges || !taskName.trim()}
              title="Changes will apply to this task in all future occurrences"
            >
              <CalendarDays size={16} />
              All Future
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

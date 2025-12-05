// src/components/TimeSlot.js
import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import ProjectAssignmentPicker from './ProjectAssignmentPicker';

// Format duration for display
const formatDuration = (minutes) => {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Convert time string to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
};

// Base height in pixels for 1 hour (200px = 3.33px per minute, 15min = 50px)
const BASE_HOUR_HEIGHT = 200;

const TimeSlot = React.memo(function TimeSlot({
  time,
  task,
  projects,
  lifeAreas,
  onDragOver,
  onDrop,
  onRemoveTask,
  onAssignEvent,
  onAddCustomTask,
  onEditTask,
  onScheduledTaskDragStart,
  recentProjects = [],
  isExpanded,
  expansionLevel,
  onTimeClick,
  onMobileSlotTap
}) {
  const isCalendarEvent = task?.type === 'calendar';
  const areaColor = lifeAreas?.find(area => area.id === task?.area)?.color;

  // Calculate duration from durationMinutes or from start/end time
  let durationMinutes = task?.durationMinutes;
  if (!durationMinutes && task?.endTime && time) {
    const startMins = timeToMinutes(time);
    const endMins = timeToMinutes(task.endTime);
    durationMinutes = endMins - startMins;
  }

  const duration = formatDuration(durationMinutes);

  // Determine if this is an hourly slot (can be expanded)
  const minute = parseInt(time.split(':')[1], 10);
  const isHourlySlot = minute === 0;

  // Calculate dynamic height based on duration (proportional to time)
  const taskDuration = durationMinutes || 60; // Default to 60 min if not specified
  const heightMultiplier = taskDuration / 60;
  const dynamicHeight = task ? `${Math.round(BASE_HOUR_HEIGHT * heightMultiplier)}px` : undefined;
  const isMultiHour = taskDuration > 60;
  const isShortTask = taskDuration < 60;

  // Build slot styles
  const slotStyle = {
    ...(areaColor && { borderLeftColor: areaColor }),
    ...(dynamicHeight && { minHeight: dynamicHeight, height: dynamicHeight })
  };

  return (
    <div
      className={`time-block ${isExpanded ? 'expanded' : ''} ${isMultiHour ? 'multi-hour' : ''} ${isShortTask ? 'short-task' : ''}`}
      style={dynamicHeight ? { minHeight: dynamicHeight } : undefined}
    >
      <button
        className={`time-label ${isHourlySlot ? 'clickable' : ''} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => isHourlySlot && onTimeClick && onTimeClick(time)}
        title={isHourlySlot ? (isExpanded ? 'Click to collapse or expand further' : 'Click to expand time slots') : undefined}
        style={dynamicHeight ? { height: dynamicHeight, alignSelf: 'flex-start' } : undefined}
      >
        {time}
        {task?.endTime && <span className="time-range">–{task.endTime}</span>}
      </button>
      <div
        className={`time-slot ${task ? 'has-task' : ''} ${task?.area ? task.area : ''}`}
        style={slotStyle}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, time)}
      >
        {task ? (
          <div
            className={`scheduled-task-item ${!isCalendarEvent ? 'draggable' : ''}`}
            draggable={!isCalendarEvent}
            onDragStart={(e) => {
              if (!isCalendarEvent && onScheduledTaskDragStart) {
                onScheduledTaskDragStart(e, time, task);
              }
            }}
          >
            <div className="task-content">
              <div className="task-header">
                <span className="task-name">
                  {task.name}
                </span>
              </div>

              <div className="task-metadata">
                {task.projectName && (
                  <span className="task-project-name">
                    {task.projectName}
                  </span>
                )}
                {task.area && (
                  <span className="task-area-badge" style={{ backgroundColor: areaColor }}>
                    {lifeAreas?.find(area => area.id === task.area)?.name}
                  </span>
                )}
                {isCalendarEvent && (
                  <span className="task-type calendar-badge">
                    📅 {task.isAllDay ? '(All Day) ' : task.endTime ? `${time}–${task.endTime} ` : ''}{task.calendarName}
                    {duration && <span className="event-duration">({duration})</span>}
                  </span>
                )}
              </div>

              {isCalendarEvent && !task.area && (
                <ProjectAssignmentPicker
                  projects={projects}
                  lifeAreas={lifeAreas}
                  recentProjects={recentProjects}
                  onAssign={(projectId, areaId) => onAssignEvent(time, projectId, areaId)}
                />
              )}
            </div>

            <div className="task-action-buttons">
              <button
                className="edit-task-btn"
                onClick={() => onEditTask && onEditTask(time, task)}
                title="Edit task"
              >
                <Pencil size={14} />
              </button>
              {!isCalendarEvent && (
                <button
                  className="remove-task-btn"
                  onClick={() => onRemoveTask(time)}
                  title="Remove task from schedule"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop: show input for typing */}
            <input
              className="add-task-input desktop-only"
              placeholder="Drag a task here or type to add..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  onAddCustomTask(time, e.target.value);
                  e.target.value = '';
                }
              }}
            />
            {/* Mobile: show tap-to-add button */}
            <button
              className="mobile-slot-tap-btn mobile-only"
              onClick={() => onMobileSlotTap && onMobileSlotTap(time)}
            >
              Tap to add task
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export default TimeSlot;

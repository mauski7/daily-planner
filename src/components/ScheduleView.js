// src/components/ScheduleView.js
import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import TimeSlot from './TimeSlot';

const ScheduleView = React.memo(function ScheduleView({
  selectedDate,
  isLoadingCalendar,
  timeSlots,
  schedule,
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
  expandedSlots = {},
  onTimeSlotClick,
  onRefreshCalendar
}) {
  const getScheduleTitle = () => {
    if (isToday(selectedDate)) return "Today's Schedule";
    if (isTomorrow(selectedDate)) return "Tomorrow's Schedule";
    if (isYesterday(selectedDate)) return "Yesterday's Schedule";
    return "Schedule";
  };

  return (
    <div className="schedule-area">
      <div className="schedule-header">
        <h2 className="schedule-title">
          {getScheduleTitle()}
          {isLoadingCalendar && (
            <span className="loading-indicator"> (Loading calendar...)</span>
          )}
        </h2>
        <div className="schedule-header-actions">
          {onRefreshCalendar && (
            <button
              className="refresh-calendar-btn"
              onClick={onRefreshCalendar}
              disabled={isLoadingCalendar}
              title="Refresh calendar events"
            >
              <RefreshCw size={16} className={isLoadingCalendar ? 'spinning' : ''} />
            </button>
          )}
          <div className="schedule-date">
            <Calendar size={16} />
            {format(selectedDate, 'MMMM d, yyyy')}
          </div>
        </div>
      </div>

      <div className="time-blocks">
        {timeSlots.map(slot => {
          // Get the parent hour for this slot
          const hour = slot.time.split(':')[0];
          const hourKey = `${hour}:00`;
          const parentExpansionLevel = expandedSlots[hourKey];

          return (
            <TimeSlot
              key={slot.time}
              time={slot.time}
              task={schedule[slot.time]}
              projects={projects}
              lifeAreas={lifeAreas}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onRemoveTask={onRemoveTask}
              onAssignEvent={onAssignEvent}
              onAddCustomTask={onAddCustomTask}
              onEditTask={onEditTask}
              onScheduledTaskDragStart={onScheduledTaskDragStart}
              recentProjects={recentProjects}
              isExpanded={!!parentExpansionLevel}
              expansionLevel={parentExpansionLevel}
              onTimeClick={onTimeSlotClick}
            />
          );
        })}
      </div>
    </div>
  );
});

export default ScheduleView;

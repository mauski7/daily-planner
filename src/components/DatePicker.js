// src/components/DatePicker.js
import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DatePicker = React.memo(function DatePicker({ selectedDate, onChange }) {
  const goToPreviousDay = () => {
    onChange(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    onChange(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    onChange(new Date());
  };

  const goToTomorrow = () => {
    onChange(addDays(new Date(), 1));
  };

  const handleDateInputChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onChange(newDate);
    }
  };

  return (
    <div className="date-picker">
      <button
        className="date-nav-btn"
        onClick={goToPreviousDay}
        aria-label="Previous day"
        title="Previous day"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="date-picker-input-wrapper">
        <Calendar size={16} className="date-picker-icon" />
        <input
          type="date"
          className="date-picker-input"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={handleDateInputChange}
          aria-label="Select date"
        />
        <span className="date-picker-display">
          {format(selectedDate, 'EEEE, MMM d')}
        </span>
      </div>

      <button
        className="date-nav-btn"
        onClick={goToNextDay}
        aria-label="Next day"
        title="Next day"
      >
        <ChevronRight size={18} />
      </button>

      <div className="date-quick-actions">
        <button
          className="btn-quick-date"
          onClick={goToToday}
          title="Go to today"
        >
          Today
        </button>
        <button
          className="btn-quick-date"
          onClick={goToTomorrow}
          title="Go to tomorrow"
        >
          Tomorrow
        </button>
      </div>
    </div>
  );
});

export default DatePicker;

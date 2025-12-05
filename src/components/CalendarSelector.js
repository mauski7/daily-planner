// src/components/CalendarSelector.js
import React, { useMemo } from 'react';
import { X, Check, Calendar, Plus, Trash2, Mail } from 'lucide-react';

export default function CalendarSelector({
  isOpen,
  onClose,
  availableCalendars,
  selectedCalendars,
  onToggleCalendar,
  onSelectAll,
  onDeselectAll,
  onRefresh,
  connectedAccounts = [],
  onAddAccount,
  onDisconnectAccount
}) {
  // Group calendars by account - must be before any conditional returns
  const calendarsByAccount = useMemo(() => {
    const grouped = {};
    availableCalendars.forEach(calendar => {
      const email = calendar.accountEmail || 'primary';
      if (!grouped[email]) {
        grouped[email] = [];
      }
      grouped[email].push(calendar);
    });
    return grouped;
  }, [availableCalendars]);

  const accountEmails = Object.keys(calendarsByAccount);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="calendar-selector-modal">
        <div className="modal-header">
          <h3>Manage Calendars</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Connected Accounts Section */}
          <div className="accounts-section">
            <div className="accounts-header">
              <span className="accounts-label">Connected Accounts</span>
              <button
                className="btn btn-sm btn-add-account"
                onClick={onAddAccount}
                title="Add another Google account"
              >
                <Plus size={14} />
                Add Account
              </button>
            </div>

            {connectedAccounts.length === 0 && availableCalendars.length === 0 ? (
              <div className="calendar-empty">
                <Calendar size={32} />
                <p>No accounts connected</p>
                <p className="hint">Connect your Google Calendar to see available calendars</p>
              </div>
            ) : (
              <div className="accounts-list">
                {connectedAccounts.map(account => (
                  <div key={account.email} className="account-item">
                    <Mail size={16} className="account-icon" />
                    <span className="account-email">{account.email}</span>
                    <button
                      className="btn-disconnect"
                      onClick={() => {
                        if (window.confirm(`Disconnect ${account.email}? This will remove all calendars from this account.`)) {
                          onDisconnectAccount(account.email);
                        }
                      }}
                      title="Disconnect account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendars Section */}
          {availableCalendars.length > 0 && (
            <>
              <div className="calendars-divider" />

              <div className="calendar-actions">
                <button className="btn btn-sm" onClick={onSelectAll}>
                  Select All
                </button>
                <button className="btn btn-sm btn-secondary" onClick={onDeselectAll}>
                  Deselect All
                </button>
              </div>

              <div className="calendar-list">
                {accountEmails.map(email => (
                  <div key={email} className="account-calendars">
                    {accountEmails.length > 1 && (
                      <div className="account-calendars-header">
                        <Mail size={14} />
                        <span>{email}</span>
                      </div>
                    )}
                    {calendarsByAccount[email].map(calendar => {
                      const isSelected = selectedCalendars.length === 0 || selectedCalendars.includes(calendar.id);
                      return (
                        <label key={calendar.id} className="calendar-item">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleCalendar(calendar.id)}
                          />
                          <span
                            className="calendar-color"
                            style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                          />
                          <span className="calendar-name">
                            {calendar.summary}
                            {calendar.primary && <span className="primary-badge">Primary</span>}
                          </span>
                          {isSelected && <Check size={16} className="check-icon" />}
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>

              <p className="calendar-hint">
                {selectedCalendars.length === 0
                  ? 'All calendars are synced by default'
                  : `${selectedCalendars.length} calendar${selectedCalendars.length !== 1 ? 's' : ''} selected`}
              </p>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={() => { onRefresh(); onClose(); }}>
            Apply & Refresh
          </button>
        </div>
      </div>
    </>
  );
}

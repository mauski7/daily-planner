// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import { auth, signInWithGoogle, signOutUser, db, refreshGoogleToken, isTokenExpired, addCalendarAccount } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { LogOut, User, Calendar, Settings, CheckSquare, CalendarDays, FolderKanban } from 'lucide-react';
import TasksSidebar from './components/TasksSidebar';
import ManagementSidebar from './components/ManagementSidebar';
import ScheduleView from './components/ScheduleView';
import ProjectsSidebar from './components/ProjectsSidebar';
import EditScheduledTaskModal from './components/EditScheduledTaskModal';
import CalendarSelector from './components/CalendarSelector';
import ToastContainer from './components/ToastContainer';
import DatePicker from './components/DatePicker';
import MobileTaskPicker from './components/MobileTaskPicker';
import './App.css';

// Default life areas for new users
const DEFAULT_LIFE_AREAS = [
  { id: 'education', name: 'Education', color: '#2196f3' },
  { id: 'health', name: 'Health', color: '#4caf50' },
  { id: 'family', name: 'Family', color: '#ff9800' },
  { id: 'friends', name: 'Friends', color: '#9c27b0' },
  { id: 'money', name: 'Money', color: '#009688' },
  { id: 'relationship', name: 'Relationship', color: '#e91e63' }
];

// Predefined color palette for life areas
const LIFE_AREA_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#009688', '#e91e63',
  '#f44336', '#00bcd4', '#8bc34a', '#ff5722', '#3f51b5', '#ffc107'
];

// Generate all possible 15-minute time slots from 6am to 11pm
const generateAllTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let min = 0; min < 60; min += 15) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        hour: hour,
        minute: min
      });
    }
  }
  return slots;
};

// Get all 10-minute slots (cached)
const ALL_TIME_SLOTS = generateAllTimeSlots();

// Helper to convert time string to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
};

// Filter time slots based on expansion state
// expandedSlots: { "06:00": 30 } means 6:00 is expanded to show 30-min intervals
// expandedSlots: { "06:00": 15 } means 6:00 is expanded to show 15-min intervals
const getVisibleTimeSlots = (schedule, calendarEvents, expandedSlots = {}) => {
  const eventTimes = new Set();
  const coveredSlots = new Set(); // Slots covered by multi-hour events
  const eventDurations = []; // Track all events with durations

  // Process calendar events - calculate duration and track covered slots
  calendarEvents.forEach(event => {
    if (event.start.dateTime) {
      const startTime = new Date(event.start.dateTime);
      const hour = startTime.getHours();
      const min = startTime.getMinutes();
      const startMinutes = hour * 60 + min;

      // Round to nearest slot for display
      const roundedMin = Math.floor(min / 15) * 15;
      const timeKey = `${hour.toString().padStart(2, '0')}:${roundedMin.toString().padStart(2, '0')}`;
      eventTimes.add(timeKey);

      // Calculate duration if end time exists
      if (event.end?.dateTime) {
        const endTime = new Date(event.end.dateTime);
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        const durationMinutes = endMinutes - startMinutes;

        if (durationMinutes > 15) { // More than 15 min may cover next slot
          eventDurations.push({ startMinutes, endMinutes, durationMinutes });
        }
      }
    }
  });

  // Also check schedule for durations (in case calendar events aren't loaded)
  Object.entries(schedule).forEach(([timeKey, task]) => {
    if (task?.durationMinutes) {
      const startMinutes = timeToMinutes(timeKey);
      const endMinutes = startMinutes + task.durationMinutes;

      if (task.durationMinutes > 15) {
        eventDurations.push({ startMinutes, endMinutes, durationMinutes: task.durationMinutes });
      }

      // Add the end time slot so it's visible after the task
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      if (endHour < 24) {
        const endTimeKey = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        eventTimes.add(endTimeKey);
      }
    }
  });

  // Add any manually scheduled task times
  Object.keys(schedule).forEach(timeKey => {
    eventTimes.add(timeKey);
  });

  // Find all slots covered by multi-hour events
  eventDurations.forEach(({ startMinutes, endMinutes }) => {
    ALL_TIME_SLOTS.forEach(slot => {
      const slotMinutes = timeToMinutes(slot.time);
      // If this slot starts after the event start but before the event ends, it's covered
      if (slotMinutes > startMinutes && slotMinutes < endMinutes) {
        coveredSlots.add(slot.time);
      }
    });
  });

  return ALL_TIME_SLOTS.filter(slot => {
    // Don't show slots that are covered by multi-hour events
    if (coveredSlots.has(slot.time)) {
      return false;
    }

    // Always show hourly slots (on the hour)
    if (slot.minute === 0) {
      return true;
    }

    // Check if this slot's parent hour is expanded
    const hourKey = `${slot.hour.toString().padStart(2, '0')}:00`;
    const granularity = expandedSlots[hourKey];

    if (granularity) {
      // Parent hour is expanded - show based on granularity
      if (granularity === 30 && slot.minute === 30) {
        return true; // Show :30 slots
      }
      if (granularity === 15) {
        return true; // Show all 15-min slots (:15, :30, :45)
      }
    }

    // Also show any slot that has a scheduled event
    return eventTimes.has(slot.time);
  });
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lifeAreas, setLifeAreas] = useState(DEFAULT_LIFE_AREAS);
  const [projects, setProjects] = useState({});
  const [schedule, setSchedule] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  // Multi-account support: store array of connected Google accounts
  const [connectedAccounts, setConnectedAccounts] = useState(() => {
    const saved = localStorage.getItem('connectedGoogleAccounts');
    return saved ? JSON.parse(saved) : [];
  });
  const [calendarConnected, setCalendarConnected] = useState(() => {
    const accounts = localStorage.getItem('connectedGoogleAccounts');
    return accounts ? JSON.parse(accounts).length > 0 : !!localStorage.getItem('googleAccessToken');
  });
  const [availableCalendars, setAvailableCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState(() => {
    const saved = localStorage.getItem('selectedCalendars');
    return saved ? JSON.parse(saved) : [];
  });
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentLifeArea, setRecentLifeArea] = useState(null);
  const [showManagement, setShowManagement] = useState(false);
  const [taskScheduleFrequency, setTaskScheduleFrequency] = useState({});
  const [expandedSlots, setExpandedSlots] = useState({});
  const [editingScheduledTask, setEditingScheduledTask] = useState(null); // { timeSlot, task }
  const [collapsedAreas, setCollapsedAreas] = useState({});
  const [collapsedProjects, setCollapsedProjects] = useState({});
  // Mobile navigation state: 'tasks', 'schedule', or 'projects'
  const [mobileActiveView, setMobileActiveView] = useState('schedule');
  // Mobile task picker state: { isOpen, timeSlot }
  const [mobileTaskPicker, setMobileTaskPicker] = useState({ isOpen: false, timeSlot: null });

  // Memoize time slots generation
  const timeSlots = useMemo(() => getVisibleTimeSlots(schedule, calendarEvents, expandedSlots), [schedule, calendarEvents, expandedSlots]);

  // Handle time slot click to expand/drill down
  const handleTimeSlotClick = React.useCallback((time) => {
    setExpandedSlots(prev => {
      const [hour, minute] = time.split(':').map(Number);
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;

      // Check if this is an hourly slot
      const isHourlySlot = minute === 0;

      if (isHourlySlot) {
        // Clicking on an hour slot
        const currentGranularity = prev[hourKey];

        if (!currentGranularity) {
          // First click: expand to 30-min intervals
          return { ...prev, [hourKey]: 30 };
        } else if (currentGranularity === 30) {
          // Second click: expand to 15-min intervals
          return { ...prev, [hourKey]: 15 };
        } else {
          // Already at 15-min, collapse it
          const newState = { ...prev };
          delete newState[hourKey];
          return newState;
        }
      } else {
        // Clicking on a sub-slot (like 6:30) - expand the parent hour to finer granularity
        const currentGranularity = prev[hourKey];

        if (currentGranularity === 30) {
          // Expand to 15-min intervals
          return { ...prev, [hourKey]: 15 };
        } else if (currentGranularity === 15) {
          // Collapse back to just hourly
          const newState = { ...prev };
          delete newState[hourKey];
          return newState;
        }
        return prev;
      }
    });
  }, []);

  // Reset expanded slots when date changes
  useEffect(() => {
    setExpandedSlots({});
  }, [selectedDate]);

  // Toggle handlers for ProjectsSidebar (accordion style - only one area open at a time)
  const toggleArea = (areaId) => {
    setCollapsedAreas(prev => {
      const isCurrentlyCollapsed = prev[areaId];
      if (isCurrentlyCollapsed) {
        // Opening this area - collapse all others
        const allCollapsed = {};
        lifeAreas.forEach(area => {
          allCollapsed[area.id] = area.id !== areaId;
        });
        return allCollapsed;
      } else {
        // Closing this area
        return { ...prev, [areaId]: true };
      }
    });
  };

  const toggleProject = (projectId) => {
    setCollapsedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  // Toast notification helper
  const showToast = React.useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Update recent projects helper
  const updateRecentProjects = React.useCallback((projectId) => {
    setRecentProjects(prev => {
      // Remove if already exists
      const filtered = prev.filter(id => id !== projectId);
      // Add to front
      return [projectId, ...filtered].slice(0, 10); // Keep max 10
    });
  }, []);

  // Collapse all areas and projects by default when they load
  useEffect(() => {
    if (lifeAreas.length > 0) {
      setCollapsedAreas(prev => {
        // Only set if not already initialized
        if (Object.keys(prev).length === 0) {
          const allCollapsed = {};
          lifeAreas.forEach(area => {
            allCollapsed[area.id] = true;
          });
          return allCollapsed;
        }
        return prev;
      });
    }
  }, [lifeAreas]);

  useEffect(() => {
    if (Object.keys(projects).length > 0) {
      setCollapsedProjects(prev => {
        // Only set if not already initialized
        if (Object.keys(prev).length === 0) {
          const allCollapsed = {};
          Object.values(projects).flat().forEach(project => {
            allCollapsed[project.id] = true;
          });
          return allCollapsed;
        }
        return prev;
      });
    }
  }, [projects]);

  // Update recent life area helper
  const updateRecentLifeArea = React.useCallback((areaId) => {
    setRecentLifeArea(areaId);
  }, []);

  // Update task frequency tracking
  const updateTaskFrequency = React.useCallback((taskId) => {
    setTaskScheduleFrequency(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || 0) + 1
    }));
  }, []);

  // Auth state listener
  useEffect(() => {
    let unsubscribeData = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        unsubscribeData = await loadUserData(user.uid);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeData) {
        unsubscribeData();
      }
    };
  }, []);

  // Load schedule when date or user changes
  useEffect(() => {
    if (!user) return;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const scheduleRef = doc(db, 'users', user.uid, 'schedules', dateKey);

    const unsubscribeSchedule = onSnapshot(scheduleRef, (doc) => {
      if (doc.exists()) {
        setSchedule(doc.data());
      } else {
        setSchedule({});
      }
    });

    // Fetch calendar events for the new date
    fetchGoogleCalendarEvents();

    return () => unsubscribeSchedule();
  }, [selectedDate, user]);


  // Load user data from Firestore
  const loadUserData = React.useCallback(async (userId) => {
    try {
      // Load life areas
      const lifeAreasRef = doc(db, 'users', userId, 'data', 'lifeAreas');
      const unsubscribeLifeAreas = onSnapshot(lifeAreasRef, (doc) => {
        if (doc.exists()) {
          setLifeAreas(doc.data().areas || DEFAULT_LIFE_AREAS);
        } else {
          // Initialize with default life areas
          setLifeAreas(DEFAULT_LIFE_AREAS);
          // Save default life areas to Firestore
          setDoc(lifeAreasRef, { areas: DEFAULT_LIFE_AREAS }).catch(err =>
            console.error('Error initializing life areas:', err)
          );
        }
      });

      // Load projects
      const projectsRef = doc(db, 'users', userId, 'data', 'projects');
      const unsubscribeProjects = onSnapshot(projectsRef, (doc) => {
        if (doc.exists()) {
          setProjects(doc.data());
        } else {
          // Initialize with empty projects for each life area
          const initialProjects = {};
          DEFAULT_LIFE_AREAS.forEach(area => {
            initialProjects[area.id] = [];
          });
          setProjects(initialProjects);
        }
      });

      // Return cleanup function
      return () => {
        unsubscribeLifeAreas();
        unsubscribeProjects();
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Failed to load your data. Please refresh the page.', 'error');
      return () => {}; // Return no-op cleanup on error
    }
  }, [showToast]);

  // Save projects to Firestore
  const saveProjects = async (updatedProjects) => {
    if (!user) return;

    try {
      const projectsRef = doc(db, 'users', user.uid, 'data', 'projects');
      await setDoc(projectsRef, updatedProjects);
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error saving projects:', error);
      showToast('Failed to save project. Please try again.', 'error');
    }
  };

  // Save schedule to Firestore
  const saveSchedule = async (updatedSchedule) => {
    if (!user) return;

    setIsSavingSchedule(true);
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const scheduleRef = doc(db, 'users', user.uid, 'schedules', dateKey);
      await setDoc(scheduleRef, updatedSchedule);
      setSchedule(updatedSchedule);
    } catch (error) {
      console.error('Error saving schedule:', error);
      showToast('Failed to save schedule. Please try again.', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Save life areas to Firestore
  const saveLifeAreas = async (updatedLifeAreas) => {
    if (!user) return;

    try {
      const lifeAreasRef = doc(db, 'users', user.uid, 'data', 'lifeAreas');
      await setDoc(lifeAreasRef, { areas: updatedLifeAreas });
      setLifeAreas(updatedLifeAreas);
    } catch (error) {
      console.error('Error saving life areas:', error);
      showToast('Failed to save life area. Please try again.', 'error');
    }
  };

  // Add new life area
  const addLifeArea = (name, color) => {
    if (!name.trim()) return;

    const newArea = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color: color || LIFE_AREA_COLORS[lifeAreas.length % LIFE_AREA_COLORS.length]
    };

    const updatedLifeAreas = [...lifeAreas, newArea];
    saveLifeAreas(updatedLifeAreas);

    // Initialize projects array for new area
    const updatedProjects = { ...projects, [newArea.id]: [] };
    saveProjects(updatedProjects);

    showToast(`Life area "${name}" created!`, 'success');
  };

  // Edit life area name or color
  const editLifeArea = (areaId, newName, newColor) => {
    const updatedLifeAreas = lifeAreas.map(area =>
      area.id === areaId
        ? { ...area, name: newName.trim(), color: newColor }
        : area
    );
    saveLifeAreas(updatedLifeAreas);
    showToast('Life area updated!', 'success');
  };

  // Delete life area
  const deleteLifeArea = (areaId) => {
    // Check if area has projects
    const areaProjects = projects[areaId] || [];
    if (areaProjects.length > 0) {
      showToast('Cannot delete life area with existing projects. Delete projects first.', 'error');
      return;
    }

    const updatedLifeAreas = lifeAreas.filter(area => area.id !== areaId);
    saveLifeAreas(updatedLifeAreas);

    // Remove from projects object
    const updatedProjects = { ...projects };
    delete updatedProjects[areaId];
    saveProjects(updatedProjects);

    showToast('Life area deleted!', 'success');
  };

  // Fetch Google Calendar events from all connected accounts
  const fetchGoogleCalendarEvents = React.useCallback(async () => {
    // Support both legacy single token and new multi-account format
    const accounts = connectedAccounts.length > 0
      ? connectedAccounts
      : localStorage.getItem('googleAccessToken')
        ? [{ email: 'primary', accessToken: localStorage.getItem('googleAccessToken'), tokenTimestamp: localStorage.getItem('googleTokenTimestamp') }]
        : [];

    // Silently skip if no accounts or user
    if (accounts.length === 0 || !user) {
      console.log('Google Calendar not connected - skipping calendar sync');
      return;
    }

    setIsLoadingCalendar(true);
    try {
      const timeMin = startOfDay(selectedDate).toISOString();
      const timeMax = endOfDay(selectedDate).toISOString();

      let allCalendars = [];
      let allEvents = [];
      const validAccounts = [];

      // Fetch calendars from each connected account
      for (const account of accounts) {
        let token = account.accessToken;

        // Check if token is expired and refresh if needed
        const tokenAge = Date.now() - (parseInt(account.tokenTimestamp) || 0);
        const isExpired = tokenAge > 50 * 60 * 1000; // 50 minutes

        if (isExpired) {
          console.log(`Token expired for ${account.email}, attempting refresh...`);
          try {
            token = await refreshGoogleToken();
            if (!token) {
              console.warn(`Token refresh failed for ${account.email}`);
              continue;
            }
            // Update the account with new token
            account.accessToken = token;
            account.tokenTimestamp = Date.now().toString();
          } catch (refreshError) {
            console.error(`Token refresh failed for ${account.email}:`, refreshError);
            continue;
          }
        }

        // Fetch calendar list for this account
        const calendarListResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (calendarListResponse.status === 401) {
          console.log(`Token unauthorized for ${account.email}, skipping...`);
          continue;
        }

        if (!calendarListResponse.ok) {
          console.error(`Failed to fetch calendars for ${account.email}`);
          continue;
        }

        const calendarList = await calendarListResponse.json();
        validAccounts.push(account);

        // Add calendars with account info
        const accountCalendars = calendarList.items.map(cal => ({
          id: cal.id,
          summary: cal.summary,
          backgroundColor: cal.backgroundColor,
          primary: cal.primary || false,
          accountEmail: account.email,
          accessToken: token
        }));
        allCalendars = [...allCalendars, ...accountCalendars];

        // Filter calendars based on selection
        const calendarsToFetch = selectedCalendars.length > 0
          ? accountCalendars.filter(cal => selectedCalendars.includes(cal.id))
          : accountCalendars;

        console.log(`Querying ${calendarsToFetch.length} calendars from ${account.email}`);

        // Fetch events from selected calendars
        const eventPromises = calendarsToFetch.map(calendar =>
          fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
            `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          )
            .then(response => response.ok ? response.json() : null)
            .then(data => {
              if (!data) return [];
              return (data.items || []).map(event => ({
                ...event,
                calendarName: calendar.summary,
                calendarColor: calendar.backgroundColor,
                accountEmail: account.email
              }));
            })
            .catch(err => {
              console.error(`Error fetching events for ${calendar.summary}:`, err);
              return [];
            })
        );

        const eventArrays = await Promise.all(eventPromises);
        allEvents = [...allEvents, ...eventArrays.flat()];
      }

      // Update connected accounts with refreshed tokens
      if (validAccounts.length > 0) {
        setConnectedAccounts(validAccounts);
        localStorage.setItem('connectedGoogleAccounts', JSON.stringify(validAccounts));
      }

      // Store available calendars for selection UI
      setAvailableCalendars(allCalendars);

      console.log(`Fetched ${allEvents.length} calendar events for ${format(selectedDate, 'yyyy-MM-dd')}`);
      setCalendarEvents(allEvents);
      setCalendarConnected(validAccounts.length > 0);

      // Add calendar events to schedule
      setSchedule(currentSchedule => {
        const updatedSchedule = { ...currentSchedule };
        let addedCount = 0;

        allEvents.forEach(event => {
          let timeKey;

          if (event.start.dateTime) {
            const eventTime = new Date(event.start.dateTime);
            const hour = eventTime.getHours();
            const min = Math.floor(eventTime.getMinutes() / 10) * 10;
            timeKey = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          } else if (event.start.date) {
            timeKey = '09:00';
          }

          let endTimeKey = null;
          let durationMinutes = null;
          if (event.end?.dateTime && event.start?.dateTime) {
            const startTime = new Date(event.start.dateTime);
            const endTime = new Date(event.end.dateTime);
            durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
            const endHour = endTime.getHours();
            const endMin = Math.floor(endTime.getMinutes() / 10) * 10;
            endTimeKey = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
          }

          if (timeKey && !updatedSchedule[timeKey]) {
            updatedSchedule[timeKey] = {
              name: event.summary,
              type: 'calendar',
              calendarName: event.calendarName,
              accountEmail: event.accountEmail,
              eventId: event.id,
              isAllDay: !!event.start.date,
              endTime: endTimeKey,
              durationMinutes: durationMinutes
            };
            addedCount++;
          }
        });

        console.log(`Added ${addedCount} out of ${allEvents.length} calendar events to schedule`);

        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const scheduleRef = doc(db, 'users', user.uid, 'schedules', dateKey);
        setDoc(scheduleRef, updatedSchedule).catch(err =>
          console.error('Error saving calendar events to schedule:', err)
        );

        return updatedSchedule;
      });

    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [selectedDate, user, selectedCalendars, connectedAccounts]);

  // Toggle calendar selection
  const toggleCalendarSelection = (calendarId) => {
    setSelectedCalendars(prev => {
      const newSelection = prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId];
      localStorage.setItem('selectedCalendars', JSON.stringify(newSelection));
      return newSelection;
    });
  };

  // Select all calendars
  const selectAllCalendars = () => {
    const allIds = availableCalendars.map(cal => cal.id);
    setSelectedCalendars(allIds);
    localStorage.setItem('selectedCalendars', JSON.stringify(allIds));
  };

  // Deselect all calendars
  const deselectAllCalendars = () => {
    setSelectedCalendars([]);
    localStorage.setItem('selectedCalendars', JSON.stringify([]));
  };

  // Add new project
  const addProject = (areaId, projectName) => {
    if (!projectName.trim()) return;

    const updatedProjects = { ...projects };
    if (!updatedProjects[areaId]) {
      updatedProjects[areaId] = [];
    }

    const newProject = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      tasks: []
    };

    updatedProjects[areaId].push(newProject);

    saveProjects(updatedProjects);
    updateRecentLifeArea(areaId);
    updateRecentProjects(newProject.id);
    showToast('Project created!', 'success');
  };

  // Edit project
  const editProject = (areaId, projectId, newName) => {
    if (!newName.trim()) return;

    const updatedProjects = { ...projects };
    const project = updatedProjects[areaId]?.find(p => p.id === projectId);

    if (project) {
      project.name = newName.trim();
      saveProjects(updatedProjects);
      showToast('Project updated!', 'success');
    }
  };

  // Delete project
  const deleteProject = (area, projectId) => {
    const updatedProjects = { ...projects };
    updatedProjects[area] = updatedProjects[area].filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
  };

  // Add task to project
  const addTask = (area, projectId, taskName, priority = 'medium', durationMinutes = 60) => {
    if (!taskName.trim()) return;

    const updatedProjects = { ...projects };
    const project = updatedProjects[area]?.find(p => p.id === projectId);

    if (project) {
      if (!project.tasks) project.tasks = [];
      project.tasks.push({
        id: crypto.randomUUID(),
        name: taskName.trim(),
        completed: false,
        priority: priority,
        durationMinutes: durationMinutes
      });
      saveProjects(updatedProjects);
      showToast('Task added!', 'success');
    }
  };

  // Edit task
  const editTask = (area, projectId, taskId, newName, priority, durationMinutes) => {
    if (!newName.trim()) return;

    const updatedProjects = { ...projects };
    const project = updatedProjects[area]?.find(p => p.id === projectId);

    if (project && project.tasks) {
      const task = project.tasks.find(t => t.id === taskId);
      if (task) {
        task.name = newName.trim();
        if (priority !== undefined) {
          task.priority = priority;
        }
        if (durationMinutes !== undefined) {
          task.durationMinutes = durationMinutes;
        }
        saveProjects(updatedProjects);
        showToast('Task updated!', 'success');
      }
    }
  };

  // Delete task
  const deleteTask = (area, projectId, taskId) => {
    const updatedProjects = { ...projects };
    const project = updatedProjects[area]?.find(p => p.id === projectId);

    if (project && project.tasks) {
      project.tasks = project.tasks.filter(t => t.id !== taskId);
      saveProjects(updatedProjects);
      showToast('Task deleted!', 'success');
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = (area, projectId, taskId) => {
    const updatedProjects = { ...projects };
    const project = updatedProjects[area]?.find(p => p.id === projectId);

    if (project && project.tasks) {
      const task = project.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        saveProjects(updatedProjects);
      }
    }
  };

  // Handle drag start for task from sidebar
  const handleDragStart = (task, projectId, projectName, area) => {
    setDraggedTask({
      ...task,
      projectId,
      projectName,
      area,
      sourceTimeSlot: null // Not from schedule
    });
  };

  // Handle drag start for scheduled task (moving within schedule)
  const handleScheduledTaskDragStart = (e, timeSlot, task) => {
    setDraggedTask({
      ...task,
      sourceTimeSlot: timeSlot // Track where it came from
    });
  };

  // Connect Google Calendar (add new account)
  const connectGoogleCalendar = async () => {
    try {
      // Use addCalendarAccount which prompts for account selection
      const result = await addCalendarAccount();
      const { token, timestamp, email: accountEmail, userChanged } = result;

      if (token) {
        // Check if this account is already connected
        const existingAccount = connectedAccounts.find(acc => acc.email === accountEmail);
        if (existingAccount) {
          // Update the existing account's token
          const updatedAccounts = connectedAccounts.map(acc =>
            acc.email === accountEmail
              ? { ...acc, accessToken: token, tokenTimestamp: timestamp }
              : acc
          );
          setConnectedAccounts(updatedAccounts);
          localStorage.setItem('connectedGoogleAccounts', JSON.stringify(updatedAccounts));
          showToast(`Reconnected ${accountEmail}!`, 'success');
        } else {
          // Add new account
          const newAccount = {
            email: accountEmail,
            accessToken: token,
            tokenTimestamp: timestamp
          };
          const updatedAccounts = [...connectedAccounts, newAccount];
          setConnectedAccounts(updatedAccounts);
          localStorage.setItem('connectedGoogleAccounts', JSON.stringify(updatedAccounts));
          showToast(`Connected ${accountEmail}!`, 'success');
        }

        setCalendarConnected(true);

        // If user selected a different Google account, they got signed into that account
        // We need to sign them out and have them sign back in with their original account
        if (userChanged) {
          showToast('Please sign in again with your main account to access your data.', 'warning');
          await signOutUser();
          return;
        }

        // Fetch calendar events immediately after connecting
        setTimeout(() => fetchGoogleCalendarEvents(), 1000);
      } else {
        showToast('Calendar access was not granted. Please try again.', 'warning');
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      showToast('Failed to connect Google Calendar. Please allow calendar access when prompted.', 'error');
    }
  };

  // Disconnect a Google account
  const disconnectGoogleAccount = (accountEmail) => {
    const updatedAccounts = connectedAccounts.filter(acc => acc.email !== accountEmail);
    setConnectedAccounts(updatedAccounts);
    localStorage.setItem('connectedGoogleAccounts', JSON.stringify(updatedAccounts));

    // Remove calendars from this account from selection
    const accountCalendarIds = availableCalendars
      .filter(cal => cal.accountEmail === accountEmail)
      .map(cal => cal.id);
    const updatedSelection = selectedCalendars.filter(id => !accountCalendarIds.includes(id));
    setSelectedCalendars(updatedSelection);
    localStorage.setItem('selectedCalendars', JSON.stringify(updatedSelection));

    // Remove calendars from available list
    setAvailableCalendars(prev => prev.filter(cal => cal.accountEmail !== accountEmail));

    if (updatedAccounts.length === 0) {
      setCalendarConnected(false);
      // Clear legacy tokens too
      localStorage.removeItem('googleAccessToken');
      localStorage.removeItem('googleTokenTimestamp');
    }

    showToast(`Disconnected ${accountEmail}`, 'success');
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop on time slot
  const handleDrop = (e, timeSlot) => {
    e.preventDefault();
    if (!draggedTask) return;

    // Don't allow dropping on the same slot
    if (draggedTask.sourceTimeSlot === timeSlot) {
      setDraggedTask(null);
      return;
    }

    // Calculate end time based on duration
    const durationMinutes = draggedTask.durationMinutes || 60;
    const [startHour, startMin] = timeSlot.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    const updatedSchedule = { ...schedule };

    // If moving from another time slot, remove from old position
    if (draggedTask.sourceTimeSlot) {
      delete updatedSchedule[draggedTask.sourceTimeSlot];
    }

    // Add to new time slot
    updatedSchedule[timeSlot] = {
      name: draggedTask.name || '',
      taskId: draggedTask.taskId || draggedTask.id || null,
      projectId: draggedTask.projectId || null,
      projectName: draggedTask.projectName || '',
      area: draggedTask.area || draggedTask.areaId || null,
      completed: draggedTask.completed || false,
      priority: draggedTask.priority || 'medium',
      durationMinutes: durationMinutes,
      endTime: endTime
    };

    saveSchedule(updatedSchedule);

    // Track recent project usage (only for new drops, not moves)
    if (draggedTask.projectId && !draggedTask.sourceTimeSlot) {
      updateRecentProjects(draggedTask.projectId);
    }

    // Track task frequency (only for new drops, not moves)
    if ((draggedTask.taskId || draggedTask.id) && !draggedTask.sourceTimeSlot) {
      updateTaskFrequency(draggedTask.taskId || draggedTask.id);
    }

    setDraggedTask(null);
  };

  // Remove task from schedule
  const removeTask = (timeSlot) => {
    const updatedSchedule = { ...schedule };
    delete updatedSchedule[timeSlot];
    saveSchedule(updatedSchedule);
  };

  // Assign calendar event to project
  const assignEventToProject = (timeSlot, projectId, area) => {
    const updatedSchedule = { ...schedule };
    if (updatedSchedule[timeSlot]) {
      updatedSchedule[timeSlot] = {
        ...updatedSchedule[timeSlot],
        projectId,
        area
      };
      saveSchedule(updatedSchedule);

      // Track recent project usage
      if (projectId) {
        updateRecentProjects(projectId);
      }
    }
  };

  // Mobile task picker handlers
  const openMobileTaskPicker = (timeSlot) => {
    setMobileTaskPicker({ isOpen: true, timeSlot });
  };

  const closeMobileTaskPicker = () => {
    setMobileTaskPicker({ isOpen: false, timeSlot: null });
  };

  const handleMobileTaskSelect = (timeSlot, task) => {
    // Calculate end time based on duration
    const durationMinutes = task.durationMinutes || 60;
    const [startHour, startMin] = timeSlot.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    const updatedSchedule = { ...schedule };
    updatedSchedule[timeSlot] = {
      name: task.name,
      taskId: task.id,
      projectId: task.projectId,
      projectName: task.projectName,
      area: task.areaId,
      completed: false,
      priority: task.priority || 'medium',
      durationMinutes: durationMinutes,
      endTime: endTime
    };

    saveSchedule(updatedSchedule);
    updateRecentProjects(task.projectId);
    updateTaskFrequency(task.id);
    showToast('Task scheduled!', 'success');
  };

  // Add custom task
  const addCustomTask = (timeSlot, taskName) => {
    if (!taskName.trim()) return;

    const updatedSchedule = { ...schedule };
    updatedSchedule[timeSlot] = {
      name: taskName.trim(),
      type: 'custom'
    };

    saveSchedule(updatedSchedule);
  };

  // Open edit modal for scheduled task
  const handleEditScheduledTask = (timeSlot, task) => {
    setEditingScheduledTask({ timeSlot, task });
  };

  // Save task edit - this day only (just updates the schedule entry)
  const handleSaveTaskThisDay = (timeSlot, updates) => {
    // Calculate new end time based on duration
    const durationMinutes = updates.durationMinutes || 60;
    const [startHour, startMin] = timeSlot.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    const updatedSchedule = { ...schedule };
    updatedSchedule[timeSlot] = {
      ...updatedSchedule[timeSlot],
      name: updates.name,
      durationMinutes: updates.durationMinutes,
      endTime: endTime
    };

    saveSchedule(updatedSchedule);
    showToast('Task updated for this day only', 'success');
  };

  // Save task edit - all future occurrences (updates the source task in projects)
  const handleSaveTaskAllFuture = (timeSlot, task, updates) => {
    // First, update the schedule entry for this day
    handleSaveTaskThisDay(timeSlot, updates);

    // Then, if this task is linked to a project, update the source task
    if (task.taskId && task.projectId && task.area) {
      const updatedProjects = { ...projects };
      const project = updatedProjects[task.area]?.find(p => p.id === task.projectId);

      if (project && project.tasks) {
        const sourceTask = project.tasks.find(t => t.id === task.taskId);
        if (sourceTask) {
          sourceTask.name = updates.name;
          sourceTask.durationMinutes = updates.durationMinutes;
          saveProjects(updatedProjects);
          showToast('Task updated for all future occurrences', 'success');
          return;
        }
      }
    }

    // If we couldn't find the source task, just show the single-day message
    showToast('Task updated for this day (source task not found)', 'info');
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setEditingScheduledTask(null);
  };

  // Sign in screen
  if (!user && !loading) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Daily Project Planner</h1>
          <p>Plan your days across life areas and stay organized</p>
          <button className="google-signin-btn" onClick={signInWithGoogle}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Main app
  return (
    <div className="app">
      <header className="header">
        <h1>Daily Project Planner</h1>
        <div className="header-right">
          <DatePicker
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
          {!calendarConnected ? (
            <button
              className="btn btn-calendar"
              onClick={connectGoogleCalendar}
              title="Connect Google Calendar"
            >
              <Calendar size={16} />
              Connect Calendar
            </button>
          ) : (
            <button
              className="btn btn-calendar-settings"
              onClick={() => setShowCalendarSelector(true)}
              title="Manage Calendars"
            >
              <Calendar size={16} />
              <Settings size={14} className="settings-icon" />
            </button>
          )}
          <div className="user-info">
            <div className="user-avatar">
              {user?.displayName?.charAt(0) || <User size={16} />}
            </div>
            <span className="user-name">{user?.displayName || user?.email}</span>
          </div>
          <button className="btn btn-secondary" onClick={signOutUser}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className={`mobile-view-wrapper ${mobileActiveView === 'tasks' ? 'mobile-active' : ''}`}>
          <TasksSidebar
            lifeAreas={lifeAreas}
            projects={projects}
            onDragStart={handleDragStart}
            taskScheduleFrequency={taskScheduleFrequency}
            onAddTask={addTask}
          />
        </div>

        <ManagementSidebar
          isOpen={showManagement}
          onClose={() => setShowManagement(false)}
          lifeAreas={lifeAreas}
          projects={projects}
          onAddLifeArea={addLifeArea}
          onEditLifeArea={editLifeArea}
          onDeleteLifeArea={deleteLifeArea}
          onAddProject={addProject}
          onEditProject={editProject}
          onDeleteProject={deleteProject}
          onAddTask={addTask}
          onEditTask={editTask}
          onDeleteTask={deleteTask}
        />

        <div className={`mobile-view-wrapper ${mobileActiveView === 'schedule' ? 'mobile-active' : ''}`}>
          <ScheduleView
            selectedDate={selectedDate}
            isLoadingCalendar={isLoadingCalendar}
            timeSlots={timeSlots}
            schedule={schedule}
            projects={projects}
            lifeAreas={lifeAreas}
            calendarEvents={calendarEvents}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onRemoveTask={removeTask}
            onAssignEvent={assignEventToProject}
            onAddCustomTask={addCustomTask}
            onEditTask={handleEditScheduledTask}
            onScheduledTaskDragStart={handleScheduledTaskDragStart}
            recentProjects={recentProjects}
            expandedSlots={expandedSlots}
            onTimeSlotClick={handleTimeSlotClick}
            onRefreshCalendar={fetchGoogleCalendarEvents}
            onMobileSlotTap={openMobileTaskPicker}
          />
        </div>

        <div className={`mobile-view-wrapper ${mobileActiveView === 'projects' ? 'mobile-active' : ''}`}>
          <ProjectsSidebar
            lifeAreas={lifeAreas}
            projects={projects}
            collapsedAreas={collapsedAreas}
            collapsedProjects={collapsedProjects}
            onToggleArea={toggleArea}
            onToggleProject={toggleProject}
            onAddProjectClick={() => setShowManagement(true)}
            onDeleteProject={deleteProject}
            onDragStart={handleDragStart}
            onAddLifeArea={addLifeArea}
            onEditLifeArea={editLifeArea}
            onDeleteLifeArea={deleteLifeArea}
            onAddTask={addTask}
            onEditTask={editTask}
            onDeleteTask={deleteTask}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <button
          className={`mobile-nav-btn ${mobileActiveView === 'tasks' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('tasks')}
        >
          <CheckSquare size={20} />
          <span>Tasks</span>
        </button>
        <button
          className={`mobile-nav-btn ${mobileActiveView === 'schedule' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('schedule')}
        >
          <CalendarDays size={20} />
          <span>Schedule</span>
        </button>
        <button
          className={`mobile-nav-btn ${mobileActiveView === 'projects' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('projects')}
        >
          <FolderKanban size={20} />
          <span>Projects</span>
        </button>
      </nav>

      <EditScheduledTaskModal
        isOpen={!!editingScheduledTask}
        task={editingScheduledTask?.task}
        timeSlot={editingScheduledTask?.timeSlot}
        onClose={handleCloseEditModal}
        onSaveThisDay={handleSaveTaskThisDay}
        onSaveAllFuture={handleSaveTaskAllFuture}
        isProjectTask={!!(editingScheduledTask?.task?.taskId && editingScheduledTask?.task?.projectId)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <CalendarSelector
        isOpen={showCalendarSelector}
        onClose={() => setShowCalendarSelector(false)}
        availableCalendars={availableCalendars}
        selectedCalendars={selectedCalendars}
        onToggleCalendar={toggleCalendarSelection}
        onSelectAll={selectAllCalendars}
        onDeselectAll={deselectAllCalendars}
        onRefresh={fetchGoogleCalendarEvents}
        connectedAccounts={connectedAccounts}
        onAddAccount={connectGoogleCalendar}
        onDisconnectAccount={disconnectGoogleAccount}
      />

      <MobileTaskPicker
        isOpen={mobileTaskPicker.isOpen}
        onClose={closeMobileTaskPicker}
        timeSlot={mobileTaskPicker.timeSlot}
        lifeAreas={lifeAreas}
        projects={projects}
        onSelectTask={handleMobileTaskSelect}
        onAddCustomTask={(timeSlot, taskName) => {
          addCustomTask(timeSlot, taskName);
          closeMobileTaskPicker();
        }}
      />
    </div>
  );
}

export default App;

// src/App.js
import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, signOutUser, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  deleteDoc,
  updateDoc 
} from 'firebase/firestore';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  LogOut,
  User
} from 'lucide-react';
import './App.css';

// Life area configurations with colors
const LIFE_AREAS = {
  education: { name: 'Education', color: '#2196f3' },
  health: { name: 'Health', color: '#4caf50' },
  family: { name: 'Family', color: '#ff9800' },
  friends: { name: 'Friends', color: '#9c27b0' },
  money: { name: 'Money', color: '#009688' },
  relationship: { name: 'Relationship', color: '#e91e63' }
};

// Generate time slots from 6am to 11pm
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 23; hour++) {
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      hour: hour
    });
  }
  return slots;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState({});
  const [schedule, setSchedule] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectArea, setNewProjectArea] = useState('education');
  const [collapsedAreas, setCollapsedAreas] = useState({});
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [draggedProject, setDraggedProject] = useState(null);

  const timeSlots = generateTimeSlots();

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        loadUserData(user.uid);
        fetchGoogleCalendarEvents();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load user data from Firestore
  const loadUserData = async (userId) => {
    try {
      // Load projects
      const projectsRef = doc(db, 'users', userId, 'data', 'projects');
      const unsubscribeProjects = onSnapshot(projectsRef, (doc) => {
        if (doc.exists()) {
          setProjects(doc.data());
        } else {
          // Initialize with empty projects
          const initialProjects = {};
          Object.keys(LIFE_AREAS).forEach(area => {
            initialProjects[area] = [];
          });
          setProjects(initialProjects);
        }
      });

      // Load schedule for selected date
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const scheduleRef = doc(db, 'users', userId, 'schedules', dateKey);
      const unsubscribeSchedule = onSnapshot(scheduleRef, (doc) => {
        if (doc.exists()) {
          setSchedule(doc.data());
        } else {
          setSchedule({});
        }
      });

      return () => {
        unsubscribeProjects();
        unsubscribeSchedule();
      };
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Save projects to Firestore
  const saveProjects = async (updatedProjects) => {
    if (!user) return;
    
    try {
      const projectsRef = doc(db, 'users', user.uid, 'data', 'projects');
      await setDoc(projectsRef, updatedProjects);
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  };

  // Save schedule to Firestore
  const saveSchedule = async (updatedSchedule) => {
    if (!user) return;
    
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const scheduleRef = doc(db, 'users', user.uid, 'schedules', dateKey);
      await setDoc(scheduleRef, updatedSchedule);
      setSchedule(updatedSchedule);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  // Fetch Google Calendar events
  const fetchGoogleCalendarEvents = async () => {
    const token = localStorage.getItem('googleAccessToken');
    if (!token) return;

    try {
      const timeMin = startOfDay(selectedDate).toISOString();
      const timeMax = endOfDay(selectedDate).toISOString();
      
      // First, get list of calendars
      const calendarListResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!calendarListResponse.ok) {
        console.error('Failed to fetch calendar list');
        return;
      }
      
      const calendarList = await calendarListResponse.json();
      const allEvents = [];
      
      // Fetch events from each calendar
      for (const calendar of calendarList.items) {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
          `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const eventsWithCalendar = (data.items || []).map(event => ({
            ...event,
            calendarName: calendar.summary,
            calendarColor: calendar.backgroundColor
          }));
          allEvents.push(...eventsWithCalendar);
        }
      }
      
      setCalendarEvents(allEvents);
      
      // Add calendar events to schedule
      const updatedSchedule = { ...schedule };
      allEvents.forEach(event => {
        if (event.start.dateTime) {
          const eventTime = new Date(event.start.dateTime);
          const hour = eventTime.getHours();
          const timeKey = `${hour.toString().padStart(2, '0')}:00`;
          
          if (!updatedSchedule[timeKey]) {
            updatedSchedule[timeKey] = {
              name: event.summary,
              type: 'calendar',
              calendarName: event.calendarName,
              eventId: event.id
            };
          }
        }
      });
      
      saveSchedule(updatedSchedule);
      
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  // Add new project
  const addProject = () => {
    if (!newProjectName.trim()) return;
    
    const updatedProjects = { ...projects };
    if (!updatedProjects[newProjectArea]) {
      updatedProjects[newProjectArea] = [];
    }
    
    updatedProjects[newProjectArea].push({
      id: Date.now().toString(),
      name: newProjectName.trim()
    });
    
    saveProjects(updatedProjects);
    setNewProjectName('');
    setShowAddProject(false);
  };

  // Delete project
  const deleteProject = (area, projectId) => {
    const updatedProjects = { ...projects };
    updatedProjects[area] = updatedProjects[area].filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
  };

  // Toggle life area collapse
  const toggleArea = (area) => {
    setCollapsedAreas(prev => ({
      ...prev,
      [area]: !prev[area]
    }));
  };

  // Handle drag start
  const handleDragStart = (project, area) => {
    setDraggedProject({ ...project, area });
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop on time slot
  const handleDrop = (e, timeSlot) => {
    e.preventDefault();
    if (!draggedProject) return;

    const updatedSchedule = { ...schedule };
    updatedSchedule[timeSlot] = {
      name: draggedProject.name,
      projectId: draggedProject.id,
      area: draggedProject.area
    };
    
    saveSchedule(updatedSchedule);
    setDraggedProject(null);
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
    }
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
          <div className="date-display">
            Planning for: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
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
        {/* Projects Sidebar */}
        <aside className="projects-sidebar">
          <div className="sidebar-header">
            <h2>Projects</h2>
            <button 
              className="add-project-btn" 
              onClick={() => setShowAddProject(true)}
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {Object.entries(LIFE_AREAS).map(([key, area]) => (
            <div key={key} className="life-area">
              <div 
                className="life-area-header"
                onClick={() => toggleArea(key)}
              >
                {collapsedAreas[key] ? 
                  <ChevronRight size={16} /> : 
                  <ChevronDown size={16} />
                }
                <div 
                  className="life-area-dot" 
                  style={{ backgroundColor: area.color }}
                />
                <span className="life-area-name">{area.name}</span>
                <span className="project-count">
                  {projects[key]?.length || 0}
                </span>
              </div>

              {!collapsedAreas[key] && (
                <div className="projects-list">
                  {projects[key]?.length > 0 ? (
                    projects[key].map(project => (
                      <div 
                        key={project.id}
                        className="project-item"
                        draggable
                        onDragStart={() => handleDragStart(project, key)}
                      >
                        <span className="project-name">{project.name}</span>
                        <button 
                          className="delete-project-btn"
                          onClick={() => deleteProject(key, project.id)}
                        >
                          <Trash2 size={14} />
                        </button>
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
        </aside>

        {/* Schedule Area */}
        <div className="schedule-area">
          <div className="schedule-header">
            <h2 className="schedule-title">Tomorrow's Schedule</h2>
            <div className="schedule-date">
              <Calendar size={16} />
              {format(selectedDate, 'MMMM d, yyyy')}
            </div>
          </div>

          <div className="time-blocks">
            {timeSlots.map(slot => {
              const task = schedule[slot.time];
              const isCalendarEvent = task?.type === 'calendar';
              
              return (
                <div key={slot.time} className="time-block">
                  <div className="time-label">{slot.time}</div>
                  <div 
                    className={`time-slot ${task ? 'has-task' : ''} ${task?.area ? task.area : ''}`}
                    style={task?.area ? { borderLeftColor: LIFE_AREAS[task.area]?.color } : {}}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slot.time)}
                  >
                    {task ? (
                      <div className="task-item">
                        <span className="task-name">{task.name}</span>
                        {task.area && (
                          <span className="task-project">
                            {LIFE_AREAS[task.area]?.name}
                          </span>
                        )}
                        {isCalendarEvent && (
                          <>
                            <span className="task-type">📅 {task.calendarName}</span>
                            {!task.area && (
                              <select 
                                className="form-select"
                                style={{ width: '120px', height: '28px', fontSize: '0.8rem' }}
                                onChange={(e) => {
                                  const [projectId, area] = e.target.value.split('|');
                                  if (projectId && area) {
                                    assignEventToProject(slot.time, projectId, area);
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="">Assign to...</option>
                                {Object.entries(projects).map(([area, areaProjects]) => 
                                  areaProjects.map(project => (
                                    <option key={project.id} value={`${project.id}|${area}`}>
                                      {project.name} ({LIFE_AREAS[area].name})
                                    </option>
                                  ))
                                )}
                              </select>
                            )}
                          </>
                        )}
                        {!isCalendarEvent && (
                          <button 
                            className="remove-task-btn"
                            onClick={() => removeTask(slot.time)}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <input 
                        className="add-task-input"
                        placeholder="Click to add task or drag a project here..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addCustomTask(slot.time, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Project</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  className="form-input"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Life Area</label>
                <select 
                  className="form-select"
                  value={newProjectArea}
                  onChange={(e) => setNewProjectArea(e.target.value)}
                >
                  {Object.entries(LIFE_AREAS).map(([key, area]) => (
                    <option key={key} value={key}>{area.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowAddProject(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={addProject}
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

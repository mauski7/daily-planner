# Daily Project Planner

A browser-based daily planning tool that helps you organize your time across 6 life areas, with Google Calendar integration and cross-device sync.

## Features

✅ **6 Life Areas**: Education, Health, Family, Friends, Money, Relationship
✅ **Project Management**: Organize projects under each life area  
✅ **Time-Blocked Schedule**: Plan your day hour by hour (6am-11pm)
✅ **Google Calendar Integration**: Auto-import events from all your calendars
✅ **Cross-Device Sync**: Access on laptop and mobile with same data
✅ **Drag & Drop**: Easy task scheduling
✅ **Visual Organization**: Color-coded life areas
✅ **Mobile Responsive**: Works perfectly on phones and tablets

## Quick Start

1. **Setup Firebase** (10 min)
2. **Configure Google Calendar API** (10 min)  
3. **Install & Run** (5 min)
4. **Deploy** (10 min)

See `SETUP_GUIDE.md` for detailed instructions.

## Technology Stack

- **Frontend**: React.js
- **Database**: Firebase Firestore  
- **Authentication**: Firebase Auth (Google Sign-in)
- **Calendar**: Google Calendar API
- **Hosting**: Vercel/Netlify/Firebase (your choice)

## Project Structure

```
daily-planner/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.js             # Main application logic
│   ├── App.css            # Styles
│   ├── firebase.js        # Firebase configuration
│   └── index.js           # React entry point
├── package.json           # Dependencies
├── README.md             # This file
└── SETUP_GUIDE.md        # Detailed setup instructions
```

## How It Works

1. **Sign in** with your Google account
2. **Add projects** under different life areas
3. **Plan tomorrow** by dragging projects to time slots
4. **Calendar events** appear automatically
5. **Assign events** to projects to track time allocation
6. **Access anywhere** - data syncs across devices

## Requirements

- Google account
- Node.js (for local development)
- Modern web browser

## License

This project is for personal use. Feel free to customize for your needs.

## Support

Check `SETUP_GUIDE.md` for troubleshooting tips and detailed setup instructions.

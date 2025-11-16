# Daily Project Planner - Setup Guide

## Overview
This is your personal daily planning tool that syncs across devices, integrates with Google Calendar, and helps you organize tasks across 6 life areas.

## Prerequisites
- A Google account
- Node.js installed on your computer (download from nodejs.org if needed)
- A web browser (Chrome recommended)

## Step-by-Step Setup

### 1. Firebase Setup (10 minutes)

#### Create Firebase Project:
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Name it "daily-project-planner"
4. Disable Google Analytics (not needed)
5. Click "Create Project"

#### Enable Authentication:
1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Sign-in method" tab
4. Click "Google" provider
5. Toggle "Enable" switch
6. Add your email as "Project support email"
7. Click "Save"

#### Enable Firestore Database:
1. Click "Firestore Database" in left sidebar
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your preferred location (closest to you)
5. Click "Enable"

#### Update Security Rules:
1. In Firestore, click "Rules" tab
2. Replace the rules with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. Click "Publish"

#### Get Firebase Configuration:
1. Click gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps" section
3. Click "</>" (Web) icon
4. Register app with name "daily-planner-web"
5. Copy the configuration object that appears

### 2. Google Calendar API Setup (10 minutes)

#### Enable Calendar API:
1. Go to https://console.cloud.google.com/
2. Select your Firebase project from dropdown (or create new)
3. Click "≡" menu → "APIs & Services" → "Library"
4. Search for "Google Calendar API"
5. Click on it and click "ENABLE"

#### Configure OAuth Consent:
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Click "CREATE"
4. Fill in:
   - App name: "Daily Project Planner"
   - User support email: Your email
   - Developer contact: Your email
5. Click "SAVE AND CONTINUE"
6. On Scopes page, click "ADD OR REMOVE SCOPES"
7. Search and select:
   - `.../auth/calendar.readonly`
   - `.../auth/calendar.events.readonly`
8. Click "UPDATE" then "SAVE AND CONTINUE"
9. Add your email as a test user
10. Click "SAVE AND CONTINUE"

#### Update Authorized Domains:
1. Go back to Firebase Console
2. Authentication → Settings → Authorized domains
3. Your Firebase domain should already be there
4. If deploying to Vercel/Netlify later, add those domains

### 3. Configure the Application (5 minutes)

1. Open the project folder in a text editor
2. Edit `src/firebase.js`
3. Replace the placeholder config with your Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Install and Run Locally (5 minutes)

1. Open terminal/command prompt
2. Navigate to the project folder:
```bash
cd daily-planner
```
3. Install dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm start
```
5. Browser should open to http://localhost:3000
6. Sign in with your Google account
7. Allow calendar permissions when prompted

### 5. Deploy to Production (10 minutes)

#### Option A: Deploy to Vercel (Recommended - Free)
1. Go to https://vercel.com/
2. Sign up with GitHub/GitLab/Bitbucket
3. Click "Add New" → "Project"
4. Import from Git or upload folder
5. Vercel auto-detects React settings
6. Click "Deploy"
7. Get your URL like: https://daily-planner.vercel.app

#### Option B: Deploy to Netlify (Free)
1. Build the app first:
```bash
npm run build
```
2. Go to https://app.netlify.com/
3. Drag the `build` folder to the deployment area
4. Get your URL

#### Option C: Deploy to Firebase Hosting (Free)
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```
2. Initialize hosting:
```bash
firebase init hosting
```
3. Choose your project
4. Set public directory as `build`
5. Configure as single-page app: Yes
6. Build and deploy:
```bash
npm run build
firebase deploy
```

### 6. Update Authorized Redirect URIs

After deployment, add your production URL to Google OAuth:
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Add your production URLs to "Authorized JavaScript origins":
   - https://your-app.vercel.app
   - https://your-app.netlify.app
   - https://your-project.web.app (if using Firebase hosting)
5. Save changes

## Using the Application

### Daily Workflow:
1. **Evening Planning**: Open the app each evening
2. **View Calendar**: Your Google Calendar events appear automatically
3. **Assign Events**: Click dropdown on calendar events to assign to projects
4. **Add Tasks**: 
   - Drag projects to time slots
   - Or type directly in empty slots
5. **Track Progress**: Color coding shows time per life area

### Features:
- **Projects**: Click "+ Add" to create projects under each life area
- **Drag & Drop**: Drag projects onto time slots
- **Calendar Integration**: Events sync from all your Google calendars
- **Mobile Access**: Works on phone and tablet browsers
- **Auto-sync**: Changes sync across all your devices instantly

### Mobile Usage:
- Add to home screen for app-like experience:
  - iPhone: Safari → Share → Add to Home Screen
  - Android: Chrome → Menu → Add to Home Screen

## Troubleshooting

### "Permission denied" error:
- Check Firestore rules are set correctly
- Ensure you're logged in

### Calendar events not showing:
- Re-authenticate by signing out and back in
- Check Calendar API is enabled in Google Cloud Console
- Verify OAuth scopes include calendar permissions

### Can't sign in:
- Check authorized domains in Firebase
- Ensure Google provider is enabled
- Clear browser cache and cookies

### Data not syncing:
- Check internet connection
- Verify Firestore is initialized
- Look for errors in browser console (F12)

## Daily Usage Tips

1. **Color Legend**:
   - Blue: Education
   - Green: Health  
   - Orange: Family
   - Purple: Friends
   - Teal: Money
   - Pink: Relationship

2. **Quick Entry**: Press Enter after typing in a time slot to save

3. **Calendar Events**: Assign to projects to track time allocation

4. **Mobile**: Works best in Chrome/Safari on mobile

## Support

For issues:
1. Check browser console for errors (F12 → Console)
2. Verify all setup steps were completed
3. Try signing out and back in
4. Clear browser cache

## Security Notes
- Your data is private and stored in your personal Firebase account
- Only you can access your data (via Google sign-in)
- Calendar access is read-only
- No data is shared with third parties

---

Your Daily Project Planner is now ready! Sign in and start planning your perfect days.

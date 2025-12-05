# Daily Project Planner - Setup Guide

## Environment Variables Setup

This application uses environment variables to store sensitive Firebase configuration. Follow these steps to set up your environment:

### 1. Create Environment File

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon) > General
4. Scroll down to "Your apps" section
5. If you haven't added a web app, click the web icon (`</>`) to add one
6. Copy the configuration values

### 3. Update .env File

Open the `.env` file and replace the placeholder values with your actual Firebase credentials:

```
REACT_APP_FIREBASE_API_KEY=your-actual-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 4. Enable Google Calendar API

To use Google Calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Enable the Google Calendar API
4. No additional environment variables needed - OAuth handled by Firebase

### 5. Firestore Security Rules

Make sure to set up Firestore security rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Start the Application

```bash
npm install
npm start
```

## Security Notes

- **Never commit the `.env` file** to version control (it's already in `.gitignore`)
- **Keep your API keys secure** - they should never be shared publicly
- **Use Firestore security rules** to ensure users can only access their own data
- **Consider using Firebase App Check** for production deployment to prevent API abuse

## Troubleshooting

### Environment variables not loading

- Make sure the file is named exactly `.env` (not `.env.txt`)
- Restart the development server after changing `.env`
- Verify all variable names start with `REACT_APP_`

### Firebase authentication errors

- Check that Google Sign-In is enabled in Firebase Console > Authentication > Sign-in method
- Verify the authorized domains include your deployment domain

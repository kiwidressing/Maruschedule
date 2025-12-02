# ⚡ Google Login - Quick Start (3 Minutes)

## 🎯 What You Need to Do

Just **3 simple steps** to add Google login!

---

## Step 1: Firebase Console (2 minutes)

### A. Create Project
```
1. Go to: https://console.firebase.google.com
2. Click "Add project"
3. Name: shift-scheduler
4. Disable Google Analytics
5. Create
```

### B. Enable Google Login
```
1. Left sidebar → Authentication → Get started
2. Sign-in method tab
3. Click "Google"
4. Toggle Enable
5. Save
```

### C. Add Web App
```
1. Project Overview → Settings (gear icon)
2. Scroll down → Click Web icon (</>)
3. Nickname: shift-scheduler-web
4. Register app
5. COPY the config code!
```

### D. Add Your Domain
```
1. Authentication → Settings → Authorized domains
2. Add domain → your-project.pages.dev
3. Add
```

---

## Step 2: Update firebase-config.js (30 seconds)

Open `js/firebase-config.js` and replace:

```javascript
// REPLACE THIS:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// WITH YOUR COPIED CONFIG FROM FIREBASE CONSOLE
```

**Example:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyABC123...",
  authDomain: "shift-scheduler-abc.firebaseapp.com",
  projectId: "shift-scheduler-abc",
  storageBucket: "shift-scheduler-abc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 3: Deploy (30 seconds)

### Cloudflare Pages:
```
1. Upload updated js/firebase-config.js
2. Or commit to GitHub (auto-deploys)
3. Wait 1-2 minutes
```

### Test:
```
1. Open your site
2. Click "Continue with Google"
3. Select Google account
4. Done! 🎉
```

---

## ✅ What's Changed?

### UI Changes:
- ✅ "Continue with Google" button on login page
- ✅ "Sign up with Google" button on register page
- ✅ Google logo and styling

### Features:
- ✅ One-click Google login
- ✅ Auto account creation
- ✅ No password needed
- ✅ Profile picture from Google
- ✅ Works on mobile/iPad

---

## 🔍 Files Modified

```
✏️  index.html                 (Added Google buttons)
✏️  css/style.css             (Added Google button styles)
✏️  js/auth.js                (Added Google login logic)
🆕  js/firebase-config.js     (New - Firebase settings)
📄  FIREBASE_SETUP.md         (Full setup guide)
```

---

## 📱 iPad Users

Works perfectly on iPad Safari!

**Add to home screen:**
1. Open site in Safari
2. Share button → Add to Home Screen
3. Use like a native app!

---

## 🆘 Quick Troubleshooting

### "Firebase is not configured"
→ Update js/firebase-config.js with your real config

### "Unauthorized domain"
→ Add your domain in Firebase Console → Authentication → Authorized domains

### Popup blocked
→ Allow popups for your site

---

## 🎯 That's It!

**Total time**: 3 minutes  
**Difficulty**: Easy  
**Cost**: Free

Your app now has Google login! 🎉

---

## 📞 Need Detailed Guide?

See **FIREBASE_SETUP.md** for:
- Screenshots
- Detailed explanations
- Advanced customization
- Troubleshooting

---

**Quick Start Guide**  
**Version**: 2.1  
**Date**: 2025-01-01

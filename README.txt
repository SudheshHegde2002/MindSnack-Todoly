Todoly - ReadME.

---

HOW TO INSTALL (Android)

1. Download the APK file
2. Go to Settings > Security on your phone
3. Turn on "Install from Unknown Sources" or "Install Unknown Apps"
4. Find the APK in your downloads and tap it to install
5. Open Todoly and sign up with email or Google

First time using the app:
- Sign up with email or Google(NOTE: Authentication from google works only once(new user), as clerk is in Development mode,
 it does not allow re-logins from google if user already exists in Clerk's user database.)
- Create some groups like "Work", "Personal", "Shopping"
- Add tasks to those groups
- Everything saves locally first, syncs to cloud when you're online

---

TECH STACK


Frontend Framework
- React Native - Cross-platform mobile app development
- Expo - Build and deployment tooling
- TypeScript - Type-safe JavaScript
- Expo Router - File-based navigation

UI/UX
- React Native Components - Native UI components
- React Native Reanimated - Smooth animations
- Material Icons - Icon library

 Authentication
- Clerk - User authentication and management
  - Email/Password authentication
  - Google OAuth integration

 Backend & Database
- Supabase - Backend as a Service 
- expo-sqlite - Local SQLite database for offline storage

 State Management & Hooks
- Custom React Hooks:
  - `useGroups` - Group management
  - `useTodos` - Todo management
  - `useAuth` (Clerk) - Authentication state

---
Completed Requrements stated in the assignement:
Core Features 
Additional Required Feature: Task Groups + Automatic Sorting
Bonus Local offline caching, Animations for list items, Sorting or filtering TODOs
Offline Mode + Sync

Further Improvements:
- Adding more micro animations and haptic feedback
- Dark Mode
- Adding more features (collabration, Reminders, Notifications etc)

Doubts?
Should I had to switch to production mode in clerk? I tried but production mode requires a valid Domain, which costed to purchase,
so choose to keep it in the Dev Mode.

This is version 1.0.0

# Todoly: App Documentation

---

## Overview

Todoly is a React Native (Expo) app for todo/task management. It features user authentication (Google and Email via Clerk), grouping of todos, offline-first data handling, and automatic cloud synchronization with Supabase.

---
NOTE: Authentication from google works only once(new user), as clerk is in Development mode, it does not allow re-logins from google if user already exists in Clerk's user database.

## 1. Dependencies
- Clerk (auth/session): `@clerk/clerk-expo`
- Supabase (backend): `@supabase/supabase-js`
- Local storage: `expo-sqlite`
- Navigation: `expo-router`, `react-navigation`
- UI: `react-native`, `@expo/vector-icons`, etc.


## 2. App Entry, Navigation & Layout
- **App Entry Point:** `app/_layout.tsx` wraps the app in `ClerkProvider` for authentication and calls `initDatabase()` to initialize the local SQLite DB.
- **App Pages:**
  - Main: `index.tsx`, `all-tasks.tsx`, `profile.tsx`, `group/[id].tsx`
  - Auth: `welcome.tsx`, `sign-in.tsx`, `sign-up.tsx`, including verification and OAuth.
  - Modals: Add/Edit Group, Add/Edit Todo, Rename Group, Settings modal, all as rich React Native/Expo components.
- **Navigation:** Relies on `expo-router` with file-based routing structure and tab stacks as organized in `(main)/_layout.tsx`.
- **Styling:** Managed with custom StyleSheets files.

---

## 3. Authentication
- **Provider:** Uses `@clerk/clerk-expo` and wraps the whole app for session state and route guarding.
- **Methods:**
  - Email/password sign-up/in, with verification code for new users.
  - Google OAuth sign-in/sign-up via Clerk + Expo WebBrowser.
  - Sign out is confirmed by a dialog before logging the user out.
- **Flow:** Utility functions in `app/utils/auth_utils.ts` standardize error handling and status for reuse in all auth screens.

---

## 4. Data Layer: Local (SQLite) and Remote (Supabase)
### 4.1 Local Database (`services/database.ts`)
- Uses Expo SQLite as a persistent cache for offline operation.
- Key tables: `todos`, `groups`, plus sync queues for both.
- Migration support ensures columns (like group_id) are always present.

### 4.2 Remote Backend (`services/supabase.ts`)
- Centralized on Supabase for real-time cloud storage.
- Table structure mirrors local DB: `groups`, `TodoTable`.

### 4.3 Service Layer
- **groupService.ts:**
  - Add, rename, delete groups; resolves temp IDs and syncs with Supabase using queues for offline changes.
  - Ensures todos referencing groups update if group IDs change upon sync.
- **todoService.ts:**
  - Add/edit/delete/toggle todos both offline and on Supabase.
  - Listens for group syncs so todo group refs stay in sync.
  - Cleans up queued sync actions, including orphans, and handles conflict resolution.
- Both services react to connectivity changes and flush their queues on reconnect.

---

## 5. Data Access Layer: React Hooks
- **useGroups.ts:**
  - Loads and subscribes to groups, exposes `groups`, `addGroup`, `renameGroup`, `deleteGroup`.
- **useTodos.ts:**
  - Loads and subscribes to todos, exposes `todos`, `addTodo`, `toggleComplete`, `deleteTodo`, `deleteTodos`, and network status (`isOnline`).
- Both poll underlying services at intervals and immediately reflect remote changes triggered elsewhere or by background syncs.

---

## 6. UI Components
- **Modals:** All modal dialogs have their own component for Add Group, Add Todo, Rename Group, with proper accessibility.
- **TodoItem/GroupItem:** Handles gestures, bulk selection, marking complete, and delete confirmations.
- **Feedback Components:** `OfflineIndicator` shows network state, dialogs alert about dangerous or duplicate actions.

---

## 7. Features
- **Bulk Actions:** Select and delete multiple todos or groups via long-press.
- **Filters & Sorting:** Tasks filtered by completion status and group; new/old order toggling.
- **Cloud Sync:** Red badges/tags show when items are unsynced or pending network.
- **Confirmation Dialogs:** For sign-out, deletes, and duplicates.

---

## 8. Robustness
- **All user-facing errors and conflicts are surfaced:** Duplicate group names, incomplete authentication, sync problems, etc.
- **Offline changes are always queued and retried.**
- **Temp IDs resolve without breaking relationships** (e.g., new groups/todos created offline are mapped to real cloud IDs at sync time, and references are updated locally accordingly).
- **Deletes properly synchronized and never duplicated.**

---


## 9. Running & Debugging
- `npm install` to get dependencies.
- `npx expo start` to run the app (device or emulator).
- Use Expo Go + QR for device testing.

---

## 10. Key Files & Onboarding Path
- `app/_layout.tsx`: App and navigation entry point
- `services/database.ts`: SQLite data schema, low-level local data API
- `services/groupService.ts`, `todoService.ts`: Main app logic for data
- `hooks/useGroups.ts` / `hooks/useTodos.ts`: Data hooks for screens
- Modals in `app/(main)/components/` for UI/UX coding standards

---

## 11. Data Flow (Quick Reference)
```
User Action (UI)
  ↓
React Hook (useGroups/useTodos)
  ↓
Service (groupService/todoService)
  ↓
Local DB (immediate, always)
  ↓
Sync Queue (if offline)
  ↓
Supabase (when online)
```


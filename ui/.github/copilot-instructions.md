# AI Coding Agent Instructions for Dream Studio UI

## Project Overview

**Dream Studio** is a Next.js 15 + React 19 design management system for interior design services (Arabic/English bilingual). Manages leads, contracts, bookings, design images, and admin dashboards with role-based access (Admin, Accountant, Designer, etc.).

## Architecture Essentials

### Core Tech Stack

- **Framework**: Next.js 15.5.3 (App Router, Turbopack)
- **UI**: Material-UI v7 + Emotion (CSS-in-JS)
- **Forms**: React Hook Form + custom validation
- **Data Fetching**: Client-side fetch with context providers
- **Internationalization**: Bilingual (Arabic/English) via `useLanguage` hook
- **RTL Support**: `stylis-plugin-rtl` for Arabic

### Path Alias

- Use `@/` prefix for all imports: `@/app/helpers/colors.js` not `../../helpers/colors.js`
- Configured in `jsconfig.json`

## Data Flow & API Patterns

### Fetch Architecture

All API calls use **fetch with credentials**:

```javascript
fetch(`${process.env.NEXT_PUBLIC_URL}/${endpoint}`, {
  credentials: "include", // Required for auth cookies
  headers: { "Content-Type": "application/json" },
});
```

### Standard Response Format

API responses follow this structure:

```javascript
{
  status: 200,
  data: [],           // Array or single object
  totalPages: 1,      // From pagination
  total: 5,           // Total records
  extraData: null,    // Optional additional context
  message: "Success"
}
```

### Key Data Fetching Patterns

**1. Custom Hook Pattern** (`src/app/helpers/hooks/useDataFetcher.js`):

- Manages pagination, filtering, sorting, search in one hook
- Returns: `{ data, loading, setData, page, setPage, limit, filters, setFilters, search, setSearch, sort, setSort, totalPages, error, render, setRender }`
- Automatically refetches on dependency changes

**2. Direct Function Pattern** (`src/app/helpers/functions/getData.js`):

- Used in modals/forms when useDataFetcher overkill
- Handles: page, limit, filters, search, sort, extras in URL params

**3. Request Submission** (`src/app/helpers/functions/handleSubmit.js`):

- Wraps fetch + toast notifications (Success/Failed components)
- Supports FormData for file uploads
- Returns response with status code

## Context Providers (in `src/app/providers/`)

### AuthProvider

- Provides: `AuthContext` → `{ user, isLoggedIn, validatingAuth }`
- Validates session via `/auth/status` endpoint on mount
- Fallback: checks localStorage for `role` + `userId`

### MUIContext

- Provides Material-UI theme with custom shadows
- Colors from `@/app/helpers/colors.js`
- Arabic font: Noto Kufi Arabic

### ToastLoadingProvider

- Provides: `{ setLoading }` for global loading state
- Used by `handleRequestSubmit` for toast notifications

### LanguageProvider + LanguageSwitcherProvider

- Manages `useLanguage()` hook data
- Stores language preference

## Component Patterns

### Admin Data Table (`src/app/UiComponents/DataViewer/AdminTable.jsx`)

- Displays tabular data with pagination, edit/delete modals
- Props: `{ data, columns, page, setPage, limit, totalPages, onDelete, onEdit, href }`
- Handles document rendering (images, PDFs)
- Edit/Delete triggered via `EditModal` and `DeleteModal`

### Modal Components

- **EditModal**: Form with pre-filled values, checks for changes if needed
- **DeleteModal**: Confirmation with optional dependencies
- Props include: `inputs[]` (field definitions), `handleAfterEdit`, `handleBeforeSubmit`

### Form Components (`src/app/UiComponents/formComponents/`)

- **MainForm**: Renders dynamic fields via `inputs` array
- **AuthForm**: Login/signup specialized form
- Fields support: text, select, file, date, phone (via `mui-tel-input`)
- React Hook Form integration with validation rules

### DataViewer Submodules

Each feature has dedicated folder: `accountant/`, `contracts/`, `dashbaord/`, `leads/`, `meeting/`, `image-session/`, etc.

- Typically contain feature-specific AdminTable wrappers
- Example: `leads/` folder contains `LeadsTable.jsx` with leads-specific columns

## Conventions & Best Practices

### File Naming

- Components: `PascalCase.jsx` (e.g., `EditModal.jsx`)
- Utilities/hooks: `camelCase.js` (e.g., `getData.js`, `useDataFetcher.js`)
- Data/constants: `camelCase.js` (e.g., `colors.js`, `constants.js`)

### Client vs Server

- Prepend `"use client"` for ALL components using hooks, context, event handlers
- Server components: layout.js, static pages only

### Status Code Handling

- **200**: Success (always check `res.status === 200`)
- **Non-200**: Check `res.message` for error details
- Toast notifications auto-display errors via `Failed()` component

### Bilingual Content

- Use `useLanguage()` hook to fetch language data
- Language preference stored in context
- RTL handled automatically by Emotion/stylis-plugin-rtl

### File Upload

- Use `MultiFileInput` or `SimpleFileInput` components
- Submitted via FormData (not JSON)
- `handleRequestSubmit(data, setLoading, path, isFileUpload=true)`

## Build & Development

### Scripts

```bash
npm run dev        # Start with Turbopack
npm run build      # Build for production
npm start          # Run production server
npm run lint       # ESLint next config
```

### Environment Variables

- `NEXT_PUBLIC_URL`: Backend API base URL (required)
- Others: Check `.env.local` for runtime secrets

## Common Tasks

### Add New Admin Table Feature

1. Create folder in `src/app/UiComponents/DataViewer/{featureName}/`
2. Create wrapper component using `AdminTable` + `useDataFetcher(url)`
3. Define `columns` array with `{ accessor, label, render }` structure
4. Pass edit/delete handlers + endpoint to modals

### Add Form Field

1. Add to `inputs` array in component
2. Specify type, label, validation rules
3. MainForm auto-renders based on type (text, select, file, date, etc.)

### Integrate New Data Endpoint

1. Call `useDataFetcher('endpoint/path')` or `getData({ url: 'path', ... })`
2. API auto-formats response with pagination
3. Handle `status !== 200` cases explicitly

## Critical File References

- **Colors/Theme**: `src/app/helpers/colors.js`
- **Constants**: `src/app/helpers/constants.js` (1300+ lines, includes icon mappings)
- **Layout/Routing**: `src/app/layout.js` (root providers setup)
- **Auth Status**: `src/app/providers/AuthProvider.jsx` (validation flow)
- **Main Form Template**: `src/app/UiComponents/formComponents/forms/MainForm.jsx`

## Debugging Tips

- Check browser Network tab for `/auth/status` response
- LocalStorage holds: `role`, `userId` (AuthProvider fallback)
- Toast notifications appear top-center for all errors
- Tables filter/sort via URL params, check Redux DevTools in Network

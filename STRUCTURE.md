# Project Structure Guide

This document describes the organized folder structure for the Designs CRM application.

## UI Structure (`ui/src/app/`)

### Helpers (`helpers/`)

Centralized helper utilities and configurations.

```
helpers/
├── api-routes.js      # Centralized API route definitions
├── colors.js          # Color utilities
├── constants.js       # Application constants and enums
├── index.js           # Main barrel export
├── functions/         # Helper functions
│   ├── index.js       # Barrel export
│   ├── getData.js     # Data fetching utility
│   ├── getDataAndSet.js
│   ├── handleSubmit.js
│   ├── checkout.js
│   ├── uploadAsChunk.js
│   └── utility.js
└── hooks/             # Custom React hooks
    ├── index.js       # Barrel export
    ├── useCallTimer.js
    ├── useDataFetcher.js
    └── useLanguage.js
```

### Leads Components (`UiComponents/DataViewer/leads/`)

UI components for lead management, organized by purpose.

```
leads/
├── index.js           # Main barrel export
├── PreviewLeadDialog.jsx
├── core/              # Fundamental UI components
│   ├── index.js
│   ├── CallAndMeetingCard.jsx
│   ├── FinalPriceCalc.jsx
│   ├── IdBadge.jsx
│   ├── InfoCard.jsx
│   ├── ReminderButtons.jsx
│   └── Utility.jsx
├── dialogs/           # Modal dialogs
│   ├── index.js
│   ├── AddExtraService.jsx
│   ├── AddFilesDialog.jsx
│   ├── CallsDialog.jsx
│   ├── MeetingsDialog.jsx
│   ├── NoteDialog.jsx
│   ├── OpenButton.jsx
│   └── PriceOffersDialog.jsx
├── features/          # Feature-specific components
│   ├── index.js
│   ├── AddNewLead.jsx
│   ├── ImportLeadsExcel.jsx
│   ├── MoveToNewLeadsButton.jsx
│   └── PreviewLead.jsx
├── leadUpdates/       # Lead update management
│   ├── index.js
│   ├── CreateUpdate.jsx
│   ├── KanbanUpdateSection.jsx
│   ├── LeadListModal.jsx
│   ├── UpdateCard.jsx
│   └── UpdatesList.jsx
├── pages/             # Full page components
│   ├── index.js
│   ├── AllDealsPage.jsx
│   ├── NewLeadsPage.jsx
│   ├── Non-consulted-leads.jsx
│   └── OnHoldLeads.jsx
├── panels/            # Panel/section components
│   ├── index.js
│   ├── LeadContactInfo.jsx
│   ├── LeadInfo.jsx
│   └── StipieData.jsx
├── payments/          # Payment-related components
│   ├── index.js
│   ├── AddPayments.jsx
│   └── PaymentsDialog.jsx
├── tabs/              # Tab-based content
│   ├── index.js
│   ├── CallReminders.jsx
│   ├── ExtraTabs.jsx
│   ├── Files.jsx
│   ├── LeadsNotes.jsx
│   ├── MeetingReminders.jsx
│   ├── PriceOffers.jsx
│   ├── SalesStage.jsx
│   └── SalesToolsTabs.jsx
├── utilities/         # Helper/utility components
│   ├── index.js
│   └── GenerateLeadPdf.jsx
└── widgets/           # Small reusable widgets
    ├── index.js
    ├── CountdownTimer.jsx
    ├── FinalizeModal.jsx
    ├── FixedData.jsx
    ├── InProgressCall.jsx
    ├── NextCalls.jsx
    └── NextMeetings.jsx
```

## Server Structure (`server/`)

### Routes (`routes/`)

Server routes organized by domain, each in its own folder.

```
routes/
├── route-paths.js     # Centralized route path definitions
├── auth/              # Authentication routes
│   ├── index.js       # Barrel export
│   └── auth.js        # Route handlers
├── admin/             # Admin routes
│   ├── index.js
│   └── admin.js
├── shared/            # Shared routes (authenticated users)
│   ├── index.js
│   ├── shared.js
│   └── oldshared.js
├── staff/             # Staff-specific routes
│   ├── index.js
│   └── staff.js
├── utility/           # Utility routes
│   ├── index.js
│   └── utility.js
├── accountant/        # Accountant routes
│   ├── index.js
│   └── accountant.js
├── client/            # Client-facing routes
│   ├── index.js       # Main router with sub-routes
│   ├── leads.js
│   ├── notes.js
│   ├── payments.js
│   ├── uploads.js
│   ├── image-session.js
│   ├── languages.js
│   └── telegram.js
├── calendar/          # Calendar routes
├── contract/          # Contract routes
├── courses/           # Course routes
├── image-session/     # Image session routes
├── questions/         # Questions routes
└── site-utilities/    # Site utility routes
```

## API Routes Synchronization

To keep API routes in sync between UI and server:

1. **UI**: Use `helpers/api-routes.js` for all API route references
2. **Server**: Use `routes/route-paths.js` for route path definitions

### Usage Example (UI)

```javascript
import { API_ROUTES } from "@/app/helpers/api-routes";

// Using route functions
const url = API_ROUTES.SHARED.CLIENT_LEADS.GET(leadId);
const statusUrl = API_ROUTES.SHARED.CLIENT_LEADS.STATUS(leadId);

// Using static routes
const dashboardUrl = API_ROUTES.SHARED.DASHBOARD.KEY_METRICS;
```

### Benefits

1. **Single Source of Truth**: Route paths defined in one place
2. **Type Safety**: Route functions provide clear parameter requirements
3. **Easy Refactoring**: Change routes in one place, affects everywhere
4. **Better IDE Support**: Autocomplete for route names
5. **Documentation**: Route names serve as self-documentation

/**
 * Centralized API Routes Configuration for Server
 *
 * This file contains all API route path definitions used throughout the server.
 * When routes change, update them here and in the corresponding UI api-routes.js file.
 *
 * Note: This file defines the route paths, not the route handlers.
 * Route handlers are defined in the route files.
 */

// Base route prefixes (these match what's mounted in index.js)
export const BASE_ROUTES = {
  AUTH: "/auth",
  SHARED: "/shared",
  UTILITY: "/utility",
  STAFF: "/staff",
  ADMIN: "/admin",
  ACCOUNTANT: "/accountant",
  CLIENT: "/client",
};

/**
 * Route paths organized by domain
 * These are the paths AFTER the base route prefix
 */
export const ROUTE_PATHS = {
  // ========================================
  // Authentication Paths (mounted at /auth)
  // ========================================
  AUTH: {
    LOGIN: "/login",
    LOGOUT: "/logout",
    STATUS: "/status",
    RESET: "/reset",
    RESET_TOKEN: "/reset/:token",
  },

  // ========================================
  // Utility Paths (mounted at /utility)
  // ========================================
  UTILITY: {
    UPLOAD: "/upload",
    UPLOAD_CHUNK: "/upload-chunk",
    SEARCH: "/search",
    NOTIFICATION: {
      UNREAD: "/notification/unread",
      MARK_READ: "/notification/users/:userId",
    },
  },

  // ========================================
  // Shared Paths (mounted at /shared)
  // ========================================
  SHARED: {
    // Sub-routers
    SUB_ROUTERS: {
      COURSES: "/courses",
      CONTRACTS: "/contracts",
      SITE_UTILITIES: "/site-utilities",
      QUESTIONS: "/questions",
      CALENDAR: "/calendar",
      IMAGE_SESSION: "/image-session",
    },

    // Client Leads
    CLIENT_LEADS: {
      LIST: "/client-leads",
      GET: "/client-leads/:id",
      DEALS: "/client-leads/deals",
      COLUMNS: "/client-leads/columns",
      CALLS: "/client-leads/calls",
      MEETINGS: "/client-leads/meetings",
      MEETING_REMINDERS_LIST: "/client-leads/:clientLeadId/meeting-reminders",
      UPDATE: "/client-leads",
      CONVERT: "/client-leads/convert",
      STATUS: "/client-leads/:id/status",
      CHECK_COUNTRY: "/:userId/client-leads/countries",
      // Call Reminders
      CALL_REMINDERS_CREATE: "/client-leads/:id/call-reminders",
      CALL_REMINDERS_UPDATE: "/client-leads/call-reminders/:id",
      // Meeting Reminders
      MEETING_REMINDERS_CREATE: "/client-leads/:id/meeting-reminders",
      MEETING_REMINDERS_CREATE_TOKEN:
        "/client-leads/:id/meeting-reminders/token",
      MEETING_REMINDERS_UPDATE: "/client-leads/meeting-reminders/:id",
      // Price Offers
      PRICE_OFFERS_CREATE: "/client-leads/:id/price-offers",
      PRICE_OFFERS_CHANGE_STATUS: "/client-lead/price-offers/change-status",
      // Files
      FILES_CREATE: "/client-leads/:id/files",
      // Payments
      PAYMENTS_CREATE: "/client-leads/:id/payments",
      // Notes
      NOTES_CREATE: "/client-leads/:id/notes",
      // Updates
      UPDATES_LIST: "/client-leads/:clientLeadId/updates",
      UPDATES_CREATE: "/client-leads/:clientLeadId/updates",
      UPDATES_AUTHORIZE: "/client-leads/updates/:updateId/authorize",
      UPDATES_UNAUTHORIZE: "/client-leads/updates/:updateId/authorize/shared",
      UPDATES_ARCHIVE: "/client-leads/updates/:updateId/archive",
      UPDATES_MARK_DONE: "/client-leads/updates/:updateId/mark-done",
      SHARED_SETTINGS: "/client-leads/shared-settings/:updateId",
      SHARED_UPDATES_ARCHIVE:
        "/client-leads/shared-updates/:sharedUpdateId/archive",
      // Contract
      CONTRACT_UPDATE: "/client-leads/contract/:id",
      CONTRACT_CURRENT: "/client-leads/contract/:id/current",
      CONTRACT_COMPLETED: "/client-leads/contract/:id/completed",
      CONTRACT_DELETE: "/client-leads/contract/:id",
      // Projects
      PROJECT_GROUPS: "/client-leads/:leadId/projects/groups",
    },

    // Lead
    LEAD: {
      UPDATE: "/lead/update/:id",
    },

    // Projects (Designers)
    PROJECTS: {
      DESIGNERS_LIST: "/client-leads/projects/designers",
      DESIGNERS_COLUMNS: "/client-leads/projects/designers/columns",
      DESIGNERS_GET: "/client-leads/projects/designers/:id",
      DESIGNERS_STATUS: "/client-leads/designers/:leadId/status",
      LIST: "/projects",
      ARCHIVED: "/archived-projects",
      USER_PROFILE: "/projects/user-profile/:userId",
      GET: "/projects/:id",
      UPDATE: "/projects/:id",
      ASSIGN_DESIGNER: "/projects/:id/assign-designer",
      DELIVERY_SCHEDULES: "/projects/:projectId/delivery-schedules",
    },

    // Delivery Schedule
    DELIVERY_SCHEDULE: {
      CREATE: "/delivery-schedule",
      LINK_MEETING: "/delivery-schedule/:deliveryId/link-meeting",
      DELETE: "/delivery-schedule/:deliveryId",
    },

    // Meeting Reminders
    MEETING_REMINDERS: {
      GET: "/meeting-reminders/:meetingId",
    },

    // Dashboard
    DASHBOARD: {
      KEY_METRICS: "/dashboard/key-metrics",
      LEADS_STATUS: "/dashboard/leads-status",
      MONTHLY_PERFORMANCE: "/dashboard/monthly-performance",
      EMIRATES_ANALYTICS: "/dashboard/emirates-analytics",
      LEADS_MONTHLY_OVERVIEW: "/dashboard/leads-monthly-overview",
      WEEK_PERFORMANCE: "/dashboard/week-performance",
      LATEST_LEADS: "/dashboard/latest-leads",
      RECENT_ACTIVITIES: "/dashboard/recent-activities",
      DESIGNER_METRICS: "/dashboard/designer-metrics",
    },

    // Tasks
    TASKS: {
      LIST: "/tasks",
      CREATE: "/tasks",
      GET: "/tasks/:id",
      UPDATE: "/tasks/:taskId",
    },

    // Notes
    NOTES: {
      LIST: "/notes",
      CREATE: "/notes",
    },

    // Generic Delete
    DELETE: "/delete/:id",

    // Users
    USERS: {
      ROLE: "/users/role/:userId",
      ADMINS: "/users/admins",
    },

    // Fixed Data
    FIXED_DATA: "/fixed-data",

    // User Logs
    USER_LOGS: {
      LIST: "/user-logs",
      CREATE: "/user-logs",
    },

    // Notifications
    NOTIFICATIONS: "/notifications",

    // Image Session
    IMAGE_SESSION: {
      IMAGES: "/image-session/images",
      GET: "/image-session",
    },

    // Calendar
    CALENDAR: {
      AVAILABLE_DAYS_CREATE: "/calendar/available-days",
      AVAILABLE_DAYS_UPDATE: "/calendar/available-days/:dayId",
      AVAILABLE_DAYS_MULTIPLE: "/calendar/available-days/multiple",
      ADD_CUSTOM: "/calendar/add-custom/:dayId",
      SLOTS_DELETE: "/calendar/slots/:slotId",
      DAYS_DELETE: "/calendar/days/:dayId",
    },

    // Sales Stages
    SALES_STAGES: {
      GET: "/client-lead/:clientLeadId/sales-stages",
      EDIT: "/client-lead/:clientLeadId/sales-stages",
    },

    // Reminders
    REMINDERS: {
      PAYMENT: "/client-leads/:clientLeadId/payment-reminder",
      COMPLETE_REGISTER: "/client-leads/:clientLeadId/complete-register",
    },

    // Reviews OAuth
    REVIEWS: {
      OAUTH_CALLBACK: "/oauth2callback",
      LOCATIONS: "/locations",
      REVIEWS: "/reviews",
    },

    // IDs Helper
    IDS: "/ids",

    // Roles
    ROLES: "/roles",
  },

  // ========================================
  // Admin Paths (mounted at /admin)
  // ========================================
  ADMIN: {
    // Sub-routers
    SUB_ROUTERS: {
      IMAGE_SESSION: "/image-session",
      COURSES: "/courses",
    },

    // Users
    USERS: {
      LIST: "/users",
      ALL: "/all-users",
      CREATE: "/users",
      GET: "/users/:userId",
      UPDATE: "/users/:userId",
      PROFILE: "/users/:userId/profile",
      LOGS: "/users/:userId/logs",
      LAST_SEEN: "/users/:userId/last-seen",
      ROLES: "/users/:userId/roles",
      RESTRICTED_COUNTRIES: "/users/:userId/restricted-countries",
      AUTO_ASSIGNMENTS: "/users/:userId/auto-assignments",
      MAX_LEADS: "/users/max-leads/:userId",
      MAX_LEADS_PER_DAY: "/users/max-leads-per-day/:userId",
      STAFF_EXTRA: "/users/:userId/staff-extra",
      STATUS: "/users/:userId",
    },

    // Leads
    LEADS: {
      EXCEL_IMPORT: "/leads/excel",
      UPDATE: "/leads/update/:id",
      DELETE: "/client-leads/:id",
    },

    // Client
    CLIENT: {
      UPDATE: "/client/update/:clientId",
    },

    // Reports
    REPORTS: {
      LEAD: "/reports/lead-report",
      LEAD_EXCEL: "/reports/lead-report/excel",
      LEAD_PDF: "/reports/lead-report/pdf",
      STAFF: "/reports/staff-report",
      STAFF_EXCEL: "/reports/staff-report/excel",
      STAFF_PDF: "/reports/staff-report/pdf",
    },

    // Fixed Data
    FIXED_DATA: {
      CREATE: "/fixed-data",
      UPDATE: "/fixed-data/:id",
      DELETE: "/fixed-data/:id",
    },

    // Commissions
    COMMISSIONS: {
      LIST: "/commissions",
      CREATE: "/commissions",
      UPDATE: "/commissions/:id",
    },

    // Projects
    PROJECTS: {
      LIST: "/projects",
      CREATE_GROUP: "/projects/create-group",
    },

    // Archive
    MODEL_ARCHIVE: "/model/archived/:id",

    // Telegram
    TELEGRAM: {
      CREATE_LINK: "/client-leads/:leadId/telegram/new",
      ASSIGN_USERS: "/client-leads/:leadId/telegram/assign-users",
    },

    // New Lead
    NEW_LEAD: "/new-lead",
  },

  // ========================================
  // Staff Paths (mounted at /staff)
  // ========================================
  STAFF: {
    DASHBOARD: {
      LATEST_CALLS: "/dashboard/latest-calls",
    },
  },

  // ========================================
  // Client Paths (mounted at /client)
  // ========================================
  CLIENT: {
    // Sub-routers
    SUB_ROUTERS: {
      LEADS: "/leads",
      NOTES: "/notes",
      PAYMENTS: "/payments",
      UPLOADS: "/uploads",
      IMAGE_SESSION: "/image-session",
      TELEGRAM: "/telegram",
      LANGUAGES: "/languages",
      CALENDAR: "/calendar",
      CONTRACTS: "/contracts",
    },

    // Direct routes
    NEW_LEAD: "/new-lead",
    UPLOAD: "/upload",
    UPDATE: "/update/:id",
    LANGUAGES: "/languages",
  },

  // ========================================
  // Accountant Paths (mounted at /accountant)
  // ========================================
  ACCOUNTANT: {
    // Add accountant-specific paths here
  },
};

export default { BASE_ROUTES, ROUTE_PATHS };

/**
 * Centralized API Routes Configuration
 *
 * This file contains all API route definitions used throughout the application.
 * When routes change on the server, update them here to keep UI and server in sync.
 *
 * Usage:
 *   import { API_ROUTES } from "@/app/helpers/api-routes";
 *   const url = API_ROUTES.SHARED.CLIENT_LEADS.LIST;
 */

// Base routes
const AUTH = "auth";
const SHARED = "shared";
const ADMIN = "admin";
const STAFF = "staff";
const UTILITY = "utility";
const CLIENT = "client";
const ACCOUNTANT = "accountant";

/**
 * API Routes organized by domain
 */
export const API_ROUTES = {
  // ========================================
  // Authentication Routes
  // ========================================
  AUTH: {
    LOGIN: `${AUTH}/login`,
    LOGOUT: `${AUTH}/logout`,
    STATUS: `${AUTH}/status`,
    RESET: `${AUTH}/reset`,
    RESET_WITH_TOKEN: (token) => `${AUTH}/reset/${token}`,
  },

  // ========================================
  // Utility Routes (Public/Semi-public)
  // ========================================
  UTILITY: {
    UPLOAD: `${UTILITY}/upload`,
    UPLOAD_CHUNK: `${UTILITY}/upload-chunk`,
    SEARCH: `${UTILITY}/search`,
    NOTIFICATION: {
      UNREAD: `${UTILITY}/notification/unread`,
      MARK_READ: (userId) => `${UTILITY}/notification/users/${userId}`,
    },
  },

  // ========================================
  // Shared Routes (Authenticated Users)
  // ========================================
  SHARED: {
    // Client Leads
    CLIENT_LEADS: {
      LIST: `${SHARED}/client-leads`,
      GET: (id) => `${SHARED}/client-leads/${id}`,
      DEALS: `${SHARED}/client-leads/deals`,
      COLUMNS: `${SHARED}/client-leads/columns`,
      CALLS: `${SHARED}/client-leads/calls`,
      MEETINGS: `${SHARED}/client-leads/meetings`,
      UPDATE: `${SHARED}/client-leads`,
      CONVERT: `${SHARED}/client-leads/convert`,
      STATUS: (id) => `${SHARED}/client-leads/${id}/status`,
      // Country check
      CHECK_COUNTRY: (userId) => `${SHARED}/${userId}/client-leads/countries`,
      // Call Reminders
      CALL_REMINDERS: {
        CREATE: (id) => `${SHARED}/client-leads/${id}/call-reminders`,
        UPDATE: (id) => `${SHARED}/client-leads/call-reminders/${id}`,
      },
      // Meeting Reminders
      MEETING_REMINDERS: {
        LIST: (clientLeadId) =>
          `${SHARED}/client-leads/${clientLeadId}/meeting-reminders`,
        CREATE: (id) => `${SHARED}/client-leads/${id}/meeting-reminders`,
        CREATE_WITH_TOKEN: (id) =>
          `${SHARED}/client-leads/${id}/meeting-reminders/token`,
        UPDATE: (id) => `${SHARED}/client-leads/meeting-reminders/${id}`,
      },
      // Price Offers
      PRICE_OFFERS: {
        CREATE: (id) => `${SHARED}/client-leads/${id}/price-offers`,
        CHANGE_STATUS: `${SHARED}/client-lead/price-offers/change-status`,
      },
      // Files
      FILES: {
        CREATE: (id) => `${SHARED}/client-leads/${id}/files`,
      },
      // Payments
      PAYMENTS: {
        CREATE: (id) => `${SHARED}/client-leads/${id}/payments`,
      },
      // Notes
      NOTES: {
        CREATE: (id) => `${SHARED}/client-leads/${id}/notes`,
      },
      // Updates
      UPDATES: {
        LIST: (clientLeadId) =>
          `${SHARED}/client-leads/${clientLeadId}/updates`,
        CREATE: (clientLeadId) =>
          `${SHARED}/client-leads/${clientLeadId}/updates`,
        AUTHORIZE: (updateId) =>
          `${SHARED}/client-leads/updates/${updateId}/authorize`,
        UNAUTHORIZE: (updateId) =>
          `${SHARED}/client-leads/updates/${updateId}/authorize/shared`,
        ARCHIVE: (updateId) =>
          `${SHARED}/client-leads/updates/${updateId}/archive`,
        MARK_DONE: (updateId) =>
          `${SHARED}/client-leads/updates/${updateId}/mark-done`,
      },
      SHARED_SETTINGS: (updateId) =>
        `${SHARED}/client-leads/shared-settings/${updateId}`,
      SHARED_UPDATES_ARCHIVE: (sharedUpdateId) =>
        `${SHARED}/client-leads/shared-updates/${sharedUpdateId}/archive`,
      // Contract
      CONTRACT: {
        UPDATE: (id) => `${SHARED}/client-leads/contract/${id}`,
        MARK_CURRENT: (id) => `${SHARED}/client-leads/contract/${id}/current`,
        MARK_COMPLETED: (id) =>
          `${SHARED}/client-leads/contract/${id}/completed`,
        DELETE: (id) => `${SHARED}/client-leads/contract/${id}`,
      },
      // Projects
      PROJECTS: {
        GROUPS: (leadId) => `${SHARED}/client-leads/${leadId}/projects/groups`,
      },
    },

    // Lead (single lead operations)
    LEAD: {
      UPDATE: (id) => `${SHARED}/lead/update/${id}`,
    },

    // Projects (Designers)
    PROJECTS: {
      DESIGNERS: {
        LIST: `${SHARED}/client-leads/projects/designers`,
        COLUMNS: `${SHARED}/client-leads/projects/designers/columns`,
        GET: (id) => `${SHARED}/client-leads/projects/designers/${id}`,
        UPDATE_STATUS: (leadId) =>
          `${SHARED}/client-leads/designers/${leadId}/status`,
      },
      LIST: `${SHARED}/projects`,
      ARCHIVED: `${SHARED}/archived-projects`,
      USER_PROFILE: (userId) => `${SHARED}/projects/user-profile/${userId}`,
      GET: (id) => `${SHARED}/projects/${id}`,
      UPDATE: (id) => `${SHARED}/projects/${id}`,
      ASSIGN_DESIGNER: (id) => `${SHARED}/projects/${id}/assign-designer`,
      DELIVERY_SCHEDULES: (projectId) =>
        `${SHARED}/projects/${projectId}/delivery-schedules`,
    },

    // Delivery Schedule
    DELIVERY_SCHEDULE: {
      CREATE: `${SHARED}/delivery-schedule`,
      LINK_MEETING: (deliveryId) =>
        `${SHARED}/delivery-schedule/${deliveryId}/link-meeting`,
      DELETE: (deliveryId) => `${SHARED}/delivery-schedule/${deliveryId}`,
    },

    // Meeting Reminders
    MEETING_REMINDERS: {
      GET: (meetingId) => `${SHARED}/meeting-reminders/${meetingId}`,
    },

    // Dashboard
    DASHBOARD: {
      KEY_METRICS: `${SHARED}/dashboard/key-metrics`,
      LEADS_STATUS: `${SHARED}/dashboard/leads-status`,
      MONTHLY_PERFORMANCE: `${SHARED}/dashboard/monthly-performance`,
      EMIRATES_ANALYTICS: `${SHARED}/dashboard/emirates-analytics`,
      LEADS_MONTHLY_OVERVIEW: `${SHARED}/dashboard/leads-monthly-overview`,
      WEEK_PERFORMANCE: `${SHARED}/dashboard/week-performance`,
      LATEST_LEADS: `${SHARED}/dashboard/latest-leads`,
      RECENT_ACTIVITIES: `${SHARED}/dashboard/recent-activities`,
      DESIGNER_METRICS: `${SHARED}/dashboard/designer-metrics`,
    },

    // Tasks
    TASKS: {
      LIST: `${SHARED}/tasks`,
      CREATE: `${SHARED}/tasks`,
      GET: (id) => `${SHARED}/tasks/${id}`,
      UPDATE: (taskId) => `${SHARED}/tasks/${taskId}`,
    },

    // Notes
    NOTES: {
      LIST: `${SHARED}/notes`,
      CREATE: `${SHARED}/notes`,
    },

    // Generic Delete
    DELETE: (id) => `${SHARED}/delete/${id}`,

    // Users
    USERS: {
      ROLE: (userId) => `${SHARED}/users/role/${userId}`,
      ADMINS: `${SHARED}/users/admins`,
    },

    // Fixed Data
    FIXED_DATA: `${SHARED}/fixed-data`,

    // User Logs
    USER_LOGS: {
      LIST: `${SHARED}/user-logs`,
      CREATE: `${SHARED}/user-logs`,
    },

    // Notifications
    NOTIFICATIONS: `${SHARED}/notifications`,

    // Image Session
    IMAGE_SESSION: {
      IMAGES: `${SHARED}/image-session/images`,
      GET: `${SHARED}/image-session`,
    },

    // Calendar
    CALENDAR: {
      AVAILABLE_DAYS: {
        CREATE: `${SHARED}/calendar/available-days`,
        UPDATE: (dayId) => `${SHARED}/calendar/available-days/${dayId}`,
        CREATE_MULTIPLE: `${SHARED}/calendar/available-days/multiple`,
      },
      ADD_CUSTOM: (dayId) => `${SHARED}/calendar/add-custom/${dayId}`,
      SLOTS: {
        DELETE: (slotId) => `${SHARED}/calendar/slots/${slotId}`,
      },
      DAYS: {
        DELETE: (dayId) => `${SHARED}/calendar/days/${dayId}`,
      },
    },

    // Sales Stages
    SALES_STAGES: {
      GET: (clientLeadId) =>
        `${SHARED}/client-lead/${clientLeadId}/sales-stages`,
      EDIT: (clientLeadId) =>
        `${SHARED}/client-lead/${clientLeadId}/sales-stages`,
    },

    // Reminders
    REMINDERS: {
      PAYMENT: (clientLeadId) =>
        `${SHARED}/client-leads/${clientLeadId}/payment-reminder`,
      COMPLETE_REGISTER: (clientLeadId) =>
        `${SHARED}/client-leads/${clientLeadId}/complete-register`,
    },

    // Reviews OAuth
    REVIEWS: {
      OAUTH_CALLBACK: `${SHARED}/oauth2callback`,
      LOCATIONS: `${SHARED}/locations`,
      REVIEWS: `${SHARED}/reviews`,
    },

    // IDs Helper
    IDS: `${SHARED}/ids`,

    // Roles
    ROLES: `${SHARED}/roles`,

    // Contracts (sub-router)
    CONTRACTS: {
      BASE: `${SHARED}/contracts`,
      GET: (contractId) => `${SHARED}/contracts/${contractId}`,
      CLIENT_LEAD: (clientLeadId) =>
        `${SHARED}/contracts/client-lead/${clientLeadId}`,
      PAYMENTS: {
        ALL: `${SHARED}/contracts/payments/all`,
        BY_CONTRACT: (contractId) =>
          `${SHARED}/contracts/payments/${contractId}`,
      },
    },

    // Courses (sub-router)
    COURSES: {
      BASE: `${SHARED}/courses`,
    },

    // Site Utilities (sub-router)
    SITE_UTILITIES: {
      BASE: `${SHARED}/site-utilities`,
    },

    // Questions (sub-router)
    QUESTIONS: {
      BASE: `${SHARED}/questions`,
    },
  },

  // ========================================
  // Admin Routes
  // ========================================
  ADMIN: {
    // Users
    USERS: {
      LIST: `${ADMIN}/users`,
      ALL: `${ADMIN}/all-users`,
      CREATE: `${ADMIN}/users`,
      GET: (userId) => `${ADMIN}/users/${userId}`,
      UPDATE: (userId) => `${ADMIN}/users/${userId}`,
      PROFILE: (userId) => `${ADMIN}/users/${userId}/profile`,
      LOGS: (userId) => `${ADMIN}/users/${userId}/logs`,
      LAST_SEEN: (userId) => `${ADMIN}/users/${userId}/last-seen`,
      ROLES: (userId) => `${ADMIN}/users/${userId}/roles`,
      RESTRICTED_COUNTRIES: (userId) =>
        `${ADMIN}/users/${userId}/restricted-countries`,
      AUTO_ASSIGNMENTS: (userId) =>
        `${ADMIN}/users/${userId}/auto-assignments`,
      MAX_LEADS: (userId) => `${ADMIN}/users/max-leads/${userId}`,
      MAX_LEADS_PER_DAY: (userId) =>
        `${ADMIN}/users/max-leads-per-day/${userId}`,
      STAFF_EXTRA: (userId) => `${ADMIN}/users/${userId}/staff-extra`,
      STATUS: (userId) => `${ADMIN}/users/${userId}`,
    },

    // Leads
    LEADS: {
      EXCEL_IMPORT: `${ADMIN}/leads/excel`,
      UPDATE: (id) => `${ADMIN}/leads/update/${id}`,
      DELETE: (id) => `${ADMIN}/client-leads/${id}`,
    },

    // Client
    CLIENT: {
      UPDATE: (clientId) => `${ADMIN}/client/update/${clientId}`,
    },

    // Reports
    REPORTS: {
      LEAD: `${ADMIN}/reports/lead-report`,
      LEAD_EXCEL: `${ADMIN}/reports/lead-report/excel`,
      LEAD_PDF: `${ADMIN}/reports/lead-report/pdf`,
      STAFF: `${ADMIN}/reports/staff-report`,
      STAFF_EXCEL: `${ADMIN}/reports/staff-report/excel`,
      STAFF_PDF: `${ADMIN}/reports/staff-report/pdf`,
    },

    // Fixed Data
    FIXED_DATA: {
      CREATE: `${ADMIN}/fixed-data`,
      UPDATE: (id) => `${ADMIN}/fixed-data/${id}`,
      DELETE: (id) => `${ADMIN}/fixed-data/${id}`,
    },

    // Commissions
    COMMISSIONS: {
      LIST: `${ADMIN}/commissions`,
      CREATE: `${ADMIN}/commissions`,
      UPDATE: (id) => `${ADMIN}/commissions/${id}`,
    },

    // Projects
    PROJECTS: {
      LIST: `${ADMIN}/projects`,
      CREATE_GROUP: `${ADMIN}/projects/create-group`,
    },

    // Archive
    MODEL_ARCHIVE: (id) => `${ADMIN}/model/archived/${id}`,

    // Telegram
    TELEGRAM: {
      CREATE_LINK: (leadId) => `${ADMIN}/client-leads/${leadId}/telegram/new`,
      ASSIGN_USERS: (leadId) =>
        `${ADMIN}/client-leads/${leadId}/telegram/assign-users`,
    },

    // New Lead
    NEW_LEAD: `${ADMIN}/new-lead`,

    // Image Session (sub-router)
    IMAGE_SESSION: {
      BASE: `${ADMIN}/image-session`,
      PROS_AND_CONS: `${ADMIN}/image-session/pros-and-cons`,
      PROS_AND_CONS_ORDER: (id) =>
        `${ADMIN}/image-session/pros-and-cons/order/${id}`,
      TEMPLATES: `${ADMIN}/image-session/templates`,
    },

    // Courses (sub-router)
    COURSES: {
      BASE: `${ADMIN}/courses`,
    },
  },

  // ========================================
  // Staff Routes
  // ========================================
  STAFF: {
    DASHBOARD: {
      LATEST_CALLS: `${STAFF}/dashboard/latest-calls`,
    },
  },

  // ========================================
  // Client Routes
  // ========================================
  CLIENT: {
    // New Lead
    NEW_LEAD: `${CLIENT}/new-lead`,
    UPLOAD: `${CLIENT}/upload`,
    UPDATE: (id) => `${CLIENT}/update/${id}`,

    // Languages
    LANGUAGES: `${CLIENT}/languages`,

    // Calendar
    CALENDAR: {
      AVAILABLE_DAYS: `${CLIENT}/calendar/available-days`,
      SLOTS: `${CLIENT}/calendar/slots`,
      SLOT_DETAILS: `${CLIENT}/calendar/slots/details`,
      BOOK: `${CLIENT}/calendar/book`,
      MEETING_DATA: `${CLIENT}/calendar/meeting-data`,
      TIMEZONES: `${CLIENT}/calendar/timezones`,
    },

    // Image Session
    IMAGE_SESSION: {
      IMAGES: `${CLIENT}/image-session/images`,
      SESSION: `${CLIENT}/image-session/session`,
      SESSION_STATUS: `${CLIENT}/image-session/session/status`,
      COLORS: `${CLIENT}/image-session/colors`,
      MATERIALS: `${CLIENT}/image-session/materials`,
      STYLES: `${CLIENT}/image-session/styles`,
      PAGE_INFO: `${CLIENT}/image-session/page-info`,
      PROS_AND_CONS: `${CLIENT}/image-session/pros-and-cons`,
      GENERATE_PDF: `${CLIENT}/image-session/generate-pdf`,
    },

    // Contracts
    CONTRACTS: {
      SESSION: `${CLIENT}/contracts/session`,
      SESSION_STATUS: `${CLIENT}/contracts/session/status`,
      GENERATE_PDF: `${CLIENT}/contracts/generate-pdf`,
    },
  },

  // ========================================
  // Accountant Routes
  // ========================================
  ACCOUNTANT: {
    BASE: ACCOUNTANT,
    // Add accountant-specific routes here
  },
};

/**
 * Helper function to build URL with query params
 * @param {string} route - The base route
 * @param {Object} params - Query parameters
 * @returns {string} - Complete URL with query params
 */
export function buildUrl(route, params = {}) {
  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return queryString ? `${route}?${queryString}` : route;
}

/**
 * Helper function to build URL with path params and query params
 * @param {Function} routeFn - Route function that accepts path params
 * @param {any[]} pathParams - Path parameters
 * @param {Object} queryParams - Query parameters
 * @returns {string} - Complete URL
 */
export function buildUrlWithParams(routeFn, pathParams = [], queryParams = {}) {
  const route = routeFn(...pathParams);
  return buildUrl(route, queryParams);
}

export default API_ROUTES;

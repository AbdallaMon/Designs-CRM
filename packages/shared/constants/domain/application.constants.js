// Cross-workspace domain identifiers. These values cross API or persistence
// boundaries and therefore must not be re-declared in server/web applications.

export const CHAT_MEMBER_ROLES = Object.freeze({
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  MEMBER: "MEMBER",
});

export const CHAT_ROOM_TYPES = Object.freeze({
  STAFF_TO_STAFF: "STAFF_TO_STAFF",
  PROJECT_GROUP: "PROJECT_GROUP",
  CLIENT_TO_STAFF: "CLIENT_TO_STAFF",
  STAFF_GROUP: "STAFF_GROUP",
  GROUP: "GROUP",
});

export const CHAT_ROOM_FILTERS = Object.freeze({
  ALL: "ALL",
  DIRECT: "DIRECT",
  GROUP: "GROUP",
  PROJECT: "PROJECT",
  CLIENT_LEADS: "CLIENT_LEADS",
  ARCHIVED: "ARCHIVED",
  UNREAD: "UNREAD",
});

export const CHAT_VIEW_MODES = Object.freeze({
  LIST: "LIST",
  CHAT: "CHAT",
});

export const CHAT_MESSAGE_TYPES = Object.freeze({
  TEXT: "TEXT",
  FILE: "FILE",
  IMAGE: "IMAGE",
  VOICE: "VOICE",
  VIDEO: "VIDEO",
  SYSTEM: "SYSTEM",
});

export const CHAT_CALL_TYPES = Object.freeze({
  AUDIO: "AUDIO",
  VIDEO: "VIDEO",
});

export const CHAT_CALL_STATUSES = Object.freeze({
  RINGING: "RINGING",
  ONGOING: "ONGOING",
  ENDED: "ENDED",
  MISSED: "MISSED",
  CANCELLED: "CANCELLED",
});

export const SCHEDULED_MESSAGE_STATUSES = Object.freeze({
  PENDING: "PENDING",
  SENT: "SENT",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
});

export const CALENDAR_VIEW_TYPES = Object.freeze({
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  CLIENT: "CLIENT",
});

export const CALENDAR_SLOT_TYPES = Object.freeze({
  MOCK: "MOCK",
  REAL: "REAL",
});

export const WORK_DEPARTMENTS = Object.freeze({
  ADMIN: "ADMIN",
  STAFF: "STAFF",
});

export const KANBAN_VIEW_TYPES = Object.freeze({
  STAFF: "STAFF",
  CONTRACT_LEVELS: "CONTRACTLEVELS",
});

export const MY_DAY_FAMILIES = Object.freeze({
  SALES: "SALES",
  DESIGNER: "DESIGNER",
  FINANCE: "FINANCE",
  INITIATOR: "INITIATOR",
});

export const LEAD_COCKPIT_RULE_SETS = Object.freeze({
  SALES: "SALES",
  ACCOUNTANT: "ACCOUNTANT",
});

export const LEAD_CATEGORIES = Object.freeze({
  CONSULTATION: "CONSULTATION",
  DESIGN: "DESIGN",
  OLD_LEAD: "OLDLEAD",
});

export const LEAD_LOCATIONS = Object.freeze({
  INSIDE_UAE: "INSIDE_UAE",
  OUTSIDE_UAE: "OUTSIDE_UAE",
});

export const EMIRATES = Object.freeze({
  DUBAI: "DUBAI",
  ABU_DHABI: "ABU_DHABI",
  SHARJAH: "SHARJAH",
  AJMAN: "AJMAN",
  UMM_AL_QUWAIN: "UMM_AL_QUWAIN",
  RAS_AL_KHAIMAH: "RAS_AL_KHAIMAH",
  FUJAIRAH: "FUJAIRAH",
  KHOR_FAKKAN: "KHOR_FAKKAN",
  OUTSIDE: "OUTSIDE",
});

export const PAGE_INFO_TYPES = Object.freeze({
  BEFORE_PATTERN: "BEFORE_PATTERN",
  BEFORE_MATERIAL: "BEFORE_MATERIAL",
  BEFORE_STYLE: "BEFORE_STYLE",
});

export const LEAD_STATUSES = Object.freeze({
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  INTERESTED: "INTERESTED",
  NEEDS_IDENTIFIED: "NEEDS_IDENTIFIED",
  NEGOTIATING: "NEGOTIATING",
  REJECTED: "REJECTED",
  FINALIZED: "FINALIZED",
  CONVERTED: "CONVERTED",
  ON_HOLD: "ON_HOLD",
  ARCHIVED: "ARCHIVED",
  LEAD_EXCHANGE: "LEADEXCHANGE",
});

export const CALL_REMINDER_STATUSES = Object.freeze({
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  MISSED: "MISSED",
});

export const REMINDER_TYPES = Object.freeze({
  CALL: "CALL",
  MEETING: "MEETING",
});

export const BOOKING_LEAD_REQUEST_STATUSES = Object.freeze({
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
});

export const TELEGRAM_CONNECTION_STATUSES = Object.freeze({
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  INVALID_SESSION: "INVALID_SESSION",
});

export const TASK_STATUSES = Object.freeze({
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
});

export const UPDATE_STATUSES = Object.freeze({
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
});

export const PROJECT_STATUSES = Object.freeze({
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
});

export const PAYMENT_STATUSES = Object.freeze({
  NOT_PAID: "NOT_PAID",
  PENDING: "PENDING",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  FULLY_PAID: "FULLY_PAID",
  OVERDUE: "OVERDUE",
});

export const CONTRACT_LEVELS = Object.freeze({
  LEVEL_1: "LEVEL_1",
  LEVEL_2: "LEVEL_2",
  LEVEL_3: "LEVEL_3",
  LEVEL_4: "LEVEL_4",
  LEVEL_5: "LEVEL_5",
  LEVEL_6: "LEVEL_6",
  LEVEL_7: "LEVEL_7",
});

export const CONTRACT_PAYMENT_STATUSES = Object.freeze({
  NOT_DUE: "NOT_DUE",
  DUE: "DUE",
  RECEIVED: "RECEIVED",
  TRANSFERRED: "TRANSFERRED",
  CANCELLED: "CANCELLED",
});

export const CONTRACT_STATUSES = Object.freeze({
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

export const CONTRACT_SESSION_STATUSES = Object.freeze({
  INITIAL: "INITIAL",
  SIGNING: "SIGNING",
  REGISTERED: "REGISTERED",
});

export const WORK_STAGE_STATUSES = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
});

export const SALES_STAGE_TYPES = Object.freeze({
  INITIAL_CONTACT: "INITIAL_CONTACT",
  SOCIAL_MEDIA_CHECK: "SOCIAL_MEDIA_CHECK",
  WHATSAPP_QA: "WHATSAPP_QA",
  MEETING_BOOKED: "MEETING_BOOKED",
  CLIENT_INFO_UPLOADED: "CLIENT_INFO_UPLOADED",
  CONSULTATION_BOOKED: "CONSULTATION_BOOKED",
  FOLLOWUP_AFTER_MEETING: "FOLLOWUP_AFTER_MEETING",
  HANDLE_OBJECTIONS: "HANDLE_OBJECTIONS",
  DEAL_CLOSED: "DEAL_CLOSED",
  AFTER_SALES_FOLLOWUP: "AFTER_SALES_FOLLOWUP",
  NOT_INITIATED: "NOT_INITIATED",
});

export const IMAGE_SESSION_STATUSES = Object.freeze({
  INITIAL: "INITIAL",
  PREVIEW_COLOR_PATTERN: "PREVIEW_COLOR_PATTERN",
  SELECTED_COLOR_PATTERN: "SELECTED_COLOR_PATTERN",
  PREVIEW_MATERIAL: "PREVIEW_MATERIAL",
  SELECTED_MATERIAL: "SELECTED_MATERIAL",
  PREVIEW_STYLE: "PREVIEW_STYLE",
  SELECTED_STYLE: "SELECTED_STYLE",
  PREVIEW_IMAGES: "PREVIEW_IMAGES",
  SELECTED_IMAGES: "SELECTED_IMAGES",
  PDF_GENERATED: "PDF_GENERATED",
  SUBMITTED: "SUBMITTED",
});

export const COURSE_QUESTION_TYPES = Object.freeze({
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  SINGLE_CHOICE: "SINGLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  TEXT: "TEXT",
  ORDERING: "ORDERING",
});

export const HOMEWORK_TYPES = Object.freeze({
  VIDEO: "VIDEO",
  SUMMARY: "SUMMARY",
});

export const COURSE_PROGRESS_STATUSES = Object.freeze({
  COMPLETED: "COMPLETED",
});

export const MY_DAY_URGENCY = Object.freeze({
  DUE: "DUE",
  OVERDUE: "OVERDUE",
  COMPLETED: "COMPLETED",
});

export const PUBLIC_UPLOAD_PURPOSES = Object.freeze({
  PUBLIC_LEAD: "PUBLIC_LEAD",
  IMAGE_SESSION: "IMAGE_SESSION",
  CONTRACT: "CONTRACT",
  CHAT: "CHAT",
  CALENDAR: "CALENDAR",
});

export const TELEGRAM_AUTH_STATES = Object.freeze({
  INIT: "INIT",
  AWAIT_CODE: "AWAIT_CODE",
  AWAIT_PASSWORD: "AWAIT_PASSWORD",
  PASSWORD_VERIFIED: "PASSWORD_VERIFIED",
  REQUIRE_PASSWORD: "REQUIRE_PASSWORD",
  AWAIT_TO_REWRITE_2FA_PASSWORD: "AWAIT_TO_REWRITE_2FA_PASSWORD",
  SUCCESS: "SUCCESS",
  PHONE_NUMBER: "PHONE_NUMBER",
});

export const LEAD_COCKPIT_ACTION_KINDS = Object.freeze({
  OPEN_PAYMENT: "OPEN_PAYMENT",
  OPEN_CALL: "OPEN_CALL",
  OPEN_MEETING: "OPEN_MEETING",
  GOTO_TAB: "GOTO_TAB",
  OPEN_PRICE_OFFER: "OPEN_PRICE_OFFER",
  OPEN_STATUS: "OPEN_STATUS",
});

export const MY_DAY_SIGNAL_TYPES = Object.freeze({
  WORK_STAGE: "WORK_STAGE",
  LEAD_STALE_TEAM: "LEAD_STALE_TEAM",
  LEAD_UNCLAIMED_AGING: "LEAD_UNCLAIMED_AGING",
  CALL_OVERDUE_TEAM: "CALL_OVERDUE_TEAM",
  CONTRACT_SIGNING_STALLED: "CONTRACT_SIGNING_STALLED",
  REP_OVER_CAPACITY: "REP_OVER_CAPACITY",
  DELIVERY_DUE_SOON_TEAM: "DELIVERY_DUE_SOON_TEAM",
  DELIVERY_OVERDUE_TEAM: "DELIVERY_OVERDUE_TEAM",
});

export const INTEGRATION_ERROR_CODES = Object.freeze({
  AUTH_KEY_UNREGISTERED: "AUTH_KEY_UNREGISTERED",
});

export const COURSE_ROLES = Object.freeze({
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  STAFF: "STAFF",
  THREE_D_DESIGNER: "THREE_D_DESIGNER",
  TWO_D_DESIGNER: "TWO_D_DESIGNER",
  TWO_D_EXECUTOR: "TWO_D_EXECUTOR",
  ACCOUNTANT: "ACCOUNTANT",
});

export const NOTIFICATION_TYPES = Object.freeze({
  NEW_NOTE: "NEW_NOTE",
  CALL_REMINDER_CREATED: "CALL_REMINDER_CREATED",
  CALL_REMINDER_STATUS: "CALL_REMINDER_STATUS",
  PRICE_OFFER_SUBMITTED: "PRICE_OFFER_SUBMITTED",
  NEW_FILE: "NEW_FILE",
  LEAD_CREATED: "LEAD_CREATED",
  LEAD_SUBMITTED: "LEAD_SUBMITTED",
  LEAD_STATUS_CHANGE: "LEAD_STATUS_CHANGE",
  LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
  LEAD_UPDATED: "LEAD_UPDATED",
  FINAL_PRICE_ADDED: "FINAL_PRICE_ADDED",
  LEAD_ASSIGNED: "LEAD_ASSIGNED",
  LEAD_TRANSFERRED: "LEAD_TRANSFERRED",
  TELEGRAM_REAUTH_NEEDED: "TELEGRAM_REAUTH_NEEDED",
  MY_DAY_DIGEST: "MY_DAY_DIGEST",
});

export const NOTIFICATION_CONTENT_TYPES = Object.freeze({
  TEXT: "TEXT",
  HTML: "HTML",
});

// Single-language form validation text shared by both Next.js applications.
// API validation still returns language-neutral codes from validationMessagesCodes.
export const FORM_VALIDATION_MESSAGES = Object.freeze({
  ENTER_EMAIL: "Please enter your email",
  ENTER_EMAIL_ADDRESS: "Please enter an email address",
  INVALID_EMAIL_ADDRESS: "Please enter a valid email address",
  ENTER_PASSWORD: "Please enter your password",
  ENTER_A_PASSWORD: "Please enter a password",
  PASSWORD_COMPLEXITY:
    "Password must contain at least one uppercase letter, one lowercase letter, and one number, and be at least 8 characters long",
  CONFIRM_PASSWORD: "Please confirm your password",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
  DATE_REQUIRED: "Date is required",
  AMOUNT_REQUIRED: "Amount is required",
  PAYMENT_CATEGORY: "Payment category",
  ATTACHMENT_REQUIRED: "Attachment is required",
  ENTER_BASE_SALARY: "Please enter a Base salary",
  ENTER_BASE_WORK_HOURS: "Please enter a Base work hours",
  ENTER_TAX_AMOUNT: "Please enter a tax amount",
  ENTER_NAME: "Please enter a name",
  ENTER_NUMBER: "Please enter a number",
  ENTER_DESCRIPTION: "Please enter a description",
  SELECT_STYLE: "Please select a style",
  SELECT_SPACE: "Please select at least one space",
  UPLOAD_IMAGE: "Please upload an image file",
  FILL_ALL_TITLES: "Please fill all titles in all languages",
  SELECT_TYPE: "Please select a type",
  FILL_ALL_DESCRIPTIONS: "Please fill all descripitons in all languages",
  SELECT_TEMPLATE: "Please select a template",
  NOTHING_TO_UPDATE: "No thing to update",
  PASSWORD_RULE:
    "The password must contain an uppercase letter, a lowercase letter, a number, and be at least 8 characters long",
});

export const formatAmountExceedsRemaining = (amountLeft) =>
  `Error amount left is more than input ,Amount left is :${amountLeft}`;

export const USER_FEEDBACK_MESSAGES = Object.freeze({
  FILL_ALL_FIELDS_BEFORE_GENERATING_SLOTS:
    "Please fill all fields before generating slots.",
  STAFF_CANNOT_GENERATE_SLOTS:
    "Staff cannot generate slots. Please contact an admin.",
  STAFF_CANNOT_DELETE_SLOTS:
    "Staff cannot delete slots. Please contact an admin.",
  FAILED_TO_FETCH_SLOTS: "Failed to fetch slots. Please try again.",
  FILE_MUST_BE_PDF: "The file must be a PDF.",
  FILE_MUST_BE_IMAGE: "The file must be an image.",
  FILE_TYPE_UNSUPPORTED: "Unsupported file type. Upload an image or PDF.",
  TOTAL_HOURS_MUST_BE_POSITIVE: "Total hours worked must be greater than 0",
  NET_SALARY_MUST_BE_POSITIVE: "Net salary must be greater than 0",
  SELECT_PAYMENT_DATE: "Please select a payment date",
  WRITE_CALL_RESULT: "Write the result of the call",
  PICK_NEXT_TOUCHPOINT: "Pick a time for the next touchpoint",
  WRITE_NO_FOLLOWUP_REASON: "Write why no follow-up is needed",
  ONE_NOTE_MAX: "You can't upload more than one note",
  NOTE_OR_TITLE_REQUIRED: "You must enter note or title",
  FILE_REQUIRED: "You must upload file",
  PDF_TITLE_REQUIRED: "Please enter a title for the PDF",
  PDF_UPLOAD_REQUIRED: "You must upload a pdf",
  COMMISSIONS_LOAD_FAILED: "Failed to load commissions",
  VALID_AMOUNT_REQUIRED: "Please enter a valid amount",
  NAME_CANNOT_BE_EMPTY: "Name cannot be empty",
  NO_CHANGES_MADE: "No changes made",
  PAYMENT_REASON_AND_PRICE_REQUIRED: "You must enter payment reason and price",
  PRICE_MUST_BE_POSITIVE: "You must a price bigger than 0",
  FILL_ALL_INPUTS: "You must fill all the inputs",
  NO_FILES_TO_UPLOAD: "No files to upload",
  TITLE_REQUIRED: "Title is required",
  DEPARTMENT_REQUIRED: "At least one department must be selected",
  RECHECK_FIELDS: "Please recheck the fields",
  PAYMENT_REASONS_REQUIRED: "Please fill in all payment reasons",
  VALID_AGREED_PRICE_REQUIRED:
    "Please enter a valid price agreed upon by the client.",
  DISCOUNT_RANGE_INVALID: "Discount must be less than 100 or more than 0",
  PERMISSION_DENIED: "You do not have permission to perform this action.",
  COURSE_TITLE_REQUIRED: "Course title is required",
  TEST_VALID_QUESTION_REQUIRED:
    "Add at least one valid question before publishing this test.",
  REQUIRED_FIELDS: "Please fill in all required fields",
  CHAT_ROOMS_LOAD_FAILED: "Failed to fetch chat rooms",
  FILL_ALL_LANGUAGES: "Please fill the data in all language",
  SIGN_BEFORE_APPROVING: "Please sign before approving.",
  NOTE_CONTENT_REQUIRED: "You must write something in the note to create new one",
  NOTE_REQUIRED: "You must enter note",
  SELECT_FILE: "Please select a file.",
  SERVER_UNREACHABLE: "Couldn't reach the server. Check your connection and retry.",
  GROUP_TITLE_REQUIRED: "Group title is required",
  SELECT_DELIVERY_DATE: "Please select a delivery date.",
  APPROVAL_UPDATE_FAILED: "Failed to update approval status",
  USER_ALREADY_HAS_LESSON_ACCESS: "User already has access to this lesson",
  QUESTION_TEXT_REQUIRED: "Question text is required",
  QUESTION_TYPE_REQUIRED: "Question type is required",
  QUESTION_CHOICES_MIN_TWO: "At least 2 choices are required",
  QUESTION_CHOICES_TEXT_REQUIRED: "All choices must have text",
  QUESTION_CHOICES_UNIQUE: "Answer choices must be unique",
  ORDERING_POSITIONS_UNIQUE:
    "Every ordering choice must have a unique position",
  CORRECT_ANSWER_REQUIRED: "Select at least one correct answer",
  EXACTLY_ONE_CORRECT_ANSWER_REQUIRED: "Select exactly one correct answer",
  LEAD_ACCESS_DENIED_OR_MISSING:
    "You are not allowed to access this page or the lead doesn't exist",
  TELEGRAM_CODE_EXPIRED:
    "The code you entered has expired. Please request a new code.",
  TELEGRAM_SESSION_PASSWORD_INVALID:
    "Incorrect password. The session key is invalid — please re-enter your password.",
  TELEGRAM_STEP_FAILED:
    "We couldn't complete this step. Please check your input and try again.",
  PAYMENT_STAGE_CHANGE_DENIED:
    "You are not allowed to change 3D stages; only payment levels can be changed.",
  COMMISSION_CREATE_FAILED: "Failed to create commission",
  INVALID_PHONE: "Invalid phone",
  FILL_ALL_FIELDS: "Please fill all the fields.",
  SUBMIT_REQUEST_FAILED: "Unable to submit request",
  CHAT_FILES_LOAD_FAILED: "Failed to fetch files",
  CHAT_FILES_FETCH_ERROR: "Error fetching files",
  VOICE_RECORDING_UNSUPPORTED:
    "Voice recording is not supported in this browser.",
  MICROPHONE_UNAVAILABLE: "Microphone permission denied or unavailable.",
  RECORDING_STOP_FAILED: "Failed to stop recording.",
  VOICE_UPLOAD_FAILED: "Failed to upload voice note.",
  VOICE_SEND_FAILED: "Failed to send voice note.",
  CHAT_MESSAGE_SEND_FAILED: "Failed to send message",
  UPDATE_ADMIN_EXCLUSIVE:
    "If you select Admin, you can't share this with any other department",
  UPDATE_ADMIN_UNSELECT_REQUIRED:
    "You have to unselect Admin if you want to share with other departments",
  MEETING_TOKEN_INVALID:
    "Invalid or expired token please ask customer support to resend the link",
  SLOT_DETAILS_LOAD_FAILED: "Failed to fetch slot details. Please try again.",
  TASK_SERVER_TIMEOUT:
    "The server didn't respond in time. Please retry — if this keeps happening the tasks service may be down.",
  TASK_LOAD_FAILED: "Unable to load this task.",
  USER_LOAD_FAILED: "Unable to load this user.",
  PROFILE_LOAD_FAILED: "Failed to load profile.",
  GOOGLE_CONNECTION_FAILED: "Google connection failed. Please try again.",
  PROFILE_UPDATE_FAILED: "Failed to update profile.",
  GOOGLE_CONNECT_FAILED: "Failed to connect Google.",
  GOOGLE_DISCONNECT_FAILED: "Failed to disconnect Google.",
});

export const CLIENT_CONTRACT_FEEDBACK_MESSAGES = Object.freeze({
  SIGN_BEFORE_SAVING: Object.freeze({
    en: "Please sign before saving.",
    ar: "يرجى التوقيع قبل الحفظ.",
  }),
  SIGNATURE_READ_FAILED: Object.freeze({
    en: "Could not read the signature.",
    ar: "تعذر قراءة التوقيع.",
  }),
  SIGNATURE_UPLOAD_FAILED: Object.freeze({
    en: "Failed to upload signature.",
    ar: "فشل رفع التوقيع.",
  }),
  SIGNATURE_IMAGE_REQUIRED: Object.freeze({
    en: "Please choose a signature image.",
    ar: "اختر صورة للتوقيع.",
  }),
  SIGNATURE_IMAGE_PROCESSING_FAILED: Object.freeze({
    en: "Error processing the image. Try another image or crop more tightly.",
    ar: "خطأ أثناء معالجة الصورة. جرّب صورة أخرى أو قصّها بشكل أوضح.",
  }),
  SIGNATURE_PREVIEW_REQUIRED: Object.freeze({
    en: "No preview generated yet.",
    ar: "لا توجد معاينة جاهزة.",
  }),
});

export const localizedClientContractFeedback = (message, language) =>
  message?.[language === "ar" ? "ar" : "en"] ?? "";

export const formatCommissionRemainingBalance = (remainingAmount) =>
  `Amount cannot exceed the remaining balance of ${remainingAmount}`;

export const formatPaymentsTotalMismatch = (totalPayments, totalAmount) =>
  `The total payments (${totalPayments}) do not match the final price agreed upon the client (${totalAmount}).`;

export const formatTaskPriorityChangeDenied = (name) =>
  `You are not allowed to change this ${name} priority. Only ${name} status can be changed.`;

export const formatChatFileUploadFailed = (fileName) =>
  `Failed to upload ${fileName}`;

export const formatChatFileTooLarge = (fileName, maxMegabytes) =>
  `File "${fileName}" exceeds ${maxMegabytes}MB limit`;

export const formatChatFileTypeNotAllowed = (fileType) =>
  `File type "${fileType}" not allowed`;

export const formatFileSizeExceedsLimit = (limit) =>
  `File size exceeds the ${limit} limit.`;

export const formatNamedFileSizeExceedsLimit = (fileName, limit) =>
  `File "${fileName}" exceeds the ${limit} limit.`;

export const formatFileTypeNotAllowed = (allowedTypes) =>
  `File type not allowed. Allowed types: ${allowedTypes.join(", ")}.`;

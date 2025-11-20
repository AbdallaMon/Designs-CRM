import {
  AiOutlineEdit,
  AiOutlineFileText,
  AiOutlineUserAdd,
} from "react-icons/ai";
import { BiNote, BiTransfer } from "react-icons/bi";
import {
  MdAttachMoney,
  MdBlock,
  MdCall,
  MdNotAccessible,
} from "react-icons/md";
import {
  FaBullhorn,
  FaCalculator,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaClipboardList,
  FaCube,
  FaCubes,
  FaFileUpload,
  FaFlagCheckered,
  FaHandshake,
  FaProjectDiagram,
  FaRulerCombined,
  FaSpinner,
  FaTimesCircle,
  FaTools,
} from "react-icons/fa";
import React from "react";

export const NotificationType = {
  NEW_LEAD: "New Lead",
  LEAD_ASSIGNED: "Lead Assigned",
  LEAD_STATUS_CHANGED: "Lead Status Changed",
  LEAD_TRANSFERRED: "Lead Transferred",
  LEAD_UPDATED: "Lead Updated",
  LEAD_CONTACT: "Lead Contact",
  NOTE_ADDED: "Note Added",
  NEW_NOTE: "New Note",
  NEW_FILE: "New File",
  CALL_REMINDER_CREATED: "Call Reminder Created",
  CALL_REMINDER_STATUS: "Call Reminder Status",
  PRICE_OFFER_SUBMITTED: "Price Offer Submitted",
  PRICE_OFFER_UPDATED: "Price Offer Updated",
  FINAL_PRICE_ADDED: "Final Price Added",
  FINAL_PRICE_CHANGED: "Final Price Changed",
  OTHER: "Other",
};
export const PaymentStatus = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
  FULLY_PAID: "Fully paid",
  OVERDUE: "Overdue",
};
export const PaymentLevels = {
  LEVEL_1: "First Payment",
  LEVEL_2: "Second Payment",
  LEVEL_3: "Third Payment",
  LEVEL_4: "Fourth Payment",
  LEVEL_5: "Fifth Payment",
  LEVEL_6: "Sixth Payment",
  LEVEL_7_OR_MORE: "Seventh Payment or more",
};
export const LeadCategory = {
  CONSULTATION: "Consultation",
  DESIGN: "Design",
  OLDLEAD: "Lead via excel",
};
export const LeadType = {
  ROOM: "Room",
  PLAN: "Plan",
  CITY_VISIT: "City Visit",
  APARTMENT: "Apartment",
  CONSTRUCTION_VILLA: "Construction Villa",
  UNDER_CONSTRUCTION_VILLA: "Villa Under Construction",
  PART_OF_HOME: "Part of Home",
  COMMERCIAL: "Commercial",
  NONE: "None",
};
export const dictionary = {
  Consultation: "استشارة",
  Design: "تصميم",
  "Interior design": "تصميم داخلي",
  "How can we serve you?": "كيف يمكننا مساعدتك؟",
  "Choose from options": "اختر من الخيارات",
  "Complete your register": "اكمل بياناتك للتسجيل",
  Room: "غرفة",
  Plan: "مخطط",
  "City Visit": "زيارة ميدانية",
  Apartment: "شقة",
  "Construction Villa": "فيلا مسكونة",
  "Villa Under Construction": "فيلا تحت الإنشاء",
  "Part of Home": "جزء من المنزل",
  Commercial: "تجاري",
  "29 dollars – fully deducted upon contracting.":
    "٢٩ دولار تُخصم بالكامل عند التعاقد",
  "Book Now 29 DOLLAR": "احجز الان ٢٩ دولار",

  "Success!": "نجاح!",
  "Your time and ours is valuable, which is why this appointment is reserved for serious clients with a small symbolic fee that will be fully deducted upon signing a contract.":
    "وقتك ووقتنا ثمين، ولهذا الحجز مخصص للعملاء الجادين بمبلغ رمزي بسيط يُخصم بالكامل عند التعاقد",
  // Emirates
  "Out side emirates": "خارج الإمارات",
  Dubai: "دبي",
  "Abu Dhabi": "أبو ظبي",
  Sharjah: "الشارقة",
  Ajman: "عجمان",
  "Umm Al Quwain": "أم القيوين",
  "Ras Al Khaimah": "رأس الخيمة",
  Fujairah: "الفجيرة",
  "Khor Fakkan": "خورفكان",
  // Price Ranges

  //   "400,000 AED or less": "أقل من  400,000 درهم اماراتي",
  "300,000 AED or less": "أقل من  300,000 درهم اماراتي",
  "300,000 to 400,000 AED": "من 300,000 إلى 400,000  درهم اماراتي",
  "400,000 to 600,000 AED": "من 400,000 إلى 600,000  درهم اماراتي",
  "600,000 to 800,000 AED": "من 600,000 إلى 800,000 درهم اماراتي",
  "800,000 AED and above": "اكثر من 800,000 درهم اماراتي",
  "25,000 AED or less": "أقل من 25,000 درهم اماراتي",
  "25,000 to 45,000 AED": "من 25,000 إلى 45,000 درهم اماراتي",
  "45,000 to 65,000 AED": "من 45,000 إلى 65,000 درهم اماراتي",
  "65,000 to 85,000 AED": "من 65,000 إلى 85,000 درهم اماراتي",
  "85,000 AED and above": "اكثر من 85,000 درهم اماراتي",
  // Additional phrases
  "Please fill all the fields.": "يرجى ملء جميع الحقول.",
  "Minimum price cannot be greater than maximum price.":
    "لا يمكن أن يكون الحد الأدنى للسعر أكبر من الحد الأقصى للسعر.",
  "Uploading file": "جارٍ تحميل الملف",
  Submitting: "جارٍ الإرسال",
  "Complete Your Request": "أكمل طلبك",
  Name: "الاسم",
  Phone: "الهاتف",
  "Select Location": "اختر الموقع",
  "Price Range": "نطاق السعر",
  Min: "الحد الأدنى",
  Max: "الحد الأقصى",
  "Add an attachment": "أضف مرفقًا",
  Submit: "تسجيل",
  "Submit Now": "سجل الأن",
  "Book a meeting": "احجز اجتماع",
  "With eng ahmed": "مع م.أحمد المبيض",
  "Planning - Design - Implementation - Consulting":
    "تخطيط - تصميم - تنفيذ - استشارات",
  Success: "تم بنجاح!",
  "Thank you for your submission. We will contact you soon.":
    "شكرًا لك على تقديم طلبك. سنتواصل معك قريبًا.",
  "You got a 10% discount!": "لقد حصلت على خصم 10٪",
  "Sorry!": "عذرًا!",
  Budget: "الميزانية",
  "We do not provide services outside the UAE.":
    "نحن لا نقدم خدمات خارج الإمارات العربية المتحدة.",
  "We do not provide services outside the UAE, But we will contact you soon.":
    "نحن لا نقدم خدمات خارج الإمارات العربية المتحدة, لكن سنتواصل معك قريبا.",
  "Add an attachment (optional)": "اضف مرفقا (اختياري)",
  "Date of birth": "تاريخ الميلاد",
  Email: "البريد الالكتروني",
  "Select a price ranges": "اختر نطاق سعر",
  "Inside UAE": "داخل الامارات",
  "Out side UAE": "خارج الامارات",
  "How much would you like to invest in your dream home?":
    "كم حابب تستثمر في منزل احلامك؟",
  "Additional information (optional)": "معلومات اضافية (اختياري)",
  "Choose a time to contact you? (optional)":
    "اختيار وقت للتواصل معك (اختياري)",
  Country: "الدولة",
  "Invalid phone": "رقم الهاتف غير صحيح",
  Courses: "الدورات",
  "Engineers courses": "دورات للمهندسين",
  Books: "الكتب",
  Store: "المتجر",
  "Coming Soon": "سيتوفر قريبًا",
  "Choose a time between 10 AM to 7 PM.":
    "اختر وقت بين الساعة 10 صباحًا و 7 مساءً.",
  "Book Your Consultation": "احجز استشارتك",
  "Make your home your personal brand": "اجعل منزلك براندك الخاص",
  "You're just one step away from starting your project!":
    "خطوة واحدة تفصلنا عن بدء العمل على مشروعك!",
};

export const MediaType = {
  IMAGE: "Image",
  VIDEO: "Video",
};

export const Emirate = {
  DUBAI: "Dubai",
  ABU_DHABI: "Abu Dhabi",
  SHARJAH: "Sharjah",
  AJMAN: "Ajman",
  UMM_AL_QUWAIN: "Umm Al Quwain",
  RAS_AL_KHAIMAH: "Ras Al Khaimah",
  FUJAIRAH: "Fujairah",
  KHOR_FAKKAN: "Khor Fakkan",
};

export const UserRole = {
  ADMIN: "Admin",
  STAFF: "Staff",
};

export const ClientLeadStatus = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  INTERESTED: "Interested",
  NEEDS_IDENTIFIED: "Needs Identified",
  NEGOTIATING: "Negotiating",
  REJECTED: "Rejected",
  FINALIZED: "Finalized",
  CONVERTED: "Converted",
  ON_HOLD: "On Hold",
  ARCHIVED: "Archived",
};

// Work Stages for 3D Designer
export const ThreeDWorkStages = {
  CLIENT_COMMUNICATION: "Client Communication",
  DESIGN_STAGE: "Design Stage",
  FIRST_MODIFICATION: "First Modification",
  SECOND_MODIFICATION: "Second Modification",
  THIRD_MODIFICATION: "Third Modification",
  THREE_D_APPROVAL: "3D Approval",
};

// Work Stages for 2D Designer
export const TwoDWorkStages = {
  DRAWING_PLAN: "Drawing Plan",
  QUANTITY: "Quantity",
  FINAL_DELIVERY: "Final Delivery",
};
export const TwoDExacuterStages = {
  PROGRESS: "Progress",
  PRICING: "Pricing",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const KanbanLeadsStatus = {
  IN_PROGRESS: "In Progress",
  INTERESTED: "Interested",
  NEEDS_IDENTIFIED: "Needs Identified",
  NEGOTIATING: "Negotiating",
  LEADEXCHANGE: "Lead Exchange",
  FINALIZED: "Finalized",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
  ON_HOLD: "On Hold",
};

export const KanbanBeginerLeadsStatus = {
  IN_PROGRESS: "In Progress",
  INTERESTED: "Interested",
  NEEDS_IDENTIFIED: "Needs Identified",
  NEGOTIATING: "Negotiating",
  LEADEXCHANGE: "Lead Exchange",
};
export const CONTRACT_LEVELS = {
  LEVEL_1: "تحليل وتقييم",
  LEVEL_2: "تخطيط المساحات",
  LEVEL_3: "تصميم 3D",
  LEVEL_4: "مخططات تنفيذية",
  LEVEL_5: "حساب كميات واسعار",
  LEVEL_6: "تنفيذ",
  LEVEL_7: "تسويق",
};
// Projects

export const PROJECT_TYPES = [
  "3D_Designer",
  "3D_Modification",
  "2D_Study",
  "2D_Final_Plans",
  "2D_Quantity_Calculation",
];
export const PROJECT_TYPES_ENUM = {
  ThreeD: {
    DESIGNER: "3D_Designer",
    MODIFICATION: "3D_Modification",
  },
  TwoD: {
    STUDY: "2D_Study",
    FINAL_PLANS: "2D_Final_Plans",
    QUANTITY_CALCULATION: "2D_Quantity_Calculation",
  },
};
export const PROJECT_STATUSES = {
  "3D_Designer": [
    "To Do",
    "3D",
    "Render",
    "Modification",
    "Delivery",
    "Hold",
    "Completed",
  ],
  "3D_Modification": ["To Do", "Modification", "Completed"],
  "2D_Study": [
    "To Do",
    "Studying",
    "Modification",
    "Delivery",
    "Electricity",
    "Hold",
    "Completed",
  ],
  "2D_Final_Plans": ["To Do", "Started", "In Progress", "Completed"],
  "2D_Quantity_Calculation": ["To Do", "Started", "In Progress", "Completed"],
};
export const DEPARTMENTS = [
  { value: "3D_Designer", label: "3D Designer", color: "#FF6B35" },
  { value: "3D_Modification", label: "3D Modification", color: "#F7931E" },
  { value: "2D_Study", label: "2D Study", color: "#FFD23F" },
  { value: "2D_Final_Plans", label: "2D Final Plans", color: "#06FFA5" },
  {
    value: "2D_Quantity_Calculation",
    label: "2D Quantity Calculation",
    color: "#118AB2",
  },
  { value: "STAFF", label: "Staff", color: "#6C5CE7" },
  { value: "ADMIN", label: "Admin only", color: "#E74C3C" },
];

export const PRIORITY = ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"];
export const TASKSTATUS = ["TODO", "IN_PROGRESS", "DONE"];
export const priorityColors = {
  VERY_LOW: { bg: "#f5f5f5", color: "#666666", border: "#e0e0e0" },
  LOW: { bg: "#e8f5e8", color: "#2e7d32", border: "#4caf50" },
  MEDIUM: { bg: "#fff3e0", color: "#f57c00", border: "#ff9800" },
  HIGH: { bg: "#ffebee", color: "#d32f2f", border: "#f44336" },
  VERY_HIGH: { bg: "#f3e5f5", color: "#7b1fa2", border: "#9c27b0" },
};

export const taskStatusColors = {
  TODO: { bg: "#e3f2fd", color: "#1976d2", border: "#2196f3" },
  IN_PROGRESS: { bg: "#fff3e0", color: "#f57c00", border: "#ff9800" },
  DONE: { bg: "#e8f5e8", color: "#2e7d32", border: "#4caf50" },
};
export function getPriorityOrder(priority) {
  const priorityMap = {
    VERY_HIGH: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    VERY_LOW: 1,
  };
  return priorityMap[priority] || 3; // Default to MEDIUM
}
export const PageInfoType = {
  BEFORE_PATTERN: "BEFORE_PATTERN",
  BEFORE_MATERIAL: "BEFORE_MATERIAL",
  BEFORE_STYLE: "BEFORE_STYLE",
};
export const groupColors = {
  0: { bg: "#f8fbff", border: "#2196f3", text: "#1565c0" },
  1: { bg: "#faf8ff", border: "#9c27b0", text: "#7b1fa2" },
  2: { bg: "#f9fcf9", border: "#4caf50", text: "#2e7d32" },
  3: { bg: "#fffcf7", border: "#ff9800", text: "#f57c00" },
  4: { bg: "#fef7f9", border: "#e91e63", text: "#c2185b" },
  5: { bg: "#f7fcfc", border: "#26a69a", text: "#00695c" },
  6: { bg: "#fffef5", border: "#ffeb3b", text: "#f9a825" },
  7: { bg: "#f9fdf9", border: "#8bc34a", text: "#689f38" },
  8: { bg: "#fcfcfc", border: "#607d8b", text: "#455a64" },
  9: { bg: "#f9faff", border: "#5c6bc0", text: "#3f51b5" },
};
export const statusColors = {
  IN_PROGRESS: "#0d9488",
  INTERESTED: "#10b981",
  NEEDS_IDENTIFIED: "#f59e0b",
  NEGOTIATING: "#3b82f6",
  LEADEXCHANGE: "#f97316",
  REJECTED: "#ef4444",
  FINALIZED: "#0f766e",
  ARCHIVED: "0f757d",
  CLIENT_COMMUNICATION: "#3b82f6",
  DESIGN_STAGE: "#10b981",
  THREE_D_STAGE: "#f59e0b",
  THREE_D_APPROVAL: "#0d9488",
  DRAWING_PLAN: "#f97316",
  FINAL_DELIVERY: "#0f766e",
  FIRST_MODIFICATION: "#3b82f6",
  SECOND_MODIFICATION: "#10b981",
  THIRD_MODIFICATION: "#f59e0b",
  PROGRESS: "#0d9488",
  PRICING: "#3b82f6",
  ACCEPTED: "#10b981",
  REJECTED: "#ef4444",
  QUANTITY: "#f97316",
  LEVEL_1: "#f97316", // First Payment - Orange
  LEVEL_2: "#f59e0b", // Second Payment - Yellow
  LEVEL_3: "#10b981", // Third Payment - Green
  LEVEL_4: "#3b82f6", // Fourth Payment - Blue
  LEVEL_5: "#0d9488", // Fifth Payment - Teal
  LEVEL_6: "#0f766e", // Sixth Payment - Dark Teal
  LEVEL_7_OR_MORE: "#ef4444", // Seventh

  VERY_LOW: "#d1d5db", // Light Gray
  LOW: "#f59e0b", // Yellow
  MEDIUM: "#3b82f6", // Blue
  HIGH: "#10b981", // Green
  VERY_HIGH: "#ef4444", // Red
  TODO: "#f97316", // Orange
  IN_PROGRESS: "#0d9488", // Teal
  DONE: "#10b981", // Green

  "To Do": "#f59e0b", // Yellow
  "3D": "#10b981", // Green
  Render: "#3b82f6", // Blue
  Delivery: "#0d9488", // Teal
  Hold: "#ef4444", // Red
  Completed: "#10b981", // Green
  Modification: "#f97316", // Orange
  Studying: "#3b82f6", // Blue
  Electricity: "#a9bd3aff",
  Delivery: "#0d9488", // Teal
  Started: "#3b82f6", // Blue
  "In Progress": "#0d9488", // Teal
};

export const KanbanStatusArray = [
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
  "FINALIZED",
  "REJECTED",
  "ARCHIVED",
];
export const AccountantKanbanStatusArray = [
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
  "FINALIZED",
  "REJECTED",
];

export const initialPageLimit = 10;
export const totalLimitPages = [10, 20, 50, 100];
export const simpleModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxHeight: "90%",
  overflow: "auto",
  width: {
    xs: "95%",
    sm: "80%",
    md: "60%",
  },
  maxWidth: {
    md: "600px",
  },
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

export const notificationIcons = {
  NEW_LEAD: <AiOutlineUserAdd size={24} />,
  LEAD_ASSIGNED: <AiOutlineUserAdd size={24} />,
  LEAD_STATUS_CHANGE: <AiOutlineFileText size={24} />,
  LEAD_TRANSFERRED: <BiTransfer size={24} />,
  LEAD_UPDATED: <AiOutlineEdit size={24} />,
  LEAD_CONTACT: <MdAttachMoney size={24} />,
  NOTE_ADDED: <BiNote size={24} />,
  NEW_NOTE: <BiNote size={24} />,
  NEW_FILE: <FaFileUpload size={24} />,
  CALL_REMINDER_CREATED: <MdCall size={24} />,
  CALL_REMINDER_STATUS: <MdCall size={24} />,
  PRICE_OFFER_SUBMITTED: <MdAttachMoney size={24} />,
  PRICE_OFFER_UPDATED: <MdAttachMoney size={24} />,
  FINAL_PRICE_ADDED: <MdAttachMoney size={24} />,
  FINAL_PRICE_CHANGED: <MdAttachMoney size={24} />,
  OTHER: <AiOutlineFileText size={24} />,
};

export const userRoles = [
  { value: "STAFF", label: "Sales" },
  { value: "SUPER_SALES", label: "Super sales" },
  { value: "CONTACT_INITIATOR", label: "Contact initiator" },
  { value: "THREE_D_DESIGNER", label: "3D Designer" },
  { value: "TWO_D_DESIGNER", label: "2D Designer" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "TWO_D_EXECUTOR", label: "Two d executor" },
  { value: "SUPER_ADMIN", label: "Admin" },
];

export const userRolesEnum = {
  STAFF: "Staff",
  THREE_D_DESIGNER: "3D Designer",
  TWO_D_DESIGNER: "2D Designer",
  ACCOUNTANT: "Accountant",
  TWO_D_EXECUTOR: "Two d executor",
  SUPER_ADMIN: "Admin",
  SUPER_SALES: "Super sales",
  CONTACT_INITIATOR: "Contact initiator",
};

export const countriesByRegion = {
  Asia: [
    "Afghanistan",
    "Armenia",
    "Azerbaijan",
    "Bahrain",
    "Bangladesh",
    "Bhutan",
    "Brunei",
    "Cambodia",
    "China",
    "Cyprus",
    "Georgia",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Israel",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Lebanon",
    "Malaysia",
    "Maldives",
    "Mongolia",
    "Myanmar",
    "Nepal",
    "North Korea",
    "Oman",
    "Pakistan",
    "Palestine",
    "Philippines",
    "Qatar",
    "Saudi Arabia",
    "Singapore",
    "South Korea",
    "Sri Lanka",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Thailand",
    "Timor-Leste",
    "Turkey",
    "Turkmenistan",
    "United Arab Emirates",
    "Uzbekistan",
    "Vietnam",
    "Yemen",
  ],
  Europe: [
    "Albania",
    "Andorra",
    "Austria",
    "Belarus",
    "Belgium",
    "Bosnia and Herzegovina",
    "Bulgaria",
    "Croatia",
    "Czech Republic",
    "Denmark",
    "Estonia",
    "Finland",
    "France",
    "Germany",
    "Greece",
    "Hungary",
    "Iceland",
    "Ireland",
    "Italy",
    "Kosovo",
    "Latvia",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Malta",
    "Moldova",
    "Monaco",
    "Montenegro",
    "Netherlands",
    "North Macedonia",
    "Norway",
    "Poland",
    "Portugal",
    "Romania",
    "Russia",
    "San Marino",
    "Serbia",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Sweden",
    "Switzerland",
    "Ukraine",
    "United Kingdom",
    "Vatican City",
  ],
  Africa: [
    "Algeria",
    "Angola",
    "Benin",
    "Botswana",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cameroon",
    "Central African Republic",
    "Chad",
    "Comoros",
    "Congo",
    "Djibouti",
    "Egypt",
    "Equatorial Guinea",
    "Eritrea",
    "Eswatini",
    "Ethiopia",
    "Gabon",
    "Gambia",
    "Ghana",
    "Guinea",
    "Guinea-Bissau",
    "Kenya",
    "Lesotho",
    "Liberia",
    "Libya",
    "Madagascar",
    "Malawi",
    "Mali",
    "Mauritania",
    "Mauritius",
    "Morocco",
    "Mozambique",
    "Namibia",
    "Niger",
    "Nigeria",
    "Rwanda",
    "Sao Tome and Principe",
    "Senegal",
    "Seychelles",
    "Sierra Leone",
    "Somalia",
    "South Africa",
    "South Sudan",
    "Sudan",
    "Tanzania",
    "Togo",
    "Tunisia",
    "Uganda",
    "Zambia",
    "Zimbabwe",
  ],
  "North America": [
    "Antigua and Barbuda",
    "Bahamas",
    "Barbados",
    "Belize",
    "Canada",
    "Costa Rica",
    "Cuba",
    "Dominica",
    "Dominican Republic",
    "El Salvador",
    "Grenada",
    "Guatemala",
    "Haiti",
    "Honduras",
    "Jamaica",
    "Mexico",
    "Nicaragua",
    "Panama",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Trinidad and Tobago",
    "United States",
  ],
  "South America": [
    "Argentina",
    "Bolivia",
    "Brazil",
    "Chile",
    "Colombia",
    "Ecuador",
    "Guyana",
    "Paraguay",
    "Peru",
    "Suriname",
    "Uruguay",
    "Venezuela",
  ],
  Oceania: [
    "Australia",
    "Fiji",
    "Kiribati",
    "Marshall Islands",
    "Micronesia",
    "Nauru",
    "New Zealand",
    "Palau",
    "Papua New Guinea",
    "Samoa",
    "Solomon Islands",
    "Tonga",
    "Tuvalu",
    "Vanuatu",
  ],
};

export const personalityEnum = {
  EXPRESSIVE: "ثرثار / اجتماعي",
  ANALYTICAL: "التحليلي الدقيق",
  INTROVERTED: "المنطوي / المتحفظ",
  DRIVER: "القيادي الحاسم",
};

export const meetingTypes = [
  { value: "SALES_MEETING", label: "Sales meeting" },
  { value: "DESIGN_MEETING", label: "Design consultant meeting" },
];

export const salesStageEnum = [
  { key: "NOT_INITIATED", label: "لم يبدأ بعد", color: "#f5f5f5" },
  { key: "INITIAL_CONTACT", label: "اتصال مبدائي بالعميل", color: "#e3f2fd" },
  {
    key: "SOCIAL_MEDIA_CHECK",
    label: "محاولة الحصول علي احد صفحات شخصية للعميل من خلال سوشيال ميديا",
    color: "#e8f5e8",
  },
  {
    key: "WHATSAPP_QA",
    label: "اجابة عن اسئلة العميل من خلال واتس اب",
    color: "#fff3e0",
  },
  {
    key: "MEETING_BOOKED",
    label: "حجز اجتماع مع العميل لشرحة الية العمل واستخدام اسلوب SPIN",
    color: "#fce4ec",
  },
  {
    key: "CLIENT_INFO_UPLOADED",
    label: "رفع ملفات وملخص اجوبة العميل علي السيستم",
    color: "#f3e5f5",
  },
  {
    key: "CONSULTATION_BOOKED",
    label: "حجز موعد مع استشاري تصميم",
    color: "#e0f2f1",
  },
  {
    key: "FOLLOWUP_AFTER_MEETING",
    label: "تواصل مع العميل بعد الاجتماع",
    color: "#fff8e1",
  },
  {
    key: "HANDLE_OBJECTIONS",
    label: "تعامل مع اعتراضات العميل",
    color: "#ffebee",
  },
  { key: "DEAL_CLOSED", label: "اغلاق الصفقة", color: "#e8f5e8" },
  {
    key: "AFTER_SALES_FOLLOWUP",
    label: "متابعة العميل ما بعد البيع",
    color: "#e3f2fd",
  },
];

export const FAB_QUESTIONS_WITH_ANSWERS_AR = {
  "هل في بيت او فندق دخلته وحسيت حالك مرتاح فيه ؟":
    "هاد الشعور هو تمامًا اللي بنشتغل عليه… راحة ما بتعرف سببها، بس بتحسها بكل زاوية.",
  "من وين عم تأخذ الهامك وافكارك لتصميم البيت":
    "حلو… من هون بنقدر نبلّش نكوّن ستايل خاص فيك، مو مجرد تجميع صور.",
  "في حدا عم يساعدك في اتخاذ القرار ولا الأمر بالكامل عندك":
    "ممتاز، هيك منقدر نراعي كل الآراء من البداية، ويصير القرار النهائي سلس ومريح.",
  "شو اكتر غرفة او مساحة حاسسها تمام حاليا":
    "واضح إن فيها شي مريح لإلك… منقدر نحلل شو السبب ونكرره بباقي المساحات.",
  "شو اكثر غرفة حاسس بدها إعادة نظر":
    'تمام… الغرف يلي بتحس فيها شي "مش مريح" هي أول شي بنبدأ فيه، ونحلّها بدون ما تغيّر هويتك.',
  "هل حاسس مساحاتك مش مستغلة بشكل كويس":
    "فعليًا أغلب البيوت الجديدة بيصير فيها هالشي… بس لما كل متر يكون محسوب، بتحس كأنك زدت مساحة بدون ما تبني زيادة",
  "هل لك تجربة سابقة بالتصميم وبالتنفيذ وكيف كانت كمية التطابق ؟":
    "دائما تصميم بينعمل وأول خطوة منفكر فيها هيي التنفيذ بحيث يتطابق معاه ويطلع بالنهاية نفس تصميم",
  "لو تركنا الوضع على ما هو كيف ممكن يأثر عليك":
    "بنشتغل على توزيع مدروس بيمنع أخطاء ما بتنشاف إلا بعد التنفيذ بتتجنّب ترميم وتعديلات مكلفة",
  "برأيك لو ما انتبهنا لتوزيع الكهرباء والسباكة بشكل مثل فنادق هل ح يأثر على راحتكم ؟":
    "نحنا منوزّع الكهربا والسباكة حسب استخدامك الفعلي… هيك كل نقطة بتخدمك صح، وبتتفادى الإزعاجات اليومية يلي الناس ما بتنتبه إلها إلا بعد ما تسكن.",
  "لو صار كل البيت مثل غرفة ../يلي ذكرها ب البند 4 خانة الوضع الحالي / هل رح تشعر ب راحة اكبر ؟":
    "نحنا منحلل شو خلاك ترتاح بهالغرفة… ومنكرّر نفس التوازن بباقي البيت، لتصير كل زاوية فيها إحساس مريح ومتناسق",
  "اذا اشتغل معك فريق فاهم وعندك خطة واضحة من البداية للنهاية,كيف بتحس راح يكون الموضوع؟":
    "ومع فريق فاهم وخطة واضحة… بتكون فعليًا بلّشت أول خطوة صحيحة. اجتماعك الجاي مع مستشار التصميم هو اللحظة يلي بيتحوّل فيها كل شي بخيالك لخطة حقيقية نبدأ فيها سوا",
};

export const LEAD_SOURCE_LABELS = {
  INSTAGRAM: { en: "Instagram", ar: "انستغرام" },
  TIKTOK: { en: "TikTok", ar: "تيك توك" },
  TV: { en: "TV", ar: "تلفاز" },
  FACEBOOK: { en: "Facebook", ar: "فيسبوك" },
  YOUTUBE: { en: "YouTube", ar: "يوتيوب" },
  GOOGLE: { en: "Google", ar: "جوجل" },
  INTERIOR_MAGAZINE_SITE: {
    en: "Interior design magazine/site",
    ar: "مجلة/موقع تصميم داخلي",
  },
  REFERRAL: {
    en: "Referral from friend or previous client",
    ar: "توصية من صديق أو عميل سابق",
  },
  OTHER: { en: "Other", ar: "أخرى" },
};

export const contractStatus = {
  IN_PROGRESS: {
    name: "In progress",
    pallete: "warning",
    shade: "main",

    icon: FaSpinner,
  },
  COMPLETED: {
    name: "Completed",
    pallete: "success",
    shade: "main",

    icon: FaCheckCircle,
  },
  CANCELLED: {
    name: "Cancelled",
    pallete: "error",
    shade: "main",
    icon: FaTimesCircle,
  },
};

export const contractLevel = {
  null: {
    name: "لا يوجد مرحلة حاليا",
    nameAr: "لا يوجد مرحلة حاليا",
    nameEn: "No current active stage",
    shade: "main",
    pallete: "error",

    icon: MdBlock,
  },
  LEVEL_1: {
    name: "تحليل وتقييم",
    nameAr: "تحليل وتقييم",
    nameEn: "Analysis & Assessment",
    shade: "main",
    pallete: "primary",
    icon: FaChartLine,
  },
  LEVEL_2: {
    name: "تخطيط المساحات",
    nameAr: "تخطيط المساحات",
    nameEn: "Space Planning",
    shade: "main",
    pallete: "info",

    icon: FaRulerCombined,
  },
  LEVEL_3: {
    name: "تصميم 3D",
    nameAr: "تصميم 3D",
    nameEn: "3D Design",
    shade: "main",
    pallete: "secondary",

    icon: FaCube,
  },
  LEVEL_4: {
    name: "مخططات تنفيذية",
    nameAr: "مخططات تنفيذية",
    nameEn: "Working Drawings",
    shade: "main",
    pallete: "success",

    icon: FaProjectDiagram,
  },
  LEVEL_5: {
    name: "حساب كميات واسعار",
    nameAr: "حساب كميات واسعار",
    nameEn: "BOQ & Pricing",
    shade: "main",
    pallete: "warning",

    icon: FaCalculator,
  },
  LEVEL_6: {
    name: "تنفيذ",
    nameAr: "تنفيذ",
    nameEn: "Execution",
    shade: "main",
    pallete: "error",

    icon: FaTools,
  },
  LEVEL_7: {
    name: "تسويق",
    nameAr: "تسويق",
    nameEn: "Marketing",
    shade: "main",
    pallete: "info",
    icon: FaBullhorn,
  },
};

export const CONTRACT_LEVELSENUM = [
  {
    enum: "LEVEL_1",
    label: "تحليل وتقييم",
    labelAr: "تحليل وتقييم",
    labelEn: "Analysis & Assessment",
  },
  {
    enum: "LEVEL_2",
    label: "تخطيط المساحات",
    labelAr: "تخطيط المساحات",
    labelEn: "Space Planning",
  },
  {
    enum: "LEVEL_3",
    label: "تصميم 3D",
    labelAr: "تصميم 3D",
    labelEn: "3D Design",
  },
  {
    enum: "LEVEL_4",
    label: "مخططات تنفيذية",
    labelAr: "مخططات تنفيذية",
    labelEn: "Working Drawings",
  },
  {
    enum: "LEVEL_5",
    label: "حساب كميات واسعار",
    labelAr: "حساب كميات واسعار",
    labelEn: "BOQ & Pricing",
  },
  { enum: "LEVEL_6", label: "تنفيذ", labelAr: "تنفيذ", labelEn: "Execution" },
  { enum: "LEVEL_7", label: "تسويق", labelAr: "تسويق", labelEn: "Marketing" },
];

export const contractLevelStatus = {
  IN_PROGRESS: {
    name: "In progress",
    shade: "main",
    pallete: "warning",
    icon: FaSpinner,
  },
  COMPLETED: {
    name: "Completed",
    shade: "main",
    pallete: "success",

    icon: FaCheckCircle,
  },
  NOT_STARTED: {
    name: "Not started",
    shade: "main",
    pallete: "error",

    icon: FaTimesCircle,
  },
};

export const STAGE_STATUS_LABEL = {
  ar: {
    NOT_STARTED: "لم يبدأ",
    IN_PROGRESS: "قيد التنفيذ",
    COMPLETED: "تم الإنجاز",
  },
  en: {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
  },
};

export const STAGE_STATUS = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export const PAYMENT_STATUS_AR = {
  NOT_DUE: "غير مستحق",
  DUE: "مستحق",
  RECEIVED: "تم الاستلام",
  TRANSFERRED: "تم التحويل",
};

export const UAE_LABEL = {
  ar: "الإمارات العربية المتحدة",
  en: "United Arab Emirates",
};
export const EMIRATE_LABEL = {
  ar: {
    DUBAI: "دبي",
    ABU_DHABI: "أبوظبي",
    SHARJAH: "الشارقة",
    AJMAN: "عجمان",
    UMM_AL_QUWAIN: "أم القيوين",
    RAS_AL_KHAIMAH: "رأس الخيمة",
    FUJAIRAH: "الفجيرة",
    KHOR_FAKKAN: "خورفكان",
    OUTSIDE: "خارج الإمارات",
  },
  en: {
    DUBAI: "Dubai",
    ABU_DHABI: "Abu Dhabi",
    SHARJAH: "Sharjah",
    AJMAN: "Ajman",
    UMM_AL_QUWAIN: "Umm Al Quwain",
    RAS_AL_KHAIMAH: "Ras Al Khaimah",
    FUJAIRAH: "Fujairah",
    KHOR_FAKKAN: "Khor Fakkan",
    OUTSIDE: "Outside UAE",
  },
};

export const PAYMENT_CONDITION_LABEL = {
  ar: {
    SIGNATURE: "دفعة أولى عند توقيع العقد",
    DELIVERY: "دفعة عند التسليم",
    MILESTONE: "دفعة عند مرحلة محددة",
    DATE: "دفعة بتاريخ محدد",
  },
  en: {
    SIGNATURE: "Initial payment on contract signature",
    DELIVERY: "Payment on delivery",
    MILESTONE: "Payment at milestone",
    DATE: "Payment on specific date",
  },
};
export const COUNTRY_LABEL = {
  "United Arab Emirates": {
    ar: "الإمارات العربية المتحدة",
    en: "United Arab Emirates",
  },

  // Asia
  Afghanistan: { ar: "أفغانستان", en: "Afghanistan" },
  Armenia: { ar: "أرمينيا", en: "Armenia" },
  Azerbaijan: { ar: "أذربيجان", en: "Azerbaijan" },
  Bahrain: { ar: "البحرين", en: "Bahrain" },
  Bangladesh: { ar: "بنغلاديش", en: "Bangladesh" },
  Bhutan: { ar: "بوتان", en: "Bhutan" },
  Brunei: { ar: "بروناي", en: "Brunei" },
  Cambodia: { ar: "كمبوديا", en: "Cambodia" },
  China: { ar: "الصين", en: "China" },
  Cyprus: { ar: "قبرص", en: "Cyprus" },
  Georgia: { ar: "جورجيا", en: "Georgia" },
  India: { ar: "الهند", en: "India" },
  Indonesia: { ar: "إندونيسيا", en: "Indonesia" },
  Iran: { ar: "إيران", en: "Iran" },
  Iraq: { ar: "العراق", en: "Iraq" },
  Israel: { ar: "إسرائيل", en: "Israel" },
  Japan: { ar: "اليابان", en: "Japan" },
  Jordan: { ar: "الأردن", en: "Jordan" },
  Kazakhstan: { ar: "كازاخستان", en: "Kazakhstan" },
  Kuwait: { ar: "الكويت", en: "Kuwait" },
  Kyrgyzstan: { ar: "قرغيزستان", en: "Kyrgyzstan" },
  Laos: { ar: "لاوس", en: "Laos" },
  Lebanon: { ar: "لبنان", en: "Lebanon" },
  Malaysia: { ar: "ماليزيا", en: "Malaysia" },
  Maldives: { ar: "المالديف", en: "Maldives" },
  Mongolia: { ar: "منغوليا", en: "Mongolia" },
  Myanmar: { ar: "ميانمار", en: "Myanmar" },
  Nepal: { ar: "نيبال", en: "Nepal" },
  "North Korea": { ar: "كوريا الشمالية", en: "North Korea" },
  Oman: { ar: "عُمان", en: "Oman" },
  Pakistan: { ar: "باكستان", en: "Pakistan" },
  Palestine: { ar: "فلسطين", en: "Palestine" },
  Philippines: { ar: "الفلبين", en: "Philippines" },
  Qatar: { ar: "قطر", en: "Qatar" },
  "Saudi Arabia": { ar: "المملكة العربية السعودية", en: "Saudi Arabia" },
  Singapore: { ar: "سنغافورة", en: "Singapore" },
  "South Korea": { ar: "كوريا الجنوبية", en: "South Korea" },
  "Sri Lanka": { ar: "سريلانكا", en: "Sri Lanka" },
  Syria: { ar: "سوريا", en: "Syria" },
  Taiwan: { ar: "تايوان", en: "Taiwan" },
  Tajikistan: { ar: "طاجيكستان", en: "Tajikistan" },
  Thailand: { ar: "تايلاند", en: "Thailand" },
  "Timor-Leste": { ar: "تيمور الشرقية", en: "Timor-Leste" },
  Turkey: { ar: "تركيا", en: "Turkey" },
  Turkmenistan: { ar: "تركمانستان", en: "Turkmenistan" },
  Uzbekistan: { ar: "أوزبكستان", en: "Uzbekistan" },
  Vietnam: { ar: "فيتنام", en: "Vietnam" },
  Yemen: { ar: "اليمن", en: "Yemen" },

  // Europe
  Albania: { ar: "ألبانيا", en: "Albania" },
  Andorra: { ar: "أندورا", en: "Andorra" },
  Austria: { ar: "النمسا", en: "Austria" },
  Belarus: { ar: "بيلاروسيا", en: "Belarus" },
  Belgium: { ar: "بلجيكا", en: "Belgium" },
  "Bosnia and Herzegovina": {
    ar: "البوسنة والهرسك",
    en: "Bosnia and Herzegovina",
  },
  Bulgaria: { ar: "بلغاريا", en: "Bulgaria" },
  Croatia: { ar: "كرواتيا", en: "Croatia" },
  "Czech Republic": { ar: "جمهورية التشيك", en: "Czech Republic" },
  Denmark: { ar: "الدنمارك", en: "Denmark" },
  Estonia: { ar: "إستونيا", en: "Estonia" },
  Finland: { ar: "فنلندا", en: "Finland" },
  France: { ar: "فرنسا", en: "France" },
  Germany: { ar: "ألمانيا", en: "Germany" },
  Greece: { ar: "اليونان", en: "Greece" },
  Hungary: { ar: "المجر", en: "Hungary" },
  Iceland: { ar: "آيسلندا", en: "Iceland" },
  Ireland: { ar: "أيرلندا", en: "Ireland" },
  Italy: { ar: "إيطاليا", en: "Italy" },
  Kosovo: { ar: "كوسوفو", en: "Kosovo" },
  Latvia: { ar: "لاتفيا", en: "Latvia" },
  Liechtenstein: { ar: "ليختنشتاين", en: "Liechtenstein" },
  Lithuania: { ar: "ليتوانيا", en: "Lithuania" },
  Luxembourg: { ar: "لوكسمبورغ", en: "Luxembourg" },
  Malta: { ar: "مالطا", en: "Malta" },
  Moldova: { ar: "مولدوفا", en: "Moldova" },
  Monaco: { ar: "موناكو", en: "Monaco" },
  Montenegro: { ar: "الجبل الأسود", en: "Montenegro" },
  Netherlands: { ar: "هولندا", en: "Netherlands" },
  "North Macedonia": { ar: "مقدونيا الشمالية", en: "North Macedonia" },
  Norway: { ar: "النرويج", en: "Norway" },
  Poland: { ar: "بولندا", en: "Poland" },
  Portugal: { ar: "البرتغال", en: "Portugal" },
  Romania: { ar: "رومانيا", en: "Romania" },
  Russia: { ar: "روسيا", en: "Russia" },
  "San Marino": { ar: "سان مارينو", en: "San Marino" },
  Serbia: { ar: "صربيا", en: "Serbia" },
  Slovakia: { ar: "سلوفاكيا", en: "Slovakia" },
  Slovenia: { ar: "سلوفينيا", en: "Slovenia" },
  Spain: { ar: "إسبانيا", en: "Spain" },
  Sweden: { ar: "السويد", en: "Sweden" },
  Switzerland: { ar: "سويسرا", en: "Switzerland" },
  Ukraine: { ar: "أوكرانيا", en: "Ukraine" },
  "United Kingdom": { ar: "المملكة المتحدة", en: "United Kingdom" },
  "Vatican City": { ar: "مدينة الفاتيكان", en: "Vatican City" },

  // Africa
  Algeria: { ar: "الجزائر", en: "Algeria" },
  Angola: { ar: "أنغولا", en: "Angola" },
  Benin: { ar: "بنين", en: "Benin" },
  Botswana: { ar: "بوتسوانا", en: "Botswana" },
  "Burkina Faso": { ar: "بوركينا فاسو", en: "Burkina Faso" },
  Burundi: { ar: "بوروندي", en: "Burundi" },
  "Cabo Verde": { ar: "الرأس الأخضر", en: "Cabo Verde" },
  Cameroon: { ar: "الكاميرون", en: "Cameroon" },
  "Central African Republic": {
    ar: "جمهورية أفريقيا الوسطى",
    en: "Central African Republic",
  },
  Chad: { ar: "تشاد", en: "Chad" },
  Comoros: { ar: "جزر القمر", en: "Comoros" },
  Congo: { ar: "الكونغو", en: "Congo" },
  Djibouti: { ar: "جيبوتي", en: "Djibouti" },
  Egypt: { ar: "مصر", en: "Egypt" },
  "Equatorial Guinea": { ar: "غينيا الاستوائية", en: "Equatorial Guinea" },
  Eritrea: { ar: "إريتريا", en: "Eritrea" },
  Eswatini: { ar: "إسواتيني", en: "Eswatini" },
  Ethiopia: { ar: "إثيوبيا", en: "Ethiopia" },
  Gabon: { ar: "الغابون", en: "Gabon" },
  Gambia: { ar: "غامبيا", en: "Gambia" },
  Ghana: { ar: "غانا", en: "Ghana" },
  Guinea: { ar: "غينيا", en: "Guinea" },
  "Guinea-Bissau": { ar: "غينيا بيساو", en: "Guinea-Bissau" },
  Kenya: { ar: "كينيا", en: "Kenya" },
  Lesotho: { ar: "ليسوتو", en: "Lesotho" },
  Liberia: { ar: "ليبيريا", en: "Liberia" },
  Libya: { ar: "ليبيا", en: "Libya" },
  Madagascar: { ar: "مدغشقر", en: "Madagascar" },
  Malawi: { ar: "مالاوي", en: "Malawi" },
  Mali: { ar: "مالي", en: "Mali" },
  Mauritania: { ar: "موريتانيا", en: "Mauritania" },
  Mauritius: { ar: "موريشيوس", en: "Mauritius" },
  Morocco: { ar: "المغرب", en: "Morocco" },
  Mozambique: { ar: "موزمبيق", en: "Mozambique" },
  Namibia: { ar: "ناميبيا", en: "Namibia" },
  Niger: { ar: "النيجر", en: "Niger" },
  Nigeria: { ar: "نيجيريا", en: "Nigeria" },
  Rwanda: { ar: "رواندا", en: "Rwanda" },
  "Sao Tome and Principe": {
    ar: "ساو تومي وبرينسيبي",
    en: "Sao Tome and Principe",
  },
  Senegal: { ar: "السنغال", en: "Senegal" },
  Seychelles: { ar: "سيشل", en: "Seychelles" },
  "Sierra Leone": { ar: "سيراليون", en: "Sierra Leone" },
  Somalia: { ar: "الصومال", en: "Somalia" },
  "South Africa": { ar: "جنوب أفريقيا", en: "South Africa" },
  "South Sudan": { ar: "جنوب السودان", en: "South Sudan" },
  Sudan: { ar: "السودان", en: "Sudan" },
  Tanzania: { ar: "تنزانيا", en: "Tanzania" },
  Togo: { ar: "توغو", en: "Togo" },
  Tunisia: { ar: "تونس", en: "Tunisia" },
  Uganda: { ar: "أوغندا", en: "Uganda" },
  Zambia: { ar: "زامبيا", en: "Zambia" },
  Zimbabwe: { ar: "زيمبابوي", en: "Zimbabwe" },

  // North America
  "Antigua and Barbuda": { ar: "أنتيغوا وبربودا", en: "Antigua and Barbuda" },
  Bahamas: { ar: "جزر البهاما", en: "Bahamas" },
  Barbados: { ar: "بربادوس", en: "Barbados" },
  Belize: { ar: "بليز", en: "Belize" },
  Canada: { ar: "كندا", en: "Canada" },
  "Costa Rica": { ar: "كوستاريكا", en: "Costa Rica" },
  Cuba: { ar: "كوبا", en: "Cuba" },
  Dominica: { ar: "دومينيكا", en: "Dominica" },
  "Dominican Republic": { ar: "جمهورية الدومينيكان", en: "Dominican Republic" },
  "El Salvador": { ar: "السلفادور", en: "El Salvador" },
  Grenada: { ar: "غرينادا", en: "Grenada" },
  Guatemala: { ar: "غواتيمالا", en: "Guatemala" },
  Haiti: { ar: "هايتي", en: "Haiti" },
  Honduras: { ar: "هندوراس", en: "Honduras" },
  Jamaica: { ar: "جامايكا", en: "Jamaica" },
  Mexico: { ar: "المكسيك", en: "Mexico" },
  Nicaragua: { ar: "نيكاراغوا", en: "Nicaragua" },
  Panama: { ar: "بنما", en: "Panama" },
  "Saint Kitts and Nevis": {
    ar: "سانت كيتس ونيفيس",
    en: "Saint Kitts and Nevis",
  },
  "Saint Lucia": { ar: "سانت لوسيا", en: "Saint Lucia" },
  "Saint Vincent and the Grenadines": {
    ar: "سانت فنسنت وجزر غرينادين",
    en: "Saint Vincent and the Grenadines",
  },
  "Trinidad and Tobago": { ar: "ترينيداد وتوباغو", en: "Trinidad and Tobago" },
  "United States": { ar: "الولايات المتحدة", en: "United States" },

  // South America
  Argentina: { ar: "الأرجنتين", en: "Argentina" },
  Bolivia: { ar: "بوليفيا", en: "Bolivia" },
  Brazil: { ar: "البرازيل", en: "Brazil" },
  Chile: { ar: "تشيلي", en: "Chile" },
  Colombia: { ar: "كولومبيا", en: "Colombia" },
  Ecuador: { ar: "الإكوادور", en: "Ecuador" },
  Guyana: { ar: "غيانا", en: "Guyana" },
  Paraguay: { ar: "باراغواي", en: "Paraguay" },
  Peru: { ar: "بيرو", en: "Peru" },
  Suriname: { ar: "سورينام", en: "Suriname" },
  Uruguay: { ar: "أوروغواي", en: "Uruguay" },
  Venezuela: { ar: "فنزويلا", en: "Venezuela" },

  // Oceania
  Australia: { ar: "أستراليا", en: "Australia" },
  Fiji: { ar: "فيجي", en: "Fiji" },
  Kiribati: { ar: "كيريباتي", en: "Kiribati" },
  "Marshall Islands": { ar: "جزر مارشال", en: "Marshall Islands" },
  Micronesia: { ar: "ولايات ميكرونيزيا المتحدة", en: "Micronesia" },
  Nauru: { ar: "ناورو", en: "Nauru" },
  "New Zealand": { ar: "نيوزيلندا", en: "New Zealand" },
  Palau: { ar: "بالاو", en: "Palau" },
  "Papua New Guinea": { ar: "بابوا غينيا الجديدة", en: "Papua New Guinea" },
  Samoa: { ar: "ساموا", en: "Samoa" },
  "Solomon Islands": { ar: "جزر سليمان", en: "Solomon Islands" },
  Tonga: { ar: "تونغا", en: "Tonga" },
  Tuvalu: { ar: "توفالو", en: "Tuvalu" },
  Vanuatu: { ar: "فانواتو", en: "Vanuatu" },
};

export const PROJECT_TYPES_LABELS = {
  "3D_Designer": {
    ar: "تصميم 3D",
    en: "3D Design",
  },
  "3D_Modification": {
    ar: "تعديل 3D",
    en: "3D Modification",
  },
  "2D_Study": {
    ar: "تخطيط المساحات",
    en: "2D Study",
  },
  "2D_Final_Plans": {
    ar: "مخططات تنفيذية",
    en: "2D Final Plans",
  },
  "2D_Quantity_Calculation": {
    ar: "حساب كميات واسعار",
    en: "2D Quantity Calculation",
  },
};

export const usersHexColors = {
  SUPER_ADMIN: "#FF4B4B", // bright red
  STAFF: "#4C8DFF", // strong blue
  isPrimary: "#b1975bff", // very light soft amber (lighter than TWO_D_EXECUTOR)
  isSuperSales: "#26C6DA", // teal (different from ACCOUNTANT green)
  THREE_D_DESIGNER: "#B35CFF", // vivid violet
  TWO_D_DESIGNER: "#FF7B5A", // warm coral
  banned: "#B00020", // deep dark red (much darker than SUPER_ADMIN)
  ACCOUNTANT: "#3ECF7A", // fresh green
  TWO_D_EXECUTOR: "#FFC658", // bright golden
};

export const usersColors = Object.fromEntries(
  Object.entries(usersHexColors).map(([key, value]) => [value, key])
);

export const usersColorsArray = [...Object.values(usersHexColors)];

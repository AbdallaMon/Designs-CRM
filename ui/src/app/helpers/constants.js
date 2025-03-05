import {
  AiOutlineEdit,
  AiOutlineFileText,
  AiOutlineUserAdd,
} from "react-icons/ai";
import { BiNote, BiTransfer } from "react-icons/bi";
import { MdAttachMoney, MdCall } from "react-icons/md";
import { FaFileUpload } from "react-icons/fa";
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
  // Leads titles
  Consultation: "استشارة",
  Design: "تصميم",
  "Interior design": "تصميم داخلي",
  // Questions
  "How can we serve you?": "كيف يمكننا مساعدتك؟",
  "Choose from options": "اختر من الخيارات",

  // Lead Types
  Room: "غرفة",
  Plan: "مخطط",
  "City Visit": "زيارة ميدانية",
  Apartment: "شقة",
  "Construction Villa": "فيلا مسكونة",
  "Villa Under Construction": "فيلا تحت الإنشاء",
  "Part of Home": "جزء من المنزل",
  Commercial: "تجاري",

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
  Books: "الكتب",
  Store: "المتجر",
  "Coming Soon": "سيتوفر قريبًا",
  "Choose a time between 10 AM to 7 PM.":
    "اختر وقت بين الساعة 10 صباحًا و 7 مساءً.",
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
};

// Work Stages for 3D Designer
export const ThreeDWorkStages = {
  CLIENT_COMMUNICATION: "Client Communication",
  DESIGN_STAGE: "Design Stage",
  THREE_D_STAGE: "3D Stage",
  THREE_D_APPROVAL: "3D Approval",
};

// Work Stages for 2D Designer
export const TwoDWorkStages = {
  DRAWING_PLAN: "Drawing Plan",
  FINAL_DELIVERY: "Final Delivery",
};

export const KanbanLeadsStatus = {
  IN_PROGRESS: "In Progress",
  INTERESTED: "Interested",
  NEEDS_IDENTIFIED: "Needs Identified",
  NEGOTIATING: "Negotiating",
  FINALIZED: "Finalized",
  REJECTED: "Rejected",
};

export const statusColors = {
  IN_PROGRESS: "#0d9488",
  INTERESTED: "#10b981",
  NEEDS_IDENTIFIED: "#f59e0b",
  NEGOTIATING: "#3b82f6",
  REJECTED: "#ef4444",
  FINALIZED: "#0f766e",
  CLIENT_COMMUNICATION: "#3b82f6",
  DESIGN_STAGE: "#10b981",
  THREE_D_STAGE: "#f59e0b",
  THREE_D_APPROVAL: "#0d9488",
  DRAWING_PLAN: "#f97316",
  FINAL_DELIVERY: "#0f766e",
};

export const KanbanStatusArray = [
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
  "FINALIZED",
  "REJECTED",
];

export const initialPageLimit = 9;
export const totalLimitPages = [9, 20, 50, 100];
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
  { value: "STAFF", label: "Staff" },
  { value: "THREE_D_DESIGNER", label: "3D Designer" },
  { value: "TWO_D_DESIGNER", label: "2D Designer" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "SUPER_ADMIN", label: "Admin" },
];
export const userRolesEnum = {
  STAFF: "Staff",
  THREE_D_DESIGNER: "3D Designer",
  TWO_D_DESIGNER: "2D Designer",
  ACCOUNTANT: "Accountant",
  SUPER_ADMIN: "Admin",
};

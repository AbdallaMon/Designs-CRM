import { CONTRACT_LEVELS as CONTRACT_LEVEL_CODES } from "@dms/shared";
import { MdBlock } from "react-icons/md";
import {
  FaBullhorn,
  FaCalculator,
  FaChartLine,
  FaCheckCircle,
  FaCube,
  FaProjectDiagram,
  FaRulerCombined,
  FaSpinner,
  FaTimesCircle,
  FaTools,
} from "react-icons/fa";

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

export const CONTRACT_LEVELS = {
  LEVEL_1: "تحليل وتقييم",
  LEVEL_2: "تخطيط المساحات",
  LEVEL_3: "تصميم 3D",
  LEVEL_4: "مخططات تنفيذية",
  LEVEL_5: "حساب كميات واسعار",
  LEVEL_6: "تنفيذ",
  LEVEL_7: "تسويق",
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
    enum: CONTRACT_LEVEL_CODES.LEVEL_1,
    label: "تحليل وتقييم",
    labelAr: "تحليل وتقييم",
    labelEn: "Analysis & Assessment",
  },
  {
    enum: CONTRACT_LEVEL_CODES.LEVEL_2,
    label: "تخطيط المساحات",
    labelAr: "تخطيط المساحات",
    labelEn: "Space Planning",
  },
  {
    enum: CONTRACT_LEVEL_CODES.LEVEL_3,
    label: "تصميم 3D",
    labelAr: "تصميم 3D",
    labelEn: "3D Design",
  },
  {
    enum: CONTRACT_LEVEL_CODES.LEVEL_4,
    label: "مخططات تنفيذية",
    labelAr: "مخططات تنفيذية",
    labelEn: "Working Drawings",
  },
  {
    enum: CONTRACT_LEVEL_CODES.LEVEL_5,
    label: "حساب كميات واسعار",
    labelAr: "حساب كميات واسعار",
    labelEn: "BOQ & Pricing",
  },
  { enum: CONTRACT_LEVEL_CODES.LEVEL_6, label: "تنفيذ", labelAr: "تنفيذ", labelEn: "Execution" },
  { enum: CONTRACT_LEVEL_CODES.LEVEL_7, label: "تسويق", labelAr: "تسويق", labelEn: "Marketing" },
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

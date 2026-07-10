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

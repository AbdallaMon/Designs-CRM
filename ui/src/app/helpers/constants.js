export const NotificationType = {
    NEW_LEAD: "New Lead",
    LEAD_ASSIGNED: "Lead Assigned",
    LEAD_STATUS_CHANGED: "Lead Status Changed",
    NEW_NOTE: "New Note",
    NEW_FILE: "New File",
    REMINDER: "Reminder",
    LEAD_TRANSFERRED: "Lead Transferred",
};


export const LogType = {
    LEAD_CREATED: "Lead Created",
    LEAD_ASSIGNED: "Lead Assigned",
    LEAD_STATUS_CHANGED: "Lead Status Changed",
    NOTE_ADDED: "Note Added",
    FILE_UPLOADED: "File Uploaded",
    LEAD_TRANSFERRED: "Lead Transferred",
};



export const LeadCategory = {
    CONSULTATION: "Consultation",
    DESIGN: "Design",
};

export const ConsultationType = {
    ROOM: "Room",
    BLUEPRINT: "Blueprint",
    CITY_VISIT: "City Visit",
};

export const DesignType = {
    RESIDENTIAL: "Residential",
    COMMERCIAL: "Commercial",
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
};

export const UserRole = {
    ADMIN: "Admin",
    STAFF: "Staff",
};

const ClientLeadStatus = {
    NEW: "New",
    IN_PROGRESS: "In Progress",
    CONTACT_INITIATED: "Contact Initiated",
    INTERESTED: "Interested",
    NEEDS_IDENTIFIED: "Needs Identified",
    NEGOTIATING: "Negotiating",
    REJECTED: "Rejected",
    FINALIZED: "Finalized",
};


export const DesignItemType = {
    // Residential
    UNDER_CONSTRUCTION: "Under Construction",
    OCCUPIED_VILLA: "Occupied Villa",
    MASTER_SECTION: "Master Section",
    // Commercial
    RETAIL_SPACE: "Retail Space",
    OFFICE_BUILDING: "Office Building",
    RESTAURANT: "Restaurant",
    HOTEL: "Hotel",
    MIXED_USE: "Mixed Use",
};
export const statusColors = {
    IN_PROGRESS: "#0d9488",           // Teal
    INTERESTED: "#10b981",           // Emerald
    NEEDS_IDENTIFIED: "#f59e0b",     // Amber
    NEGOTIATING: "#3b82f6",          // Blue
    REJECTED: "#ef4444",             // Red
    FINALIZED: "#0f766e",            // Dark teal
};
export const KanbanStatusArray= [
    "IN_PROGRESS",
    "INTERESTED",
    "NEEDS_IDENTIFIED",
    "NEGOTIATING",
    "FINALIZED",
    "REJECTED",
];

export const initialPageLimit = 10
export const totalLimitPages = [10, 20, 50, 100]
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
    p: 4,
}



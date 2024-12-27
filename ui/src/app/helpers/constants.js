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

export const ClientLeadStatus = {
    NEW: "New",
    IN_PROGRESS: "In Progress",
    INTERESTED: "Interested",
    NEGOTIATING: "Negotiating",
    REJECTED: "Rejected",
    CONVERTED: "Converted",
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



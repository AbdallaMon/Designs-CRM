import {AiOutlineEdit, AiOutlineFileText, AiOutlineUserAdd} from "react-icons/ai";
import {BiNote, BiTransfer} from "react-icons/bi";
import {MdAttachMoney, MdCall} from "react-icons/md";
import {FaFileUpload} from "react-icons/fa";
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
    NEEDS_IDENTIFIED: "Needs Identified",
    NEGOTIATING: "Negotiating",
    REJECTED: "Rejected",
    FINALIZED: "Finalized",
    CONVERTED: "Converted",
    ON_HOLD: "On Hold",
};

export const KanbanLeadsStatus={
    IN_PROGRESS: "In Progress",
    INTERESTED: "Interested",
    NEEDS_IDENTIFIED: "Needs Identified",
    NEGOTIATING: "Negotiating",
    REJECTED: "Rejected",
    FINALIZED: "Finalized",
}



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
    borderRadius:2,
    p: 4,
}


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

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
export const LeadType = {
    ROOM: "Room",
    BLUEPRINT: "Blueprint",
    CITY_VISIT: "City Visit",
    APARTMENT: "Apartment",
    CONSTRUCTION_VILLA: "Construction Villa",
    UNDER_CONSTRUCTION_VILLA: "Villa Under Construction",
    PART_OF_HOME: "Part of Home",
    COMMERCIAL: "Commercial"
};
export const dictionary = {
    // Leads titles
    Consultation: "استشارة",
    Design: "تصميم",

    // Questions
    "How can we serve you?": "كيف يمكننا مساعدتك؟",
    "Choose from options": "اختر من الخيارات",

    // Lead Types
    Room: "غرفة",
    Blueprint: "مخطط",
    "City Visit": "زيارة المدينة",
    Apartment: "شقة",
    "Construction Villa": "فيلا مكسونة",
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

    // Additional phrases
    "Please fill all the fields.": "يرجى ملء جميع الحقول.",
    "Minimum price cannot be greater than maximum price.": "لا يمكن أن يكون الحد الأدنى للسعر أكبر من الحد الأقصى للسعر.",
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
    "Submit": "تسجيل",
    Success: "تم بنجاح!",
    "Thank you for your submission. We will contact you soon.": "شكرًا لك على تقديم طلبك. سنتواصل معك قريبًا.",
    "You got a 10% discount": "لقد حصلت على خصم 10٪",
    Sorry: "عذرًا!",
    "We do not provide services outside the UAE.": "نحن لا نقدم خدمات خارج الإمارات العربية المتحدة.",
    "Add an attachment (optional)":"اضف مرفقا (اختياري)"
};

export const MediaType = {
    IMAGE: "Image",
    VIDEO: "Video",
};

export const Emirate = {
    OUTSIDE:"Out side emirates",
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

export const serviceCategories = {
    categories: [
        {
            name: "Consultation",
            value: "CONSULTATION",
            type: "CATEGORY", // Top-level type
            subItems: [
                { name: "Room", value: "ROOM", type: "ITEM",subtext:200 },
                { name: "Blueprint", value: "BLUEPRINT", type: "ITEM" ,subtext:400},
                { name: "City Visit", value: "CITY_VISIT", type: "ITEM" ,subtext:600},
            ],
        },
        {
            name: "Design",
            value: "DESIGN",
            type: "CATEGORY", // Top-level type
            subItems: [
                {
                    name: "Residential",
                    value: "RESIDENTIAL",
                    type: "SUB_CATEGORY",
                    subItems: [
                        {
                            name: "Under Construction",
                            value: "UNDER_CONSTRUCTION",
                            type: "ITEM",
                            subItems: [
                                {
                                    name: "Outside Emirates",
                                    value: "OUTSIDE_EMIRATES",
                                    type: "FINAL",
                                },
                                {
                                    name: "Inside Emirates",
                                    value: "INSIDE_EMIRATES",
                                    type: "EMIRATES",
                                    subItems: [
                                        {
                                            name: "Dubai",
                                            value: "DUBAI",
                                            type: "EMIRATE",
                                            averagePrice: "1200 - 2400",
                                            priceRanges: [
                                                { name: "1000 - 2000", type: "STANDARD" },
                                                { name: "1500 - 2500", type: "DELUXE" },
                                                { name: "3000 - 5000", type: "PREMIUM" },
                                            ],
                                        },
                                        {
                                            name: "Abu Dhabi",
                                            value: "ABU_DHABI",
                                            type: "EMIRATE",
                                            averagePrice: "1100 - 2200",
                                            priceRanges: [
                                                { name: "900 - 1800", type: "STANDARD" },
                                                { name: "1300 - 2400", type: "DELUXE" },
                                                { name: "4000 - 7000", type: "PREMIUM" },
                                            ],
                                        },
                                        {
                                            name: "Sharjah",
                                            value: "SHARJAH",
                                            type: "EMIRATE",
                                            averagePrice: "1000 - 2000",
                                            priceRanges: [
                                                { name: "800 - 1600", type: "STANDARD" },
                                                { name: "1100 - 1900", type: "DELUXE" },
                                                { name: "2500 - 4500", type: "PREMIUM" },
                                            ],
                                        },
                                        {
                                            name: "Ajman",
                                            value: "AJMAN",
                                            type: "EMIRATE",
                                            averagePrice: "900 - 1800",
                                            priceRanges: [
                                                { name: "700 - 1400", type: "STANDARD" },
                                                { name: "1000 - 1700", type: "DELUXE" },
                                                { name: "2000 - 4000", type: "PREMIUM" },
                                            ],
                                        },
                                        {
                                            name: "Umm Al Quwain",
                                            value: "UMM_AL_QUWAIN",
                                            type: "EMIRATE",
                                            averagePrice: "800 - 1600",
                                            priceRanges: [
                                                { name: "600 - 1300", type: "STANDARD" },
                                                { name: "900 - 1500", type: "DELUXE" },
                                                { name: "1800 - 3500", type: "PREMIUM" },
                                            ],
                                        },
                                        {
                                            name: "Ras Al Khaimah",
                                            value: "RAS_AL_KHAIMAH",
                                            type: "EMIRATE",
                                            averagePrice: "1100 - 2100",
                                            priceRanges: [
                                                { name: "900 - 1700", type: "STANDARD" },
                                                { name: "1200 - 1900", type: "DELUXE" },
                                                { name: "2800 - 4800", type: "PREMIUM" },
                                            ],
                                        },
                                        {
                                            name: "Fujairah",
                                            value: "FUJAIRAH",
                                            type: "EMIRATE",
                                            averagePrice: "950 - 1900",
                                            priceRanges: [
                                                { name: "750 - 1400", type: "STANDARD" },
                                                { name: "1000 - 1600", type: "DELUXE" },
                                                { name: "2400 - 4400", type: "PREMIUM" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "Construction Villa",
                            value: "CONSTRUCTION_VILLA",
                            type: "ITEM",
                            subItems: [
                                {
                                    name: "Outside Emirates",
                                    value: "OUTSIDE_EMIRATES",
                                    type: "FINAL",
                                },
                                {
                                    name: "Inside Emirates",
                                    value: "INSIDE_EMIRATES",
                                    type: "EMIRATES",
                                    subItems: [
                                        {
                                            name: "Dubai",
                                            value: "DUBAI",
                                            type: "EMIRATE",
                                            averagePrice: "2000 - 4000",
                                            priceRanges: [
                                                { name: "1800 - 3500", type: "STANDARD" },
                                                { name: "2500 - 4500", type: "DELUXE" },
                                                { name: "5000 - 7000", type: "PREMIUM" },
                                            ],
                                        },
                                        {
                                            name: "Abu Dhabi",
                                            value: "ABU_DHABI",
                                            type: "EMIRATE",
                                            averagePrice: "1800 - 3500",
                                            priceRanges: [
                                                { name: "1500 - 3200", type: "STANDARD" },
                                                { name: "2200 - 4000", type: "DELUXE" },
                                                { name: "6000 - 8000", type: "PREMIUM" },
                                            ],
                                        },
                                        // Add similar emirate data for other emirates here...
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "Commercial",
                    value: "COMMERCIAL",
                    type: "SUB_CATEGORY",
                    subItems: [
                        {
                            name: "Retail Space",
                            value: "RETAIL_SPACE",
                            type: "ITEM",
                            subItems: [
                                {
                                    name: "Outside Emirates",
                                    value: "OUTSIDE_EMIRATES",
                                    type: "FINAL",
                                },
                                {
                                    name: "Inside Emirates",
                                    value: "INSIDE_EMIRATES",
                                    type: "EMIRATES",
                                    subItems: [
                                        {
                                            name: "Dubai",
                                            value: "DUBAI",
                                            type: "EMIRATE",
                                            averagePrice: "2500 - 5000",
                                            priceRanges: [
                                                { name: "2300 - 4500", type: "STANDARD" },
                                                { name: "3000 - 5500", type: "DELUXE" },
                                                { name: "7000 - 10000", type: "PREMIUM" },
                                            ],
                                        },
                                        {
                                            name: "Abu Dhabi",
                                            value: "ABU_DHABI",
                                            type: "EMIRATE",
                                            averagePrice: "2200 - 4500",
                                            priceRanges: [
                                                { name: "2000 - 4000", type: "STANDARD" },
                                                { name: "2700 - 5000", type: "DELUXE" },
                                                { name: "6500 - 9000", type: "PREMIUM" },
                                            ],
                                        },
                                        // Add similar emirate data for other emirates here...
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

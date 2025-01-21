export const consultationLead = [{name: "Room", value: "ROOM", subtext: "800"},
    {value: "BLUEPRINT", subtext: "1200"},
    {value: "CITY_VISIT", subtext: "1800"},
]
export const designLead = [
    {
        value: "APARTMENT",
    },
    {
        value: "CONSTRUCTION_VILLA",
    },
    {
        value: "UNDER_CONSTRUCTION_VILLA",
    },
    {
        value: "PART_OF_HOME",
    },
    {
        value: "COMMERCIAL",
    },
]
export const leads = [
    {
        title: "Consultation",
        value: "CONSULTATION",
        image: "/consultation.jpg"
    },
    {
        title: "Design",
        value: "DESIGN",
        image: "/design.jfif"
    }
]
export const designLeadTypes = [
    {
        title: "Inside UAE",
        value: "INSIDE_UAE",
        image: "/inside-uae.webp"
    },
    {
        title: "Out side UAE",
        value: "OUTSIDE_UAE",
        image: "/outside-uae.jpg"
    },


]
export const questions = {
    category: "How can we serve you?"
    ,
    type: "Choose from options"
}
export const priceRange={
    "APARTMENT":{
        type:"input"
    },
    "CONSTRUCTION_VILLA": {
        type: "options",
        options:["400,000 or less", "400,000 to 600,000", "600,000 to 800,000", "800,000 and above"]
    },
    "UNDER_CONSTRUCTION_VILLA": {
        type: "options",
        options: ["400,000 or less", "400,000 to 600,000", "600,000 to 800,000", "800,000 and above"]
    },
    "PART_OF_HOME": {
        type: "options",
        options: [
            "25,000 or less",
            "25,000 to 45,000",
            "45,000 to 65,000",
            "65,000 to 85,000",
            "85,000 and above"
        ]
    },
    "COMMERCIAL":{
        type:"input"
    }
}
// export const consultationLead = [{name: "Room", value: "ROOM", subtext: "800",variantId:"48447274647863"},
//     {value: "PLAN", subtext: "1200",variantId:"48447274615095"},
//     {value: "CITY_VISIT", subtext: "1800",variantId: "48447274680631"},
// ]

export const consultationLead = [
  { name: "Room", value: "ROOM", subtext: "800", variantId: "48447274647863" },
  { value: "PLAN", subtext: "1200", variantId: "48447274615095" },
  { value: "CITY_VISIT", subtext: "1800", variantId: "48447274680631" },
];
export const variants = {
  ROOM: 48447274647863,
  PLAN: 48447274615095,
  CITY_VISIT: 48447274680631,
};
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
];
export const leads = [
  // {
  //   title: "Consultation",
  //   value: "CONSULTATION",
  //   image: "/consultation.jpg",
  //   alt: "Dream studio consultation with eng ahmed",
  //   type: "LINK",
  //   href: "https://decorstores.ltd/products/consultation-with-engineer-ahmed",
  // },
  // {
  //   title: "Interior design",
  //   value: "DESIGN",
  //   image: "/design.jfif",
  //   alt: "Dream Studio - Dream Design & Luxurious Home Solutions",
  //   type: "ANIMATION",
  // },
  {
    title: "Interior design",
    value: "DESIGN",
    image: "/design.jfif",
    alt: "Dream Studio - Dream Design & Luxurious Home Solutions",
    type: "LINK",
    href: "https://eng.ahmadmobayed.com/",
  },
  {
    title: "Books",
    value: "BOOKS",
    image: "/books.jpg",
    alt: "Dream Studio Books for interior design by Ahmed (dream studio)",
    type: "LINK",
    href: "https://decorstores.ltd/products/book",
  },
  {
    title: "Engineers courses",
    value: "COURSES",
    image: "/courses.jpg",
    alt: "Courses ",
    href: "https://decorstores.ltd/products/animation",
    type: "LINK",
  },
];

export const designLeadTypes = [
  {
    title: "Inside UAE",
    value: "INSIDE_UAE",
    image: "/inside-uae.webp",
    alt: "Dream studio create your dream design inside UAE",
  },
  {
    title: "Out side UAE",
    value: "OUTSIDE_UAE",
    image: "/outside-uae.jpg",
    alt: "Dream Studio - Dream Design & Luxurious Home Solutions.",
  },
];
export const questions = {
  category: "Choose from options",
  type: "Choose from options",
};
export const priceRange = {
  APARTMENT: {
    type: "input",
  },
  CONSTRUCTION_VILLA: {
    type: "options",
    options: [
      "300,000 AED or less",
      "300,000 to 400,000 AED",
      "400,000 to 600,000 AED",
      "600,000 to 800,000 AED",
      "800,000 AED and above",
    ],
  },
  UNDER_CONSTRUCTION_VILLA: {
    type: "options",
    options: [
      "300,000 AED or less",
      "300,000 to 400,000 AED",
      "400,000 to 600,000 AED",
      "600,000 to 800,000 AED",
      "800,000 AED and above",
    ],
  },
  PART_OF_HOME: {
    type: "options",
    options: [
      "25,000 AED or less",
      "25,000 to 45,000 AED",
      "45,000 to 65,000 AED",
      "65,000 to 85,000 AED",
      "85,000 AED and above",
    ],
  },
  COMMERCIAL: {
    type: "input",
  },
};

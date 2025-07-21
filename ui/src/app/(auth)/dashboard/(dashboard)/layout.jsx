"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";
import {
  Failed,
  Success,
} from "@/app/UiComponents/feedback/loaders/toast/ToastUpdate";
import { useAuth } from "@/app/providers/AuthProvider";
import { Box } from "@mui/material";
import colors from "@/app/helpers/colors";
import {
  FiGrid,
  FiUsers,
  FiTarget,
  FiDollarSign,
  FiClock,
  FiList,
  FiFileText,
  FiTrendingUp,
  FiBriefcase,
  FiShoppingCart,
  FiHome,
  FiTrendingDown,
  FiImage,
  FiCalendar,
} from "react-icons/fi";

import Navbar from "@/app/UiComponents/utility/Navbar.jsx";
import ActivityLogDialog from "@/app/UiComponents/feedback/UserLogsUpdate";

let toastId;
export const adminLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  { name: "Users", href: "/dashboard/users", icon: <FiUsers size={20} /> },
  { name: "Leads", href: "/dashboard/leads", icon: <FiTarget size={20} /> },
  {
    name: "Deals",
    href: "/dashboard/deals",
    active: "deals",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "Current Deals",
        href: "/dashboard/deals",
        active: "deals",
        icon: <FiDollarSign size={20} />,
      },
      {
        name: "On hold Deals",
        href: "/dashboard/on-hold-deals",
        icon: <FiClock size={18} />,
        active: "on-hold",
      },
      {
        name: "All Deals",
        href: "/dashboard/all-deals",
        icon: <FiList size={18} />,
        active: "all-deals",
      },
    ],
  },
  {
    name: "Work stages",
    href: "/dashboard/work-stages",
    active: "work",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "All projects",
        href: "/dashboard/projects",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Archived projects",
        href: "/dashboard/projects/archived",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "3D Work stage",
        href: "/dashboard/work-stages",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "3D Modifcation",
        href: "/dashboard/work-stages/modification",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Plan study department",
        href: "/dashboard/work-stages/study",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Quantity calcualtion department",
        href: "/dashboard/work-stages/quantity",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Final plan department",
        href: "/dashboard/work-stages/final-plan",
        icon: <FiBriefcase size={20} />,
      },
    ],
  },

  {
    name: "Reports",
    href: "/dashboard/report",
    active: "report",
    icon: <FiFileText size={20} />, // General report icon
    subLinks: [
      {
        name: "Leads report",
        href: "/dashboard/report",
        active: "report",
        icon: <FiTrendingUp size={20} />, // Icon representing trends or growth for leads
      },
      {
        name: "Staff report",
        href: "/dashboard/report/staff",
        icon: <FiUsers size={18} />, // Icon representing a group of people for staff
        active: "report/staff",
      },
    ],
  },
  {
    name: "Images session gallery",
    href: "/dashboard/image-sessions",
    icon: <FiImage size={20} />,
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: <FiCalendar size={20} />,
  },
];

export const superAdminLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  { name: "Leads", href: "/dashboard/leads", icon: <FiTarget size={20} /> },
  {
    name: "Deals",
    href: "/dashboard/deals",
    active: "deals",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "Current Deals",
        href: "/dashboard/deals",
        active: "deals",
        icon: <FiDollarSign size={20} />,
      },
      {
        name: "On hold Deals",
        href: "/dashboard/on-hold-deals",
        icon: <FiClock size={18} />,
        active: "on-hold",
      },
      {
        name: "All Deals",
        href: "/dashboard/all-deals",
        icon: <FiList size={18} />,
        active: "all-deals",
      },
    ],
  },
  {
    name: "Work stages",
    href: "/dashboard/work-stages",
    active: "work",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "All projects",
        href: "/dashboard/projects",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Archived projects",
        href: "/dashboard/projects/archived",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "3D Work stage",
        href: "/dashboard/work-stages",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "3D Modifcation",
        href: "/dashboard/work-stages/modification",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Plan study department",
        href: "/dashboard/work-stages/study",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Quantity calcualtion department",
        href: "/dashboard/work-stages/quantity",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Final plan department",
        href: "/dashboard/work-stages/final-plan",
        icon: <FiBriefcase size={20} />,
      },
    ],
  },
  // {
  //   name: "Work stages",
  //   href: "/dashboard/work-stages",
  //   active: "work-stages",
  //   icon: <FiDollarSign size={20} />,
  //   subLinks: [
  //     {
  //       name: "Three D work stages",
  //       href: "/dashboard/work-stages/three-d",
  //       active: "three-d",
  //       icon: <FiDollarSign size={20} />,
  //     },
  //     {
  //       name: "Two D work stages",
  //       href: "/dashboard/work-stages/two-d",
  //       icon: <FiClock size={18} />,
  //       active: "two-d",
  //     },
  //   ],
  // },
];
// Regular user navigation links
export const staffLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  { name: "Leads", href: "/dashboard/leads", icon: <FiTarget size={20} /> },
  {
    name: "Deals",
    href: "/dashboard/deals",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "Current Deals",
        href: "/dashboard/deals",
        icon: <FiDollarSign size={20} />,
        active: "deals",
      },
      {
        name: "On hold Deals",
        href: "/dashboard/on-hold-deals",
        icon: <FiClock size={18} />,
        active: "on-hold",
      },
      {
        name: "All Deals",
        href: "/dashboard/all-deals",
        icon: <FiList size={18} />,
        active: "all-deals",
      },
    ],
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: <FiCalendar size={20} />,
  },
];
export const contactInitiatorLinks = [
  { name: "Leads", href: "/dashboard", icon: <FiTarget size={20} /> },

];
export const superSalesLinks = [
    { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },

{
    name: "Deals",
    href: "/dashboard/deals",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "Current Deals",
        href: "/dashboard/deals",
        icon: <FiDollarSign size={20} />,
        active: "deals",
      },
      {
        name: "On hold Deals",
        href: "/dashboard/on-hold-deals",
        icon: <FiClock size={18} />,
        active: "on-hold",
      },
      {
        name: "All Deals",
        href: "/dashboard/all-deals",
        icon: <FiList size={18} />,
        active: "all-deals",
      },
    ],
  },
];
export const threeDLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiTarget size={20} /> },
  {
    name: "Work stages",
    href: "/dashboard/work-stages",
    active: "work",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "3D Work stage",
        href: "/dashboard/work-stages",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Modifcation stage",
        href: "/dashboard/modification",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Archived projects",
        href: "/dashboard/archived",
        icon: <FiBriefcase size={20} />,
      },
    ],
  },
];
export const twoDLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiTarget size={20} /> },
  {
    name: "Work stages",
    href: "/dashboard/work-stages",
    active: "work",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "Plan study department",
        href: "/dashboard/study",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Quantity calcualtion department",
        href: "/dashboard/quantity",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Final plan department",
        href: "/dashboard/final-plan",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Archived projects",
        href: "/dashboard/archived",
        icon: <FiBriefcase size={20} />,
      },
    ],
  },
];
export const exacuterLinks = [
  { name: "Leads", href: "/dashboard", icon: <FiTarget size={20} /> },
  {
    name: "Work stage",
    href: "/dashboard/work-stages",
    icon: <FiBriefcase size={20} />,
  },
];

export const accountantLinks = [
  { name: "Payments", href: "/dashboard", icon: <FiDollarSign size={20} /> }, // Dollar sign for payments

  {
    name: "Operational Expenses",
    href: "/dashboard/operational-expenses",
    icon: <FiShoppingCart size={20} />, // Shopping cart for expenses
  },
  {
    name: "Rents",
    href: "/dashboard/rents",
    icon: <FiHome size={20} />, // Home icon for rents
  },
  {
    name: "Salaries",
    href: "/dashboard/salaries",
    icon: <FiUsers size={20} />, // Users for salaries (employees)
  },
  {
    name: "Outstanding Payments",
    href: "/dashboard/outcome",
    icon: <FiTrendingDown size={20} />, // Trending down for outstanding payments
  },
];
export default function Layout({
  admin,
  staff,
  threeD,
  twoD,
  accountant,
  super_admin,
  exacuter,
  super_sales,contact_initiator
}) {
  const router = useRouter();
  let { user, isLoggedIn, validatingAuth } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (validatingAuth || toastId === undefined) {
        toastId = toast.loading("Validating your session");
      }
      if (!isLoggedIn && !validatingAuth) {
        window.localStorage.setItem("redirect", window.location.pathname);
        toast.update(toastId, Failed("You must log in first, redirecting..."));
        router.push("/login");
        return;
      }
      if (isLoggedIn && !validatingAuth) {
        toast.update(
          toastId,
          Success("Your session has been validated, loading data.")
        );
      }
      if (typeof window !== "undefined") {
        console.log(document.referrer, "refresres");
      }
    }

    fetchData();
  }, [validatingAuth]);
  if (!user || !user.role) return null;
  const role = user?.role;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.bgSecondary,
      }}
    >
      {user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && (
        <ActivityLogDialog userId={user.id} />
      )}
      <Navbar
        links={
          role === "ADMIN"
            ? adminLinks
            : role === "STAFF"
            ? staffLinks
            : role === "THREE_D_DESIGNER"
            ? threeDLinks
            : role === "TWO_D_DESIGNER"
            ? twoDLinks
            : role === "ACCOUNTANT"
            ? accountantLinks
            : role === "TWO_D_EXECUTOR"
            ? exacuterLinks:
            role==="CONTACT_INITIATOR"?contactInitiatorLinks:role==="SUPER_SALES"?superSalesLinks
            : adminLinks
        }
      />

      {role === "ADMIN"
        ? admin
        : role === "STAFF"
        ? staff
        : role === "THREE_D_DESIGNER"
        ? threeD
        : role === "TWO_D_DESIGNER"
        ? twoD
        : role === "ACCOUNTANT"
        ? accountant
        : role === "TWO_D_EXECUTOR"
        ? exacuter  :role==="CONTACT_INITIATOR"?contact_initiator:role==="SUPER_SALES"?super_sales
        : admin}
    </Box>
  );
}

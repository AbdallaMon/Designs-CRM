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
import SocketProvider from "@/app/providers/SocketProvider";
import ChatWidget from "@/app/UiComponents/DataViewer/chat/components/chat/ChatWidget";

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
        name: "Plan study department",
        href: "/dashboard/work-stages/study",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "3D Work stage",
        href: "/dashboard/work-stages",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Final plan department",
        href: "/dashboard/work-stages/final-plan",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Quantity calcualtion department",
        href: "/dashboard/work-stages/quantity",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Archived projects",
        href: "/dashboard/projects/archived",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "3D Modifcation",
        href: "/dashboard/work-stages/modification",
        icon: <FiBriefcase size={20} />,
      },
    ],
  },

  {
    name: "Reports",
    href: "/dashboard/report",
    active: "report",
    icon: <FiFileText size={20} />,
    subLinks: [
      {
        name: "Leads report",
        href: "/dashboard/report",
        active: "report",
        icon: <FiTrendingUp size={20} />,
      },
      {
        name: "Staff report",
        href: "/dashboard/report/staff",
        icon: <FiUsers size={18} />,
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
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: <FiDollarSign size={20} />,
  },
  {
    name: "Website utilities",
    href: "/dashboard/website-utilities",
    icon: <FiHome size={20} />,
  },
];

export const superAdminLinks = adminLinks;
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
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: <FiDollarSign size={20} />,
  },
];
export const contactInitiatorLinks = [
  { name: "Leads", href: "/dashboard", icon: <FiTarget size={20} /> },
];
export const superSalesLinks = [
  ...staffLinks,
  { name: "Users", href: "/dashboard/users", icon: <FiUsers size={20} /> },
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
        name: "Final plan department",
        href: "/dashboard/final-plan",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Quantity calcualtion department",
        href: "/dashboard/quantity",
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
  { name: "Payments", href: "/dashboard", icon: <FiDollarSign size={20} /> },

  {
    name: "Operational Expenses",
    href: "/dashboard/operational-expenses",
    icon: <FiShoppingCart size={20} />,
  },
  {
    name: "Rents",
    href: "/dashboard/rents",
    icon: <FiHome size={20} />,
  },
  {
    name: "Salaries",
    href: "/dashboard/salaries",
    icon: <FiUsers size={20} />,
  },
  {
    name: "Outstanding Payments",
    href: "/dashboard/outcome",
    icon: <FiTrendingDown size={20} />,
  },
];

// Picks the nav link set for the current role — identical mapping to master's parallel-route
// shell (display-only; page access itself is gated by real permissions inside each feature).
export function linksForRole(user) {
  const role = user?.role;
  switch (role) {
    case "ADMIN":
      return adminLinks;
    case "STAFF":
      return user?.isSuperSales ? superSalesLinks : staffLinks;
    case "THREE_D_DESIGNER":
      return threeDLinks;
    case "TWO_D_DESIGNER":
      return twoDLinks;
    case "ACCOUNTANT":
      return accountantLinks;
    case "TWO_D_EXECUTOR":
      return exacuterLinks;
    case "CONTACT_INITIATOR":
      return contactInitiatorLinks;
    case "SUPER_SALES":
      return superSalesLinks;
    default:
      return adminLinks;
  }
}

// Collapsed dashboard shell: master rendered one of nine parallel-route @role slots here;
// we now render normal nested routes via {children}, keeping the same Navbar / session guard /
// socket + chat widget. Role no longer selects a slot — each /dashboard/* route renders one
// shared feature component, gated by permissions.
export default function Layout({ children }) {
  const router = useRouter();
  const { user, isLoggedIn, validatingAuth } = useAuth();

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
    }

    fetchData();
  }, [validatingAuth]);
  if (!user || !user.role) return null;

  return (
    <Box
      sx={{
        minHeight: { xs: "calc(100vh - 75px)", md: "calc(100vh - 86px)" },
        backgroundColor: colors.bgSecondary,
      }}
    >
      <SocketProvider>
        <Navbar links={linksForRole(user)} />
        {children}
        <ChatWidget />
      </SocketProvider>
    </Box>
  );
}

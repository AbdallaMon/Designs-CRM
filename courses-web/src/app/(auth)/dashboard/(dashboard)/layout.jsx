"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";

import { useAuth } from "@/app/providers/AuthProvider";
import { Box } from "@mui/material";
import colors from "@/app/helpers/colors";
import { FiBookOpen, FiGrid } from "react-icons/fi";

import Navbar from "@/shared/components/utility/Navbar.jsx";
import { activeProfileOf } from "@/app/helpers/functions/utility";
import {
  Failed,
  Success,
} from "@/shared/components/feedback/loaders/toast/ToastUpdate";

let toastId;

export const adminLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  {
    name: "Courses",
    href: "/dashboard/courses",
    icon: <FiBookOpen size={20} />,
  },
];

export const superAdminLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  {
    name: "Courses",
    href: "/dashboard/courses",
    icon: <FiBookOpen size={20} />,
  },
];

export const staffLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  {
    name: "Courses",
    href: "/dashboard/courses",
    icon: <FiBookOpen size={20} />,
  },
];

export const threeDLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  {
    name: "Courses",
    href: "/dashboard/courses",
    icon: <FiBookOpen size={20} />,
  },
];

export const twoDLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  {
    name: "Courses",
    href: "/dashboard/courses",
    icon: <FiBookOpen size={20} />,
  },
];

export const accountantLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  {
    name: "Courses",
    href: "/dashboard/courses",
    icon: <FiBookOpen size={20} />,
  },
];

export default function Layout({ admin, staff, threeD, twoD, accountant }) {
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
  // Route the dashboard slot from the active profile.
  const profile = activeProfileOf(user);
  if (!user || !profile) return null;
  const isAdmin = profile === "ADMIN" || profile === "SUPER_ADMIN";
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.bgSecondary,
      }}
    >
      <Navbar
        links={isAdmin ? adminLinks : staffLinks}
      />

      {isAdmin ? admin : staff}
    </Box>
  );
}

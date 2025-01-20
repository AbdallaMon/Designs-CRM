"use client";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {toast} from "react-toastify";
import {Failed, Success} from "@/app/UiComponents/feedback/loaders/toast/ToastUpdate";
import {useAuth} from "@/app/providers/AuthProvider";
import {Box} from "@mui/material";
import colors from "@/app/helpers/colors";
import { FiGrid, FiUsers, FiTarget, FiDollarSign, FiClock, FiList,FiFileText, FiTrendingUp } from "react-icons/fi";
import Navbar from "@/app/UiComponents/utility/Navbar.jsx";

let toastId;
export const adminLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: <FiGrid size={20} /> },
    { name: 'Users', href: '/dashboard/users', icon: <FiUsers size={20} /> },
    { name: 'Leads', href: '/dashboard/leads', icon: <FiTarget size={20} /> },
    {
        name: 'Deals',
        href: '/dashboard/deals',
        active:"deals",
        icon: <FiDollarSign size={20} />,
        subLinks: [
            {
                name: 'Current Deals',
                href: '/dashboard/deals',
                active:"deals",
                icon: <FiDollarSign size={20} />,
            },
            { name: 'On hold Deals', href: '/dashboard/on-hold-deals', icon: <FiClock size={18} />,                active:"on-hold",
            },
            { name: 'All Deals', href: '/dashboard/all-deals', icon: <FiList size={18} />   ,  active:"all-deals", },
        ],
    },
    {
        name: 'Reports',
        href: '/dashboard/report',
        active: "report",
        icon: <FiFileText size={20} />, // General report icon
        subLinks: [
            {
                name: 'Leads report',
                href: '/dashboard/report',
                active: "report",
                icon: <FiTrendingUp size={20} />, // Icon representing trends or growth for leads
            },
            {
                name: 'Staff report',
                href: '/dashboard/report/staff',
                icon: <FiUsers size={18} />,  // Icon representing a group of people for staff
                active: "report/staff",
            },
        ],
    },
];

// Regular user navigation links
export const userLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: <FiGrid size={20} /> },
    { name: 'Leads', href: '/dashboard/leads', icon: <FiTarget size={20} /> },
    {
        name: 'Deals',
        href: '/dashboard/deals',
        icon: <FiDollarSign size={20} />,
        subLinks: [
            {
                name: 'Current Deals',
                href: '/dashboard/deals',
                icon: <FiDollarSign size={20} />,      active:"deals",
            },
            { name: 'On hold Deals', href: '/dashboard/on-hold-deals', icon: <FiClock size={18} /> ,      active:"on-hold",},
            { name: 'All Deals', href: '/dashboard/all-deals', icon: <FiList size={18} />,  active:"all-deals",},
        ],
    },];
export default function Layout({ admin, staff}) {
    const router = useRouter();
    let {user, isLoggedIn, validatingAuth} = useAuth()
    useEffect(() => {
        async function fetchData() {
            if (validatingAuth || toastId === undefined) {
                toastId = toast.loading("Validating your session");
            }
            if (!isLoggedIn && !validatingAuth) {
                window.localStorage.setItem("redirect", window.location.pathname)
                toast.update(toastId, Failed("You must log in first, redirecting..."));
                router.push("/login");
                return
            }
            if (isLoggedIn && !validatingAuth) {
                toast.update(
                      toastId,
                      Success("Your session has been validated, loading data."),
                );
            }
        }


        fetchData();
    }, [validatingAuth]);
    if (!user || !user.role) return null;
    const role = user?.role;

    return (
          <Box sx={
              {
                  minHeight: "100vh",
                  backgroundColor: colors.bgSecondary
              }
          }
          >
<Navbar links={role==="ADMIN"?adminLinks:userLinks}/>
              {
                  role === "ADMIN" ? admin :  staff
              }
          </Box>

    );
}

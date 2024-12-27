"use client";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {toast} from "react-toastify";
import {Failed, Success} from "@/app/UiComponents/feedback/loaders/toast/ToastUpdate";
import {useAuth} from "@/app/providers/AuthProvider";
import {Box} from "@mui/material";
import colors from "@/app/helpers/colors";
import {FiDollarSign, FiGrid, FiTarget, FiUserCheck, FiUsers} from "react-icons/fi";
import Navbar from "@/app/UiComponents/utility/Navbar.jsx";

let toastId;
export const adminLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: <FiGrid size={20} /> },
    { name: 'Users', href: '/dashboard/users', icon: <FiUsers size={20} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <FiUserCheck size={20} /> },
    { name: 'Leads', href: '/dashboard/leads', icon: <FiTarget size={20} /> },
    { name: 'Deals', href: '/dashboard/deals', icon: <FiDollarSign size={20} /> },
];

// Regular user navigation links
export const userLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: <FiGrid size={20} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <FiUserCheck size={20} /> },
    { name: 'Leads', href: '/dashboard/leads', icon: <FiTarget size={20} /> },
    { name: 'Deals', href: '/dashboard/deals', icon: <FiDollarSign size={20} /> },
];
export default function Layout({ admin, staff}) {
    const router = useRouter();
    let {user, isLoggedIn, validatingAuth} = useAuth()
    useEffect(() => {
        async function fetchData() {
            if (validatingAuth || toastId === undefined) {
                toastId = toast.loading("يتم التاكد من صلاحيتك");
            }
            if (!isLoggedIn && !validatingAuth) {
                window.localStorage.setItem("redirect", window.location.pathname)
                toast.update(toastId, Failed("يجب عليك تسجيل الدخول اولا , جاري اعادة التوجية..."));
                router.push("/login");
                return
            }
            if (isLoggedIn && !validatingAuth) {
                toast.update(
                      toastId,
                      Success("تم التاكد من صلاحيتك , جاري تحميل البيانات."),
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

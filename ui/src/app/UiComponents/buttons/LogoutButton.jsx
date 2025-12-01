"use client"
import {Button} from "@mui/material";
import {useRouter} from "next/navigation";
import {FaSignOutAlt} from "react-icons/fa";
import {useToastContext} from "@/app/providers/ToastLoadingProvider";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit";
import {useAuth} from "@/app/providers/AuthProvider";
import {FiLogOut} from "react-icons/fi";
import React from "react";

export default function LogoutButton({fit}) {
    const {setLoading} = useToastContext();
    const {setUser, setIsLoggedIn} = useAuth()
    const router = useRouter();

    async function handleLogout() {
        const logout = await handleRequestSubmit(
              {},
              setLoading,
              `auth/logout`,
              false,
              "جاري تسجيل الخروج",
        );
        if (logout?.status === 200) {
            setIsLoggedIn(false)
            setUser({
                role: null,

            })
            router.push("/login");
        }
    }

    return (
          <Button
                onClick={() => {
                    handleLogout();
                }}
                sx={{
                    width: fit ? "fit-content" : "100%",
                    borderRadius: 2,
                    textTransform: 'none'
                }}
                color="error"
                variant="outlined"
                startIcon={<FiLogOut size={20} />}


          >
              Logout
          </Button>
    );
}
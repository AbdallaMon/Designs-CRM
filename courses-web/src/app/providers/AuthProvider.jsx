"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getData } from "@/app/helpers/functions/getData";

export const AuthContext = createContext(null);
export default function AuthProvider({ children }) {
  const [user, setUser] = useState({
    role: null,
    emailConfirmed: null,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [validatingAuth, setValidatingAuth] = useState(true);
  useEffect(() => {
    async function fetchData() {
      setValidatingAuth(true);
      // Session lives on the lead site (web/). getData → /v2 auth/me via the path map,
      // auto-refreshing the access token on 401. The identity fields we rely on are
      // `profile` (active profile key) + `profiles`, NOT the legacy role/subRoles.
      const res = await getData({ url: "auth/status", setLoading: () => {} });
      const me = res && res.status === 200 ? res.data?.user : null;
      if (me) {
        setUser(me);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUser({ role: null, emailConfirmed: null, accountStatus: null });
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WEB_URL) {
          window.location.href = `${process.env.NEXT_PUBLIC_WEB_URL}/login`;
        }
      }
      setValidatingAuth(false);
    }

    fetchData();
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        setIsLoggedIn,
        validatingAuth,
        setValidatingAuth,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

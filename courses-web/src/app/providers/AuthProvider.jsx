"use client";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { getData } from "@/app/helpers/functions/getData";

export const AuthContext = createContext(null);
export default function AuthProvider({ children }) {
  const [user, setUser] = useState({
    role: null,
    emailConfirmed: null,
  });
  // DB-relational profiles the user holds + which is active. Switching the current
  // profile re-pulls /auth/me (refetchMe), which re-gates the whole app. These are the
  // fields the ProfileSwitcher reads — profiles are the source of truth, not role.
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [validatingAuth, setValidatingAuth] = useState(true);

  const fetchMe = useCallback(async () => {
    setValidatingAuth(true);
    // Session lives on the lead site (web/). getData → /v2 auth/me via the path map,
    // auto-refreshing the access token on 401. The identity fields we rely on are
    // `profile` (active profile key) + `profiles`, NOT the legacy role/subRoles.
    const res = await getData({ url: "auth/status", setLoading: () => {} });
    const me = res && res.status === 200 ? res.data?.user : null;
    if (me) {
      setUser(me);
      setProfiles(me.profiles ?? []);
      setCurrentProfileId(me.currentProfileId ?? null);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setProfiles([]);
      setCurrentProfileId(null);
      setUser({ role: null, emailConfirmed: null, accountStatus: null });
      // Login lives on the lead site; send unauthenticated users there.
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WEB_URL) {
        window.location.href = `${process.env.NEXT_PUBLIC_WEB_URL}/login`;
      }
    }
    setValidatingAuth(false);
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        currentProfileId,
        isLoggedIn,
        setIsLoggedIn,
        validatingAuth,
        setValidatingAuth,
        setUser,
        refetchMe: fetchMe,
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

"use client";
import { createContext, useContext, useEffect, useState } from "react";
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
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/auth/status`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();
        let user;
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        if (
          window.localStorage.getItem("role") &&
          window.localStorage.getItem("userId")
        ) {
          if (
            result.user.id === parseInt(window.localStorage.getItem("userId"))
          ) {
            user = {
              ...result.user,
              role: window.localStorage.getItem("role"),
            };
          } else {
            user = result.user;
          }
        } else {
          user = result.user;
        }
        setUser(user);

        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
        setUser({
          role: null,
          emailConfirmed: null,
          accountStatus: null,
        });
      } finally {
        setValidatingAuth(false);
      }
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

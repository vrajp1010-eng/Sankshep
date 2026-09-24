import React, { createContext, useContext, useState, useCallback } from "react";
import { API_URL } from "../constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ id: "guest", email: "guest@sankshep.ai", name: "Guest User" });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("dummy_token");

  // Dummy functions that just pretend to succeed
  const register = useCallback(async () => ({ message: "Success" }), []);
  const login = useCallback(async () => ({ message: "Success" }), []);
  const verifyOtp = useCallback(async () => ({ token: "dummy_token", user }), [user]);
  const resendOtp = useCallback(async () => ({ message: "Success" }), []);
  const googleSignIn = useCallback(async () => ({ token: "dummy_token", user }), [user]);
  const logout = useCallback(() => {}, []);
  
  // Fake authFetch that just calls regular fetch without complaining about 401s
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
      };
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  const value = {
    user,
    token,
    loading,
    register,
    login,
    verifyOtp,
    resendOtp,
    googleSignIn,
    logout,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

import React, { createContext, useContext, useState, useEffect } from "react";
import API from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("da_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      API.get("/auth/me")
        .then((r) => setUser(r.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem("da_token", t);
    setToken(t);
    setUser(u);
    return u;
  };

  const signup = async (name, email, password, role) => {
    const res = await API.post("/auth/register", { name, email, password, role });
    const { token: t, user: u } = res.data;
    localStorage.setItem("da_token", t);
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem("da_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

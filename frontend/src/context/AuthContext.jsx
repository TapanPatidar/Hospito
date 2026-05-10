import API from "../api";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// keep cookies enabled
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  // CHECK AUTH STATUS
  useEffect(() => {
    axios
      .get(`${API}/api/auth/me`, {
        withCredentials: true
      })
      .then((response) => {
        setUser(response.data.user);
      })
      .catch((err) => {
        console.log("AUTH CHECK FAILED:", err?.response?.data || err.message);
        setUser(null);
      });
  }, []);

  // LOGIN
  async function login(email, password) {
    const response = await axios.post(
      `${API}/api/auth/login`,
      { email, password },
      {
        withCredentials: true
      }
    );

    setUser(response.data.user);
    return response.data.user;
  }

  // REGISTER
  async function register(data) {
    const response = await axios.post(
      `${API}/api/auth/register`,
      data,
      {
        withCredentials: true
      }
    );

    setUser(response.data.user);
    return response.data.user;
  }

  // LOGOUT
  async function logout() {
    await axios.post(
      `${API}/api/auth/logout`,
      {},
      {
        withCredentials: true
      }
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// HOOK
export function useAuth() {
  return useContext(AuthContext);
}

// ERROR HANDLER
export function formatApiError(detail) {
  if (!detail) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || JSON.stringify(item)).join(" ");
  }
  if (typeof detail?.msg === "string") return detail.msg;
  return String(detail);
}
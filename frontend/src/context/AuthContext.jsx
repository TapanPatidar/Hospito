import API from "../api";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    axios
      .get(`${API}/auth/me`, {
        withCredentials: true
      })
      .then(response => setUser(response.data.user))
      .catch(() => setUser(null));
  }, []);

  async function login(email, password) {
    const response = await axios.post(
      `${API}/auth/login`,
      { email, password },
      {
        withCredentials: true
      }
    );

    setUser(response.data.user);
    return response.data.user;
  }

  async function register(data) {
    const response = await axios.post(
      `${API}/auth/register`,
      data,
      {
        withCredentials: true
      }
    );

    setUser(response.data.user);
    return response.data.user;
  }

  async function logout() {
    await axios.post(
      `${API}/auth/logout`,
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

export function useAuth() {
  return useContext(AuthContext);
}

export function formatApiError(detail) {
  if (!detail) return "Something went wrong. Please try again.";

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map(item => item?.msg || JSON.stringify(item))
      .join(" ");
  }

  if (typeof detail?.msg === "string") return detail.msg;

  return String(detail);
}
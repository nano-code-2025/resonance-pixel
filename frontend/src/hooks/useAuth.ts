import { useState } from "react";
import { api } from "../services/api";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isNew, setIsNew] = useState(false);

  const login = async (phone: string, otp: string) => {
    const result = await api.verifyOtp(phone, otp);
    localStorage.setItem("token", result.token);
    setToken(result.token);
    setIsNew(result.is_new);
    return result;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return { token, isNew, login, logout, isAuthenticated: !!token };
}

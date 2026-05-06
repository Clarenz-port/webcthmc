import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/reset-password");
  }, [navigate]);
  return null;
}

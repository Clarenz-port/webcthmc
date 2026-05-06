import { useState } from "react";
import API from "../../apis/axios.js";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: reset
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const navigate = useNavigate();

  // Step 1: Send phone
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await API.post("/api/auth/forgot-password", { phone });
      if (res.data.success) {
        setStep(2);
        setMessage("OTP sent to your phone.");
      } else {
        setError(res.data.message || "Phone number not found.");
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await API.post("/api/auth/verify-otp", { phone, otp });
      if (res.data.success) {
        setStep(3);
        setMessage("OTP verified. Set new password or username.");
      } else {
        setError(res.data.message || "Invalid OTP.");
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    }
    setLoading(false);
  };

  // Step 3: Set new password/username
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    // Require at least one of newPassword or newUsername
    if (!newPassword && !newUsername) {
      setError("Please enter a new password, a new username, or both.");
      return;
    }
    // If newPassword is provided, confirmPassword must match
    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/api/auth/reset-password", { phone, otp, newPassword, newUsername });
      if (res.data.success) {
        setMessage("Password/Username updated. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setError(res.data.message || "Failed to reset password/username.");
      }
    } catch (err) {
      setError("Failed to reset. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-emerald-800 mb-6 text-center">Forgot Password</h2>
        {step === 1 && (
          <form onSubmit={handlePhoneSubmit}>
            <label className="block text-emerald-800 font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              className="w-full border-b-2 border-emerald-800 py-2 px-1 mb-4 focus:outline-none"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              placeholder="Enter your phone number"
            />
            {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
            {message && <div className="text-green-600 mb-2 text-sm">{message}</div>}
            <button
              type="submit"
              className="w-full bg-emerald-800 text-white py-3 rounded-full font-bold text-lg shadow-lg hover:bg-emerald-900 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit}>
            <label className="block text-emerald-800 font-medium mb-2">Enter OTP</label>
            <input
              type="text"
              className="w-full border-b-2 border-emerald-800 py-2 px-1 mb-4 focus:outline-none"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              placeholder="Enter the OTP sent to your phone"
            />
            {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
            {message && <div className="text-green-600 mb-2 text-sm">{message}</div>}
            <button
              type="submit"
              className="w-full bg-emerald-800 text-white py-3 rounded-full font-bold text-lg shadow-lg hover:bg-emerald-900 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleResetSubmit}>
            <label className="block text-emerald-800 font-medium mb-2">New Password</label>
            <input
              type="password"
              className="w-full border-b-2 border-emerald-800 py-2 px-1 mb-4 focus:outline-none"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password (optional)"
            />
            <label className="block text-emerald-800 font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              className="w-full border-b-2 border-emerald-800 py-2 px-1 mb-4 focus:outline-none"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={!newPassword}
              required={!!newPassword}
            />
            <label className="block text-emerald-800 font-medium mb-2">New Username (optional)</label>
            <input
              type="text"
              className="w-full border-b-2 border-emerald-800 py-2 px-1 mb-4 focus:outline-none"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Enter new username (optional)"
            />
            {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
            {message && <div className="text-green-600 mb-2 text-sm">{message}</div>}
            <button
              type="submit"
              className="w-full bg-emerald-800 text-white py-3 rounded-full font-bold text-lg shadow-lg hover:bg-emerald-900 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password/Username"}
            </button>
          </form>
        )}
        <button
          type="button"
          className="w-full mt-4 bg-gray-200 text-emerald-800 py-2 rounded-full font-semibold text-md shadow hover:bg-gray-300 transition-all duration-200"
          onClick={() => {
            if (step === 1) {
              navigate("/login");
            } else {
              navigate(-1);
            }
          }}
        >
          {step === 1 ? "Back to Login" : "Go Back"}
        </button>
      </div>
    </div>
  );
}

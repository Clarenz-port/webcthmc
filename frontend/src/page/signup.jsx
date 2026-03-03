
import { notify } from "../utils/toast";
import { useState, useEffect } from "react";
import API from '../apis/axios.js';
import { Link, useNavigate } from "react-router-dom";

import { 
  FaUser, FaEnvelope, FaCalendar, FaMapMarkerAlt, 
  FaPhone, FaLock, FaEye, FaEyeSlash, FaIdCard ,  FaLeaf, FaSignInAlt
} from "react-icons/fa";

export default function Signup() {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await API.get("/api/config");
        setSiteLogo(res.data.logo || null);
        setSiteName(res.data.siteName || "CTHMC");
      } catch {
        setSiteLogo(null);
        setSiteName("CTHMC");
      }
    };
    fetchConfig();
  }, []);

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    address: "",
    email: "",          // ✅ added
    birthdate: "",      // ✅ added
    username: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState('CTHMC');

  // Handles typing in inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      notify.error("Passwords do not match.");
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");

      await API.post("/api/auth/register", {
        firstName: form.first_name,
        middleName: form.middle_name,
        lastName: form.last_name,
        address: form.address,
        email: form.email,              // ✅ added
        birthdate: form.birthdate,      // ✅ added
        phoneNumber: form.phone_number,
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      notify.success("Registration successful!");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      setError(msg);
      notify.error(msg);
    }
  };

  return (
   <div className="relative min-h-screen flex items-center bg-cover bg-center overflow-hidden "
  style={{
    backgroundImage: "url('/images/finance-bg.png')",
  }}
>
  {/* SOFT OVERLAY */}
  <div className="absolute inset-0 bg-[#DFE8DF]/50"></div>

  {/* LIGHT SWEEP EFFECT */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-0 left-0 w-[40%] h-full bg-white/40 blur-3xl
      animate-[lightSweep_18s_ease-in-out_infinite]" />
  </div>

  {/* EXISTING SHAPES (unchanged) */}
  <div className="absolute right-0 top-0 w-[60%] h-full opacity-40 pointer-events-none">
    <div className="absolute -top-24 right-[-120px] w-[500px] h-[500px] rounded-full bg-emerald-700/60"></div>
    <div className="absolute top-[200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-800/60"></div>
  </div>
      <div className="max-w-5xl mx-auto mt-10 grid grid-cols-2 relative">

        {/* Left Panel */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 shadow-2xl rounded-3xl p-10 w-[520px] flex flex-col items-center justify-center relative overflow-hidden text-white">
  
  {/* DECORATIVE BACKGROUND SHAPES */}
  <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
  <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

  {/* LOGO SECTION */}
  <div className="flex flex-col items-center mb-14 z-10">
    <div className="bg-white/10 rounded-full mb-4 backdrop-blur-sm shadow-inner">
      {siteLogo ? (
        <img src={siteLogo} alt={siteName || 'logo'} className="w-25 h-25 object-cover rounded-full" />
      ) : (
        <FaLeaf size={48} className="text-emerald-100" />
      )}
    </div>
    <h2 className="text-5xl font-extrabold text-center text-white">
      {siteName || 'CTHMC'}<br></br>
      <p className="text-[10px] mt-2">Carmona Townhomes Homeowners Multipurpose Cooperative</p>
    </h2>
  </div>

  {/* TEXT SECTION */}
  <div className="text-center mb-14 z-10">
    <h2 className="text-6xl font-extrabold mb-4 text-white">
      Welcome
    </h2>
    <p className="text-emerald-100/80 font-medium text-lg">
      Already have an account?
    </p>
  </div>

  {/* LOGIN BUTTON */}
  <div className="z-10">
    <Link
      to="/login"
      className="group flex items-center gap-3 text-xl font-bold bg-white text-emerald-900 px-14 py-5 rounded-full shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] hover:bg-emerald-50 hover:scale-105 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out"
    >
      <span>Login</span>
      <FaSignInAlt className="group-hover:translate-x-1 transition-transform duration-300" />
    </Link>
  </div>

</div>

        {/* Signup Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-8 w-[520px] bg-emerald-50/90 backdrop-blur-sm shadow-2xl space-y-3 border border-white/50"
        >
          <h2 className="text-4xl font-bold text-center text-emerald-800">Create your account</h2>

          {/* Name Fields */}
          <div className="flex gap-2">
            <input name="first_name" placeholder="First Name" required value={form.first_name} onChange={handleChange} className="form-input flex-1" />
            <input name="middle_name" placeholder="Middle Name" value={form.middle_name} onChange={handleChange} className="form-input flex-1" />
            <input name="last_name" placeholder="Last Name" required value={form.last_name} onChange={handleChange} className="form-input flex-1" />
          </div>

          {/* Birthdate (added) */}
          <input
            name="birthdate"
            type="date"
            placeholder="Birthdate"
            required
            value={form.birthdate}
            onChange={handleChange}
            className="form-input"
            max={new Date().toISOString().split('T')[0]}
            onKeyDown={e => {
              // Allow Tab, Arrow keys, Home, End, Delete, Backspace
              const allowed = [
                'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Home', 'End', 'Delete', 'Backspace'
              ];
              if (!allowed.includes(e.key)) {
                e.preventDefault();
              }
            }}
          />

          {/* Email (added) */}
          <input
            name="email"
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="form-input"
          />

          {/* Address */}
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className="form-input" />

          {/* Account Info */}
          <input
            name="phone_number"
            placeholder="Phone Number"
            type="tel"
            required
            value={form.phone_number}
            onChange={handleChange}
            className="form-input"
            pattern="[0-9]{11}"
            maxLength={11}
            minLength={11}
            title="Phone number must be exactly 11 digits"
            inputMode="numeric"
          />
          <input
            name="username"
            placeholder="Username"
            required
            value={form.username}
            onChange={handleChange}
            className="form-input"
            minLength={7}
            title="Username must be at least 7 characters"
          />
          

          {/* Password */}
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={form.password}
              onChange={handleChange}
              className="form-input pr-16"
              minLength={7}
              maxLength={14}
              title="Password must be 7-14 characters"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-sm text-emerald-800">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="form-input pr-16"
              minLength={7}
              maxLength={14}
              title="Password must be 7-14 characters"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-2 text-sm text-emerald-800">
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Agreement */}
          <div className="flex items-center">
            <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
            <label className="ml-2 text-sm">
              I agree to the <span className="text-emerald-600 font-medium">Terms & Conditions</span>
            </label>
          </div>

          {/* Error (toast only, no inline) */}

          {/* Submit */}
          <button
            type="submit"
            disabled={!form.agree}
            className="w-full bg-emerald-800 hover:bg-[#a5b295] text-white font-bold py-3 rounded-3xl mt-2"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

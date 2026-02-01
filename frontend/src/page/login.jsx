import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { FaLeaf, FaArrowRight } from "react-icons/fa";

/* =========================
   ERROR POPUP COMPONENT
========================= */
function ErrorPopup({ message }) {
  if (!message) return null;

  return (
    <div className="absolute -right-46 top-6 -translate-y- z-50">
      <div className="relative bg-red-600 text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-lg w-38">
        {message}

        {/* Arrow */}
        <div
          className="absolute left-[-8px] top-6 -translate-y-1/2 
          w-0 h-0 border-t-8 border-b-8 border-r-8
          border-t-transparent border-b-transparent border-r-red-600"
        />
      </div>
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState('CTHMC');
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      const logo = localStorage.getItem('siteLogo');
      const sname = localStorage.getItem('siteName') || 'CTHMC';
      setSiteLogo(logo);
      setSiteName(sname);
    };

    load();
    window.addEventListener('siteConfigChanged', load);
    return () => window.removeEventListener('siteConfigChanged', load);
  }, []);

  const handleSubmit = async (e) => { 
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8000/api/auth/login", {
        username,
        password,
      });

      if (response.status === 200) {
        const user = response.data.user;

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role);
        localStorage.setItem("username", user.username);

        if (user.role === "member") {
          navigate("/member", { replace: true });
        } else {
          navigate("/admin", { replace: true });
        }
      }
    } catch (err) {
      setError(
        "The username or password that you've entered doesn't match any account."
      );
      console.error(err);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url('/images/finance-bg.png')" }}
    >
      {/* OVERLAY */}
      <div className="absolute inset-0 bg-[#DFE8DF]/50"></div>

      {/* LIGHT SWEEP */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[40%] h-full bg-white/40 blur-3xl animate-[lightSweep_18s_ease-in-out_infinite]" />
      </div>

      {/* SHAPES */}
      <div className="absolute right-0 top-0 w-[60%] h-full opacity-40 pointer-events-none">
        <div className="absolute -top-24 right-[-120px] w-[500px] h-[500px] rounded-full bg-emerald-700/60"></div>
        <div className="absolute top-[200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-800/60"></div>
      </div>

      <div className="max-w-3xl right-10 gap-20 mx-auto mt-10 grid grid-cols-2 relative">
        {/* LEFT */}
        <div className="bg-gradient-to-b from-emerald-800 to-emerald-900 z-10 shadow-2xl rounded-3xl p-8 w-[450px] flex flex-col items-center justify-center text-center relative overflow-hidden">
  
  {/* Optional: Subtle decorative circle in background */}
  <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

  {/* LOGO SECTION */}
  <div className="mt-10 mb-12">
    <div className="flex justify-center mb-4">
      {siteLogo ? (
        <img src={siteLogo} alt={siteName || 'logo'} className="w-25 h-25 object-cover rounded-full bg-white/40" />
      ) : (
        <FaLeaf className="text-6xl text-emerald-200/80" />
      )}
    </div>
 
  </div>

  {/* WELCOME TEXT */}
  <div className="mb-14">
    <h2 className="text-5xl font-extrabold text-white mb-3 drop-shadow-md">
      Welcome
    </h2>
    <h2 className="font-medium text-lg text-emerald-100/80">
      Sign up now
    </h2>
  </div>

  {/* SIGNUP BUTTON */}
  <div className="mb-16">
    <Link
      to="/signup"
      className="group flex items-center justify-center gap-3 text-lg font-bold bg-white text-emerald-900 px-12 py-4 rounded-full shadow-lg hover:bg-emerald-50 hover:scale-105 transition-all duration-300 ease-in-out"
    >
      <span>Signup</span>
      {/* Added a small arrow icon that moves on hover */}
      <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
    </Link>
  </div>

</div>

        {/* RIGHT */}
        <div className="rounded-3xl p-8 w-[430px] bg-emerald-50/90 backdrop-blur-sm shadow-2xl space-y-5 border border-white/50">
          <h2 className="text-5xl font-extrabold text-center mt-5 mb-8 text-emerald-800">
            {siteName || 'CTHMC'}
          </h2>
          <h2 className="text-xl font-bold text-center mb-8 text-emerald-800">
            Login
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="ml-15 mr-15">
              {/* USERNAME */}
              <div className="relative">
                <label className="block text-sm font-medium text-emerald-800 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className={`w-full border-b-2 bg-transparent py-2 px-1 focus:outline-none ${
                    error ? "border-red-500" : "border-emerald-800"
                  }`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                />
                <ErrorPopup message={error} />
              </div>

              {/* PASSWORD */}
              <div className="mt-2 relative">
                <label className="block text-sm font-medium text-emerald-800 mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={`w-full border-b-2 bg-transparent py-2 px-1 pr-16 focus:outline-none ${
                    error ? "border-red-500" : "border-emerald-800"
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-8 text-sm text-emerald-800 font-semibold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

   
              </div>

              {/* FORGOT */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="w-full mt-10 mb-12 bg-emerald-800 text-white py-4 rounded-full font-bold text-lg shadow-lg hover:bg-emerald-900 hover:shadow-xl transform active:scale-95 transition-all duration-200"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

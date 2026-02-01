import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaPhoneAlt, FaLeaf, FaArrowRight } from "react-icons/fa";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInAboutSection, setIsInAboutSection] = useState(false);
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState("CTHMC");

  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById("about");
      const scrollY = window.scrollY;
      if (aboutSection) {
        const offsetTop = aboutSection.offsetTop;
        const offsetHeight = aboutSection.offsetHeight;

        if (scrollY >= offsetTop - 100 && scrollY < offsetTop + offsetHeight) {
          setIsInAboutSection(true);
        } else {
          setIsInAboutSection(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
   <nav
  className="fixed top-4 inset-x-4 rounded-3xl z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border border-white/50 shadow-xl"
>
  <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between relative">
    
    {/* LOGO SECTION */}
    <Link
      to="/"
      state={{ scrollTo: "home" }}
      className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold text-emerald-800 flex-none tracking-tight hover:opacity-80 transition-opacity"
    >
      <div className="bg-emerald-100 p- rounded-full text-emerald-600 h-13 w-13 flex items-center justify-center overflow-hidden">
        {siteLogo ? (
          <img src={siteLogo} alt={siteName || 'logo'} className="h-full w-full object-contain rounded-full bg-white p-" />
        ) : (
          <FaLeaf size={18} />
        )}
      </div>
      <span className="ml-2">{siteName || 'CTHMC'}</span>
    </Link>

    {/* CENTER LINKS (Desktop) */}
    <div className="hidden md:flex items-center space-x-12 absolute left-1/2 transform -translate-x-1/2">
      {[
        { to: "/", scroll: "home", label: "Home" },
        { to: "/", scroll: "about", label: "About" },
        { to: "/", scroll: "contact", label: "Contact" },
      ].map((link) => (
        <Link
          key={link.label}
          to={link.to}
          state={{ scrollTo: link.scroll }}
          className="relative group flex items-center gap-2 font-bold text-emerald-800/80 hover:text-emerald-900 text-base lg:text-lg transition-colors"
        >
          <span className="text-emerald-500 group-hover:-translate-y-1 transition-transform duration-300">
            {link.icon}
          </span>
          {link.label}
          {/* Animated Underline */}
          <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-emerald-600 rounded-full transition-all duration-300 ease-out group-hover:w-full"></span>
        </Link>
      ))}
    </div>

    {/* RIGHT ACTION (Login) */}
    <div className="hidden md:flex items-center flex-none">
      <Link
        to="/login"
        className="group relative px-6 py-2.5 bg-emerald-800 text-white rounded-full font-bold shadow-lg shadow-emerald-800/20 overflow-hidden transition-all hover:scale-105 hover:shadow-emerald-800/40 active:scale-95"
      >
        <span className="relative z-10 flex items-center gap-2">
          Login <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
        </span>
        {/* Hover Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
    </div>

    {/* MOBILE TOGGLE */}
    <button
      className="md:hidden p-2 text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
      onClick={() => setIsOpen(!isOpen)}
      aria-label="Toggle menu"
    >
      {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
    </button>
  </div>

  {/* MOBILE MENU */}
  {/* I added a transition effect container here */}
  <div 
    className={`md:hidden absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-top ${
      isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
    }`}
  >
    <div className="flex flex-col p-4 space-y-2">
      {[
        { to: "/", scroll: "home", label: "Home"},
        { to: "/", scroll: "about", label: "About"},
        { to: "/", scroll: "contact", label: "Contact" },
      ].map((link) => (
        <Link
          key={link.label}
          to={link.to}
          state={{ scrollTo: link.scroll }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all"
        >
          <span className="text-emerald-500">{link.icon}</span>
          {link.label}
        </Link>
      ))}
      
      <div className="pt-2 mt-2 border-t border-gray-100">
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 w-full text-center font-bold bg-emerald-800 text-white px-4 py-3 rounded-xl hover:bg-emerald-900 transition-colors shadow-md"
        >
          Login Account
        </Link>
      </div>
    </div>
  </div>
</nav>

  );
}
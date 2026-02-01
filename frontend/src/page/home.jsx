import ads from '../design/aboutde (1).png';
import { FaArrowRight } from 'react-icons/fa6';
import {  
  FaGlobe, 
  FaUserPlus,
  FaUsers, 
  FaHandshake,
  FaLightbulb,
  FaLock,
  FaPaperPlane, FaCommentDots, FaQuestionCircle
} from "react-icons/fa";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";
import { FaCalculator, FaChartPie, FaShieldAlt, FaUserCheck} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

export default function Home() {
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [siteLogo, setSiteLogo] = useState(null);
  const [aboutTitle, setAboutTitle] = useState('About CTHMC');
  const [aboutText, setAboutText] = useState('');

  useEffect(() => {
    const load = () => {
      const logo = localStorage.getItem('siteLogo');
      const at = localStorage.getItem('aboutText');
      const atitle = localStorage.getItem('aboutTitle');
      setSiteLogo(logo);
      setAboutText(at ?? "");
      setAboutTitle(atitle ?? 'About CTHMC');
    };

    load();
    window.addEventListener('siteConfigChanged', load);
    return () => window.removeEventListener('siteConfigChanged', load);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just log the values. You can integrate with backend later.
    console.log('Email:', email, 'Message:', message);
    // Reset form
    setEmail('');
    setMessage('');
  };

useEffect(() => {
  const scrollTo = location.state?.scrollTo;
  if (scrollTo) {
    const element = document.getElementById(scrollTo);
    if (element) {
      // Scroll to the section smoothly
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth" });
      }, 100); // Delay helps in case layout isn't ready immediately
    }
  }
}, [location]);

  return (
    <>
    <div
      id="home"
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center overflow-hidden font-sans"
      style={{
        backgroundImage: "url('/images/finance-bg.png')",
      }}
    >
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/95 via-[#DFE8DF]/90 to-emerald-100/90 backdrop-blur-[2px]"></div>
      
      {/* Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-teal-600/10 rounded-full blur-[120px]" />
      </div>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <div className="relative z-10 w-full max-w-7xl px-6 py-12 lg:py-24 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* ========================================= */}
        {/* LEFT COLUMN: (TEXT & BUTTONS - UNCHANGED) */}
        {/* ========================================= */}
        <div className="flex flex-col text-center lg:text-left space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center self-center lg:self-start gap-2 px-4 py-2 rounded-full bg-emerald-100/80 border border-emerald-200 backdrop-blur-sm text-emerald-800 text-sm font-bold shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            Open for New Members
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl font-black text-emerald-950 tracking-tight leading-[1.1]">
            Unlock Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-800">
              CTHMC Future
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-emerald-900/70 text-lg lg:text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Join a growing community dedicated to financial growth and stability. Secure your spot today and start your journey with us.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link
              to="/signup"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-800 text-white font-bold text-lg rounded-xl overflow-hidden transition-all duration-300 hover:bg-emerald-700 hover:shadow-[0_20px_40px_-15px_rgba(6,95,70,0.4)] hover:-translate-y-1"
            >
              <span>Join Now</span>
              <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
            </Link>
          </div>

          {/* Feature Strip */}
          <div className="pt-8 border-t border-emerald-900/10 flex flex-wrap justify-center lg:justify-start gap-6 lg:gap-12">
            {[
              { icon: FaShieldAlt, text: "Secure Data" },
              { icon: FaUsers, text: "Community" },
              { icon: FaGlobe, text: "Accessible" },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-emerald-800/80 font-semibold text-sm">
                <feature.icon className="text-xl text-emerald-600" />
                {feature.text}
              </div>
            ))}
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT COLUMN: ABSTRACT NETWORK ORBITS     */}
        {/* ========================================= */}
        <div className="relative hidden lg:flex h-full min-h-[600px] items-center justify-center">
          
          {/* Core Center Glow */}
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-emerald-200/40 to-teal-200/40 rounded-full blur-[80px] animate-pulse"></div>

          {/* -- ORBIT SYSTEM -- */}
          <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            
            {/* Center Piece (Logo/Brand Representation) */}
            <div className="relative z-20 w-32 h-32 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] border-4 border-emerald-100 overflow-hidden">
               {siteLogo ? (
                 <img src={siteLogo} alt="site logo" className="object-contain w-full h-full bg-white rounded-full" />
               ) : (
                 <FaUserPlus className="text-5xl text-white" />
               )}
            </div>

            {/* Orbit Ring 1 (Small) */}
            <div className="absolute w-64 h-64 border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-emerald-600">
                <FaLock />
              </div>
            </div>

            {/* Orbit Ring 2 (Medium) */}
            <div className="absolute w-96 h-96 border border-emerald-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]">
              <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-teal-600">
                <FaHandshake className="text-2xl" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-10 h-10 bg-emerald-50 rounded-full shadow-md flex items-center justify-center text-emerald-500">
                 <div className="w-3 h-3 bg-current rounded-full"></div>
              </div>
            </div>

            {/* Orbit Ring 3 (Large) */}
            <div className="absolute w-[500px] h-[500px] border border-emerald-500/10 rounded-full animate-[spin_20s_linear_infinite]">
               <div className="absolute top-[15%] left-[15%] w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-emerald-700 animate-bounce">
                  <FaLightbulb className="text-3xl" />
               </div>
               <div className="absolute bottom-[20%] right-[10%] w-12 h-12 bg-emerald-100 rounded-full shadow-lg flex items-center justify-center text-emerald-800">
                  <FaUsers />
               </div>
            </div>

            {/* Decoration Dots floating around */}
            <div className="absolute inset-0 animate-[pulse_4s_infinite]">
               <div className="absolute top-10 right-20 w-4 h-4 bg-emerald-400 rounded-full opacity-50"></div>
               <div className="absolute bottom-20 left-10 w-6 h-6 bg-teal-300 rounded-full opacity-40"></div>
               <div className="absolute top-1/2 left-10 w-3 h-3 bg-emerald-600 rounded-full opacity-30"></div>
            </div>

          </div>
        </div>

      </div>
    </div>

      <div id="about" className="bg-gradient-to-b from-white to-gray-50 mt-12 py-15 relative overflow-hidden">
  
  {/* DECORATIVE BACKGROUND ELEMENTS (Optional subtle shapes) */}
  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-60 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

  <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

    {/* --- ABOUT SECTION --- */}
    <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
      
      {/* Left: Content */}
      <div className="order-2 lg:order-1 space-y-8 animate-in slide-in-from-left-8 duration-700">
        <div>
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold uppercase tracking-widest mb-4">
            Who We Are
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            {aboutTitle.includes('CTHMC') ? (
              <>About <span className="text-emerald-700">CTHMC</span></>
            ) : (
              aboutTitle
            )}
          </h2>
          <div className="w-20 h-1.5 bg-emerald-500 rounded-full mb-8"></div>
        </div>

        <div className="text-lg text-gray-600 leading-relaxed space-y-6 text-justify">
          {aboutText ? (
            aboutText.split(/\n\n|\n/).map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <>
              <p>
                Welcome to <span className="font-bold text-gray-900">Carmona Townhomes Homeowners Multipurpose Cooperative</span>, 
                a modern <span className="text-emerald-700 font-semibold">Financial Management System</span> designed to revolutionize 
                how cooperatives operate.
              </p>
              <p>
                Our objective is to simplify financial monitoring, increase transparency, 
                and enable organizations to effortlessly manage their members' shares and loans 
                through a secure, digital platform.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right: Image with Frame */}
      <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
        {/* Decorative Frame */}
        <div className="absolute inset-0 bg-emerald-900/5 rounded-[2.5rem] rotate-3 scale-[1.02] transform"></div>
        <img
          src={ads}
          alt="CTHMC Dashboard Preview"
          className="relative rounded-[2.5rem] shadow-2xl border-4 border-white object-cover z-10 hover:scale-[1.01] transition-transform duration-500"
        />
      </div>
    </div>


    {/* --- WHY CHOOSE US SECTION --- */}
    <div className="mt-20">
      <div className="text-center max-w-3xl mx-auto mb-22 space-y-4">
        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900">
          Why Choose <span className="text-emerald-700">CTHMC?</span>
        </h2>
        <p className="text-xl text-gray-500">
          We provide the tools you need to ensure financial accuracy and growth.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Feature 1 */}
        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-100 hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <FaCalculator />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Automated Calculations</h3>
          <p className="text-gray-500 leading-relaxed">
            Eliminate manual errors with automated interest and loan computations.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-100 hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FaChartPie />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Real-Time Analytics</h3>
          <p className="text-gray-500 leading-relaxed">
            Instant access to financial statements and performance tracking reports.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-100 hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <FaShieldAlt />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Secure & Transparent</h3>
          <p className="text-gray-500 leading-relaxed">
            Advanced data encryption and detailed audit logs for full accountability.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-100 hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <FaUserCheck />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">User-Friendly</h3>
          <p className="text-gray-500 leading-relaxed">
            Intuitive navigation designed for both administrators and members.
          </p>
        </div>

      </div>
    </div>
  </div>
</div>
<div id="contact" className="bg-gradient-to-b from-gray-50 to-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
{/* --- ASK A QUESTION SECTION --- */}
<div className="py-24 relative overflow-hidden">
  
  {/* Background Decoration (Subtle) */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-100/40 rounded-full blur-[120px] pointer-events-none" />

  <div className="max-w-3xl mx-auto px-6 relative z-10">
    
    {/* HEADER SECTION */}
    <div className="text-center mb-10 space-y-3">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg shadow-emerald-100 text-emerald-600 mb-4 rotate-3 hover:rotate-6 transition-transform">
        <FaQuestionCircle size={32} />
      </div>
      <h2 className="text-4xl font-black text-gray-900 tracking-tight">
        Have a Question?
      </h2>
      <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
        We're here to help! Send us a message and our support team will get back to you shortly.
      </p>
    </div>

    {/* FORM CARD */}
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-white/50 backdrop-blur-xl relative">
      
      {/* Decorative "Stamp" */}
      <div className="absolute top-8 right-8 text-gray-100 pointer-events-none hidden md:block">
        <FaPaperPlane size={120} className="opacity-10 -rotate-12" />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        
        {/* EMAIL INPUT */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
            Your Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <FaEnvelope className="text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-emerald-500 focus:shadow-xl focus:shadow-emerald-500/10 transition-all duration-300"
              placeholder="name@example.com"
              required
            />
          </div>
        </div>

        {/* MESSAGE INPUT */}
        <div className="space-y-2">
          <label htmlFor="message" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
            How can we help?
          </label>
          <div className="relative group">
            <div className="absolute top-5 left-5 pointer-events-none">
              <FaCommentDots className="text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            </div>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="5"
              className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none font-medium text-gray-700 placeholder-gray-300 focus:bg-white focus:border-emerald-500 focus:shadow-xl focus:shadow-emerald-500/10 transition-all duration-300 resize-none"
              placeholder="Tell us a little bit about your question..."
              required
            ></textarea>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            className="group w-full bg-emerald-600 text-white py-5 px-8 rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span>Send Message</span>
            <FaPaperPlane className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
          </button>
        </div>

      </form>
    </div>

    {/* Footer Note */}
    <p className="text-center text-gray-400 text-sm font-medium mt-8">
      Typically replies in <span className="text-emerald-600 font-bold">1-2 business days</span>.
    </p>

  </div>
</div>

    {/* Floating Contact Card */}
    <div className="relative rounded-[3rem] overflow-hidden bg-[#064e3b] mt-12 shadow-2xl shadow-emerald-900/20 isolate">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 p-10 md:p-16 lg:p-20 relative z-10">
        
        {/* Left: Text Content */}
        <div className="space-y-8">
          <div>
            <span className="inline-block py-1 px-3 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-100 text-xs font-bold uppercase tracking-widest mb-4">
              Get in Touch
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              We'd love to hear <br /> from you.
            </h2>
          </div>
          
          <p className="text-lg text-emerald-100/80 leading-relaxed max-w-md">
            Have questions about financial management? Looking for a seamless solution to track shares and loans? We’re here to help!
          </p>

          <div className="flex gap-4 pt-4">
             {/* Social Placeholders */}
             <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-emerald-500 hover:scale-110 transition-all">
                <FaFacebook size={18} />
             </a>
             <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-emerald-500 hover:scale-110 transition-all">
                <FaTwitter size={18} />
             </a>
             <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-emerald-500 hover:scale-110 transition-all">
                <FaLinkedin size={18} />
             </a>
          </div>
        </div>

        {/* Right: Contact Details Grid */}
        <div className="flex flex-col justify-center space-y-8">
          
          {/* Email Item */}
          <div className="group flex items-start gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
              <FaEnvelope size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Email Support</h3>
              <p className="text-emerald-100/60 text-sm mb-2">Our friendly team is here to help.</p>
              <a href="mailto:CTHMC@gmail.com" className="text-emerald-300 font-bold hover:text-white transition-colors">
                CTHMC@gmail.com
              </a>
            </div>
          </div>

          {/* Phone Item */}
          <div className="group flex items-start gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
              <FaPhoneAlt size={22} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Phone</h3>
              <p className="text-emerald-100/60 text-sm mb-2">Mon-Fri from 8am to 5pm.</p>
              <a href="tel:09123456789" className="text-emerald-300 font-bold hover:text-white transition-colors">
                0912 345 6789
              </a>
            </div>
          </div>

          {/* Location Item (Optional addition) */}
          <div className="group flex items-start gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
              <FaMapMarkerAlt size={22} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Office</h3>
              <p className="text-emerald-100/60 text-sm">
                Carmona Estates, Cavite, Philippines
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>

{/* --- FOOTER SECTION --- */}
<footer className="bg-white pt-24 pb-12">
  <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
    <div className="mb-8">
      <h2 className="text-2xl font-black text-gray-900 tracking-tighter">CTHMC</h2>
      <p className="text-sm text-gray-500 font-medium">Financial Management System</p>
    </div>
    
    <div className="w-full h-px bg-gray-200 mb-8"></div>
    
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
      <p>&copy; 2025 CTHMC. All Rights Reserved.</p>
      <div className="flex gap-6 font-medium">
        <a href="#" className="hover:text-emerald-700 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-emerald-700 transition-colors">Terms of Service</a>
      </div>
    </div>
  </div>
</footer>
    </>
  );
}

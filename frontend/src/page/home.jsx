import hds from '../design/homede (1).png';
import ads from '../design/aboutde (1).png';

import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

export default function Home() {
  const location = useLocation();

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
  className="relative min-h-screen flex items-center bg-cover bg-center overflow-hidden"
  style={{
    backgroundImage: "url('/images/finance-bg.png')",
  }}
>
  {/* SOFT OVERLAY */}
  <div className="absolute inset-0 bg-[#DFE8DF]/50"></div>

  {/* EXTRA AMBIENT GLOW (ADDED) */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-[120px] animate-[floatSlow_25s_ease-in-out_infinite]" />
    <div className="absolute bottom-[-200px] right-1/3 w-[700px] h-[700px] bg-emerald-400/20 rounded-full blur-[140px] animate-[floatSlow_30s_ease-in-out_infinite]" />
  </div>

  {/* LIGHT SWEEP EFFECT */}
  <div className="absolute inset-0 pointer-events-none">
    <div
      className="absolute top-0 left-0 w-[40%] h-full bg-white/80 blur-xl
      animate-[lightSweep_18s_ease-in-out_infinite]"
    />
  </div>

  {/* CURVED GLASS WAVES (ADDED) */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute -top-20 left-[-10%] w-[120%] h-[120%] bg-white/10 rounded-full blur-3xl rotate-12"></div>
    <div className="absolute top-[20%] left-[-20%] w-[140%] h-[140%] bg-emerald-800/10 rounded-full blur-3xl -rotate-12"></div>
  </div>

  {/* FLOATING PARTICLES (ADDED) */}
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(14)].map((_, i) => (
      <span
        key={i}
        className="absolute w-2 h-2 bg-white/40 rounded-full blur-sm animate-[particleFloat_12s_linear_infinite]"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${i * 1.2}s`,
        }}
      />
    ))}
  </div>

  {/* EXISTING SHAPES (UNCHANGED) */}
  <div className="absolute right-0 top-0 w-[60%] h-full opacity-40 pointer-events-none">
    <div className="absolute -top-24 right-[-120px] w-[500px] h-[500px] rounded-full bg-emerald-700/60"></div>
    <div className="absolute top-[200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-800/60"></div>
  </div>

  {/* CONTENT */}
  <div className="ml-30 relative z-10 max-w-3xl px-10">
    <h2 className="mb-10 text-5xl xl:text-6xl font-extrabold text-emerald-900 leading-tight">
      Do you want to become a member
      <br />
      of <span className="text-emerald-700">CTHMC</span>?
    </h2>
    <Link
      to="/signup"
      className="mt-18 px-32 py-4  bg-emerald-800 text-white font-bold rounded-md
      hover:bg-emerald-700 transition
      animate-[buttonPulse_3.5s_ease-in-out_infinite] "
    >
      Join Now
    </Link>
  </div>
</div>


      <div id="about" className=" bg-white py-20 relative">
        <div className="max-w-7xl mx-auto grid xl:gap-30 gap-19 md:grid-cols-2  items-center">

          <div className="max-w-7xl mt-20 mx-auto space-y-5">
          <h2 className="text-4xl slab-text font-bold">ABOUT <span className="text-emerald-800">CTHMC</span></h2>
            <h2 className="text-2xl text-justify nopsa-text font-medium text-gray-900 leading-relaxed space-y-4">
              Welcome to <span className="font-extrabold">Carmona Townhomes </span>
              <span className="font-extrabold">Homeowners Multipurpose Cooperative</span>
              , a modern Financial 
              Management System that simplifies 
              cooperative and organizational
              financial operations. Our objective
              is to simplify financial monitoring,
              increase transparency, and enable 
              organizations to easily manage their
              members' shares and loans.
            </h2>
        </div>

          <div className="md:mt-20 space-y-4">
            <img
          src={ads}
          alt=""
          className="animate-slide-right md:scale-100"
        />
          </div>
    </div>


        <div className="max-w-6xl mx-auto mt-30 mb-20 px-4 space-y-16">
          <h2 className="text-5xl slab-text font-extrabold text-center">
            Why Choose <span className="text-emerald-800">CTHMC?</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-49 mt-20">
            <div className="text-center space-y-">
              <h3 className="text-2xl opsa-text text-emerald-800 font-extrabold">
                Automated Interest & Loan Management
              </h3>
              <p className="text-xl nopsa-text">
                No manual calculations, <br /> reducing errors.
              </p>
            </div>
            <div className="text-center space-y-">
              <h3 className="text-2xl opsa-text text-emerald-800 font-extrabold">
                Real-Time Reports & Analytics
              </h3>
              <p className="text-xl nopsa-text">
                Instant access to financial <br /> statements and performance tracking.
              </p>
            </div>
            <div className="text-center space-y-">
              <h3 className="text-2xl opsa-text text-emerald-800 font-extrabold">
                Secure & Transparent
              </h3>
              <p className="text-xl nopsa-text">
                Data encryption and audit logs <br /> for accountability.
              </p>
            </div>
            <div className="text-center space-y-">
              <h3 className="text-2xl opsa-text text-emerald-800 font-extrabold">
                User-Friendly Interface
              </h3>
              <p className="text-xl nopsa-text">
                Easy navigation for members <br /> and administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
<div id="contact" className='bg-white'>
<div className="ml-4 mr-4 rounded-t-4xl bg-emerald-800 px-28 py-12 text-gray-800 mt-">
  <div className="bg-max-w-6xl mx-auto grid gap-12 md:grid-cols-2 items-center">

          <div>
            <h2 className="text-4xl text-white opsa-text font-bold mb-4">Contact Us</h2>
            <p className="text-lg text-white nopsa-text leading-relaxed">
              Have questions about financial management<br /> 
              Looking for a seamless solution to track shares<br /> 
              and loans? We’re here to help! <br /> 
              Contact us through any of the following.

            </p>
          </div>

          <div className="md:max-w-4xl text-white md:mx-auto space-y-4">
            <div>
              <h3 className="font-bold opsa-text">Email</h3>
              <p>CTHMC@gmail.com</p>
            </div>
            <div>
              <h3 className="font-bold opsa-text">Contact No.</h3>
              <p>09123456789</p>
            </div>
          </div>
    </div>
</div>
      <div className="bg-white nopsa-text text-emerald-800 text-center text-sm py-4 ">
          Copyright © CTHMC 2025. All Rights Reserved
      </div>
</div>
    </>
  );
}

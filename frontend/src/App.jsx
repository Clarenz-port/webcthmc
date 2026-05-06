import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './App.css'

import Home from "./page/home.jsx";
import Login from "./page/login.jsx";
import Signup from "./page/signup.jsx";
import Admin from "./page/admin.jsx";
import Member from "./page/member.jsx"; // 👈 member dashboard
import ForgotPassword from "./page/popup/forgot-password.jsx";
import ResetPassword from "./page/popup/reset-password.jsx";
import MemberDetails from "./page/popup/adminmember.jsx";
import { useParams } from "react-router-dom";

import Navbar from "./comp/navbar.jsx";
import MemberNavbar from "./comp/membernavbar.jsx"; // 👈 member-specific header
import AdminNavbar from "./comp/adminnavbar.jsx";   // 👈 admin-specific header

function MemberDetailsPage() {
  const { id } = useParams();
  return <MemberDetails member={{ id }} />;
}

function AppWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  // determine which navbar to show
  let navbarToShow = <Navbar />;

  if (location.pathname.startsWith("/member")) {
    navbarToShow = <MemberNavbar />;
  } else if (location.pathname.startsWith("/admin")) {
    navbarToShow = <AdminNavbar />;
  }

  return (
    <>
      {navbarToShow}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/member" element={<Member />} />
          <Route path="/admin" element={<Admin onBack={() => navigate("/")} />} />
          <Route path="/admin/member/:id" element={<MemberDetailsPage />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

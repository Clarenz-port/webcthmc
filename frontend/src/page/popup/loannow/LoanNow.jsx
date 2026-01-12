import React, { useState, useEffect } from "react";
import { notify } from "../../../utils/toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MemberInfoSection from "./MemberInfoSection";
import PurposeSection from "./PurposeSection";
import LoanAgreementSection from "./LoanAgreementSection";
import AmortizationDetails from "./AmortizationDetails";
import AmortizationSchedulePopup from "./AmortizationSchedulePopup";

export default function Loannow({ isOpen, onClose }) {
  const [purpose, setPurpose] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [startDateObj, setStartDateObj] = useState(null);
  const [memberName, setMemberName] = useState("");
  const [address, setAddress] = useState("");

  const [amortization, setAmortization] = useState(0);
  const [interest, setInterest] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [filingFee, setFilingFee] = useState(0);
  const [capitalBuildUp, setCapitalBuildUp] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const navigate = useNavigate();

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const addMonthsSafe = (date, monthsToAdd) => {
    const d = new Date(date.getTime());
    const origDay = d.getDate();
    const targetMonthIndex = d.getMonth() + monthsToAdd;
    const targetYear = d.getFullYear() + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const day = Math.min(origDay, lastDayOfTargetMonth);
    return new Date(targetYear, targetMonth, day, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  };

  const formatFriendly = (date) => {
    if (!date) return "";
    const m = months[date.getMonth()];
    const d = date.getDate();
    const y = date.getFullYear();
    return `${m} ${d}, ${y}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date();
    const nextMonthDate = addMonthsSafe(today, 1);
    setStartDateObj(nextMonthDate);
    setStartMonth(formatFriendly(nextMonthDate));
    setDuration("");
    setEndMonth("");
    setLoanAmount("");
    setAmortization(0);
    setInterest(0);
    setServiceCharge(0);
    setFilingFee(0);
    setCapitalBuildUp(0);
    setNetAmount(0);
    setSchedule([]);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchMemberProfile();
  }, [isOpen]);

  const fetchMemberProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/api/members/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data;
      if (user) {
        const fullName = `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`.trim();
        const fullAddress = `Blk ${user.block || ""} Lot ${user.lot || ""}, ${user.street || ""}`.trim();
        setMemberName(fullName);
        setAddress(fullAddress);
      }
    } catch (err) {
      console.error("❌ Error fetching member profile:", err);
    }
  };

  useEffect(() => {
    const dur = parseInt(duration, 10);
    if (!startDateObj || !dur || dur <= 0) {
      setEndMonth("");
      return;
    }
    const endDate = addMonthsSafe(startDateObj, Math.max(dur - 1, 0));
    setEndMonth(formatFriendly(endDate));
  }, [duration, startDateObj]);

  useEffect(() => {
    const principal = parseFloat(loanAmount) || 0;
    const monthsCount = parseInt(duration, 10) || 0;

    if (principal <= 0 || monthsCount <= 0) {
      setAmortization(0);
      setInterest(0);
      setServiceCharge(0);
      setFilingFee(0);
      setCapitalBuildUp(0);
      setNetAmount(0);
      setSchedule([]);
      return;
    }

    const computedServiceCharge = principal * 0.02;
    const computedFilingFee = principal * 0.01;
    const computedCapitalBuildUp = principal * 0.02;
    const monthlyRate = 0.02;

    let remainingPrincipal = principal;
    let totalInterest = 0;
    const scheduleData = [];

    const monthlyPrincipal = principal / monthsCount;

    for (let i = 1; i <= monthsCount; i++) {
      const interestPayment = remainingPrincipal * monthlyRate;
      let totalPayment = monthlyPrincipal + interestPayment;
      if (i === monthsCount) {
        totalPayment = remainingPrincipal + interestPayment;
      }
      const dueDate = startDateObj ? addMonthsSafe(startDateObj, i - 1) : null;

      scheduleData.push({
        month: i,
        interestPayment,
        totalPayment,
        remainingBalance: parseFloat(remainingPrincipal.toFixed(2)),
        dueDate,
      });

      remainingPrincipal -= monthlyPrincipal;
      totalInterest += interestPayment;
    }

    const computedNetAmount = principal - (computedServiceCharge + computedFilingFee + computedCapitalBuildUp);

    setAmortization(scheduleData[0]?.totalPayment || 0);
    setInterest(totalInterest);
    setServiceCharge(computedServiceCharge);
    setFilingFee(computedFilingFee);
    setCapitalBuildUp(computedCapitalBuildUp);
    setNetAmount(computedNetAmount);
    setSchedule(scheduleData);
  }, [loanAmount, duration, startDateObj]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/api/loans/apply",
        {
          memberName,
          address,
          purpose,
          loanAmount,
          duration,
          startMonth,
          endMonth,
          amortization,
          interest,
          serviceCharge,
          filingFee,
          capitalBuildUp,
          netAmount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notify.success(response.data.message);
      onClose();
    } catch (error) {
      notify.success(error.response?.data?.message || "Error submitting loan");
    }
  };

  const formatCurrency = (num) =>
    num ? num.toLocaleString("en-PH", { style: "currency", currency: "PHP" }) : "₱0.00";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50">
      <div
        className="bg-white border-10 border-[#b8d8ba] rounded-3xl shadow-2xl w-[850px] relative border border-[#b8d8ba] max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-5 text-gray-500 hover:text-black font-semibold text-4xl"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold py-6 text-center text-[#7e9e6c] border-b border-[#b8d8ba]">
          Loan Application Form
        </h2>

        <div className="p-8 overflow-y-auto flex-1 pb-8">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <MemberInfoSection memberName={memberName} address={address} />
            <PurposeSection purpose={purpose} setPurpose={setPurpose} />
            <LoanAgreementSection
              loanAmount={loanAmount}
              setLoanAmount={setLoanAmount}
              duration={duration}
              setDuration={setDuration}
              startMonth={startMonth}
              endMonth={endMonth}
              setEndMonth={setEndMonth}
              months={months}
            />
            <AmortizationDetails
              amortization={amortization}
              interest={interest}
              serviceCharge={serviceCharge}
              filingFee={filingFee}
              capitalBuildUp={capitalBuildUp}
              netAmount={netAmount}
              formatCurrency={formatCurrency}
              onShowSchedule={() => setShowSchedule(true)}
            />
          </form>
        </div>

        <div className="sticky bottom-0 bg-white z-20 border-t border-[#b8d8ba] py-4 flex justify-center rounded-b-3xl">
          <button
            type="submit"
            onClick={(e) => {
              // forward to form submit — find the form element and submit
              const form = e.currentTarget.closest(".rounded-3xl")?.querySelector("form");
              if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }}
            className="bg-[#7e9e6c] text-white px-8 py-2 rounded-full font-semibold hover:bg-[#6a8b5a] transition shadow-md"
          >
            Submit Application
          </button>
        </div>
      </div>

      {showSchedule && (
        <AmortizationSchedulePopup
          schedule={schedule}
          formatCurrency={formatCurrency}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </div>
  );
}

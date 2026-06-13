import { useState } from "react";
import { notify } from "../../utils/toast";
import API from '../../apis/axios.js';
import { FaFileAlt, FaCalendarAlt, FaDownload, FaTimes, FaChartLine, FaEye } from 'react-icons/fa';

export default function ReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [reportType, setReportType] = useState("balance");
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const downloadReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const body = { reportType, period, year, month, mode: "summary" };
      const res = await API.post("/api/reports/generate", body, {
  headers: { Authorization: `Bearer ${token}` },
  responseType: "blob",
});

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      notify.error("Failed to generate report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const previewReport = async () => {
    try {
      setPreviewLoading(true);
      const token = localStorage.getItem("token");

      const body = { reportType, period, year, month, mode: "preview" };
      const res = await API.post("/api/reports/preview", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPreviewData(res.data);
      setShowPreview(true);
    } catch (err) {
      notify.error("Failed to generate preview");
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
    
    {/* HEADER */}
    <div className="bg-[#7e9e6c] p-6 text-white flex justify-between items-center">
      <div className="flex items-center gap-3">
        <FaFileAlt className="text-2xl" />
        <h2 className="text-xl font-bold tracking-tight">Generate Report</h2>
      </div>
    </div>

    <div className="p-8">
      {/* REPORT TYPE */}
      <div className="mb-5">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
          <FaChartLine className="text-[#7e9e6c]" />
          Report Type
        </label>
        <select 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 outline-none focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] transition-all cursor-pointer"
          onChange={e => setReportType(e.target.value)}
        >
          <option value="balance">Balance Sheet</option>
          <option value="income">Income Statement</option>
          <option value="cashflow">Cash Flow</option>
        </select>
      </div>

      {/* PERIOD */}
      <div className="mb-5">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
          <FaCalendarAlt className="text-[#7e9e6c]" />
          Reporting Period
        </label>
        <select 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 outline-none focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* CONDITIONAL DATE SELECTORS */}
      {period !== "all" && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5 space-y-3 animate-in slide-in-from-top-2">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Select Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#7e9e6c]/20"
              placeholder="e.g. 2024"
            />
          </div>

          {period === "monthly" && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Select Month</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#7e9e6c]/20"
              >
                <option value="">Choose Month...</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthName = new Date(0, i).toLocaleString('en', { month: 'long' });
                  return (
                    <option key={i + 1} value={i + 1}>
                      {monthName}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      )}

      {/* MODE SELECTOR REMOVED: Always summary mode */}

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col gap-3">
        {/* Preview Button */}
        <button
          onClick={previewReport}
          disabled={previewLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
        >
          {previewLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading Preview...
            </>
          ) : (
            <>
              <FaEye />
              Preview Report
            </>
          )}
        </button>

        {/* Download Button */}
        <button
          onClick={downloadReport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#7e9e6c] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#7e9e6c]/20 hover:bg-[#6a8b5a] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FaDownload />
              Download Report
            </>
          )}
        </button>
        
        <button 
          onClick={onClose} 
          className="w-full py-3 text-gray-400 font-semibold hover:text-gray-600 transition-colors"
        >
          Close Window
        </button>
      </div>
    </div>

    {/* Preview Modal */}
    {showPreview && previewData && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
          
          {/* Preview Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaFileAlt className="text-blue-600 text-xl" />
              <h3 className="text-lg font-bold text-gray-800">Document Preview</h3>
            </div>
            <button
              onClick={closePreview}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full text-xl font-bold w-9 h-9 flex items-center justify-center transition-all"
            >
              <FaTimes />
            </button>
          </div>

          {/* Preview Content - Document Paper Style */}
          <div className="bg-gray-100 p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
            {/* Paper Document Container */}
            <div className="bg-white shadow-lg rounded-sm mx-auto max-w-4xl min-h-[11in] p-12" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              
              {/* Document Header - Matching PDF exactly */}
              <div className="text-center mb-8">
                <div className="text-xs leading-tight">
                  <div className="mb-1" style={{ fontSize: '10px' }}>Carmona Townhomes Homeowners</div>
                  <div style={{ fontSize: '10px' }}>Multipurpose Cooperative</div>
                </div>
                <hr className="border-t border-gray-800 mt-2 mb-4" />
                <div className="mt-4">
                  <h1 className="text-base font-bold text-gray-900 mb-2" style={{ fontSize: '15px', fontWeight: 'bold' }}>
                    {reportType === 'balance' && '    BALANCE SHEET (SUMMARY)'}
                    {reportType === 'income' && '    INCOME STATEMENT (SUMMARY)'}
                    {reportType === 'cashflow' && '    CASH FLOW (SUMMARY)'}
                  </h1>
                </div>
              </div>

            {/* Dynamic Content Based on Report Type */}
            {reportType === 'balance' && previewData.balanceSheet && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 mb-3" style={{ fontSize: '11px', fontWeight: 'bold' }}>ASSETS</h4>
                  <table className="w-full" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-700" style={{ width: '70%' }}>Cash Purchases</td>
                        <td className="py-1 text-right" style={{ width: '30%' }}>{formatCurrency(previewData.balanceSheet.totalCash)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Loans Receivable</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.balanceSheet.totalLoansReceivable)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Accounts Receivable</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.balanceSheet.totalPurchasesReceivable)}</td>
                      </tr>
                      <tr className="border-t border-gray-800">
                        <td className="py-1 font-bold text-gray-800" style={{ fontSize: '12px' }}>TOTAL ASSETS</td>
                        <td className="py-1 text-right font-bold" style={{ fontSize: '12px' }}>{formatCurrency(previewData.balanceSheet.totalAssets)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold text-gray-800 mb-3" style={{ fontSize: '11px', fontWeight: 'bold' }}>LIABILITIES</h4>
                  <table className="w-full" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-700" style={{ width: '70%' }}>Total Liabilities</td>
                        <td className="py-1 text-right" style={{ width: '30%' }}>{formatCurrency(previewData.balanceSheet.totalLiabilities)}</td>
                      </tr>
                      <tr className="border-t border-gray-800">
                        <td className="py-1 font-bold text-gray-800" style={{ fontSize: '12px' }}>TOTAL LIABILITIES</td>
                        <td className="py-1 text-right font-bold" style={{ fontSize: '12px' }}>{formatCurrency(previewData.balanceSheet.totalLiabilities)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold text-gray-800 mb-3" style={{ fontSize: '11px', fontWeight: 'bold' }}>EQUITY</h4>
                  <table className="w-full" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-700" style={{ width: '70%' }}>Contribution and Savings Capital</td>
                        <td className="py-1 text-right" style={{ width: '30%' }}>{formatCurrency(previewData.balanceSheet.totalShares)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Retained Earnings</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.balanceSheet.retainedEarnings)}</td>
                      </tr>
                      <tr className="border-t border-gray-800">
                        <td className="py-1 font-bold text-gray-800" style={{ fontSize: '12px' }}>TOTAL EQUITY</td>
                        <td className="py-1 text-right font-bold" style={{ fontSize: '12px' }}>{formatCurrency(previewData.balanceSheet.totalEquity)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <table className="w-full" style={{ fontSize: '12px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 font-bold text-gray-800" style={{ width: '70%' }}>TOTAL LIABILITIES & EQUITY</td>
                        <td className="py-1 text-right font-bold" style={{ width: '30%' }}>{formatCurrency(previewData.balanceSheet.totalEquity + previewData.balanceSheet.totalLiabilities)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'income' && previewData.incomeStatement && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 mb-3" style={{ fontSize: '11px', fontWeight: 'bold' }}>REVENUES</h4>
                  <table className="w-full" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-700" style={{ width: '70%' }}>Sales Revenue</td>
                        <td className="py-1 text-right" style={{ width: '30%' }}>{formatCurrency(previewData.incomeStatement.salesRevenue)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Purchase Interest</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.incomeStatement.purchaseInterest)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Loan Interest</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.incomeStatement.loanInterest)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Service Charges</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.incomeStatement.serviceCharges)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Filing Fees</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.incomeStatement.filingFees)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Capital Build-up</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.incomeStatement.capitalBuildUp)}</td>
                      </tr>
                      <tr className="border-t border-gray-800">
                        <td className="py-1 font-bold text-gray-800" style={{ fontSize: '12px' }}>TOTAL REVENUES</td>
                        <td className="py-1 text-right font-bold" style={{ fontSize: '12px' }}>{formatCurrency(previewData.incomeStatement.totalRevenue)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold text-gray-800 mb-3" style={{ fontSize: '11px', fontWeight: 'bold' }}>EXPENSES</h4>
                  <table className="w-full" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-700" style={{ width: '70%' }}>Dividends Paid</td>
                        <td className="py-1 text-right" style={{ width: '30%' }}>{formatCurrency(previewData.incomeStatement.dividendsPaid)}</td>
                      </tr>
                      <tr className="border-t border-gray-800">
                        <td className="py-1 font-bold text-gray-800" style={{ fontSize: '12px' }}>TOTAL EXPENSES</td>
                        <td className="py-1 text-right font-bold" style={{ fontSize: '12px' }}>{formatCurrency(previewData.incomeStatement.totalExpenses)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <table className="w-full" style={{ fontSize: '12px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 font-bold text-gray-800" style={{ width: '70%' }}>
                          {previewData.incomeStatement.netIncome < 0 ? 'NET INCOME (LOSS)' : 'NET INCOME'}
                        </td>
                        <td className="py-1 text-right font-bold" style={{ width: '30%' }}>
                          {previewData.incomeStatement.netIncome < 0 
                            ? `(${formatCurrency(Math.abs(previewData.incomeStatement.netIncome))})`
                            : formatCurrency(previewData.incomeStatement.netIncome)
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'cashflow' && previewData.cashFlow && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 mb-3" style={{ fontSize: '11px', fontWeight: 'bold' }}>CASH INFLOWS</h4>
                  <table className="w-full" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-700" style={{ width: '70%' }}>Sales (Paid Purchases)</td>
                        <td className="py-1 text-right" style={{ width: '30%' }}>{formatCurrency(previewData.cashFlow.salesCash)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Loan Payments Received</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.cashFlow.loanPayments)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Share Capital Contributions</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.cashFlow.sharesCash)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Bills Paid</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.cashFlow.billsCash)}</td>
                      </tr>
                      <tr className="border-t border-gray-800">
                        <td className="py-1 font-bold text-gray-800" style={{ fontSize: '11px' }}>TOTAL CASH INFLOWS</td>
                        <td className="py-1 text-right font-bold" style={{ fontSize: '11px' }}>{formatCurrency(previewData.cashFlow.totalInflows)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold text-gray-800 mb-3" style={{ fontSize: '11px', fontWeight: 'bold' }}>CASH OUTFLOWS</h4>
                  <table className="w-full" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-700" style={{ width: '70%' }}>Loan Disbursements</td>
                        <td className="py-1 text-right" style={{ width: '30%' }}>{formatCurrency(previewData.cashFlow.loanDisbursements)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-700">Dividends Paid</td>
                        <td className="py-1 text-right">{formatCurrency(previewData.cashFlow.dividendsCash)}</td>
                      </tr>
                      <tr className="border-t border-gray-800">
                        <td className="py-1 font-bold text-gray-800" style={{ fontSize: '11px' }}>TOTAL CASH OUTFLOWS</td>
                        <td className="py-1 text-right font-bold" style={{ fontSize: '11px' }}>{formatCurrency(previewData.cashFlow.totalOutflows)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <table className="w-full" style={{ fontSize: '13px' }}>
                    <tbody>
                      <tr>
                        <td className="py-1 font-bold text-gray-800">NET CASH FLOW</td>
                        <td className="py-1 text-right font-bold" style={{ paddingLeft: '200px' }}>
                          {previewData.cashFlow.netCashFlow < 0 
                            ? `(${formatCurrency(Math.abs(previewData.cashFlow.netCashFlow))})`
                            : formatCurrency(previewData.cashFlow.netCashFlow)
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Preview Footer */}
          <div className="bg-gray-50 p-4 border-t flex justify-between">
            <button
              onClick={closePreview}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
            >
              Close Preview
            </button>
            <button
              onClick={() => {
                closePreview();
                downloadReport();
              }}
              className="px-6 py-2 bg-[#7e9e6c] text-white rounded-xl font-bold hover:bg-[#6a8b5a] transition-all"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  </div>
  );
}

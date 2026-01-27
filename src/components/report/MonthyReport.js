import React, { useState } from "react";
import { BASE_URL } from "../../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const MonthlyMcoReport = () => {
  const [month, setMonth] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchReport = async () => {
    if (!month) return;

    setLoading(true);
    const res = await fetch(
      `${BASE_URL}/get_monthly_mco_report.php?month=${month}`,
      { credentials: "include" }
    );
    const json = await res.json();
    setRows(Array.isArray(json.rows) ? json.rows : []);
    setLoading(false);
  };

  /* ================= EXCEL ================= */
  const downloadExcel = () => {
    const data = rows.map((r) => ({
      Date: r.report_date,
      "MCO Charged": r.total_mco,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly MCO");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `monthly-mco-${month}.xlsx`);
  };

  /* ================= TOTAL ================= */
  const totalMco = rows.reduce(
    (sum, r) => sum + Number(r.total_mco || 0),
    0
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f1629] text-gray-200 p-6 flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-white">
          Monthly MCO Report
        </h2>
        <p className="text-sm text-gray-400">
          Day-wise MCO charged for selected month
        </p>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-[#11182b] border border-gray-700 rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 bg-[#1f2a48] border border-gray-700 rounded-md text-gray-200"
        />
        

        <button
          onClick={fetchReport}
          disabled={!month}
          className="px-4 py-2 bg-cyan-600 text-black rounded-md disabled:opacity-50"
        >
          Apply
        </button>

        <button
          onClick={downloadExcel}
          disabled={!rows.length}
          className="px-4 py-2 bg-emerald-600 text-black rounded-md disabled:opacity-50"
        >
          Download Excel
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="flex-1 bg-[#11182b] border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading…
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead className="bg-[#1a2337] sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">MCO Charged</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-800 hover:bg-[#1f2a48]"
                  >
                    <td className="p-3">{r.report_date}</td>
                    <td className="p-3 text-right text-cyan-400 font-semibold">
                      {Number(r.total_mco).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* ================= TOTAL ================= */}
                {rows.length > 0 && (
                  <tr className="border-t border-gray-700 bg-[#0b1220] font-semibold">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-right text-emerald-400">
                      {totalMco.toFixed(2)}
                    </td>
                  </tr>
                )}

                {!rows.length && !loading && (
                  <tr>
                    <td
                      colSpan={2}
                      className="p-6 text-center text-gray-500"
                    >
                      No data found for selected month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyMcoReport;

import React, { useState } from "react";
import DateTimeRangePicker from "../DateRangeFilter";
import { BASE_URL } from "../../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ChargebackReport = () => {
  const [period1, setPeriod1] = useState({ startDate: "", endDate: "" });
  const [period2, setPeriod2] = useState({ startDate: "", endDate: "" });

  const [compare, setCompare] = useState(false);
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rowsP1, setRowsP1] = useState([]);
  const [rowsP2, setRowsP2] = useState([]);

  const fetchPeriod = async (period) => {
    const params = new URLSearchParams({
      startDate: period.startDate,
      endDate: period.endDate,
    });

    const res = await fetch(
      `${BASE_URL}/get_chargeback_summary.php?${params.toString()}`,
      { credentials: "include" }
    );

    const json = await res.json();
    console.log(json);
    return Array.isArray(json.rows) ? json.rows : [];
  };

  const fetchReport = async () => {
    setLoading(true);

    const p1 = await fetchPeriod(period1);
    setRowsP1(p1);

    if (compare) {
      const p2 = await fetchPeriod(period2);
      setRowsP2(p2);
    } else {
      setRowsP2([]);
    }

    setLoading(false);
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(rowsP1);
    XLSX.utils.book_append_sheet(wb, ws1, "Period 1");

    if (compare) {
      const ws2 = XLSX.utils.json_to_sheet(rowsP2);
      XLSX.utils.book_append_sheet(wb, ws2, "Period 2");
    }

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "chargebacks.xlsx");
  };

  const renderTable = (rows, title) => (
    <div className="mb-10">
      <h3 className="text-lg font-semibold mb-3 text-white">{title}</h3>
      <div className="bg-[#11182b] border border-gray-700 rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#1a2337]">
            <tr>
              {[
                "Session",
                "Agent",
                "Type",
                "Amount",
                "Penalty",
                "Platform Fee",
                "Total Deducted",
                "Note",
                "Date",
              ].map((h) => (
                <th key={h} className="p-3 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-gray-800 hover:bg-[#1f2a48]"
              >
                <td className="p-3">{r.session_id}</td>
                <td className="p-3">{r.agent_extension}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3">{r.amount}</td>
                <td className="p-3">{r.penalty}</td>
                <td className="p-3">{r.platform_fee}</td>
                <td className="p-3 text-red-400 font-semibold">
                  {r.total_deducted}
                </td>
                <td className="p-3">{r.note}</td>
                <td className="p-3 whitespace-nowrap">{r.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#11182b] p-6 text-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-white">
        Chargeback Report
      </h2>

      {/* FILTER BAR */}
      <div className="bg-[#11182b] border border-gray-700 rounded-xl p-4 mb-6 flex gap-4 flex-wrap items-center">
        <button
          onClick={() => setShowP1(true)}
          className="px-4 py-2 bg-[#1f2a48] rounded-md border border-gray-700"
        >
         { period1.startDate && period1.endDate
            ? `${new Date(period1.startDate).toLocaleDateString()} - ${new Date(
                period1.endDate
              ).toLocaleDateString()}`
            : "Period 1"}
        </button>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
          />
          Compare
        </label>

        {compare && (
          <button
            onClick={() => setShowP2(true)}
            className="px-4 py-2 bg-[#1f2a48] rounded-md border border-gray-700"
          >
            {period2.startDate && period2.endDate
              ? `${new Date(period2.startDate).toLocaleDateString()} - ${new Date(
                  period2.endDate
                ).toLocaleDateString()}`
              : "Period 2"}
          </button>
        )}

        <button
          onClick={fetchReport}
          disabled={!period1.startDate || !period1.endDate}
          className="px-4 py-2 bg-cyan-600 text-black rounded-md disabled:opacity-50"
        >
          Apply
        </button>

        <button
          onClick={downloadExcel}
          disabled={!rowsP1.length}
          className="px-4 py-2 bg-emerald-600 text-black rounded-md disabled:opacity-50"
        >
          Download Excel
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading…</div>
      ) : (
        <>
          {renderTable(rowsP1, "Period 1")}
          {compare && renderTable(rowsP2, "Period 2")}
        </>
      )}

      {/* MODALS */}
      {showP1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowP1(false)}
          />
          <div className="relative z-10">
            <DateTimeRangePicker
              initialStartDate={period1.startDate}
              initialEndDate={period1.endDate}
              onApply={(r) => {
                setPeriod1(r);
                setShowP1(false);
              }}
              onCancel={() => setShowP1(false)}
            />
          </div>
        </div>
      )}

      {showP2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowP2(false)}
          />
          <div className="relative z-10">
            <DateTimeRangePicker
              initialStartDate={period2.startDate}
              initialEndDate={period2.endDate}
              onApply={(r) => {
                setPeriod2(r);
                setShowP2(false);
              }}
              onCancel={() => setShowP2(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargebackReport;

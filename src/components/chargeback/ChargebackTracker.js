// ChargebackTracker.jsx
import React, { useState } from "react";
import { Search, CheckCircle, X, DollarSign } from "lucide-react";
import { BASE_URL } from "../../config";

const formatterUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const ChargebackTracker = () => {
  const [typedQuery, setTypedQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [selected, setSelected] = useState(null);

  const [type, setType] = useState("Chargeback");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState(null);

  /* -------------------------
     SEARCH ON BUTTON CLICK
  --------------------------- */
  const onSearchClick = async () => {
    if (!typedQuery || typedQuery.trim().length < 2) {
      setMessage({ type: "error", text: "Enter at least 2 characters to search." });
      return;
    }

    setLoadingSearch(true);
    setMessage(null);
    setSelected(null);

    try {
      const res = await fetch(
        `${BASE_URL}search_call.php?datasearch=${encodeURIComponent(
          typedQuery.trim()
        )}`,
        { credentials: "include" }
      );

      const json = await res.json();
      if (json.status === "success") {
        setResults(json.calls || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Search error", err);
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const clearForm = () => {
    setType("Chargeback");
    setAmount("");
    setNote("");
    setSelected(null);
    setResults([]);
    setTypedQuery("");
    setMessage(null);
  };

  const onSelectRow = (row) => {
    setSelected(row);
    setMessage(null);
  };

  const parsedAmount = () => {
    const n = parseFloat(String(amount).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  /* -----------------------------------------
     🧮 BREAKUP CALCULATOR
  ------------------------------------------*/

  const getBreakdown = () => {
    if (!selected) return {};

    const mco = parseFloat(selected.mco || selected.profit || 0);
    const userAmount = parsedAmount();

    const penalty = type === "Chargeback" ? 50 : 25;
    const percentCut = mco * 0.06; // 6%

    const totalDeduction = userAmount + penalty + percentCut;
    const newMco = mco - totalDeduction;

    return {
      originalMco: mco,
      userAmount,
      penalty,
      percentCut,
      totalDeduction,
      newMco,
    };
  };

  const breakdown = getBreakdown();

  /* -----------------------------------------
      APPLY CHARGEBACK
  ------------------------------------------*/
  const applyChargeback = async () => {
    if (!selected) return setMessage({ type: "error", text: "Select a call first." });

    const amt = parsedAmount();
    if (amt <= 0) return setMessage({ type: "error", text: "Enter valid amount." });

    const penalty = type === "Chargeback" ? 50 : 25;
    const percentCut = parseFloat(selected.mco) * 0.06;

    if (
      !window.confirm(
        `Apply ${type} of ${formatterUSD.format(
          amt
        )}?\nAdditional penalty: ${formatterUSD.format(
          penalty
        )}\n6% deduction: ${formatterUSD.format(percentCut)}`
      )
    ) {
      return;
    }

    setApplying(true);
    try {
      const body = {
        session_id: selected.session_id,
        type,
        amount: amt,
        note,
      };

      const res = await fetch(`${BASE_URL}apply_chargeback.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.status === "success") {
        setMessage({ type: "success", text: "Chargeback applied successfully." });

        const totalDeduction = amt + penalty + percentCut;

        // update UI
        setResults((prev) =>
          prev.map((r) =>
            r.id === selected.id
              ? { ...r, mco: (parseFloat(r.mco) - totalDeduction).toFixed(2) }
              : r
          )
        );

        setSelected((s) =>
          s
            ? {
                ...s,
                mco: (parseFloat(s.mco) - totalDeduction).toFixed(2),
              }
            : s
        );

        setAmount("");
        setNote("");
      } else {
        setMessage({ type: "error", text: json.message || "Failed to apply." });
      }
    } catch (err) {
      console.error("apply error", err);
      setMessage({ type: "error", text: "Network error while applying." });
    } finally {
      setApplying(false);
    }
  };

  /* -----------------------------------------
      UI
  ------------------------------------------*/

  return (
    <div className="mx-auto p-4 bg-[#071428] min-h-screen border border-[#193047] text-gray-100 shadow-lg">
      <h2 className="text-3xl font-bold mb-4">Chargeback / Refund Tracker</h2>

      {/* Search Section */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">
          Search booking number or phone digits
        </label>

        <div className="flex gap-2">
          <div className="flex items-center bg-[#0f2634] border border-[#254153] rounded-md px-3 py-2 flex-1">
            <Search className="mr-2 text-gray-300" />
            <input
              value={typedQuery}
              onChange={(e) => setTypedQuery(e.target.value)}
              placeholder="Enter booking no. or phone digits"
              className="bg-transparent outline-none w-full text-gray-100"
            />
          </div>

          <button
            onClick={onSearchClick}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
          >
            Search
          </button>

          <button
            onClick={clearForm}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
          >
            <X />
          </button>
        </div>

        {/* Results */}
        <div className="mt-3 max-h-56 overflow-auto">
          {results.length === 0 ? (
            <div className="text-sm text-gray-400">No results</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 sticky top-0 bg-[#071428]/90">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Booking / Phone</th>
                  <th className="p-2 text-center">Agent</th>
                  <th className="p-2 text-right">MCO</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-t border-[#13303f] ${
                      selected?.id === r.id ? "bg-[#0f3b4e]" : ""
                    }`}
                  >
                    <td className="p-2 text-center">{r.start_time}</td>
                    <td className="p-2 text-center">
                      <div className="font-medium">{r.booking_number || "—"}</div>
                      <div className="text-gray-400">{r.from_number || "—"}</div>
                    </td>
                    <td className="p-2 text-center">{r.agent_name || "—"}</td>
                    <td className="p-2 text-right">
                      {formatterUSD.format(parseFloat(r.mco || 0))}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => onSelectRow(r)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Selected Call + Apply Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Selected Call */}
        <div className="p-3 bg-[#071f2b] border border-[#14313f] rounded">
          <h3 className="text-sm font-medium mb-3">Selected Call</h3>

          {!selected ? (
            <div className="text-sm text-gray-400">No call selected</div>
          ) : (
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-400">Date:</span> {selected.start_time}
              </div>
              <div>
                <span className="text-gray-400">Booking:</span> {selected.booking_number}
              </div>
              <div>
                <span className="text-gray-400">Phone:</span> {selected.from_number}
              </div>
              <div>
                <span className="text-gray-400">Agent:</span> {selected.agent_name}
              </div>
              <div>
                <span className="text-gray-400">Current MCO:</span>{" "}
                <span className="font-semibold">
                  {formatterUSD.format(parseFloat(selected.mco || 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chargeback Form */}
        <div className="p-3 bg-[#071f2b] border border-[#14313f] rounded">
          <h3 className="text-sm font-medium mb-3">Apply Charge</h3>

          <div className="mb-2">
            <label className="text-xs text-gray-400">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full mt-1 p-2 rounded bg-[#0f2634] border border-[#254153]"
            >
              <option>Chargeback</option>
              <option>Refund</option>
            </select>
          </div>

          <div className="mb-2">
            <label className="text-xs text-gray-400">Amount (USD)</label>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 rounded bg-[#0f2634] border border-[#254153]"
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="text-xs text-gray-400">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason / internal note"
              className="w-full p-2 rounded bg-[#0f2634] border border-[#254153]"
            />
          </div>

          {/* 🔥 NEW — BREAKDOWN OF DEDUCTIONS */}
          {selected && (
            <div className="bg-[#0b2a3a] p-3 rounded border border-[#1c3f52] text-sm mt-3">
              <h4 className="text-gray-300 font-medium mb-2">Breakdown of deductions</h4>

              <div className="flex justify-between">
                <span>User amount:</span>
                <span>{formatterUSD.format(breakdown.userAmount)}</span>
              </div>

              <div className="flex justify-between">
                <span>Penalty ({type === "Chargeback" ? "$50" : "$25"}):</span>
                <span>{formatterUSD.format(breakdown.penalty)}</span>
              </div>

              <div className="flex justify-between">
                <span>6% deduction:</span>
                <span>{formatterUSD.format(breakdown.percentCut)}</span>
              </div>

              <hr className="my-2 border-gray-700" />

              <div className="flex justify-between font-semibold text-red-300">
                <span>Total Deducted:</span>
                <span>{formatterUSD.format(breakdown.totalDeduction)}</span>
              </div>

              <div className="flex justify-between font-semibold mt-2">
                <span>New MCO:</span>
                <span className="text-green-300">
                  {formatterUSD.format(breakdown.newMco)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={applyChargeback}
              disabled={!selected || applying}
              className="flex-1 flex-row bg-red-600 hover:bg-red-700 rounded p-2 text-white"
            >
              {applying ? "Applying..." : <><CheckCircle /> Apply</>}
            </button>

            <button
              onClick={clearForm}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Clear
            </button>
          </div>

          {message && (
            <div
              className={`mt-3 text-sm ${
                message.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChargebackTracker;

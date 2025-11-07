import React, { useMemo, useState } from "react";
import { BASE_URL } from "../config";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, UserPlus } from "lucide-react";

const AddCallModal = ({ onClose, onAdded, userRole, extensions, userData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Derive agent name directly from extensions.json using agent_extension
  const agentName = useMemo(() => {
    if (userRole !== "user") return "";
    if (!userData?.agent_extension) return "Unknown Agent";

    const found = extensions.find(
      (ext) => String(ext.id) === String(userData.agent_extension)
    );
    return found ? found.name : "Unknown Agent";
  }, [userRole, userData, extensions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      from_number: e.target.from_number.value.trim(),
      from_name: e.target.from_name.value.trim(),
      to_number: e.target.to_number.value.trim(),
      date: e.target.date.value,
      agent_extension:
        userRole === "user"
          ? userData?.agent_extension
          : extensions.find((ext) => ext.name === e.target.agent_name.value)?.id,
      agent_name:
        userRole === "user"
          ? agentName
          : e.target.agent_name.value,
    };

    // ✅ Simple frontend validation
    if (!payload.from_number || !payload.from_name || !payload.to_number || !payload.date || !payload.agent_name) {
      setError("⚠️ Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}add_calls.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        onAdded({
          id: result.id,
          from_number: payload.from_number,
          from_name: payload.from_name,
          to_number: payload.to_number,
          queue_name: "REPEAT",
          call_status: "Accepted",
          start_time: `${payload.date} 23:00:00`,
          direction: "Inbound",
          agent_name: payload.agent_name,
        });
        alert("✅ Call added successfully!");
        onClose();
      } else {
        setError(result.error || result.message || "❌ Failed to add call.");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      setError("Network error while adding call.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-2xl w-[95%] max-w-md border border-slate-700 text-white"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserPlus className="text-green-400" /> Add New Call
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition"
            >
              <X size={22} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/40 border border-red-600 text-red-300 px-3 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Agent */}
            <div>
              <label className="block mb-1 text-sm text-gray-300">Agent Name *</label>
              {userRole === "user" ? (
                <input
                  type="text"
                  name="agent_name"
                  value={agentName}
                  readOnly
                  className="w-full p-3 rounded-xl bg-slate-700/70 border border-gray-600 text-gray-400 cursor-not-allowed"
                />
              ) : (
                <select
                  name="agent_name"
                  required
                  className="w-full p-3 rounded-xl bg-slate-700/70 border border-gray-600 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Agent</option>
                  {extensions
                    .filter((ext) => ext.type === "User")
                    .map((ext) => (
                      <option key={ext.id} value={ext.name}>
                        {ext.name}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* From Number */}
            <div>
              <label className="block mb-1 text-sm text-gray-300">Caller Number *</label>
              <input
                type="text"
                name="from_number"
                required
                placeholder="Enter caller number"
                className="w-full p-3 rounded-xl bg-slate-700/70 border border-gray-600 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* From Name */}
            <div>
              <label className="block mb-1 text-sm text-gray-300">Caller Name *</label>
              <input
                type="text"
                name="from_name"
                required
                placeholder="Enter caller name"
                className="w-full p-3 rounded-xl bg-slate-700/70 border border-gray-600 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* To Number */}
            <div>
              <label className="block mb-1 text-sm text-gray-300">Reciever Number *</label>
              <input
                type="text"
                name="to_number"
                required
                placeholder="Enter receiver number"
                className="w-full p-3 rounded-xl bg-slate-700/70 border border-gray-600 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block mb-1 text-sm text-gray-300">Date (Please enter date as per New York Time Zone) *</label>
              <input
                type="date"
                name="date"
                required
                className="w-full p-3 rounded-xl bg-slate-700/70 border border-gray-600 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-600/80 hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddCallModal;

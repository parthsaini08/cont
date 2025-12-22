import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, ArrowLeft, Save, X } from "lucide-react";
import CustomSelect from "./CustomSelect";
import {BASE_URL} from "../config";
const steps = ["Call Outcome", "Conversion"];

const productiveOptions = [
  "New booking",
  "Changes",
  "Cancellation",
  "Upgrade",
  "Ancillary services",
  "Sched change",
  "Pet addition",
];

const nonProductiveOptions = [
  "Check in",
  "Wheelchair",
  "Flight status",
  "Lost baggage",
  "Blank Call",
  "Wrong Number",
  "Spam",
  "Others",
];

const CallDetailsModal = ({ call, formData, onInputChange, onSave, onClose, userRole, extensions }) => {
  const [phase, setPhase] = useState(1);
  const [isSavingAgent, setIsSavingAgent] = useState(false);


  /* 🔁 Clear irrelevant fields */
  useEffect(() => {
    if (formData.converted === "Converted") {
      onInputChange("reason", "");
    }
    if (formData.converted === "Not Converted") {
      onInputChange("mco", "");
      onInputChange("booking_number", "");
      onInputChange("authType", "");
      onInputChange("gateway", "");
      onInputChange("company_billing", "");
      onInputChange("amount", "");
    }
  }, [formData.converted, onInputChange]);

  if (!call) return null;

  /* ✅ Validation */
  const validatePhase = () => {
    if (phase === 1) {
      if (!formData.productivity) {
        alert("Please select Call Category");
        return false;
      }
      if (!formData.type) {
        alert("Please select Call Type");
        return false;
      }
      if (
        formData.productivity === "Non-Productive" &&
        (!formData.notes || !formData.notes.trim())
      ) {
        alert("Please add notes for Non-Productive call");
        return false;
      }
    }

    if (phase === 2) {
      if (formData.type === "Blank Call") return true;

      if (!formData.converted) {
        alert("Please select Conversion Status");
        return false;
      }

      if (formData.converted === "Converted") {
        if (
          !formData.mco ||
          !formData.booking_number ||
          !formData.authType ||
          !formData.gateway ||
          !formData.company_billing
        ) {
          alert("Please fill all conversion details");
          return false;
        }

        if (
          formData.company_billing !== "none" &&
          !formData.amount
        ) {
          alert("Please enter Amount");
          return false;
        }
      }

      if (formData.converted === "Not Converted" && !formData.reason) {
        alert("Please select Not Converted Reason");
        return false;
      }
    }

    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto p-6 text-white"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{steps[phase - 1]}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <X size={22} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-6">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  i + 1 <= phase ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                {i + 1 <= phase ? <CheckCircle size={18} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-[3px] mx-2 ${
                    i + 1 < phase ? "bg-blue-500" : "bg-gray-600"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ---------- STEP 1 ---------- */}
          {phase === 1 && (
            <motion.div
              key="step1"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
            >

              {/* 👤 Admin – Change Agent */}
{userRole === "admin" && (
  <div className="mb-6">
    <label className="block mb-2 text-sm text-gray-300">
      Agent Name *
    </label>

    <CustomSelect
      value={formData.agent_name || ""}
      placeholder="Select Agent"
      options={extensions
        .filter((ext) => ext.type === "User")
        .map((ext) => ext.name)}
      onChange={(val) => onInputChange("agent_name", val)}
    />

    <button
      onClick={async () => {
        if (!formData.callId) {
          alert("No callId found! Cannot update agent.");
          return;
        }

        try {
          setIsSavingAgent(true);

          const res = await fetch(`${BASE_URL}update_agent.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              callId: formData.callId,
              agent_name: formData.agent_name,
            }),
          });

          const data = await res.json();

          if (data.success) {
            alert("✅ Agent updated successfully!");
          } else {
            alert(
              "❌ Failed to update agent: " +
                (data.error || "Unknown error")
            );
          }
        } catch (err) {
          console.error("❌ Network error while saving agent:", err);
          alert("Network error while saving agent");
        } finally {
          setIsSavingAgent(false);
        }
      }}
      disabled={isSavingAgent || !formData.agent_name}
      className={`mt-4 h-[48px] px-4 rounded-xl flex items-center gap-2 text-white
        ${
          isSavingAgent || !formData.agent_name
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
        }`}
    >
      <Save size={18} />
      {isSavingAgent ? "Saving..." : "Save Agent"}
    </button>
  </div>
)}

              <label className="block mb-2">Call Category *</label>
              <CustomSelect
                value={formData.productivity}
                placeholder="Select..."
                options={["Productive", "Non-Productive"]}
                onChange={(val) => onInputChange("productivity", val)}
              />

              {formData.productivity && (
                <>
                  <label className="block mt-4 mb-2">Type *</label>
                  <CustomSelect
                    value={formData.type}
                    placeholder="Select..."
                    options={
                      formData.productivity === "Productive"
                        ? productiveOptions
                        : nonProductiveOptions
                    }
                    onChange={(val) => onInputChange("type", val)}
                  />
                </>
              )}

              {formData.productivity === "Non-Productive" && (
                <>
                  <label className="block mt-4 mb-2">Notes *</label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) =>
                      onInputChange("notes", e.target.value)
                    }
                    rows={3}
                    className="w-full p-3 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </>
              )}
            </motion.div>
          )}

          {/* ---------- STEP 2 ---------- */}
          {phase === 2 && (
            <motion.div
              key="step2"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
            >
              <fieldset
                disabled={formData.type === "Blank Call"}
                className="space-y-4 disabled:opacity-60"
              >
                <label>Conversion Status *</label>
                <CustomSelect
                  value={formData.converted}
                  placeholder="Select..."
                  options={["Converted", "Not Converted"]}
                  onChange={(val) => onInputChange("converted", val)}
                />

                {formData.converted === "Converted" && (
                  <>
                    <label>MCO *</label>
                    <input
                      type="number"
                      value={formData.mco || ""}
                      onChange={(e) =>
                        onInputChange("mco", e.target.value)
                      }
                      className="w-full p-3 rounded-xl bg-slate-700/70"
                    />

                    <label>Booking Number *</label>
                    <input
                      type="text"
                      value={formData.booking_number || ""}
                      onChange={(e) =>
                        onInputChange("booking_number", e.target.value)
                      }
                      className="w-full p-3 rounded-xl bg-slate-700/70"
                    />

                    <label>Auth Type *</label>
                    <CustomSelect
                      value={formData.authType}
                      options={["Mail", "Verbal", "Message"]}
                      onChange={(val) =>
                        onInputChange("authType", val)
                      }
                    />

                    <label>Gateway *</label>
                    <CustomSelect
                      value={formData.gateway}
                      options={[
                        "Auth- Maverick",
                        "NMI- PayCompass",
                        "Zelle",
                        "bank ACH/Wire",
                      ]}
                      onChange={(val) =>
                        onInputChange("gateway", val)
                      }
                    />

                    <label>Company Billing *</label>
                    <CustomSelect
                      value={formData.company_billing}
                      options={["none", "CC-0498", "CC-0436"]}
                      onChange={(val) =>
                        onInputChange("company_billing", val)
                      }
                    />

                    {formData.company_billing &&
                      formData.company_billing !== "none" && (
                        <>
                          <label>Amount *</label>
                          <input
                            type="number"
                            value={formData.amount || ""}
                            onChange={(e) =>
                              onInputChange("amount", e.target.value)
                            }
                            className="w-full p-3 rounded-xl bg-slate-700/70"
                          />
                        </>
                      )}
                  </>
                )}

                {formData.converted === "Not Converted" && (
                  <>
                    <label>Reason *</label>
                    <CustomSelect
                      value={formData.reason}
                      options={[
                        "Price issue",
                        "Customer needs time",
                        "Third Party Issue",
                        "Spam",
                        "Others",
                      ]}
                      onChange={(val) =>
                        onInputChange("reason", val)
                      }
                    />
                  </>
                )}
              </fieldset>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex justify-between mt-8">
          {phase > 1 && (
            <button
              onClick={() => setPhase(1)}
              className="px-4 py-2 rounded-xl bg-gray-600"
            >
              <ArrowLeft size={18} /> Back
            </button>
          )}

          {phase < 2 ? (
            <button
              onClick={() => validatePhase() && setPhase(2)}
              className="ml-auto px-5 py-2 rounded-xl bg-blue-600"
            >
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => validatePhase() && onSave()}
              className="ml-auto px-5 py-2 rounded-xl bg-green-600"
            >
              <Save size={18} /> Save
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CallDetailsModal;

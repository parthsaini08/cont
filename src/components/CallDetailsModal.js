import React, { useState } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, ArrowLeft, Save, X } from "lucide-react";
import { BASE_URL } from "../config";
const steps = ["Customer Info", "Call Details", "Conversion"];


const CallDetailsModal = ({ call, formData, onInputChange, onSave, onClose,userRole,extensions }) => {
  const [phase, setPhase] = useState(1);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Reset irrelevant fields when conversion status changes
  useEffect(() => {
    if (formData.converted === "Converted") {
      // Clear Not Converted fields
      onInputChange("reason", "");
    } else if (formData.converted === "Not Converted") {
      // Clear Converted fields
      onInputChange("mco", "");
      onInputChange("booking_number","");
      onInputChange("authType", "");
      onInputChange("gateway", "");
      onInputChange("company_billing", "");
      onInputChange("amount", "");
    }
  }, [formData.converted]);


  if (!call) return null;
  const airlines = [
  "Aeroflot","Air Canada","Air France","Air India","Air New Zealand","AirAsia","AirAsia India",
  "Alaska Airlines","Alliance Air","All Nippon Airways","American Airlines","Asiana Airlines",
  "Austrian Airlines","Bangkok Airways","British Airways","Brussels Airlines","Cathay Pacific",
  "China Airlines","Delta Air Lines","EgyptAir","Emirates","Ethiopian Airlines","Etihad Airways",
  "Finnair","Go First","Gulf Air","Iberia","IndiGo","Japan Airlines","JetBlue Airways","Kenya Airways",
  "KLM Royal Dutch Airlines","Korean Air","Kuwait Airways","LOT Polish Airlines","Lufthansa",
  "Malaysia Airlines","Oman Air","Philippine Airlines","Qantas","Qatar Airways","Royal Air Maroc",
  "Saudia","SAS Scandinavian Airlines","Singapore Airlines","South African Airways","Southwest Airlines",
  "SpiceJet","SriLankan Airlines","Swiss International Air Lines","TAP Air Portugal","Thai Airways",
  "Turkish Airlines","United Airlines","Vistara","Vietnam Airlines","WestJet","Spirit airlines","Iceland Air",
  "Hawaiian Airlines","Avianca Airlines","China Eastern Airlines"
];

  //  const handleAgentSave = async () => {
  //   if (!formData.agent_name || formData.agent_name.trim() === "") {
  //     alert("Please enter an Agent Name.");
  //     return;
  //   }
  //   try {
  //     setIsSavingAgent(true);
  //     await onSaveAgentName(formData.agent_name, call.id); // call parent callback
  //     alert("Agent name saved successfully.");
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to save agent name.");
  //   } finally {
  //     setIsSavingAgent(false);
  //   }
  // };

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
    "others"
  ];

  // ✅ Validation per phase
  const validatePhase = () => {
    
    // 🟢 Skip all validation for Blank Call
  if (formData.type === "Blank Call") return true;

  if (phase === 1) {
    if (!formData.customer_type) {
      alert("Please select Customer Type.");
      return false;
    }
    if (!formData.language) {
      alert("Please select Language.");
      return false;
    }
    if (!formData.segment) {
      alert("Please select Segment.");
      return false;
    }
  }

  if (phase === 2) {
    if (!formData.productivity) {
      alert("Please select Productivity.");
      return false;
    }
    if (!formData.type) {
      alert("Please select Call Type.");
      return false;
    }

    if (formData.segment === "Air") {
      if (!formData.airline) {
        alert("Please enter Airline.");
        return false;
      }
      if (!formData.flightUsage) {
        alert("Please select Flight Usage.");
        return false;
      }
      if (!formData.cabinType) {
        alert("Please select Cabin Type.");
        return false;
      }
    }

    if (formData.segment === "Car") {
      if (!formData.carCompany) {
        alert("Please enter Car Company.");
        return false;
      }
      if (!formData.carUsage) {
        alert("Please select Car Usage.");
        return false;
      }
      if (!formData.carType) {
        alert("Please select Car Type.");
        return false;
      }
    }

    if (
      formData.segment &&
      !["Air", "Car"].includes(formData.segment) &&
      !formData.notes
    ) {
      alert("Please add Notes for this segment.");
      return false;
    }
  }

  if (phase === 3) {
    if (!formData.converted) {
      alert("Please select Conversion Status.");
      return false;
    }

    if (formData.converted === "Converted") {
      if (!formData.mco) {
        alert("Please enter MCO.");
        return false;
      }
       if (!formData.booking_number) {
        alert("Please enter Booking Number.");
        return false;
      }
      if (!formData.authType) {
        alert("Please select Auth Type.");
        return false;
      }
      if (!formData.gateway) {
        alert("Please select Gateway.");
        return false;
      }
      if (!formData.company_billing) {
        alert("Please select Company Billing.");
        return false;
      }
      if (formData.company_billing !== "none" && !formData.amount) {
        alert("Please enter Amount for selected Billing.");
        return false;
      }
    }

    if (formData.converted === "Not Converted" && !formData.reason) {
      alert("Please provide Reason for not converting.");
      return false;
    }
  }

  return true;
};


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 p-6 rounded-2xl shadow-2xl w-[650px] max-h-[90vh] overflow-y-auto text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-wide">{steps[phase - 1]}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <X size={22} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex justify-between items-center mb-6">
          {steps.map((s, idx) => (
            <div key={idx} className="flex-1 flex items-center">
              <div
                className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ${
                  idx + 1 <= phase
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {idx + 1 <= phase ? <CheckCircle size={18} /> : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[3px] mx-2 rounded ${
                    idx + 1 < phase ? "bg-blue-500" : "bg-gray-600"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Phase Content */}
        <AnimatePresence mode="wait">
          {/* ---------- Phase 1 ---------- */}
           {/* ---------- Phase 1 ---------- */}
          {phase === 1 && (
            <motion.div
              key="phase1"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Admin-only agent field */}
             {userRole === "admin" && (
  <div className="mb-4">
    <label className="block mb-2 text-sm text-gray-300">Agent Name *</label>

    <select
      value={formData.agent_name || ""}
      onChange={(e) => onInputChange("agent_name", e.target.value)}
      className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
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

    <button
      onClick={async () => {
        console.log("🔹 Saving agent...");
        console.log("FormData.callId:", formData.callId);
        console.log("FormData.agent_name:", formData.agent_name);

        if (!formData.callId) {
          alert("No callId found! Cannot update agent.");
          return;
        }

        try {
          setIsSavingAgent(true);

          const res = await fetch(`${BASE_URL}update_agent.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // IMPORTANT for session cookies
            body: JSON.stringify({
              callId: formData.callId,
              agent_name: formData.agent_name,
            }),
          });

          const data = await res.json();
          console.log("🔹 Server response:", data);

          if (data.success) {
            alert("✅ Agent updated successfully!");
          } else {
            alert("❌ Failed to update agent: " + (data.error || "Unknown error"));
          }
        } catch (err) {
          console.error("❌ Network error while saving agent:", err);
          alert("Network error while saving agent");
        } finally {
          setIsSavingAgent(false);
        }
      }}
      disabled={isSavingAgent || !formData.agent_name}
      className="h-[48px] px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex items-center gap-2 text-white"
    >
      <Save size={18} />
      {isSavingAgent ? "Saving..." : "Save Agent"}
    </button>
  </div>
)}
              <label className="block mb-2">Customer Type *</label>
              <select
                value={formData.customer_type || ""}
                onChange={(e) => onInputChange("customer_type", e.target.value)}
                className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="New">New</option>
                <option value="Existing">Existing</option>
              </select>

              <label className="block mb-2">Language *</label>
              <select
                value={formData.language || ""}
                onChange={(e) => onInputChange("language", e.target.value)}
                className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
              </select>

              <label className="block mb-2">Segment *</label>
              <select
                value={formData.segment || ""}
                onChange={(e) => onInputChange("segment", e.target.value)}
                className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="Air">Air</option>
                <option value="Hotel">Hotel</option>
                <option value="Car">Car</option>
                <option value="Cruise">Cruise</option>
                <option value="Others">Others</option>
              </select>
            </motion.div>
          )}

          {/* ---------- Phase 2 ---------- */}
          {phase === 2 && (
            <motion.div
              key="phase2"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <label className="block mb-2">Call Category *</label>
              <select
                value={formData.productivity || ""}
                onChange={(e) => onInputChange("productivity", e.target.value)}
                className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="Productive">Productive</option>
                <option value="Non-Productive">Non-Productive</option>
              </select>

              {formData.productivity && (
                <>
                  <label className="block mb-2">Type *</label>
                  <select
                    value={formData.type || ""}
                    onChange={(e) => onInputChange("type", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {(formData.productivity === "Productive"
                      ? productiveOptions
                      : nonProductiveOptions
                    ).map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                </>
              )}

            <fieldset disabled={formData.type === "Blank Call"} className="space-y-3 opacity-100 disabled:opacity-60">
           
              {formData.segment === "Air" && (
  <>
    <label className="block mb-2">Airline *</label>
    <div className="relative">
      <input
        type="text"
        value={formData.airline || ""}
        onFocus={() => setShowSuggestions(true)}
        onChange={(e) => {
          onInputChange("airline", e.target.value);
          setShowSuggestions(true);
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} 
        className="w-full p-3 mb-2 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Start typing airline name..."
      />
      {showSuggestions && formData.airline && (
        <div className="absolute z-10 w-full bg-slate-800 border border-slate-600 rounded-xl max-h-48 overflow-y-auto">
          {airlines
            .filter(a => a.toLowerCase().includes(formData.airline.toLowerCase()))
            .slice(0, 10)
            .map((a) => (
              <div
                key={a}
                onClick={() => {
                  onInputChange("airline", a);
                  setShowSuggestions(false);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-600"
              >
                {a}
              </div>
            ))}
        </div>
      )}
    </div>


    <label className="block mb-2 mt-4">Flight Usage *</label>
    <select
      value={formData.flightUsage || ""}
      onChange={(e) => onInputChange("flightUsage", e.target.value)}
      className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select...</option>
      <option value="Domestic">Domestic</option>
      <option value="International">International</option>
    </select>

    <label className="block mb-2">Cabin Type *</label>
    <select
      value={formData.cabinType || ""}
      onChange={(e) => onInputChange("cabinType", e.target.value)}
      className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select...</option>
      <option value="Economy">Economy</option>
      <option value="Premium Economy">Premium Economy</option>
      <option value="Business Class">Business Class</option>
      <option value="First Class">First Class</option>
    </select>
  </>
)}

              {formData.segment === "Car" && (
                <>
                  <label className="block mb-2">Car Company *</label>
                  <input
                    type="text"
                    value={formData.carCompany || ""}
                    onChange={(e) => onInputChange("carCompany", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <label className="block mb-2">Car Usage *</label>
                  <select
                    value={formData.carUsage || ""}
                    onChange={(e) => onInputChange("carUsage", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Domestic">Domestic</option>
                    <option value="International">International</option>
                  </select>

                  <label className="block mb-2">Car Type *</label>
                  <select
                    value={formData.carType || ""}
                    onChange={(e) => onInputChange("carType", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Truck">Others</option>
                  </select>
                </>
              )}

              {formData.segment &&
                !["Air", "Car"].includes(formData.segment) && (
                  <>
                    <label className="block mb-2">Notes *</label>
                    <textarea
                      value={formData.notes || ""}
                      onChange={(e) => onInputChange("notes", e.target.value)}
                      className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </>
                )}
</fieldset>  
            </motion.div>
          )}
          

          {/* ---------- Phase 3 ---------- */}
          {phase === 3  && (
            <motion.div
              key="phase3"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <fieldset disabled={formData.type === "Blank Call"} className="space-y-3 opacity-100 disabled:opacity-60">
              <label className="block mb-2">Conversion Status *</label>
              <select
                value={formData.converted || ""}
                onChange={(e) => onInputChange("converted", e.target.value)}
                className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="Converted">Converted</option>
                <option value="Not Converted">Not Converted</option>
              </select>

              {formData.converted === "Converted" && (
                <>
                  <label className="block mb-2">MCO *</label>
                  <input
                    type="number"
                    value={formData.mco || ""}
                    onChange={(e) => onInputChange("mco", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <label className="block mb-2">Booking Number *</label>
                  <input
                    type="text"
                    value={formData.booking_number || ""}
                    onChange={(e) => onInputChange("booking_number", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <label className="block mb-2">Auth Type *</label>
                  <select
                    value={formData.authType || ""}
                    onChange={(e) => onInputChange("authType", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Mail">Mail</option>
                    <option value="Verbal">Verbal</option>
                    <option value="Message">Message</option>
                  </select>

                  <label className="block mb-2">Gateway *</label>
                  <select
                    value={formData.gateway || ""}
                    onChange={(e) => onInputChange("gateway", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Auth- Maverick">Auth- Maverick</option>
                    <option value="NMI- PayCompass">NMI- PayCompass</option>
                    <option value="Zelle">Zelle</option>
                    <option value="bank ACH/Wire">bank ACH/Wire</option>
                  </select>

                  <label className="block mb-2">Company Billing *</label>
                  <select
                    value={formData.company_billing || ""}
                    onChange={(e) => onInputChange("company_billing", e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="none">None</option>
                    <option value="CC-0498">CC-****0498</option>
                    <option value="CC-0436">CC-****0436</option>
                  </select>

                  {formData.company_billing && formData.company_billing !== "none" && (
                    <>
                      <label className="block mb-2">Amount *</label>
                      <input
                        type="number"
                        value={formData.amount || ""}
                        onChange={(e) => onInputChange("amount", e.target.value)}
                        className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </>
                  )}
                </>
              )}

              {formData.converted === "Not Converted" && (
  <>
    <label className="block mb-2">Reason *</label>
    <select
      value={formData.reason || ""}
      onChange={(e) => onInputChange("reason", e.target.value)}
      className="w-full p-3 mb-4 rounded-xl bg-slate-700/70 outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select Reason</option>
      <option value="Shoppers">Shoppers</option>
      <option value="Third Party Issue">Third Party Issue</option>
      <option value="Customer needs time">Customer needs time</option>
      <option value="Price issue">Price issue</option>
      <option value="Spam">Spam</option>
      <option value="Debit Card User">Debit Card User</option>
      <option value="Credit Card not working">Credit card not working</option>
      <option value="Customer does'nt know Confirmation Number">Customer does'nt know Confirmation Number</option> 
      <option value="Vehicle not available">Vehicle not available</option>
      <option value="Others">Others</option>
    </select>
  </>
)}
          </fieldset>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Buttons */}
        <div className="flex justify-between mt-8">
          {phase > 1 && (
            <button
              onClick={() => setPhase((p) => p - 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600"
            >
              <ArrowLeft size={18} /> Back
            </button>
          )}

          {phase < 3 ? (
            <button
             onClick={() => {
  if (validatePhase()) setPhase((p) => p + 1);
}}


              className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600"
            >
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => {
                if (validatePhase()) onSave();
              }}
              className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600"
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

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Position dropdown
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  return (
    <div className="w-full relative" ref={ref}>
      {label && <label className="block mb-1 text-slate-200">{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-3 rounded-xl bg-slate-800/70 text-slate-200 border border-slate-600 shadow-md hover:bg-slate-700 transition"
      >
        {value || "Select..."}
        <span className="ml-2 text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {/* Options (absolute to viewport) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[9999] max-h-60 overflow-y-auto"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
          >
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700 ${
                  value === opt ? "bg-slate-700" : ""
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

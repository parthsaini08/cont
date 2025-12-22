import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState(null);

  // Calculate position
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  // Close on outside click (SAFE)
  useEffect(() => {
    const handler = (e) => {
      if (
        buttonRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-3 rounded-xl bg-slate-700 text-white border border-slate-600 flex justify-between items-center"
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={18} />
      </button>

      {open &&
        coords &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                position: "absolute",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 9999,
              }}
              className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto"
            >
              {options.map((opt) => (
                <div
                  key={opt}
                  onMouseDown={(e) => {
                    e.preventDefault(); // 🔥 IMPORTANT
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer transition ${
                    value === opt
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-600 text-gray-200"
                  }`}
                >
                  {opt}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

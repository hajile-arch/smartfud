// src/components/DateMealPickerModal.jsx
import { useEffect, useRef, useState } from "react";

export default function DateMealPickerModal({ open, onClose, onConfirm }) {
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [meal, setMeal] = useState("breakfast");
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Close on ESC + focus first field when opening
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") handleConfirm();
    };
    document.addEventListener("keydown", onKey);
    // small delay to ensure mount before focusing
    const t = setTimeout(() => firstFieldRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  if (!open) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const MEALS = [
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "dinner", label: "Dinner" },
    { key: "snack", label: "Snack" },
  ];

  // Determine if selected date is today
  const currentDayIsToday = date === todayStr;

  // Get current hour for disabling meal options if today
  const now = new Date();
  const currentHour = now.getHours();

  const isPastMealTime = {
    breakfast: currentHour >= 10, // e.g., disable breakfast after 10 AM
    lunch: currentHour >= 14, // disable lunch after 2 PM
    dinner: currentHour >= 18, // disable dinner after 6 PM
    snack: false, // snacks anytime
  };

  const handleConfirm = () => {
    if (!date) return;
    onConfirm?.(date, meal);
  };

  const onBackdrop = (e) => {
    // close when clicking outside content
    if (e.target === e.currentTarget) onClose?.();
  };
  // Inside your component

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate < todayStr) {
      setDate(todayStr); // Reset to today if past date selected
    } else {
      setDate(selectedDate);
    }
  };

  // For the Confirm button disable logic
  const isDateValid = () => {
    return date >= todayStr;
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onMouseDown={onBackdrop}
      aria-labelledby="date-meal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] opacity-100 animate-fadeIn" />

      {/* Panel */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5 animate-scaleIn"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 id="date-meal-title" className="text-lg font-semibold">
              Select Date & Meal
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose when to schedule this recipe
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4">
          {/* Date field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="flex gap-2">
              <input
                ref={firstFieldRef}
                type="date"
                value={date}
                min={todayStr}
                onChange={handleDateChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setDate(todayStr)}
                title="Set to today"
              >
                Today
              </button>
            </div>
          </div>

          {/* Meal segmented control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meal
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MEALS.map((m) => {
                const active = meal === m.key;
                // Disable if it's today and the current time has passed meal time
                const disabled = currentDayIsToday && isPastMealTime[m.key];
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => !disabled && setMeal(m.key)}
                    disabled={disabled}
                    className={[
                      "rounded-md px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
                      disabled ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            onClick={handleConfirm}
            disabled={!isDateValid()}
          >
            Confirm
          </button>
        </div>
      </div>

      {/* tiny animations */}
      <style>{`
        .animate-fadeIn { animation: fadeIn .15s ease-out both; }
        .animate-scaleIn { animation: scaleIn .18s ease-out both; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { transform: scale(.98); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  );
}

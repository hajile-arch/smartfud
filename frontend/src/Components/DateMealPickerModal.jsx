// src/components/DateMealPickerModal.jsx
import { useState } from "react";

export default function DateMealPickerModal({ open, onClose, onConfirm }) {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [meal, setMeal] = useState("breakfast");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Select Date & Meal</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Meal:</label>
          <select
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => onConfirm(date, meal)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
// src/pages/MealPlanner.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import IngredientPickerModal from "./Components/IngredientPickerModal";
import BasicRecipes from "./Components/BasicRecipes";

const SLOT_KEYS = ["breakfast", "lunch", "dinner", "snack"];

// Date helpers
function startOfWeek(d, weekStartsOn = 1) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function weekKeyOf(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const y = d.getUTCFullYear();
  return `${y}-${String(weekNo).padStart(2, "0")}`;
}

export default function MealPlanner({ user }) {
  const [anchorDate, setAnchorDate] = useState(startOfWeek(new Date()));
  const [inventory, setInventory] = useState([]);
  const [plan, setPlan] = useState({}); // key -> { title, note, ingredients[] }
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlotKey, setModalSlotKey] = useState("");
  const [modalInitial, setModalInitial] = useState([]);
  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekKey = useMemo(() => weekKeyOf(weekStart), [weekStart]);

  // Basic recipes list
  const basicRecipes = [
    {
      name: "Sandwich",
      ingredients: [
        { name: "bread", quantity: 2 },
        { name: "jam", quantity: 1 },
      ],
      notes: "Simple sandwich with bread and jam.",
    },
    {
      name: "Egg Fried Rice",
      ingredients: [
        { name: "rice", quantity: 1 },
        { name: "egg", quantity: 2 },
        { name: "garlic", quantity: 1 },
      ],
      notes: "Fried rice with eggs and garlic.",
    },
    {
      name: "Pasta with Tomato",
      ingredients: [
        { name: "pasta", quantity: 1 },
        { name: "tomato", quantity: 2 },
      ],
      notes: "Simple pasta with tomato sauce.",
    },
    {
      name: "Oatmeal",
      ingredients: [
        { name: "oats", quantity: 1 },
        { name: "milk", quantity: 1 },
      ],
      notes: "Healthy oatmeal breakfast.",
    },
    {
      name: "Salad",
      ingredients: [
        { name: "lettuce", quantity: 1 },
        { name: "cucumber", quantity: 1 },
      ],
      notes: "Fresh vegetable salad.",
    },
  ];

  // Inventory fetching
  useEffect(() => {
    if (!user) return;
    const qInv = query(
      collection(db, "users", user.uid, "inventory"),
      where("status", "in", ["active", "planned"])
    );
    const unsubscribe = onSnapshot(qInv, (snap) => {
      const items = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          name: x.name,
          quantity: Number(x.quantity || 0),
          reserved: Number(x.reserved || 0),
          category: x.category || "Other",
          status: x.status,
          expiry: x.expiry?.toDate?.() ? x.expiry.toDate() : x.expiry,
          location: x.location || "",
        };
      });
      items.sort((a, b) => {
        const ax = a.expiry
          ? new Date(a.expiry).getTime()
          : Number.POSITIVE_INFINITY;
        const bx = b.expiry
          ? new Date(b.expiry).getTime()
          : Number.POSITIVE_INFINITY;
        return ax - bx;
      });
      setInventory(items);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Load plan for the week
  useEffect(() => {
    if (!user) return;
    (async () => {
      const ref = doc(db, "users", user.uid, "mealPlans", weekKey);
      const snap = await getDoc(ref);
      if (snap.exists()) setPlan(snap.data().slots || {});
      else setPlan({});
    })();
  }, [user?.uid, weekKey]);

  // Handlers
  const openAdd = (dayStr, slot) => {
    const key = `${dayStr}:${slot}`;
    const existing = plan[key] || {};
    setModalSlotKey(key);
    setModalInitial(existing.ingredients || []);
    setModalOpen(true);
  };

  const onModalSave = (ingredients) => {
    setPlan((prev) => {
      const existing = prev[modalSlotKey] || {
        title: "",
        note: "",
        ingredients: [],
      };
      const title = existing.title || "Planned meal";
      return { ...prev, [modalSlotKey]: { ...existing, title, ingredients } };
    });
    setModalOpen(false);
  };

  const setTitle = (key) => {
    const current = plan[key]?.title || "";
    const title = prompt("Meal title:", current);
    if (title === null) return;
    setPlan((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), title } }));
  };
  const setNote = (key) => {
    const current = plan[key]?.note || "";
    const note = prompt("Notes / recipe URL:", current);
    if (note === null) return;
    setPlan((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), note } }));
  };
  const clearSlot = (key) => {
    setPlan((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Suggestions based on inventory
  const suggestions = useMemo(() => {
    const today = new Date();
    const soon = new Date();
    soon.setDate(today.getDate() + 3);
    const expiring = inventory
      .filter(
        (i) =>
          i.status === "active" &&
          i.expiry &&
          i.expiry <= soon &&
          i.quantity > 0
      )
      .sort((a, b) => a.expiry - b.expiry);
    const fresh = inventory.filter(
      (i) =>
        i.status === "active" &&
        i.quantity > 0 &&
        (!i.expiry || i.expiry > soon)
    );
    const pool = [...expiring, ...fresh];
    const out = [];
    if (pool[0])
      out.push({
        title: `Use ${pool[0].name}`,
        note: "Quick dish to avoid waste",
        ingredients: [{ itemId: pool[0].id, name: pool[0].name, quantity: 1 }],
      });
    if (pool[1])
      out.push({
        title: `${pool[1].name} sauté`,
        note: "Simple stovetop",
        ingredients: [{ itemId: pool[1].id, name: pool[1].name, quantity: 1 }],
      });
    if (pool[2] && pool[0])
      out.push({
        title: `${pool[2].name} & ${pool[0].name}`,
        note: "Two-ingredient combo",
        ingredients: [
          { itemId: pool[2].id, name: pool[2].name, quantity: 1 },
          { itemId: pool[0].id, name: pool[0].name, quantity: 1 },
        ],
      });
    return out.slice(0, 6);
  }, [inventory]);

  // Save plan
  const saveWeek = async () => {
    if (!user) return alert("Please log in.");
    // Save logic...
  };

  // Add recipe to plan
  const handleAddRecipe = (recipe) => {
    const todayStr = ymd(new Date());
    const key = `${todayStr}:${recipe.name}`;
    setPlan((prev) => {
      const existing = prev[key] || {
        title: recipe.name,
        note: recipe.notes,
        ingredients: [],
      };
      const newIngredients = [...existing.ingredients];

      recipe.ingredients.forEach((ing) => {
        const found = newIngredients.find((i) => i.name === ing.name);
        if (found) {
          found.quantity += ing.quantity;
        } else {
          newIngredients.push({ ...ing });
        }
      });
      return { ...prev, [key]: { ...existing, ingredients: newIngredients } };
    });
    setModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plan Weekly Meals</h1>
          <p className="text-gray-600">Use what you have before it expires.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded-md border"
            onClick={() => setAnchorDate(addDays(weekStart, -7))}
          >
            ← Prev
          </button>
          <div className="px-3 py-1 rounded-md border bg-white text-gray-700">
            {ymd(weekDays[0])} → {ymd(weekDays[6])}
          </div>
          <button
            className="px-3 py-1 rounded-md border"
            onClick={() => setAnchorDate(addDays(weekStart, 7))}
          >
            Next →
          </button>
          <button
            onClick={saveWeek}
            className="ml-3 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            Save week
          </button>
        </div>
      </div>

      {/* Inventory suggestions */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-3">Inventory Items </h2>
        {inventory.length === 0 ? (
          <p className="text-sm text-gray-600">No inventory items loaded.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 shadow hover:shadow-lg transition"
              >
                <div className="font-medium mb-2">{item.name}</div>
                <div className="text-xs text-gray-600 mb-2">
                  Qty: {item.quantity}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Basic Recipes --- */}
      <BasicRecipes
        basicRecipes={basicRecipes}
        handleAddRecipe={handleAddRecipe}
      />

      {/* Weekly Meal Plan Grid */}
      <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 w-32">Day</th>
              {SLOT_KEYS.map((s) => (
                <th key={s} className="text-left p-2 capitalize">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="align-top">
            {weekDays.map((day) => {
              const dStr = ymd(day);
              return (
                <tr key={dStr} className="border-t">
                  <td className="p-2 whitespace-nowrap">
                    <div className="font-medium">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    <div className="text-xs text-gray-500">{dStr}</div>
                  </td>
                  {SLOT_KEYS.map((slot) => {
                    const key = `${dStr}:${slot}`;
                    const entry = plan[key];
                    return (
                      <td key={key} className="p-2">
                        <div className="rounded-lg border p-2 min-h-[96px] flex flex-col gap-1">
                          {!entry?.title ? (
                            <>
                              <button
                                onClick={() => setTitle(key)}
                                className="text-blue-600 hover:underline text-xs self-start"
                              >
                                + Add title
                              </button>
                              <button
                                onClick={() => openAdd(dStr, slot)}
                                className="text-blue-600 hover:underline text-xs self-start"
                              >
                                + Add ingredients
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{entry.title}</div>
                              {entry.note && (
                                <div className="text-xs text-gray-600">
                                  {entry.note}
                                </div>
                              )}
                              {(entry.ingredients || []).length > 0 && (
                                <ul className="text-xs list-disc ml-4">
                                  {entry.ingredients.map((ing, i) => (
                                    <li key={i}>
                                      {ing.name || ing.itemId} × {ing.quantity}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="mt-1 flex gap-3">
                                <button
                                  onClick={() => setNote(key)}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Edit note
                                </button>
                                <button
                                  onClick={() => openAdd(dStr, slot)}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Edit ingredients
                                </button>
                                <button
                                  onClick={() => clearSlot(key)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Clear
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ingredient Picker Modal */}
      <IngredientPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        inventory={inventory}
        initial={modalInitial}
        onSave={onModalSave}
      />

      <div className="text-xs text-gray-500 mt-4">
        Saving the plan updates <code>reserved</code> and sets{" "}
        <code>status="planned"</code> for items with reservations, and creates
        reminder notifications for each meal.
      </div>
    </div>
  );
}

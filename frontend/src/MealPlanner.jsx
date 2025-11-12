// src/pages/MealPlanner.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import InventoryGrid from "./Components/InventoryGrid"; // adjust path if not using alias
import IngredientPickerModal from "./Components/IngredientPickerModal";
import BasicRecipes from "./Components/BasicRecipes";
import WeeklyMealPlanGrid from "./Components/WeeklyMealPlanGrid";
import DateMealPickerModal from "./Components/DateMealPickerModal"; // Adjust path as needed

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
  const todayStr = new Date().toISOString().split("T")[0];
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
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
  const [pendingRecipe, setPendingRecipe] = useState(null);
  const [pendingDate, setPendingDate] = useState(null);
  const [pendingMeal, setPendingMeal] = useState(null);
  const [showDateMealModal, setShowDateMealModal] = useState(false);
  const [tempRecipe, setTempRecipe] = useState(null);
  const [selectedDate, setSelectedDate] = useState(ymd(new Date())); // default today
  const [selectedMeal, setSelectedMeal] = useState("breakfast");

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

  // Function to show a notification
  const showToast = (message, type = "error") => {
    setNotification({ message, type });
    setShowNotification(true);

    // Start fade-out after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Optional: handle transition end to clear notification
  const handleTransitionEnd = () => {
    if (!showNotification) {
      setNotification(null);
    }
  };

  // Inventory fetching
  useEffect(() => {
    if (!user) return;
    const qInv = query(
      collection(db, "users", user.uid, "inventory"),
      where("status", "in", ["active", "planned"])
    );
    const unsubscribe = onSnapshot(qInv, (snap) => {
      const itemsRaw = snap.docs.map((d) => {
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
      const isExpired = (v) => {
        if (!v) return false; // no expiry: treat as not expired
        const d = v instanceof Date ? v : new Date(v);
        if (Number.isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dd = new Date(d);
        dd.setHours(0, 0, 0, 0);
        return dd < today;
      };
      const items = itemsRaw
        .filter((it) => !isExpired(it.expiry)) // HIDE expired items
        .sort((a, b) => {
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
    setSelectedDate(dayStr); // or prompt to pick date if needed
    setSelectedMeal(slot);
    // existing code to open modal
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

  // New: child passes the value directly
  const setTitle = (key, value) => {
    const title = (value || "").trim();
    if (!title) return;
    setPlan((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), title },
    }));
  };

  const setNote = (key, value) => {
    const note = (value || "").trim();
    setPlan((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), note },
    }));
  };

  const clearSlot = (key) => {
    setPlan((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Save plan
  const saveWeek = async () => {
    if (!user) return alert("Please log in.");

    // 1) Save the meal plan doc
    const planRef = doc(db, "users", user.uid, "mealPlans", weekKey);
    await setDoc(
      planRef,
      { weekStart, slots: plan, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // 2) Compute reservations per item from the plan
    const reservedMap = new Map(); // itemId -> total reserved qty
    Object.values(plan || {}).forEach((slot) => {
      (slot.ingredients || []).forEach((ing) => {
        if (!ing.itemId) return;
        reservedMap.set(
          ing.itemId,
          (reservedMap.get(ing.itemId) || 0) + Number(ing.quantity || 0)
        );
      });
    });

    // 3) Write everything in a single batch (ONE write per doc)
    const batch = writeBatch(db);

    // Inventory updates (exactly one update per doc)
    inventory.forEach((it) => {
      const wanted = reservedMap.get(it.id) || 0;
      const newStatus =
        wanted > 0 ? "planned" : it.status === "planned" ? "active" : it.status;
      batch.update(doc(db, "users", user.uid, "inventory", it.id), {
        reserved: wanted,
        status: newStatus,
      });
    });

    // === Notifications: upsert per (date, slot) and delete cleared ones ===
    for (const day of weekDays) {
      const dStr = ymd(day);
      for (const slot of SLOT_KEYS) {
        const key = `${dStr}:${slot}`;
        const entry = plan[key];
        const notifId = `meal_${dStr}_${slot}`; // deterministic ID

        if (!entry?.title) {
          // slot cleared -> delete any existing notif for this slot
          batch.delete(doc(db, "users", user.uid, "notifications", notifId));
          continue;
        }

        const reminderAt = new Date(day);
        if (slot === "breakfast") reminderAt.setHours(8, 0, 0, 0);
        else if (slot === "lunch") reminderAt.setHours(12, 0, 0, 0);
        else if (slot === "dinner") reminderAt.setHours(18, 0, 0, 0);
        else reminderAt.setHours(16, 0, 0, 0);

        // Upsert (prevents duplicates on every Save)
        batch.set(
          doc(db, "users", user.uid, "notifications", notifId),
          {
            type: "meal",
            weekKey, // handy for debugging/cleanup
            slot, // "breakfast" | "lunch" | "dinner" | "snack"
            date: dStr, // "YYYY-MM-DD"
            title: `Reminder: ${slot} — ${entry.title}`,
            body: entry.note || "Tap to view your plan.",
            createdAt: serverTimestamp(), // first write keeps earliest value
            updatedAt: serverTimestamp(), // track last save
            read: false,
            target: { route: "/meal-planner", params: { date: dStr, slot } },
            reminderAt,
          },
          { merge: true } // <= important: upsert instead of create
        );
      }
    }

    // 4) Commit once
    await batch.commit();

    alert(
      "Meal plan saved. Inventory reservations updated and reminders queued."
    );
  };

  // Add recipe to plan
  const handleAddRecipe = (recipe) => {
    const missingIngredients = [];

    recipe.ingredients.forEach((ing) => {
      const inventoryItem = inventory.find(
        (item) => item.name.toLowerCase() === ing.name.toLowerCase()
      );
      if (!inventoryItem || inventoryItem.quantity < ing.quantity) {
        missingIngredients.push({
          name: ing.name,
          required: ing.quantity,
          available: inventoryItem?.quantity || 0,
        });
      }
    });

    if (missingIngredients.length > 0) {
      // Show a quick toast
      showToast("Missing ingredients for this recipe.", "error");

      // Also show detailed missing ingredients in notification
      setNotification({
        type: "error",
        message: (
          <div>
            <p className="font-semibold mb-2">Missing ingredients:</p>
            <ul className="list-inside list-disc text-sm">
              {missingIngredients.map((ing, index) => (
                <li key={index}>
                  {ing.name}: need {ing.required}, available {ing.available}
                </li>
              ))}
            </ul>
          </div>
        ),
      });
      return;
    }

    // If all ingredients are available, proceed
    setTempRecipe(recipe);
    setShowDateMealModal(true);
  };
  const handleConfirmDateMeal = (date, meal) => {
    if (tempRecipe) {
      const key = `${date}:${meal}`;
      setPlan((prev) => {
        const existing = prev[key] || {
          title: tempRecipe.name,
          note: tempRecipe.notes,
          ingredients: [],
        };
        const newIngredients = [...existing.ingredients];

        tempRecipe.ingredients.forEach((ing) => {
          const found = newIngredients.find((i) => i.name === ing.name);
          if (found) {
            found.quantity += ing.quantity;
          } else {
            newIngredients.push({ ...ing });
          }
        });
        return { ...prev, [key]: { ...existing, ingredients: newIngredients } };
      });
    }
    setShowDateMealModal(false);
    setTempRecipe(null);
  };
  useEffect(() => {
    if (pendingRecipe && pendingDate && pendingMeal) {
      const key = `${pendingDate}:${pendingMeal}`;
      setPlan((prev) => {
        const existing = prev[key] || {
          title: pendingRecipe.name,
          note: pendingRecipe.notes,
          ingredients: [],
        };
        const newIngredients = [...existing.ingredients];

        pendingRecipe.ingredients.forEach((ing) => {
          const found = newIngredients.find((i) => i.name === ing.name);
          if (found) {
            found.quantity += ing.quantity;
          } else {
            newIngredients.push({ ...ing });
          }
        });
        return { ...prev, [key]: { ...existing, ingredients: newIngredients } };
      });
      // Clear pending
      setPendingRecipe(null);
      setPendingDate(null);
      setPendingMeal(null);
    }
  }, [pendingRecipe, pendingDate, pendingMeal]);

  useEffect(() => {
    console.log("Updated plan:", plan);
  }, [plan]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {notification && (
        <div
          className={`fixed top-4 right-4 max-w-sm w-full p-4 rounded-lg shadow-lg z-50 transition-opacity duration-500 ${
            showNotification ? "opacity-100" : "opacity-0"
          } ${notification.type === "error" ? "bg-red-500 text-white" : ""}`}
          onTransitionEnd={handleTransitionEnd}
        >
          <div className="flex items-start space-x-2">
            <div className="flex-1">{notification.message}</div>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-2 text-xl font-bold focus:outline-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}
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

      <InventoryGrid
        inventory={inventory}
        title="Inventory Items"
        hint="“Planned” items are highlighted"
      />

      {/* --- Basic Recipes --- */}
      <BasicRecipes
        basicRecipes={basicRecipes}
        handleAddRecipe={handleAddRecipe}
      />

      {/* Weekly Meal Plan Grid */}
      <WeeklyMealPlanGrid
        plan={plan}
        weekDays={weekDays}
        ymd={ymd}
        SLOT_KEYS={SLOT_KEYS}
        setTitle={setTitle} // now (key, value)
        openAdd={openAdd}
        setNote={setNote} // now (key, value)
        clearSlot={clearSlot}
        currentDateStr={todayStr}
      />

      {/* Ingredient Picker Modal */}
      <IngredientPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        inventory={inventory}
        initial={modalInitial}
        onSave={onModalSave}
      />
      <DateMealPickerModal
        open={showDateMealModal}
        onClose={() => setShowDateMealModal(false)}
        onConfirm={handleConfirmDateMeal}
      />
      <div className="text-xs text-gray-500 mt-4">
        Saving the plan updates <code>reserved</code> and sets{" "}
        <code>status="planned"</code> for items with reservations, and creates
        reminder notifications for each meal.
      </div>
    </div>
  );
}

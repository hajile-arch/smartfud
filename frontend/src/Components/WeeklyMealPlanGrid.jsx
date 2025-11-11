// src/pages/Components/WeeklyMealPlanGrid.jsx
import { useMemo, useState } from "react";
import { Pencil, Plus, StickyNote, Check, X, Utensils } from "lucide-react";

export default function WeeklyMealPlanGrid({
  plan,
  weekDays,
  ymd,
  SLOT_KEYS,
  setTitle,     // parent handler (will be called with key & value)
  openAdd,      // parent handler openAdd(dStr, slot)
  setNote,      // parent handler (will be called with key & value)
  clearSlot,    // parent handler clearSlot(key)
  currentDateStr,
}) {
  // Inline edit state
  const [editingTitleKey, setEditingTitleKey] = useState(null);
  const [editingNoteKey, setEditingNoteKey] = useState(null);
  const [tempTitle, setTempTitle] = useState("");
  const [tempNote, setTempNote] = useState("");

  const canEditDay = (dayStr) => dayStr >= currentDateStr;

  const onStartTitle = (key, existingTitle = "") => {
    setEditingNoteKey(null);
    setEditingTitleKey(key);
    setTempTitle(existingTitle);
  };
  const onStartNote = (key, existingNote = "") => {
    setEditingTitleKey(null);
    setEditingNoteKey(key);
    setTempNote(existingNote);
  };
  const onCancelEdit = () => {
    setEditingTitleKey(null);
    setEditingNoteKey(null);
    setTempTitle("");
    setTempNote("");
  };
  const onSaveTitle = (key) => {
    const v = (tempTitle || "").trim();
    if (v.length === 0) return; // keep simple; avoid empty title
    // delegate to parent (optional signature: setTitle(key, value))
    if (setTitle.length >= 2) setTitle(key, v);
    else setTitle(key); // backward-compat (if parent still uses prompt)
    onCancelEdit();
  };
  const onSaveNote = (key) => {
    const v = (tempNote || "").trim();
    if (setNote.length >= 2) setNote(key, v);
    else setNote(key); // backward-compat (if parent still uses prompt)
    onCancelEdit();
  };

  const header = useMemo(
    () => (
      <thead>
        <tr>
          <th className="text-left p-2 w-32 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Day
          </th>
          {SLOT_KEYS.map((s) => (
            <th key={s} className="text-left p-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {s}
            </th>
          ))}
        </tr>
      </thead>
    ),
    [SLOT_KEYS]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        {header}
        <tbody className="align-top">
          {weekDays.map((day) => {
            const dStr = ymd(day);
            const isEditable = canEditDay(dStr);
            return (
              <tr key={dStr} className="border-t">
                {/* Day cell */}
                <td className="p-2 whitespace-nowrap align-top">
                  <div className="font-medium">
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </div>
                  <div className="text-xs text-gray-500">{dStr}</div>
                </td>

                {/* Slot cells */}
                {SLOT_KEYS.map((slot) => {
                  const key = `${dStr}:${slot}`;
                  const entry = plan[key];
                  const ingredients = entry?.ingredients || [];
                  const isTitleEditing = editingTitleKey === key;
                  const isNoteEditing = editingNoteKey === key;

                  return (
                    <td key={key} className="p-2 align-top">
                      <div
                        className={[
                          "rounded-lg border p-2 min-h-[112px] flex flex-col gap-1",
                          !isEditable ? "opacity-70" : "",
                        ].join(" ")}
                      >
                        {/* EMPTY STATE */}
                        {!entry?.title && !isTitleEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                <Utensils className="h-3 w-3" />
                                {slot}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-col gap-1">
                              <button
                                onClick={() => isEditable && onStartTitle(key, "")}
                                disabled={!isEditable}
                                className={`inline-flex items-center gap-1 text-blue-600 hover:underline text-xs self-start ${
                                  !isEditable ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add title
                              </button>

                              <button
                                onClick={() => isEditable && openAdd(dStr, slot)}
                                disabled={!isEditable}
                                className={`inline-flex items-center gap-1 text-blue-600 hover:underline text-xs self-start ${
                                  !isEditable ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add ingredients
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* TITLE ROW / EDITOR */}
                            {isTitleEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  className="w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Meal title"
                                  value={tempTitle}
                                  onChange={(e) => setTempTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") onSaveTitle(key);
                                    if (e.key === "Escape") onCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={() => onSaveTitle(key)}
                                  className="inline-flex items-center justify-center rounded-md border px-2 py-1 hover:bg-green-50"
                                  title="Save title"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </button>
                                <button
                                  onClick={onCancelEdit}
                                  className="inline-flex items-center justify-center rounded-md border px-2 py-1 hover:bg-rose-50"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4 text-rose-600" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium break-words">
                                    {entry?.title}
                                  </div>
                                  {!!ingredients.length && (
                                    <div className="mt-1 text-[11px] text-gray-500">
                                      {ingredients.length} ingredient
                                      {ingredients.length > 1 ? "s" : ""}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <IconButton
                                    disabled={!isEditable}
                                    title="Edit title"
                                    onClick={() => onStartTitle(key, entry?.title || "")}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </IconButton>
                                  <IconButton
                                    disabled={!isEditable}
                                    title="Edit ingredients"
                                    onClick={() => openAdd(dStr, slot)}
                                  >
                                    <Utensils className="h-4 w-4" />
                                  </IconButton>
                                  <IconButton
                                    disabled={!isEditable}
                                    title="Clear slot"
                                    variant="danger"
                                    onClick={() => clearSlot(key)}
                                  >
                                    <X className="h-4 w-4" />
                                  </IconButton>
                                </div>
                              </div>
                            )}

                            {/* NOTE ROW / EDITOR */}
                            {isNoteEditing ? (
                              <div className="mt-2 flex items-start gap-2">
                                <textarea
                                  autoFocus
                                  rows={3}
                                  className="w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Notes or recipe URL"
                                  value={tempNote}
                                  onChange={(e) => setTempNote(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                                      onSaveNote(key);
                                    if (e.key === "Escape") onCancelEdit();
                                  }}
                                />
                                <div className="flex flex-col gap-1">
                                  <IconButton title="Save note" onClick={() => onSaveNote(key)}>
                                    <Check className="h-4 w-4 text-green-600" />
                                  </IconButton>
                                  <IconButton title="Cancel" variant="danger" onClick={onCancelEdit}>
                                    <X className="h-4 w-4 text-rose-600" />
                                  </IconButton>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1">
                                {entry?.note ? (
                                  <div className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                                    {entry.note}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => isEditable && onStartNote(key, "")}
                                    disabled={!isEditable}
                                    className={`inline-flex items-center gap-1 text-blue-600 hover:underline text-xs ${
                                      !isEditable ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                  >
                                    <StickyNote className="h-3.5 w-3.5" />
                                    Add note
                                  </button>
                                )}

                                {entry?.note && (
                                  <div className="mt-1">
                                    <button
                                      onClick={() => isEditable && onStartNote(key, entry.note || "")}
                                      disabled={!isEditable}
                                      className={`inline-flex items-center gap-1 text-blue-600 hover:underline text-xs ${
                                        !isEditable ? "opacity-50 cursor-not-allowed" : ""
                                      }`}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      Edit note
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* INGREDIENT LIST */}
                            {!!ingredients.length && (
                              <ul className="mt-2 text-xs list-disc ml-4">
                                {ingredients.map((ing, i) => (
                                  <li key={i} className="text-gray-700">
                                    {(ing.name || ing.itemId) ?? "—"} × {ing.quantity}
                                  </li>
                                ))}
                              </ul>
                            )}
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
  );
}

/** Small icon button */
function IconButton({ children, onClick, title, disabled, variant = "default" }) {
  const base =
    "inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs transition";
  const styles =
    variant === "danger"
      ? "border-rose-200 hover:bg-rose-50 text-rose-700"
      : "border-gray-200 hover:bg-gray-50 text-gray-700";
  const dis = disabled ? "opacity-50 cursor-not-allowed" : "";
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${dis}`}
    >
      {children}
    </button>
  );
}

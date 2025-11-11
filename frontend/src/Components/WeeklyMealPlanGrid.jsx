export default function WeeklyMealPlanGrid({
  plan,
  weekDays,
  ymd,
  SLOT_KEYS,
  setTitle,
  openAdd,
  setNote,
  clearSlot,
  currentDateStr, // Pass this from parent: e.g., new Date().toISOString().split("T")[0]
}) {
  // Function to check if a day is in the future or today
  const canEditDay = (dayStr) => {
    return dayStr >= currentDateStr;
  };

  return (
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
            const isEditable = canEditDay(dStr);
            return (
              <tr key={dStr} className="border-t">
                <td className="p-2 whitespace-nowrap">
                  <div className="font-medium">
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
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
                              onClick={() => isEditable && setTitle(key)}
                              disabled={!isEditable}
                              className={`text-blue-600 hover:underline text-xs self-start ${
                                !isEditable ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              + Add title
                            </button>
                            <button
                              onClick={() => isEditable && openAdd(dStr, slot)}
                              disabled={!isEditable}
                              className={`text-blue-600 hover:underline text-xs self-start ${
                                !isEditable ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              + Add ingredients
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">{entry.title}</div>
                            {entry.note && (
                              <div className="text-xs text-gray-600">{entry.note}</div>
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
                                onClick={() => isEditable && setNote(key)}
                                disabled={!isEditable}
                                className={`text-xs text-blue-600 hover:underline ${
                                  !isEditable ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                Edit note
                              </button>
                              <button
                                onClick={() => isEditable && openAdd(dStr, slot)}
                                disabled={!isEditable}
                                className={`text-xs text-blue-600 hover:underline ${
                                  !isEditable ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                Edit ingredients
                              </button>
                              <button
                                onClick={() => isEditable && clearSlot(key)}
                                disabled={!isEditable}
                                className={`text-xs text-red-600 hover:underline ${
                                  !isEditable ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
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
  );
}
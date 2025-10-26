// src/components/IngredientPickerModal.jsx
import React, { useEffect, useMemo, useState } from "react";

export default function IngredientPickerModal({
  open,
  onClose,
  inventory = [],
  initial = [], // [{itemId,name,quantity}]
  onSave,
}) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]); // [{itemId,name,quantity}]

  useEffect(() => {
    if (open) {
      setRows(initial.map(x => ({ ...x })));
      setSearch("");
    }
  }, [open, initial]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      it =>
        it.name?.toLowerCase().includes(q) ||
        it.category?.toLowerCase().includes(q)
    );
  }, [inventory, search]);

  const getQty = (id) => rows.find(r => r.itemId === id)?.quantity || 0;
  const setQty = (item, qty) => {
    qty = Math.max(0, Math.floor(qty) || 0);
    setRows(prev => {
      const exists = prev.find(x => x.itemId === item.id);
      if (!exists && qty > 0) {
        return [...prev, { itemId: item.id, name: item.name, quantity: qty }];
      }
      if (exists && qty === 0) {
        return prev.filter(x => x.itemId !== item.id);
      }
      if (exists) {
        return prev.map(x => x.itemId === item.id ? { ...x, quantity: qty } : x);
      }
      return prev;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Pick ingredients</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category…"
            className="w-full border rounded-md px-3 py-2"
          />

          <div className="mt-3 max-h-[340px] overflow-auto divide-y">
            {filtered.length === 0 && (
              <div className="py-6 text-center text-gray-500 text-sm">No items</div>
            )}
            {filtered.map((it) => {
              const available = Math.max(0, Number(it.quantity) - Number(it.reserved || 0));
              return (
                <div key={it.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-xs text-gray-500">
                      {it.category} • {available}/{it.quantity} available
                      {it.expiry && <> • Exp: {new Date(it.expiry).toLocaleDateString()}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={() => setQty(it, getQty(it.id) - 1)}
                    >-</button>
                    <input
                      type="number"
                      className="w-16 border rounded px-2 py-1 text-center"
                      value={getQty(it.id)}
                      onChange={(e) => setQty(it, Number(e.target.value))}
                      min={0}
                    />
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={() => setQty(it, getQty(it.id) + 1)}
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 border rounded-md" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            onClick={() => onSave(rows.filter(r => r.quantity > 0))}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

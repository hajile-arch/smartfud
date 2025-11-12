import React from "react";
import { Package, Utensils, MapPin, Calendar } from "lucide-react";

/**
 * InventoryGrid
 * Renders a responsive grid of inventory cards with status/expiry/reserved bars.
 *
 * Props:
 * - inventory: Array of items with fields:
 *    { id, name, quantity, reserved, location, status, expiry }
 * - title: Optional heading text (default: "Inventory Items")
 * - hint: Optional small helper text beside the title
 */
export default function InventoryGrid({
  inventory = [],
  title = "Inventory Items",
  hint = "“Planned” items are highlighted",
}) {
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
            <Package className="h-4 w-4 text-slate-700" />
          </span>
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {safeInventory.length}
          </span>
        </div>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>

      {safeInventory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-600">No inventory items loaded.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {safeInventory
            .slice()
            .sort(
              (a, b) =>
                (a?.status === "planned" ? -1 : 0) -
                (b?.status === "planned" ? -1 : 0)
            )
            .map((item) => {
              const reserved = Number(item?.reserved || 0);
              const qty = Number(item?.quantity || 0);
              const available = Math.max(0, qty - reserved);
              const pct =
                qty > 0 ? Math.min(100, Math.round((reserved / qty) * 100)) : 0;

              return (
                <div
                  key={item.id || item.docId}
                  className={[
                    "group relative overflow-hidden rounded-xl border transition shadow-sm hover:shadow-md",
                    item?.status === "planned"
                      ? "border-blue-200 bg-gradient-to-b from-white to-blue-50/60"
                      : "border-gray-200 bg-white",
                  ].join(" ")}
                >
                  {item?.status === "planned" && (
                    <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-100 opacity-60" />
                  )}

                  <div className="relative z-10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-slate-500" />
                          <div className="font-medium truncate">
                            {item?.name || "Unnamed"}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            Qty:{" "}
                            <span className="font-medium text-gray-700">
                              {qty}
                            </span>
                          </span>
                          {item?.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {item.location}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Status chip */}
                      <span
                        className={[
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                          chipTone(item?.status),
                        ].join(" ")}
                        title={`Status: ${item?.status ?? "unknown"}`}
                      >
                        {item?.status ?? "unknown"}
                      </span>
                    </div>

                    {/* Expiry chip */}
                    <div className="mt-3">
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                          expiryTone(item?.expiry),
                        ].join(" ")}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {item?.expiry
                          ? `Exp: ${formatDate(item.expiry)}`
                          : "No expiry"}
                      </span>
                    </div>

                    {/* Reserved/Available bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                        <span>Reserved</span>
                        <span>
                          {reserved}/{qty} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[11px] text-gray-600">
                        Available:{" "}
                        <span className="font-medium text-gray-800">
                          {available}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function formatDate(v) {
  if (!v) return "";
  const d =
    typeof v?.toDate === "function"
      ? v.toDate()
      : v instanceof Date
      ? v
      : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function expiryTone(expiry) {
  const d =
    typeof expiry?.toDate === "function"
      ? expiry.toDate()
      : expiry instanceof Date
      ? expiry
      : expiry
      ? new Date(expiry)
      : null;

  if (!d || Number.isNaN(d.getTime())) {
    return "border-slate-200 text-slate-700 bg-slate-50";
  }

  const now = new Date();
  const ms = d.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));

  if (days < 0) return "border-red-200 text-red-700 bg-red-50";
  if (days <= 2) return "border-orange-200 text-orange-700 bg-orange-50";
  return "border-emerald-200 text-emerald-700 bg-emerald-50";
}

function chipTone(status) {
  switch (status) {
    case "planned":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "used":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "donated":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

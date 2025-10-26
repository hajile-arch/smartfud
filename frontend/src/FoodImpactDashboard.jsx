// FoodImpactDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const presets = {
  "7d": () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "Last 7 days" };
  },
  "30d": () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "Last 30 days" };
  },
  ytd: () => {
    const end = new Date();
    const start = new Date(new Date().getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "Year to date" };
  },
  all: () => ({
    start: new Date(2025, 0, 1),
    end: new Date(2030, 11, 31),
    label: "All time",
  }),
};

const categoriesDefault = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Meat & Poultry",
  "Grains & Bread",
  "Canned Goods",
  "Frozen Foods",
  "Beverages",
  "Snacks",
  "Other",
];

export default function FoodImpactDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

const { start, end, label } = useMemo(() => {
  // Custom range selected
  if (rangeKey === "custom") {
    if (customStart && customEnd) {
      const s = new Date(customStart);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e, label: "Custom" };
    }
    // Custom selected but not filled → fallback to 30d
    const fallback = presets["30d"]();
    return { ...fallback };
  }

  // Normal presets (defensive in case of unexpected key)
  const fn = presets[rangeKey] || presets["30d"];
  return fn();
}, [rangeKey, customStart, customEnd]);


  const [usedItems, setUsedItems] = useState([]); // [{quantity, category, usedAt}]
  const [donations, setDonations] = useState([]); // [{category?, createdAt, quantity?}]
  const [allCategories, setAllCategories] = useState(categoriesDefault);

  // Fetch / listen within the date window
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // inventory used
    const invRef = collection(db, "users", user.uid, "inventory");
    const invQ = query(
      invRef,
      where("status", "==", "used") // ⬅️ no date filters here
      // (optional) add orderBy("createdAt", "asc") if all docs have createdAt
    );

    // donations
    const donRef = collection(db, "users", user.uid, "donations");
    const donQ = query(
      donRef,
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
      orderBy("createdAt", "asc")
    );

    // If your collection might not have usedAt (older docs),
    // create *additional* broad listeners and filter locally (optional).
    // Here we assume usedAt exists; we still fallback below if missing.

    const unsubInv = onSnapshot(
      invQ,
      (snap) => {
        const inRange = [];
        const cats = new Set(allCategories);

        snap.forEach((d) => {
          const x = d.data();

          // derive the effective timestamp
          const usedAt =
            (x.usedAt?.toDate?.() ? x.usedAt.toDate() : x.usedAt) ||
            (x.updatedAt?.toDate?.() ? x.updatedAt.toDate() : x.updatedAt) ||
            (x.createdAt?.toDate?.() ? x.createdAt.toDate() : x.createdAt);

          // if no timestamp at all, skip (or treat as now)
          if (!usedAt) return;

          // local range filter
          if (usedAt >= start && usedAt <= end) {
            const quantity = Number(x.quantity || 0);
            const category = x.category || "Other";
            cats.add(category);
            inRange.push({ quantity, category, usedAt });
          }
        });

        setUsedItems(inRange);
        setAllCategories(Array.from(cats));
        setLoading(false);
      },
      (err) => {
        console.error("Inventory listener error:", err);
        setUsedItems([]);
        setLoading(false);
      }
    );

    const unsubDon = onSnapshot(
      donQ,
      (snap) => {
        const arr = snap.docs.map((d) => {
          const x = d.data();
          const createdAt =
            (x.createdAt?.toDate?.() ? x.createdAt.toDate() : x.createdAt) ||
            new Date();
          return {
            category: x.category || "Other",
            createdAt,
            quantity: Number(x.quantity || 0), // optional
          };
        });
        setDonations(arr);
        const cats = new Set(allCategories);
        arr.forEach((i) => cats.add(i.category || "Other"));
        setAllCategories(Array.from(cats));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsubInv();
      unsubDon();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, start.getTime(), end.getTime()]);

  // Apply category filter (optional)
  const filteredUsed = useMemo(
    () =>
      categoryFilter === "all"
        ? usedItems
        : usedItems.filter((i) => i.category === categoryFilter),
    [usedItems, categoryFilter]
  );
  const filteredDon = useMemo(
    () =>
      categoryFilter === "all"
        ? donations
        : donations.filter((i) => i.category === categoryFilter),
    [donations, categoryFilter]
  );

  // Build day buckets
  const daysBetween = (s, e) => {
    const a = [];
    const d = new Date(s);
    d.setHours(0, 0, 0, 0);
    const last = new Date(e);
    last.setHours(0, 0, 0, 0);
    while (d <= last) {
      a.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return a;
  };

  const dayLabels = useMemo(
    () => daysBetween(start, end).map((d) => d.toLocaleDateString()),
    [start, end]
  );

  const savedPerDay = useMemo(() => {
    const map = new Map(dayLabels.map((l) => [l, 0]));
    filteredUsed.forEach((i) => {
      const key = new Date(i.usedAt).toLocaleDateString();
      if (map.has(key))
        map.set(key, map.get(key) + (isFinite(i.quantity) ? i.quantity : 0));
    });
    return dayLabels.map((l) => map.get(l));
  }, [filteredUsed, dayLabels]);

  const donationsPerDay = useMemo(() => {
    const map = new Map(dayLabels.map((l) => [l, 0]));
    filteredDon.forEach((i) => {
      const key = new Date(i.createdAt).toLocaleDateString();
      if (map.has(key)) map.set(key, map.get(key) + 1);
    });
    return dayLabels.map((l) => map.get(l));
  }, [filteredDon, dayLabels]);

  const savedByCategory = useMemo(() => {
    const catMap = new Map();
    filteredUsed.forEach((i) => {
      const c = i.category || "Other";
      catMap.set(
        c,
        (catMap.get(c) || 0) + (isFinite(i.quantity) ? i.quantity : 0)
      );
    });
    const labels = Array.from(catMap.keys());
    const data = labels.map((k) => catMap.get(k));
    return { labels, data };
  }, [filteredUsed]);

  const totals = useMemo(() => {
    const totalSaved = filteredUsed.reduce(
      (s, i) => s + (isFinite(i.quantity) ? i.quantity : 0),
      0
    );
    const donationCount = filteredDon.length;
    return { totalSaved, donationCount };
  }, [filteredUsed, filteredDon]);

  // Simple “previous period” comparison
  const previousComparison = useMemo(() => {
    const deltaMs = end - start;
    const prevStart = new Date(start.getTime() - deltaMs - 86400000);
    const prevEnd = new Date(start.getTime() - 86400000);

    // local compare (coarse): reuse full arrays, just filter by time window
    const inWindow = (date, a, b) => date >= a && date <= b;

    const prevSaved = usedItems
      .filter((i) => inWindow(new Date(i.usedAt), prevStart, prevEnd))
      .reduce((s, i) => s + (isFinite(i.quantity) ? i.quantity : 0), 0);

    const prevDon = donations.filter((d) =>
      inWindow(new Date(d.createdAt), prevStart, prevEnd)
    ).length;

    const pct = (curr, prev) => {
      if (prev === 0 && curr === 0) return 0;
      if (prev === 0) return 100;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      savedPct: pct(totals.totalSaved, prevSaved),
      donPct: pct(totals.donationCount, prevDon),
    };
  }, [start, end, usedItems, donations, totals]);

  const hasData = totals.totalSaved > 0 || totals.donationCount > 0;

  if (loading) return <p className="p-6">Loading your impact data…</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Controls */}
      <div className="bg-white shadow-sm rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {["7d", "30d", "ytd", "all"].map((k) => (
            <button
              key={k}
              onClick={() => setRangeKey(k)}
              className={`px-3 py-1 rounded-md border ${
                rangeKey === k
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700"
              }`}
            >
              {k === "7d"
                ? "Last 7d"
                : k === "30d"
                ? "Last 30d"
                : k.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setRangeKey("custom")}
            className={`px-3 py-1 rounded-md border ${
              rangeKey === "custom"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700"
            }`}
          >
            Custom
          </button>
        </div>

        {rangeKey === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border rounded-md px-2 py-1"
            />
            <span>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border rounded-md px-2 py-1"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-600">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-md px-2 py-1"
          >
            <option value="all">All</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Food Saved</p>
          <p className="text-3xl font-semibold">
            {totals.totalSaved.toFixed(0)} kg
          </p>
          <p
            className={`text-sm mt-1 ${
              previousComparison.savedPct >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {previousComparison.savedPct >= 0 ? "▲" : "▼"}{" "}
            {Math.abs(previousComparison.savedPct)}% vs prev period
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Donations</p>
          <p className="text-3xl font-semibold">{totals.donationCount}</p>
          <p
            className={`text-sm mt-1 ${
              previousComparison.donPct >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {previousComparison.donPct >= 0 ? "▲" : "▼"}{" "}
            {Math.abs(previousComparison.donPct)}% vs prev period
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Active Filters</p>
          <p className="text-base">
  {rangeKey === "custom"
    ? `${new Date(start).toLocaleDateString()} → ${new Date(end).toLocaleDateString()}`
    : label}
</p>

          <p className="text-sm text-gray-500">
            {categoryFilter === "all" ? "All categories" : categoryFilter}
          </p>
        </div>
      </div>

      {/* Charts */}
      {hasData ? (
        <>
          {/* Line: food saved over time */}
          <div
            className="bg-white rounded-xl shadow-sm p-4"
            style={{ height: 360 }}
          >
            <Line
              data={{
                labels: dayLabels,
                datasets: [
                  {
                    label: "Food Saved (kg)",
                    data: savedPerDay,
                    fill: true,
                    borderWidth: 2,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Food Saved Over Time" },
                },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                interaction: { mode: "index", intersect: false },
              }}
            />
          </div>

          {/* Bar: donations over time */}
          <div
            className="bg-white rounded-xl shadow-sm p-4"
            style={{ height: 360 }}
          >
            <Bar
              data={{
                labels: dayLabels,
                datasets: [
                  { label: "Donations", data: donationsPerDay, borderWidth: 1 },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Donations Over Time" },
                },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>

          {/* Doughnut: saved by category (prettier layout) */}
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Chart side */}
              <div className="mx-auto w-[280px] md:w-[320px]">
                <Doughnut
                  data={{
                    labels: savedByCategory.labels,
                    datasets: [
                      {
                        data: savedByCategory.data,
                        // nicer default colors (feel free to tweak)
                        backgroundColor: [
                          "#60a5fa",
                          "#34d399",
                          "#fbbf24",
                          "#f472b6",
                          "#a78bfa",
                          "#f87171",
                          "#22d3ee",
                          "#c084fc",
                          "#94a3b8",
                        ],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: "68%",
                    plugins: {
                      legend: { display: false },
                      title: {
                        display: true,
                        text: "Food Saved by Category",
                        font: { size: 14 },
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const v = ctx.raw ?? 0;
                            return `${ctx.label}: ${Number(v).toFixed(0)} kg`;
                          },
                        },
                      },
                    },
                    layout: { padding: 8 },
                  }}
                  plugins={[
                    // center total text
                    {
                      id: "centerText",
                      afterDraw(chart) {
                        const { width, height, ctx } = chart;
                        const total = savedByCategory.data.reduce(
                          (a, b) => a + b,
                          0
                        );
                        const text = `${total.toFixed(0)} kg`;
                        ctx.save();
                        ctx.font = "600 16px Inter, system-ui, sans-serif";
                        ctx.fillStyle = "#374151";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(text, width / 2, height / 2);
                        ctx.restore();
                      },
                    },
                  ]}
                />
              </div>

              {/* List side */}
              <div className="mx-auto w-full max-w-xs">
                <p className="text-sm text-gray-600 mb-3">Top categories</p>
                <ul className="space-y-2">
                  {savedByCategory.labels
                    .map((label, idx) => ({
                      label,
                      v: savedByCategory.data[idx],
                    }))
                    .sort((a, b) => b.v - a.v)
                    .slice(0, 5)
                    .map((x, i) => (
                      <li
                        key={x.label}
                        className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                      >
                        <span className="truncate">
                          <span className="mr-2 text-gray-400">#{i + 1}</span>
                          {x.label}
                        </span>
                        <span className="ml-3 shrink-0 font-semibold text-gray-800">
                          {x.v.toFixed(0)} kg
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Empty state
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <p className="text-xl font-semibold">No food-saving activity yet</p>
          <p className="text-gray-600 mt-2">
            Start logging items and marking them as <strong>used</strong> or
            converting to
            <strong> donations</strong> to see your impact here.
          </p>
        </div>
      )}
    </div>
  );
}

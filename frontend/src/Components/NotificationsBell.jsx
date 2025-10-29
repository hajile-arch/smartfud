// src/components/NotificationsBell.jsx
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";

export default function NotificationsBell({ user }) {
  const { items, unreadCount, markAsRead, markAllAsRead } = useNotifications(user, { limit: 25 });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openTarget = async (n) => {
    // mark read on click, then navigate if target exists
    await markAsRead(n.id);
    if (n.target?.route) {
      const url = buildUrl(n.target.route, n.target.params);
      navigate(url);
    } else {
      // fallback to notifications page
      navigate("/notifications");
    }
    setOpen(false);
  };

  const buildUrl = (route, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return qs ? $`{route}?${qs}` : route;
    // Example: route="/meal-planner", params={date:'2025-10-28',slot:'breakfast'}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 z-9999 w-96 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-sm font-semibold">Notifications</div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/notifications"); }}
                className="text-xs text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-auto divide-y">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">No notifications yet.</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openTarget(n)}
                  className={`block w-full text-left px-3 py-3 hover:bg-gray-50 ${
                    !n.read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* dot */}
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        n.read ? "bg-gray-300" : "bg-blue-600"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {n.title || "Notification"}
                      </div>
                      {n.body && (
                        <div className="truncate text-xs text-gray-600">{n.body}</div>
                      )}
                      <div className="mt-1 text-[11px] text-gray-500">
                        {formatWhen(n.createdAt)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatWhen(d) {
  if (!d) return "";
  const now = Date.now();
  const diff = Math.floor((now - new Date(d).getTime()) / 1000); // seconds
  
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  
  return new Date(d).toLocaleString();
}
// src/pages/NotificationsPage.jsx
import { Trash2, Check, CheckCheck } from "lucide-react";
import useNotifications from "./hooks/useNotifications";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage({ user }) {
  const {
    items,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications(user, { limit: 100 });
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-gray-600">
            {unreadCount} unread • {items.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white divide-y">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-600">
            No notifications yet.
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-3 px-4 py-3 ${
                n.read ? "bg-white" : "bg-blue-50/50"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                  <div className="truncate text-sm font-medium">
                    {n.title || "Notification"}
                  </div>
                </div>
                {n.body && (
                  <div className="mt-0.5 text-sm text-gray-700">{n.body}</div>
                )}
                <div className="mt-1 text-[11px] text-gray-500">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                </div>
                {n.target?.route && (
                  <button
                    className="mt-2 text-sm text-blue-600 underline underline-offset-2"
                    onClick={async () => {
                      await markAsRead(n.id);
                      const url = buildUrl(n.target.route, n.target.params);
                      navigate(url);
                    }}
                  >
                    View related item
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <Check className="h-4 w-4" />
                    Read
                  </button>
                )}
                <button
                  onClick={() => removeNotification(n.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function buildUrl(route, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `${route}?${qs}` : route;
}
    


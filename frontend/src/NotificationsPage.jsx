// src/pages/NotificationsPage.jsx
import {
  Trash2,
  Check,
  CheckCheck,
  AlertTriangle,
  Clock,
  AlertCircle,
} from "lucide-react";
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
    error,
  } = useNotifications(user, { limit: 100 });
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">
            Error Loading Notifications
          </h2>
          <p className="text-sm text-red-600 mt-1">
            Some notifications may not be available. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Get urgency icon based on type and urgency level
  const getUrgencyIcon = (notification) => {
    if (notification.type === "inventory") {
      switch (notification.urgency) {
        case "critical":
          return <AlertCircle className="h-5 w-5 text-red-500" />;
        case "urgent":
          return <AlertTriangle className="h-5 w-5 text-orange-500" />;
        case "warning":
          return <Clock className="h-5 w-5 text-yellow-500" />;
        default:
          return <Clock className="h-5 w-5 text-green-500" />;
      }
    }
    return <div className="h-2 w-2 rounded-full bg-blue-600" />;
  };

  // Get urgency badge text
  const getUrgencyBadge = (notification) => {
    if (notification.type === "inventory") {
      switch (notification.daysLeft) {
        case 0:
          return "Expires Today!";
        case 1:
          return "1 Day Left";
        case 2:
          return "2 Days Left";
        case 3:
          return "3 Days Left";
        default:
          return `${notification.daysLeft} Days Left`;
      }
    }
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount} unread • {items.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      </div>

      {/* Urgency Legend */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Alert Levels
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-red-700 font-medium">Critical (0-1 day)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-orange-700 font-medium">Urgent (2 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-yellow-700 font-medium">
              Warning (3 days)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-green-700 font-medium">Safe (4+ days)</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">
              Loading notifications...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <CheckCheck className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              You are all caught up!
            </h3>
            <p className="text-sm text-gray-600">
              No new notifications
            </p>
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 p-4 transition-all hover:bg-gray-50 ${
                n.read
                  ? "bg-gray-50 opacity-75"
                  : n.type === "inventory"
                  ? `${n.bgColor} ${n.borderColor} border-l-4`
                  : "bg-white border-l-4 border-blue-500"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-1">{getUrgencyIcon(n)}</div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`text-sm font-semibold ${
                        n.read
                          ? "text-gray-600"
                          : n.urgencyColor || "text-gray-900"
                      }`}
                    >
                      {n.title}
                    </div>
                    {!n.read &&
                      n.type === "inventory" &&
                      getUrgencyBadge(n) && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${n.bgColor} ${n.urgencyColor} border ${n.borderColor}`}
                        >
                          {getUrgencyBadge(n)}
                        </span>
                      )}
                    {!n.read && n.type !== "inventory" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>

                  {n.body && (
                    <div
                      className={`text-sm ${
                        n.read ? "text-gray-500" : "text-gray-700"
                      } mb-2 whitespace-pre-line`}
                    >
                      {n.body}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString()
                        : ""}
                    </span>
                    {n.type === "inventory" && (
                      <span className={`font-medium ${n.urgencyColor}`}>
                        {n.daysLeft === 0
                          ? "Expires today"
                          : `${n.daysLeft} day${
                              n.daysLeft !== 1 ? "s" : ""
                            } left`}
                      </span>
                    )}
                  </div>

                  {n.target?.route && (
                    <button
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      onClick={async () => {
                        await markAsRead(n.id);
                        const url = buildUrl(n.target.route, n.target.params);
                        navigate(url);
                      }}
                    >
                      View related item →
                    </button>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-3 w-3" />
                    Read
                  </button>
                )}
                <button
                  onClick={() => removeNotification(n.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="h-3 w-3" />
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

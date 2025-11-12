// src/hooks/useNotifications.js - UPDATED WITH ENHANCED UI
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  limit as qLimit,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import useInventoryAlerts from "./useInventoryAlerts";

// Local storage helper functions
const getReadInventoryNotifications = () => {
  try {
    const read = localStorage.getItem("readInventoryNotifications");
    return read ? JSON.parse(read) : [];
  } catch {
    return [];
  }
};

const getDismissedInventoryNotifications = () => {
  try {
    const dismissed = localStorage.getItem("dismissedInventoryNotifications");
    return dismissed ? JSON.parse(dismissed) : [];
  } catch {
    return [];
  }
};

const markInventoryNotificationAsRead = (id) => {
  try {
    const read = getReadInventoryNotifications();
    if (!read.includes(id)) {
      const updated = [...read, id];
      localStorage.setItem(
        "readInventoryNotifications",
        JSON.stringify(updated)
      );
    }
    return true;
  } catch (error) {
    console.error("Error marking inventory notification as read:", error);
    return false;
  }
};

const markAllInventoryNotificationsAsRead = (inventoryAlerts) => {
  try {
    const inventoryIds = inventoryAlerts.map(
      (alert) => `inventory-${alert.id}`
    );
    const currentRead = getReadInventoryNotifications();
    const updated = [...new Set([...currentRead, ...inventoryIds])];
    localStorage.setItem("readInventoryNotifications", JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Error marking all inventory notifications as read:", error);
    return false;
  }
};

const dismissInventoryNotification = (id) => {
  try {
    const dismissed = getDismissedInventoryNotifications();
    if (!dismissed.includes(id)) {
      const updated = [...dismissed, id];
      localStorage.setItem(
        "dismissedInventoryNotifications",
        JSON.stringify(updated)
      );
    }
    return true;
  } catch (error) {
    console.error("Error dismissing inventory notification:", error);
    return false;
  }
};

export default function useNotifications(user, opts = {}) {
  const [notificationItems, setNotificationItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localStorageVersion, setLocalStorageVersion] = useState(0); // Force re-renders

  const lim = opts.limit || 50;

  // Get inventory alerts
  const {
    alerts: inventoryAlerts,
    loading: inventoryLoading,
    error: inventoryError,
  } = useInventoryAlerts(user);

  // Fetch user notifications from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setNotificationItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const colRef = collection(db, "users", user.uid, "notifications");
    const q = query(colRef, orderBy("createdAt", "desc"), qLimit(lim));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const userNotifications = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()
            ? d.data().createdAt.toDate()
            : d.data().createdAt,
          type: "user",
        }));

        console.log(`Fetched ${userNotifications.length} user notifications`);
        setNotificationItems(userNotifications);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching user notifications:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid, lim]);

  // Combine user notifications with inventory alerts
  const items = useMemo(() => {
    const readInventoryNotifications = getReadInventoryNotifications();
    const dismissedInventoryNotifications =
      getDismissedInventoryNotifications();

    // Convert inventory alerts to notification format
    // In the inventory notification creation section:
    const inventoryNotifications = inventoryAlerts
      .filter((alert) => {
        const notificationId = `inventory-${alert.id}`;
        return !dismissedInventoryNotifications.includes(notificationId);
      })
      .map((alert) => {
        const expiryDate =
          alert.expiryDate instanceof Date
            ? alert.expiryDate
            : new Date(alert.expiryDate);
        const daysLeft = Math.ceil(
          (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
        );
        const notificationId = `inventory-${alert.id}`;

        // Determine urgency level and styling
        let urgency = "safe";
        let urgencyColor = "text-green-600";
        let bgColor = "bg-green-50";
        let borderColor = "border-green-200";
        let icon = "🟢";
        let donationMessage = "";

        if (daysLeft === 3) {
          urgency = "warning";
          urgencyColor = "text-yellow-600";
          bgColor = "bg-yellow-50";
          borderColor = "border-yellow-200";
          icon = "🟡";
          donationMessage = "Consider donating it to avoid waste!";
        } else if (daysLeft === 2) {
          urgency = "urgent";
          urgencyColor = "text-orange-600";
          bgColor = "bg-orange-50";
          borderColor = "border-orange-200";
          icon = "🟠";
          donationMessage = "Time to donate - help someone in need!";
        } else if (daysLeft <= 1) {
          urgency = "critical";
          urgencyColor = "text-red-600";
          bgColor = "bg-red-50";
          borderColor = "border-red-200";
          icon = "🔴";
          donationMessage = "Urgent: Donate now or it will go to waste!";
        } else {
          donationMessage = "Perfect time to donate and help your community!";
        }

        return {
          id: notificationId,
          title: `${icon} Inventory Alert`,
          body: `${alert.name} expires in ${daysLeft} day${
            daysLeft !== 1 ? "s" : ""
          }.\n${donationMessage}`,
          createdAt: expiryDate,
          read: readInventoryNotifications.includes(notificationId),
          type: "inventory",
          urgency: urgency,
          urgencyColor: urgencyColor,
          bgColor: bgColor,
          borderColor: borderColor,
          daysLeft: daysLeft,
          target: {
            route: "/foodinv",
            params: { highlight: alert.id },
          },
        };
      });

    // Combine and sort by date (newest first)
    const allItems = [...inventoryNotifications, ...notificationItems]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, lim);

    console.log(
      `Final: ${allItems.length} total notifications (${inventoryNotifications.length} inventory, ${notificationItems.length} user)`
    );
    return allItems;
  }, [notificationItems, inventoryAlerts, lim, localStorageVersion]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const markAsRead = async (id) => {
    if (id.startsWith("inventory-")) {
      // Handle inventory notifications with local storage
      const success = markInventoryNotificationAsRead(id);
      if (success) {
        // Force re-render by incrementing the version
        setLocalStorageVersion((prev) => prev + 1);
      }
    } else {
      // Handle regular notifications with Firestore
      if (!user?.uid) return;
      try {
        await updateDoc(doc(db, "users", user.uid, "notifications", id), {
          read: true,
        });
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  const markAllAsRead = async () => {
    let anyChanges = false;

    // Mark all inventory notifications as read
    const inventorySuccess =
      markAllInventoryNotificationsAsRead(inventoryAlerts);
    if (inventorySuccess) anyChanges = true;

    // Mark all user notifications as read in Firestore
    if (user?.uid) {
      try {
        const unreadUserNotifications = notificationItems.filter(
          (n) => !n.read
        );
        for (const n of unreadUserNotifications) {
          await updateDoc(doc(db, "users", user.uid, "notifications", n.id), {
            read: true,
          });
        }
        console.log("Marked all notifications as read");
        anyChanges = true;
      } catch (err) {
        console.error("Error marking all as read:", err);
      }
    }

    // Force re-render if any changes were made
    if (anyChanges) {
      setLocalStorageVersion((prev) => prev + 1);
    }
  };

  const removeNotification = async (id) => {
    if (id.startsWith("inventory-")) {
      // Handle inventory notifications - dismiss them (hide from view)
      const success = dismissInventoryNotification(id);
      if (success) {
        // Force re-render by incrementing the version
        setLocalStorageVersion((prev) => prev + 1);
      }
    } else {
      // Handle regular notifications with Firestore
      if (!user?.uid) return;
      try {
        await deleteDoc(doc(db, "users", user.uid, "notifications", id));
      } catch (err) {
        console.error("Error removing notification:", err);
      }
    }
  };

  return {
    items,
    loading: loading || inventoryLoading,
    unreadCount,
    error: error || inventoryError,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}

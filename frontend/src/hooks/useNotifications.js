// src/hooks/useNotifications.js
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

/**
 * Live notifications for the logged-in user.
 * @param {{uid?: string}} user
 * @param {{limit?: number}} opts
 */
export default function useNotifications(user, opts = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const lim = opts.limit || 50;

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const colRef = collection(db, "users", user.uid, "notifications");
    // newest first
    const q = query(colRef, orderBy("createdAt", "desc"), qLimit(lim));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt:
            d.data().createdAt?.toDate?.() ?
              d.data().createdAt.toDate() :
              d.data().createdAt,
        }));
        setItems(arr);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [user?.uid, lim]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const markAsRead = async (id) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, "users", user.uid, "notifications", id), {
      read: true,
    });
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    // small client loop; if you expect >500, switch to a Cloud Function/batch.
    const unread = items.filter((n) => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, "users", user.uid, "notifications", n.id), {
        read: true,
      });
    }
  };

  const removeNotification = async (id) => {
    if (!user?.uid) return;
    await deleteDoc(doc(db, "users", user.uid, "notifications", id));
  };

  return {
    items,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}

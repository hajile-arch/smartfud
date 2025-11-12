// src/hooks/useInventoryAlerts.js - CORRECTED VERSION
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

const EXPIRY_THRESHOLD = 3; // days

export default function useInventoryAlerts(user) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      console.log("No user, skipping inventory alerts");
      setAlerts([]);
      setLoading(false);
      return;
    }

    console.log("Setting up inventory alerts for user:", user.uid);

    try {
      // CORRECT PATH: users/{userId}/inventory
      const inventoryRef = collection(db, "users", user.uid, "inventory");
      
      // Use the same logic as your inventory page
      const inventoryQuery = query(
        inventoryRef,
        orderBy("expiry", "asc")
      );

      const unsub = onSnapshot(
        inventoryQuery,
        (querySnapshot) => {
          console.log(`Inventory query returned ${querySnapshot.size} items`);
          
          const now = new Date();
          const threshold = new Date(now.getTime() + (EXPIRY_THRESHOLD * 24 * 60 * 60 * 1000));
          
          const inventoryAlerts = querySnapshot.docs
            .map((doc) => {
              const data = doc.data();
              const expiry = data.expiry;
              const expiryDate = expiry?.toDate ? expiry.toDate() : new Date(expiry);
              
              return {
                id: doc.id,
                name: data.name,
                expiryDate: expiryDate,
                userId: data.userId,
                status: data.status
              };
            })
            // Filter for active items that are expiring soon (same logic as your page)
            .filter(item => {
              const isExpiringSoon = item.expiryDate <= threshold && item.expiryDate >= now;
              const isActive = item.status === "active";
              return isExpiringSoon && isActive;
            });

          console.log("Expiring inventory alerts:", inventoryAlerts);
          setAlerts(inventoryAlerts);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error in inventory alerts:", err);
          setError(err);
          setLoading(false);
          setAlerts([]);
        }
      );

      return unsub;
    } catch (err) {
      console.error("Error setting up inventory alerts:", err);
      setError(err);
      setLoading(false);
      return () => {};
    }
  }, [user?.uid]);

  return { alerts, loading, error };
}
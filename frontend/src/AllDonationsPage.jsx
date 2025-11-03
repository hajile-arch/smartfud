import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { collectionGroup, query, orderBy, onSnapshot } from "firebase/firestore";
import AllDonationItemDetails from "./Components/AllDonationItemDetails";
import { AlertTriangle } from "lucide-react";

const toJsDate = (v) => {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (v instanceof Date) return v;
  const ms = Date.parse(v);
  return Number.isNaN(ms) ? null : new Date(ms);
};

export default function AllDonationsPage() {
  const [uid, setUid] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);

  useEffect(() => {
    const q = query(collectionGroup(db, "donations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => {
          const data = d.data();
          const owner = d.ref.parent.parent?.id ?? null;
          return {
            userId: owner,                 // owner uid
            docId: d.id,
            // prefer denormalized names written at create-time
            ownerFullName: data.ownerFullName || data.ownerDisplayName || null,
            ...data,
            expiry: toJsDate(data?.expiry),
            createdAt: toJsDate(data?.createdAt),
          };
        });
        setDonations(all);
        setLoading(false);
      },
      (err) => {
        console.error("AllDonationsPage query error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Users' Donations</h1>

      {donations.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-900">No donations found</h3>
          <p className="mt-1 text-gray-600">There are currently no donations recorded.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
          {donations.map((donation) => (
            <AllDonationItemDetails
              key={donation.docId}
              donation={donation}
              currentUid={uid}
              // pass a clean owner name to the card
              ownerName={donation.ownerFullName || "Anonymous"}

              onDelete={(id) => setDonations((prev) => prev.filter((d) => d.docId !== id))}
              onUpdate={(id, patch) =>
                setDonations((prev) =>
                  prev.map((d) => (d.docId === id ? { ...d, ...patch } : d))
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import {
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { X, Edit, Trash2 } from "lucide-react";

const AllDonationItemDetails = ({
  donation,
  ownerName, // ← renamed prop
  currentUid,
  onDelete,
  onUpdate,
}) => {
  const isMine = currentUid && donation.userId === currentUid;
  const isExpired =
    donation.expiry instanceof Date && donation.expiry < new Date();
  const isRedeemed = donation.status === "redeemed";

  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [formData, setFormData] = useState({
    name: donation.name || "",
    quantity: donation.quantity ?? "",
    expiry: donation.expiry
      ? new Date(donation.expiry).toISOString().slice(0, 10)
      : "",
    pickupLocation: donation.pickupLocation || "",
    availability: donation.availability || "",
  });

  const disabled = busy || isExpired || isRedeemed;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setBusy(true);
      const donationRef = doc(
        db,
        "users",
        donation.userId,
        "donations",
        donation.docId
      );
      await updateDoc(donationRef, {
        name: formData.name,
        quantity: parseInt(formData.quantity, 10) || 0,
        expiry: formData.expiry ? new Date(formData.expiry) : null,
        pickupLocation: formData.pickupLocation,
        availability: formData.availability,
      });
      onUpdate(donation.docId, {
        ...formData,
        quantity: parseInt(formData.quantity, 10) || 0,
        expiry: formData.expiry ? new Date(formData.expiry) : null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating donation:", error);
      alert("Failed to update donation");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!isMine) return;
    if (!window.confirm("Delete this donation?")) return;
    try {
      setBusy(true);
      const donationRef = doc(
        db,
        "users",
        donation.userId,
        "donations",
        donation.docId
      );
      await deleteDoc(donationRef);
      onDelete(donation.docId);
    } catch (error) {
      console.error("Error deleting donation:", error);
      alert("Failed to delete donation");
    } finally {
      setBusy(false);
    }
  };

  // Redeem others' donation -> copy to my inventory + mark donation redeemed
  const handleRedeem = async () => {
    console.log("Redeem start", donation.name);
    if (!currentUid) return alert("Please sign in to redeem.");
    if (isMine) return alert("You cannot redeem your own donation.");
    if (isExpired || isRedeemed) return;

    try {
      setBusy(true);

      const donorUid = donation.userId;
      console.log(
        "donorUid for notification:",
        donorUid,
        "donationId:",
        donation.docId
      );
      const donationRef = doc(
        db,
        "users",
        donorUid,
        "donations",
        donation.docId
      );
      const invRef = doc(collection(db, "users", currentUid, "inventory"));
      const donorNotifsCol = collection(db, "users", donorUid, "notifications");

      const batch = writeBatch(db);
      batch.set(invRef, {
        name: donation.name,
        quantity: Number(donation.quantity) || 0,
        fromDonationId: donation.docId,
        fromUserId: donorUid,
        pickupLocation: donation.pickupLocation || "",
        availability: donation.availability || "",
        category:donation.category,
        addedAt: serverTimestamp(),
        expiry: donation.expiry || null,
        status: "active",
      });
      batch.update(donationRef, {
        status: "redeemed",
        redeemedBy: currentUid,
        redeemedAt: serverTimestamp(),
      });

      console.log("Batch committing...");
      await batch.commit();
      console.log("Batch committed successfully.");

      console.log("Creating notification...");
      const notifRef = await addDoc(donorNotifsCol, {
        type: "donation_redeemed",
        title: "Your donation was redeemed",
        body: `Someone has redeemed "${donation.name}".`,
        donationId: donation.docId,
        redeemedBy: currentUid,
        redeemedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        read: false,
        target: {
          route: "/all-donations",
          params: { highlight: donation.docId },
        },
      });
      console.log("Notification added at doc:", notifRef.path);
      console.log("Notification added!");

      onUpdate(donation.docId, { status: "redeemed", redeemedBy: currentUid });
      alert("Redemption successful!");
    } catch (e) {
      console.error("Redeem failed:", e);
      alert("Failed to redeem. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (d) => (d instanceof Date ? d.toLocaleDateString() : "—");

  return (
    <div
      className={`border p-4 rounded-lg mb-4 shadow-sm ${
        isExpired ? "opacity-60" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">
          {donation.name}{" "}
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {isMine ? "Mine" : `by ${ownerName || "Anonymsouss"}`}
          </span>
          {isRedeemed && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Redeemed
            </span>
          )}
          {isExpired && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              Expired
            </span>
          )}
        </h4>

        <div className="flex space-x-2">
          {isMine ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                disabled={disabled}
                className={`text-blue-500 hover:text-blue-700 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={disabled}
                className={`text-red-500 hover:text-red-700 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleRedeem}
              disabled={disabled}
              className={`px-3 py-1 rounded text-white ${
                disabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Redeem
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium">Edit Donation</h5>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry
            </label>
            <input
              type="date"
              name="expiry"
              value={formData.expiry}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location
            </label>
            <input
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability
            </label>
            <input
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                disabled={busy}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm">
          <p>Quantity: {donation.quantity ?? "—"}</p>
          <p>Expires: {fmt(donation.expiry)}</p>
          <p>Pickup Location: {donation.pickupLocation || "—"}</p>
          <p>Availability: {donation.availability || "—"}</p>
        </div>
      )}
    </div>
  );
};

export default AllDonationItemDetails;

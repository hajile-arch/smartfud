import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { X, Edit, Trash2, CheckCircle } from "lucide-react";

const DonationItemDetails = ({ donation, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: donation.name,
    quantity: donation.quantity,
    expiry: donation.expiry ? donation.expiry.toISOString().split("T")[0] : "",
    pickupLocation: donation.pickupLocation || "",
    availability: donation.availability || "",
  });

  const isRedeemed = donation.status === "redeemed"; // ✅ detect redeemed state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const donationRef = doc(db, "users", donation.userId, "donations", donation.docId);
      await updateDoc(donationRef, {
        name: formData.name,
        quantity: parseInt(formData.quantity),
        expiry: new Date(formData.expiry),
        pickupLocation: formData.pickupLocation,
        availability: formData.availability,
      });
      onUpdate(donation.docId, {
        ...formData,
        quantity: parseInt(formData.quantity),
        expiry: new Date(formData.expiry),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating donation:", error);
      alert("Failed to update donation");
    }
  };

  const handleDelete = async () => {
    if (isRedeemed) return; // ✅ block deletion of redeemed
    if (window.confirm("Are you sure you want to delete this donation?")) {
      try {
        const donationRef = doc(db, "users", donation.userId, "donations", donation.docId);
        await deleteDoc(donationRef);
        onDelete(donation.docId);
      } catch (error) {
        console.error("Error deleting donation:", error);
        alert("Failed to delete donation");
      }
    }
  };

  return (
    <div
      className={`border p-4 rounded-lg mb-4 shadow-sm ${
        isRedeemed ? "bg-green-50 border-green-300 opacity-90" : ""
      }`}
    >
      {isEditing && !isRedeemed ? (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">Edit Donation</h4>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Name */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            {/* Quantity */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            {/* Expiry Date */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              name="expiry"
              value={formData.expiry}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            {/* Pickup Location */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
            <input
              type="text"
              name="pickupLocation"
              placeholder="Pickup Location"
              value={formData.pickupLocation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            {/* Availability */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <input
              type="text"
              name="availability"
              placeholder="Availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            {/* Save & Cancel */}
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
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
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold flex items-center gap-2">
              {donation.name}
              {isRedeemed && (
                <span className="text-green-700 text-xs bg-green-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Redeemed
                </span>
              )}
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={() => !isRedeemed && setIsEditing(true)}
                disabled={isRedeemed}
                className={`${
                  isRedeemed
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-500 hover:text-blue-700"
                }`}
                title={isRedeemed ? "Cannot edit redeemed donation" : "Edit"}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info */}
          <p>Quantity: {donation.quantity}</p>
          <p>Expires: {donation.expiry.toLocaleDateString()}</p>
          <p>Pickup Location: {donation.pickupLocation || "—"}</p>
          <p>Availability: {donation.availability || "—"}</p>

          {isRedeemed && (
            <p className="mt-2 text-xs text-green-600">
              ✅ This item has been redeemed and is no longer available.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DonationItemDetails;

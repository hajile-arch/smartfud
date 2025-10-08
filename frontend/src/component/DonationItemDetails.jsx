import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path as needed
import { X, Edit, Trash2 } from "lucide-react";

const DonationItemDetails = ({ donation, onDelete, onUpdate }) => {
  // git commit: state: setup local editing and form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: donation.name,
    quantity: donation.quantity,
    expiry: donation.expiry ? donation.expiry.toISOString().split("T")[0] : "",
    pickupLocation: donation.pickupLocation || "",
    availability: donation.availability || "",
  });

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

return (
    <div className="border p-4 rounded-lg mb-4 shadow-sm">
      {/* git commit: ui: render editable form if isEditing */}
      {isEditing ? (
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

          {/* git commit: ui: form inputs for editing donation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              name="expiry"
              value={formData.expiry}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
            <input
              type="text"
              name="pickupLocation"
              placeholder="Pickup Location"
              value={formData.pickupLocation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <input
              type="text"
              name="availability"
              placeholder="Availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
            />
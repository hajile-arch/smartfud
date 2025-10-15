import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path as needed
import { X, Edit, Trash2 } from "lucide-react";

const DonationItemDetails = ({ donation, onDelete, onUpdate }) => {
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

  const handleDelete = async () => {
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
    <div className="border p-4 rounded-lg mb-4 shadow-sm">
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
          
          {/* Editable form fields */}
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

  {/* Save and cancel buttons */}
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
          {/* Display details */}
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">{donation.name}</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-700"
                title="Edit"
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
          {/* Show details */}
          <p>Name: {donation.name}</p>
          <p>Quantity: {donation.quantity}</p>
          <p>Expires: {donation.expiry.toLocaleDateString()}</p>
          <p>Pickup Location: {donation.pickupLocation}</p>
          <p>Availability: {donation.availability}</p>
          {/* Add more details as needed */}
        </div>
      )}
    </div>
  );
};

export default DonationItemDetails;
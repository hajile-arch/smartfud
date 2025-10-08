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


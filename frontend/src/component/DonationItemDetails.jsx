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

import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import {
  Check,
  MapPin,
  Calendar,
  Package,
  Gift,
  Utensils,
  X,
  Eye,
  ChefHat,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

const BrowseFoodItems = () => {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [conversionItem, setConversionItem] = useState(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [user, setUser] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [donationItems, setDonationItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    showInventory: true,
    showDonations: true,
    category: "all",
    expiryFilter: "all",
    storageType: "all",
  });

const handleOpenConvertModal = (item) => {
    setConversionItem(item);
    setPickupLocation("");
    setAvailability("");
    setShowConvertModal(true);
  };

  const handleConfirmConversion = async () => {
    if (!conversionItem || !user) return;
    try {
      const inventoryRef = doc(
        db,
        "users",
        user.uid,
        "inventory",
        conversionItem.id
      );
      const donationRef = doc(collection(db, "users", user.uid, "donations"));

      const docSnap = await getDoc(inventoryRef);
      if (!docSnap.exists()) {
        alert("Original inventory item not found");
        return;
      }

      const data = docSnap.data();

      await setDoc(donationRef, {
        ...data,
        status: "donated",
        pickupLocation,
        availability,
        createdAt: new Date(),
      });

      await deleteDoc(inventoryRef);

      setInventoryItems((prev) =>
        prev.filter((item) => item.id !== conversionItem.id)
      );
      const donationItem = {
        ...conversionItem,
        status: "donated",
        pickupLocation,
        availability,
        createdAt: new Date(),
      };
      setDonationItems((prev) => [...prev, donationItem]);
      alert("Item successfully moved to donations");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to convert item");
    }
    setShowConvertModal(false);
  };

  const categories = [
    "All Categories",
    "Fruits & Vegetables",
    "Dairy & Eggs",
    "Meat & Poultry",
    "Grains & Bread",
    "Canned Goods",
    "Frozen Foods",
    "Beverages",
    "Snacks",
    "Other",
  ];
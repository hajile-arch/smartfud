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

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user);
    if (user) {
      loadUserData(user.uid);
    } else {
      setLoading(false);
    }
  });
  return () => unsubscribe();
}, []);

const loadUserData = (userId) => {
  setLoading(true);

  const inventoryQuery = query(
    collection(db, "users", userId, "inventory"),
    where("status", "in", ["active", "planned", "used", "donated"])
  );
  const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      type: "inventory",
      ...doc.data(),
      expiry: doc.data().expiry?.toDate() || doc.data().expiry,
    }));
    setInventoryItems(items);
    setLoading(false);
  });

  const donationsQuery = query(
    collection(db, "users", userId, "donations")
  );
  const unsubscribeDonations = onSnapshot(donationsQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      type: "donation",
      ...doc.data(),
      expiry: doc.data().expiry?.toDate() || doc.data().expiry,
    }));
    setDonationItems(items);
  });

  return () => {
    unsubscribeInventory();
    unsubscribeDonations();
  };
};

const storageOptions = useMemo(() => {
  const locations = new Set();
  [...inventoryItems, ...donationItems].forEach((item) => {
    if (item.location) {
      locations.add(item.location);
    }
  });
  return Array.from(locations);
}, [inventoryItems, donationItems]);

useEffect(() => {
  let items = [];
  if (filters.showInventory) {
    items = [...items, ...inventoryItems];
  }
  if (filters.showDonations) {
    items = [...items, ...donationItems];
  }

  if (filters.category !== "all") {
    items = items.filter((item) => item.category === filters.category);
  }

  if (filters.expiryFilter !== "all") {
    const today = new Date();
    items = items.filter((item) => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      const diffDays = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );
      switch (filters.expiryFilter) {
        case "expiring":
          return diffDays <= 3 && diffDays >= 0;
        case "expired":
          return diffDays < 0;
        case "safe":
          return diffDays > 3;
        default:
          return true;
      }
    });
  }

  if (filters.storageType !== "all") {
    items = items.filter(
      (item) => item.location && item.location === filters.storageType
    );
  }
  setFilteredItems(items);
}, [inventoryItems, donationItems, filters]);
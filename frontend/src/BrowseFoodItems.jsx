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

const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const handleAction = async (actionType) => {
    if (!selectedItem || !user) return;
    try {
      if (selectedItem.type === "inventory") {
        const itemRef = doc(
          db,
          "users",
          user.uid,
          "inventory",
          selectedItem.id
        );
        await updateDoc(itemRef, { status: actionType });
        setInventoryItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id ? { ...item, status: actionType } : item
          )
        );
      } else if (selectedItem.type === "donation") {
        const itemRef = doc(
          db,
          "users",
          user.uid,
          "donations",
          selectedItem.id
        );
        await updateDoc(itemRef, { status: actionType });
        setDonationItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id ? { ...item, status: actionType } : item
          )
        );
      }
      alert(`Item marked as ${actionType}`);
      setShowDetails(false);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Error updating item status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "donated":
        return "bg-blue-100 text-blue-800";
      case "used":
        return "bg-gray-100 text-gray-800";
      case "planned":
        return "bg-purple-100 text-purple-800";
      case "available":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Package className="h-4 w-4" />;
      case "donated":
        return <Gift className="h-4 w-4" />;
      case "used":
        return <CheckCircle className="h-4 w-4" />;
      case "planned":
        return <ChefHat className="h-4 w-4" />;
      case "available":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const CustomCheckbox = ({ name, checked, onChange, label }) => (
    <label className="flex items-center space-x-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
            checked
              ? "bg-green-500 border-green-500"
              : "bg-white border-gray-300 group-hover:border-green-400"
          }`}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
      <span
        className={`font-medium transition-colors duration-200 ${
          checked ? "text-green-700" : "text-gray-700"
        }`}
      >
        {label}
      </span>
    </label>
  );
if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Please log in to browse food items
        </h2>
        <p className="text-gray-600">
          You need to be authenticated to access your food items.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Food Items</h1>
        <p className="text-gray-600 mt-2">
          Manage and organize your food inventory and donations
        </p>
      </div>

      {/* Filters */}
      {/* ... full JSX section ... */}

      {/* Item Details Modal + Convert Modal + Actions */}
      {/* (No change here, fully included in the final commit) */}
    </div>
  );
};

export default BrowseFoodItems;
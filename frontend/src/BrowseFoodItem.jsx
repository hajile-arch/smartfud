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
  getDoc
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
    storageType: "all", // default to "all"
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
    const inventoryRef = doc(db, "users", user.uid, "inventory", conversionItem.id);
    const donationRef = doc(collection(db, "users", user.uid, "donations"));

    // Fetch current data
    const docSnap = await getDoc(inventoryRef);
    if (!docSnap.exists()) {
      alert("Original inventory item not found");
      return;
    }
    const data = docSnap.data();

    // Add to donations collection
    await setDoc(donationRef, {
      ...data,
      status: "donated",
      pickupLocation,
      availability,
      createdAt: new Date(),
    });

    // Delete from inventory collection
    await deleteDoc(inventoryRef);

    // Update local states
    setInventoryItems(prev => prev.filter(item => item.id !== conversionItem.id));
    const donationItem = {
      ...conversionItem,
      status: "donated",
      pickupLocation,
      availability,
      createdAt: new Date(),
    };
    setDonationItems(prev => [...prev, donationItem]);

    alert("Item successfully moved to donations");
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to convert item");
  }

  setShowConvertModal(false);
};
  // Categories matching your FoodInventory component
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

  // Check auth and load data
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

  // Load user's data
  const loadUserData = (userId) => {
    setLoading(true);
    // Inventory listener
    const inventoryQuery = query(
      collection(db, "users", userId, "inventory"),
      where("status", "in", ["active", "planned", "used","donated"])
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
    // Donations listener
    const donationsQuery = query(collection(db, "users", userId, "donations"));
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

  // Extract unique storage locations from current data
  const storageOptions = useMemo(() => {
    const locations = new Set();

    [...inventoryItems, ...donationItems].forEach((item) => {
      if (item.location) {
        locations.add(item.location);
      }
    });

    return Array.from(locations);
  }, [inventoryItems, donationItems]);

  // Apply filters whenever data or filters change
  useEffect(() => {
    let items = [];

    if (filters.showInventory) {
      items = [...items, ...inventoryItems];
    }
    if (filters.showDonations) {
      items = [...items, ...donationItems];
    }

    // Filter by category
    if (filters.category !== "all") {
      items = items.filter((item) => item.category === filters.category);
    }

    // Filter by expiry
    if (filters.expiryFilter !== "all") {
      const today = new Date();
      items = items.filter((item) => {
        if (!item.expiry) return false;
        const expiryDate = new Date(item.expiry);
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

    // Filter by storage location dynamically
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
          className="sr-only" // Hide the default checkbox
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
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Item Type Filters */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Show Items</h3>
            <div className="space-y-3">
              <CustomCheckbox
                name="showInventory"
                checked={filters.showInventory}
                onChange={handleFilterChange}
                label="Inventory Items"
              />
              <CustomCheckbox
                name="showDonations"
                checked={filters.showDonations}
                onChange={handleFilterChange}
                label="Donation Listings"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categories.map((cat) => (
                <option
                  key={cat}
                  value={cat === "All Categories" ? "all" : cat}
                >
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Status
            </label>
            <select
              name="expiryFilter"
              value={filters.expiryFilter}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Items</option>
              <option value="safe">Safe (&gt; 3 days)</option>
              <option value="expiring">Expiring Soon (≤ 3 days)</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Storage Location Filter (Dynamic Options) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Location
            </label>
            <select
              name="storageType"
              value={filters.storageType}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All</option>
              {storageOptions.length > 0 ? (
                storageOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))
              ) : (
                <option disabled>No locations</option>
              )}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-700">
              {filteredItems.length} items found
            </span>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No items found
            </h3>
            <p className="text-gray-600 mt-2">
              {filters.showInventory || filters.showDonations
                ? "Try adjusting your filters to see more results."
                : "Please select at least one item type to display."}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              onClick={() => handleItemClick(item)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.type === "donation" ? "Donation" : item.status}
                    </span>
                  </div>
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>

                {/* Item Details */}
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {item.name}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Quantity: {item.quantity}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Expiry: {item.expiry?.toLocaleDateString() || "N/A"}
                    </span>
                  </div>

                  {item.pickupLocation && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Pickup: {item.pickupLocation}</span>
                    </div>
                  )}

                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs inline-block">
                    {item.category}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedItem.name}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Item Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedItem.category}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedItem.quantity} units
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedItem.expiry?.toLocaleDateString() ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {selectedItem.pickupLocation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pickup Location
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedItem.pickupLocation}
                      </p>
                    </div>
                  )}
                  {selectedItem.availability && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Availability
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedItem.availability}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Storage Location
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedItem.location || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <span
                      className={`mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedItem.status
                      )}`}
                    >
                      {selectedItem.type === "donation"
                        ? "Donation Listing"
                        : selectedItem.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedItem.notes && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedItem.notes}
                  </p>
                </div>
              )}
              {showConvertModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                    <h2 className="text-2xl font-semibold mb-4">
                      Convert to Donation
                    </h2>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter pickup location"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Availability
                      </label>
                      <input
                        type="text"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter availability times"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowConvertModal(false)}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleConfirmConversion();
                          setShowConvertModal(false);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Actions buttons (for inventory items only) */}
              {selectedItem.type === "inventory" &&
                selectedItem.status === "active" && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Item Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleAction("used")}
                        className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Mark as Used</span>
                      </button>
                      <button
                        onClick={() => handleAction("planned")}
                        className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition"
                      >
                        <ChefHat className="h-4 w-4" />
                        <span>Plan for Meal</span>
                      </button>
                      <button
                        onClick={() => handleOpenConvertModal(selectedItem)}
                        className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition"
                      >
                        <Gift className="h-4 w-4" />
                        <span>Flag for Donation</span>
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseFoodItems;

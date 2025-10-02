// ---------------- Imports ----------------
import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase"; // Firebase authentication & Firestore DB
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import ConvertDonationModal from "./Components/ConvertDonationModal"; // Modal for converting inventory to donation
import DonationItemDetails from "./Components/DonationItemDetails"; // UI component for each donation item
import { onAuthStateChanged } from "firebase/auth"; // Track user authentication state
// UI icons from lucide-react
import {
  Plus,
  Edit,
  Trash2,
  Gift,
  Search,
  Filter,
  Calendar,
  MapPin,
  Package,
  Utensils,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";

const FoodInventory = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");

  const handleOpenConvertModal = (item) => {
    setSelectedItem(item);
    setPickupLocation("");
    setAvailability("");
    setShowConvertModal(true);
  };

  const handleConfirmConversion = async () => {
    if (!pickupLocation || !availability) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const donationData = {
        ...selectedItem,
        status: "available",
        pickupLocation,
        availability,
        contactInfo: user.email,
        createdAt: new Date(),
      };

      await addDoc(
        collection(db, "users", user.uid, "donations"),
        donationData
      );

      await updateDoc(
        doc(db, "users", user.uid, "inventory", selectedItem.id),
        { status: "donated", donatedAt: new Date() }
      );

      await deleteDoc(doc(db, "users", user.uid, "inventory", selectedItem.id));

      setItems((prevItems) =>
        prevItems.filter((item) => item.id !== selectedItem.id)
      );
      alert("Item successfully converted to donation!");
      setShowConvertModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error converting item:", error);
      alert("Error converting item. Please try again.");
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    expiry: "",
    category: "",
    location: "",
    notes: "",
  });

  const categories = [
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
    const inventoryQuery = query(
      collection(db, "users", userId, "inventory"),
      orderBy("expiry", "asc")
    );

    const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const inventoryItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        expiry: doc.data().expiry?.toDate() || doc.data().expiry,
      }));
      setItems(inventoryItems);
    });

    const donationsQuery = query(
      collection(db, "users", userId, "donations"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeDonations = onSnapshot(donationsQuery, (snapshot) => {
      const donationItems = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          docId: doc.id,
          ...data,
          expiry: data.expiry?.toDate() || data.expiry,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
        };
      });
      setDonations(donationItems);
    });

    setLoading(false);
    return () => {
      unsubscribeInventory();
      unsubscribeDonations();
    };
  };

   const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.quantity ||
      !formData.expiry ||
      !formData.category
    ) {
      alert("Please complete all required fields");
      return;
    }

    try {
      const itemData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        expiry: new Date(formData.expiry),
        createdAt: new Date(),
        status: "active",
        userId: user.uid,
      };

      if (editingItem) {
        await updateDoc(
          doc(db, "users", user.uid, "inventory", editingItem.id),
          itemData
        );
      } else {
        await addDoc(collection(db, "users", user.uid, "inventory"), itemData);
      }

      setFormData({
        name: "",
        quantity: "",
        expiry: "",
        category: "",
        location: "",
        notes: "",
      });
      setEditingItem(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Error saving item. Please try again.");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      expiry: item.expiry.toISOString().split("T")[0],
      category: item.category,
      location: item.location || "",
      notes: item.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "inventory", itemId));
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Error deleting item. Please try again.");
      }
    }
  };

  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return expiryDate <= threeDaysFromNow && expiryDate >= today;
  };

  const isExpired = (expiryDate) => {
    return expiryDate < new Date();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    let matchesExpiry = true;
    if (expiryFilter === "expiring") {
      matchesExpiry = isExpiringSoon(item.expiry);
    } else if (expiryFilter === "expired") {
      matchesExpiry = isExpired(item.expiry);
    } else if (expiryFilter === "safe") {
      matchesExpiry = !isExpiringSoon(item.expiry) && !isExpired(item.expiry);
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesExpiry &&
      (item.status === "active" || item.status === "donated")
    );
  });

  // git commit: ui: add loading and unauthenticated user messages
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
          Please log in to manage your inventory
        </h2>
        <p className="text-gray-600">
          You need to be authenticated to access the food inventory.
        </p>
      </div>
    );
  }

  // ... rest of UI code for inventory list, donation list, modals ...
};

const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return expiryDate <= threeDaysFromNow && expiryDate >= today;
  };

  const isExpired = (expiryDate) => {
    return expiryDate < new Date();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    let matchesExpiry = true;
    if (expiryFilter === "expiring") {
      matchesExpiry = isExpiringSoon(item.expiry);
    } else if (expiryFilter === "expired") {
      matchesExpiry = isExpired(item.expiry);
    } else if (expiryFilter === "safe") {
      matchesExpiry = !isExpiringSoon(item.expiry) && !isExpired(item.expiry);
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesExpiry &&
      (item.status === "active" || item.status === "donated")
    );
  });


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
          Please log in to manage your inventory
        </h2>
        <p className="text-gray-600">
          You need to be authenticated to access the food inventory.
        </p>
      </div>
    );
  }

  // ... rest of UI code for inventory list, donation list, modals ...
};
return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Food Inventory</h1>
        <p className="text-gray-600 mt-2">
          Manage your food items and reduce waste
        </p>
      </div>
      <button
        onClick={() => setShowForm(true)}
        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Food Item
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <Package className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">
              {items.filter((i) => i.status === "active").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
            <p className="text-2xl font-bold text-red-600">
              {items.filter(
                (item) =>
                  isExpiringSoon(item.expiry) && item.status === "active"
              ).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <Clock className="h-8 w-8 text-orange-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Expired</p>
            <p className="text-2xl font-bold text-orange-600">
              {items.filter(
                (item) => isExpired(item.expiry) && item.status === "active"
              ).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <Gift className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Donations</p>
            <p className="text-2xl font-bold text-green-600">{donations.length}</p>
          </div>
        </div>
      </div>
    </div>

<div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Items</option>
          <option value="safe">Safe</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>

        <button
          onClick={() => {
            setSearchTerm("");
            setCategoryFilter("all");
            setExpiryFilter("all");
          }}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>
    </div>
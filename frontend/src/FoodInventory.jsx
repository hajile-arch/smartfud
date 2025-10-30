import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
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
import ConvertDonationModal from "./Components/ConvertDonationModal";
import DonationItemDetails from "./Components/DonationItemDetails";
import { onAuthStateChanged } from "firebase/auth";
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
import { initialFormData, categories } from "./Config/constants";
import FoodInventoryHeader from "./Components/FoodInventoryHeader";
import FoodInventoryForm from "./Components/FoodInventoryForm";

const FoodInventory = () => {
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
  const [formData, setFormData] = useState(initialFormData);
  const handleOpenConvertModal = (item) => {
    setSelectedItem(item);
    setPickupLocation("");
    setAvailability("");
    setShowConvertModal(true);
  };

  // Handler for modal confirmation
  const handleConfirmConversion = async () => {
    if (!pickupLocation || !availability) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const donationData = {
        ...selectedItem,
        // originalItemId: selectedItem.id,
        status: "donated",
        pickupLocation,
        availability,
        contactInfo: user.email,
        createdAt: new Date(),
      };

      // Save donation
      await addDoc(
        collection(db, "users", user.uid, "donations"),
        donationData
      );

      // Update inventory item
      await updateDoc(
        doc(db, "users", user.uid, "inventory", selectedItem.id),
        { status: "donated", donatedAt: new Date() }
      );
      // Remove from Firestore
      await deleteDoc(doc(db, "users", user.uid, "inventory", selectedItem.id));

      // Remove from local state
      setItems((prevItems) =>
        prevItems.filter((item) => item.id !== selectedItem.id)
      );
      alert("Item successfully converted to donation!");
      setShowConvertModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("   Error converting item:", error);
      alert("Error converting item. Please try again.");
    }
  };
  // Check authentication
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

  // Load user's inventory and donations
  const loadUserData = (userId) => {
    // Inventory listener
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

    // Donations listener
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

  // Handle form input changes
  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  // Add or update item
  const handleSubmit = async (formData, editingItem) => {
    // Validation
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
        // Update existing item
        await updateDoc(
          doc(db, "users", user.uid, "inventory", editingItem.id),
          itemData
        );
      } else {
        // Add new item
        await addDoc(collection(db, "users", user.uid, "inventory"), itemData);
      }

      // Reset form and close modal
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Error saving item. Please try again.");
    }
  };
  // Edit item
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

  // Delete item
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

  // Check if item is expiring soon (within 3 days)
  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return expiryDate <= threeDaysFromNow && expiryDate >= today;
  };

  // Check if item is expired
  const isExpired = (expiryDate) => {
    return expiryDate < new Date();
  };

  // Filter items based on search and filters
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

    // Remove or modify the status check to include other statuses
    // For example, include 'active' and 'donated'
    return (
      matchesSearch &&
      matchesCategory &&
      matchesExpiry &&
      (item.status === "active" ||
        item.status === "donated" ||
        item.status === "planned")
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FoodInventoryHeader
        items={items}
        donations={donations}
        onAddItem={() => setShowForm(true)}
      />
      {/* Filters and Search */}
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

      {/* Add/Edit Form Modal */}
      <FoodInventoryForm
        showForm={showForm}
        editingItem={editingItem}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
        formData={formData}
        onInputChange={setFormData}
      />

      {/* Inventory List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Food Items ({filteredItems.length})
          </h2>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No food items
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || categoryFilter !== "all" || expiryFilter !== "all"
                ? "No items match your filters."
                : "Get started by adding your first food item."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-lg ${
                        isExpired(item.expiry)
                          ? "bg-red-100"
                          : isExpiringSoon(item.expiry)
                          ? "bg-orange-100"
                          : "bg-green-100"
                      }`}
                    >
                      <Utensils
                        className={`h-5 w-5 ${
                          isExpired(item.expiry)
                            ? "text-red-600"
                            : isExpiringSoon(item.expiry)
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {item.quantity} units
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {item.expiry.toLocaleDateString()}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {item.category}
                        </span>
                        {item.location && (
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isExpired(item.expiry) && (
                      <button
                        onClick={() => handleOpenConvertModal(item)}
                        className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
                        title="Convert to Donation"
                      >
                        <Gift className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                      title="Edit Item"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
                      title="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expiry Warning */}
                {isExpired(item.expiry) && (
                  <div className="mt-2 flex items-center text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    This item has expired. Please dispose of it safely.
                  </div>
                )}

                {isExpiringSoon(item.expiry) && !isExpired(item.expiry) && (
                  <div className="mt-2 flex items-center text-orange-600 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    This item is expiring soon. Consider donating it.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donations Section */}
      {donations.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Donation Listings ({donations.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {donations.map((donation) => (
              <DonationItemDetails
                key={donation.docId}
                donation={donation}
                onDelete={(id) => {
                  setDonations((prev) => prev.filter((d) => d.docId !== id));
                }}
                onUpdate={(id, updatedData) => {
                  setDonations((prev) =>
                    prev.map((d) =>
                      d.docId === id ? { ...d, ...updatedData } : d
                    )
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}

      <ConvertDonationModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onConfirm={handleConfirmConversion}
        pickupLocation={pickupLocation}
        setPickupLocation={setPickupLocation}
        availability={availability}
        setAvailability={setAvailability}
      />
    </div>
  );
};

export default FoodInventory;

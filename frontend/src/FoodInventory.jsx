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
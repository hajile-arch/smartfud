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
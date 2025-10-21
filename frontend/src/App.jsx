import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Verify from "./Verify";
import FoodInventory from "./FoodInventory";
import TrackAndReport from "./FoodImpactDashboard"; // 👈 ensure this matches your file/export
import PrivateRoute from "./PrivateRoute";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import BrowseFoodItems from "./BrowseFoodItem";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">SmartFud</h1>

          <div className="space-x-4">
            {/* Only show app pages when logged in */}
            {user && (
              <>
                <Link to="/browsefooditems" className="hover:text-blue-600">
                  Browse Food Items
                </Link>
                <Link to="/foodanalytics" className="hover:text-blue-600">
                  Food Analytics
                </Link>
                <Link to="/foodinv" className="hover:text-blue-600">
                  Inventory
                </Link>
              </>
            )}

            <Link to="/" className="hover:text-blue-600">
              Home
            </Link>

            {/* Auth links */}
            {!user ? (
              <>
                <Link to="/register" className="hover:text-blue-600">
                  Register
                </Link>
                <Link to="/login" className="hover:text-blue-600">
                  Login
                </Link>
              </>
            ) : (
              <button
                onClick={() => auth.signOut()}
                className="hover:text-red-600 transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
              <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
                Hi Welcome to <span className="text-blue-600">SmartFud</span>
              </h2>
              <p className="text-gray-600 max-w-lg mb-6">
                Track your food, plan meals, and reduce waste — all in one place.
              </p>

              <div className="space-x-4">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/login"
                      className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition"
                    >
                      Login
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/foodinv"
                      className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition"
                    >
                      Inventory
                    </Link>
                    <Link
                      to="/foodanalytics"
                      className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition"
                    >
                      Food Analytics
                    </Link>
                    <Link
                      to="/browsefooditems"
                      className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition"
                    >
                      Browse Food Items
                    </Link>
                  </>
                )}
              </div>
            </div>
          }
        />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />

        {/* Protected routes (pass user + loading into PrivateRoute) */}
        <Route
          path="/foodinv"
          element={
            <PrivateRoute user={user} loading={loading}>
              <FoodInventory />
            </PrivateRoute>
          }
        />
        <Route
          path="/browsefooditems"
          element={
            <PrivateRoute user={user} loading={loading}>
              <BrowseFoodItems />
            </PrivateRoute>
          }
        />
        <Route
          path="/foodanalytics"
          element={
            <PrivateRoute user={user} loading={loading}>
              <TrackAndReport user={user} />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

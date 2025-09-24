import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Verify from "./Verify"

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">SavePlate</h1>
          <div className="space-x-4">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/register" className="hover:text-blue-600">Register</Link>
            <Link to="/login" className="hover:text-blue-600">Login</Link>
          </div>
        </div>
      </nav>

      {/* Page Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
              <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
                Hi 👋 Welcome to <span className="text-blue-600">SavePlate</span>
              </h2>
              <p className="text-gray-600 max-w-lg mb-6">
                Track your food, plan meals, and reduce waste — all in one place.
              </p>
              <div className="space-x-4">
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
              </div>
            </div>
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  );
}

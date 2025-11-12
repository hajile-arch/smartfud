import { Plus, Package, AlertTriangle, Clock, Gift, TrendingUp } from "lucide-react";

const FoodInventoryHeader = ({ items, donations, onAddItem }) => {
  // Utility functions
  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return expiryDate <= threeDaysFromNow && expiryDate >= today;
  };

  const isExpired = (expiryDate) => {
    return expiryDate < new Date();
  };

  const stats = {
    totalItems: items.filter(i => i.status === "active" || i.status === "planned").length,
    expiringSoon: items.filter(item => isExpiringSoon(item.expiry) && item.status === "active").length,
    expired: items.filter(item => isExpired(item.expiry) && item.status === "active").length,
    donations: donations.length
  };

  return (
    <>
      {/* Header with gradient background */}
      <div className="relative mb-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-200 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Food Inventory
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Manage your food items and reduce waste 🌱
            </p>
          </div>
          <button
            onClick={onAddItem}
            className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold">Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Items Card */}
        <div className="group relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="bg-blue-100 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Package className="h-7 w-7 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Food Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className="group relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          {stats.expiringSoon > 0 && (
            <div className="absolute top-3 right-3">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="bg-red-100 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Expiring Soon</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.expiringSoon}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expired Card */}
        <div className="group relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="bg-orange-100 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Expired</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Donations Card */}
        <div className="group relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="bg-green-100 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Gift className="h-7 w-7 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Donations</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.donations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodInventoryHeader;
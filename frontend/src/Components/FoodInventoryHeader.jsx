import { Plus, Package, AlertTriangle, Clock, Gift } from "lucide-react";

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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Food Inventory</h1>
          <p className="text-gray-600 mt-2">
            Manage your food items and reduce waste
          </p>
        </div>
        <button
          onClick={onAddItem}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Food Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-600">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Gift className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Donations</p>
              <p className="text-2xl font-bold text-green-600">{stats.donations}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodInventoryHeader;
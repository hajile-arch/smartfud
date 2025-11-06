import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const FoodInventoryForm = ({ 
  showForm, 
  editingItem, 
  onClose, 
  onSubmit, 
  formData: externalFormData, 
  onInputChange 
}) => {
  const [internalFormData, setInternalFormData] = useState({
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

  // Use external form data if provided, otherwise use internal state
  const formData = externalFormData || internalFormData;
  const setFormData = onInputChange || setInternalFormData;

  useEffect(() => {
    if (editingItem) {
      const formData = {
        name: editingItem.name,
        quantity: editingItem.quantity.toString(),
        expiry: editingItem.expiry.toISOString().split("T")[0],
        category: editingItem.category,
        location: editingItem.location || "",
        notes: editingItem.notes || "",
      };
      setFormData(formData);
    } else {
      setFormData({
        name: "",
        quantity: "",
        expiry: "",
        category: "",
        location: "",
        notes: "",
      });
    }
  }, [editingItem, setFormData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, editingItem);
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      quantity: "",
      expiry: "",
      category: "",
      location: "",
      notes: "",
    });
    onClose();
  };

  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editingItem ? "Edit Food Item" : "Add Food Item"}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date *
            </label>
            <input
              type="date"
              name="expiry"
              value={formData.expiry}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Pantry, Fridge, Freezer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
            >
              {editingItem ? "Update Item" : "Add Item"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FoodInventoryForm;
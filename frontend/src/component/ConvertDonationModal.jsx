import { X } from "lucide-react";

const ConvertDonationModal = ({
  isOpen,
  onClose,
  onConfirm,
  pickupLocation,
  setPickupLocation,
  availability,
  setAvailability,
}) => {
  // git commit: fix: render nothing if modal is closed
  if (!isOpen) return null;

return (
    // git commit: ui: add modal backdrop and center modal content
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative"></div>
      <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold mb-4">Convert to Donation</h3>

        {/* git commit: ui: add form inputs for pickup location and availability */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location *
            </label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Community Center, Church, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability *
            </label>
            <input
              type="text"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Date/Time or specific details"
            />
          </div>
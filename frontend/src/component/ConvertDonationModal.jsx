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
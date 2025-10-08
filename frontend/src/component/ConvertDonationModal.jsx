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

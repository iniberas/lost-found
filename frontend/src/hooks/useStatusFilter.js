import { useState } from "react";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Selesai" },
  { value: "closed", label: "Ditutup" },
];

export const useStatusFilter = () => {
  const [selectedStatuses, setSelectedStatuses] = useState(["open"]);

  // Handle status checkbox change
  const handleStatusChange = (statusValue) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(statusValue)) {
        return prev.filter((s) => s !== statusValue);
      } else {
        return [...prev, statusValue];
      }
    });
  };

  // Handle "Semua" checkbox
  const handleAllStatusChange = () => {
    if (selectedStatuses.length === statusOptions.length) {
      setSelectedStatuses(["open"]);
    } else {
      setSelectedStatuses(statusOptions.map((opt) => opt.value));
    }
  };

  return {
    selectedStatuses,
    setSelectedStatuses,
    handleStatusChange,
    handleAllStatusChange,
    statusOptions,
  };
};

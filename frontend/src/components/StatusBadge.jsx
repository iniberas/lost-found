import React from "react";

/**
 * One badge component to rule them all.
 *
 * Pass `variant` matching one of the keys below.
 * Optionally pass `label` to override the display text.
 *
 * Supported variants:
 *   User status:    active | deleted
 *   Roles:          user | admin | superadmin
 *   Report status:  open | unresolved | resolved | closed
 *   Found status:   held_by_finder | held_by_admin | returned_to_owner
 *   Report type:    lost | found
 */

const STYLES = {
  // account status
  active: "bg-green-50 text-green-600 border-green-100",
  deleted: "bg-red-50 text-red-500 border-red-100",
  // roles
  user: "bg-gray-100 text-gray-600 border-gray-200",
  admin: "bg-blue-50 text-blue-600 border-blue-100",
  superadmin: "bg-purple-50 text-purple-600 border-purple-100",
  // report status
  open: "bg-amber-50 text-amber-600 border-amber-100",
  unresolved: "bg-amber-50 text-amber-600 border-amber-100",
  resolved: "bg-green-50 text-green-600 border-green-100",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
  // found status
  held_by_finder: "bg-orange-50 text-orange-600 border-orange-100",
  held_by_admin: "bg-blue-50 text-blue-600 border-blue-100",
  returned_to_owner: "bg-green-50 text-green-600 border-green-100",
  // report type
  lost: "bg-red-50 text-red-600 border-red-100",
  found: "bg-emerald-50 text-emerald-600 border-emerald-100",
  // contact request status
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  approved: "bg-green-50 text-green-600 border-green-100",
  rejected: "bg-red-50 text-red-600 border-red-100",
  canceled: "bg-gray-100 text-gray-500 border-gray-200",
};

const LABELS = {
  active: "Active",
  deleted: "Deleted",
  user: "User",
  admin: "Admin",
  superadmin: "Superadmin",
  open: "Open",
  unresolved: "Open",
  resolved: "Resolved",
  closed: "Closed",
  held_by_finder: "With Finder",
  held_by_admin: "With Admin",
  returned_to_owner: "Returned",
  lost: "Lost",
  found: "Found",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  canceled: "Canceled",
};

export default function StatusBadge({ variant, label, className = "" }) {
  const key = variant?.toLowerCase().trim();
  const style = STYLES[key] ?? "bg-gray-100 text-gray-500 border-gray-200";
  const text = label ?? LABELS[key] ?? variant ?? "Unknown";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-md border ${style} ${className}`}
    >
      {text}
    </span>
  );
}
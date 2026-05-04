import React, { useState } from "react";
import AdminDashboardLayout from "../../../layouts/AdminDashboard";
import CreateReportForm from "./CreateReportForm";
import ExistingReportScanner from "./HandOverExistingReport";
import TabSelector from "../../../components/admin/TabSelector";

export default function AdminHandoverPage({ user }) {
  const [activeTab, setActiveTab] = useState("create");

  const tabs = [
    { id: "create", label: "Create Hand Over Report" },
    { id: "existing", label: "Hand Over from Existing Report" },
  ];

  return (
    <AdminDashboardLayout user={user}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="px-10 py-8 space-y-6 relative">
        
        <TabSelector 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {activeTab === "create" && <CreateReportForm />}
          {activeTab === "existing" && <ExistingReportScanner activeTab={activeTab} />}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        #qr-reader {
          border: none !important;
        }
        #qr-reader__dashboard_section_csr span {
          display: none !important;
        }
        #qr-reader__dashboard_section_swaplink {
          text-decoration: none !important;
          color: #2563eb !important;
          font-weight: bold !important;
          margin-top: 10px !important;
          display: inline-block !important;
        }
      `}} />
    </AdminDashboardLayout>
  );
}
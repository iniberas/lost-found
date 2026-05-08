import React, { useState } from 'react';
import UserLayout from "../../layouts/UserLayout";
import UpdateReportForm from "./UpdateReportForm";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Toast from "../../components/Toast";

export default function UpdateReportPage({ user, handleLogout }) {
	const location = useLocation();
	const reportType = location.pathname.includes('lapor-temuan') ? 'penemuan' : 'kehilangan';

	const [toast, setToast] = useState(null);
	const showToast = (message, type = "success") => {
		setToast({ message, type });
	};

	return (
		<UserLayout
			user={user}
			handleLogout={handleLogout}
		>
			<Toast
				show={Boolean(toast)}
				message={toast?.message}
				type={toast?.type}
				onClose={() => setToast(null)}
			/>
			<div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-6">
				{/* HEADER */}
				<div className="space-y-6">
					{/* TOP */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div className="space-y-3">

							{/* PAGE HEADER */}
							<PageHeader
								title={`Edit Laporan ${reportType === "penemuan"
									? "Penemuan"
									: "Kehilangan"
									}`}
							/>
						</div>
					</div>
					<div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
						<UpdateReportForm
							user={user}
							showToast={showToast}
						/>
					</div>
				</div>
			</div>
		</UserLayout>
	);
}
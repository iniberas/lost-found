import QRCode from "react-qr-code";
import { QrCode, X } from "lucide-react";

export default function ReportQrModal({
	open,
	onClose,
	reportId,
}) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
			<div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

				{/* HEADER */}
				<div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-blue-50">
							<QrCode size={20} className="text-blue-600" />
						</div>

						<div>
							<h2 className="text-lg font-bold text-gray-800">
								QR Handover
							</h2>

							<p className="text-sm text-gray-500">
								Tunjukkan QR ini ke admin
							</p>
						</div>
					</div>

					<button
						onClick={onClose}
						className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
					>
						<X size={20} className="text-gray-500" />
					</button>
				</div>

				{/* CONTENT */}
				<div className="p-8 flex flex-col items-center">
					<div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
						<QRCode
							value={String(reportId)}
							size={240}
						/>
					</div>

					<div className="mt-6 text-center">
						<p className="text-xs uppercase tracking-widest font-bold text-gray-400">
							REPORT ID
						</p>

							<p className="mt-2 text-xs sm:text-base md:text-md text-gray-600 break-all text-center">
								{reportId}
							</p>
					</div>
				</div>
			</div>
		</div>
	);
}
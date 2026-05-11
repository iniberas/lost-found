import React from "react";
import {
	X,
	MessageSquareText,
	CheckCircle2,
	XCircle,
	Send,
} from "lucide-react";

const ResponseMessageModal = ({
	isOpen,
	onClose,
	submitting,
	message,
	setMessage,
	handleSubmit,
	type = "approve",
}) => {
	if (!isOpen) return null;

	const isApprove = type === "approve";
	const isReject = type === "reject";

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
				{/* HEADER */}
				<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
					<h3 className="font-bold text-gray-900 flex items-center gap-2">
						{isApprove ? (
							<CheckCircle2
								size={18}
								className="text-green-600"
							/>
						) : (
							<XCircle
								size={18}
								className="text-red-600"
							/>
						)}

						{isApprove
							? "Approve Contact Request"
							: "Reject Contact Request"}
					</h3>

					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg transition"
					>
						<X size={18} />
					</button>
				</div>

				{/* CONTENT */}
				<div className="p-6 space-y-5">
					<div>
						<label className="block text-sm font-semibold mb-2">
							Message {isReject && <span className="text-red-500">*</span>}
						</label>

						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className={"w-full border rounded-xl p-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 border-gray-200 focus:ring-blue-500"}
							placeholder={
								isApprove
									? "Tambahkan pesan tambahan..."
									: "Berikan alasan penolakan..."
							}
							maxLength={1000}
						/>

						<div className="flex justify-between items-center mt-2">
							<p className="text-xs text-gray-400">
								{isApprove
									? "Pesan ini akan terlihat oleh requester."
									: "Bantu requester memahami alasan penolakan."}
							</p>

							<span className="text-xs text-gray-400">
								{message.length}/1000
							</span>
						</div>
					</div>

					<div
						className={`rounded-xl border p-4 ${isApprove
							? "bg-green-50 border-green-100"
							: "bg-red-50 border-red-100"
							}`}
					>
						<p
							className={`text-sm leading-relaxed ${isApprove
								? "text-green-800"
								: "text-red-800"
								}`}
						>
							{isApprove
								? "Requester akan dapat melihat informasi kontak Anda setelah request disetujui."
								: "Requester tidak akan dapat melihat informasi kontak Anda."}
						</p>
					</div>
				</div>

				{/* FOOTER */}
				<div className="p-4 border-t border-gray-100 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition"
					>
						Cancel
					</button>

					<button
						onClick={handleSubmit}
						disabled={submitting}
						className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2 transition ${isApprove
							? "bg-green-600 hover:bg-green-700"
							: "bg-red-600 hover:bg-red-700"
							}`}
					>
						<Send size={15} />

						{submitting
							? "Submitting..."
							: isApprove
								? "Approve"
								: "Reject"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ResponseMessageModal;